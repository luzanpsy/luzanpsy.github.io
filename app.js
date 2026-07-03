const content = window.siteContent;

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setTextAndLinks() {
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
  nav.innerHTML = content.navigation
    .map(([id, label]) => `<a href="#${id}" data-section-link="${id}">${label}</a>`)
    .join("");
}

function renderManifest() {
  qs("[data-manifest-title]").textContent = content.manifest.title;
  qs("[data-manifest-text]").innerHTML = content.manifest.paragraphs.map((text) => `<p>${text}</p>`).join("");
}

function renderQuiz() {
  const quiz = qs("[data-quiz]");
  if (!quiz || !content.quiz?.questions?.length) return;

  const answers = new Array(content.quiz.questions.length).fill(null);
  let current = 0;

  const getResultText = () => {
    if (answers.includes(-2)) return content.quiz.resultCare;
    const score = answers.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    return score >= 5 ? content.quiz.resultStrong : content.quiz.resultSoft;
  };

  const renderStep = () => {
    const question = content.quiz.questions[current];
    const isLast = current === content.quiz.questions.length - 1;
    quiz.innerHTML = `
      <div class="quiz-progress" aria-label="Вопрос ${current + 1} из ${content.quiz.questions.length}">
        <span style="width: ${((current + 1) / content.quiz.questions.length) * 100}%"></span>
      </div>
      <p class="quiz-count">Вопрос ${current + 1} / ${content.quiz.questions.length}</p>
      <h3>${question.text}</h3>
      <div class="quiz-options">
        ${question.answers
          .map(
            ([label, value]) => `
              <button class="quiz-option ${answers[current] === value ? "is-selected" : ""}" type="button" data-value="${value}">
                ${label}
              </button>`
          )
          .join("")}
      </div>
      <div class="quiz-actions">
        <button class="button button-light" type="button" data-quiz-back ${current === 0 ? "disabled" : ""}>Назад</button>
        <button class="button button-dark" type="button" data-quiz-next ${answers[current] === null ? "disabled" : ""}>${isLast ? "Показать результат" : "Дальше"}</button>
      </div>`;

    qsa("[data-value]", quiz).forEach((button) => {
      button.addEventListener("click", () => {
        answers[current] = Number(button.dataset.value);
        renderStep();
      });
    });

    qs("[data-quiz-back]", quiz).addEventListener("click", () => {
      current = Math.max(0, current - 1);
      renderStep();
    });

    qs("[data-quiz-next]", quiz).addEventListener("click", () => {
      if (answers[current] === null) return;
      if (isLast) {
        renderResult();
        return;
      }
      current += 1;
      renderStep();
    });
  };

  const renderResult = () => {
    quiz.innerHTML = `
      <div class="quiz-result">
        <p class="eyebrow">Результат</p>
        <h3>${getResultText()}</h3>
        <p>Если откликается, заполните форму записи. На первой встрече можно спокойно проверить, насколько вам подходит мой темп, стиль и способ быть в контакте.</p>
        <div class="quiz-actions">
          <a class="button button-dark" href="${content.links.booking}" target="_blank" rel="noopener">Заполнить форму для записи</a>
          <button class="button button-light" type="button" data-quiz-restart>Пройти еще раз</button>
        </div>
      </div>`;

    qs("[data-quiz-restart]", quiz).addEventListener("click", () => {
      answers.fill(null);
      current = 0;
      renderStep();
    });
  };

  renderStep();
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
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z"/><path d="M8 7h8"/></svg>'
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
  return Math.max(0, Math.floor((today - start) / 86400000));
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
    .map(
      (item) => `
        <article class="stat-card reveal">
          <span class="stat-icon">${statIcon(item.icon)}</span>
          <strong class="stat-value" data-count="${item.computedValue}" data-suffix="${item.suffix || ""}">${item.computedValue}${item.suffix || ""}</strong>
          <span class="stat-label">${item.label}</span>
          <p>${item.note}</p>
        </article>`
    )
    .join("");
}

