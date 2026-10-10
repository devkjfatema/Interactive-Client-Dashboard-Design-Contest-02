/* ===== Chat ===== */

function initChat(scope, parent, className) {
  className = className || 'h-[520px]';
  var sec = fromHTML(
    '<section aria-labelledby="chat-title" class="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel ' + className + '">' +
      '<div class="flex items-center gap-3 border-b border-line px-6 py-4">' +
        '<img data-role="photo" src="" alt="" class="h-10 w-10 rounded-full border border-line object-cover" />' +
        '<div class="min-w-0 flex-1"><h2 id="chat-title" data-role="title" class="truncate text-sm font-semibold text-cream"></h2><p class="text-xs text-success">Online</p></div>' +
        '<span class="whitespace-nowrap rounded-full border border-gold/40 px-2.5 py-1 text-xs font-medium text-gold">Simulated replies – demo only</span>' +
      '</div>' +
      '<div data-role="list" class="thin-scroll flex-1 space-y-3 overflow-y-auto px-6 py-5" aria-live="polite"></div>' +
      '<form data-role="form" class="flex items-center gap-2 border-t border-line p-3">' +
        '<label for="chat-input" class="sr-only">Message</label>' +
        '<input id="chat-input" data-role="input" placeholder="Write a message…" autocomplete="off" class="min-w-0 flex-1 rounded-full border border-line bg-ink px-4 py-2.5 text-sm text-cream placeholder:text-muted/70 transition-colors duration-150 focus:border-gold focus:outline-none" />' +
        '<button type="submit" data-role="send" disabled aria-label="Send message" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-ink transition-[background-color,transform] duration-150 hover:bg-gold-soft active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:opacity-40">' + icon('SendHorizontal', 17) + '</button>' +
      '</form>' +
    '</section>'
  );
  parent.appendChild(sec);
  scope.track(sec);
  var photo = sec.querySelector('[data-role=photo]');
  var title = sec.querySelector('[data-role=title]');
  var list = sec.querySelector('[data-role=list]');
  var form = sec.querySelector('[data-role=form]');
  var input = sec.querySelector('[data-role=input]');
  var send = sec.querySelector('[data-role=send]');

  input.addEventListener('input', function () { send.disabled = !input.value.trim(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!input.value.trim()) return;
    A.sendMessage(input.value);
    input.value = '';
    send.disabled = true;
  });

  var lastCount = -1, lastTyping = null;
  scope.mount(function (s) { return [s.messages, s.clientTyping, s.profile.name, s.profile.photo]; }, function (v, first) {
    var messages = v[0], typing = v[1], name = v[2], photoUrl = v[3];
    var firstName = name.split(' ')[0];
    photo.src = photoUrl;
    title.textContent = 'Chat with ' + name;

    var entries = messages.map(function (m) {
      if (m.from === 'system') {
        return { key: m.id, sig: m.id + m.text,
          html: '<p class="mx-auto max-w-[85%] rounded-full bg-raised px-3 py-1.5 text-center text-xs text-muted">' + esc(m.text) + '</p>' };
      }
      var mine = m.from === 'stylist';
      return { key: m.id, sig: m.id + m.text + firstName,
        html: '<div class="flex flex-col ' + (mine ? 'items-end' : 'items-start') + '">' +
          '<p class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' + (mine ? 'rounded-br-md bg-gold text-ink' : 'rounded-bl-md bg-raised text-cream') + '">' + esc(m.text) + '</p>' +
          '<span class="mt-1 text-[11px] text-muted">' + (mine ? 'You' : esc(firstName)) + ' · ' + formatTime(m.time) + '</span></div>' };
    });
    if (typing) {
      entries.push({ key: '__typing', sig: 'typing' + firstName,
        html: '<div class="flex items-center gap-2" aria-label="' + esc(firstName) + ' is typing">' +
          '<span class="flex items-center gap-1 rounded-2xl rounded-bl-md bg-raised px-4 py-3">' +
          [0, 1, 2].map(function (i) { return '<span class="typing-dot h-1.5 w-1.5 rounded-full bg-muted" style="animation-delay:' + (i * 0.15) + 's"></span>'; }).join('') +
          '</span><span class="text-xs text-muted">' + esc(firstName) + ' is typing…</span></div>' });
    }
    reconcile(list, entries, {
      initial: false,
      enter: { kf: [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], d: 200 },
      exit: { kf: [{ opacity: 1 }, { opacity: 0 }], d: 180 }
    });

    if (first) { list.scrollTop = list.scrollHeight; }
    else if (messages.length !== lastCount || typing !== lastTyping) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    lastCount = messages.length; lastTyping = typing;
  });
}
