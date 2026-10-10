/* ===== Layouts: Desktop, Mobile (+ tab bar) ===== */

function buildDesktopLayout(scope, host) {
  var main = fromHTML(
    '<main class="mx-auto grid max-w-[1680px] grid-cols-[300px_minmax(0,1fr)_360px] gap-6 px-6 py-6 xl:grid-cols-[320px_minmax(0,1fr)_420px]">' +
      '<h1 class="sr-only">The Styling Studio — client dashboard</h1>' +
      '<aside aria-label="Client" data-col="left" class="flex flex-col gap-6"></aside>' +
      '<div data-col="mid" class="flex min-w-0 flex-col gap-6"></div>' +
      '<aside aria-label="Styling and chat" data-col="right" class="flex flex-col gap-6"></aside>' +
    '</main>'
  );
  host.appendChild(main);
  var left = main.querySelector('[data-col=left]');
  var mid = main.querySelector('[data-col=mid]');
  var right = main.querySelector('[data-col=right]');
  initProfileCard(scope, left);
  initInsightPanels(scope, left);
  initUploadGarment(scope, left);
  initWardrobe(scope, mid);
  initDrawer(scope, mid, 'accessories');
  initDrawer(scope, mid, 'shoes');
  initOutfitArea(scope, right);
  initChat(scope, right);
}

var mobileTabs = [
  { key: 'profile', label: 'Profile', icon: 'User' },
  { key: 'wardrobe', label: 'Wardrobe', icon: 'Shirt' },
  { key: 'outfit', label: 'Outfit', icon: 'Sparkles' },
  { key: 'drawers', label: 'Drawers', icon: 'Archive' },
  { key: 'chat', label: 'Chat', icon: 'MessageCircle' },
  { key: 'credits', label: 'Credits', icon: 'Coins' }
];

function buildMobileTabContent(scope, wrap, tab) {
  if (tab === 'profile') { initProfileCard(scope, wrap); initInsightPanels(scope, wrap); initUploadGarment(scope, wrap); }
  else if (tab === 'wardrobe') { initWardrobe(scope, wrap); initSwipeList(scope, wrap); }
  else if (tab === 'outfit') { initOutfitArea(scope, wrap); }
  else if (tab === 'drawers') { initDrawer(scope, wrap, 'accessories'); initDrawer(scope, wrap, 'shoes'); }
  else if (tab === 'chat') { initChat(scope, wrap, 'h-[calc(100dvh-14rem)] min-h-[440px]'); }
  else if (tab === 'credits') { initCreditsPanel(scope, wrap); }
}

function initMobileTabBar(scope, host) {
  var nav = fromHTML(
    '<nav aria-label="Sections" class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">' +
      '<ul class="grid grid-cols-6">' + mobileTabs.map(function (t) {
        return '<li><button type="button" data-tab="' + t.key + '" class="relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold">' +
          '<span class="relative">' + icon(t.icon, 20) +
            (t.key === 'outfit' ? '<span data-role="badge" class="absolute -right-2.5 -top-1.5 hidden h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink"></span>' : '') +
          '</span><span class="whitespace-nowrap">' + t.label + '</span>' +
          '<span data-role="bar" class="absolute inset-x-4 top-0 hidden h-0.5 rounded-full bg-gold"></span></button></li>';
      }).join('') + '</ul></nav>'
  );
  host.appendChild(nav);
  scope.track(nav);
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (b) A.setMobileTab(b.getAttribute('data-tab'));
  });
  var badge = nav.querySelector('[data-role=badge]');
  scope.mount(function (s) { return [s.mobileTab, s.outfitIds.length]; }, function (v) {
    Array.prototype.forEach.call(nav.querySelectorAll('[data-tab]'), function (b) {
      var on = b.getAttribute('data-tab') === v[0];
      b.classList.toggle('text-gold', on);
      b.classList.toggle('text-muted', !on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      var bar = b.querySelector('[data-role=bar]');
      bar.classList.toggle('hidden', !on);
    });
    badge.textContent = v[1];
    badge.classList.toggle('hidden', v[1] === 0);
    badge.classList.toggle('flex', v[1] > 0);
  });
}

function buildMobileLayout(scope, host) {
  var main = fromHTML(
    '<main class="px-4 pb-28 pt-4"><h1 class="sr-only">The Styling Studio — client dashboard</h1><div data-role="tab-host"></div></main>'
  );
  host.appendChild(main);
  var tabHost = main.querySelector('[data-role=tab-host]');
  var tabScope = null;
  var currentWrap = null;
  var token = 0;

  function show(tab, animateIt) {
    var my = ++token;
    function mountNew() {
      if (my !== token) return;
      if (tabScope) tabScope.dispose();
      clearChildren(tabHost);
      tabScope = createScope();
      currentWrap = fromHTML('<div class="flex flex-col gap-5"></div>');
      tabHost.appendChild(currentWrap);
      buildMobileTabContent(tabScope, currentWrap, tab);
      if (animateIt) animate(currentWrap, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180 });
    }
    if (animateIt && currentWrap) {
      var old = currentWrap;
      var a = animate(old, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
      a.onfinish = mountNew;
      window.setTimeout(function () { if (my === token && old.isConnected) mountNew(); }, 260);
    } else {
      mountNew();
    }
  }

  var first = true;
  scope.mount(function (s) { return [s.mobileTab]; }, function (v) {
    show(v[0], !first);
    first = false;
  });
  scope.onDispose(function () { token++; if (tabScope) tabScope.dispose(); });

  initMobileTabBar(scope, host);
}
