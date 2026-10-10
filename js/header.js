/* ===== Header: TopBar, HintBar, CreditMeter, NotificationBell, RoleSwitch, Toaster ===== */

function initTopBar(scope, root) {
  root.innerHTML =
    '<div class="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-6">' +
      '<div class="flex min-w-0 items-center gap-3">' +
        '<span class="whitespace-nowrap font-serif text-lg font-semibold tracking-wide text-cream sm:text-[26px]">The Styling Studio</span>' +
        '<span class="hidden whitespace-nowrap rounded-full border border-gold/40 px-2.5 py-0.5 text-xs font-medium text-gold sm:inline-block">Interactive Demo</span>' +
      '</div>' +
      '<div class="flex items-center gap-2 lg:gap-3">' +
        '<div id="credit-meter" class="relative"></div>' +
        '<div id="notif-bell" class="relative"></div>' +
        '<div id="role-switch" class="contents"></div>' +
        '<div class="hidden items-center gap-2.5 border-l border-line pl-4 lg:flex">' +
          '<img src="' + esc(stylistPhotoUrl) + '" alt="" class="h-9 w-9 rounded-full border border-gold/50 object-cover" />' +
          '<span class="text-sm font-medium text-cream">Stylist</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  initCreditMeter(scope, root.querySelector('#credit-meter'));
  initNotificationBell(scope, root.querySelector('#notif-bell'));
  initRoleSwitch(scope, root.querySelector('#role-switch'));
}

function hintBarHTML() {
  return '<p class="mx-auto max-w-[1680px] px-4 py-2 text-center text-[13px] leading-relaxed text-muted lg:px-6">' +
    '<span class="font-medium text-gold sm:hidden">Interactive Demo · </span>' +
    'Desktop: click, drag &amp; arrow buttons · Mobile: swipe right to add, swipe left to return · Payment &amp; chat replies are simulated' +
    '</p>';
}

