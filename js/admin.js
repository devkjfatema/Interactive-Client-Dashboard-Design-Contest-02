/* ===== Admin panel (staff mode) ===== */

var imgFileAccept = ACCEPTED_IMAGE_TYPES.join(',');

/* ---------- Items tab ---------- */
function adminItemRowHTML(item) {
  return '<li data-id="' + esc(item.id) + '" class="flex gap-3 border-b border-line py-4 last:border-0">' +
    '<div data-role="preview"></div>' +
    '<div class="grid min-w-0 flex-1 grid-cols-2 gap-2">' +
      '<label class="col-span-2 sm:col-span-1"><span class="sr-only">Name</span><input data-f="name" class="' + adminInput + '" /></label>' +
      '<label class="col-span-2 sm:col-span-1"><span class="sr-only">Category</span><select data-f="category" class="' + adminInput + '">' +
        categories.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label class="col-span-2 flex gap-2"><span class="sr-only">Image URL</span>' +
        '<input data-f="image" class="' + adminInput + '" />' +
        '<input type="file" data-f="file" accept="' + imgFileAccept + '" class="sr-only" tabindex="-1" />' +
        '<button type="button" data-act="upload" class="' + adminDelete + '">' + icon('ImageUp', 16) + '</button></label>' +
      '<p data-role="note" class="col-span-2 text-xs text-muted"></p>' +
    '</div>' +
    '<button type="button" data-act="delete" class="' + adminDelete + '">' + icon('Trash2', 16) + '</button>' +
  '</li>';
}

function syncItemRow(li, item, inOutfit) {
  if (li._image !== item.image) {
    li._image = item.image;
    var prev = li.querySelector('[data-role=preview]');
    prev.innerHTML = productImage(item.image, '', 'h-24 w-[72px] shrink-0 rounded-md');
  }
  var isData = item.image.indexOf('data:') === 0;
  setIfIdle(li.querySelector('[data-f=name]'), item.name);
  setIfIdle(li.querySelector('[data-f=category]'), item.category);
  var img = li.querySelector('[data-f=image]');
  setIfIdle(img, isData ? '' : item.image);
  img.placeholder = isData ? 'Uploaded photo — paste a URL to replace' : 'https://…';
  li.querySelector('[data-f=name]').setAttribute('aria-label', 'Name');
  li.querySelector('[data-act=upload]').setAttribute('aria-label', 'Upload new photo for ' + item.name);
  li.querySelector('[data-act=delete]').setAttribute('aria-label', 'Delete ' + item.name);
  li.querySelector('[data-role=note]').textContent =
    'In the ' + sourceLabel(sourceOf(item.category)) + (inOutfit ? ' · currently in outfit' : '');
}

