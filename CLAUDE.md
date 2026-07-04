# The Fried Bananas

Static site for the Fried Bananas jazz/blues band. Restored from a 2021 WordPress/Webfaction site via Wayback Machine. Hosted on Cloudflare Pages.

## What this site is

A simple 5-page band site:

- **Home** (`site/index.html`) — landing page with band photos and nav
- **About** (`site/about/index.html`) — band bio + history; content in `about.md`
- **Music** (`site/music/index.html`) — two Bandcamp album embeds with Dropbox fallback links
- **EPK** (`site/epk/index.html`) — electronic press kit
- **Contact** (`site/contact/index.html`) — ways to reach Josh & Shawn; content in `contact.md` (the old WordPress contact form was removed)

## Deployment

**Cloudflare Pages** — push to `main` → auto-deploys. No build command. Output directory: `site/`. (It's a *Pages* project, not a Worker — a Worker won't auto-deploy from git.)

## Editable content = markdown, fetched client-side

Non-code text lives in `.md` files loaded at page load via `marked.js` (CDN), so edits don't require touching HTML:

- **About** → `site/about/about.md` (photo stays hardcoded with `float:left` so text wraps it)
- **Contact** → `site/contact/contact.md`
- **Music intro** → `site/music/intro.md`

All three pages patch parsed links to open in a new tab (DOM walk after `marked.parse`, not a custom renderer — the marked v5+ renderer API broke that).

## Music page

`site/music/index.html` is **generated** by `work/build-bc.py` — edit the script and re-run it, don't hand-edit the HTML. Albums on Bandcamp (shawnhershey.bandcamp.com): Montreal `3311730543`, Albany `234184643`. Dropbox backup links + the player `bgcol` are in the `ALBUMS`/`STYLE` sections of that script.

## Theme / styling

Uses the **Adament** WordPress theme, recovered as static assets in `site/wp-content/themes/Adament/`. Don't delete or restructure it — every page links to it.

**Vintage dark theme:** site-wide overrides are appended to `site/wp-content/themes/Adament/css/custom-colors.css` (loads last, so it wins). Brown page (`#2b241d`), cream text, gold content links; the header/footer bars stay tan (`#e4d89a`) because the logo/nav are dark. `#content` and the `#bottom` spacer are made transparent so the brown shows through. Sticky-footer rules keep the footer at the viewport bottom on short pages.

Photos are in `site/wp-content/uploads/2014/08/`. Original broken people-photos were external and aren't recoverable.

## ⚠️ Cache-busting convention (important — there's no build step)

`custom-colors.css` and `bananas.js` are referenced with a `?v=N` query string on **all 5 pages and in `work/build-bc.py`**. When you edit either file, **bump `N` everywhere** (they're plain static files with no hashing, so browsers/Cloudflare will otherwise serve the stale copy). Quick way: a one-liner that string-replaces `?v=OLD`→`?v=NEW` across those 6 files.

## Banana game 🍌

An easter-egg toy, all in `site/wp-content/themes/Adament/js/bananas.js` (included on every page):

- A dimmed slider centered in the footer (banana knob) sets the per-second probability a banana drops. Default 0.
- Bananas fall big & slow with a gentle spin; grab/drag/throw them (permissive radius).
- A catcher at the bottom — randomly **Josh or Shawn's head** — moves with ← / → (hold **Shift** = warp speed) on desktop, or drag on touch. Scores `eaten / total`; the head grows 2% per catch and shrinks 5% per miss (uncapped, by design).
- Head cutouts: `site/wp-content/uploads/heads/{josh,shawn}.png`. `work/cutout.py` removes a near-white background (stdlib flood-fill; Pillow won't build here) and `work/crop_alpha.py` crops to the alpha bounds so heads render the same size. To add a face: get a transparent PNG (or run `cutout.py` on a white-background one), drop it in `heads/`, add it to the `CATCHERS` array, bump `bananas.js` `?v=`.

## What's NOT here

- Audio files — tracks live on Bandcamp (+ Dropbox backup). Never commit MP3s/WAVs (gitignored, along with `__pycache__`).
- WordPress PHP / server code — the site is fully static.
- The one-time recovery scripts (`mirror.py`/`fixlinks.py`) — deleted; work is done.

## Open items

- **#3** Band status — largely addressed on the About page ("mostly retired…"); close/confirm if satisfied.
