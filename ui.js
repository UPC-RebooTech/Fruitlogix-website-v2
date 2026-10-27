const CONTACT_EMAIL = "contacto@rebootech.pe"; // Reemplazar cuando RebooTech confirme el correo definitivo.

export function initUI(t) {
  initTheme();
  initHeader(t);
  initScrollSpy();
  initReveals();
  initCounters();
  initStorePreference();
  initTeamPhotos();
  initContactForm(t);
}

function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  const STORAGE_THEME = "fruitlogix.theme";
  const saved = localStorage.getItem(STORAGE_THEME);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = saved || (prefersDark ? "dark" : "light");
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_THEME, nextTheme);
    } catch {}
  });
}

function initHeader(t) {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById("primary-navigation");
  const mobileMenu = window.matchMedia("(max-width: 860px)");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const syncNavigation = (expanded = false) => {
    if (!nav) return;
    if (mobileMenu.matches && !expanded) {
      nav.inert = true;
      nav.setAttribute("aria-hidden", "true");
      nav.classList.remove("is-open");
      return;
    }
    nav.inert = false;
    nav.removeAttribute("aria-hidden");
    if (mobileMenu.matches) nav.classList.add("is-open");
    else nav.classList.remove("is-open");
  };

  const setExpanded = (expanded) => {
    menuButton?.setAttribute("aria-expanded", String(expanded));
    menuButton?.setAttribute("aria-label", t(expanded ? "header.menuClose" : "header.menuOpen"));
    syncNavigation(expanded);
  };

  const closeMenu = () => setExpanded(false);
  syncNavigation(false);
  menuButton?.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    setExpanded(!expanded);
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  mobileMenu.addEventListener?.("change", closeMenu);
  document.addEventListener("fruitlogix:locale", () => {
    const expanded = menuButton?.getAttribute("aria-expanded") === "true";
    menuButton?.setAttribute("aria-label", t(expanded ? "header.menuClose" : "header.menuOpen"));
  });
}

function initScrollSpy() {
  const links = [...document.querySelectorAll("[data-nav-link]")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-26% 0px -62% 0px", threshold: [0, .15, .35, .65] });
  sections.forEach((section) => observer.observe(section));
}

function initReveals() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -30px 0px" });
  items.forEach((item) => observer.observe(item));
}

function initCounters() {
  const counters = [...document.querySelectorAll("[data-countup]")];
  if (!counters.length) return;
  const animate = (element) => {
    if (element.dataset.animated === "true") return;
    const target = Number.parseInt(element.textContent.trim(), 10);
    if (!Number.isFinite(target)) return;
    element.dataset.animated = "true";
    const duration = 850;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    counters.forEach((element) => {
      const target = Number.parseInt(element.textContent.trim(), 10);
      if (Number.isFinite(target)) {
        element.textContent = String(target);
        element.dataset.animated = "true";
      }
    });
    return;
  }
  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .5 });
  counters.forEach((counter) => observer.observe(counter));
}

function initStorePreference() {
  const stores = [...document.querySelectorAll("[data-store]")];
  const userAgent = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const mobileViewport = window.matchMedia("(max-width: 860px)");
  const update = () => {
    const preferred = mobileViewport.matches ? (isIOS ? "apple" : isAndroid ? "google" : "") : "";
    stores.forEach((store) => store.classList.toggle("is-platform-primary", Boolean(preferred && store.dataset.store === preferred)));
  };
  update();
  mobileViewport.addEventListener?.("change", update);
}

function initTeamPhotos() {
  document.querySelectorAll(".team-card__photo[data-photo]").forEach((image) => {
    const source = image.dataset.photo?.trim();
    if (!source) return;
    image.src = source;
    image.hidden = false;
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
  });
}

function initContactForm(t) {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const fields = {
    name: form.elements.namedItem("name"),
    email: form.elements.namedItem("email"),
    interest: form.elements.namedItem("interest"),
    message: form.elements.namedItem("message")
  };
  const status = document.getElementById("form-status");
  const submit = form.querySelector('[type="submit"]');
  const errorIds = { name: "name-error", email: "email-error", interest: "interest-error", message: "message-error" };
  const touched = new Set();

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  const fieldError = (key, field) => {
    const value = field.value.trim();
    if (key === "name") {
      if (!value) return "validation.nameRequired";
      if (value.length < 2) return "validation.nameTooShort";
    }
    if (key === "email") {
      if (!value) return "validation.emailRequired";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "validation.emailInvalid";
    }
    if (key === "interest" && !value) return "validation.interestRequired";
    if (key === "message") {
      if (!value) return "validation.messageRequired";
      if (value.length < 15) return "validation.messageTooShort";
    }
    return "";
  };

  const validate = (key) => {
    const field = fields[key];
    const messageKey = fieldError(key, field);
    const errorElement = document.getElementById(errorIds[key]);
    field.setAttribute("aria-invalid", String(Boolean(messageKey)));
    if (messageKey) field.setAttribute("aria-describedby", errorIds[key]);
    else field.removeAttribute("aria-describedby");
    errorElement.textContent = messageKey ? t(messageKey) : "";
    return !messageKey;
  };

  Object.entries(fields).forEach(([key, field]) => {
    field.addEventListener("blur", () => { touched.add(key); validate(key); });
    field.addEventListener(key === "interest" ? "change" : "input", () => {
      if (touched.has(key) || field.getAttribute("aria-invalid") === "true") validate(key);
      if (status.textContent) setStatus("");
    });
  });

  document.addEventListener("fruitlogix:locale", () => {
    Object.entries(fields).forEach(([key, field]) => {
      if (field.getAttribute("aria-invalid") === "true") validate(key);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const invalid = Object.keys(fields).filter((key) => !validate(key));
    if (invalid.length) {
      touched.clear();
      invalid.forEach((key) => touched.add(key));
      fields[invalid[0]].focus();
      setStatus("");
      return;
    }

    const endpoint = form.dataset.endpoint.trim();
    submit.disabled = true;
    setStatus(t("validation.sending"));
    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Contact endpoint returned an error");
        setStatus(t("validation.sent"));
        form.reset();
      } else {
        const data = new FormData(form);
        const subject = t("contact.mailtoSubject");
        const body = [
          `${form.querySelector('[for="contact-name"]').textContent}: ${data.get("name")}`,
          `${form.querySelector('[for="contact-email"]').textContent}: ${data.get("email")}`,
          `${form.querySelector('[for="contact-interest"]').textContent}: ${fields.interest.selectedOptions[0].textContent}`,
          `${form.querySelector('[for="contact-message"]').textContent}: ${data.get("message")}`
        ].join("\n\n");
        const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        setStatus(t("validation.mailto"));
        form.reset();
      }
      touched.clear();
      Object.values(fields).forEach((field) => {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      });
      Object.values(errorIds).forEach((id) => { document.getElementById(id).textContent = ""; });
    } catch (error) {
      console.error("FruitLogix contact form submission failed.", error);
      setStatus(endpoint ? t("validation.endpointError") : t("validation.networkError"), true);
    } finally {
      submit.disabled = false;
    }
  });
}
