/* ===== UI helpers: class strings, animation, list reconcile, drag, scopes ===== */

/* ---- Button class strings (src/components/common/buttonStyles.ts) ---- */
var btnBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';
var btnPrimary = btnBase + ' bg-gold px-5 py-2.5 font-semibold text-ink hover:bg-gold-soft';
var btnSecondary = btnBase + ' border border-line bg-raised px-5 py-2.5 text-cream hover:border-gold/60';
var btnGhost = btnBase + ' px-3 py-2 text-muted hover:bg-raised hover:text-cream';
var btnIcon =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-cream transition-[background-color,border-color,color] duration-150 ease-out hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40';

/* ---- Admin class strings (src/components/admin/adminStyles.ts) ---- */
var adminInput =
  'w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted/70 transition-colors duration-150 focus:border-gold focus:outline-none';
var adminLabel = 'mb-1.5 block text-xs font-medium text-muted';
var adminCard = 'rounded-xl border border-line bg-raised p-4';
var adminDelete =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-ink hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold';

/* ---- DOM helpers ---- */
function fromHTML(html) {
  var t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Web Animations wrapper. Honors prefers-reduced-motion. */
function animate(el, keyframes, opts) {
  opts = opts || {};
  var o = {
    duration: opts.duration == null ? 250 : opts.duration,
    easing: opts.easing || EASE_OUT_CSS,
    fill: opts.fill || 'backwards',
    delay: opts.delay || 0,
    iterations: opts.iterations || 1
  };
  if (REDUCED.matches) { o.duration = 0.01; o.delay = 0; o.iterations = 1; }
  return el.animate(keyframes, o);
}

/** Cleanup hooks: elements may carry _dispose (listeners etc.). */
function disposeTree(root) {
  if (!root) return;
  if (root._dispose) { root._dispose(); root._dispose = null; }
  var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
  for (var i = 0; i < all.length; i++) {
    if (all[i]._dispose) { all[i]._dispose(); all[i]._dispose = null; }
  }
}
function clearChildren(el) {
  Array.prototype.forEach.call(el.children, disposeTree);
  el.innerHTML = '';
}

/* ---- Product image (src/components/common/ProductImage.tsx) ---- */
var PHOTO_FALLBACK =
  '<div class="absolute inset-0 flex items-center justify-center p-3 text-center text-xs leading-snug text-paper-ink">Photo unavailable</div>';

function productImage(src, alt, cls, fit) {
  fit = fit || 'cover';
  var inner = !src
    ? PHOTO_FALLBACK
    : '<img class="pimg h-full w-full select-none ' + (fit === 'cover' ? 'object-cover' : 'object-contain p-2') +
      '" src="' + esc(src) + '" alt="' + esc(alt) + '" draggable="false" loading="lazy">';
  return '<div class="relative overflow-hidden bg-paper ' + (cls || '') + '">' + inner + '</div>';
}

// Broken images -> "Photo unavailable" (error events don't bubble, so capture)
document.addEventListener('error', function (e) {
  var t = e.target;
  if (t && t.tagName === 'IMG' && t.classList.contains('pimg')) {
    t.replaceWith(fromHTML(PHOTO_FALLBACK));
  }
}, true);
document.addEventListener('dragstart', function (e) {
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});

/* ---- Subscription scopes (mount/unmount groups of components) ---- */
function shallowEq(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function createScope() {
  var unsubs = [];
  var roots = [];
  return {
    /** select(state) -> array of values; render(values, isFirst, state) runs when they change. */
    mount: function (select, render) {
      var prev = null;
      function run(s) {
        var cur = select(s);
        if (prev && shallowEq(prev, cur)) return;
        var first = !prev;
        prev = cur;
        render(cur, first, s);
      }
      run(Store.get());
      unsubs.push(Store.subscribe(run));
    },
    onDispose: function (fn) { unsubs.push(fn); },
    track: function (el) { roots.push(el); },
    dispose: function () {
      unsubs.forEach(function (f) { f(); });
      unsubs = [];
      roots.forEach(disposeTree);
      roots = [];
    }
  };
}

/* ---- Keyed list reconcile with enter/exit/FLIP animations ---- */
function measureChildren(container) {
  var m = new Map();
  Array.prototype.forEach.call(container.children, function (c) {
    if (!c._exiting) m.set(c, c.getBoundingClientRect());
  });
  return m;
}
function playFlip(before) {
  before.forEach(function (r, c) {
    if (!c.isConnected) return;
    var n = c.getBoundingClientRect();
    var dx = r.left - n.left;
    var dy = r.top - n.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      animate(c, [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 250 });
    }
  });
}

/** Replace height:'auto' keyframes with the element's measured pixel height. */
function resolveAuto(el, kf) {
  var h = el.scrollHeight + 'px';
  return kf.map(function (f) {
    if (f.height !== 'auto') return f;
    return Object.assign({}, f, { height: h });
  });
}

/**
 * entries: [{key, html, sig}] — html is ONE root element. Elements with an unchanged
 * sig are kept as-is; changed sig -> replaced; new -> inserted (with enter anim);
 * missing -> exit anim then removed.
 * o: {initial:false (no enter anim on first render), enter:{kf,d}, exit:{kf,d}, flip:true, afterCreate(el, entry)}
 */
function reconcile(container, entries, o) {
  o = o || {};
  var first = !container._reconciled;
  container._reconciled = true;
  var animateIn = !(first && o.initial === false);
  var before = o.flip && !first ? measureChildren(container) : null;

  var existing = {};
  Array.prototype.forEach.call(container.children, function (c) {
    if (c._key != null && !c._exiting) existing[c._key] = c;
  });

  var wanted = {};
  var finalEls = [];
  entries.forEach(function (en) {
    wanted[en.key] = true;
    var el = existing[en.key];
    if (el && el._sig === en.sig) { finalEls.push(el); return; }
    var fresh = fromHTML(en.html);
    fresh._key = en.key;
    fresh._sig = en.sig;
    if (el) {
      disposeTree(el);
      container.replaceChild(fresh, el);
    } else {
      container.appendChild(fresh);
      if (animateIn && o.enter) animate(fresh, resolveAuto(fresh, o.enter.kf), { duration: o.enter.d });
    }
    if (o.afterCreate) o.afterCreate(fresh, en);
    finalEls.push(fresh);
  });

  // order
  var cursor = null;
  function nextLive(node) {
    while (node && node._exiting) node = node.nextElementSibling;
    return node;
  }
  cursor = nextLive(container.firstElementChild);
  finalEls.forEach(function (el) {
    if (cursor === el) { cursor = nextLive(el.nextElementSibling); return; }
    container.insertBefore(el, cursor);
  });

  // removals
  Array.prototype.slice.call(container.children).forEach(function (c) {
    if (c._exiting || c._key == null || wanted[c._key]) return;
    c._exiting = true;
    c.style.pointerEvents = 'none';
    function done() {
      var snap = o.flip ? measureChildren(container) : null;
      disposeTree(c);
      if (c.parentNode) c.parentNode.removeChild(c);
      if (snap) {
        // siblings shifted after removal -> animate them from where they were
        var after = new Map();
        snap.forEach(function (r, k) { if (k !== c) after.set(k, r); });
        playFlip(after);
      }
    }
    if (o.exit) {
      var a = animate(c, resolveAuto(c, o.exit.kf), { duration: o.exit.d, fill: 'forwards' });
      var finished = false;
      var fin = function () { if (!finished) { finished = true; done(); } };
      a.onfinish = fin;
      window.setTimeout(fin, o.exit.d + 120);
    } else {
      done();
    }
  });

  if (before) playFlip(before);
}

/* ---- Collapse (height 0 <-> auto) ---- */
function setOpen(el, open, o) {
  o = o || {};
  var dur = o.duration == null ? 280 : o.duration;
  if (el._open === open && !o.force) return Promise.resolve();
  var startH = el.hidden ? 0 : el.offsetHeight;
  var startO = o.fade ? (el.hidden ? 0 : parseFloat(getComputedStyle(el).opacity)) : 1;
  if (el._cAnim) { el._cAnim.cancel(); el._cAnim = null; }
  el._open = open;
  if (o.immediate) { el.hidden = !open; return Promise.resolve(); }
  return new Promise(function (resolve) {
    var a;
    if (open) {
      el.hidden = false;
      var h = el.scrollHeight;
      a = animate(el, [
        { height: startH + 'px', opacity: o.fade ? startO : 1 },
        { height: h + 'px', opacity: 1 }
      ], { duration: dur, fill: 'none' });
    } else {
      a = animate(el, [
        { height: startH + 'px', opacity: o.fade ? startO : 1 },
        { height: '0px', opacity: o.fade ? 0 : 1 }
      ], { duration: dur, fill: 'forwards' });
    }
    el._cAnim = a;
    a.onfinish = function () {
      if (el._open === open) {
        if (!open) el.hidden = true;
        a.cancel();
        el._cAnim = null;
      }
      resolve();
    };
    a.oncancel = function () { resolve(); };
  });
}

/* ---- Drag (framer-motion drag="x" replacement) ---- */
function makeDrag(el, o) {
  var startX = 0, startY = 0, active = false, moved = false, pid = null;
  function display(dx) {
    if (!o.constrained) return dx;
    return dx < 0 ? dx * (o.elasticLeft == null ? 0 : o.elasticLeft) : dx * (o.elasticRight == null ? 0 : o.elasticRight);
  }
  function apply(dx) {
    var t = 'translateX(' + display(dx) + 'px)';
    if (o.rotate) t += ' rotate(' + o.rotate(dx) + 'deg)';
    el.style.transform = t;
  }
  function onMove(e) {
    if (!active || e.pointerId !== pid) return;
    var dx = e.clientX - startX;
    if (!moved) {
      if (Math.abs(dx) <= 3) return;
      moved = true;
      try { el.setPointerCapture(pid); } catch (err) { /* ignore */ }
      el.style.transition = 'none';
      el.style.userSelect = 'none';
    }
    apply(dx);
    if (o.onDrag) o.onDrag(dx);
  }
  function onUp(e) {
    if (!active || e.pointerId !== pid) return;
    active = false;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    if (!moved) return;
    var dx = e.type === 'pointercancel' ? 0 : e.clientX - startX;
    el._justDragged = true;
    window.setTimeout(function () { el._justDragged = false; }, 0);
    el.style.userSelect = '';
    el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)';
    el.style.transform = '';
    window.setTimeout(function () { el.style.transition = ''; }, 360);
    if (o.onEnd) o.onEnd(dx);
  }
  el.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true; moved = false; pid = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
  el.addEventListener('click', function (e) {
    if (el._justDragged) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}

/* ---- Count-up number (src/components/credits/CountUp.tsx) ---- */
function countUp(el, value) {
  if (el._v == null) { el._v = value; el.textContent = value; return; }
  var from = el._v;
  el._v = value;
  if (from === value) { return; }
  if (el._raf) cancelAnimationFrame(el._raf);
  var dur = value > from ? 800 : 300;
  var t0 = null;
  function step(ts) {
    if (t0 == null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    el.textContent = Math.round(from + (value - from) * easeOutFn(p));
    if (p < 1) el._raf = requestAnimationFrame(step);
  }
  if (REDUCED.matches) { el.textContent = value; return; }
  el._raf = requestAnimationFrame(step);
}
function countUpHTML(value, cls) {
  return '<span data-countup class="tabular-nums ' + (cls || '') + '">' + value + '</span>';
}

/* ---- Generic helper: set input value unless the user is editing it ---- */
function setIfIdle(input, value) {
  if (!input) return;
  var v = String(value);
  if (document.activeElement !== input && input.value !== v) input.value = v;
}
