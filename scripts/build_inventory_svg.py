#!/usr/bin/env python3
"""Build inventory.svg from data/bottles.js.

A print-ready, text-searchable inventory sheet.  The page is deliberately
generated rather than hand-maintained, so adding a bottle only requires
re-running this script.
"""
from __future__ import annotations

import json
from html import escape
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "bottles.js"
OUT = ROOT / "inventory.svg"

CATS = [
    ("wine", "01", "葡萄酒", "WINE", "#611f2e"),
    ("beer", "02", "啤酒", "THE TAP ROOM", "#b06c2e"),
    ("spirits", "03", "西方酒", "THE PRIVATE CABINET", "#9a7140"),
    ("eastern", "04", "东方酒", "EASTERN LEDGER", "#9b3a2e"),
    ("liqueur", "05", "利口酒", "AFTER-DINNER DRAWER", "#b88a54"),
    ("mixed", "06", "杂酒", "THE COOLER ISSUE", "#2953d6"),
]
CAT_MAP = {key: (no, zh, en, colour) for key, no, zh, en, colour in CATS}

text = DATA.read_text()
start = text.index("window.BOTTLES = [")
end = text.rindex("]") + 1
bottles = json.loads(text[text.index("[", start):end])
by_cat = {key: [b for b in bottles if b["category"] == key] for key, *_ in CATS}
counts = Counter(b["category"] for b in bottles)
brands = len({b["brand"] for b in bottles})

W = 1800
M = 70
COL_W = 800
GAP = 60
COL_X = [M, M + COL_W + GAP]
TOP = 284
ROW_H = 21
HEAD_H = 36
COLUMNS = [
    [key for key in ("wine", "beer")],
    [key for key in ("spirits", "eastern", "liqueur", "mixed")],
]
TOTAL = len(bottles)
COL_HEIGHTS = [sum(HEAD_H + len(by_cat[key]) * ROW_H + 11 for key in keys) for keys in COLUMNS]
FOOTER_Y = TOP + max(COL_HEIGHTS) + 17
H = FOOTER_Y + 114

PAPER = "#f2eadc"
INK = "#1b1c17"
MUTED = "#756b5d"
LINE = "#c8bca9"
ACCENT = "#9b3a2e"
CREAM = "#fbf7ef"

parts = []
def add(s):
    parts.append(s)

def esc(v):
    return escape(str(v if v is not None else ""), quote=True)

def fmt_year(b):
    cat = b["category"]
    if cat == "wine":
        return b.get("vintage") or "NV"
    if cat == "spirits":
        return b.get("age") or "NAS"
    if cat == "eastern":
        v = b.get("vintage") or "NV"
        a = b.get("age") or "NAS"
        return "NV / NAS" if v == "NV" and a == "NAS" else f"{v} / {a}"
    if cat in ("liqueur", "mixed", "beer"):
        return "NV / NAS"
    return b.get("vintage") or b.get("age") or "NV"

def display_name(b):
    name = b["name"]
    brand = b["brand"]
    return name if brand in name else f"{brand} · {name}"

def fmt_meta(b):
    year = fmt_year(b)
    abv = b.get("abv")
    abv_text = (f"{abv:g}%" if isinstance(abv, (int, float)) else "—")
    price = b.get("price")
    price_text = ("¥" * int(price)) if isinstance(price, (int, float)) else "参考"
    return f"{year}  ·  {abv_text}  ·  {price_text}"

