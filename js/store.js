/* ===== State store (ported from src/hooks/useStudioStore.ts, zustand -> tiny store) =====
   Persists to localStorage under the same key/format as the original app. */

var Store = (function () {
  var STORAGE_KEY = 'styling-studio-v1';
  var PERSISTED_KEYS = [
    'items', 'outfitIds', 'wardrobeOpen', 'drawers', 'stylingOpen', 'credits', 'startingCredits',
    'packages', 'ledger', 'profile', 'palette', 'moodboard', 'messages', 'replyIndex',
    'notifications', 'savedLooks', 'role', 'mobileTab', 'swipeHintSeen'
  ];

  function seedState() {
    return {
      items: seedItems.map(function (i) { return Object.assign({}, i); }),
      outfitIds: [],
      previewId: null,
      wardrobeOpen: true,
      drawers: { accessories: false, shoes: false },
      stylingOpen: true,
      credits: STARTING_CREDITS,
      startingCredits: STARTING_CREDITS,
      packages: packageSeed.map(function (p) { return Object.assign({}, p); }),
      ledger: [],
      profile: Object.assign({}, profileSeed, { preferences: profileSeed.preferences.slice(), photo: profilePhotoUrl }),
      palette: paletteSeed.map(function (s) { return Object.assign({}, s); }),
      moodboard: moodboardSeed.map(function (m) { return Object.assign({}, m); }),
      messages: chatSeed.map(function (m) { return Object.assign({}, m); }),
      clientTyping: false,
      replyIndex: 0,
      notifications: [],
      savedLooks: [],
      role: 'client',
      adminOpen: false,
      topUpOpen: false,
      mobileTab: 'wardrobe',
      swipeHintSeen: false,
      toasts: [],
      creditDeltas: []
    };
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && parsed.state) || {};
    } catch (e) {
      return {};
    }
  }

  function persist() {
    var out = {};
    PERSISTED_KEYS.forEach(function (k) { out[k] = state[k]; });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: out, version: 0 }));
    } catch (e) {
      console.warn('The Styling Studio: browser storage is full; latest change was not persisted.');
    }
  }

  var state = Object.assign(seedState(), loadPersisted());
  var listeners = [];

  function get() { return state; }

  function set(patch) {
    var p = typeof patch === 'function' ? patch(state) : patch;
    state = Object.assign({}, state, p);
    persist();
    listeners.slice().forEach(function (fn) { fn(state); });
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /* ---------- internal helpers ---------- */
  function addDelta(amount, label) {
    var delta = { id: uid('delta'), amount: amount };
    set(function (s) {
      return {
        creditDeltas: s.creditDeltas.concat([delta]),
        ledger: [{ id: uid('led'), label: label, amount: amount, time: Date.now() }].concat(s.ledger).slice(0, 30)
      };
    });
    window.setTimeout(function () {
      set(function (s) { return { creditDeltas: s.creditDeltas.filter(function (d) { return d.id !== delta.id; }) }; });
    }, 1400);
  }

  function notify(text) {
    set(function (s) {
      return { notifications: [{ id: uid('n'), text: text, time: Date.now(), read: false }].concat(s.notifications).slice(0, 25) };
    });
  }

  function nextOrder() {
    return get().items.reduce(function (max, i) { return Math.max(max, i.order); }, -1) + 1;
  }

  function mapBy(list, id, patch) {
    return list.map(function (x) { return x.id === id ? Object.assign({}, x, patch) : x; });
  }

  /* ---------- actions ---------- */
  var A = {
    previewItem: function (id) { set({ previewId: id }); },
    closePreview: function () { set({ previewId: null }); },

    addToOutfit: function (id, opts) {
      var s = get();
      var item = s.items.find(function (i) { return i.id === id; });
      if (!item || s.outfitIds.indexOf(id) >= 0) return;
      var next = s.outfitIds.concat([id]);
      set({ outfitIds: next, previewId: s.previewId === id ? null : s.previewId });
      if (opts && opts.announce) {
        A.pushToast({ title: item.name + ' added to outfit', description: pieceLabel(next.length), tone: 'success' });
      }
    },

    returnFromOutfit: function (id, opts) {
      var item = get().items.find(function (i) { return i.id === id; });
      set(function (s) { return { outfitIds: s.outfitIds.filter(function (x) { return x !== id; }) }; });
      if (opts && opts.announce && item) {
        A.pushToast({ title: item.name + ' returned', description: 'Back on the ' + sourceLabel(sourceOf(item.category)), tone: 'info' });
      }
    },

    clearOutfit: function () { set({ outfitIds: [] }); },

    setWardrobeOpen: function (open) {
      var s = get();
      var preview = s.items.find(function (i) { return i.id === s.previewId; });
      var clearPreview = !open && preview && sourceOf(preview.category) === 'rail';
      set({ wardrobeOpen: open, previewId: clearPreview ? null : s.previewId });
    },

    toggleDrawer: function (kind) {
      var s = get();
      var closing = s.drawers[kind];
      var preview = s.items.find(function (i) { return i.id === s.previewId; });
      var clearPreview = closing && preview && sourceOf(preview.category) === kind;
      var drawers = Object.assign({}, s.drawers);
      drawers[kind] = !closing;
      set({ drawers: drawers, previewId: clearPreview ? null : s.previewId });
    },

    toggleStyling: function () { set(function (s) { return { stylingOpen: !s.stylingOpen }; }); },

    spendCredits: function (amount, label) {
      var credits = get().credits;
      if (credits < amount) {
        A.pushToast({
          title: 'Not enough credits',
          description: label + ' needs ' + amount + ' credits — you have ' + credits + '. Top up to continue.',
          tone: 'error',
          action: 'topup'
        });
        return false;
      }
      set({ credits: credits - amount });
      addDelta(-amount, label);
      return true;
    },

    topUp: function (pkg) {
      set(function (s) { return { credits: s.credits + pkg.credits }; });
      addDelta(pkg.credits, pkg.label + ' top-up');
      notify('Test purchase complete: +' + pkg.credits + ' credits');
    },

    setTopUpOpen: function (open) { set({ topUpOpen: open }); },

    uploadGarment: function (input) {
      if (!A.spendCredits(CREDIT_COSTS.upload, 'Upload garment')) return false;
      var source = sourceOf(input.category);
      var item = {
        id: uid('item'),
        name: input.name.trim() || defaultItemName(input.category),
        category: input.category,
        image: input.image,
        order: nextOrder(),
        uploaded: true
      };
      set(function (s) {
        var drawers = s.drawers;
        if (source !== 'rail') { drawers = Object.assign({}, s.drawers); drawers[source] = true; }
        return {
          items: s.items.concat([item]),
          wardrobeOpen: source === 'rail' ? true : s.wardrobeOpen,
          drawers: drawers
        };
      });
      A.pushToast({ title: item.name + ' added', description: 'Now in the ' + sourceLabel(source), tone: 'success' });
      return true;
    },

    adminAddItem: function (input) {
      var item = {
        id: uid('item'),
        name: input.name.trim() || defaultItemName(input.category),
        category: input.category,
        image: input.image,
        order: nextOrder()
      };
      set(function (s) { return { items: s.items.concat([item]) }; });
      A.pushToast({ title: item.name + ' added', description: 'Placed in the ' + sourceLabel(sourceOf(item.category)), tone: 'success' });
    },

    updateItem: function (id, patch) {
      set(function (s) { return { items: mapBy(s.items, id, patch) }; });
    },

    deleteItem: function (id) {
      set(function (s) {
        return {
          items: s.items.filter(function (i) { return i.id !== id; }),
          outfitIds: s.outfitIds.filter(function (x) { return x !== id; }),
          previewId: s.previewId === id ? null : s.previewId,
          savedLooks: s.savedLooks.map(function (l) {
            return Object.assign({}, l, { itemIds: l.itemIds.filter(function (x) { return x !== id; }) });
          })
        };
      });
    },

    updateProfile: function (patch) {
      set(function (s) { return { profile: Object.assign({}, s.profile, patch) }; });
    },

    addSwatch: function () {
      set(function (s) { return { palette: s.palette.concat([{ id: uid('sw'), name: 'New colour', hex: '#8A7F70' }]) }; });
    },
    updateSwatch: function (id, patch) {
      set(function (s) { return { palette: mapBy(s.palette, id, patch) }; });
    },
    deleteSwatch: function (id) {
      set(function (s) { return { palette: s.palette.filter(function (p) { return p.id !== id; }) }; });
    },

    addMoodImage: function (url, caption) {
      set(function (s) { return { moodboard: s.moodboard.concat([{ id: uid('mood'), url: url, caption: caption || 'Untitled' }]) }; });
    },
    updateMoodImage: function (id, patch) {
      set(function (s) { return { moodboard: mapBy(s.moodboard, id, patch) }; });
    },
    deleteMoodImage: function (id) {
      set(function (s) { return { moodboard: s.moodboard.filter(function (m) { return m.id !== id; }) }; });
    },

    addPackage: function () {
      set(function (s) { return { packages: s.packages.concat([{ id: uid('pkg'), label: 'New package', credits: 75, price: 12 }]) }; });
    },
    updatePackage: function (id, patch) {
      set(function (s) { return { packages: mapBy(s.packages, id, patch) }; });
    },
    deletePackage: function (id) {
      set(function (s) { return { packages: s.packages.filter(function (p) { return p.id !== id; }) }; });
    },

    setStartingCredits: function (n) { set({ startingCredits: Math.max(0, Math.round(n)) }); },

    resetBalance: function () {
      var startingCredits = get().startingCredits;
      set({ credits: startingCredits });
      A.pushToast({ title: 'Balance reset', description: 'Now ' + startingCredits + ' credits', tone: 'info' });
    },

    saveLook: function () {
      var s = get();
      if (!s.outfitIds.length) {
        A.pushToast({ title: 'Nothing to save yet', description: 'Add at least one piece to the outfit.', tone: 'error' });
        return;
      }
      if (!A.spendCredits(CREDIT_COSTS.saveLook, 'Save look')) return;
      var look = {
        id: uid('look'),
        name: 'Look ' + (s.savedLooks.length + 1),
        itemIds: s.outfitIds.slice(),
        createdAt: Date.now()
      };
      set(function (st) { return { savedLooks: [look].concat(st.savedLooks) }; });
      A.pushToast({ title: look.name + ' saved', description: pieceLabel(look.itemIds.length), tone: 'success' });
    },

    loadLook: function (id) {
      var s = get();
      var look = s.savedLooks.find(function (l) { return l.id === id; });
      if (!look) return;
      var valid = look.itemIds.filter(function (x) { return s.items.some(function (i) { return i.id === x; }); });
      set({ outfitIds: valid, stylingOpen: true, previewId: null });
      A.pushToast({ title: look.name + ' loaded', description: pieceLabel(valid.length), tone: 'info' });
    },

    deleteLook: function (id) {
      set(function (s) { return { savedLooks: s.savedLooks.filter(function (l) { return l.id !== id; }) }; });
    },

    requestReview: function () {
      var outfitIds = get().outfitIds;
      if (!outfitIds.length) {
        A.pushToast({ title: 'Outfit is empty', description: 'Add pieces before requesting a review.', tone: 'error' });
        return;
      }
      if (!A.spendCredits(CREDIT_COSTS.review, 'Stylist review')) return;
      set(function (s) {
        return {
          messages: s.messages.concat([{
            id: uid('msg'), from: 'system',
            text: 'Stylist review requested for a ' + pieceLabel(outfitIds.length) + ' look',
            time: Date.now()
          }])
        };
      });
      notify('Stylist review requested (' + pieceLabel(outfitIds.length) + ')');
      A.pushToast({ title: 'Review requested', description: 'Logged in the chat thread.', tone: 'success' });
    },

    sendMessage: function (text) {
      var trimmed = text.trim();
      if (!trimmed) return;
      set(function (s) {
        return {
          messages: s.messages.concat([{ id: uid('msg'), from: 'stylist', text: trimmed, time: Date.now() }]),
          clientTyping: true
        };
      });
      window.setTimeout(function () {
        var s = get();
        var reply = clientReplies[s.replyIndex % clientReplies.length];
        set({
          messages: s.messages.concat([{ id: uid('msg'), from: 'client', text: reply, time: Date.now() }]),
          clientTyping: false,
          replyIndex: s.replyIndex + 1
        });
        notify(s.profile.name + ': ' + reply);
        A.pushToast({ title: 'New message from client', description: reply, tone: 'info' });
      }, 1500);
    },

    markNotificationsRead: function () {
      set(function (s) {
        return { notifications: s.notifications.map(function (n) { return Object.assign({}, n, { read: true }); }) };
      });
    },

    setRole: function (role) { set({ role: role, adminOpen: role === 'staff' }); },
    setAdminOpen: function (open) { set({ adminOpen: open }); },
    setMobileTab: function (tab) { set({ mobileTab: tab }); },
    markSwipeHintSeen: function () { set({ swipeHintSeen: true }); },

    pushToast: function (toast) {
      var id = uid('toast');
      set(function (s) { return { toasts: s.toasts.concat([Object.assign({}, toast, { id: id })]).slice(-4) }; });
      window.setTimeout(function () { A.dismissToast(id); }, 4000);
    },
    dismissToast: function (id) {
      set(function (s) { return { toasts: s.toasts.filter(function (t) { return t.id !== id; }) }; });
    },

    resetDemo: function () {
      set(seedState());
      A.pushToast({ title: 'Demo reset', description: 'All data restored to defaults.', tone: 'info' });
    }
  };

  return { get: get, set: set, subscribe: subscribe, A: A };
})();

var A = Store.A;
