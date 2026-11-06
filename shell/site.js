// The desktop shell's interactions: the copy-link doors, the store doors'
// snackbar, the nav's frost and current section, and the developer links in
// the footer. The page's own copy is static in index.html; the developer's
// doors are data.

import { DEVELOPER } from './data.js';

const COPY_IDLE_MS = 2000;
const COPY_STATUS_MS = 4000;
const TOAST_MS = 4000;
// Any real scroll distance leaves the top; a pixel of scrollbar jitter does not.
const NAV_FROST_AT = 4;

let copyStatusTimer = 0;

function flashLabel(button, text) {
  if (!button.dataset.idle) button.dataset.idle = button.textContent;
  button.textContent = text;
  window.clearTimeout(Number(button.dataset.timer));
  const timer = window.setTimeout(() => {
    button.textContent = button.dataset.idle;
  }, COPY_IDLE_MS);
  button.dataset.timer = String(timer);
}

function announceCopy(text) {
  const status = document.getElementById('copy-status');
  if (!status) return;
  status.textContent = text;
  window.clearTimeout(copyStatusTimer);
  copyStatusTimer = window.setTimeout(() => {
    status.textContent = '';
  }, COPY_STATUS_MS);
}

async function copyPage(button) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('clipboard unavailable');
    }
    await navigator.clipboard.writeText(window.location.href);
    flashLabel(button, 'Link copied');
    announceCopy("Link copied. Open it in your phone's browser.");
  } catch {
    flashLabel(button, 'Copy the address bar');
    announceCopy('Copy the address bar to open Duo on your phone.');
  }
}

function wireCopyLinks() {
  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', () => copyPage(button));
  });
}

// The stores are not open yet, so the buttons answer with the snackbar rather
// than a download. The live region is the toast itself; it is visible text.
function wireStoreToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;

  let timer = 0;
  document.querySelectorAll('[data-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      toast.textContent = `Duo for ${button.dataset.platform} isn't in the stores yet. Stay tuned.`;
      toast.classList.add('is-visible');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove('is-visible'), TOAST_MS);
    });
  });
}

// The app owns the URL's hash for its own routes (`#/sessions`), so a section
// door must not write `#novel` into it: the router would read that as a route.
// The anchors keep their hrefs for no-script and accessibility, and the click
// scrolls the page itself.
function wireAnchors() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const id = anchor.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!id || !target) return;
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const behavior = reduce.matches ? 'auto' : 'smooth';
      if (id === 'top') window.scrollTo({ top: 0, behavior });
      else target.scrollIntoView({ behavior, block: 'start' });
      // The skip door moves focus as well as the viewport, so the next Tab
      // starts inside the page rather than back at the bar.
      if (target.hasAttribute('tabindex')) {
        target.focus({ preventScroll: true });
      }
    });
  });
}

// The bar stays bare over the hero and frosts once the page scrolls under it.
// The same pass marks the chapter the reader is in, so the nav says where the
// page is without a second observer.
function wireNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const links = new Map();
  nav.querySelectorAll('.nav-links a').forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (id) links.set(id, link);
  });
  const sections = [
    'start',
    'novel',
    'cast',
    'persona',
    'screens',
    'local-first',
    'details',
    'get',
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let frosted = false;
  let active = null;

  const sync = () => {
    const nextFrosted = window.scrollY > NAV_FROST_AT;
    if (nextFrosted !== frosted) {
      frosted = nextFrosted;
      nav.classList.toggle('is-scrolled', frosted);
    }

    // The current chapter is the last one that has started, so the nav keeps
    // its mark through the air between chapters and clears on the close.
    const line = window.innerHeight * 0.3;
    let current = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section.id;
    }
    if (!current || !links.has(current)) current = null;
    if (current === active) return;
    active = current;
    for (const [id, link] of links) {
      const on = id === active;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  let ticking = false;
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      sync();
    });
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  sync();
}

function renderFooter() {
  const links = document.querySelector('#footer .footer-links');
  if (!links) return;

  for (const link of DEVELOPER.links) {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.textContent = link.label;
    if (link.href.startsWith('http')) {
      anchor.rel = 'noopener';
      anchor.target = '_blank';
    }
    links.append(anchor);
  }

  const year = document.getElementById('footer-year');
  if (year) year.textContent = String(new Date().getFullYear());
}

wireCopyLinks();
wireStoreToast();
wireAnchors();
wireNav();
renderFooter();
