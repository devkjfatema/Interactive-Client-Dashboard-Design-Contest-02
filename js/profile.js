/* ===== Profile: ProfileCard, InsightPanels, UploadGarment ===== */

var uploadFieldClass =
  'w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-muted/70 transition-colors duration-150 focus:border-gold focus:outline-none';

function initProfileCard(scope, parent) {
  var sec = fromHTML('<section aria-labelledby="client-name" class="rounded-2xl border border-line bg-panel p-6"></section>');
  parent.appendChild(sec);
  scope.track(sec);
  var busy = false;
  var profile = null;

  function render() {
    var fit = [['Size', profile.size], ['Height', profile.height], ['Chest', profile.chest], ['Waist', profile.waist], ['Inseam', profile.inseam], ['Shoe', profile.shoeSize]];
    sec.innerHTML =
      '<div class="flex items-center gap-4">' +
        '<div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gold/50 bg-paper"><img src="' + esc(profile.photo) + '" alt="' + esc(profile.name) + ', client" class="h-full w-full object-cover" /></div>' +
        '<div class="min-w-0"><p class="text-sm text-gold">Client</p>' +
          '<h2 id="client-name" class="truncate font-serif text-[28px] font-semibold leading-tight text-cream">' + esc(profile.name) + '</h2>' +
          '<p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted">' + icon('MapPin', 14, 'shrink-0') + '<span class="truncate">' + esc(profile.location) + '</span></p></div>' +
      '</div>' +
      '<input type="file" data-role="file" accept="' + ACCEPTED_IMAGE_TYPES.join(',') + '" class="sr-only" tabindex="-1" />' +
      '<button type="button" data-role="upload" ' + (busy ? 'disabled ' : '') + 'class="' + btnSecondary + ' mt-5 w-full">' +
        (busy ? icon('Loader2', 16, 'animate-spin') : icon('Camera', 16)) + (busy ? 'Uploading…' : 'Upload photo') + '</button>' +
      '<div class="mt-6 border-t border-line pt-5"><h3 class="text-sm font-medium text-cream">Fit profile</h3>' +
        '<dl class="mt-3 grid grid-cols-3 gap-x-3 gap-y-3">' + fit.map(function (kv) {
          return '<div class="min-w-0"><dt class="text-xs text-muted">' + kv[0] + '</dt><dd class="truncate text-sm text-cream">' + esc(kv[1]) + '</dd></div>';
        }).join('') + '</dl></div>' +
      '<div class="mt-5"><h3 class="text-sm font-medium text-cream">Preferences</h3>' +
        '<ul class="mt-2 flex flex-wrap gap-2">' + profile.preferences.filter(Boolean).map(function (p) {
          return '<li class="rounded-full bg-raised px-3 py-1 text-sm text-cream/90">' + esc(p) + '</li>';
        }).join('') + '</ul></div>' +
      '<p class="mt-5 text-sm text-muted">Member since <span class="text-cream">' + esc(profile.memberSince) + '</span></p>';
  }

  sec.addEventListener('click', function (e) {
    if (e.target.closest('[data-role=upload]')) sec.querySelector('[data-role=file]').click();
  });
  sec.addEventListener('change', async function (e) {
    if (!e.target.matches('[data-role=file]')) return;
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (ACCEPTED_IMAGE_TYPES.indexOf(file.type) < 0) {
      A.pushToast({ title: 'Unsupported file', description: 'Choose a JPG, PNG or WebP image.', tone: 'error' });
      return;
    }
    busy = true; render();
    try {
      var url = await readImageFile(file, 600);
      A.updateProfile({ photo: url });
      A.pushToast({ title: 'Profile photo updated', tone: 'success' });
    } catch (err) {
      A.pushToast({ title: 'Could not read that image', tone: 'error' });
    } finally {
      busy = false; render();
    }
  });

  scope.mount(function (s) { return [s.profile]; }, function (v) { profile = v[0]; render(); });
}

