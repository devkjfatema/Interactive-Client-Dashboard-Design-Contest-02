/* ===== Outfit area: pieces, saved looks ===== */

function outfitPieceHTML(item) {
  var lbl = sourceLabel(sourceOf(item.category));
  return '<li class="relative">' +
    '<div data-role="drag" class="group cursor-grab touch-pan-y active:cursor-grabbing">' +
      '<div class="relative">' +
        productImage(item.image, item.name, 'aspect-[3/4] w-full rounded-lg ring-1 ring-black/20') +
        '<span data-role="ret" aria-hidden="true" class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-ink/70 text-sm font-semibold text-gold transition-opacity duration-150 opacity-0">← Return</span>' +
        '<button type="button" data-return="' + esc(item.id) + '" aria-label="Return ' + esc(item.name) + ' to the ' + lbl + '" title="Return to ' + lbl + '" class="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/85 text-cream transition-colors duration-150 hover:bg-ink hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' +
          icon('Undo2', 15) +
        '</button>' +
      '</div>' +
      '<p class="mt-2 truncate text-sm font-medium text-cream">' + esc(item.name) + '</p>' +
      '<p class="text-xs text-muted">' + esc(item.category) + '</p>' +
    '</div></li>';
}

function bindOutfitPiece(li, item) {
  var ret = li.querySelector('[data-role=ret]');
  function back() { A.returnFromOutfit(item.id, { announce: !isDesktop() }); }
  li.querySelector('[data-return]').addEventListener('click', back);
  makeDrag(li.querySelector('[data-role=drag]'), {
    constrained: true, elasticLeft: 0.6, elasticRight: 0.05,
    onDrag: function (dx) { ret.classList.toggle('opacity-100', dx < -30); ret.classList.toggle('opacity-0', !(dx < -30)); },
    onEnd: function (dx) {
      ret.classList.remove('opacity-100'); ret.classList.add('opacity-0');
      if (dx < -80) back();
    }
  });
}

function initSavedLooks(scope, parent) {
  var box = fromHTML(
    '<div class="border-t border-line px-6 py-5">' +
      '<h3 class="text-sm font-medium text-cream">Saved looks</h3>' +
      '<p data-role="empty" class="mt-2 text-sm text-muted">No saved looks yet. Build an outfit and press Save look.</p>' +
      '<ul data-role="list" class="mt-2 divide-y divide-line"></ul>' +
    '</div>'
  );
  parent.appendChild(box);
  var empty = box.querySelector('[data-role=empty]');
  var list = box.querySelector('[data-role=list]');
  list.addEventListener('click', function (e) {
    var load = e.target.closest('[data-load]');
    if (load) { A.loadLook(load.getAttribute('data-load')); return; }
    var del = e.target.closest('[data-delete]');
    if (del) A.deleteLook(del.getAttribute('data-delete'));
  });

  scope.mount(function (s) { return [s.savedLooks, s.items]; }, function (v) {
    var looks = v[0], items = v[1];
    empty.classList.toggle('hidden', looks.length !== 0);
    list.classList.toggle('hidden', looks.length === 0);
    reconcile(list, looks.map(function (look) {
      var pieces = look.itemIds.map(function (id) { return items.find(function (i) { return i.id === id; }); }).filter(Boolean);
      return {
        key: look.id,
        sig: look.id + '|' + look.name + '|' + pieces.map(function (p) { return p.id + p.image; }).join(','),
        html:
          '<li class="overflow-hidden"><div class="flex items-center gap-3 py-3">' +
            '<div class="flex -space-x-3">' + pieces.slice(0, 4).map(function (p) { return productImage(p.image, '', 'h-12 w-10 rounded-md ring-2 ring-panel'); }).join('') + '</div>' +
            '<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-cream">' + esc(look.name) + '</p>' +
              '<p class="truncate text-xs text-muted">' + pieceLabel(pieces.length) + ' · ' + formatDate(look.createdAt) + '</p></div>' +
            '<button type="button" data-load="' + esc(look.id) + '" class="rounded-full px-3 py-1.5 text-sm font-medium text-gold transition-colors duration-150 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Load</button>' +
            '<button type="button" data-delete="' + esc(look.id) + '" aria-label="Delete ' + esc(look.name) + '" class="rounded-full p-2 text-muted transition-colors duration-150 hover:bg-raised hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' + icon('Trash2', 15) + '</button>' +
          '</div></li>'
      };
    }), {
      initial: false,
      enter: { kf: [{ opacity: 0, height: '0px' }, { opacity: 1, height: 'auto' }], d: 220 },
      exit: { kf: [{ opacity: 1, height: 'auto' }, { opacity: 0, height: '0px' }], d: 220 }
    });
  });
}

