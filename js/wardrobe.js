/* ===== Wardrobe: FocusView, rail, hanging garments, drawers, swipe list ===== */

var HANGER_SVG =
  '<svg width="96" height="40" viewBox="0 0 96 40" fill="none" aria-hidden="true" class="relative z-10 -mb-1">' +
  '<path d="M48 16V11.5C48 9 51 8.5 51 5.5C51 3 49.6 1.5 47.5 1.5C45.6 1.5 44.2 2.8 44 4.6" stroke="#BDB5A7" stroke-width="2.4" stroke-linecap="round" />' +
  '<path d="M48 16L8 35.5C6 36.5 6.6 38.5 8.8 38.5H87.2C89.4 38.5 90 36.5 88 35.5L48 16Z" stroke="#BDB5A7" stroke-width="2.4" stroke-linejoin="round" />' +
  '</svg>';

function sortedByOrder(list) {
  return list.slice().sort(function (a, b) { return a.order - b.order; });
}

/* ---------- FocusView: large front view of one garment ---------- */
function createFocusView(item, returnLabel) {
  var THRESHOLD = 110;
  var el = fromHTML(
    '<div role="dialog" aria-label="' + esc(item.name) + ', front view" class="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-10">' +
      '<div class="flex flex-col items-center gap-2">' +
        '<div data-role="drag" class="cursor-grab touch-pan-y active:cursor-grabbing">' +
          productImage(item.image, item.name, 'h-[250px] w-[190px] rounded-xl shadow-2xl shadow-black/60 sm:h-[320px] sm:w-[240px]') +
        '</div>' +
        '<div class="flex w-full justify-between px-1 text-xs font-medium" aria-hidden="true">' +
          '<span data-role="lbl-left" class="transition-colors duration-150 text-muted">← ' + esc(returnLabel) + '</span>' +
          '<span data-role="lbl-right" class="transition-colors duration-150 text-muted">Add →</span>' +
        '</div>' +
      '</div>' +
      '<div class="flex max-w-xs flex-col items-center text-center sm:items-start sm:text-left">' +
        '<p class="text-sm font-medium text-gold">' + esc(item.category) + (item.uploaded ? ' · Uploaded' : '') + '</p>' +
        '<h3 class="mt-1 font-serif text-[32px] font-semibold leading-tight text-cream">' + esc(item.name) + '</h3>' +
        '<p class="mt-2 text-sm text-muted">Drag the photo right to add it, or left to ' + esc(returnLabel.toLowerCase()) + '.</p>' +
        '<div class="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">' +
          '<button type="button" data-role="add" class="' + btnPrimary + '">' + icon('Plus', 16) + ' Add to outfit</button>' +
          '<button type="button" data-role="back" class="' + btnSecondary + '">' + icon('Undo2', 16) + ' ' + esc(returnLabel) + '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  var left = el.querySelector('[data-role=lbl-left]');
  var right = el.querySelector('[data-role=lbl-right]');
  function setLabels(dx) {
    left.classList.toggle('text-gold', dx < -40); left.classList.toggle('text-muted', !(dx < -40));
    right.classList.toggle('text-gold', dx > 40); right.classList.toggle('text-muted', !(dx > 40));
  }
  function add() { A.addToOutfit(item.id, { announce: !isDesktop() }); }
  el.querySelector('[data-role=add]').addEventListener('click', add);
  el.querySelector('[data-role=back]').addEventListener('click', A.closePreview);
  makeDrag(el.querySelector('[data-role=drag]'), {
    rotate: function (dx) { return dx / 40; },
    onDrag: setLabels,
    onEnd: function (dx) {
      setLabels(0);
      if (dx > THRESHOLD) add(); else if (dx < -THRESHOLD) A.closePreview();
    }
  });
  function onKey(e) { if (e.key === 'Escape') A.closePreview(); }
  window.addEventListener('keydown', onKey);
  el._dispose = function () { window.removeEventListener('keydown', onKey); };
  window.setTimeout(function () { var b = el.querySelector('[data-role=add]'); if (b && b.isConnected) b.focus(); }, 0);
  return el;
}
function animateFocusIn(el) {
  animate(el, [{ opacity: 0, transform: 'translateY(12px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 250 });
}

/* ---------- Hanging garment (rail item) ---------- */
function hangingGarmentHTML(item) {
  return '<li class="relative shrink-0 hover:z-10 focus-within:z-10">' +
    '<button type="button" data-preview="' + esc(item.id) + '" aria-label="Bring forward ' + esc(item.name) + '" class="group flex w-[96px] flex-col items-center rounded-lg focus-visible:outline-none" style="perspective:800px">' +
      HANGER_SVG +
      '<div class="relative transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [transform:rotateY(-62deg)] group-hover:[transform:rotateY(-40deg)_translateY(4px)] group-focus-visible:[transform:rotateY(-30deg)]" style="transform-style:preserve-3d;transform-origin:50% 0%">' +
        productImage(item.image, '', 'h-[250px] w-[160px] rounded-md shadow-[12px_16px_30px_rgba(0,0,0,0.55)] ring-1 ring-black/20 group-focus-visible:ring-2 group-focus-visible:ring-gold') +
        '<span aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-md bg-black/15 transition-opacity duration-200 group-hover:opacity-0"></span>' +
      '</div>' +
      '<span class="mt-4 w-[120px] truncate text-center text-sm text-muted transition-colors duration-150 group-hover:text-cream">' + esc(item.name) + '</span>' +
    '</button></li>';
}

/* ---------- Wardrobe rail ---------- */
function createWardrobeRail() {
  var el = fromHTML(
    '<div class="relative h-[420px]">' +
      '<div aria-hidden="true" class="pointer-events-none absolute inset-x-4 top-[30px] z-0 flex items-start justify-between">' +
        '<span class="h-4 w-2 rounded-sm bg-[#6F6A62]"></span><span class="h-4 w-2 rounded-sm bg-[#6F6A62]"></span>' +
      '</div>' +
      '<div aria-hidden="true" class="pointer-events-none absolute inset-x-4 top-[40px] z-20 h-2.5 rounded-full border-t border-[#D9D3C8] bg-[#8E897F] shadow-[0_4px_10px_rgba(0,0,0,0.5)]"></div>' +
      '<div data-role="scroller" aria-label="Hanging rail" role="region" class="no-scrollbar absolute inset-0 cursor-grab overflow-x-auto overflow-y-hidden">' +
        '<div data-role="empty" class="hidden h-full items-center justify-center px-6 text-center text-sm text-muted">The rail is empty — every garment is in the outfit.</div>' +
        '<ul data-role="list" class="flex min-w-max gap-1 px-16 pt-[36px]"></ul>' +
      '</div>' +
      '<button type="button" data-role="left" disabled aria-label="Scroll rail left" class="' + btnIcon + ' absolute left-3 top-1/2 z-30 h-10 w-10 -translate-y-1/2 bg-ink/90">' + icon('ChevronLeft', 18) + '</button>' +
      '<button type="button" data-role="right" disabled aria-label="Scroll rail right" class="' + btnIcon + ' absolute right-3 top-1/2 z-30 h-10 w-10 -translate-y-1/2 bg-ink/90">' + icon('ChevronRight', 18) + '</button>' +
    '</div>'
  );
  var scroller = el.querySelector('[data-role=scroller]');
  var list = el.querySelector('[data-role=list]');
  var empty = el.querySelector('[data-role=empty]');
  var leftBtn = el.querySelector('[data-role=left]');
  var rightBtn = el.querySelector('[data-role=right]');
  var drag = { startX: 0, startLeft: 0, moved: false };

  function update() {
    leftBtn.disabled = !(scroller.scrollLeft > 4);
    rightBtn.disabled = !(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4);
  }
  scroller.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  el._dispose = function () { window.removeEventListener('resize', update); };

  leftBtn.addEventListener('click', function () { scroller.scrollBy({ left: -320, behavior: 'smooth' }); });
  rightBtn.addEventListener('click', function () { scroller.scrollBy({ left: 320, behavior: 'smooth' }); });

  scroller.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { startX: e.clientX, startLeft: scroller.scrollLeft, moved: false };
    function move(ev) {
      var dx = ev.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        scroller.classList.add('cursor-grabbing', 'select-none');
        scroller.classList.remove('cursor-grab');
      }
      if (drag.moved) scroller.scrollLeft = drag.startLeft - dx;
    }
    function up() {
      scroller.classList.remove('cursor-grabbing', 'select-none');
      scroller.classList.add('cursor-grab');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.setTimeout(function () { drag.moved = false; }, 0);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  scroller.addEventListener('click', function (e) {
    if (drag.moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-preview]');
    if (b) A.previewItem(b.getAttribute('data-preview'));
  });

  el.update = function (items) {
    empty.classList.toggle('hidden', items.length !== 0);
    empty.classList.toggle('flex', items.length === 0);
    list.classList.toggle('hidden', items.length === 0);
    reconcile(list, items.map(function (it) {
      return { key: it.id, sig: it.id + '|' + it.name + '|' + it.image, html: hangingGarmentHTML(it) };
    }), {
      initial: false, flip: true,
      enter: { kf: [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], d: 250 },
      exit: { kf: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], d: 250 }
    });
    update();
    window.setTimeout(update, 300);
  };
  return el;
}

/* ---------- Wardrobe section ---------- */
function initWardrobe(scope, parent) {
  var sec = fromHTML(
    '<section aria-labelledby="wardrobe-title" class="overflow-hidden rounded-2xl border border-line bg-panel">' +
      '<div class="flex items-center justify-between gap-4 border-b border-line px-6 py-4">' +
        '<div><h2 id="wardrobe-title" class="font-serif text-[28px] font-semibold leading-tight text-cream">Wardrobe</h2>' +
          '<p data-role="meta" class="text-sm text-muted"></p></div>' +
        '<button type="button" data-role="toggle" class="' + btnSecondary + '" aria-expanded="true">Close wardrobe</button>' +
      '</div>' +
      '<div data-role="open" class="relative overflow-hidden bg-[#121110]" hidden></div>' +
      '<div data-role="closed" class="overflow-hidden" hidden></div>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);

  var meta = sec.querySelector('[data-role=meta]');
  var toggle = sec.querySelector('[data-role=toggle]');
  var openWrap = sec.querySelector('[data-role=open]');
  var closedWrap = sec.querySelector('[data-role=closed]');
  var rail = createWardrobeRail();
  openWrap.appendChild(rail);
  var overlay = null;
  var overlayId = null;
  var current = { wardrobeOpen: true };

  toggle.addEventListener('click', function () { A.setWardrobeOpen(!Store.get().wardrobeOpen); });
  closedWrap.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-wardrobe]')) A.setWardrobeOpen(true);
  });

  function renderClosed(garmentCount, outfitCount) {
    closedWrap.innerHTML =
      '<div class="p-5"><div class="relative grid h-[240px] grid-cols-2 gap-1.5">' +
      [0, 1].map(function (door) {
        return '<button type="button" data-open-wardrobe tabindex="-1" aria-hidden="true" class="relative rounded-lg border border-line bg-raised transition-colors duration-150 hover:bg-[#232019]">' +
          '<span class="absolute top-1/2 h-16 w-1.5 -translate-y-1/2 rounded-full bg-gold/70 ' + (door === 0 ? 'right-4' : 'left-4') + '"></span></button>';
      }).join('') +
      '<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">' +
        '<p class="rounded-full bg-ink/80 px-4 py-1.5 text-sm text-muted">Wardrobe closed · ' + garmentCount + ' on the rail' +
          (outfitCount > 0 ? ' · ' + outfitCount + ' kept in outfit' : '') + '</p>' +
        '<button type="button" data-open-wardrobe class="' + btnPrimary + ' pointer-events-auto">Open wardrobe</button>' +
      '</div></div></div>';
  }

  function showOverlay(item) {
    if (!item) {
      if (overlay) {
        var o = overlay; overlay = null; overlayId = null;
        disposeTree(o);
        o.style.pointerEvents = 'none';
        var a = animate(o, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
        a.onfinish = function () { o.remove(); };
        window.setTimeout(function () { o.remove(); }, 320);
      }
      return;
    }
    if (overlay && overlayId === item.id) return;
    var fv = createFocusView(item, 'Put back');
    if (!overlay) {
      overlay = fromHTML('<div class="thin-scroll absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink/90 p-6 backdrop-blur-sm"></div>');
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) A.closePreview(); });
      openWrap.appendChild(overlay);
      animate(overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    } else {
      clearChildren(overlay);
    }
    overlayId = item.id;
    overlay.appendChild(fv);
    animateFocusIn(fv);
  }

  scope.mount(function (s) { return [s.items, s.outfitIds, s.previewId, s.wardrobeOpen]; }, function (v, first) {
    var items = v[0], outfitIds = v[1], previewId = v[2], open = v[3];
    var railAll = items.filter(function (i) { return sourceOf(i.category) === 'rail'; });
    var railItems = sortedByOrder(railAll.filter(function (i) { return outfitIds.indexOf(i.id) < 0; }));
    var inOutfit = railAll.length - railItems.length;
    var preview = railItems.find(function (i) { return i.id === previewId; }) || null;

    meta.textContent = railItems.length + ' on the rail' + (inOutfit > 0 ? ' · ' + inOutfit + ' in outfit' : '');
    toggle.textContent = open ? 'Close wardrobe' : 'Open wardrobe';
    toggle.setAttribute('aria-expanded', String(open));

    rail.update(railItems);
    renderClosed(railItems.length, inOutfit);
    showOverlay(open ? preview : null);

    if (first) {
      setOpen(openWrap, open, { immediate: true });
      setOpen(closedWrap, !open, { immediate: true });
    } else if (open !== current.wardrobeOpen) {
      if (open) setOpen(closedWrap, false, { fade: true }).then(function () { return setOpen(openWrap, true, { fade: true }); }).then(function () { rail.update(rail._items || railItems); });
      else setOpen(openWrap, false, { fade: true }).then(function () { return setOpen(closedWrap, true, { fade: true }); });
    }
    current.wardrobeOpen = open;
  });
}

