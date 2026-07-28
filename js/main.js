// Meridian Dental Studio — site behavior

var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var EASE_OUT = "cubic-bezier(0.22, 0.61, 0.36, 1)";

/* ------------------------------------------------------------------ */
/* Header menu                                                         */
/* ------------------------------------------------------------------ */
(function () {
  var menuBtn = document.querySelector(".header__menu");
  var mobileNav = document.querySelector(".mobile-nav");
  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener("click", function () {
    var isOpen = mobileNav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
})();

/* ------------------------------------------------------------------
   JOURNEY — scroll drives the rail, the active step and the detail.

   Wide, tall viewports pin the stage and map the scroll runway onto the
   four steps. Anywhere else the section is a normal stacked block, so
   the active step is simply whichever one has passed the reading line.
   ------------------------------------------------------------------ */
(function () {
  var section = document.querySelector(".journey");
  if (!section) return;

  var list = section.querySelector(".journey-steps");
  var steps = Array.prototype.slice.call(section.querySelectorAll(".journey-step"));
  var panels = Array.prototype.slice.call(section.querySelectorAll(".journey-detail__panel"));
  if (!list || !steps.length) return;

  var pinnedQuery = window.matchMedia("(min-width: 768px) and (min-height: 640px)");
  var total = steps.length;
  var current = -1;

  function render(active, progress) {
    list.style.setProperty("--progress", progress.toFixed(3));
    if (active === current) return;
    current = active;

    steps.forEach(function (step, i) {
      step.classList.toggle("is-active", i === active);
      step.classList.toggle("is-done", i < active);
    });
    panels.forEach(function (panel, i) {
      panel.classList.toggle("is-active", i === active);
    });
  }

  // Pinned: progress through the runway maps straight onto the steps.
  function updatePinned() {
    var rect = section.getBoundingClientRect();
    var runway = section.offsetHeight - window.innerHeight;
    var progress = runway > 0 ? -rect.top / runway : 0;
    progress = Math.max(0, Math.min(1, progress));
    render(Math.min(total - 1, Math.floor(progress * total)), progress);
  }

  // Stacked: the last step whose number has crossed the reading line wins.
  function updateStacked() {
    var line = window.innerHeight * 0.6;
    var active = 0;
    steps.forEach(function (step, i) {
      if (step.getBoundingClientRect().top <= line) active = i;
    });
    render(active, (active + 1) / total);
  }

  var update = updatePinned;
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  function apply() {
    update = pinnedQuery.matches ? updatePinned : updateStacked;
    current = -1;
    update();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", apply);
  if (pinnedQuery.addEventListener) pinnedQuery.addEventListener("change", apply);
  apply();
})();

/* ------------------------------------------------------------------
   Carousels (team + testimonials).

   Below 1024px both are centred carousels: the track slides so the
   active card sits in the middle of a full-bleed viewport, with the
   neighbours dissolving under the edge fades. On desktop the team keeps
   its four-up grid and the arrows only move the highlight, which grows
   the active card upward and brings in its panel and socials.
   ------------------------------------------------------------------ */
function createCarousel(options) {
  var viewport = document.querySelector(options.viewport);
  var track = document.querySelector(options.track);
  if (!viewport || !track) return null;

  var cards = Array.prototype.slice.call(track.children);
  if (!cards.length) return null;

  var prevBtn = document.querySelector(options.prev);
  var nextBtn = document.querySelector(options.next);
  var slidesQuery = window.matchMedia(options.slidesBelow || "(max-width: 1023px)");
  var index = 0;

  function layout() {
    // display:contents on desktop leaves the viewport with no box to measure.
    if (!slidesQuery.matches) {
      track.style.transform = "";
      return;
    }
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var x = 0;
    for (var i = 0; i < index; i++) x += cards[i].offsetWidth + gap;
    var offset = viewport.clientWidth / 2 - (x + cards[index].offsetWidth / 2);
    track.style.transform = "translateX(" + offset + "px)";
  }

  function setIndex(next) {
    index = (next + cards.length) % cards.length;
    cards.forEach(function (card, i) {
      card.classList.toggle("is-active", i === index);
    });
    layout();
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { setIndex(index - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { setIndex(index + 1); });

  if (options.clickable) {
    cards.forEach(function (card, i) {
      card.addEventListener("click", function () { setIndex(i); });
    });
  }

  // A plain resize listener can run before the new breakpoint has been laid
  // out, which leaves the track translated by the previous size's offset.
  // ResizeObserver fires after layout, with boxes we can trust.
  window.addEventListener("resize", layout);
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(viewport);
  if (slidesQuery.addEventListener) slidesQuery.addEventListener("change", layout);
  // Card sizes depend on images, so re-measure once they have loaded.
  window.addEventListener("load", layout);

  // Start on the second card so there is always one to either side, rather
  // than opening with an empty gap on the left.
  setIndex(Math.min(options.start || 0, cards.length - 1));
  return { setIndex: setIndex, layout: layout };
}

createCarousel({
  viewport: ".team__viewport",
  track: ".team__track",
  prev: ".team__head .carousel-arrow:first-child",
  next: ".team__head .carousel-arrow:last-child",
  clickable: true,
  start: 1
});

createCarousel({
  viewport: ".testimonials__viewport",
  track: ".testimonials__track",
  prev: ".testimonials__arrows .carousel-arrow:first-child",
  next: ".testimonials__arrows .carousel-arrow:last-child",
  slidesBelow: "(max-width: 1279px)",
  start: 1
});

/* ------------------------------------------------------------------
   Testimonials — the desktop collage drifts as the section goes past,
   each card at its own rate, so the group reads as floating.
   ------------------------------------------------------------------ */
(function () {
  var stage = document.querySelector(".testimonials__stage");
  if (!stage || REDUCED) return;

  var collageQuery = window.matchMedia("(min-width: 1280px)");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".testimonial-card"));
  var ticking = false;

  function update() {
    if (!collageQuery.matches) {
      cards.forEach(function (card) { card.style.removeProperty("--lift"); });
      return;
    }
    var rect = stage.getBoundingClientRect();
    var span = window.innerHeight / 2 + rect.height / 2;
    var delta = window.innerHeight / 2 - (rect.top + rect.height / 2);
    var lift = Math.max(-1, Math.min(1, delta / span));
    cards.forEach(function (card) { card.style.setProperty("--lift", lift.toFixed(3)); });
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* ------------------------------------------------------------------
   FAQ — an accordion that actually animates. <details> hides its content
   the moment [open] goes away, so the collapse is played first and the
   attribute is dropped only once the transition has finished.
   ------------------------------------------------------------------ */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
  if (!items.length) return;

  function collapse(item) {
    var body = item.querySelector(".faq-item__body");
    if (!body || REDUCED) { item.open = false; return; }

    item.classList.add("is-closing");

    var finished = false;
    function done(event) {
      if (event && event.propertyName !== "grid-template-rows") return;
      if (finished) return;
      finished = true;
      body.removeEventListener("transitionend", done);
      item.classList.remove("is-closing");
      item.open = false;
    }
    body.addEventListener("transitionend", done);
    setTimeout(done, 600);   // in case the transition never fires
  }

  items.forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;

    summary.addEventListener("click", function (event) {
      event.preventDefault();
      if (item.open && !item.classList.contains("is-closing")) {
        collapse(item);
        return;
      }
      items.forEach(function (other) {
        if (other !== item && other.open) collapse(other);
      });
      item.classList.remove("is-closing");
      item.open = true;
    });
  });
})();

/* ------------------------------------------------------------------
   Results — before/after. A transparent range input sits over the frame,
   so dragging, touch and arrow keys all work without extra code.
   ------------------------------------------------------------------ */
(function () {
  var compare = document.querySelector(".compare");
  if (!compare) return;

  var range = compare.querySelector(".compare__range");
  if (!range) return;

  function apply() {
    compare.style.setProperty("--pos", range.value + "%");
  }
  range.addEventListener("input", apply);
  apply();
})();

/* ------------------------------------------------------------------
   Service rows settle in as they scroll into view.
   ------------------------------------------------------------------ */
(function () {
  var list = document.querySelector(".services__list");
  if (!list) return;

  var rows = Array.prototype.slice.call(list.querySelectorAll(".service"));
  if (!rows.length || REDUCED || !("IntersectionObserver" in window)) return;

  // Only hide the rows once we know we can bring them back.
  list.classList.add("is-revealing");

  var fired = false;
  var observer = new IntersectionObserver(function (entries) {
    fired = true;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var index = rows.indexOf(entry.target);
      entry.target.style.transitionDelay = (index % 6) * 70 + "ms";
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });

  rows.forEach(function (row) { observer.observe(row); });

  // An observer always reports its targets once, intersecting or not. If that
  // never happens the API is being suppressed, so show the rows outright
  // rather than leave the list blank.
  setTimeout(function () {
    if (fired) return;
    observer.disconnect();
    list.classList.remove("is-revealing");
  }, 2500);
})();

/* ------------------------------------------------------------------
   Copy reveal — headings and body copy rise into place on the way down
   and settle back out on the way up. Nothing is hidden until we know an
   observer is available to bring it back.
   ------------------------------------------------------------------ */
(function () {
  if (REDUCED || !("IntersectionObserver" in window)) return;

  var GROUPS = [
    ".hero__title, .hero__subtitle, .hero__actions",
    ".about__inner > *",
    ".services .section-eyebrow, .services__title, .services__aside",
    ".results .eyebrow, .results__title, .results__paragraph, .results__case, .compare",
    ".team__head > div > *",
    ".journey__title, .journey__subtitle",
    ".testimonials__title",
    ".faq .eyebrow, .faq__title, .faq__support, .faq-item"
    // The CTA panel and the footer stay put entirely, by request.
  ];

  var targets = [];
  GROUPS.forEach(function (selector) {
    Array.prototype.slice.call(document.querySelectorAll(selector))
      .forEach(function (el, i) {
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--reveal-delay", Math.min(i, 6) * 60 + "ms");
        targets.push(el);
      });
  });
  if (!targets.length) return;

  document.documentElement.classList.add("js-reveal");

  var fired = false;
  var observer = new IntersectionObserver(function (entries) {
    fired = true;
    entries.forEach(function (entry) {
      entry.target.classList.toggle("is-in", entry.isIntersecting);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });

  targets.forEach(function (el) { observer.observe(el); });

  setTimeout(function () {
    if (fired) return;
    observer.disconnect();
    document.documentElement.classList.remove("js-reveal");
  }, 2500);
})();

/* ------------------------------------------------------------------
   Eased wheel scrolling. Only where it belongs: pointer devices, which
   have no inertia of their own. Touch and reduced-motion keep the
   native behaviour. The real scroll position is still what moves, so
   sticky and pinned sections keep working.
   ------------------------------------------------------------------ */
(function () {
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (REDUCED || !finePointer.matches) return;

  var target = window.scrollY;
  var current = target;
  var running = false;
  var EASE = 0.14;

  function limit() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function frame() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.4) {
      current = target;
      running = false;
    }
    // 'instant' overrides the smooth scroll-behavior used for anchor jumps.
    window.scrollTo({ top: current, behavior: "instant" });
    if (running) requestAnimationFrame(frame);
  }

  window.addEventListener("wheel", function (event) {
    if (event.ctrlKey || event.metaKey) return;      // pinch zoom
    event.preventDefault();

    var step = event.deltaY;
    if (event.deltaMode === 1) step *= 16;            // lines
    else if (event.deltaMode === 2) step *= window.innerHeight;

    target = Math.max(0, Math.min(limit(), target + step));
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }, { passive: false });

  // Anything we did not drive — keyboard, anchors, the scrollbar — resyncs.
  window.addEventListener("scroll", function () {
    if (!running) {
      target = current = window.scrollY;
    }
  }, { passive: true });
})();