function initOutfitArea(scope, parent) {
  var sec = fromHTML(
    '<section aria-labelledby="styling-title" class="overflow-hidden rounded-2xl border border-line bg-panel">' +
      '<div class="flex items-center justify-between gap-3 border-b border-line px-6 py-4">' +
        '<div class="min-w-0"><h2 id="styling-title" class="font-serif text-[28px] font-semibold leading-tight text-cream">Styling area</h2>' +
          '<div data-role="count-holder"></div></div>' +
        '<button type="button" data-role="toggle" aria-expanded="true" class="' + btnSecondary + '"></button>' +
      '</div>' +
      '<div data-role="body" class="overflow-hidden" hidden>' +
        '<div class="px-6 py-5">' +
          '<div data-role="empty" class="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 text-center">' +
            '<p class="font-serif text-xl text-cream">Start building a look</p>' +
            '<p class="mt-1 max-w-[260px] text-sm text-muted">Pick a garment from the rail or a drawer, then press Add to outfit or drag it right.</p>' +
          '</div>' +
          '<ul data-role="list" class="hidden grid-cols-2 gap-4 sm:grid-cols-3"></ul>' +
          '<p data-role="tip" class="mt-4 hidden text-xs text-muted">Drag a piece left or tap its return button to send it back.</p>' +
        '</div>' +
        '<div class="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">' +
          '<button type="button" data-role="clear" class="' + btnGhost + '">Clear outfit</button>' +
          '<div class="ml-auto flex flex-wrap gap-2">' +
            '<button type="button" data-role="review" class="' + btnSecondary + '">' + icon('Sparkles', 15) + ' Review · ' + CREDIT_COSTS.review + '</button>' +
            '<button type="button" data-role="save" class="' + btnPrimary + '">' + icon('BookmarkPlus', 15) + ' Save look · ' + CREDIT_COSTS.saveLook + '</button>' +
          '</div>' +
        '</div>' +
        '<div data-role="looks"></div>' +
      '</div>' +
      '<div data-role="hidden" class="overflow-hidden" hidden><p data-role="hidden-text" class="px-6 py-4 text-sm text-muted"></p></div>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);
  var $ = function (r) { return sec.querySelector('[data-role=' + r + ']'); };
  var countHolder = $('count-holder'), toggle = $('toggle'), body = $('body'), hiddenBox = $('hidden'), hiddenText = $('hidden-text');
  var empty = $('empty'), list = $('list'), tip = $('tip');
  var clear = $('clear'), review = $('review'), save = $('save');

  toggle.addEventListener('click', A.toggleStyling);
  clear.addEventListener('click', A.clearOutfit);
  review.addEventListener('click', A.requestReview);
  save.addEventListener('click', A.saveLook);
  initSavedLooks(scope, $('looks'));

  var prevOpen = null;
  scope.mount(function (s) { return [s.items, s.outfitIds, s.stylingOpen]; }, function (v, first) {
    var items = v[0], outfitIds = v[1], open = v[2];
    var pieces = outfitIds.map(function (id) { return items.find(function (i) { return i.id === id; }); }).filter(Boolean);

    // piece count (re-created per change, fades from 0.4 -> 1)
    var last = countHolder.firstElementChild;
    if (!last || last._n !== pieces.length) {
      var p = fromHTML('<p aria-live="polite" class="text-sm text-gold">' + pieceLabel(pieces.length) + '</p>');
      p._n = pieces.length;
      countHolder.innerHTML = '';
      countHolder.appendChild(p);
      if (!first) animate(p, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 300 });
    }

    toggle.innerHTML = icon(open ? 'EyeOff' : 'Eye', 16) + (open ? 'Close styling' : 'Open styling');
    toggle.setAttribute('aria-expanded', String(open));

    empty.classList.toggle('hidden', pieces.length !== 0);
    empty.classList.toggle('flex', pieces.length === 0);
    list.classList.toggle('hidden', pieces.length === 0);
    list.classList.toggle('grid', pieces.length > 0);
    tip.classList.toggle('hidden', pieces.length === 0);
    clear.disabled = review.disabled = save.disabled = !pieces.length;

    reconcile(list, pieces.map(function (item) {
      return { key: item.id, sig: item.id + '|' + item.name + '|' + item.image + '|' + item.category, html: outfitPieceHTML(item), item: item };
    }), {
      initial: false, flip: true,
      afterCreate: function (el, en) { bindOutfitPiece(el, en.item); },
      enter: { kf: [{ opacity: 0, transform: 'translateX(24px) scale(0.96)' }, { opacity: 1, transform: 'none' }], d: 250 },
      exit: { kf: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-40px) scale(0.96)' }], d: 250 }
    });

    hiddenText.textContent = 'Styling hidden — your ' + pieceLabel(pieces.length) + ' stay selected.';

    if (first) {
      setOpen(body, open, { immediate: true });
      setOpen(hiddenBox, !open, { immediate: true });
    } else if (prevOpen !== open) {
      setOpen(open ? hiddenBox : body, false, { fade: true, duration: 200 }).then(function () {
        return setOpen(open ? body : hiddenBox, true, { fade: true });
      });
    }
    prevOpen = open;
  });
}