/* ---------- Drawer ---------- */
var drawerMeta = {
  accessories: { title: 'Accessory drawer', empty: 'Every accessory is in the outfit.' },
  shoes: { title: 'Shoe drawer', empty: 'Every pair is in the outfit.' }
};

function initDrawer(scope, parent, kind) {
  var m = drawerMeta[kind];
  var sec = fromHTML(
    '<section aria-labelledby="' + kind + '-title" class="overflow-hidden rounded-2xl border border-line bg-panel">' +
      '<button type="button" data-role="toggle" aria-expanded="false" aria-controls="' + kind + '-content" class="group relative flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-150 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold">' +
        '<span><span id="' + kind + '-title" class="block font-serif text-2xl font-semibold text-cream">' + m.title + '</span>' +
          '<span data-role="count" class="text-sm text-muted"></span></span>' +
        '<span aria-hidden="true" class="absolute left-1/2 top-1/2 hidden h-2 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/60 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35)] transition-colors duration-150 group-hover:bg-gold sm:block"></span>' +
        '<span class="flex items-center gap-1.5 text-sm font-medium text-gold"><span data-role="word">Open</span>' +
          '<span data-role="chev" class="inline-flex transition-transform duration-200 ease-out">' + icon('ChevronDown', 16) + '</span></span>' +
      '</button>' +
      '<div id="' + kind + '-content" data-role="wrap" class="overflow-hidden" hidden>' +
        '<div data-role="inner" class="border-t border-line bg-[#100F0E] p-6 shadow-[inset_0_10px_18px_rgba(0,0,0,0.45)]">' +
          '<div data-role="body"></div>' +
        '</div>' +
      '</div>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);
  var toggle = sec.querySelector('[data-role=toggle]');
  var countEl = sec.querySelector('[data-role=count]');
  var word = sec.querySelector('[data-role=word]');
  var chev = sec.querySelector('[data-role=chev]');
  var wrap = sec.querySelector('[data-role=wrap]');
  var inner = sec.querySelector('[data-role=inner]');
  var body = sec.querySelector('[data-role=body]');
  var bodyKey = null;
  var wasOpen = null;

  toggle.addEventListener('click', function () { A.toggleDrawer(kind); });
  body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-preview]');
    if (b) A.previewItem(b.getAttribute('data-preview'));
  });

  scope.mount(function (s) { return [s.items, s.outfitIds, s.drawers[kind], s.previewId]; }, function (v, first) {
    var items = v[0], outfitIds = v[1], open = v[2], previewId = v[3];
    var all = items.filter(function (i) { return sourceOf(i.category) === kind; });
    var inside = sortedByOrder(all.filter(function (i) { return outfitIds.indexOf(i.id) < 0; }));
    var focused = inside.find(function (i) { return i.id === previewId; }) || null;

    countEl.textContent = inside.length + ' of ' + all.length + ' inside';
    word.textContent = open ? 'Close' : 'Open';
    chev.classList.toggle('rotate-180', open);
    toggle.setAttribute('aria-expanded', String(open));

    var key = focused ? 'focus:' + focused.id : inside.length === 0 ? 'empty' : 'grid';
    if (key === 'grid') {
      if (bodyKey !== 'grid') { clearChildren(body); body.appendChild(fromHTML('<ul class="grid grid-cols-3 gap-4 sm:grid-cols-4 xl:grid-cols-5"></ul>')); animate(body.firstElementChild, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); }
      body.firstElementChild.innerHTML = inside.map(function (item) {
        return '<li><button type="button" data-preview="' + esc(item.id) + '" aria-label="Bring forward ' + esc(item.name) + '" class="group w-full text-left focus-visible:outline-none">' +
          productImage(item.image, '', 'aspect-square w-full rounded-lg ring-1 ring-black/20 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-gold') +
          '<span class="mt-2 block truncate text-sm text-muted transition-colors duration-150 group-hover:text-cream">' + esc(item.name) + '</span></button></li>';
      }).join('');
    } else if (key !== bodyKey) {
      clearChildren(body);
      if (key === 'empty') {
        var p = fromHTML('<p class="py-6 text-center text-sm text-muted">' + m.empty + '</p>');
        body.appendChild(p);
        animate(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      } else {
        var fv = createFocusView(focused, 'Return to drawer');
        body.appendChild(fv);
        animateFocusIn(fv);
      }
    }
    bodyKey = key;

    if (first) {
      setOpen(wrap, open, { immediate: true });
    } else if (wasOpen !== open) {
      setOpen(wrap, open);
      animate(inner, open ? [{ transform: 'translateY(-28px)' }, { transform: 'none' }] : [{ transform: 'none' }, { transform: 'translateY(-28px)' }], { duration: 280 });
    }
    wasOpen = open;
  });
}

