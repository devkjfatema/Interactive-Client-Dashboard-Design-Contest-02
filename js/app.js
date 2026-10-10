/* ===== App bootstrap (src/App.tsx + src/index.tsx) ===== */

(function () {
  var root = document.getElementById('root');
  root.innerHTML =
    '<div class="min-h-screen w-full bg-ink font-sans text-cream">' +
      '<header id="topbar" class="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur"></header>' +
      '<div id="hintbar" class="border-b border-line/70 bg-panel"></div>' +
      '<div id="layout"></div>' +
      '<div id="topup-holder"></div>' +
      '<div id="admin-holder"></div>' +
      '<div id="toaster" aria-live="polite" class="pointer-events-none fixed inset-x-3 top-20 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-24 sm:items-end"></div>' +
    '</div>';

  var appScope = createScope();
  initTopBar(appScope, document.getElementById('topbar'));
  document.getElementById('hintbar').innerHTML = hintBarHTML();

  var layoutHost = document.getElementById('layout');
  var layoutScope = null;
  var mql = window.matchMedia(DESKTOP_QUERY);

  function mountLayout() {
    if (layoutScope) layoutScope.dispose();
    clearChildren(layoutHost);
    layoutScope = createScope();
    if (mql.matches) buildDesktopLayout(layoutScope, layoutHost);
    else buildMobileLayout(layoutScope, layoutHost);
  }
  mountLayout();
  if (mql.addEventListener) mql.addEventListener('change', mountLayout);
  else mql.addListener(mountLayout);

  initTopUpModal(appScope, document.getElementById('topup-holder'));
  initAdminPanel(appScope, document.getElementById('admin-holder'));
  initToaster(appScope, document.getElementById('toaster'));
})();