function initAdminItems(scope, box) {
  var st = { name: '', category: 'Tops', image: '', error: null };
  box.innerHTML =
    '<div class="flex flex-col gap-6">' +
      '<form data-role="form" class="' + adminCard + '">' +
        '<h3 class="text-sm font-semibold text-cream">Add item</h3>' +
        '<div class="mt-3 grid grid-cols-2 gap-3">' +
          '<label><span class="' + adminLabel + '">Name</span><input data-role="name" placeholder="Navy chinos" class="' + adminInput + '" /></label>' +
          '<label><span class="' + adminLabel + '">Category</span><select data-role="category" class="' + adminInput + '">' +
            categories.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label>' +
          '<label class="col-span-2"><span class="' + adminLabel + '">Image URL</span><input data-role="image" placeholder="https://images.unsplash.com/…" class="' + adminInput + '" /></label>' +
        '</div>' +
        '<p data-role="error" class="mt-2 hidden text-sm text-danger"></p>' +
        '<input type="file" data-role="file" accept="' + imgFileAccept + '" class="sr-only" tabindex="-1" />' +
        '<div class="mt-4 flex gap-2">' +
          '<button type="button" data-role="upload" class="' + btnSecondary + '">Upload photo</button>' +
          '<button type="submit" class="' + btnPrimary + '">Add item</button>' +
        '</div>' +
      '</form>' +
      '<div><h3 data-role="title" class="text-sm font-semibold text-cream"></h3><ul data-role="list" class="mt-1"></ul></div>' +
    '</div>';
  var $ = function (r) { return box.querySelector('[data-role=' + r + ']'); };
  var nameIn = $('name'), catIn = $('category'), imageIn = $('image'), errEl = $('error'), fileIn = $('file'), list = $('list');

  function showError(msg) { st.error = msg; errEl.textContent = msg || ''; errEl.classList.toggle('hidden', !msg); }

  nameIn.addEventListener('input', function () { st.name = nameIn.value; });
  catIn.addEventListener('change', function () { st.category = catIn.value; });
  imageIn.addEventListener('input', function () { st.image = imageIn.value; });
  $('upload').addEventListener('click', function () { fileIn.click(); });
  fileIn.addEventListener('change', async function () {
    var f = fileIn.files && fileIn.files[0];
    fileIn.value = '';
    if (f && ACCEPTED_IMAGE_TYPES.indexOf(f.type) >= 0) {
      st.image = await readImageFile(f);
      imageIn.value = 'Uploaded photo ready';
    }
  });
  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!st.image.trim()) { showError('Add an image URL or upload a photo.'); return; }
    A.adminAddItem({ name: st.name, category: st.category, image: st.image.trim() });
    st.name = ''; st.image = ''; nameIn.value = ''; imageIn.value = '';
    showError(null);
  });

  // row events (delegated)
  list.addEventListener('input', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id'), f = e.target.getAttribute('data-f');
    if (f === 'name') A.updateItem(id, { name: e.target.value });
    else if (f === 'image') A.updateItem(id, { image: e.target.value });
  });
  list.addEventListener('change', async function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id'), f = e.target.getAttribute('data-f');
    if (f === 'category') A.updateItem(id, { category: e.target.value });
    else if (f === 'file') {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file || ACCEPTED_IMAGE_TYPES.indexOf(file.type) < 0) return;
      try { A.updateItem(id, { image: await readImageFile(file) }); }
      catch (err) { A.pushToast({ title: 'Could not read that image', tone: 'error' }); }
    }
  });
  list.addEventListener('click', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id');
    if (e.target.closest('[data-act=upload]')) li.querySelector('[data-f=file]').click();
    else if (e.target.closest('[data-act=delete]')) {
      var item = Store.get().items.find(function (i) { return i.id === id; });
      A.deleteItem(id);
      if (item) A.pushToast({ title: item.name + ' deleted', tone: 'info' });
    }
  });

  scope.mount(function (s) { return [s.items, s.outfitIds]; }, function (v) {
    var items = v[0], outfitIds = v[1];
    var sorted = sortedByOrder(items);
    $('title').textContent = 'All items (' + items.length + ')';
    reconcile(list, sorted.map(function (it) { return { key: it.id, sig: it.id, html: adminItemRowHTML(it) }; }));
    sorted.forEach(function (it) {
      var li = Array.prototype.find.call(list.children, function (c) { return c._key === it.id; });
      if (li) syncItemRow(li, it, outfitIds.indexOf(it.id) >= 0);
    });
  });
}

