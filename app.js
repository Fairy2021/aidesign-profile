(function () {
  const data = window.PORTFOLIO_DATA || { profile: {}, categories: [], works: [] };
  const profile = data.profile || {};
  let activeCategory = "all";

  const $ = (selector) => document.querySelector(selector);
  const categoryNav = $("#categoryNav");
  const filterTabs = $("#filterTabs");
  const worksGrid = $("#worksGrid");
  const emptyState = $("#emptyState");

  function setText(selector, value) {
    const node = $(selector);
    if (node && value) node.textContent = value;
  }

  function renderProfile() {
    setText("#profileName", profile.name || "你的名字");
    setText("#profileIntro", profile.intro || "一个用于展示图片作品、项目说明与分类归档的作品集网页。");
    setText("#heroEyebrow", profile.eyebrow || "Selected Works");
    setText("#footerText", profile.footer || "© Portfolio");

    const meta = $("#profileMeta");
    const items = profile.meta || {};
    meta.innerHTML = Object.entries(items)
      .filter(([, value]) => value)
      .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
      .join("");

    const heroImages = profile.heroImages || [];
    const heroVisual = $("#heroVisual");
    heroVisual.innerHTML = heroImages.length
      ? heroImages
          .slice(0, 2)
          .map(
            (image, index) =>
              `<img class="hero-image hero-image-${index + 1}" src="${image}" alt="${escapeHtml(profile.name || "作品集视觉")}" />`,
          )
          .join("")
      : `<div class="hero-placeholder"><span>Portfolio</span></div>`;
  }

  function renderCategoryNav() {
    categoryNav.innerHTML = data.categories
      .map((category) => `<a href="#${category.slug}">${escapeHtml(category.name)}</a>`)
      .join("");

    const tabs = [{ name: "全部", slug: "all" }, ...data.categories];
    filterTabs.innerHTML = tabs
      .map(
        (category) =>
          `<button type="button" role="tab" data-category="${category.slug}" class="${category.slug === activeCategory ? "is-active" : ""}">${escapeHtml(category.name)}</button>`,
      )
      .join("");

    filterTabs.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        renderCategoryNav();
        renderWorks();
      });
    });
  }

  function renderWorks() {
    const works =
      activeCategory === "all"
        ? data.works
        : data.works.filter((work) => work.categorySlug === activeCategory);

    emptyState.hidden = data.works.length > 0;
    worksGrid.innerHTML =
      activeCategory === "all" ? renderCategorySections(works) : renderSingleCategory(works);
  }

  function renderSingleCategory(works) {
    const category = data.categories.find((item) => item.slug === activeCategory);
    if (!category) return renderMasonry(works);

    return `
      <section class="category-section" id="${category.slug}">
        <div class="category-heading">
          <p class="section-kicker">${escapeHtml(category.name)}</p>
          <h3>${escapeHtml(category.name)}</h3>
          ${category.description ? `<div class="category-description">${formatRichText(category.description)}</div>` : ""}
        </div>
        ${renderMasonry(works)}
      </section>
    `;
  }

  function renderCategorySections(works) {
    return data.categories
      .map((category) => {
        const categoryWorks = works.filter((work) => work.categorySlug === category.slug);
        if (!categoryWorks.length) return "";
        return `
          <section class="category-section" id="${category.slug}">
            <div class="category-heading">
              <p class="section-kicker">${escapeHtml(category.name)}</p>
              <h3>${escapeHtml(category.name)}</h3>
              ${category.description ? `<div class="category-description">${formatRichText(category.description)}</div>` : ""}
            </div>
            ${renderMasonry(categoryWorks)}
          </section>
        `;
      })
      .join("");
  }

  function renderMasonry(works) {
    const isCompact = works.some((work) => work.category && work.category.toLowerCase().includes("gif"));
    return `<div class="masonry${isCompact ? " is-compact" : ""}">${works.map(renderWorkCard).join("")}</div>`;
  }

  function renderWorkCard(work) {
    const image = work.images && work.images.length ? work.images[0] : "";
    const imageCount = work.images && work.images.length > 1 ? `${work.images.length} 张图片` : "";
    const cover = work.cover || { width: 1, height: 1, orientation: "square" };
    const hasBody = !work.direct || work.description;
    const thumbnails =
      work.images && work.images.length > 1
        ? `<div class="work-thumbs" aria-label="${escapeHtml(work.title)} 的更多图片">
            ${work.images
              .slice(0, 5)
              .map(
                (thumb) =>
                  `<a href="${thumb}" target="_blank" rel="noreferrer"><img src="${thumb}" alt="${escapeHtml(work.title)}" loading="lazy" /></a>`,
              )
              .join("")}
          </div>`
        : "";

    return `
      <article class="work-card is-${cover.orientation}" id="${work.slug}" style="--ratio: ${cover.width} / ${cover.height}">
        <a class="work-media" href="${image}" target="_blank" rel="noreferrer" aria-label="查看 ${escapeHtml(work.title)}">
          <img src="${image}" alt="${escapeHtml(work.title)}" loading="lazy" />
        </a>
        ${
          hasBody
            ? `
        <div class="work-body">
          <p class="work-category">${escapeHtml(work.category)}</p>
          <h3 class="work-title">${escapeHtml(work.title)}</h3>
          ${work.description ? `<div class="work-description">${formatRichText(work.description)}</div>` : ""}
          ${imageCount ? `<p class="work-count">${imageCount}</p>` : ""}
          ${thumbnails}
        </div>
        `
            : ""
        }
      </article>
    `;
  }

  function formatRichText(value) {
    return escapeHtml(value)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`)
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  $("#printButton").addEventListener("click", () => window.print());

  renderProfile();
  renderCategoryNav();
  renderWorks();
})();
