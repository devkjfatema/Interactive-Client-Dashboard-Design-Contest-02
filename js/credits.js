/* ===== Credits: CreditsPanel (mobile tab) + TopUpModal ===== */

function initCreditsPanel(scope, parent) {
  var costs = [
    { label: 'Save look', cost: CREDIT_COSTS.saveLook },
    { label: 'Request stylist review', cost: CREDIT_COSTS.review },
    { label: 'Upload garment', cost: CREDIT_COSTS.upload }
  ];
  var sec = fromHTML(
    '<section aria-labelledby="credits-title" class="rounded-2xl border border-line bg-panel p-6">' +
      '<h2 id="credits-title" class="text-sm text-muted">Credit balance</h2>' +
      '<span data-role="count" data-countup class="tabular-nums mt-1 block font-serif text-6xl font-semibold text-cream"></span>' +
      '<div class="mt-4 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true"><div data-role="bar" class="h-full rounded-full bg-gold transition-[width] duration-300 ease-out" style="width:0%"></div></div>' +
      '<button type="button" data-role="topup" class="' + btnPrimary + ' mt-6 w-full">' + icon('Plus', 16) + ' Top up credits</button>' +
      '<h3 class="mt-8 text-sm font-medium text-cream">What actions cost</h3>' +
      '<ul class="mt-2 divide-y divide-line">' + costs.map(function (c) {
        return '<li class="flex justify-between py-2.5 text-sm"><span class="text-muted">' + c.label + '</span><span class="font-medium text-cream">' + c.cost + ' credits</span></li>';
      }).join('') + '</ul>' +
      '<h3 class="mt-8 text-sm font-medium text-cream">Recent activity</h3>' +
      '<div data-role="ledger"></div>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);
  var count = sec.querySelector('[data-role=count]');
  var bar = sec.querySelector('[data-role=bar]');
  var ledgerEl = sec.querySelector('[data-role=ledger]');
  sec.querySelector('[data-role=topup]').addEventListener('click', function () { A.setTopUpOpen(true); });

  scope.mount(function (s) { return [s.credits, s.startingCredits]; }, function (v, first) {
    var pct = Math.max(0, Math.min(100, v[0] / Math.max(v[1], v[0], 1) * 100));
    countUp(count, v[0]);
    if (first) { bar.style.transition = 'none'; bar.style.width = pct + '%'; void bar.offsetWidth; bar.style.transition = ''; }
    else bar.style.width = pct + '%';
  });
  scope.mount(function (s) { return [s.ledger]; }, function (v) {
    var ledger = v[0];
    ledgerEl.innerHTML = ledger.length === 0
      ? '<p class="mt-2 text-sm text-muted">No credit activity yet.</p>'
      : '<ul class="mt-2 divide-y divide-line">' + ledger.map(function (l) {
          return '<li class="flex items-center justify-between py-2.5"><span><span class="block text-sm text-cream">' + esc(l.label) + '</span>' +
            '<span class="text-xs text-muted">' + formatDate(l.time) + '</span></span>' +
            '<span class="text-sm font-semibold ' + (l.amount < 0 ? 'text-danger' : 'text-success') + '">' + (l.amount > 0 ? '+' : '') + l.amount + '</span></li>';
        }).join('') + '</ul>';
  });
}

/* ---------- Top-up modal (app-level, always mounted) ---------- */
function initTopUpModal(scope, holder) {
  var testCard = [
    { label: 'Name on card', value: 'James Carter', span: 'col-span-2' },
    { label: 'Card number', value: '4242 4242 4242 4242', span: 'col-span-2' },
    { label: 'Expiry', value: '12 / 34', span: '' },
    { label: 'CVC', value: '123', span: '' }
  ];
  var overlay = null, dialog = null, body = null, balanceEl = null, closeBtn = null;
  var phase = 'select', selectedId = null, purchased = null;
  var packages = [], credits = 0;

  function close() { if (phase !== 'processing') A.setTopUpOpen(false); }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function renderBody(animateIt) {
    if (!body) return;
    var selected = packages.find(function (p) { return p.id === selectedId; }) || null;
    var html;
    if (phase === 'success' && purchased) {
      html =
        '<div class="flex flex-col items-center px-6 pb-8 pt-8 text-center">' +
          '<span class="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">' + icon('Check', 28, '', 2.5) + '</span>' +
          '<p class="mt-4 font-serif text-3xl font-semibold text-cream">+' + purchased.credits + ' credits added</p>' +
          '<p class="mt-2 text-sm text-muted">Test purchase confirmed · ' + formatPrice(purchased.price) + ' not charged</p>' +
          '<p class="mt-6 text-sm text-muted">New balance</p>' +
          '<span class="tabular-nums font-serif text-5xl font-semibold text-gold">' + credits + '</span>' +
          '<button type="button" data-role="done" class="' + btnPrimary + ' mt-8">Done</button>' +
        '</div>';
    } else {
      var processing = phase === 'processing';
      html =
        '<div class="px-6 pb-6 pt-5">' +
          (packages.length === 0
            ? '<p class="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No packages configured. Add one in the Staff panel.</p>'
            : '<div role="radiogroup" aria-label="Credit packages" class="grid gap-3 sm:grid-cols-3">' + packages.map(function (p) {
                var active = p.id === selectedId;
                return '<button type="button" role="radio" aria-checked="' + active + '" data-pkg="' + esc(p.id) + '" ' + (processing ? 'disabled ' : '') +
                  'class="flex flex-col rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ' +
                  (active ? 'border-gold bg-gold/10' : 'border-line bg-raised hover:border-gold/50') + '">' +
                  '<span class="text-sm text-muted">' + esc(p.label) + '</span>' +
                  '<span class="mt-1 font-serif text-3xl font-semibold text-cream">' + p.credits + '</span>' +
                  '<span class="text-sm text-muted">credits</span>' +
                  '<span class="mt-3 text-base font-semibold ' + (active ? 'text-gold' : 'text-cream') + '">' + formatPrice(p.price) + '</span></button>';
              }).join('') + '</div>') +
          '<fieldset disabled class="mt-6 rounded-xl border border-line bg-raised/60 p-4">' +
            '<legend class="flex items-center gap-2 px-1 text-sm font-medium text-cream">' + icon('CreditCard', 16, 'text-gold') + ' Test card (prefilled)</legend>' +
            '<div class="grid grid-cols-2 gap-3">' + testCard.map(function (f) {
              return '<label class="block ' + f.span + '"><span class="mb-1 block text-xs text-muted">' + f.label + '</span>' +
                '<input readonly value="' + f.value + '" class="w-full cursor-not-allowed rounded-lg border border-line bg-ink px-3 py-2 text-sm text-muted" /></label>';
            }).join('') + '</div></fieldset>' +
          '<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">' +
            '<button type="button" data-role="cancel" ' + (processing ? 'disabled ' : '') + 'class="' + btnSecondary + '">Cancel</button>' +
            '<button type="button" data-role="confirm" ' + (!selected || processing ? 'disabled ' : '') + 'class="' + btnPrimary + '">' +
              (processing ? icon('Loader2', 16, 'animate-spin') + ' Processing test payment…' : 'Confirm test purchase' + (selected ? ' · ' + formatPrice(selected.price) : '')) +
            '</button></div>' +
        '</div>';
    }
    body.innerHTML = html;
    if (animateIt) animate(body, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    if (closeBtn) closeBtn.disabled = phase === 'processing';
  }

  function build() {
    overlay = fromHTML(
      '<div class="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">' +
        '<div role="dialog" aria-modal="true" aria-labelledby="topup-title" class="thin-scroll max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-panel sm:rounded-2xl">' +
          '<div class="bg-gold-soft px-6 py-2.5 text-center text-sm font-semibold tracking-wide text-ink">TEST CHECKOUT – no real payment</div>' +
          '<div class="flex items-start justify-between gap-4 px-6 pt-6">' +
            '<div><h2 id="topup-title" class="font-serif text-3xl font-semibold text-cream">Top up credits</h2>' +
              '<p class="mt-1 text-sm text-muted">Current balance: <span data-role="balance" class="tabular-nums font-semibold text-cream"></span> credits</p></div>' +
            '<button type="button" data-role="close" aria-label="Close top up" class="rounded-full p-2 text-muted transition-colors duration-150 hover:bg-raised hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' + icon('X', 18) + '</button>' +
          '</div>' +
          '<div data-role="body"></div>' +
        '</div></div>'
    );
    dialog = overlay.firstElementChild;
    body = overlay.querySelector('[data-role=body]');
    balanceEl = overlay.querySelector('[data-role=balance]');
    closeBtn = overlay.querySelector('[data-role=close]');
    balanceEl.textContent = credits;
    balanceEl._v = credits;

    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', function () { A.setTopUpOpen(false); });
    overlay.addEventListener('click', function (e) {
      var pkg = e.target.closest('[data-pkg]');
      if (pkg && phase !== 'processing') { selectedId = pkg.getAttribute('data-pkg'); renderBody(false); return; }
      if (e.target.closest('[data-role=cancel]')) { A.setTopUpOpen(false); return; }
      if (e.target.closest('[data-role=done]')) { A.setTopUpOpen(false); return; }
      if (e.target.closest('[data-role=confirm]')) {
        var selected = packages.find(function (p) { return p.id === selectedId; });
        if (!selected) return;
        phase = 'processing'; renderBody(false);
        window.setTimeout(function () {
          A.topUp(selected);
          purchased = selected;
          phase = 'success';
          renderBody(true);
        }, 900);
      }
    });
    holder.appendChild(overlay);
    renderBody(false);
    animate(overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    animate(dialog, [{ opacity: 0, transform: 'translateY(24px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 260 });
    window.addEventListener('keydown', onKey);
    window.setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 50);
  }

  function destroy() {
    window.removeEventListener('keydown', onKey);
    var o = overlay, d = dialog;
    overlay = dialog = body = balanceEl = closeBtn = null;
    if (!o) return;
    o.style.pointerEvents = 'none';
    var a = animate(o, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    animate(d, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(24px) scale(0.98)' }], { duration: 260, fill: 'forwards' });
    a.onfinish = function () { o.remove(); };
    window.setTimeout(function () { o.remove(); }, 400);
  }

  scope.mount(function (s) { return [s.topUpOpen, s.packages, s.credits]; }, function (v, first) {
    var open = v[0];
    packages = v[1];
    var prevCredits = credits;
    credits = v[2];
    if (open && !overlay) {
      phase = 'select';
      purchased = null;
      var p = packages[Math.min(1, packages.length - 1)];
      selectedId = p ? p.id : null;
      build();
    } else if (!open && overlay) {
      destroy();
    } else if (open && overlay) {
      if (selectedId && !packages.some(function (p) { return p.id === selectedId; })) selectedId = null;
      countUp(balanceEl, credits);
      if (phase === 'select') renderBody(false);
      else if (phase === 'success' && prevCredits !== credits) renderBody(false);
    }
  });
}