/* ---------- Profile tab ---------- */
function initAdminProfile(scope, box) {
  var fields = [
    ['name', 'Name'], ['location', 'Location'], ['size', 'Size'], ['height', 'Height'], ['chest', 'Chest'],
    ['waist', 'Waist'], ['inseam', 'Inseam'], ['shoeSize', 'Shoe size'], ['memberSince', 'Member since'], ['bodyShape', 'Body shape notes', true]
  ];
  box.innerHTML = '<div class="grid grid-cols-2 gap-4">' +
    fields.map(function (f) {
      return '<label class="' + (f[2] ? 'col-span-2' : '') + '"><span class="' + adminLabel + '">' + f[1] + '</span><input data-f="' + f[0] + '" class="' + adminInput + '" /></label>';
    }).join('') +
    '<label class="col-span-2"><span class="' + adminLabel + '">Preferences (comma separated)</span><textarea rows="2" data-f="preferences" class="' + adminInput + '"></textarea></label>' +
    '<label class="col-span-2"><span class="' + adminLabel + '">Profile photo URL</span><input data-f="photo" class="' + adminInput + '" /></label>' +
    '</div>';
  var prefs = box.querySelector('[data-f=preferences]');

  box.addEventListener('input', function (e) {
    var f = e.target.getAttribute('data-f');
    if (!f) return;
    if (f === 'preferences') {
      A.updateProfile({
        preferences: e.target.value.split(',').map(function (p) { return p.replace(/^\s+/, ''); })
          .filter(function (p, i, arr) { return p.length > 0 || i === arr.length - 1; })
      });
    } else {
      var patch = {}; patch[f] = e.target.value; A.updateProfile(patch);
    }
  });
  prefs.addEventListener('blur', function () {
    A.updateProfile({ preferences: prefs.value.split(',').map(function (p) { return p.trim(); }).filter(Boolean) });
    prefs.value = Store.get().profile.preferences.join(', ');
  });

  scope.mount(function (s) { return [s.profile]; }, function (v) {
    var p = v[0];
    fields.forEach(function (f) { setIfIdle(box.querySelector('[data-f=' + f[0] + ']'), p[f[0]]); });
    setIfIdle(prefs, p.preferences.join(', '));
    var photo = box.querySelector('[data-f=photo]');
    var isData = p.photo.indexOf('data:') === 0;
    setIfIdle(photo, isData ? '' : p.photo);
    photo.placeholder = isData ? 'Uploaded photo — paste a URL to replace' : 'https://…';
  });
}

/* ---------- Palette tab ---------- */
function initAdminPalette(scope, box) {
  box.innerHTML = '<div><ul data-role="list" class="flex flex-col gap-3"></ul>' +
    '<button type="button" data-role="add" class="' + btnSecondary + ' mt-4">' + icon('Plus', 16) + ' Add swatch</button></div>';
  var list = box.querySelector('[data-role=list]');
  box.querySelector('[data-role=add]').addEventListener('click', A.addSwatch);

  list.addEventListener('input', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id'), f = e.target.getAttribute('data-f');
    if (f === 'color') A.updateSwatch(id, { hex: e.target.value.toUpperCase() });
    else if (f === 'name') A.updateSwatch(id, { name: e.target.value });
    else if (f === 'hex') A.updateSwatch(id, { hex: e.target.value });
  });
  list.addEventListener('click', function (e) {
    var del = e.target.closest('[data-act=delete]');
    if (del) A.deleteSwatch(del.closest('li').getAttribute('data-id'));
  });

  scope.mount(function (s) { return [s.palette]; }, function (v) {
    var palette = v[0];
    reconcile(list, palette.map(function (sw) {
      return { key: sw.id, sig: sw.id, html:
        '<li data-id="' + esc(sw.id) + '" class="flex items-center gap-3">' +
          '<label data-role="chip" class="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line"><span class="sr-only">Pick colour</span>' +
            '<input type="color" data-f="color" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>' +
          '<input aria-label="Swatch name" data-f="name" class="' + adminInput + '" />' +
          '<input aria-label="Hex value" data-f="hex" class="' + adminInput + ' w-28 shrink-0 uppercase" />' +
          '<button type="button" data-act="delete" class="' + adminDelete + '">' + icon('Trash2', 16) + '</button></li>' };
    }));
    palette.forEach(function (sw) {
      var li = Array.prototype.find.call(list.children, function (c) { return c._key === sw.id; });
      if (!li) return;
      li.querySelector('[data-role=chip]').style.backgroundColor = sw.hex;
      li.querySelector('[data-role=chip] span').textContent = 'Pick colour for ' + sw.name;
      var colorIn = li.querySelector('[data-f=color]');
      if (/^#[0-9a-f]{6}$/i.test(sw.hex) && colorIn.value.toLowerCase() !== sw.hex.toLowerCase()) colorIn.value = sw.hex.toLowerCase();
      setIfIdle(li.querySelector('[data-f=name]'), sw.name);
      setIfIdle(li.querySelector('[data-f=hex]'), sw.hex);
      li.querySelector('[data-act=delete]').setAttribute('aria-label', 'Delete ' + sw.name);
    });
  });
}

