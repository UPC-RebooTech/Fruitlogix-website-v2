/**
 * FruitLogix — Main Application Entrypoint
 * RebooTech (UPC) 2026
 *
 * Implements:
 * - Dynamic i18n with instant ES/EN language switching (updates DOM text, attributes, SEO and meta tags)
 * - Light / Dark Theme toggle with persistent preference
 * - Progressive enhancement reveals with instant fallback (guaranteed visibility)
 * - Number counters with ease-out interpolation
 * - Interactive mouse parallax for Hero floating fruits (desktop only)
 * - Cursor-following glow effect on Segments cards
 * - Scroll-drawn progress line on the supply chain journey timeline
 * - Accessible mobile navigation drawer and active-section scroll spy
 * - Contact form validation with localized error messages and mailto fallback
 */

const SUPPORTED_LOCALES = ["es", "en"];
const DEFAULT_LOCALE = "es";
const STORAGE_LOCALE_KEY = "fruitlogix.locale";
const STORAGE_THEME_KEY = "fruitlogix.theme";

let activeLocale = DEFAULT_LOCALE;
let activeMessages = {};

// Helper: read nested object path safely (e.g. "seo.ogImage")
function readPath(object, path) {
  if (!object || !path) return undefined;
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function getMessage(path) {
  const value = readPath(activeMessages, path);
  return typeof value === "string" ? value : path;
}

function detectBrowserLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY);
    if (SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {}
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferred.some((lang) => lang?.toLowerCase().startsWith("es")) ? "es" : "en";
}

async function loadLocaleMessages(locale) {
  const candidatePaths = [
    `./assets/i18n/${locale}.json`,
    `./locales/${locale}.json`
  ];
  for (const path of candidatePaths) {
    try {
      const url = new URL(path, import.meta.url);
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) return await res.json();
    } catch {}
  }
  throw new Error(`Unable to fetch messages for locale: ${locale}`);
}

function updateDOMTranslations(messages) {
  // Update inner text
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const val = readPath(messages, el.dataset.i18n);
    if (typeof val === "string") el.textContent = val;
  });

  // Update attributes (e.g. alt, title, aria-label, content, placeholder)
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.trim().split(":");
      const val = key && readPath(messages, key.trim());
      if (attr && typeof val === "string") {
        el.setAttribute(attr.trim(), val);
      }
    });
  });

  // Dynamic OpenGraph & Twitter Meta updates
  const ogImage = document.querySelector('meta[property="og:image"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  const ogLocaleAlt = document.querySelector('meta[property="og:locale:alternate"]');

  const socialImgUrl = readPath(messages, "seo.ogImage");
  if (socialImgUrl) {
    if (ogImage) ogImage.content = socialImgUrl;
    if (twitterImage) twitterImage.content = socialImgUrl;
  }

  const titleVal = readPath(messages, "seo.ogTitle") ?? readPath(messages, "seo.title");
  if (titleVal) {
    if (ogTitle) ogTitle.content = titleVal;
    if (twitterTitle) twitterTitle.content = titleVal;
  }

  const descVal = readPath(messages, "seo.ogDescription") ?? readPath(messages, "seo.description");
  if (descVal) {
    if (ogDesc) ogDesc.content = descVal;
    if (twitterDesc) twitterDesc.content = descVal;
  }

  if (ogLocale) {
    const localeVal = readPath(messages, "seo.ogLocale");
    if (localeVal) ogLocale.content = localeVal;
  }
  if (ogLocaleAlt) {
    const localeAltVal = readPath(messages, "seo.ogLocaleAlt");
    if (localeAltVal) ogLocaleAlt.content = localeAltVal;
  }

  // Organization Schema LD+JSON
  const schemaEl = document.getElementById("organizationSchema");
  if (schemaEl && messages.organization) {
    schemaEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: messages.organization.name || "RebooTech",
      url: "https://github.com/UPC-RebooTech",
      description: messages.organization.description || "",
      foundingLocation: { "@type": "Place", name: messages.organization.place || "Lima, Perú" },
      memberOf: { "@type": "Organization", name: messages.organization.institution || "UPC" },
      sameAs: ["https://github.com/UPC-RebooTech"]
    });
  }
}

function updateLanguageSwitchButtons(locale) {
  document.querySelectorAll("[data-lang-choice]").forEach((btn) => {
    const selected = btn.dataset.langChoice === locale;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-pressed", String(selected));
  });
}

export async function setLocale(targetLocale) {
  const chosen = SUPPORTED_LOCALES.includes(targetLocale) ? targetLocale : DEFAULT_LOCALE;
  try {
    const messages = await loadLocaleMessages(chosen);
    activeLocale = chosen;
    activeMessages = messages;
    document.documentElement.lang = chosen;
    document.title = readPath(messages, "seo.title") || "FruitLogix";
    updateDOMTranslations(messages);
    updateLanguageSwitchButtons(chosen);

    try {
      localStorage.setItem(STORAGE_LOCALE_KEY, chosen);
    } catch {}

    const notice = document.getElementById("locale-notice");
    if (notice) notice.hidden = true;

    document.dispatchEvent(new CustomEvent("fruitlogix:locale", { detail: { locale: chosen, messages } }));
  } catch (err) {
    console.warn("FruitLogix locale load failed; retaining active locale.", err);
  }
}