/* ---------- Mobile swipe list ---------- */
function swipeRowHTML(item, inOutfit) {
  return '<li class="relative overflow-hidden rounded-xl">' +
    '<div aria-hidden="true" class="absolute inset-0 flex items-center justify-between px-5 text-sm font-semibold">' +
      '<span data-role="hint-add" class="transition-opacity duration-150 opacity-0">Add to outfit →</span>' +
      '<span data-role="hint-ret" class="transition-opacity duration-150 opacity-0">← Return</span>' +
    '</div>' +
    '<div data-role="drag" class="relative z-10 flex touch-pan-y items-center gap-4 border border-line bg-raised p-3" style="border-radius:12px">' +
      productImage(item.image, '', 'h-20 w-16 shrink-0 rounded-md') +
      '<div class="min-w-0 flex-1"><p class="truncate text-base font-medium text-cream">' + esc(item.name) + '</p>' +
        '<p class="text-sm text-muted">' + esc(item.category) + '</p></div>' +
      (inOutfit
        ? '<span class="flex items-center gap-1 whitespace-nowrap rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">' + icon('Check', 13) + ' In outfit</span>'
        : '<button type="button" data-view="' + esc(item.id) + '" class="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-gold transition-colors duration-150 hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">View</button>') +
    '</div></li>';
}