/* ---------- Mood board tab ---------- */
function initAdminMoodboard(scope, box) {
  box.innerHTML =
    '<div class="flex flex-col gap-6">' +
      '<form data-role="form" class="' + adminCard + '">' +
        '<h3 class="text-sm font-semibold text-cream">Add image</h3>' +
        '<div class="mt-3 grid gap-3">' +
          '<label><span class="' + adminLabel + '">Image URL</span><input data-role="url" placeholder="https://images.unsplash.com/…" class="' + adminInput + '" /></label>' +
          '<label><span class="' + adminLabel + '">Caption</span><input data-role="caption" placeholder="Riviera linen" class="' + adminInput + '" /></label>' +
        '</div>' +
        '<button type="submit" data-role="submit" disabled class="' + btnPrimary + ' mt-4">Add to mood board</button>' +
      '</form>' +
      '<ul data-role="list" class="flex flex-col gap-4"></ul>' +
    '</div>';
  var $ = function (r) { return box.querySelector('[data-role=' + r + ']'); };
  var urlIn = $('url'), capIn = $('caption'), submit = $('submit'), list = $('list');
  urlIn.addEventListener('input', function () { submit.disabled = !urlIn.value.trim(); });
  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!urlIn.value.trim()) return;
    A.addMoodImage(urlIn.value.trim(), capIn.value.trim());
    urlIn.value = ''; capIn.value = ''; submit.disabled = true;
  });
  list.addEventListener('input', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id'), f = e.target.getAttribute('data-f');
    if (f === 'caption') A.updateMoodImage(id, { caption: e.target.value });
    else if (f === 'url') A.updateMoodImage(id, { url: e.target.value });
  });
  list.addEventListener('click', function (e) {
    var del = e.target.closest('[data-act=delete]');
    if (del) A.deleteMoodImage(del.closest('li').getAttribute('data-id'));
  });

  scope.mount(function (s) { return [s.moodboard]; }, function (v) {
    var mood = v[0];
    reconcile(list, mood.map(function (m) {
      return { key: m.id, sig: m.id, html:
        '<li data-id="' + esc(m.id) + '" class="flex gap-3"><div data-role="preview"></div>' +
          '<div class="grid min-w-0 flex-1 gap-2"><input aria-label="Caption" data-f="caption" class="' + adminInput + '" />' +
          '<input aria-label="Image URL" data-f="url" class="' + adminInput + '" /></div>' +
          '<button type="button" data-act="delete" class="' + adminDelete + '">' + icon('Trash2', 16) + '</button></li>' };
    }));
    mood.forEach(function (m) {
      var li = Array.prototype.find.call(list.children, function (c) { return c._key === m.id; });
      if (!li) return;
      if (li._url !== m.url) { li._url = m.url; li.querySelector('[data-role=preview]').innerHTML = productImage(m.url, '', 'h-20 w-16 shrink-0 rounded-md'); }
      setIfIdle(li.querySelector('[data-f=caption]'), m.caption);
      setIfIdle(li.querySelector('[data-f=url]'), m.url);
      li.querySelector('[data-act=delete]').setAttribute('aria-label', 'Delete ' + m.caption);
    });
  });
}

