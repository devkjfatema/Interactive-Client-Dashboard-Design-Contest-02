/* ===== Static seed data (ported from src/data/studio.ts + src/data/items.ts) ===== */

var STARTING_CREDITS = 105;

var CREDIT_COSTS = {
  saveLook: 3,
  review: 5,
  upload: 2
};

var categories = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories'];

var paletteSeed = [
  { id: 'sw-camel', name: 'Camel', hex: '#C19A6B' },
  { id: 'sw-ivory', name: 'Ivory', hex: '#F3EDE0' },
  { id: 'sw-olive', name: 'Olive', hex: '#6E6B3D' },
  { id: 'sw-rust', name: 'Rust', hex: '#A5512F' },
  { id: 'sw-navy', name: 'Navy', hex: '#1F2B47' },
  { id: 'sw-chocolate', name: 'Chocolate', hex: '#4B3024' }
];

var packageSeed = [
  { id: 'pkg-50', label: 'Starter', credits: 50, price: 9 },
  { id: 'pkg-100', label: 'Studio', credits: 100, price: 16 },
  { id: 'pkg-250', label: 'Atelier', credits: 250, price: 35 }
];

var profileSeed = {
  name: 'James Carter',
  location: 'London, United Kingdom',
  size: 'M / 40R',
  height: '183 cm',
  chest: '102 cm',
  waist: '84 cm',
  inseam: '81 cm',
  shoeSize: 'UK 9',
  bodyShape: 'Inverted triangle · broad shoulders, slim waist',
  preferences: ['Smart casual', 'Natural fabrics', 'Earth tones', 'Tailored fit'],
  memberSince: 'March 2024'
};

var chatSeed = [
  {
    id: 'msg-1',
    from: 'client',
    text: 'Hi! Looking forward to planning outfits for the Milan trip next month.',
    time: Date.now() - 1000 * 60 * 42
  },
  {
    id: 'msg-2',
    from: 'stylist',
    text: "Lovely — I've started pulling pieces from your wardrobe. Camel and navy will travel well.",
    time: Date.now() - 1000 * 60 * 38
  }
];

var clientReplies = [
  'Love that combination — the camel coat is my favourite piece.',
  'Could we try it with the brown oxfords instead?',
  'Perfect for the dinner on Friday, thank you!',
  'Is the knit too casual for client meetings?',
  'Brilliant. Saving this one for the trip.',
  'What would you swap in if it rains?'
];

/**
 * ALL IMAGE URLS LIVE HERE.
 * Swap any URL below to change the photo everywhere in the app.
 */
var profilePhotoUrl =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80';

var stylistPhotoUrl =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';

var bodySilhouetteUrl =
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80';

var seedItems = [
  { id: 'navy-blazer', name: 'Navy Blazer', category: 'Outerwear', order: 0,
    image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=900&q=80' },
  { id: 'white-shirt', name: 'White Oxford Shirt', category: 'Tops', order: 1,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80' },
  { id: 'blue-shirt', name: 'Light Blue Shirt', category: 'Tops', order: 2,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80' },
  { id: 'beige-knit', name: 'Beige Knit Sweater', category: 'Tops', order: 3,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80' },
  { id: 'grey-trousers', name: 'Grey Wool Trousers', category: 'Bottoms', order: 4,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80' },
  { id: 'camel-overcoat', name: 'Camel Overcoat', category: 'Outerwear', order: 5,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80' },
  { id: 'silk-tie', name: 'Silk Tie', category: 'Accessories', order: 6,
    image: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=900&q=80' },
  { id: 'classic-watch', name: 'Classic Watch', category: 'Accessories', order: 7,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80' },
  { id: 'leather-belt', name: 'Leather Belt', category: 'Accessories', order: 8,
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80' },
  { id: 'brown-oxfords', name: 'Brown Oxford Shoes', category: 'Shoes', order: 9,
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=80' },
  { id: 'leather-shoes', name: 'Leather Derby Shoes', category: 'Shoes', order: 10,
    image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=80' }
];

var moodboardSeed = [
  { id: 'mood-1', caption: 'Sharp tailoring',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80' },
  { id: 'mood-2', caption: 'Weekend layers',
    url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80' },
  { id: 'mood-3', caption: 'Relaxed smart',
    url: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=700&q=80' },
  { id: 'mood-4', caption: 'City casual',
    url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80' }
];
