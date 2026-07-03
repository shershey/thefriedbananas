#!/usr/bin/env python3
"""Remove a near-white background from an 8-bit RGB PNG using only stdlib.
Flood-fills from the image border so interior light areas (glasses, skin
highlights) are preserved, then crops to the head's bounding box."""
import struct, zlib, sys, collections

def read_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    off, idat, ihdr = 8, b'', None
    while off < len(d):
        ln = struct.unpack('>I', d[off:off+4])[0]
        typ = d[off+4:off+8]
        data = d[off+8:off+8+ln]
        if typ == b'IHDR':
            ihdr = struct.unpack('>IIBBBBB', data)
        elif typ == b'IDAT':
            idat += data
        elif typ == b'IEND':
            break
        off += 12 + ln
    return ihdr, zlib.decompress(idat)

def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
    if pa <= pb and pa <= pc: return a
    if pb <= pc: return b
    return c

def unfilter(raw, w, h, bpp):
    stride = w * bpp
    recon = bytearray(h * stride)
    pos = 0
    for y in range(h):
        ft = raw[pos]; pos += 1
        row = raw[pos:pos+stride]; pos += stride
        base = y * stride
        for x in range(stride):
            val = row[x]
            a = recon[base + x - bpp] if x >= bpp else 0
            b = recon[base - stride + x] if y > 0 else 0
            c = recon[base - stride + x - bpp] if (y > 0 and x >= bpp) else 0
            if ft == 1: val += a
            elif ft == 2: val += b
            elif ft == 3: val += (a + b) >> 1
            elif ft == 4: val += paeth(a, b, c)
            recon[base + x] = val & 0xff
    return recon

def write_rgba_png(path, w, h, rgba):
    stride = w * 4
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter: none
        raw += rgba[y*stride:(y+1)*stride]
    comp = zlib.compress(bytes(raw), 9)
    def chunk(typ, data):
        return (struct.pack('>I', len(data)) + typ + data
                + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff))
    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    out += chunk(b'IDAT', comp)
    out += chunk(b'IEND', b'')
    open(path, 'wb').write(out)

def main(src, dst):
    ihdr, raw = read_png(src)
    w, h, bd, ct, _, _, il = ihdr
    assert bd == 8 and ct == 2 and il == 0, "expected 8-bit RGB non-interlaced"
    rgb = unfilter(raw, w, h, 3)

    def light(i):
        r, g, b = rgb[i], rgb[i+1], rgb[i+2]
        return r > 224 and g > 224 and b > 224

    # flood fill background from the border
    bg = bytearray(w * h)
    stack = collections.deque()
    for x in range(w):
        for yy in (0, h-1):
            p = yy*w + x
            if not bg[p] and light(p*3): bg[p] = 1; stack.append(p)
    for y in range(h):
        for xx in (0, w-1):
            p = y*w + xx
            if not bg[p] and light(p*3): bg[p] = 1; stack.append(p)
    while stack:
        p = stack.pop()
        y, x = divmod(p, w)
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h:
                q = ny*w + nx
                if not bg[q] and light(q*3): bg[q] = 1; stack.append(q)

    # conditional 1px dilation: eat light anti-aliased fringe (not dark hair)
    fringe = []
    for y in range(h):
        for x in range(w):
            p = y*w + x
            if bg[p]: continue
            r, g, b = rgb[p*3], rgb[p*3+1], rgb[p*3+2]
            if (r+g+b) / 3 < 190: continue
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < w and 0 <= ny < h and bg[ny*w+nx]:
                    fringe.append(p); break
    for p in fringe: bg[p] = 1

    # build RGBA + track bounding box of the kept head
    rgba = bytearray(w * h * 4)
    minx, miny, maxx, maxy = w, h, -1, -1
    for p in range(w*h):
        if bg[p]:
            continue
        rgba[p*4:p*4+3] = rgb[p*3:p*3+3]
        rgba[p*4+3] = 255
        y, x = divmod(p, w)
        if x < minx: minx = x
        if x > maxx: maxx = x
        if y < miny: miny = y
        if y > maxy: maxy = y

    # crop to bbox (small padding)
    pad = 8
    minx = max(0, minx-pad); miny = max(0, miny-pad)
    maxx = min(w-1, maxx+pad); maxy = min(h-1, maxy+pad)
    cw, ch = maxx-minx+1, maxy-miny+1
    crop = bytearray(cw*ch*4)
    for y in range(ch):
        s = ((y+miny)*w + minx) * 4
        crop[y*cw*4:(y+1)*cw*4] = rgba[s:s+cw*4]

    write_rgba_png(dst, cw, ch, crop)
    print(f"wrote {dst}  {cw}x{ch} (from {w}x{h})")

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
