# Digital Memory Jar

> *Leave a little piece of your heart among the stars.*

A whimsical memory jar built with Next.js — write a note, drop it into a glass jar among glowing paper stars, and draw one back whenever you need a moment of warmth, humor, or surprise. The sky behind the jar is a living Van Gogh–inspired painting: swirling brushstrokes, golden stars, and a luminous moon.

---

## Features

- **Write & drop memories** — text, optional name, emoji picker, and six memory types (Secret, Named, Dream, Story, Funny, Flower)
- **Physics jar** — stars fall, stack, and settle; shake or drag the jar to stir them up
- **Draw a memory** — pull a random **system** note (built-in sarcasm) or a note from **others** (shared via Supabase)
- **Reveal cards** — tap anywhere, press ✕, hit Close, or use Escape to dismiss
- **Starry Night background** — canvas flow-field brushstrokes with golden stars and shooting stars
- **Supabase backend** — shared memories across devices; graceful fallback to localStorage when offline or unconfigured
- **Built-in notes** — starter warm/funny notes + system quotes pre-loaded in the jar (never saved to the database)

---

## Quick start

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase (optional)

Without credentials the app still works — memories are cached in `localStorage` on your device.

To enable shared memories, see **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for the SQL schema and setup steps.

Add to `.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key

# legacy aliases also supported
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## How to use

1. Write a memory in the form on the left
2. Pick a type and optionally add emojis to your note
3. Click **Drop Into Jar** — watch the star fall in
4. **Click or drag the jar** to shake it and draw a random memory
5. Use **draw system** or **draw others** for targeted picks

---

## API

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/memories` | List all memories (newest last) |
| `POST` | `/api/memories` | Create `{ text, type, author? }` |
| `DELETE` | `/api/memories/:id` | Delete a memory |

---

## Tech stack

- **Next.js 15** · **React 18** · **Tailwind CSS**
- **Framer Motion** for UI animation
- **Canvas 2D** for the painted sky background
- **Supabase** for persistence
- Custom **2D physics** for jar stars (sleep, collision, shake)

---

## Project layout

```
app/
  page.js              # UI, galaxy background, jar physics, reveal flow
  api/[[...path]]/     # REST API (memories CRUD)
  globals.css          # theme, text shadows, jar glass styles
lib/
  supabaseClient.js    # lazy Supabase client + config guard
SUPABASE_SETUP.md      # database schema & RLS policies
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server on port 3000 |
| `yarn build` | Production build |
| `yarn start` | Run production server |

---

Made with ✨ — your memories among the stars.
