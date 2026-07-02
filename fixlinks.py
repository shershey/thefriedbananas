#!/usr/bin/env python3
"""Rewrite absolute self-URLs in the mirror to root-relative so the site renders
on https and anywhere, not just the original http://thefriedbananas.com."""
import os, re

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
EXITS = (".html", ".htm", ".css", ".js", ".xml")

# Longest first so www. is handled before the bare host.
HOST_PREFIXES = [
    "http://www.thefriedbananas.com",
    "https://www.thefriedbananas.com",
    "//www.thefriedbananas.com",
    "http://thefriedbananas.com",
    "https://thefriedbananas.com",
    "//thefriedbananas.com",
]

changed = 0
for root, _, files in os.walk(SITE):
    for name in files:
        if not name.lower().endswith(EXITS):
            continue
        path = os.path.join(root, name)
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except Exception:
            continue
        orig = text
        for pre in HOST_PREFIXES:
            text = text.replace(pre, "")
        # a bare host with no path became empty — point it at the site root
        text = re.sub(r'(href|src)=""', r'\1="/"', text)
        if text != orig:
            open(path, "w", encoding="utf-8").write(text)
            changed += 1

print(f"Rewrote {changed} files to root-relative links.")
