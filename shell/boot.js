// Decides the desktop shell before the first paint: the Flutter engine and the
// shell CSS must agree, and an engine already embedded in #app cannot move back
// to the page. This query is repeated in shell/style.css; change both together.
const shellQuery = window.matchMedia('(min-width: 720px) and (min-height: 760px) and (pointer: fine)');

// The screen is a fixed 393 x 852 logical phone (iPhone 15 Pro); the frame is
// scaled whole to the room under the bar and the hero's air, so the app keeps
// a real phone's width at every window height. These numbers mirror style.css.
const frameHeight = 864; // 852 + two 6px bezels
// The bar, the hero's top and bottom air, and the hint row under the phone.
const heroAir = 56 + 24 + 20 + 30;

function fitFrame() {
  const scale = Math.min(1, (window.innerHeight - heroAir) / frameHeight);
  document.documentElement.style.setProperty('--frame-scale', scale.toFixed(4));
}

if (shellQuery.matches) {
  document.documentElement.classList.add('shell');
  fitFrame();
  window.addEventListener('resize', fitFrame);
}