/* ---------- Credit meter ---------- */
function initCreditMeter(scope, root) {
  root.innerHTML =
    '<button type="button" data-role="btn" class="group flex items-center gap-2.5 rounded-full border border-line bg-raised py-1.5 pl-3.5 pr-1.5 transition-colors duration-150 hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:gap-3 lg:pl-4">' +
      '<span class="flex flex-col gap-1">' +
        '<span class="flex items-baseline gap-1.5">' +
          '<span data-role="count" data-countup class="tabular-nums text-sm font-semibold text-cream"></span>' +
          '<span class="hidden text-xs text-muted sm:inline">credits</span>' +
        '</span>' +
        '<span class="block h-1 w-12 overflow-hidden rounded-full bg-line lg:w-24" aria-hidden="true">' +
          '<span data-role="bar" class="block h-full rounded-full bg-gold" style="width:0%;transition:width .3s ' + EASE_OUT_CSS + '"></span>' +
        '</span>' +
      '</span>' +
      '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink transition-colors duration-150 group-hover:bg-gold-soft">' +
        icon('Plus', 16, '', 2.5) +
      '</span>' +
    '</button>' +
    '<div data-role="deltas"></div>';

  var btn = root.querySelector('[data-role=btn]');
  var count = root.querySelector('[data-role=count]');
  var bar = root.querySelector('[data-role=bar]');
  var deltas = root.querySelector('[data-role=deltas]');
  btn.addEventListener('click', function () { A.setTopUpOpen(true); });

  scope.mount(function (s) { return [s.credits, s.startingCredits]; }, function (v, first) {
    var credits = v[0], starting = v[1];
    var pct = Math.max(0, Math.min(100, credits / Math.max(starting, credits, 1) * 100));
    var low = credits < 10;
    btn.setAttribute('aria-label', credits + ' credits available. Open top up');
    countUp(count, credits);
    count.classList.toggle('text-danger', low);
    count.classList.toggle('text-cream', !low);
    bar.classList.toggle('bg-danger', low);
    bar.classList.toggle('bg-gold', !low);
    if (first) { bar.style.transition = 'none'; bar.style.width = pct + '%'; void bar.offsetWidth; bar.style.transition = 'width .3s ' + EASE_OUT_CSS; }
    else bar.style.width = pct + '%';
  });

  scope.mount(function (s) { return [s.creditDeltas]; }, function (v) {
    reconcile(deltas, v[0].map(function (d) {
      var cls = d.amount < 0 ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success';
      return {
        key: d.id, sig: d.id,
        html: '<span aria-hidden="true" style="transform:translateY(14px)" class="pointer-events-none absolute left-3 top-full whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ' + cls + '">' +
          (d.amount > 0 ? '+' : '') + d.amount + ' credits</span>'
      };
    }), {
      initial: false,
      enter: { kf: [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(14px)' }], d: 250 },
      exit: { kf: [{ opacity: 1, transform: 'translateY(14px)' }, { opacity: 0, transform: 'translateY(22px)' }], d: 250 }
    });
  });
}

/* ---------- Notification bell ---------- */
function initNotificationBell(scope, root) {
  var open = false;
  root.innerHTML =
    '<button type="button" data-role="btn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications" class="' + btnIcon + ' relative">' +
      icon('Bell', 17) +
      '<span data-role="badges"></span>' +
    '</button>' +
    '<div data-role="pop"></div>';
  var btn = root.querySelector('[data-role=btn]');
  var badges = root.querySelector('[data-role=badges]');
  var pop = root.querySelector('[data-role=pop]');
  var notifications = [];

  function onDown(e) { if (!root.contains(e.target)) setOpen(false); }
  function onKey(e) { if (e.key === 'Escape') setOpen(false); }

  function renderPop() {
    reconcile(pop, open ? [{
      key: 'pop',
      sig: JSON.stringify(notifications.map(function (n) { return [n.id, n.text, n.time]; })),
      html:
        '<div class="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-raised shadow-2xl shadow-black/60" style="transform-origin:top right">' +
          '<div class="border-b border-line px-4 py-3"><p class="text-sm font-semibold text-cream">Notifications</p></div>' +
          (notifications.length === 0
            ? '<p class="px-4 py-6 text-sm text-muted">You\'re all caught up.</p>'
            : '<ul class="thin-scroll max-h-80 overflow-y-auto">' + notifications.map(function (n) {
                return '<li class="border-b border-line/60 px-4 py-3 last:border-0"><p class="line-clamp-2 text-sm text-cream">' + esc(n.text) +
                  '</p><p class="mt-0.5 text-xs text-muted">' + formatTime(n.time) + '</p></li>';
              }).join('') + '</ul>') +
        '</div>'
    }] : [], {
      initial: false,
      enter: { kf: [{ opacity: 0, transform: 'translateY(-6px) scale(0.97)' }, { opacity: 1, transform: 'none' }], d: 160 },
      exit: { kf: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(0.97)' }], d: 160 }
    });
  }

  function setOpen(v) {
    if (open === v) return;
    open = v;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
    } else {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    }
    renderPop();
  }

  btn.addEventListener('click', function () {
    if (!open) A.markNotificationsRead();
    setOpen(!open);
  });

  scope.mount(function (s) { return [s.notifications]; }, function (v) {
    notifications = v[0];
    var unread = notifications.filter(function (n) { return !n.read; }).length;
    btn.setAttribute('aria-label', unread ? 'Notifications, ' + unread + ' unread' : 'Notifications');
    reconcile(badges, unread > 0 ? [{
      key: 'u' + unread, sig: 'u' + unread,
      html: '<span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">' + (unread > 9 ? '9+' : unread) + '</span>'
    }] : [], {
      initial: false,
      enter: { kf: [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], d: 180 },
      exit: { kf: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.6)' }], d: 180 }
    });
    renderPop();
  });
}

/* ---------- Role switch ---------- */
function initRoleSwitch(scope, root) {
  var roles = [{ value: 'client', label: 'Client' }, { value: 'staff', label: 'Staff' }];
  var segBase = 'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ';
  root.innerHTML =
    '<div role="group" aria-label="Demo role" class="hidden rounded-full border border-line bg-raised p-1 lg:flex">' +
      roles.map(function (r) {
        return '<button type="button" data-role-value="' + r.value + '" class="' + segBase + '">' + r.label + '</button>';
      }).join('') +
    '</div>' +
    '<button type="button" data-role="mobile" class="' + btnIcon + ' lg:hidden">' + icon('ShieldCheck', 17) + '</button>';

  var segs = Array.prototype.slice.call(root.querySelectorAll('[data-role-value]'));
  var mobile = root.querySelector('[data-role=mobile]');

  segs.forEach(function (b) {
    b.addEventListener('click', function () {
      var role = Store.get().role;
      var v = b.getAttribute('data-role-value');
      if (role === v && v === 'staff') A.setAdminOpen(true); else A.setRole(v);
    });
  });
  mobile.addEventListener('click', function () {
    if (Store.get().role === 'staff') A.setAdminOpen(true); else A.setRole('staff');
  });

  scope.mount(function (s) { return [s.role]; }, function (v) {
    var role = v[0];
    segs.forEach(function (b) {
      var on = b.getAttribute('data-role-value') === role;
      b.setAttribute('aria-pressed', String(on));
      b.className = segBase + (on ? 'bg-gold text-ink' : 'text-muted hover:text-cream');
    });
    mobile.setAttribute('aria-pressed', String(role === 'staff'));
    mobile.setAttribute('aria-label', role === 'staff' ? 'Open staff admin panel' : 'Switch to staff mode');
    mobile.className = btnIcon + ' lg:hidden' + (role === 'staff' ? ' border-gold text-gold' : '');
  });
}

/* ---------- Toaster ---------- */
function initToaster(scope, root) {
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toast-action]');
    if (t) {
      var id = t.getAttribute('data-toast-id');
      if (t.getAttribute('data-toast-action') === 'topup') { A.setTopUpOpen(true); A.dismissToast(id); }
      else A.dismissToast(id);
    }
  });
  scope.mount(function (s) { return [s.toasts]; }, function (v) {
    reconcile(root, v[0].map(function (t) {
      var ic = t.tone === 'error' ? 'AlertCircle' : t.tone === 'success' ? 'CheckCircle2' : 'MessageCircle';
      var color = t.tone === 'error' ? 'text-danger' : t.tone === 'success' ? 'text-success' : 'text-gold';
      return {
        key: t.id, sig: t.id,
        html:
          '<div role="status" class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-raised p-4 shadow-2xl shadow-black/60">' +
            icon(ic, 18, 'mt-0.5 shrink-0 ' + color) +
            '<div class="min-w-0 flex-1">' +
              '<p class="text-sm font-semibold text-cream">' + esc(t.title) + '</p>' +
              (t.description ? '<p class="mt-0.5 line-clamp-2 text-sm text-muted">' + esc(t.description) + '</p>' : '') +
              (t.action === 'topup'
                ? '<button type="button" data-toast-action="topup" data-toast-id="' + t.id + '" class="mt-2 text-sm font-semibold text-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Top up credits</button>'
                : '') +
            '</div>' +
            '<button type="button" data-toast-action="dismiss" data-toast-id="' + t.id + '" aria-label="Dismiss notification" class="rounded-md p-1 text-muted transition-colors duration-150 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">' +
              icon('X', 16) +
            '</button>' +
          '</div>'
      };
    }), {
      initial: false, flip: true,
      enter: { kf: [{ opacity: 0, transform: 'translateY(-10px) scale(0.96)' }, { opacity: 1, transform: 'none' }], d: 220 },
      exit: { kf: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], d: 150 }
    });
  });
}