function bindSwipeRow(li, item, inOutfit) {
  var THRESHOLD = 80;
  var hintAdd = li.querySelector('[data-role=hint-add]');
  var hintRet = li.querySelector('[data-role=hint-ret]');
  function setDx(dx) {
    var a = dx > 20 && !inOutfit, r = dx < -20 && inOutfit;
    hintAdd.classList.toggle('text-gold', a); hintAdd.classList.toggle('opacity-100', a); hintAdd.classList.toggle('opacity-0', !a);
    hintRet.classList.toggle('text-gold', r); hintRet.classList.toggle('opacity-100', r); hintRet.classList.toggle('opacity-0', !r);
  }
  makeDrag(li.querySelector('[data-role=drag]'), {
    constrained: true,
    elasticLeft: inOutfit ? 0.7 : 0.05,
    elasticRight: inOutfit ? 0.05 : 0.7,
    onDrag: setDx,
    onEnd: function (dx) {
      setDx(0);
      if (dx > THRESHOLD && !inOutfit) { A.addToOutfit(item.id, { announce: true }); A.markSwipeHintSeen(); }
      else if (dx < -THRESHOLD && inOutfit) { A.returnFromOutfit(item.id, { announce: true }); A.markSwipeHintSeen(); }
    }
  });
  var view = li.querySelector('[data-view]');
  if (view) view.addEventListener('click', function () {
    A.previewItem(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initSwipeList(scope, parent) {
  var sec = fromHTML(
    '<section aria-labelledby="swipe-title" class="rounded-2xl border border-line bg-panel p-5">' +
      '<h2 id="swipe-title" class="font-serif text-2xl font-semibold text-cream">Swipe to style</h2>' +
      '<p class="mt-1 text-sm text-muted">Swipe right to add · swipe left to return</p>' +
      '<div data-role="hint" class="overflow-hidden" hidden>' +
        '<div class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">' +
          '<div class="flex items-center gap-4 text-sm font-medium text-gold">' +
            '<span class="flex items-center gap-1"><span class="nudge-left inline-flex">' + icon('ChevronsLeft', 18) + '</span>Return</span>' +
            '<span class="flex items-center gap-1">Add<span class="nudge-right inline-flex">' + icon('ChevronsRight', 18) + '</span></span>' +
          '</div>' +
          '<button type="button" data-role="gotit" class="text-sm font-semibold text-cream underline-offset-4 hover:underline">Got it</button>' +
        '</div>' +
      '</div>' +
      '<ul data-role="list" class="mt-4 flex flex-col gap-3"></ul>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);
  var hint = sec.querySelector('[data-role=hint]');
  var list = sec.querySelector('[data-role=list]');
  sec.querySelector('[data-role=gotit]').addEventListener('click', A.markSwipeHintSeen);

  scope.mount(function (s) { return [s.items, s.outfitIds]; }, function (v) {
    var railItems = sortedByOrder(v[0].filter(function (i) { return sourceOf(i.category) === 'rail'; }));
    var outfitIds = v[1];
    reconcile(list, railItems.map(function (item) {
      var inOutfit = outfitIds.indexOf(item.id) >= 0;
      return { key: item.id, sig: item.id + '|' + item.name + '|' + item.image + '|' + item.category + '|' + inOutfit, html: swipeRowHTML(item, inOutfit), item: item, inOutfit: inOutfit };
    }), {
      initial: false,
      afterCreate: function (el, en) { bindSwipeRow(el, en.item, en.inOutfit); }
    });
  });
  scope.mount(function (s) { return [s.swipeHintSeen]; }, function (v, first) {
    setOpen(hint, !v[0], { fade: true, immediate: false, duration: 250 });
  });
}