function initInsightPanels(scope, parent) {
  var sec = fromHTML('<section aria-label="Client insights" class="overflow-hidden rounded-2xl border border-line bg-panel"></section>');
  parent.appendChild(sec);
  scope.track(sec);
  var keys = ['colour', 'image', 'style'];
  var titles = { colour: 'Colour', image: 'Image', style: 'Style' };
  var openKey = 'colour';

  sec.innerHTML = keys.map(function (k, idx) {
    return '<div class="' + (idx > 0 ? 'border-t border-line' : '') + '">' +
      '<h3><button type="button" data-panel="' + k + '" aria-expanded="false" aria-controls="panel-' + k + '" class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-150 hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold">' +
        '<span><span class="block font-serif text-xl font-semibold text-cream">' + titles[k] + '</span><span data-meta="' + k + '" class="text-sm text-muted"></span></span>' +
        '<span data-chev="' + k + '" class="inline-flex text-gold transition-transform duration-200 ease-out">' + icon('ChevronDown', 18) + '</span>' +
      '</button></h3>' +
      '<div id="panel-' + k + '" data-wrap="' + k + '" class="overflow-hidden" hidden><div data-content="' + k + '" class="px-6 pb-6"></div></div>' +
    '</div>';
  }).join('');

  function applyOpen(animateIt) {
    keys.forEach(function (k) {
      var isOpen = openKey === k;
      sec.querySelector('[data-panel=' + k + ']').setAttribute('aria-expanded', String(isOpen));
      sec.querySelector('[data-chev=' + k + ']').classList.toggle('rotate-180', isOpen);
      setOpen(sec.querySelector('[data-wrap=' + k + ']'), isOpen, { fade: true, duration: 260, immediate: !animateIt });
    });
  }
  sec.addEventListener('click', function (e) {
    var b = e.target.closest('[data-panel]');
    if (!b) return;
    var k = b.getAttribute('data-panel');
    openKey = openKey === k ? null : k;
    applyOpen(true);
  });

  scope.mount(function (s) { return [s.palette, s.moodboard, s.profile]; }, function (v, first) {
    var palette = v[0], moodboard = v[1], profile = v[2];
    sec.querySelector('[data-meta=colour]').textContent = palette.length + ' swatches';
    sec.querySelector('[data-meta=image]').textContent = 'Body silhouette';
    sec.querySelector('[data-meta=style]').textContent = moodboard.length + ' references';

    sec.querySelector('[data-content=colour]').innerHTML = palette.length === 0
      ? '<p class="text-sm text-muted">No swatches yet.</p>'
      : '<ul class="grid grid-cols-3 gap-3">' + palette.map(function (s) {
          return '<li><span class="block h-12 rounded-lg border border-white/10" style="background-color:' + esc(s.hex) + '" aria-hidden="true"></span>' +
            '<span class="mt-1.5 block truncate text-sm text-cream">' + esc(s.name) + '</span>' +
            '<span class="block text-xs uppercase text-muted">' + esc(s.hex) + '</span></li>';
        }).join('') + '</ul>';

    sec.querySelector('[data-content=image]').innerHTML =
      '<figure>' + productImage(bodySilhouetteUrl, 'Full-length reference photo for ' + profile.name, 'aspect-[3/4] w-full rounded-xl') +
      '<figcaption class="mt-3 text-sm text-muted">' + esc(profile.bodyShape) + '</figcaption></figure>';

    sec.querySelector('[data-content=style]').innerHTML = moodboard.length === 0
      ? '<p class="text-sm text-muted">No mood board images yet.</p>'
      : '<ul class="grid grid-cols-2 gap-3">' + moodboard.map(function (m) {
          return '<li>' + productImage(m.url, m.caption, 'aspect-[4/5] w-full rounded-lg') +
            '<span class="mt-1.5 block truncate text-sm text-cream">' + esc(m.caption) + '</span></li>';
        }).join('') + '</ul>';

    if (first) applyOpen(false);
  });
}

