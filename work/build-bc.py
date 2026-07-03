#!/usr/bin/env python3
"""Rebuild the music page around Bandcamp embeds (replaces the self-hosted version)."""
import os, re, html

SITE = "/Users/shawnhershey/thefriedbananas/site/music"
src = open(os.path.join(SITE, "index.html"), encoding="utf-8", errors="replace").read()
head = re.search(r'<head[\s\S]*?</head>', src).group(0)
header = re.search(r'<header[\s\S]*?</header>', src).group(0)
footer = re.search(r'<footer[\s\S]*?</footer>', src).group(0)

# strip the old self-hosted <style> we injected, we'll add a fresh one
head = re.sub(r'<style>[\s\S]*?</style>', '', head, count=1)

# (title, subtitle, bandcamp album id, bandcamp url, dropbox backup url)
ALBUMS = [
    ("Live at Montreal Dance Fest & Sweet Molasses Blues", "Released 2014",
     "3311730543", "https://shawnhershey.bandcamp.com/album/the-fried-bananas-live-at-montreal-dance-fest-sweet-molasses-blues",
     "https://www.dropbox.com/scl/fo/7pn1cdf2xy3hhjdy2rk8h/ACstqxNgHt1EwIk94pTbcr4?rlkey=63myusk954cpvy6v0s8hcj5oy&dl=0"),
    ("Live at the 2014 Albany Lindy and Blues Exchange", "Released 2015",
     "234184643", "https://shawnhershey.bandcamp.com/album/the-fried-bananas",
     "https://www.dropbox.com/scl/fo/m20060wwxit4k8gv4nmtv/AJ_I1dL8UglEc3npCVCwLZk?rlkey=yvqjr5cv61gpddwzef28zued0&dl=0"),
]

STYLE = """
<style>
  .music-wrap { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
  .music-wrap h1 { font-size: 2rem; margin-bottom: .25rem; }
  .music-intro { color: #cdbfa3; margin-bottom: 2rem; max-width: 640px; }
  .albums { display: flex; flex-wrap: wrap; gap: 2rem; }
  .album { flex: 1 1 320px; max-width: 400px; }
  .album h2 { font-size: 1.15rem; margin: 0 0 .15rem; }
  .album .yr { color: #b7a889; font-size: .85rem; margin-bottom: .6rem; }
  .album iframe { border: 0; width: 100%; height: 620px; }
  .album .dropbox-dl { display: inline-block; margin-top: .5rem; font-size: .85rem; color: #e6b455; }
  .album .dropbox-dl:hover { color: #f3d489; }
</style>
"""

def album_html(title, yr, aid, url, dropbox):
    return f"""
    <div class="album">
      <h2>{html.escape(title)}</h2>
      <div class="yr">The Fried Bananas · {html.escape(yr)}</div>
      <iframe src="https://bandcamp.com/EmbeddedPlayer/album={aid}/size=large/bgcol=f2e8cf/linkcol=b8873b/tracklist=true/transparent=true/" seamless><a href="{url}">{html.escape(title)}</a></iframe>
      <a class="dropbox-dl" href="{dropbox}" target="_blank" rel="noopener">Or download from Dropbox &#8595;</a>
    </div>"""

body = f"""<body class="page-template-default page group-blog">
{header}
<div class="music-wrap">
  <h1>Music</h1>
  <div class="music-intro" id="intro"></div>
  <div class="albums">
    {''.join(album_html(*a) for a in ALBUMS)}
  </div>
</div>
{footer}
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  // Editable intro text lives in music/intro.md — edit that file, push, done.
  fetch('intro.md').then(function (r) {{ return r.text(); }})
    .then(function (t) {{
      var el = document.getElementById('intro');
      el.innerHTML = marked.parse(t);
      el.querySelectorAll('a').forEach(function (a) {{
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }});
    }})
    .catch(function () {{}});
</script>
</body>"""

out = f"<!DOCTYPE html>\n<html lang=\"en\">\n{head.replace('</head>', STYLE + '</head>')}\n{body}\n</html>\n"
open(os.path.join(SITE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote", os.path.join(SITE, "index.html"), "-", len(out), "bytes,", len(ALBUMS), "album(s)")
