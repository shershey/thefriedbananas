# thefriedbananas.com

Static restoration of the old **The Fried Bananas** band website, recovered from
the Internet Archive (Wayback Machine) after the original WordPress site on
Webfaction went down. Last live capture: August 2021.

- `site/` — the recovered static site (deploy this directory)
- `mirror.py` — downloads the latest Wayback capture of every file
- `fixlinks.py` — rewrites absolute self-URLs to root-relative so it renders on https

Known gaps being restored separately: album audio (sourced elsewhere) and the
old WordPress contact form (to be replaced with a static form/mailto).
