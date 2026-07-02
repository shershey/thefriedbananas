#!/usr/bin/env python3
"""Mirror the latest Wayback capture of every thefriedbananas.com file into ./site."""
import json, os, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
CDX = ("http://web.archive.org/cdx/search/cdx?url=thefriedbananas.com*"
       "&output=json&filter=statuscode:200&fl=original,timestamp,mimetype&collapse=digest")

def fetch(url, timeout=40, attempts=7):
    last = None
    for a in range(1, attempts + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site-recovery)"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:
            last = e
            time.sleep(2.5 * a)  # Archive throttles bursts; back off hard
    raise last

def local_path(original):
    p = urllib.parse.urlparse(original)
    path = p.path
    if path.startswith("/"):
        path = path[1:]
    if path == "" or path.endswith("/"):
        path += "index.html"
    # strip query for the on-disk name (static host ignores ?ver= anyway)
    path = path.replace("\\", "/")
    # guard against traversal / absolute
    parts = [seg for seg in path.split("/") if seg not in ("", ".", "..")]
    return os.path.join(OUT, *parts)

def main():
    print("Fetching file list from CDX…")
    rows = json.loads(fetch(CDX).decode("utf-8", "replace"))[1:]
    # dedupe to the LATEST timestamp per normalized (host-less) path
    latest = {}
    for original, ts, mime in rows:
        key = urllib.parse.urlparse(original)._replace(netloc="thefriedbananas.com").geturl()
        if key not in latest or ts > latest[key][0]:
            latest[key] = (ts, original)
    print(f"{len(latest)} unique files to mirror.")

    ok, fail, skip = [], [], 0
    items = list(latest.items())
    for i, (key, (ts, original)) in enumerate(items, 1):
        dest = local_path(original)
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            skip += 1
            continue
        try:
            data = fetch(f"http://web.archive.org/web/{ts}id_/{original}")
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "wb") as f:
                f.write(data)
            ok.append(dest)
            if i % 20 == 0:
                print(f"  … {i}/{len(items)}")
        except Exception as e:
            fail.append((original, str(e)))
        time.sleep(1.0)  # be polite to the Archive
    print(f"(skipped {skip} already-downloaded)")

    print(f"\nDownloaded {len(ok)} files. {len(fail)} failed.")
    for original, err in fail[:20]:
        print("  FAIL", original, "->", err)

if __name__ == "__main__":
    main()
