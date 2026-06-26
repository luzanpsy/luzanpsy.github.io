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
  nav.innerHTML = content.navigation
    .map(([id, label]) => `<a href="#${id}" data-section-link="${id}">${label}</a>`)
    .join("");
}

function renderCards() {
  qs("[data-work]").innerHTML = content.workWith.map((item) => `<article class="work-card reveal">${item}</article>`).join("");

  qs("[data-prices]").innerHTML = content.prices
    .map(
      ([title, price, note]) => `
        <article class="price-card reveal">
          <h3>${title}</h3>
          <p>${note}</p>
          <strong>${price}</strong>
        </article>`
    )
    .join("");

  qs("[data-reviews]").innerHTML = content.reviewNotes
    .map((text) => `<article class="review-card"><p>${text}</p></article>`)
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

setText();
renderNavigation();
renderCards();
renderAbout();
renderProcessAndApproach();
renderFaq();
bindScrollEffects();
bindSlider();