/* ---------- Credits tab ---------- */
function initAdminCredits(scope, box) {
  box.innerHTML =
    '<div class="flex flex-col gap-6">' +
      '<div class="' + adminCard + '">' +
        '<h3 class="text-sm font-semibold text-cream">Starting credits</h3>' +
        '<p data-role="balance" class="mt-1 text-sm text-muted"></p>' +
        '<div class="mt-3 flex items-end gap-3">' +
          '<label class="flex-1"><span class="' + adminLabel + '">Starting balance</span><input type="number" min="0" data-role="starting" class="' + adminInput + '" /></label>' +
          '<button type="button" data-role="reset" class="' + btnSecondary + '">Reset balance</button>' +
        '</div>' +
      '</div>' +
      '<div><h3 class="text-sm font-semibold text-cream">Credit packages</h3>' +
        '<div class="mt-3 grid grid-cols-[1fr_88px_88px_36px] gap-2 text-xs font-medium text-muted"><span>Label</span><span>Credits</span><span>Price (£)</span><span></span></div>' +
        '<ul data-role="list" class="mt-2 flex flex-col gap-2"></ul>' +
        '<button type="button" data-role="add" class="' + btnSecondary + ' mt-4">' + icon('Plus', 16) + ' Add package</button>' +
      '</div>' +
    '</div>';
  var $ = function (r) { return box.querySelector('[data-role=' + r + ']'); };
  var starting = $('starting'), list = $('list');
  starting.addEventListener('input', function () { A.setStartingCredits(Number(starting.value) || 0); });
  $('reset').addEventListener('click', A.resetBalance);
  $('add').addEventListener('click', A.addPackage);
  list.addEventListener('input', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    var id = li.getAttribute('data-id'), f = e.target.getAttribute('data-f');
    if (f === 'label') A.updatePackage(id, { label: e.target.value });
    else if (f === 'credits') A.updatePackage(id, { credits: Math.max(0, Number(e.target.value) || 0) });
    else if (f === 'price') A.updatePackage(id, { price: Math.max(0, Number(e.target.value) || 0) });
  });
  list.addEventListener('click', function (e) {
    var del = e.target.closest('[data-act=delete]');
    if (del) A.deletePackage(del.closest('li').getAttribute('data-id'));
  });

  scope.mount(function (s) { return [s.packages, s.startingCredits, s.credits]; }, function (v) {
    var packages = v[0];
    $('balance').textContent = 'Current balance: ' + v[2] + ' credits';
    setIfIdle(starting, v[1]);
    reconcile(list, packages.map(function (p) {
      return { key: p.id, sig: p.id, html:
        '<li data-id="' + esc(p.id) + '" class="grid grid-cols-[1fr_88px_88px_36px] items-center gap-2">' +
          '<input aria-label="Package label" data-f="label" class="' + adminInput + '" />' +
          '<input aria-label="Credits" type="number" min="1" data-f="credits" class="' + adminInput + '" />' +
          '<input aria-label="Price" type="number" min="0" step="0.5" data-f="price" class="' + adminInput + '" />' +
          '<button type="button" data-act="delete" class="' + adminDelete + '">' + icon('Trash2', 16) + '</button></li>' };
    }));
    packages.forEach(function (p) {
      var li = Array.prototype.find.call(list.children, function (c) { return c._key === p.id; });
      if (!li) return;
      setIfIdle(li.querySelector('[data-f=label]'), p.label);
      setIfIdle(li.querySelector('[data-f=credits]'), p.credits);
      setIfIdle(li.querySelector('[data-f=price]'), p.price);
      li.querySelector('[data-act=delete]').setAttribute('aria-label', 'Delete ' + p.label);
    });
  });
}

