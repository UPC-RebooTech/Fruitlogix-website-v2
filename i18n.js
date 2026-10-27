const SUPPORTED_LOCALES = ["es", "en"];
const DEFAULT_LOCALE = "es";
const STORAGE_KEY = "fruitlogix.locale";

let activeLocale = DEFAULT_LOCALE;
let activeMessages = {};

function readPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function getMessage(path) {
  const value = readPath(activeMessages, path);
  return typeof value === "string" ? value : path;
}

function browserLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferred.some((language) => language?.toLowerCase().startsWith("es")) ? "es" : "en";
}

async function fetchMessages(locale) {
  const paths = [
    `./locales/${locale}.json`,
    `./assets/i18n/${locale}.json`
  ];
  for (const path of paths) {
    try {
      const url = new URL(path, import.meta.url);
      const response = await fetch(url, { cache: "no-cache" });
      if (response.ok) return await response.json();
    } catch {}
  }
  throw new Error(`Locale ${locale} could not be loaded from any known path`);
}

function updateTextAndAttributes(messages) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = readPath(messages, element.dataset.i18n);
    if (typeof value === "string") element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(",").forEach((rule) => {
      const [attribute, key] = rule.trim().split(":");
      const value = key && readPath(messages, key.trim());
      if (attribute && typeof value === "string") element.setAttribute(attribute.trim(), value);
    });
  });

  const schema = document.getElementById("organizationSchema");
  if (schema) {
    const organization = messages.organization ?? {};
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: organization.name ?? "RebooTech",
      url: "https://github.com/UPC-RebooTech",
      description: organization.description ?? "",
      foundingLocation: { "@type": "Place", name: organization.place ?? "Lima, Peru" },
      memberOf: { "@type": "Organization", name: organization.institution ?? "UPC" },
      sameAs: ["https://github.com/UPC-RebooTech"]
    });
  }

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterTitle) twitterTitle.content = readPath(messages, "seo.ogTitle") ?? readPath(messages, "seo.title") ?? "FruitLogix";
  if (twitterDescription) twitterDescription.content = readPath(messages, "seo.ogDescription") ?? readPath(messages, "seo.description") ?? "";
}

function markSelectedLocale(locale) {
  document.querySelectorAll("[data-lang-choice]").forEach((button) => {
    const selected = button.dataset.langChoice === locale;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function persistLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Continue for this session if storage is unavailable.
  }
}

function commitLocale(locale, messages, showFallbackNotice = false) {
  activeLocale = locale;
  activeMessages = messages;
  document.documentElement.lang = locale;
  document.title = readPath(messages, "seo.title") ?? "FruitLogix";
  updateTextAndAttributes(messages);
  markSelectedLocale(locale);
  const notice = document.getElementById("locale-notice");
  if (notice) notice.hidden = !showFallbackNotice;
  document.dispatchEvent(new CustomEvent("fruitlogix:locale", { detail: { locale, messages } }));
}

export async function setLocale(locale, { explicit = false } = {}) {
  const requested = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  try {
    const messages = await fetchMessages(requested);
    persistLocale(requested);
    commitLocale(requested, messages, false);
    return requested;
  } catch (error) {
    console.warn("FruitLogix locale could not be loaded; falling back to Spanish.", error);
    if (requested === DEFAULT_LOCALE) {
      const notice = document.getElementById("locale-notice");
      if (notice) {
        notice.textContent = "No se pudo cargar el archivo de idioma. Recarga la página o revisa los archivos locales.";
        notice.hidden = false;
      }
      return activeLocale;
    }
    try {
      const fallbackMessages = await fetchMessages(DEFAULT_LOCALE);
      persistLocale(DEFAULT_LOCALE);
      commitLocale(DEFAULT_LOCALE, fallbackMessages, true);
      return DEFAULT_LOCALE;
    } catch (fallbackError) {
      console.error("FruitLogix Spanish fallback is unavailable.", fallbackError);
      const notice = document.getElementById("locale-notice");
      if (notice) {
        notice.textContent = "No se pudieron cargar las traducciones. Revisa los archivos locales.";
        notice.hidden = false;
      }
      return activeLocale;
    }
  }
}

export async function initI18n() {
  document.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-lang-choice]");
    if (choice) void setLocale(choice.dataset.langChoice, { explicit: true });
  });
  await setLocale(browserLocale());
}

export function getActiveLocale() {
  return activeLocale;
}
