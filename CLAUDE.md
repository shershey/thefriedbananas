# The Fried Bananas

Static site for the Fried Bananas jazz/blues band. Restored from a 2021 WordPress/Webfaction site via Wayback Machine. Hosted on Cloudflare Pages.

## What this site is

A simple 5-page band site:

- **Home** (`site/index.html`) — landing page with band photos and nav
- **About** (`site/about/index.html`) — band bio
- **Music** (`site/music/index.html`) — two Bandcamp album embeds with Dropbox fallback links
- **EPK** (`site/epk/index.html`) — electronic press kit
- **Contact** (`site/contact/index.html`) — contact info (the WordPress contact form is broken; see issue #2)

## Deployment

**Cloudflare Pages** — push to `main` → auto-deploys. No build command. Output directory: `site/`.

## Music page

The music page (`site/music/index.html`) is rebuilt from `work/build-bc.py` — do not hand-edit the HTML, edit the script and run it.

The intro paragraph is editable without touching code: edit `site/music/intro.md` and push. It's fetched client-side at page load via `marked.js`.

Albums on Bandcamp (shawnhershey.bandcamp.com):
- Montreal: album ID `3311730543`
- Albany: album ID `234184643`

Dropbox backup links (MP3s for download) are in `work/build-bc.py` in the `ALBUMS` list.

## Theme

The site uses the **Adament** WordPress theme, recovered as static assets in `site/wp-content/themes/Adament/`. Do not delete or restructure that directory — all pages link to it.

Photos are in `site/wp-content/uploads/2014/08/`. The broken people photos from the original site are not recoverable (they were hosted externally).

## What's NOT here

- Audio files — all tracks are on Bandcamp (and Dropbox as backup). Never commit MP3s or WAVs.
- WordPress PHP — the site is fully static; no server-side code runs.
- The old `mirror.py` / `fixlinks.py` recovery scripts are deleted (work is done).

## Open issues

- **#2** Contact form — replace with direct contact info for Josh and Shawn
- **#3** Band status — add a note about the current state of the band