/* ---------- Panel shell ---------- */
function initAdminPanel(scope, holder) {
  var tabs = [
    { key: 'items', label: 'Wardrobe items', init: initAdminItems },
    { key: 'profile', label: 'Client profile', init: initAdminProfile },
    { key: 'palette', label: 'Colour palette', init: initAdminPalette },
    { key: 'moodboard', label: 'Mood board', init: initAdminMoodboard },
    { key: 'credits', label: 'Credits', init: initAdminCredits }
  ];
  var tab = 'items';
  var confirmReset = false;
  var backdrop = null, aside = null, tabScope = null, content = null, nav = null, underline = null, resetBtn = null;

  function onKey(e) { if (e.key === 'Escape') A.setAdminOpen(false); }

  function updateResetBtn() {
    if (!resetBtn) return;
    resetBtn.className = btnGhost + (confirmReset ? ' text-danger hover:text-danger' : '');
    resetBtn.innerHTML = icon('RotateCcw', 15) + (confirmReset ? 'Click again to reset everything' : 'Reset demo data');
  }

  function positionUnderline(animateIt) {
    if (!nav || !underline) return;
    var btn = nav.querySelector('[data-tab=' + tab + ']');
    if (!btn) return;
    underline.style.transition = animateIt ? 'left .28s ' + EASE_OUT_CSS + ', width .28s ' + EASE_OUT_CSS : 'none';
    underline.style.left = (btn.offsetLeft + 12) + 'px';
    underline.style.width = Math.max(0, btn.offsetWidth - 24) + 'px';
  }

  function renderTab() {
    if (tabScope) tabScope.dispose();
    tabScope = createScope();
    clearChildren(content);
    var def = tabs.find(function (t) { return t.key === tab; });
    def.init(tabScope, content);
    Array.prototype.forEach.call(nav.querySelectorAll('[data-tab]'), function (b) {
      var on = b.getAttribute('data-tab') === tab;
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      b.classList.toggle('text-gold', on);
      b.classList.toggle('text-muted', !on);
      b.classList.toggle('hover:text-cream', !on);
    });
  }

  function build() {
    backdrop = fromHTML('<div class="fixed inset-0 z-50 bg-black/60"></div>');
    aside = fromHTML(
      '<aside role="dialog" aria-modal="true" aria-labelledby="admin-title" class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[580px] flex-col border-l border-line bg-panel shadow-2xl shadow-black">' +
        '<div class="flex items-start justify-between gap-4 border-b border-line px-6 py-5">' +
          '<div><p class="text-sm font-medium text-gold">Staff mode</p>' +
            '<h2 id="admin-title" class="font-serif text-3xl font-semibold text-cream">Admin panel</h2>' +
            '<p class="mt-1 text-sm text-muted">Changes apply instantly and are saved in this browser.</p></div>' +
          '<button type="button" data-role="close" aria-label="Close admin panel" class="rounded-full p-2 text-muted transition-colors duration-150 hover:bg-raised hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' + icon('X', 18) + '</button>' +
        '</div>' +
        '<nav aria-label="Admin sections" data-role="nav" class="no-scrollbar relative flex gap-1 overflow-x-auto border-b border-line px-4">' +
          tabs.map(function (t) {
            return '<button type="button" data-tab="' + t.key + '" class="relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold">' + t.label + '</button>';
          }).join('') +
          '<span data-role="underline" class="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-gold"></span>' +
        '</nav>' +
        '<div data-role="content" class="thin-scroll flex-1 overflow-y-auto px-6 py-6"></div>' +
        '<div class="flex items-center justify-between gap-3 border-t border-line px-6 py-4">' +
          '<button type="button" data-role="reset"></button>' +
          '<button type="button" data-role="exit" class="' + btnSecondary + '">Exit staff mode</button>' +
        '</div>' +
      '</aside>'
    );
    nav = aside.querySelector('[data-role=nav]');
    underline = aside.querySelector('[data-role=underline]');
    content = aside.querySelector('[data-role=content]');
    resetBtn = aside.querySelector('[data-role=reset]');

    backdrop.addEventListener('click', function () { A.setAdminOpen(false); });
    aside.querySelector('[data-role=close]').addEventListener('click', function () { A.setAdminOpen(false); });
    aside.querySelector('[data-role=exit]').addEventListener('click', function () { A.setRole('client'); });
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b || b.getAttribute('data-tab') === tab) return;
      tab = b.getAttribute('data-tab');
      renderTab();
      positionUnderline(true);
    });
    resetBtn.addEventListener('click', function () {
      if (!confirmReset) { confirmReset = true; updateResetBtn(); return; }
      A.resetDemo();
      confirmReset = false; updateResetBtn();
    });

    holder.appendChild(backdrop);
    holder.appendChild(aside);
    updateResetBtn();
    renderTab();
    positionUnderline(false);
    animate(backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    animate(aside, [{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 280 });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', function () { positionUnderline(false); });
  }

  function destroy() {
    window.removeEventListener('keydown', onKey);
    confirmReset = false;
    if (tabScope) { tabScope.dispose(); tabScope = null; }
    var b = backdrop, a = aside;
    backdrop = aside = content = nav = underline = resetBtn = null;
    if (!b) return;
    b.style.pointerEvents = 'none';
    var anim = animate(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    animate(a, [{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 280, fill: 'forwards' });
    anim.onfinish = function () { b.remove(); };
    window.setTimeout(function () { b.remove(); a.remove(); }, 400);
  }

  scope.mount(function (s) { return [s.adminOpen]; }, function (v) {
    if (v[0] && !aside) build();
    else if (!v[0] && aside) destroy();
  });
}
