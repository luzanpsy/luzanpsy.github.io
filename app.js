const content = window.siteContent;

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setText() {
  qsa("[data-text]").forEach((node) => {
    node.textContent = content.person[node.dataset.text] || "";
  });
  qsa("[data-link]").forEach((node) => {
    const href = content.links[node.dataset.link];
    if (href) node.href = href;
  });
}

function renderNavigation() {
  const nav = qs("[data-nav]");
  const hasStats = content.stats?.some((item) => Number.isFinite(getStatValue(item)));
  nav.innerHTML = content.navigation
    .filter(([id]) => id !== "stats" || hasStats)
    .map(([id, label]) => `<a href="#${id}" data-section-link="${id}">${label}</a>`)
    .join("");
}

function renderCards() {
  qs("[data-work-intro]").textContent = content.workIntro;
  qs("[data-work]").innerHTML = content.workWith.map((item) => `<article class="work-card reveal">${item}</article>`).join("");
  qs("[data-not-for-me]").innerHTML = content.notForMe.map((item) => `<li>${item}</li>`).join("");

  qs("[data-prices]").innerHTML = content.prices
    .map(
      ([title, price, note]) => `
        <article class="price-card reveal">
          <h3>${title}</h3>
          <p>${note}</p>
          <strong>${price}</strong>
          <a class="text-link" href="${content.links.booking}" target="_blank" rel="noopener">Записаться</a>
        </article>`
    )
    .join("");

  qs("[data-reviews]").innerHTML = content.reviewNotes
    .map((text) => `<article class="review-card"><p>${text}</p></article>`)
    .join("");
}

function statIcon(type) {
  const icons = {
    clients:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2 21a6 6 0 0 1 12 0"/><path d="M17 10a3 3 0 1 0 0-6"/><path d="M17 14a5 5 0 0 1 5 5"/></svg>',
    sessions:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-5 4v-4.5A2.5 2.5 0 0 1 2 13.1V5.5Z"/><path d="M7 8h10"/><path d="M7 12h6"/></svg>',
    therapy:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.8-8-11.2A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8 3.8C20 16.2 12 21 12 21Z"/><path d="M12 6v15"/></svg>',
    study:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z"/><path d="M8 7h8"/></svg>',
    practice:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M7 8l-4 7h8L7 8Z"/><path d="M17 8l-4 7h8l-4-7Z"/></svg>'
  };
  return icons[type] || icons.sessions;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysSince(dateString) {
  const start = parseLocalDate(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((today - start) / millisecondsInDay));
}

function monthsSince(dateString) {
  const start = parseLocalDate(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let months = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function getStatValue(item) {
  if (Number.isFinite(item.value)) return item.value;
  if (!item.value || typeof item.value !== "object") return null;

  if (Number.isFinite(item.value.base) && item.value.baseDate && item.value.incrementEveryMonths) {
    const periods = Math.floor(monthsSince(item.value.baseDate) / item.value.incrementEveryMonths);
    return item.value.base + periods * (item.value.incrementBy || 1);
  }

  if (item.value.startDate && item.value.incrementEveryDays) {
    return Math.floor(daysSince(item.value.startDate) / item.value.incrementEveryDays);
  }

  if (Number.isFinite(item.value.base) && item.value.baseDate && item.value.incrementEveryDays) {
    return item.value.base + Math.floor(daysSince(item.value.baseDate) / item.value.incrementEveryDays);
  }

  return null;
}

function renderStats() {
  const statsSection = qs("#stats");
  const realStats = content.stats
    .map((item) => ({ ...item, computedValue: getStatValue(item) }))
    .filter((item) => Number.isFinite(item.computedValue));
  if (!realStats.length) {
    statsSection.hidden = true;
    return;
  }

  statsSection.hidden = false;
  qs("[data-stats]").innerHTML = realStats
    .map((item) => {
      const hasValue = Number.isFinite(item.computedValue);
      const display = hasValue ? `${item.computedValue}${item.suffix || ""}` : "—";
      const valueAttr = hasValue ? ` data-count="${item.computedValue}" data-suffix="${item.suffix || ""}"` : "";
      return `
        <article class="stat-card reveal">
          <span class="stat-icon">${statIcon(item.icon)}</span>
          <strong class="stat-value"${valueAttr}>${display}${hasValue ? "" : ""}</strong>
          <span class="stat-label">${item.label}</span>
          <p>${item.note}</p>
        </article>`;
    })
    .join("");
}

function renderAbout() {
  qs("[data-about-lead]").textContent = content.about.lead;
  qs("[data-about-paragraphs]").innerHTML = content.about.paragraphs.map((text) => `<p>${text}</p>`).join("");
  qs("[data-about-facts]").innerHTML = content.about.facts.map((item) => `<span>${item}</span>`).join("");
}

function renderProcessAndApproach() {
  qs("[data-process]").innerHTML = content.process
    .map(
      ([num, title, text]) => `
        <article class="timeline-item reveal">
          <span class="timeline-num">${num}</span>
          <h3>${title}</h3>
          <p>${text}</p>
        </article>`
    )
    .join("");

  qs("[data-meeting-facts]").innerHTML = content.meetingFacts
    .map(
      ([title, text]) => `
        <article>
          <span>${title}</span>
          <strong>${text}</strong>
        </article>`
    )
    .join("");

  qs("[data-approach]").innerHTML = content.approach.map((item) => `<span>${item}</span>`).join("");
}

function renderFaq() {
  qs("[data-faq]").innerHTML = content.faq
    .map(
      ([question, answer], index) => `
        <article class="faq-item ${index === 0 ? "is-open" : ""}">
          <button class="faq-question" type="button" aria-expanded="${index === 0}">
            <span>${question}</span>
            <span aria-hidden="true">+</span>
          </button>
          <div class="faq-answer">
            <p>${answer}</p>
          </div>
        </article>`
    )
    .join("");

  qsa(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

function bindScrollEffects() {
  const header = qs("[data-header]");
  const floatingAction = qs(".floating-action");
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
    floatingAction.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.62);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px" }
  );
  qsa(".reveal").forEach((node) => revealObserver.observe(node));

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const valueNode = entry.target;
        const target = Number(valueNode.dataset.count);
        const suffix = valueNode.dataset.suffix || "";
        valueNode.textContent = `${target}${suffix}`;
        countObserver.unobserve(valueNode);
      });
    },
    { threshold: 0.6 }
  );
  qsa("[data-count]").forEach((node) => countObserver.observe(node));

  const navLinks = qsa("[data-section-link]");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.sectionLink === entry.target.id));
      });
    },
    { threshold: 0.35 }
  );
  navLinks.forEach((link) => {
    const section = qs(`#${link.dataset.sectionLink}`);
    if (section) sectionObserver.observe(section);
  });
}

function bindSlider() {
  const track = qs("[data-reviews]");
  qsa("[data-slide]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.slide === "next" ? 1 : -1;
      track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
    });
  });
}

function bindFormEmbed() {
  const frame = qs("[data-form-embed]");
  if (frame) frame.src = content.links.bookingEmbed;
}

setText();
renderNavigation();
renderCards();
renderStats();
renderAbout();
renderProcessAndApproach();
renderFaq();
bindScrollEffects();
bindSlider();
bindFormEmbed();
