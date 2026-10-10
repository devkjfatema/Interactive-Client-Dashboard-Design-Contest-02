# The Styling Studio — plain HTML / CSS / JS

Magic Patterns-এর React + Tailwind + framer-motion + zustand প্রজেক্টের vanilla version।
কোনো build step ছাড়াই চলে: `index.html` ডাবল-ক্লিক করুন (বা যেকোনো static server দিন)।

## Structure
- `index.html` — page shell
- `css/styles.css` — compiled Tailwind + custom CSS (এটাই ব্যবহার হয়)
- `css/input.css`, `tailwind.config.js` — CSS rebuild করার source (optional)
- `js/` — `data.js` (seed data/ছবির URL), `store.js` (state + localStorage), `ui.js` (animation/drag helpers),
  `header.js`, `wardrobe.js`, `outfit.js`, `profile.js`, `chat.js`, `credits.js`, `admin.js`, `layout.js`, `app.js`

## ছবি বদলানো
সব ছবির URL `js/data.js`-এ।

## CSS rebuild (শুধু JS/HTML-এ নতুন Tailwind class যোগ করলে)
    npm i -D tailwindcss@3.4.17
    npx tailwindcss -c tailwind.config.js -i css/input.css -o css/styles.css