function renderCards() {
  qs("[data-work-intro]").textContent = content.workIntro;
  qs("[data-work]").innerHTML = content.workWith
    .map(
      ([title, text, image]) => `
        <article class="work-card reveal" tabindex="0">
          <img class="work-card-image" src="${image}" alt="" loading="lazy" decoding="async">
          <div class="work-card-overlay">
            <h3>${title}</h3>
            <p>${text}</p>
          </div>
        </article>`
    )
    .join("");

  qs("[data-not-for-me]").innerHTML = content.notForMe.map((item) => `<li>${item}</li>`).join("");

  qs("[data-values]").innerHTML = content.values
    .map(
      ([title, text]) => `
        <article class="value-card reveal">
          <h3>${title}</h3>
          <p>${text}</p>
        </article>`
    )
    .join("");

  qs("[data-approach]").innerHTML = content.approachCards
    .map(
      ([title, text]) => `
        <article class="approach-card reveal">
          <h3>${title}</h3>
          <p>${text}</p>
        </article>`
    )
    .join("");

  qs("[data-prices]").innerHTML = content.prices
    .map(
      ([title, duration, price, note]) => `
        <article class="price-card reveal">
          <span>${duration}</span>
          <h3>${title}</h3>
          <p>${note}</p>
          <strong>${price}</strong>
          <a class="text-link" href="${content.links.booking}" target="_blank" rel="noopener">Записаться</a>
        </article>`
    )
    .join("");

  qs("[data-confidentiality]").innerHTML = content.confidentiality
    .map((text, index) => {
      if (index === 1) {
        return `
          <a class="quiet-card quiet-card-link reveal" href="${content.links.instagram}" target="_blank" rel="noopener" aria-label="Открыть Instagram Сергея Лузана">
            <p>${text}</p>
          </a>`;
      }

      if (index === 2) {
        return `
          <a class="quiet-card quiet-card-link reveal" href="${content.links.telegramChannel}" target="_blank" rel="noopener" aria-label="Открыть Telegram-канал Сергея Лузана">
            <p>${text}</p>
          </a>`;
      }

      return `<article class="quiet-card reveal"><p>${text}</p></article>`;
    })
    .join("");
}

function renderFeaturedQuote() {
  qs("[data-featured-quote]").textContent = `«${content.featuredQuote.text}»`;
  qs("[data-featured-note]").textContent = content.featuredQuote.note;
}

function renderAbout() {
  qs("[data-about-lead]").textContent = content.about.lead;
  qs("[data-about-paragraphs]").innerHTML = content.about.paragraphs.map((text) => `<p>${text}</p>`).join("");
  qs("[data-about-facts]").innerHTML = content.about.facts.map((item) => `<span>${item}</span>`).join("");
  qs("[data-about-education]").innerHTML = content.about.education
    .map(
      ([title, text]) => `
        <article>
          <strong>${title}</strong>
          <p>${text}</p>
        </article>`
    )
    .join("");
}

function renderProcess() {
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
}

function renderQuotes() {
  qs("[data-quotes]").innerHTML = content.quotes
    .map(
      ({ text, source }) => `
        <article class="quote-card reveal">
          <blockquote>«${text}»</blockquote>
          <p>${source}</p>
        </article>`
    )
    .join("");
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

function renderContact() {
  qs("[data-contact-title]").textContent = content.contact.title;
  qs("[data-contact-text]").textContent = content.contact.text;
}

function bindScrollEffects() {
  const header = qs("[data-header]");
  const ambientQuotes = qs("[data-ambient-quotes]");
  const scrollPortrait = qs("[data-scroll-portrait]");
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
    if (ambientQuotes) {
      ambientQuotes.style.setProperty("--ambient-shift", `${Math.round(window.scrollY * -0.38)}px`);
    }
    if (scrollPortrait) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollRatio = window.scrollY / maxScroll;
      const portraitProgress = Math.min(1, Math.max(0, (scrollRatio - 0.28) / 0.58));
      scrollPortrait.style.setProperty("--portrait-progress", portraitProgress.toFixed(3));
    }
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px" }
  );
  qsa(".reveal").forEach((node) => revealObserver.observe(node));

  const navLinks = qsa("[data-section-link]");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.sectionLink === entry.target.id));
      });
    },
    { threshold: 0.28 }
  );
  navLinks.forEach((link) => {
    const section = qs(`#${link.dataset.sectionLink}`);
    if (section) sectionObserver.observe(section);
  });
}

function bindMenu() {
  const button = qs("[data-menu-toggle]");
  const nav = qs("[data-nav]");
  button.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-expanded", "false");
  });
}

function bindFormEmbed() {
  const frame = qs("[data-form-embed]");
  if (frame) frame.src = content.links.bookingEmbed;
}

setTextAndLinks();
renderNavigation();
renderManifest();
renderQuiz();
renderStats();
renderCards();
renderFeaturedQuote();
renderAbout();
renderProcess();
renderQuotes();
renderFaq();
renderContact();
bindScrollEffects();
bindMenu();
bindFormEmbed();
