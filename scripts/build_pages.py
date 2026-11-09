#!/usr/bin/env python3
"""Build the seven v2 pages for 酒谱.

Each page is a different editorial room: a common wayfinding bar keeps the site
navigable, while the page body has its own layout, type and interaction logic.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE_ORDER = [
    ("index.html", "首页", "HOME", "home"),
    ("wine.html", "葡萄酒", "WINE", "wine"),
    ("beer.html", "啤酒", "BEER", "beer"),
    ("spirits.html", "西方酒", "SPIRITS", "spirits"),
    ("eastern.html", "东方酒", "EASTERN", "eastern"),
    ("liqueur.html", "利口酒", "LIQUEUR", "liqueur"),
    ("mixed.html", "杂酒", "MIXED", "mixed"),
]
META = {
    "home": ("酒谱 · 这瓶酒，什么来头，什么时候喝？", "A field guide to bottles, labels and the right moment to open them.", "THE CELLAR INDEX", "ISSUE 00 / SIX ROOMS"),
    "wine": ("葡萄酒 · 酒谱", "葡萄酒庄、年份、葡萄品种与醒酒时间。", "CHÂTEAU LEDGER", 'VOL. 01 / <span data-category-total>108</span> BOTTLES'),
    "beer": ("啤酒 · 酒谱", "黑啤、白啤、拉格、IPA 与修道院啤酒。", "THE TAP ROOM", 'ON TAP / <span data-category-total>55</span> LINES'),
    "spirits": ("西方酒 · 酒谱", "威士忌、白兰地、苦艾酒、龙舌兰、朗姆、金酒与伏特加。", "THE PRIVATE CABINET", 'VOL. 03 / <span data-category-total>125</span> BOTTLES'),
    "eastern": ("东方酒 · 酒谱", "中国、日本、韩国、中东、东南亚与印度的酒。", "酒帖 · 东方风土录", 'VOL. 04 / <span data-category-total>102</span> NOTES'),
    "liqueur": ("利口酒 · 酒谱", "君度、百利甜、雪利、味美思、苦精、绿查特与金巴利。", "THE AFTER-DINNER DRAWER", 'VOL. 05 / <span data-category-total>41</span> BOTTLES'),
    "mixed": ("杂酒 · 酒谱", "预调、果酒与硬苏打。", "THE COOLER ISSUE", 'VOL. 06 / <span data-category-total>27</span> ITEMS'),
}
VEILS = {
    "home": ("00 / INDEX", "酒谱", "THE CELLAR INDEX", "A FIELD GUIDE TO DRINKING"),
    "wine": ("01 / WINE", "葡萄酒", "CHÂTEAU LEDGER", "LABEL ARCHIVE"),
    "beer": ("02 / BEER", "啤酒", "THE TAP ROOM", "ON TAP"),
    "spirits": ("03 / SPIRITS", "西方酒", "THE PRIVATE CABINET", "BY APPOINTMENT"),
    "eastern": ("04 / EASTERN", "东方酒", "THE EASTERN LEDGER", "一页一酒"),
    "liqueur": ("05 / LIQUEUR", "利口酒", "THE AFTER-DINNER DRAWER", "SWEET & BITTER"),
    "mixed": ("06 / MIXED", "杂酒", "THE COOLER ISSUE", "NO RULES"),
}
THEME_COLORS = {
    "home": "#f4eee3",
    "wine": "#f5eee2",
    "beer": "#161411",
    "spirits": "#121814",
    "eastern": "#f0e8d8",
    "liqueur": "#341521",
    "mixed": "#f7f1e4",
}
FOOT_LINES = {
    "home": "酒柜不是收藏，是待办事项。先读标签，再决定什么时候开。",
    "wine": "先看年份，再谈风土。红白之间，不要急着说“好喝”。",
    "beer": "泡沫先到，道理后讲。下一轮之前，先把这一杯喝明白。",
    "spirits": "桶是时间做的房间。年份、产区与酒龄，各有各的语法。",
    "eastern": "米，曲，水，火，陶，坛。地方的酒，要用地方的方式读。",
    "liqueur": "餐后那一点甜，和一点不肯退场的苦。",
    "mixed": "不入流？那就自己开一条流。冰箱门永远留着一条缝。",
}

SEARCH_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.2"></circle><path d="m15.4 15.4 5 5"></path></svg>'
CLOSE_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5 5 19"></path></svg>'
ARROW_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15"></path><path d="m13 6 6 6-6 6"></path></svg>'
DICE_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="16" height="16" rx="1"></rect><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"></circle></svg>'


def nav(active: str) -> str:
    out = []
    for href, zh, en, key in PAGE_ORDER:
        current = ' aria-current="page"' if active == key else ""
        out.append(f'<a class="app-nav-link" href="{href}"{current}><span>{zh}</span><small>{en}</small></a>')
    return "\n        ".join(out)


def header(active: str) -> str:
    strong, small = META[active][2], META[active][3]
    return f'''<header class="app-head head-{active}">
  <div class="head-shell shell">
    <a class="app-brand" href="index.html" aria-label="酒谱首页">
      <span class="brand-seal" aria-hidden="true">谱</span>
      <span class="brand-type">酒谱<small>BOTTLE FIELD NOTES</small></span>
    </a>
    <div class="head-context"><strong>{strong}</strong><span>{small}</span></div>
    <nav class="app-nav" aria-label="酒类导航">
        {nav(active)}
    </nav>
    <div class="head-tools">
      <button class="tool-search" type="button" data-open-search aria-label="搜索全站，快捷键斜杠">{SEARCH_ICON}<span>全站搜索</span><kbd>/</kbd></button>
      <button class="tool-random" type="button" data-random aria-label="随机一瓶">{DICE_ICON}<span>随机</span></button>
    </div>
  </div>
</header>'''


def footer(active: str) -> str:
    label = META[active][2]
    line = FOOT_LINES[active]
    return f'''<footer class="app-foot">
  <div class="foot-shell shell">
    <div class="foot-brand">
      <span class="foot-seal" aria-hidden="true">谱</span>
      <div><strong>酒谱</strong><p>{line}</p></div>
    </div>
    <nav class="foot-nav" aria-label="页脚导航">
      <a href="index.html">首页</a><a href="wine.html">葡萄酒</a><a href="beer.html">啤酒</a><a href="spirits.html">西方酒</a><a href="eastern.html">东方酒</a><a href="liqueur.html">利口酒</a><a href="mixed.html">杂酒</a><a href="map.html">世界地图</a><a href="france.html">法国</a><a href="tasting.html">品鉴</a><a href="classification.html">分级志</a>
    </nav>
    <div class="foot-data">
      <strong>{label}</strong>
      <span><span data-total-bottles>606</span> BOTTLES / <span data-total-brands>407</span> BRANDS</span>
      <span>11 PAGES / EDITION 2026</span>
      <a class="foot-inventory" href="inventory.svg" target="_blank" rel="noopener">酒款总表 / INVENTORY ↗</a>
    </div>
  </div>
  <div class="foot-legal shell">
    <span class="foot-warning">18+ · 理性饮酒 · 未满 18 岁请勿饮酒</span>
    <div class="foot-copy"><span>© <span data-current-year>2026</span> 酒谱 · BOTTLE FIELD NOTES</span><span class="foot-simon">Simon Workshop™</span></div>
  </div>
</footer>'''


def local_search(placeholder: str, extra: str = "") -> str:
    return f'''<div class="local-filter {extra}" id="localSearchWrap">
  {SEARCH_ICON}
  <label class="sr-only" for="localPageSearch">在本页搜索酒款、品牌或产区</label>
  <input id="localPageSearch" type="search" autocomplete="off" spellcheck="false" placeholder="{placeholder}">
  <button class="local-clear" id="localSearchClear" type="button" aria-label="清空本页搜索">{CLOSE_ICON}</button>
</div>'''


def reset_button(extra: str = "") -> str:
    return f'<button class="filter-reset {extra}" id="filterReset" type="button" disabled>清空筛选</button>'


def page_head(active: str) -> str:
    title, desc = META[active][0], META[active][1]
    no, zh, en, note = VEILS[active]
    return f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="{THEME_COLORS[active]}">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="css/core.css">
<link rel="stylesheet" href="css/{active}.css">
</head>
<body data-page="{active}" class="page-{active}">
<div class="page-veil" aria-hidden="true">
  <div class="page-veil-inner">
    <span class="page-veil-no">{no}</span>
    <strong>{zh}</strong>
    <em>{en}</em>
    <span class="page-veil-line"></span>
    <small>{note} · 酒谱</small>
  </div>
</div>
<a class="skip-link" href="#main">跳到主要内容</a>'''


def page_foot(active: str) -> str:
    return f'''{footer(active)}
<script src="data/bottles.js"></script>
<script src="app.js"></script>
</body>
</html>'''


def art_figure(bottle_id: str, label: str, extra_class: str = "") -> str:
    return f'''<figure class="page-bottle {extra_class}">
  <span class="page-bottle-art" data-bottle-art="{bottle_id}"></span>
  <figcaption>{label}</figcaption>
</figure>'''


def category_stats(active: str) -> str:
    return f'''<div class="category-stats">
  <div class="cat-stat"><span class="cat-stat-label">IN THE CELLAR</span><strong data-category-total>—</strong><small>瓶入柜</small></div>
  <div class="cat-stat"><span class="cat-stat-label">BRANDS / 品牌</span><strong data-category-brands>—</strong><small>个名字</small></div>
  <div class="cat-stat"><span class="cat-stat-label">PAGE / 每页</span><strong>15</strong><small>瓶一页</small></div>
</div>'''


def index_page() -> str:
    rooms = [
        ("wine", "01", "CHÂTEAU LEDGER", "葡萄酒", "红 / 白 / 桃红 / 冰 / 起泡 / 加强", "先看年份，再谈风土。", "lafite-2016"),
        ("beer", "02", "THE TAP ROOM", "啤酒", "黑啤 / 小麦 / 拉格 / IPA / 修道院", "泡沫先到，道理后讲。", "guinness-draught"),
        ("spirits", "03", "PRIVATE CABINET", "西方酒", "威士忌 / 白兰地 / 龙舌兰 / 朗姆 / 金酒 / 伏特加", "桶是时间做的房间。", "glenfiddich-18"),
        ("eastern", "04", "酒帖 · 东方风土录", "东方酒", "中国 / 日本 / 韩国 / 中东 / 东南亚 / 印度", "用地方的语法，读地方的酒。", "moutai-feitian"),
        ("liqueur", "05", "AFTER-DINNER DRAWER", "利口酒", "君度 / 百利甜 / 雪利 / 味美思 / 苦精", "甜是开场，苦是余味。", "cointreau-orange"),
        ("mixed", "06", "THE COOLER ISSUE", "杂酒", "预调 / 果酒 / 硬苏打", "不入流？那就自己开一条流。", "rio-microv-peach"),
    ]
    tiles = []
    for key, no, en, zh, types, note, bottle_id in rooms:
        tiles.append(f'''<a class="room-card room-{key}" href="{key}.html">
  <span class="room-no">{no}</span>
  <span class="room-en">{en}</span>
  <span class="room-art" data-bottle-art="{bottle_id}" aria-hidden="true"></span>
  <strong class="room-title">{zh}</strong>
  <span class="room-types">{types}</span>
  <span class="room-note">{note}</span>
  <span class="room-count" data-category-count="{key}">—</span>
  <span class="room-go">进入酒柜 {ARROW_ICON}</span>
</a>''')
    return page_head("home") + header("home") + f'''
<main id="main" class="home-page">
  <section class="home-cover">
    <div class="cover-shell shell">
      <div class="cover-topline"><span>ISSUE 00 / A PRIVATE CELLAR</span><span><span data-total-bottles>606</span> BOTTLES · <span data-total-brands>407</span> BRANDS · 6 ROOMS</span></div>
      <div class="cover-grid">
        <div class="cover-copy">
          <p class="kicker">A FIELD GUIDE TO DRINKING</p>
          <h1 class="cover-title"><span>这瓶酒，</span><span><em>什么来头，</em></span><span>什么时候喝？</span></h1>
          <p class="cover-lede">给写作者、画手与考据党的一只共享酒柜。品牌与酒款分开摆，年份、酒龄、产区、风味、配餐和场景一次看清。不是收藏指南，是一份今晚开什么的备忘录。</p>
          <button class="cover-search" type="button" data-open-search>
            {SEARCH_ICON}<span><strong>搜索全站酒柜</strong><small>酒名 · 品牌 · 产区 · 英文名 · 风味</small></span><kbd>/</kbd>
          </button>
          <div class="cover-shortcuts"><span>试试</span><button type="button" data-search-term="格兰菲迪">格兰菲迪</button><button type="button" data-search-term="香槟">香槟</button><button type="button" data-search-term="烟熏">烟熏</button><button type="button" data-search-term="清酒">清酒</button><button type="button" data-search-term="苦精">苦精</button></div>
          <div class="cover-stats">
            <span><strong data-total-bottles>—</strong> bottles</span>
            <span><strong data-total-brands>—</strong> brands</span>
            <span><strong data-total-categories>06</strong> rooms</span>
            <span>tasting notes, not verdicts</span>
          </div>
        </div>
        <aside class="cover-cabinet" aria-label="封面酒柜：三瓶代表酒，瓶型示意">
          <div class="cabinet-head"><span>THE PRIVATE CABINET</span><span>OPEN / 24H</span></div>
          <div class="cabinet-stage">
            {art_figure("lafite-2016", "WINE · LAFITE 2016", "cabinet-bottle cabinet-bottle-1")}
            {art_figure("yamazaki-12", "SPIRITS · YAMAZAKI 12", "cabinet-bottle cabinet-bottle-2")}
            {art_figure("hoegaarden-white", "BEER · HOEGAARDEN", "cabinet-bottle cabinet-bottle-3")}
          </div>
          <div class="cabinet-foot"><p>先读标签，<br>再决定什么时候开。</p><span>瓶型示意<br>BOTTLE STUDY</span></div>
        </aside>
      </div>
    </div>
  </section>

  <section class="rooms-section shell" id="categories" aria-labelledby="roomsHeading">
    <div class="section-marker"><span class="marker-no">01</span><p class="kicker">THE SIX ROOMS</p><h2 id="roomsHeading">六只酒柜，六种读法。</h2><p>每一页有自己的脾气。别把威士忌的语法套在黄酒上，也别用葡萄酒的杯子喝硬苏打。</p></div>
    <div class="rooms-grid">
      {''.join(tiles)}
    </div>
  </section>

  <section class="home-atlas shell" aria-labelledby="homeAtlasHeading" data-reveal>
    <a class="home-atlas-link" href="map.html">
      <div class="home-atlas-copy">
        <span class="home-atlas-kicker">THE BOTTLE ATLAS / NEW ROOM</span>
        <h2 id="homeAtlasHeading">从产地，<br><em>找到那瓶酒。</em></h2>
        <p>法国、英国、中国、美国、日本……点一个国家，读它的酒；再打开法国专页，看产区、品种、酒种与贵腐菌的分布。</p>
        <span class="home-atlas-cta">打开世界地图 <span aria-hidden="true">→</span></span>
      </div>
      <div class="home-atlas-map" aria-hidden="true">
        <img src="assets/world-mini.svg" alt="">
        <span class="home-atlas-coord">WORLD / 48 COUNTRIES / 606 BOTTLES</span>
      </div>
    </a>
  </section>

  <section class="home-study shell" aria-labelledby="studyHeading" data-reveal>
    <div class="home-study-head">
      <div>
        <p class="kicker">THE NEXT TWO ROOMS / 继续读</p>
        <h2 id="studyHeading">先学会喝，<br>再学会看。</h2>
      </div>
      <p>品鉴课从杯子开始：怎么闻、怎么含、什么时候咽。分级志从酒标开始：AOC、DOCG、Grand Cru、VSOP 到底在说什么。两页都不急，慢慢读。</p>
    </div>
    <div class="study-grid">
      <a class="study-card study-tasting" href="tasting.html">
        <span class="study-no">01 / TASTING</span>
        <span class="study-watermark" aria-hidden="true">01</span>
        <h3>品鉴课</h3>
        <p>看色、闻香、入口、余韵。威士忌、干邑、葡萄酒与气泡酒，四种杯子里的同一件事：把注意力放慢。</p>
        <span class="study-cta">进入品鉴课 <span aria-hidden="true">→</span></span>
      </a>
      <a class="study-card study-classification" href="classification.html">
        <span class="study-no">02 / CLASSIFICATION</span>
        <span class="study-watermark" aria-hidden="true">02</span>
        <h3>分级志</h3>
        <p>法律、产区、酒庄、年份。法国、意大利、西班牙、德国、新世界与干邑，把“等级”拆开读。</p>
        <span class="study-cta">打开分级志 <span aria-hidden="true">→</span></span>
      </a>
    </div>
  </section>

  <section class="home-daily shell" aria-labelledby="todayHeading">
    <div class="section-marker"><span class="marker-no">02</span><p class="kicker">TODAY'S POUR</p><h2 id="todayHeading">今天，开这瓶。</h2><p>每天按日期从酒柜里轮换。不是推荐算法，只是一点随机的诚实。</p></div>
    <div id="todayMount"></div>
  </section>

  <section class="home-notes shell" aria-labelledby="notesHeading">
    <div class="notes-lead"><span class="kicker">HOUSE NOTES</span><h2 id="notesHeading">读标之前，<br>先读这三行。</h2></div>
    <div class="notes-list">
      <article class="note-row"><span>01</span><div><h3>年份、酒龄、NV</h3><p>葡萄酒写 vintage；威士忌写 age，没有标注就是 NAS；啤酒和多数预调酒写 NV。时间单位不能混着读。</p></div></article>
      <article class="note-row"><span>02</span><div><h3>品牌不是酒款</h3><p>格兰菲迪是品牌，12 / 15 / 18 / 21 / 30 / 40 / 50 年是七款酒。尊尼获加的黑红绿金蓝，也不是同一个东西换颜色。</p></div></article>
      <article class="note-row"><span>03</span><div><h3>价格档不是报价</h3><p>¥ 到 ¥¥¥¥ 是站内相对分档。具体参考价会随市场、渠道、年份漂移；风味描述是品鉴参考，不是质量结论。</p></div></article>
    </div>
  </section>
</main>
''' + page_foot("home")


def wine_page() -> str:
    return page_head("wine") + header("wine") + f'''
<main id="main" class="wine-page">
  <section class="wine-hero">
    <div class="wine-hero-inner shell">
      <div class="wine-hero-top"><span>CATALOGUE 01 / VINS &amp; CLIMATS</span><span>DOMAINE NOTES / EDITION 2026</span></div>
      <div class="wine-hero-main">
        <div class="wine-title-zone">
          <h1><span class="wine-h1">葡萄酒</span><span class="wine-h1-en">Le langage lent</span></h1>
          <p class="wine-overline">先看年份，再谈风土。</p>
        </div>
        <div class="wine-manifesto">
          <p>红、白、桃红、冰酒、起泡与加强酒，全都按酒庄、葡萄和年份拆开。不要急着说“好喝”，先问它是哪一块坡、哪一个夏天、用哪一串葡萄写的。</p>
          <div class="wine-meta-line"><span><strong data-category-total>—</strong> 瓶入窖</span><span><strong data-category-brands>—</strong> 个酒庄</span><span>每页 15 瓶</span></div>
        </div>
      </div>
      <div class="wine-hero-bottom">
        <div class="wine-vitrine" aria-label="三瓶代表葡萄酒，瓶型示意">
          {art_figure("lafite-2016", "01 / PAUILLAC · 2016", "wine-figure wine-figure-1")}
          {art_figure("cloudy-bay-sb-2023", "02 / MARLBOROUGH · 2023", "wine-figure wine-figure-2")}
          {art_figure("chateau-dyquem-2017", "03 / SAUTERNES · 2017", "wine-figure wine-figure-3")}
        </div>
        <p class="wine-vitrine-note">瓶型示意 · 酒标随年份与酒庄变化<br><span>THE BOTTLE IS A STUDY, NOT A PHOTO.</span></p>
      </div>
    </div>
  </section>

  <section class="wine-catalog" id="catalog" aria-labelledby="wineCatalogHeading">
    <span id="catalogTop"></span>
    <div class="wine-layout shell">
      <aside class="wine-filter-rail" aria-label="葡萄酒筛选">
        <div class="wine-filter-head"><p class="kicker">THE CELLAR INDEX</p><h2>酒窖目录</h2><p>先缩小范围，再决定开哪一瓶。</p></div>
        {local_search("搜酒庄 / 葡萄 / 产区", "wine-local")}
        <div class="wine-filter-controls" id="filterControls"></div>
        {reset_button("wine-reset")}
        <p class="fineprint">价格档 1–4 为站内相对分档，不构成报价。风味描述为主观品鉴参考。</p>
      </aside>
      <div class="wine-shelf">
        <header class="wine-shelf-head">
          <div><p class="kicker">LABEL ARCHIVE / 16 NOTES</p><h2 id="wineCatalogHeading">酒标档案</h2></div>
          <p class="result-line" id="resultCount" aria-live="polite">正在整理酒窖…</p>
        </header>
        <div class="wine-result-sub"><div class="active-chips" id="activeFilterChips"></div><span class="mono-label">PER PAGE / 15</span></div>
        <div class="wine-grid" id="bottleGrid"></div>
        <nav class="pager" id="pagination" aria-label="葡萄酒分页"></nav>
      </div>
    </div>
  </section>

  <section class="wine-bottom-note shell">
    <div class="wine-note"><span class="note-index">01</span><strong>先看葡萄</strong><p>赤霞珠、梅洛、黑皮诺、霞多丽……品种不是口感保证，但会告诉你单宁、酸度和香气的方向。</p></div>
    <div class="wine-note"><span class="note-index">02</span><strong>再看年份</strong><p>年份是那一年的天气写进酒里的注脚。它可以重要，也可能被酿造和储存盖过。</p></div>
    <div class="wine-note"><span class="note-index">03</span><strong>最后才说醒酒</strong><p>只有香气真正复杂的酒，才值得写一段醒酒时间。其余的，开瓶、倒杯、等它自己说。</p></div>
  </section>
</main>
''' + page_foot("wine")


def beer_page() -> str:
    return page_head("beer") + header("beer") + f'''
<main id="main" class="beer-page">
  <section class="beer-hero">
    <div class="beer-ticker" aria-hidden="true"><span>STOUT · WITBIER · HELLES · PALE LAGER · IPA · TRAPPIST ·</span><span>STOUT · WITBIER · HELLES · PALE LAGER · IPA · TRAPPIST ·</span></div>
    <div class="beer-hero-inner shell">
      <div class="beer-title-zone">
        <span class="beer-overline">THE TAP ROOM / NO. 02</span>
        <h1><span>啤酒</span><small>BEER</small></h1>
        <p class="beer-statement">泡沫先到，<br>道理后讲。</p>
      </div>
      <div class="beer-copy-zone">
        <p class="beer-intro">黑啤、白啤、小麦、拉格、IPA、修道院。麦芽是骨架，酒花是脾气，酵母说了算。别把冰镇当风格，也别把苦度当深度。</p>
        <div class="beer-big-stats"><div><strong data-category-total>—</strong><span>LINES ON TAP</span></div><div><strong>4–12°C</strong><span>COLD &amp; FRESH</span></div><div><strong>NV / NAS</strong><span>NO VINTAGE CLAIM</span></div></div>
      </div>
      <div class="beer-art" aria-label="三瓶代表啤酒，瓶型示意">
        {art_figure("guinness-draught", "STOUT / GUINNESS", "beer-figure beer-figure-1")}
        {art_figure("hoegaarden-white", "WITBIER / HOEGAARDEN", "beer-figure beer-figure-2")}
        {art_figure("brewdog-punk-ipa", "IPA / PUNK", "beer-figure beer-figure-3")}
      </div>
    </div>
    <div class="beer-hero-bottom shell"><span>POUR SLOWLY / 泡沫是这杯酒的第一口</span><span>下一轮？先看酒单 ↓</span></div>
  </section>

  <section class="beer-board" id="catalog" aria-labelledby="beerBoardHeading">
    <span id="catalogTop"></span>
    <div class="beer-board-inner shell">
      <header class="beer-board-head">
        <div><p class="kicker">ON TAP / TODAY'S LIST</p><h2 id="beerBoardHeading">今日上枪</h2></div>
        {local_search("搜酒厂 / 风格 / 国家", "beer-local")}
      </header>
      <div class="beer-filter-console"><div class="beer-filter-controls" id="filterControls"></div>{reset_button("beer-reset")}</div>
      <div class="beer-result-row"><p class="result-line" id="resultCount" aria-live="polite">正在擦杯…</p><div class="active-chips" id="activeFilterChips"></div></div>
      <div class="beer-grid" id="bottleGrid"></div>
      <nav class="pager beer-pager" id="pagination" aria-label="啤酒分页"></nav>
    </div>
  </section>

  <section class="beer-ritual shell">
    <div class="beer-ritual-title"><p class="kicker">AFTER THE FIRST SIP</p><h2>一杯啤酒的三件事</h2></div>
    <div class="beer-ritual-grid">
      <div><span>01</span><strong>泡沫</strong><p>倒酒别急。泡沫是香气与二氧化碳的盖子，不是杯子里的留白。</p></div>
      <div><span>02</span><strong>温度</strong><p>拉格可以更冷，烈性艾尔别从冰柜里直接拿出来。温度会把风味关掉。</p></div>
      <div><span>03</span><strong>新鲜</strong><p>IPA 最怕时间。酒花香气会先走，苦度留在原地，最后变成一只生气的空罐。</p></div>
    </div>
  </section>
</main>
''' + page_foot("beer")


def spirits_page() -> str:
    return page_head("spirits") + header("spirits") + f'''
<main id="main" class="spirits-page">
  <section class="spirits-hero">
    <div class="spirits-hero-inner shell">
      <div class="spirits-hero-top"><span>PRIVATE COLLECTION / VOL. 03</span><span>OPENED BY APPOINTMENT</span></div>
      <div class="spirits-hero-main">
        <div class="spirits-copy">
          <p class="kicker">THE SPIRITS LIBRARY</p>
          <h1><span>西方酒</span><small>THE SPIRITS LIBRARY</small></h1>
          <p class="spirits-lede">桶是时间做的房间。威士忌看酒龄和类型，白兰地、龙舌兰、朗姆、金酒、伏特加各有各的语法。别混为一谈，也别把价签当风味。</p>
          <div class="spirits-types"><span>威士忌</span><span>白兰地</span><span>龙舌兰</span><span>朗姆</span><span>金酒</span><span>伏特加</span></div>
        </div>
        <div class="spirits-art" aria-label="三瓶代表西方烈酒，瓶型示意">
          {art_figure("glenfiddich-18", "SPEYSIDE / 18 YEARS", "spirits-figure spirits-figure-1")}
          {art_figure("johnnie-walker-blue", "SCOTCH / BLUE", "spirits-figure spirits-figure-2")}
          {art_figure("hennessy-xo", "COGNAC / X.O", "spirits-figure spirits-figure-3")}
        </div>
      </div>
      <div class="spirits-hero-foot"><div class="spirits-stat"><strong data-category-total>—</strong><span>BOTTLES IN THE LIBRARY</span></div><div class="spirits-stat"><strong>05</strong><span>WHISKY ORIGINS</span></div><p class="spirits-quote">“先看酒精度，再看年份。最后才允许自己喜欢它。”</p></div>
    </div>
  </section>

  <section class="spirits-catalog" id="catalog" aria-labelledby="spiritsCatalogHeading">
    <span id="catalogTop"></span>
    <div class="spirits-catalog-inner shell">
      <header class="spirits-catalog-head">
        <div><p class="kicker">THE BOTTLE LIBRARY / A–Z</p><h2 id="spiritsCatalogHeading">瓶藏索引</h2><p>酒龄只是其中一列。产区和类型，往往先把话说清楚。</p></div>
        {local_search("搜酒厂 / 产区 / 威士忌类型", "spirits-local")}
      </header>
      <div class="spirits-filter-row"><div class="spirits-filter-controls" id="filterControls"></div>{reset_button("spirits-reset")}</div>
      <div class="spirits-result-row"><p class="result-line" id="resultCount" aria-live="polite">正在打开酒柜…</p><div class="active-chips" id="activeFilterChips"></div></div>
      <div class="spirits-grid" id="bottleGrid"></div>
      <nav class="pager spirits-pager" id="pagination" aria-label="西方酒分页"></nav>
    </div>
  </section>

  <section class="spirits-taxonomy shell">
    <div class="taxonomy-head"><p class="kicker">THE AGE QUESTION</p><h2>威士忌的来路，<br>不只是一串年份。</h2></div>
    <div class="taxonomy-list"><div><span>SCOTCH</span><strong>苏格兰</strong><p>斯佩塞的果香、艾雷的泥煤、高地的宽阔，同一张户口本，不同的方言。</p></div><div><span>BOURBON</span><strong>波本</strong><p>至少 51% 玉米，新烤橡木桶，甜香草的底色。不是“美国威士忌”的同义词。</p></div><div><span>JAPANESE</span><strong>日本</strong><p>水楢桶、细腻调和与长时间熟成。安静不等于没有层次。</p></div><div><span>IRISH &amp; ENGLISH</span><strong>爱尔兰 / 英格兰</strong><p>三次蒸馏的柔顺，以及正在复兴的英格兰单一麦芽。别只盯着苏格兰。</p></div></div>
  </section>
</main>
''' + page_foot("spirits")


def eastern_page() -> str:
    return page_head("eastern") + header("eastern") + f'''
<main id="main" class="eastern-page">
  <section class="eastern-hero">
    <div class="eastern-hero-inner shell">
      <div class="eastern-hero-top"><span>酒帖 / 东方风土录</span><span>VOL. 04 · <span data-category-total>102</span> NOTES</span></div>
      <div class="eastern-hero-main">
        <div class="eastern-title-zone">
          <p class="kicker">THE EASTERN LEDGER</p>
          <h1><span class="eastern-h1">东方</span><span class="eastern-h1-red">酒</span></h1>
          <p class="eastern-poem">米，曲，水，火，陶，坛。</p>
        </div>
        <div class="eastern-vertical-copy" aria-hidden="true"><span>不按西方的分类削足适履</span><span>先读地方，再读酒</span></div>
        <div class="eastern-hero-copy"><p>中国、日本、韩国、中东、东南亚、印度。清酒、烧酒、黄酒、酱香、亚力酒、朗姆与泰式烈酒。这里的共同点不是味道，而是另一套关于水、米、时间与火的语法。</p><div class="eastern-regions"><span>中国</span><span>日本</span><span>韩国</span><span>中东</span><span>东南亚</span><span>印度</span></div></div>
        <div class="eastern-art" aria-label="三瓶代表东方酒，瓶型示意">
          {art_figure("moutai-feitian", "酱香 / 茅台", "eastern-figure eastern-figure-1")}
          {art_figure("dassai-45", "清酒 / 獭祭", "eastern-figure eastern-figure-2")}
          {art_figure("arak-el-massaya", "亚力 / 黎巴嫩", "eastern-figure eastern-figure-3")}
        </div>
      </div>
      <div class="eastern-hero-foot"><span data-category-total>—</span><span>通酒帖 · 从中国到印度</span><span>瓶型示意 / BOTTLE STUDY</span></div>
    </div>
  </section>

  <section class="eastern-catalog" id="catalog" aria-labelledby="easternCatalogHeading">
    <span id="catalogTop"></span>
    <div class="eastern-catalog-inner shell">
      <header class="eastern-catalog-head">
        <div><p class="kicker">开卷 / THE EASTERN LEDGER</p><h2 id="easternCatalogHeading">一页一酒</h2></div>
        {local_search("检索酒名 / 地方 / 香料", "eastern-local")}
      </header>
      <div class="eastern-filter-row"><div class="eastern-filter-controls" id="filterControls"></div>{reset_button("eastern-reset")}<span class="eastern-page-mark">帖 / 15 PER PAGE</span></div>
      <div class="eastern-result-row"><p class="result-line" id="resultCount" aria-live="polite">正在研墨…</p><div class="active-chips" id="activeFilterChips"></div></div>
      <div class="eastern-grid" id="bottleGrid"></div>
      <nav class="pager eastern-pager" id="pagination" aria-label="东方酒分页"></nav>
    </div>
  </section>

  <section class="eastern-glossary shell">
    <div class="eastern-glossary-head"><span class="kicker">READING THE EAST</span><h2>三种读法，<br>不必翻译成葡萄酒。</h2></div>
    <div class="eastern-glossary-grid"><div><span>曲</span><strong>发酵的引子</strong><p>中国白酒与黄酒的曲，决定了香气的一半。酱香、浓香、清香，不是形容词，是工艺路线。</p></div><div><span>米</span><strong>清酒的精米步合</strong><p>磨掉多少米，决定留下什么。獭祭的 45 不是酒龄，也不是甜度。</p></div><div><span>水</span><strong>稀释与加冰</strong><p>Arak 遇水会变乳白，烧酒加冰是日常。不要把物理变化当成酒坏了。</p></div></div>
  </section>
</main>
''' + page_foot("eastern")


def liqueur_page() -> str:
    return page_head("liqueur") + header("liqueur") + f'''
<main id="main" class="liqueur-page">
  <section class="liqueur-hero">
    <div class="liqueur-hero-inner shell">
      <div class="liqueur-frame">
        <div class="liqueur-frame-top"><span>THE AFTER-DINNER DRAWER</span><span>VOL. 05 / SWEET &amp; BITTER</span></div>
        <div class="liqueur-title-zone"><p class="kicker">DIGESTIF / APÉRITIF / ACCENT</p><h1>利口酒<em>Liqueur</em></h1><p>餐后那一点甜，<br>和一点不肯退场的苦。</p></div>
        <div class="liqueur-art" aria-label="三瓶代表利口酒，瓶型示意">
          {art_figure("cointreau-orange", "ORANGE / 40%", "liqueur-figure liqueur-figure-1")}
          {art_figure("baileys-original", "CREAM / 17%", "liqueur-figure liqueur-figure-2")}
          {art_figure("angostura-aromatic", "BITTERS / 44.7%", "liqueur-figure liqueur-figure-3")}
        </div>
        <div class="liqueur-frame-bottom"><p>君度、百利甜、雪利、味美思、苦精、绿查特、金巴利。八只抽屉，各自有一点甜，也各自有一点不肯退场的苦。</p><div><span><strong data-category-total>—</strong> 瓶在柜</span><span>先分清主角与标点</span></div></div>
      </div>
    </div>
  </section>

  <section class="liqueur-catalog" id="catalog" aria-labelledby="liqueurCatalogHeading">
    <span id="catalogTop"></span>
    <div class="liqueur-catalog-inner shell">
      <header class="liqueur-catalog-head">
        <div><p class="kicker">THE DRAWER / MENU</p><h2 id="liqueurCatalogHeading">今晚最后一杯</h2><p>有的适合纯饮，有的更适合作为一杯酒的标点。</p></div>
        {local_search("搜品牌 / 类型 / 风味", "liqueur-local")}
      </header>
      <div class="liqueur-filter-card"><div class="liqueur-filter-controls" id="filterControls"></div>{reset_button("liqueur-reset")}</div>
      <div class="liqueur-result-row"><p class="result-line" id="resultCount" aria-live="polite">正在擦亮杯子…</p><div class="active-chips" id="activeFilterChips"></div></div>
      <div class="liqueur-grid" id="bottleGrid"></div>
      <nav class="pager liqueur-pager" id="pagination" aria-label="利口酒分页"></nav>
    </div>
  </section>

  <section class="liqueur-usage shell">
    <div class="usage-head"><p class="kicker">HOW TO USE A DRAWER</p><h2>纯饮、加冰，<br>或者只点两滴。</h2></div>
    <div class="usage-grid"><div><span>01</span><strong>纯饮</strong><p>君度与苦精都可能需要一小杯。量要小，香气才站得住。</p></div><div><span>02</span><strong>加冰</strong><p>百利甜、味美思可以更冷一点。冰是降温，不是加量。</p></div><div><span>03</span><strong>作标点</strong><p>苦精两滴就够。它负责让一杯酒结束得更有形状。</p></div></div>
  </section>
</main>
''' + page_foot("liqueur")


def mixed_page() -> str:
    return page_head("mixed") + header("mixed") + f'''
<main id="main" class="mixed-page">
  <section class="mixed-hero">
    <div class="mixed-sticker mixed-sticker-a" aria-hidden="true">不入流<br>酒单</div>
    <div class="mixed-hero-inner shell">
      <div class="mixed-title-zone">
        <span class="mixed-overline">THE COOLER ISSUE / NO. 06</span>
        <h1><span>杂酒</span><small>MIXED<br>NOT MIXED UP.</small></h1>
        <p class="mixed-statement">不入流？<br>那就自己开一条流。</p>
      </div>
      <div class="mixed-copy-zone"><p>RIO、果酒、硬苏打、苹果酒，偶尔还有一瓶草本配制酒。它们不属于任何严肃酒柜，却真实地占据着冰箱门和餐边柜。酒精度从 3% 到 35% 不等：读标签，比装腔重要。</p><div class="mixed-badges"><span>ANY ABV</span><span>ICE OR NEAT</span><span>READ THE LABEL</span></div></div>
      <div class="mixed-art" aria-label="三件代表杂酒，瓶型示意">
        {art_figure("rio-microv-peach", "RIO / 3%", "mixed-figure mixed-figure-1")}
        {art_figure("white-claw-black-cherry", "WHITE CLAW / 5%", "mixed-figure mixed-figure-2")}
        {art_figure("meijian-green-plum", "MEIJIAN / 12%", "mixed-figure mixed-figure-3")}
      </div>
    </div>
    <div class="mixed-ticker" aria-hidden="true"><span>PRETTY PACKAGING · ANY ABV · STILL ALCOHOL · READ THE LABEL ·</span><span>PRETTY PACKAGING · ANY ABV · STILL ALCOHOL · READ THE LABEL ·</span></div>
  </section>

  <section class="mixed-catalog" id="catalog" aria-labelledby="mixedCatalogHeading">
    <span id="catalogTop"></span>
    <div class="mixed-catalog-inner shell">
      <header class="mixed-catalog-head"><div><p class="kicker">THE FRIDGE DOOR / <span data-category-total>27</span> ITEMS</p><h2 id="mixedCatalogHeading">冰箱门</h2></div>{local_search("搜口味 / 品牌 / 类型", "mixed-local")}</header>
      <div class="mixed-filter-console"><div class="mixed-filter-controls" id="filterControls"></div>{reset_button("mixed-reset")}<span class="mixed-fridge-temp">4°C / SERVE COLD</span></div>
      <div class="mixed-result-row"><p class="result-line" id="resultCount" aria-live="polite">正在关冰箱门…</p><div class="active-chips" id="activeFilterChips"></div></div>
      <div class="mixed-grid" id="bottleGrid"></div>
      <nav class="pager mixed-pager" id="pagination" aria-label="杂酒分页"></nav>
    </div>
  </section>

  <section class="mixed-manifesto shell">
    <div class="mixed-manifesto-title"><p class="kicker">A SMALL MANIFESTO</p><h2>它们不严肃，<br>但它们是酒。</h2></div>
    <div class="mixed-manifesto-grid"><div class="m-pink"><span>01</span><strong>先看酒精度</strong><p>3%、5%、12% 都是酒。果味和气泡不会把酒精删掉。</p></div><div class="m-yellow"><span>02</span><strong>再看配料表</strong><p>糖、香精、基酒与果汁的比例，比包装上的桃子更重要。</p></div><div class="m-blue"><span>03</span><strong>最后才谈场合</strong><p>冰箱门、野餐、派对、独自下班。轻，不代表不需要认真喝。</p></div></div>
  </section>
</main>
''' + page_foot("mixed")


def main() -> None:
    (ROOT / "index.html").write_text(index_page(), encoding="utf-8")
    (ROOT / "wine.html").write_text(wine_page(), encoding="utf-8")
    (ROOT / "beer.html").write_text(beer_page(), encoding="utf-8")
    (ROOT / "spirits.html").write_text(spirits_page(), encoding="utf-8")
    (ROOT / "eastern.html").write_text(eastern_page(), encoding="utf-8")
    (ROOT / "liqueur.html").write_text(liqueur_page(), encoding="utf-8")
    (ROOT / "mixed.html").write_text(mixed_page(), encoding="utf-8")
    print("Built 7 v2 pages.")


if __name__ == "__main__":
    main()
