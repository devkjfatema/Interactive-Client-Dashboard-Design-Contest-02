/* ===== Utilities (ported from src/utils/*.ts) ===== */

var EASE_OUT = [0.23, 1, 0.32, 1];
var EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';
var DESKTOP_QUERY = '(min-width: 1024px)';
var ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function uid(prefix) {
  prefix = prefix || 'id';
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function formatTime(ts) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(ts);
}
function formatDate(ts) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ts);
}
function formatPrice(amount) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function sourceOf(category) {
  if (category === 'Shoes') return 'shoes';
  if (category === 'Accessories') return 'accessories';
  return 'rail';
}
function sourceLabel(source) {
  if (source === 'shoes') return 'shoe drawer';
  if (source === 'accessories') return 'accessory drawer';
  return 'hanging rail';
}
function pieceLabel(count) {
  return count + ' ' + (count === 1 ? 'piece' : 'pieces');
}
var singularNames = {
  Tops: 'top',
  Bottoms: 'bottoms',
  Outerwear: 'outerwear piece',
  Dresses: 'dress',
  Shoes: 'shoes',
  Accessories: 'accessory'
};
function defaultItemName(category) {
  return 'New ' + singularNames[category];
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/** Reads an image file and returns a downscaled JPEG data URL (small enough for localStorage). */
function readImageFile(file, maxSize) {
  maxSize = maxSize || 900;
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read file')); };
    reader.onload = function () {
      var src = reader.result;
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale);
        var h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        if (!ctx) { resolve(src); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { reject(new Error('Unsupported image')); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Cubic-bezier easing function (same maths as CSS), used for the JS count-up. */
function makeBezier(p) {
  var x1 = p[0], y1 = p[1], x2 = p[2], y2 = p[3];
  function A(a, b) { return 1 - 3 * b + 3 * a; }
  function B(a, b) { return 3 * b - 6 * a; }
  function C(a) { return 3 * a; }
  function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
  function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }
  function getT(x) {
    var t = x;
    for (var i = 0; i < 8; i++) {
      var s = slope(t, x1, x2);
      if (s === 0) return t;
      t -= (calc(t, x1, x2) - x) / s;
    }
    return t;
  }
  return function (x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calc(getT(x), y1, y2);
  };
}
var easeOutFn = makeBezier(EASE_OUT);