function initUploadGarment(scope, parent) {
  var sec = fromHTML('<section aria-labelledby="upload-title" class="rounded-2xl border border-line bg-panel p-6"></section>');
  parent.appendChild(sec);
  scope.track(sec);
  var st = { image: null, fileName: '', category: 'Tops', name: '', error: null, dragOver: false, reading: false };

  function render() {
    sec.innerHTML =
      '<h2 id="upload-title" class="font-serif text-2xl font-semibold text-cream">Upload garment</h2>' +
      '<p data-role="dest" class="mt-1 text-sm text-muted">Goes straight to the ' + sourceLabel(sourceOf(st.category)) + '.</p>' +
      '<form data-role="form" class="mt-4 flex flex-col gap-4">' +
        '<input type="file" data-role="file" accept="' + ACCEPTED_IMAGE_TYPES.join(',') + '" class="sr-only" tabindex="-1" />' +
        (st.image
          ? '<div class="flex items-center gap-4 rounded-xl border border-line bg-raised p-3">' +
              '<div class="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-paper"><img src="' + esc(st.image) + '" alt="Selected garment preview" class="h-full w-full object-cover" /></div>' +
              '<div class="min-w-0 flex-1"><p class="truncate text-sm text-cream">' + esc(st.fileName) + '</p>' +
                '<button type="button" data-role="replace" class="mt-1 text-sm font-medium text-gold hover:underline">Replace photo</button></div>' +
              '<button type="button" data-role="remove" aria-label="Remove selected photo" class="rounded-md p-1.5 text-muted transition-colors duration-150 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' + icon('X', 16) + '</button>' +
            '</div>'
          : '<button type="button" data-role="drop" class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ' +
              (st.dragOver ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/60 hover:bg-raised') + '">' +
              (st.reading ? icon('Loader2', 22, 'animate-spin text-gold') : icon('ImagePlus', 22, 'text-gold')) +
              '<span class="text-sm text-cream">Drag &amp; drop or <span class="font-semibold text-gold">browse</span></span>' +
              '<span class="text-xs text-muted">JPG, PNG or WebP</span></button>') +
        (st.error ? '<p role="alert" class="text-sm text-danger">' + esc(st.error) + '</p>' : '') +
        '<label class="block"><span class="mb-1.5 block text-sm text-muted">Category</span>' +
          '<select data-role="category" class="' + uploadFieldClass + '">' + categories.map(function (c) {
            return '<option value="' + c + '"' + (c === st.category ? ' selected' : '') + '>' + c + '</option>';
          }).join('') + '</select></label>' +
        '<label class="block"><span class="mb-1.5 block text-sm text-muted">Name <span class="text-muted/70">(optional)</span></span>' +
          '<input data-role="name" value="' + esc(st.name) + '" placeholder="e.g. Charcoal roll-neck" class="' + uploadFieldClass + '" /></label>' +
        '<button type="submit" ' + (st.reading ? 'disabled ' : '') + 'class="' + btnPrimary + '">Add to wardrobe · ' + CREDIT_COSTS.upload + ' credits</button>' +
      '</form>';
  }

  async function handleFile(file) {
    if (!file) return;
    if (ACCEPTED_IMAGE_TYPES.indexOf(file.type) < 0) { st.error = 'Please choose a JPG, PNG or WebP image.'; render(); return; }
    st.error = null; st.reading = true; render();
    try {
      st.image = await readImageFile(file);
      st.fileName = file.name;
    } catch (err) {
      st.error = 'That image could not be read. Try another file.';
    } finally {
      st.reading = false; render();
    }
  }
  function reset() { st.image = null; st.fileName = ''; st.name = ''; render(); }
  function pickFile() { var f = sec.querySelector('[data-role=file]'); if (f) f.click(); }

  sec.addEventListener('click', function (e) {
    if (e.target.closest('[data-role=drop]') || e.target.closest('[data-role=replace]')) { pickFile(); return; }
    if (e.target.closest('[data-role=remove]')) reset();
  });
  sec.addEventListener('change', function (e) {
    if (e.target.matches('[data-role=file]')) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      handleFile(f);
    } else if (e.target.matches('[data-role=category]')) {
      st.category = e.target.value;
      sec.querySelector('[data-role=dest]').textContent = 'Goes straight to the ' + sourceLabel(sourceOf(st.category)) + '.';
    }
  });
  sec.addEventListener('input', function (e) { if (e.target.matches('[data-role=name]')) st.name = e.target.value; });
  sec.addEventListener('dragover', function (e) {
    var d = e.target.closest('[data-role=drop]');
    if (!d) return;
    e.preventDefault();
    if (!st.dragOver) { st.dragOver = true; d.className = d.className.replace('border-line hover:border-gold/60 hover:bg-raised', 'border-gold bg-gold/10'); }
  });
  sec.addEventListener('dragleave', function (e) {
    var d = e.target.closest('[data-role=drop]');
    if (!d) return;
    st.dragOver = false;
    d.className = d.className.replace('border-gold bg-gold/10', 'border-line hover:border-gold/60 hover:bg-raised');
  });
  sec.addEventListener('drop', function (e) {
    if (!e.target.closest('[data-role=drop]')) return;
    e.preventDefault();
    st.dragOver = false;
    handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  sec.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!st.image) { st.error = 'Add a photo first.'; render(); return; }
    if (A.uploadGarment({ image: st.image, category: st.category, name: st.name })) reset();
  });

  render();
}
