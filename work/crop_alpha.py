#!/usr/bin/env python3
"""Crop an 8-bit RGBA PNG to the bounding box of its non-transparent pixels
so heads are framed consistently. Stdlib only."""
import struct, sys
from cutout import read_png, unfilter, write_rgba_png

def main(path, pad=6):
    ihdr, raw = read_png(path)
    w, h, bd, ct, _, _, il = ihdr
    assert bd == 8 and ct == 6 and il == 0, "expected 8-bit RGBA non-interlaced"
    rgba = unfilter(raw, w, h, 4)

    minx, miny, maxx, maxy = w, h, -1, -1
    for p in range(w*h):
        if rgba[p*4+3] > 10:
            y, x = divmod(p, w)
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y

    minx = max(0, minx-pad); miny = max(0, miny-pad)
    maxx = min(w-1, maxx+pad); maxy = min(h-1, maxy+pad)
    cw, ch = maxx-minx+1, maxy-miny+1
    crop = bytearray(cw*ch*4)
    for y in range(ch):
        s = ((y+miny)*w + minx) * 4
        crop[y*cw*4:(y+1)*cw*4] = rgba[s:s+cw*4]

    write_rgba_png(path, cw, ch, crop)
    print(f"cropped {path}: {w}x{h} -> {cw}x{ch}")

if __name__ == '__main__':
    main(sys.argv[1])