/* ── Interactive Features ── */

function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (!saved && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, next);
    } catch {}
  });
}

function initHeader() {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById("primary-navigation");
  const mobileMedia = window.matchMedia("(max-width: 860px)");

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggleMenu = (open) => {
    if (!nav) return;
    const isOpen = open !== undefined ? open : !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", isOpen);
    menuButton?.setAttribute("aria-expanded", String(isOpen));
  };

  menuButton?.addEventListener("click", () => toggleMenu());
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleMenu(false);
  });
}

function initScrollSpy() {
  const links = [...document.querySelectorAll("[data-nav-link]")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.6] });

  sections.forEach((sec) => observer.observe(sec));
}

function initReveals() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  // Reduced motion or no IntersectionObserver: reveal immediately
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  items.forEach((item) => observer.observe(item));

  // Safety fallback timeout: ensures all cards show even on odd viewports
  setTimeout(() => {
    items.forEach((item) => item.classList.add("is-visible"));
  }, 1200);
}

function initCounters() {
  const counters = [...document.querySelectorAll("[data-countup]")];
  if (!counters.length) return;

  const animateCounter = (el) => {
    if (el.dataset.animated === "true") return;
    const target = parseInt(el.textContent.trim(), 10);
    if (!Number.isFinite(target)) return;
    el.dataset.animated = "true";
    const duration = 850;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const obs = new IntersectionObserver((entries, currentObs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        currentObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => obs.observe(c));
}

function initHeroParallax() {
  const burst = document.getElementById("hero-fruit-burst");
  const hero = document.getElementById("home");
  if (!burst || !hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  hero.addEventListener("mousemove", (e) => {
    if (window.innerWidth < 900) return;
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    burst.style.transform = `translate(calc(-50% + ${x * 24}px), calc(-50% + ${y * 24}px))`;
  }, { passive: true });

  hero.addEventListener("mouseleave", () => {
    burst.style.transform = "translate(-50%, -50%)";
  }, { passive: true });
}

function initSegmentsGlow() {
  const cards = document.querySelectorAll(".seg-card");
  cards.forEach((card) => {
    const glow = card.querySelector(".seg-card__glow-cursor");
    if (!glow) return;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    }, { passive: true });
  });
}

function initJourneyScrollLine() {
  const flow = document.getElementById("journey-flow");
  const line = document.getElementById("journey-line");
  if (!flow || !line) return;

  const updateLine = () => {
    const rect = flow.getBoundingClientRect();
    const windowH = window.innerHeight;
    if (rect.top > windowH || rect.bottom < 0) return;
    const progress = Math.max(0, Math.min(1, (windowH * 0.7 - rect.top) / (rect.height * 0.8)));
    line.style.setProperty("--flow-progress", `${Math.round(progress * 100)}%`);
  };

  window.addEventListener("scroll", updateLine, { passive: true });
  updateLine();
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const statusEl = document.getElementById("form-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const interest = form.interest.value;
    const message = form.message.value.trim();

    const nameErr = document.getElementById("name-error");
    const emailErr = document.getElementById("email-error");
    const interestErr = document.getElementById("interest-error");
    const msgErr = document.getElementById("message-error");

    let valid = true;
    if (!name || name.length < 2) {
      if (nameErr) nameErr.textContent = getMessage("validation.nameRequired");
      valid = false;
    } else if (nameErr) { nameErr.textContent = ""; }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailErr) emailErr.textContent = getMessage("validation.emailRequired");
      valid = false;
    } else if (emailErr) { emailErr.textContent = ""; }

    if (!interest) {
      if (interestErr) interestErr.textContent = getMessage("validation.interestRequired");
      valid = false;
    } else if (interestErr) { interestErr.textContent = ""; }

    if (!message || message.length < 15) {
      if (msgErr) msgErr.textContent = getMessage("validation.messageTooShort");
      valid = false;
    } else if (msgErr) { msgErr.textContent = ""; }

    if (!valid) return;

    // Mailto fallback
    const mailtoSubject = encodeURIComponent(`Consulta FruitLogix: ${interest} - ${name}`);
    const mailtoBody = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\nTipo: ${interest}\n\nMensaje:\n${message}`);
    window.location.href = `mailto:contacto@rebootech.pe?subject=${mailtoSubject}&body=${mailtoBody}`;

    if (statusEl) {
      statusEl.textContent = getMessage("validation.sent");
      statusEl.className = "form-status is-success";
    }
    form.reset();
  });
}

// Global initialization
async function initApp() {
  // 1. Language buttons click binding
  document.addEventListener("click", (e) => {
    const choice = e.target.closest("[data-lang-choice]");
    if (choice) {
      void setLocale(choice.dataset.langChoice);
    }
  });

  // 2. Initialize i18n
  await setLocale(detectBrowserLocale());

  // 3. Initialize interactive UI components
  initTheme();
  initHeader();
  initScrollSpy();
  initReveals();
  initCounters();
  initHeroParallax();
  initSegmentsGlow();
  initJourneyScrollLine();
  initContactForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  void initApp();
}