add(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="invTitle invDesc">
<title id="invTitle">酒谱 · 库存总表 / {TOTAL} bottles</title>
<desc id="invDesc">按分类列出当前全部 {TOTAL} 款酒、年份或酒龄、酒精度与站内参考价档。</desc>
<style>
  text {{ font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", serif; fill: {INK}; }}
  .mono {{ font-family: "SFMono-Regular", "Cascadia Mono", Menlo, Consolas, monospace; letter-spacing: .045em; }}
  .sans {{ font-family: "Avenir Next", "Helvetica Neue", "PingFang SC", sans-serif; }}
  .name {{ font-size: 13px; }}
  .meta {{ font-size: 7.5px; fill: {MUTED}; }}
  .num {{ font-size: 7.5px; fill: {MUTED}; }}
  .cat-zh {{ font-size: 19px; }}
  .cat-en {{ font-size: 8px; fill: {MUTED}; }}
  .col-label {{ font-size: 8px; fill: {MUTED}; letter-spacing: .12em; }}
  .micro {{ font-size: 8px; fill: {MUTED}; }}
</style>
<rect width="{W}" height="{H}" fill="{PAPER}"/>
<rect x="18" y="18" width="{W-36}" height="{H-36}" fill="none" stroke="{LINE}" stroke-width="1"/>
''')

# Header
add(f'''<text x="{M}" y="47" class="mono micro">酒谱 / BOTTLE FIELD NOTES</text>
<text x="{W-M}" y="47" text-anchor="end" class="mono micro">INVENTORY SHEET / 2026</text>
<text x="{M}" y="124" font-size="72" letter-spacing="2">库存总表</text>
<text x="{M}" y="158" class="mono" font-size="11" fill="{MUTED}">BOTTLE INVENTORY  /  ALL CURRENT BOTTLES  /  EDITION 2026</text>
<text x="{W-M}" y="118" text-anchor="end" font-size="54" fill="{ACCENT}">{TOTAL}</text>
<text x="{W-M}" y="137" text-anchor="end" class="mono micro">BOTTLES / {brands} BRANDS</text>
<text x="{W-M}" y="156" text-anchor="end" class="mono micro">11 PAGES / 6 ROOMS</text>
<line x1="{M}" y1="181" x2="{W-M}" y2="181" stroke="{INK}" stroke-width="1"/>
''')

# Category summary
summary = "  ·  ".join(f"{zh} {counts[key]}" for key, no, zh, en, colour in CATS)
add(f'<text x="{M}" y="205" class="sans" font-size="12" fill="{MUTED}">{esc(summary)}</text>')
add(f'<text x="{W-M}" y="205" text-anchor="end" class="mono micro">按分类 / BY ROOM</text>')

# Column labels
for i, keys in enumerate(COLUMNS):
    label = " + ".join(CAT_MAP[k][3] for k in keys)
    add(f'<text x="{COL_X[i]}" y="258" class="mono col-label">COLUMN {"AB"[i]} / {esc(label)}</text>')
add(f'<line x1="{M}" y1="269" x2="{W-M}" y2="269" stroke="{LINE}" stroke-width="1"/>')

# Rows
idx = 0
col_bottom = []
for ci, keys in enumerate(COLUMNS):
    x = COL_X[ci]
    y = TOP
    for key in keys:
        no, zh, en, colour = CAT_MAP[key]
        items = by_cat[key]
        add(f'<rect x="{x}" y="{y}" width="9" height="9" fill="{colour}"/>')
        add(f'<text x="{x+17}" y="{y+9}" class="cat-zh">{esc(zh)}</text>')
        add(f'<text x="{x+17+len(zh)*20}" y="{y+9}" class="mono cat-en">{no} / {esc(en)}</text>')
        add(f'<text x="{x+COL_W}" y="{y+9}" text-anchor="end" class="meta">{len(items):02d}</text>')
        add(f'<line x1="{x}" y1="{y+17}" x2="{x+COL_W}" y2="{y+17}" stroke="{colour}" stroke-width="1" opacity=".55"/>')
        y += HEAD_H
        for b in items:
            idx += 1
            add(f'<text x="{x}" y="{y+14}" class="mono num">{idx:03d}</text>')
            add(f'<text x="{x+36}" y="{y+14}" class="name">{esc(display_name(b))}</text>')
            add(f'<text x="{x+620}" y="{y+14}" class="name" font-size="7.2">{esc(b["subcategory"])}</text>')
            add(f'<text x="{x+COL_W}" y="{y+14}" text-anchor="end" class="mono meta">{esc(fmt_meta(b))}</text>')
            add(f'<line x1="{x}" y1="{y+20}" x2="{x+COL_W}" y2="{y+20}" stroke="{LINE}" stroke-width=".45" opacity=".55"/>')
            y += ROW_H
        y += 11
    col_bottom.append(y)

footer_y = max(col_bottom) + 17
add(f'<line x1="{M}" y1="{footer_y}" x2="{W-M}" y2="{footer_y}" stroke="{INK}" stroke-width="1"/>')
add(f'<text x="{M}" y="{footer_y+21}" class="mono micro">18+ · 理性饮酒 · 价格档 ¥1–4 与 ABV 仅为站内参考</text>')
add(f'<text x="{W/2}" y="{footer_y+21}" text-anchor="middle" class="mono micro">{TOTAL} BOTTLES / {brands} BRANDS / 11 PAGES</text>')
add(f'<text x="{W-M}" y="{footer_y+21}" text-anchor="end" class="mono micro">© 2026 酒谱 · SIMON WORKSHOP™</text>')
add(f'<text x="{M}" y="{H-30}" class="mono micro">按 data/bottles.js 生成 · 价格与酒精度以实瓶为准</text>')
add(f'<text x="{W-M}" y="{H-30}" text-anchor="end" class="mono micro">INVENTORY / {TOTAL}</text>')

add('</svg>')
OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes), {len(bottles)} bottles, {brands} brands, footer y={footer_y}")
