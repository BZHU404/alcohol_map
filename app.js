/* 酒谱 · app.js
 * 共享交互：全站搜索、分类筛选、分页、详情抽屉、深链接、随机一瓶、A5 打印。
 * 纯原生脚本，无构建步骤，不使用 fetch。
 */
(function () {
  "use strict";

  var ALL = Array.isArray(window.BOTTLES) ? window.BOTTLES.slice() : [];
  var PAGE_SIZE = 15;
  var PAGE = document.body.getAttribute("data-page") || "home";
  var BASE_TITLE = document.title;
  var SCENARIOS = ["餐前", "配餐", "餐后", "日常", "派对"];
  var AGE_BANDS = ["NAS / 无年份标注", "10 年以下", "10–17 年", "18–24 年", "25 年及以上"];
  var PRICE_TIERS = {
    1: { name: "日常", short: "日常", range: "约 ¥300 以内" },
    2: { name: "进阶", short: "进阶", range: "约 ¥300–1,000" },
    3: { name: "高端", short: "高端", range: "约 ¥1,000–5,000" },
    4: { name: "收藏", short: "收藏", range: "约 ¥5,000 以上" }
  };
  var CATALOG_COPY = {
    wine: { unit: "瓶", verb: "入窖", scope: "本柜", emptyTitle: "这瓶酒不在酒窖里", emptyText: "换一块坡，或清掉一个条件。年份、葡萄和产区都能在本页继续搜。" },
    beer: { unit: "款", verb: "在枪", scope: "酒单", emptyTitle: "这一轮酒头空了", emptyText: "换一种风格，或者把条件放宽。新鲜泡沫值得再试一次。" },
    spirits: { unit: "瓶", verb: "在架", scope: "酒库", emptyTitle: "这格酒柜是空的", emptyText: "酒龄、产区或类型都可能是限制。删掉一个条件，让酒保重新找。" },
    eastern: { unit: "通", verb: "入帖", scope: "总帖", emptyTitle: "这一页没有酒帖", emptyText: "换一个地方，或者拆掉一个字。风土比过滤器更宽。" },
    liqueur: { unit: "瓶", verb: "在柜", scope: "抽屉", emptyTitle: "抽屉里没有这一瓶", emptyText: "换一个甜苦方向，或者把搜索词收短一点。" },
    mixed: { unit: "件", verb: "在册", scope: "杂酒柜", emptyTitle: "杂酒柜里刚好没有", emptyText: "换个类型，或把价格条件放开。冰箱门和餐边柜总会有一点别的东西。" }
  };
  var CATEGORY_COUNT_UNIT = { wine: "瓶", beer: "款", spirits: "瓶", eastern: "通", liqueur: "瓶", mixed: "件" };
  var CATEGORY_ORDER = ["wine", "beer", "spirits", "eastern", "liqueur", "mixed"];
  var CATEGORY_META = {
    wine: {
      index: "01",
      page: "wine.html",
      zh: "葡萄酒",
      en: "WINE",
      accent: "#7a2b3a",
      short: "红 / 白 / 桃红 / 冰 / 起泡 / 加强"
    },
    beer: {
      index: "02",
      page: "beer.html",
      zh: "啤酒",
      en: "BEER",
      accent: "#b07a3e",
      short: "黑啤 / 小麦 / 拉格 / IPA / 修道院"
    },
    spirits: {
      index: "03",
      page: "spirits.html",
      zh: "西方酒",
      en: "SPIRITS",
      accent: "#1f3a32",
      short: "威士忌 / 白兰地 / 龙舌兰 / 朗姆 / 金酒 / 伏特加"
    },
    eastern: {
      index: "04",
      page: "eastern.html",
      zh: "东方酒",
      en: "EASTERN",
      accent: "#8a5a36",
      short: "中国 / 日本 / 韩国 / 中东 / 东南亚 / 印度"
    },
    liqueur: {
      index: "05",
      page: "liqueur.html",
      zh: "利口酒",
      en: "LIQUEUR",
      accent: "#7a2b3a",
      short: "君度 / 百利甜 / 雪利 / 味美思 / 苦精"
    },
    mixed: {
      index: "06",
      page: "mixed.html",
      zh: "杂酒",
      en: "MIXED",
      accent: "#4e6b5b",
      short: "预调 / 果酒 / 硬苏打"
    }
  };

  var scrollUiSync = function () {};
  var state = {
    filters: {},
    query: "",
    page: 1,
    openId: null,
    drawerReturnFocus: null,
    searchReturnFocus: null,
    drawerHideTimer: null,
    toastTimer: null
  };

  var icons = {
    search:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.2"></circle><path d="m15.4 15.4 5 5"></path></svg>',
    close:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5 5 19"></path></svg>',
    arrow:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15"></path><path d="m13 6 6 6-6 6"></path></svg>',
    arrowLeft:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>',
    chevron:
      '<svg class="icon select-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg>',
    dice:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="16" height="16" rx="1"></rect><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"></circle></svg>',
    print:
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 9V4h10v5"></path><path d="M7 18H4V9h16v9h-3"></path><rect x="7" y="14" width="10" height="6"></rect><path d="M17 12h.01"></path></svg>'
  };

  var els = {};

  /* -------------------------------------------------------
     Utilities
     ------------------------------------------------------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function truncate(value, length) {
    var text = String(value == null ? "" : value);
    var chars = Array.from(text);
    return chars.length > length ? chars.slice(0, length).join("").replace(/[，、；：,\s]+$/, "") + "…" : text;
  }

  function normalize(value) {
    return String(value == null ? "" : value)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function pad2(number) {
    return String(number).padStart(2, "0");
  }

  function unique(list) {
    return Array.from(new Set(list.filter(function (item) { return item != null && item !== ""; })));
  }

  function byId(id) {
    return ALL.find(function (bottle) { return bottle.id === id; });
  }

  function categoryMeta(category) {
    return CATEGORY_META[category] || { zh: category, en: String(category).toUpperCase(), page: "index.html", accent: "#b07a3e" };
  }

  function pageFor(bottle) {
    return categoryMeta(bottle.category).page;
  }

  function bottleHref(bottle) {
    return pageFor(bottle) + "#" + encodeURIComponent(bottle.id);
  }

  function categoryCount(category) {
    return ALL.filter(function (bottle) { return bottle.category === category; }).length;
  }

  function brandCount() {
    return unique(ALL.map(function (bottle) { return bottle.brand; })).length;
  }

  function formatAbv(value) {
    var number = Number(value);
    if (!isFinite(number)) return "—";
    return (Math.round(number * 10) / 10).toString();
  }

  function producerOf(bottle) {
    return bottle.winery || bottle.distillery || bottle.brand;
  }

  function producerLabel(bottle) {
    return bottle.category === "wine" ? "酒庄" : bottle.category === "liqueur" ? "装瓶 / 品牌" : "酒厂";
  }

  function shortOrigin(bottle) {
    var parts = String(bottle.region || "").split("·").map(function (part) { return part.trim(); }).filter(Boolean);
    var tail = parts.length ? parts[parts.length - 1] : String(bottle.region || "");
    if (tail === bottle.country) return bottle.country;
    return bottle.country + " · " + tail;
  }

  function statusOf(bottle) {
    if (bottle.category === "wine") {
      return { label: "年份", value: bottle.vintage || "NV", long: "Vintage" };
    }
    if (bottle.category === "spirits") {
      return { label: "酒龄", value: bottle.age || "NAS", long: "Age" };
    }
    if (bottle.category === "eastern") {
      return { label: "年份 / 酒龄", value: (bottle.vintage || "NV") + " / " + (bottle.age || "NAS"), long: "Vintage / Age" };
    }
    return { label: "年份 / 酒龄", value: (bottle.vintage || "NV") + " / " + (bottle.age || "NAS"), long: "Vintage / Age" };
  }

  function spiritRegion(bottle) {
    var parts = String(bottle.region || "").split("·").map(function (part) { return part.trim(); }).filter(Boolean);
    if (bottle.country === "英国") {
      var territory = parts[0] === "苏格兰" || parts[0] === "英格兰" ? parts[0] : "英国";
      var britishArea = parts[1] || "";
      return britishArea ? territory + " · " + britishArea : territory;
    }
    var area = parts[0] || "";
    if (!area || area === bottle.country) return bottle.country;
    return bottle.country + " · " + area;
  }

  function ageBand(bottle) {
    var number = parseInt(String(bottle.age || ""), 10);
    if (!isFinite(number)) return AGE_BANDS[0];
    if (number < 10) return AGE_BANDS[1];
    if (number < 18) return AGE_BANDS[2];
    if (number < 25) return AGE_BANDS[3];
    return AGE_BANDS[4];
  }

  function statusFact(bottle) {
    var status = statusOf(bottle);
    if (bottle.category === "wine") return status.label + " " + status.value;
    return status.label + " " + status.value;
  }

  function categoryCountLabel(category) {
    return categoryCount(category) + " 瓶";
  }

  function searchHaystack(bottle) {
    var grapeText = (bottle.grapes || []).map(function (grape) {
      return [grape.name, grape.harvest, "酸度" + grape.acidity, "甜度" + grape.sweetness].join(" ");
    }).join(" ");
    var category = categoryMeta(bottle.category);
    return normalize([
      bottle.name,
      bottle.enName,
      bottle.brand,
      bottle.brandEn,
      bottle.expression,
      bottle.subcategory,
      bottle.country,
      bottle.region,
      bottle.winery,
      bottle.distillery,
      (bottle.aliases || []).join(" "),
      bottle.whiskyType,
      bottle.vintage,
      bottle.age,
      bottle.abv,
      bottle.volume,
      bottle.priceRef,
      bottle.sweetness,
      bottle.serveTemp,
      category.zh,
      category.en,
      (bottle.flavor || []).join(" "),
      (bottle.aroma || []).join(" "),
      (bottle.scenarios || []).join(" "),
      (bottle.pairings || []).join(" "),
      grapeText,
      bottle.notes
    ].join(" | "));
  }

  function matchesQuery(bottle, query) {
    var normalized = normalize(query);
    if (!normalized) return true;
    var haystack = searchHaystack(bottle);
    return normalized.split(" ").every(function (token) { return !token || haystack.indexOf(token) !== -1; });
  }

  function highlight(text, query) {
    var source = String(text == null ? "" : text);
    var needle = String(query || "").trim();
    if (!needle) return esc(source);
    var index = source.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return esc(source);
    return esc(source.slice(0, index)) + "<mark>" + esc(source.slice(index, index + needle.length)) + "</mark>" + esc(source.slice(index + needle.length));
  }

  function priceTierMarkup(price) {
    var tier = PRICE_TIERS[Number(price)] || PRICE_TIERS[1];
    return '<span class="tier-mark" aria-hidden="true">' + "¥".repeat(Number(price) || 1) + "</span><span>" + esc(tier.short) + "</span>";
  }

  function updateScrollLock() {
    document.body.classList.toggle("is-locked", !els.drawerLayer.hidden || !els.searchLayer.hidden);
  }

  function showToast(message) {
    if (!els.toast) return;
    window.clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    state.toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 3200);
  }

  /* -------------------------------------------------------
     Bottle illustrations
     ------------------------------------------------------- */

  var BOTTLE_TYPE_MAP = {
    "cointreau-orange": "square",
    "rio-microv-peach": "can",
    "hennessy-xo": "burgundy",
    "bacardi-carta-blanca": "clear",
    "old-monk-7": "bordeaux",
    "tio-pepe-fino": "bordeaux",
    "martini-extra-dry": "bordeaux",
    "baileys-original": "bordeaux",
    "meijian-green-plum": "bordeaux",
    "johnnie-walker-red": "jw",
    "johnnie-walker-black": "jw",
    "johnnie-walker-green": "jw",
    "johnnie-walker-gold": "jw",
    "johnnie-walker-blue": "jw"
  };

  var CAN_COLORS = {
    "rio-microv-peach": "#a85d62",
    "suntory-horoyoi-peach": "#b68a61",
    "white-claw-black-cherry": "#526b63",
    "missberry-peach-oolong": "#875566"
  };

  function inferBottleType(bottle) {
    if (BOTTLE_TYPE_MAP[bottle.id]) return BOTTLE_TYPE_MAP[bottle.id];
    if (bottle.category === "wine") {
      if (/起泡|香槟/.test(bottle.subcategory)) return "champagne";
      if (/白|桃红/.test(bottle.subcategory)) return "burgundy";
      return "bordeaux";
    }
    if (bottle.category === "beer") return "beer";
    if (bottle.category === "spirits") {
      if (/伏特加|金酒/.test(bottle.subcategory)) return "clear";
      return "whisky";
    }
    if (bottle.category === "eastern") {
      if (/清酒/.test(bottle.subcategory)) return "sake";
      if (/烧酒/.test(bottle.subcategory)) return "soju";
      if (/白酒|黄酒|梅酒/.test(bottle.subcategory)) return "jar";
      if (/亚力|阿拉克/.test(bottle.subcategory)) return "clear";
      return "whisky";
    }
    if (bottle.category === "liqueur") {
      if (/苦精/.test(bottle.subcategory)) return "bitters";
      if (/橙味/.test(bottle.subcategory)) return "square";
      return "bordeaux";
    }
    if (bottle.category === "mixed") {
      if (bottle.id === "meijian-green-plum") return "bordeaux";
      return "can";
    }
    return "bordeaux";
  }

  function bottleTheme(bottle, type) {
    var meta = categoryMeta(bottle.category);
    var accent = meta.accent;
    var themes = {
      bordeaux: {
        glass: "#1d332b",
        edge: "#0d1b17",
        foil: "#6f2734",
        label: "#f1e7d5",
        labelEdge: "#bca886",
        text: "#241d17",
        accent: accent
      },
      burgundy: {
        glass: "#244036",
        edge: "#10231c",
        foil: "#b07a3e",
        label: "#f5ecdc",
        labelEdge: "#bfa986",
        text: "#241d17",
        accent: accent
      },
      champagne: {
        glass: "#1c3127",
        edge: "#0c1914",
        foil: "#b07a3e",
        label: "#f1e5cf",
        labelEdge: "#bda37d",
        text: "#241d17",
        accent: "#7a2b3a"
      },
      beer: {
        glass: "#4a2a17",
        edge: "#25150b",
        foil: "#bdb8a9",
        label: "#f0e5d1",
        labelEdge: "#c2a57f",
        text: "#241d17",
        accent: "#b07a3e"
      },
      whisky: {
        glass: "#78431f",
        edge: "#351d0d",
        foil: "#bfa775",
        label: "#f3e8d4",
        labelEdge: "#c0a67f",
        text: "#241d17",
        accent: "#1f3a32"
      },
      jw: {
        glass: "#5b331b",
        edge: "#271307",
        foil: "#b9a679",
        label: "#f3e8d4",
        labelEdge: "#bfa47c",
        text: "#241d17",
        accent: "#211c17"
      },
      sake: {
        glass: "#d7dacd",
        edge: "#8f978c",
        foil: "#ebebe3",
        label: "#f8f2e7",
        labelEdge: "#b9a88c",
        text: "#211c17",
        accent: "#3f6871"
      },
      soju: {
        glass: "#5f8069",
        edge: "#274436",
        foil: "#dad7c8",
        label: "#f2eadb",
        labelEdge: "#bfa781",
        text: "#211c17",
        accent: "#315a45"
      },
      jar: {
        glass: "#e8decc",
        edge: "#b8a589",
        foil: "#9a7b51",
        label: "#f8f0e2",
        labelEdge: "#c5a87f",
        text: "#241d17",
        accent: "#8d3031"
      },
      can: {
        glass: CAN_COLORS[bottle.id] || "#5f7467",
        edge: "#2e3c34",
        foil: "#c7c4b8",
        label: "#f1e6d3",
        labelEdge: "#c9ad84",
        text: "#241d17",
        accent: accent
      },
      square: {
        glass: "#a97335",
        edge: "#4d3217",
        foil: "#e8d6b1",
        label: "#f7ead4",
        labelEdge: "#b99162",
        text: "#241d17",
        accent: "#a54e31"
      },
      bitters: {
        glass: "#56311e",
        edge: "#251109",
        foil: "#d3c7ab",
        label: "#f0dfc0",
        labelEdge: "#a8875e",
        text: "#241d17",
        accent: "#7a2b3a"
      },
      clear: {
        glass: "#d3d5c9",
        edge: "#8d9487",
        foil: "#b8b9ad",
        label: "#f5ecdc",
        labelEdge: "#bba889",
        text: "#241d17",
        accent: "#335a4b"
      }
    };
    var theme = themes[type] || themes.bordeaux;
    if (bottle.id === "moutai-feitian") {
      theme = Object.assign({}, theme, { foil: "#b07a3e", accent: "#8d3031" });
    }
    if (bottle.id === "dassai-45") {
      theme = Object.assign({}, theme, { accent: "#3f6871", foil: "#ebebe3" });
    }
    if (type === "jw") {
      var jwAccents = {
        "johnnie-walker-red": "#9b332d",
        "johnnie-walker-black": "#211c17",
        "johnnie-walker-green": "#31533e",
        "johnnie-walker-gold": "#b07a3e",
        "johnnie-walker-blue": "#314b5d"
      };
      theme = Object.assign({}, theme, { accent: jwAccents[bottle.id] || "#211c17" });
    }
    if (bottle.category === "wine") {
      if (/白葡萄酒/.test(bottle.subcategory)) {
        theme = Object.assign({}, theme, { glass: "#aeb49a", edge: "#68705b", foil: "#b7864e" });
      } else if (/桃红/.test(bottle.subcategory)) {
        theme = Object.assign({}, theme, { glass: "#c3a09a", edge: "#765450", foil: "#d8c8a9" });
      } else if (/冰酒/.test(bottle.subcategory)) {
        theme = Object.assign({}, theme, { glass: "#b18a55", edge: "#60472a", foil: "#d6c39b" });
      } else if (/加强/.test(bottle.subcategory)) {
        theme = Object.assign({}, theme, { glass: "#4c2d1d", edge: "#1d0e07", foil: "#8f3238" });
      }
    }
    return theme;
  }

  function bottleMark(bottle, type) {
    if (type === "champagne" || type === "bordeaux" || type === "burgundy") return bottle.vintage || "NV";
    if (type === "beer") return bottle.vintage || "NV";
    if (type === "sake") {
      var sakeMatch = String(bottle.expression || "").match(/\d{2}/);
      return sakeMatch ? sakeMatch[0] : "45";
    }
    if (bottle.category === "spirits") {
      var ageMatch = String(bottle.age || "").match(/\d+/);
      return ageMatch ? ageMatch[0] : "NAS";
    }
    if (bottle.category === "eastern" && /酱香|白酒|黄酒/.test(bottle.subcategory)) {
      return formatAbv(bottle.abv);
    }
    if (bottle.category === "liqueur" && /橙味/.test(bottle.subcategory)) return formatAbv(bottle.abv);
    return formatAbv(bottle.abv);
  }

  function bottleMarkUnit(bottle, type) {
    if (type === "champagne" || type === "bordeaux" || type === "burgundy") {
      return bottle.vintage && bottle.vintage !== "NV" ? "VINTAGE" : "NON-VINTAGE";
    }
    if (type === "beer") return "NO VINTAGE";
    if (type === "sake") return "精米步合";
    if (bottle.category === "spirits") return /^\d+/.test(String(bottle.age || "")) ? "YEARS OLD" : "NO AGE";
    if (bottle.category === "eastern" && /酱香|白酒|黄酒/.test(bottle.subcategory)) return "% VOL";
    if (/橙味/.test(bottle.subcategory)) return "% VOL";
    return "ABV";
  }

  function bottleLabel(bottle, type, theme, rect) {
    var x = rect.x;
    var y = rect.y;
    var w = rect.w;
    var h = rect.h;
    var center = x + w / 2;
    var brand = Array.from(String(bottle.brand || bottle.name || "")).slice(0, 6).join("");
    var brandSize = Math.max(6.2, Math.min(10.2, (w - 15) / Math.max(1, Array.from(brand).length)));
    var mark = String(bottleMark(bottle, type));
    var markSize = mark.length > 3 ? 17 : 22;
    var unit = bottleMarkUnit(bottle, type);
    var expression = truncate(bottle.expression || bottle.subcategory || "", 9);
    var categoryEn = categoryMeta(bottle.category).en;
    var markY = y + Math.min(h * 0.61, 84);
    var brandY = y + 34;
    var labelBg = theme.label;
    var labelEdge = theme.labelEdge;
    var accent = theme.accent;
    return (
      '<g class="bottle-label" aria-hidden="true">' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + labelBg + '" stroke="' + labelEdge + '" stroke-width="0.9"/>' +
        '<rect x="' + (x + 3.4) + '" y="' + (y + 3.4) + '" width="' + (w - 6.8) + '" height="' + (h - 6.8) + '" fill="none" stroke="' + accent + '" stroke-width="0.45" opacity=".66"/>' +
        '<text x="' + center + '" y="' + (y + 13) + '" text-anchor="middle" fill="' + accent + '" font-family="Menlo, Consolas, monospace" font-size="4.7" letter-spacing="1.2">' + esc(categoryEn) + "</text>" +
        '<line x1="' + (x + 10) + '" y1="' + (y + 18) + '" x2="' + (x + w - 10) + '" y2="' + (y + 18) + '" stroke="' + accent + '" stroke-width="0.35" opacity=".55"/>' +
        '<text x="' + center + '" y="' + brandY + '" text-anchor="middle" fill="' + theme.text + '" font-family="Songti SC, STSong, Georgia, serif" font-size="' + brandSize.toFixed(2) + '" font-weight="600" letter-spacing=".5">' + esc(brand) + "</text>" +
        '<text x="' + center + '" y="' + markY + '" text-anchor="middle" fill="' + theme.text + '" font-family="Georgia, Songti SC, serif" font-size="' + markSize + '" font-weight="500" letter-spacing=".2">' + esc(mark) + "</text>" +
        '<text x="' + center + '" y="' + (markY + 10) + '" text-anchor="middle" fill="' + accent + '" font-family="Menlo, Consolas, monospace" font-size="4.2" letter-spacing=".8">' + esc(unit) + "</text>" +
        '<line x1="' + (x + 10) + '" y1="' + (y + h - 22) + '" x2="' + (x + w - 10) + '" y2="' + (y + h - 22) + '" stroke="' + accent + '" stroke-width="0.35" opacity=".4"/>' +
        '<text x="' + center + '" y="' + (y + h - 11) + '" text-anchor="middle" fill="' + theme.text + '" font-family="PingFang SC, Helvetica, sans-serif" font-size="4.5" letter-spacing=".3">' + esc(truncate(expression, 10)) + "</text>" +
        '<text x="' + center + '" y="' + (y + h - 5) + '" text-anchor="middle" fill="' + accent + '" font-family="Menlo, Consolas, monospace" font-size="3.7" letter-spacing=".5">' + esc(formatAbv(bottle.abv) + "% VOL · " + bottle.volume) + "</text>" +
      "</g>"
    );
  }

  function bottleSVG(bottle) {
    var type = inferBottleType(bottle);
    var t = bottleTheme(bottle, type);
    var body = "";
    var labelRect = { x: 46, y: 215, w: 68, h: 100 };
    var highlight = '<path d="M53 167v174" stroke="#fff" stroke-width="3.4" opacity=".075" stroke-linecap="round"/>';
    var ground = '<ellipse cx="80" cy="404" rx="54" ry="5.5" fill="#211c17" opacity=".13"/>';

    if (type === "bordeaux") {
      body =
        '<path d="M67 27h26v61c0 9 12 15 21 28l15 22v225c0 18-8 26-26 26H57c-18 0-26-8-26-26V138l15-22c9-13 21-19 21-28z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="66" y="20" width="28" height="41" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<path d="M67 58h26" stroke="#f5ead5" stroke-width=".8" opacity=".5"/>' +
        '<path d="M54 138c15-8 51-8 66 0" fill="none" stroke="' + t.edge + '" stroke-width=".5" opacity=".5"/>';
      labelRect = { x: 46, y: 215, w: 68, h: 102 };
    } else if (type === "burgundy") {
      body =
        '<path d="M68 28h24v58c0 10 19 20 34 49l9 21v216c0 18-8 26-26 26H51c-18 0-26-8-26-26V156l9-21c15-29 34-39 34-49z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="66" y="21" width="28" height="39" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<path d="M68 56h24" stroke="#f5ead5" stroke-width=".8" opacity=".5"/>';
      labelRect = { x: 44, y: 203, w: 72, h: 111 };
      highlight = '<path d="M50 171v170" stroke="#fff" stroke-width="3.8" opacity=".07" stroke-linecap="round"/>';
    } else if (type === "champagne") {
      body =
        '<path d="M64 31h32v53c0 9 23 18 33 50l6 20v218c0 18-8 26-27 26H52c-19 0-27-8-27-26V154l6-20c10-32 33-41 33-50z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<path d="M62 19h36v56l-8 8H70l-8-8z" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".8"/>' +
        '<path d="M66 21l-6 60M94 21l6 60" stroke="#f3e4c8" stroke-width=".5" opacity=".32"/>' +
        '<path d="M70 76h20" stroke="#f5ead5" stroke-width=".8" opacity=".5"/>' +
        '<circle cx="80" cy="82" r="5" fill="none" stroke="' + t.foil + '" stroke-width=".65" opacity=".75"/>';
      labelRect = { x: 46, y: 227, w: 68, h: 96 };
      highlight = '<path d="M50 173v163" stroke="#fff" stroke-width="3.4" opacity=".07" stroke-linecap="round"/>';
    } else if (type === "beer") {
      body =
        '<path d="M69 31h22v55c0 8 15 14 25 31l11 21v220c0 18-8 26-26 26H59c-18 0-26-8-26-26V138l11-21c10-17 25-23 25-31z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="62" y="22" width="36" height="12" rx="1.5" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".6"/>' +
        '<path d="M65 25v6M70 25v6M75 25v6M80 25v6M85 25v6M90 25v6M95 25v6" stroke="' + t.edge + '" stroke-width=".45" opacity=".6"/>' +
        '<path d="M69 43h22" stroke="#f5ead5" stroke-width=".8" opacity=".35"/>';
      labelRect = { x: 44, y: 226, w: 72, h: 91 };
      highlight = '<path d="M51 168v168" stroke="#fff" stroke-width="3.2" opacity=".06" stroke-linecap="round"/>';
    } else if (type === "jw") {
      body =
        '<path d="M64 30h32v54c0 6 17 10 23 23l4 11v260c0 17-8 25-25 25H63c-17 0-25-8-25-25V118l4-11c6-13 23-17 23-23z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.2"/>' +
        '<rect x="62" y="22" width="36" height="14" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<path d="M66 35h28" stroke="#f4e8d2" stroke-width=".7" opacity=".45"/>' +
        '<path d="M46 142v205" stroke="#fff" stroke-width="3.2" opacity=".07" stroke-linecap="round"/>' +
        '<path d="M42 362h76" stroke="' + t.edge + '" stroke-width=".6" opacity=".4"/>';
      labelRect = { x: 44, y: 213, w: 72, h: 112 };
    } else if (type === "whisky") {
      body =
        '<path d="M66 56h28v39c0 5 18 15 27 31l7 14v211c0 18-8 26-26 26H58c-18 0-26-8-26-26V140l7-14c9-16 27-26 27-31z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="62" y="48" width="36" height="17" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<path d="M66 61h28" stroke="#f4e8d2" stroke-width=".7" opacity=".4"/>' +
        '<path d="M50 154v184" stroke="#fff" stroke-width="3.6" opacity=".07" stroke-linecap="round"/>';
      labelRect = { x: 42, y: 218, w: 76, h: 111 };
    } else if (type === "sake") {
      body =
        '<path d="M68 31h24v42c0 7 10 11 17 22l6 10v275c0 14-7 22-23 22H68c-16 0-23-8-23-22V105l6-10c7-11 17-15 17-22z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="65" y="22" width="30" height="22" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".8"/>' +
        '<path d="M65 37h30" stroke="' + t.edge + '" stroke-width=".45" opacity=".5"/>' +
        '<path d="M53 99c15-5 39-5 54 0" fill="none" stroke="' + t.edge + '" stroke-width=".5" opacity=".45"/>' +
        '<path d="M54 119v248" stroke="#fff" stroke-width="3" opacity=".28" stroke-linecap="round"/>';
      labelRect = { x: 47, y: 184, w: 66, h: 137 };
      highlight = '<path d="M55 128v201" stroke="#fff" stroke-width="2.2" opacity=".27" stroke-linecap="round"/>';
    } else if (type === "soju") {
      body =
        '<path d="M69 38h22v43c0 7 11 12 17 25l5 13v254c0 15-7 23-23 23H70c-16 0-23-8-23-23V119l5-13c6-13 17-18 17-25z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="66" y="23" width="28" height="28" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".8"/>' +
        '<path d="M67 47h26" stroke="' + t.edge + '" stroke-width=".45" opacity=".45"/>' +
        '<path d="M55 122v242" stroke="#fff" stroke-width="2.5" opacity=".17" stroke-linecap="round"/>';
      labelRect = { x: 49, y: 213, w: 62, h: 108 };
    } else if (type === "jar") {
      body =
        '<path d="M62 76h36v17c22 10 35 29 35 57v167c0 49-25 73-53 73s-53-24-53-73V150c0-28 13-47 35-57z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="56" y="52" width="48" height="27" rx="2" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".75"/>' +
        '<rect x="52" y="47" width="56" height="10" rx="2" fill="#d8c4a2" stroke="' + t.edge + '" stroke-width=".5"/>' +
        '<path d="M56 79h48" stroke="' + t.edge + '" stroke-width=".5" opacity=".5"/>' +
        '<path d="M36 177c9-4 17-6 25-6M124 177c-9-4-17-6-25-6" stroke="' + t.edge + '" stroke-width=".45" opacity=".4"/>' +
        '<circle cx="80" cy="112" r="13" fill="none" stroke="' + t.accent + '" stroke-width=".55" opacity=".55"/>' +
        '<text x="80" y="116" text-anchor="middle" fill="' + t.accent + '" font-family="Songti SC, STSong, serif" font-size="10" opacity=".9">酒</text>';
      labelRect = { x: 39, y: 218, w: 82, h: 111 };
      highlight = '<path d="M47 185v164" stroke="#fff" stroke-width="4" opacity=".17" stroke-linecap="round"/>';
    } else if (type === "can") {
      body =
        '<rect x="20" y="74" width="120" height="320" rx="11" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.2"/>' +
        '<rect x="20" y="64" width="120" height="20" rx="7" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<ellipse cx="80" cy="67" rx="38" ry="5" fill="#dedbcf" stroke="' + t.edge + '" stroke-width=".45"/>' +
        '<path d="M68 63h18v4H68zM90 64h8" fill="none" stroke="' + t.edge + '" stroke-width=".55" opacity=".65"/>' +
        '<rect x="28" y="94" width="104" height="8" fill="#f2e8d6" opacity=".65"/>' +
        '<path d="M32 111v263" stroke="#fff" stroke-width="2.5" opacity=".15" stroke-linecap="round"/>';
      labelRect = { x: 31, y: 166, w: 98, h: 194 };
      highlight = "";
    } else if (type === "square") {
      body =
        '<path d="M66 75h28v43l19 17v243c0 12-6 18-18 18H65c-12 0-18-6-18-18V135l19-17z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="62" y="57" width="36" height="21" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".8"/>' +
        '<path d="M64 74h32" stroke="' + t.edge + '" stroke-width=".45" opacity=".5"/>' +
        '<path d="M56 153v193" stroke="#fff" stroke-width="3" opacity=".2" stroke-linecap="round"/>';
      labelRect = { x: 47, y: 195, w: 66, h: 137 };
    } else if (type === "bitters") {
      body =
        '<path d="M72 82h16v80l13 17v188c0 13-6 19-18 19H77c-12 0-18-6-18-19V179l13-17z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="68" y="67" width="24" height="17" rx="1.5" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".7"/>' +
        '<path d="M65 179h30" stroke="' + t.edge + '" stroke-width=".6" opacity=".5"/>' +
        '<path d="M64 199v173" stroke="#fff" stroke-width="2" opacity=".09" stroke-linecap="round"/>';
      labelRect = { x: 54, y: 235, w: 52, h: 103 };
      highlight = "";
    } else if (type === "clear") {
      body =
        '<path d="M67 34h26v58c0 9 13 16 22 29l13 20v222c0 18-8 26-26 26H58c-18 0-26-8-26-26V163l13-20c9-13 22-20 22-29z" fill="' + t.glass + '" stroke="' + t.edge + '" stroke-width="1.1"/>' +
        '<rect x="66" y="24" width="28" height="34" rx="1" fill="' + t.foil + '" stroke="' + t.edge + '" stroke-width=".65"/>' +
        '<path d="M68 52h24" stroke="' + t.edge + '" stroke-width=".45" opacity=".45"/>' +
        '<path d="M54 169v174" stroke="#fff" stroke-width="2.6" opacity=".3" stroke-linecap="round"/>';
      labelRect = { x: 45, y: 214, w: 70, h: 112 };
    }

    var label = bottleLabel(bottle, type, t, labelRect);
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 420" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
        ground + body + highlight + label +
        '<path d="M39 397h82" stroke="' + t.edge + '" stroke-width=".55" opacity=".25"/>' +
      "</svg>"
    );
  }

  /* -------------------------------------------------------
     UI injection
     ------------------------------------------------------- */

  function injectUI() {
    var quickTerms = ["格兰菲迪", "香槟", "烟熏", "清酒", "波尔多", "苦精"];
    var quickHTML = quickTerms.map(function (term) {
      return '<button type="button" data-search-term="' + esc(term) + '">' + esc(term) + "</button>";
    }).join("");

    var categoryLinks = CATEGORY_ORDER.map(function (category) {
      var meta = CATEGORY_META[category];
      return (
        '<a class="search-category-link" href="' + meta.page + '">' +
          "<span><strong>" + esc(meta.zh) + "</strong><small>" + esc(meta.en) + "</small></span>" +
          '<span class="cat-count" data-search-cat-count="' + category + '">0 瓶</span>' +
        "</a>"
      );
    }).join("");

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="search-layer" id="searchLayer" hidden>' +
        '<div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchDialogTitle">' +
          '<div class="search-panel-head">' +
            '<span class="eyebrow" id="searchDialogTitle">全站搜索 / SEARCH THE CELLAR</span>' +
            '<button class="search-close" type="button" data-close-search aria-label="关闭全站搜索">' + icons.close + "</button>" +
          "</div>" +
          '<div class="search-input-wrap" id="searchInputWrap">' +
            icons.search +
            '<label class="sr-only" for="globalSearchInput">搜索全站酒款、品牌、产区和风味</label>' +
            '<input id="globalSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="酒名、品牌、产区、风味…" aria-controls="searchResults">' +
            '<button class="search-clear" id="searchClear" type="button" aria-label="清空搜索">' + icons.close + "</button>" +
          "</div>" +
          '<div class="search-quick"><span class="search-quick-label">试试</span>' + quickHTML + "</div>" +
          '<div class="search-scroll" id="searchScroll">' +
            '<div class="search-summary" id="searchSummary"></div>' +
            '<div id="searchResults" aria-live="polite"></div>' +
          "</div>" +
          '<div class="search-panel-foot"><span>跨 7 个页面搜索 · 结果按品牌聚合</span><span><kbd>/</kbd> 打开 · <kbd>Esc</kbd> 关闭</span></div>' +
        "</div>" +
      "</div>" +
      '<div class="drawer-layer" id="drawerLayer" hidden>' +
        '<button class="drawer-backdrop" type="button" data-close-drawer aria-label="关闭酒款详情" tabindex="-1"></button>' +
        '<div class="drawer" id="bottleDrawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">' +
          '<button class="drawer-close" type="button" data-close-drawer aria-label="关闭酒款详情">' + icons.close + "</button>" +
          '<div class="drawer-scroll" id="drawerScroll"></div>' +
        "</div>" +
      "</div>" +
      '<div class="print-label" id="printLabel" aria-hidden="true"></div>' +
      '<div class="toast" id="toast" role="status" hidden></div>' +
      '<div class="scroll-progress" id="scrollProgress" aria-hidden="true"><span></span></div>' +
      '<button class="to-top" id="toTop" type="button" aria-label="回到页首" tabindex="-1"><span>↑</span><small>TOP</small></button>'
    );

    els.searchLayer = $("#searchLayer");
    els.searchPanel = $(".search-panel", els.searchLayer);
    els.searchInput = $("#globalSearchInput");
    els.searchInputWrap = $("#searchInputWrap");
    els.searchClear = $("#searchClear");
    els.searchResults = $("#searchResults");
    els.searchSummary = $("#searchSummary");
    els.searchScroll = $("#searchScroll");
    els.drawerLayer = $("#drawerLayer");
    els.drawer = $("#bottleDrawer");
    els.drawerScroll = $("#drawerScroll");
    els.printLabel = $("#printLabel");
    els.toast = $("#toast");
    els.scrollProgress = $("#scrollProgress span");
    els.toTop = $("#toTop");

    /* Fill the initial category list once; counts update after init. */
    var initialLinks = $all("[data-search-cat-count]", els.searchLayer);
    initialLinks.forEach(function (node) {
      var category = node.getAttribute("data-search-cat-count");
      node.textContent = categoryCount(category) + " 瓶";
    });
  }

  /* -------------------------------------------------------
     Search
     ------------------------------------------------------- */

  function updateSearchClear() {
    els.searchInputWrap.classList.toggle("has-value", els.searchInput.value.length > 0);
  }

  function initialSearchMarkup() {
    var categoryLinks = CATEGORY_ORDER.map(function (category) {
      var meta = CATEGORY_META[category];
      return (
        '<a class="search-category-link" href="' + meta.page + '">' +
          "<span><strong>" + esc(meta.zh) + "</strong><small>" + esc(meta.short) + "</small></span>" +
          '<span class="cat-count">' + categoryCount(category) + " 瓶</span>" +
        "</a>"
      );
    }).join("");
    var brandStats = {};
    ALL.forEach(function (bottle) {
      if (!brandStats[bottle.brand]) brandStats[bottle.brand] = { brand: bottle.brand, brandEn: bottle.brandEn, count: 0 };
      brandStats[bottle.brand].count += 1;
    });
    var brandChips = Object.keys(brandStats).map(function (brand) {
      return brandStats[brand];
    }).sort(function (a, b) {
      return b.count - a.count || a.brand.localeCompare(b.brand, "zh-Hans-CN");
    }).slice(0, 14).map(function (entry) {
      return (
        '<button class="search-brand-chip" type="button" data-brand-search="' + esc(entry.brand) + '">' +
          "<span>" + esc(entry.brand) + "</span><small>" + entry.count + " 款</small>" +
        "</button>"
      );
    }).join("");
    return (
      '<div class="search-brand-group">' +
        '<div class="search-brand-head"><h3>按酒柜进入</h3><span>THE SIX SHELVES</span></div>' +
        '<div class="search-category-list">' + categoryLinks + "</div>" +
      "</div>" +
      '<div class="search-brand-directory">' +
        '<div class="search-directory-head"><span>按品牌浏览 / BY BRAND</span><small>品牌与酒款分开，点一个名字继续展开</small></div>' +
        '<div class="search-brand-chips">' + brandChips + "</div>" +
      "</div>" +
      '<div class="search-empty-state" style="padding-top:18px;padding-bottom:22px">' +
        '<p>直接输入酒名、品牌、英文名、产区或风味词。搜索会同时查询全部 7 个页面，并跳转到酒款所在的页面。</p>' +
      "</div>"
    );
  }

  function searchScore(bottle, query) {
    var q = normalize(query);
    if (!q) return 0;
    var haystack = searchHaystack(bottle);
    var tokens = q.split(" ");
    var allTokens = tokens.every(function (token) { return !token || haystack.indexOf(token) !== -1; });
    var compact = function (value) {
      return String(value).replace(/[\s·.\-–—/|()（）'’&]/g, "");
    };
    var compactQuery = compact(q);
    if (!allTokens && (!compactQuery || compact(haystack).indexOf(compactQuery) === -1)) return -1;
    var score = allTokens ? 0 : 22;
    var name = normalize(bottle.name);
    var brand = normalize(bottle.brand);
    var enName = normalize(bottle.enName);
    var brandEn = normalize(bottle.brandEn);
    if (brand === q) score += 140;
    if (name === q) score += 130;
    if (brand.indexOf(q) === 0) score += 90;
    if (name.indexOf(q) === 0) score += 85;
    if (brand.indexOf(q) !== -1) score += 60;
    if (name.indexOf(q) !== -1) score += 55;
    if (brandEn.indexOf(q) === 0) score += 50;
    if (enName.indexOf(q) !== -1) score += 35;
    if (categoryMeta(bottle.category).zh.indexOf(q) !== -1) score += 18;
    return score;
  }

  function renderSearchResults(query) {
    var value = query == null ? "" : query;
    var q = value.trim();
    updateSearchClear();

    if (!q) {
      els.searchSummary.innerHTML = "全站 <strong>" + ALL.length + "</strong> 瓶 · <strong>" + brandCount() + "</strong> 个品牌 · 7 个页面";
      els.searchResults.innerHTML = initialSearchMarkup();
      els.searchScroll.scrollTop = 0;
      return;
    }

    var matches = ALL.map(function (bottle) {
      return { bottle: bottle, score: searchScore(bottle, q) };
    }).filter(function (entry) {
      return entry.score >= 0;
    }).sort(function (a, b) {
      return b.score - a.score || a.bottle.name.localeCompare(b.bottle.name, "zh-Hans-CN");
    });

    if (!matches.length) {
      els.searchSummary.innerHTML = "搜索 <strong>“" + esc(q) + "”</strong> · 0 个结果";
      els.searchResults.innerHTML =
        '<div class="search-empty-state">' +
          '<div class="empty-mark">空</div>' +
          "<h3>酒柜里暂时没有这瓶</h3>" +
          "<p>试试更短的关键词、品牌中文名，或从分类进入。风味词也可以搜，比如「烟熏」「柑橘」「蜂蜜」。</p>" +
        "</div>";
      els.searchScroll.scrollTop = 0;
      return;
    }

    var groups = [];
    var groupMap = {};
    matches.forEach(function (entry) {
      var brand = entry.bottle.brand;
      if (!groupMap[brand]) {
        groupMap[brand] = { brand: brand, brandEn: entry.bottle.brandEn, score: entry.score, items: [] };
        groups.push(groupMap[brand]);
      }
      groupMap[brand].items.push(entry);
      groupMap[brand].score = Math.max(groupMap[brand].score, entry.score);
    });
    groups.sort(function (a, b) {
      return b.score - a.score || a.brand.localeCompare(b.brand, "zh-Hans-CN");
    });

    els.searchSummary.innerHTML =
      "找到 <strong>" + matches.length + "</strong> 瓶，聚合为 <strong>" + groups.length + "</strong> 个品牌" +
      '<span class="muted"> · 按品牌展开</span>';

    var groupsHTML = groups.map(function (group) {
      var itemsHTML = group.items.map(function (entry) {
        var bottle = entry.bottle;
        var meta = CATEGORY_META[bottle.category];
        var status = statusOf(bottle);
        return (
          '<a class="search-hit" href="' + bottleHref(bottle) + '" data-bottle-link data-bottle-id="' + esc(bottle.id) + '">' +
            '<span class="search-hit-main">' +
              '<span class="search-hit-name">' + highlight(bottle.name, q) + "</span>" +
              '<span class="search-hit-en">' + highlight(bottle.enName, q) + "</span>" +
            "</span>" +
            '<span class="search-hit-cat">' + esc(meta.zh) + "</span>" +
            '<span class="search-hit-meta">' + esc(status.value) + '<br>' + esc(formatAbv(bottle.abv)) + "% ABV</span>" +
            '<span class="search-hit-arrow">' + icons.arrow + "</span>" +
          "</a>"
        );
      }).join("");
      return (
        '<section class="search-brand-group" aria-label="' + esc(group.brand) + ' 的搜索结果">' +
          '<div class="search-brand-head">' +
            "<h3>" + highlight(group.brand, q) + "</h3>" +
            "<span>" + esc(group.brandEn || "") + "</span>" +
            '<span class="search-group-count">' + group.items.length + " 款</span>" +
          "</div>" +
          itemsHTML +
        "</section>"
      );
    }).join("");

    els.searchResults.innerHTML = groupsHTML;
    els.searchScroll.scrollTop = 0;
  }

  function openSearch(initialQuery) {
    if (!els.searchLayer) return;
    if (!els.searchLayer.hidden) {
      if (typeof initialQuery === "string") {
        els.searchInput.value = initialQuery;
        renderSearchResults(initialQuery);
      }
      els.searchInput.focus();
      return;
    }
    state.searchReturnFocus = document.activeElement;
    els.searchLayer.hidden = false;
    els.searchInput.value = typeof initialQuery === "string" ? initialQuery : "";
    renderSearchResults(els.searchInput.value);
    updateScrollLock();
    window.requestAnimationFrame(function () {
      els.searchInput.focus();
      els.searchInput.select();
    });
  }

  function closeSearch(restoreFocus) {
    if (!els.searchLayer || els.searchLayer.hidden) return;
    els.searchLayer.hidden = true;
    updateScrollLock();
    if (restoreFocus !== false && state.searchReturnFocus && typeof state.searchReturnFocus.focus === "function") {
      state.searchReturnFocus.focus();
    }
  }

  function initSearch() {
    $all("[data-open-search]").forEach(function (button) {
      button.addEventListener("click", function () {
        openSearch("");
      });
    });

    $all("[data-search-term]").forEach(function (button) {
      button.addEventListener("click", function () {
        openSearch(button.getAttribute("data-search-term") || "");
      });
    });

    $all("[data-close-search]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeSearch();
      });
    });

    els.searchLayer.addEventListener("click", function (event) {
      if (event.target === els.searchLayer) closeSearch();
    });

    els.searchInput.addEventListener("input", function () {
      renderSearchResults(els.searchInput.value);
    });

    els.searchClear.addEventListener("click", function () {
      els.searchInput.value = "";
      renderSearchResults("");
      els.searchInput.focus();
    });

    els.searchResults.addEventListener("click", function (event) {
      var brandButton = event.target.closest("[data-brand-search]");
      if (brandButton) {
        var brandQuery = brandButton.getAttribute("data-brand-search") || "";
        els.searchInput.value = brandQuery;
        renderSearchResults(brandQuery);
        els.searchInput.focus();
        return;
      }
      var link = event.target.closest("[data-bottle-link]");
      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var bottle = byId(link.getAttribute("data-bottle-id"));
      if (!bottle) return;
      if (PAGE === bottle.category) {
        event.preventDefault();
        closeSearch(false);
        openBottle(bottle.id);
      }
    });

    els.searchResults.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && event.target === els.searchInput) {
        var first = $("[data-bottle-link]", els.searchResults);
        if (first) {
          first.click();
        }
      }
    });
  }

  /* -------------------------------------------------------
     Drawer
     ------------------------------------------------------- */

  function specItem(label, value, note) {
    return (
      '<div class="spec-item">' +
        "<dt>" + esc(label) + "</dt>" +
        "<dd>" + value + (note ? " <small>" + esc(note) + "</small>" : "") + "</dd>" +
      "</div>"
    );
  }

  function metricBars(label, value) {
    var score = Math.max(1, Math.min(5, Number(value) || 1));
    var bars = "";
    for (var i = 1; i <= 5; i += 1) {
      bars += '<i class="' + (i <= score ? "on" : "") + '"></i>';
    }
    return (
      '<div class="grape-bar">' +
        "<span>" + esc(label) + "</span>" +
        '<span class="bar-track" aria-hidden="true">' + bars + "</span>" +
        "<b>" + score + "</b>" +
      "</div>"
    );
  }

  function grapesMarkup(bottle) {
    if (!bottle.grapes || !bottle.grapes.length) return "";
    var cards = bottle.grapes.map(function (grape) {
      return (
        '<article class="grape-card">' +
          '<div class="grape-name"><h4>' + esc(grape.name) + "</h4>" +
            '<span class="harvest-tag">' + esc(grape.harvest || "正常") + "采收</span>" +
          "</div>" +
          '<div class="grape-bars" aria-label="' + esc(grape.name) + " 酸度 " + esc(grape.acidity) + "，甜度 " + esc(grape.sweetness) + '，均为 5 级主观刻度">' +
            metricBars("酸度", grape.acidity) +
            metricBars("甜度", grape.sweetness) +
          "</div>" +
        "</article>"
      );
    }).join("");
    return (
      '<section class="drawer-section" aria-labelledby="grapeHeading">' +
        '<div class="drawer-section-head"><h3 id="grapeHeading">葡萄卡 <small>GRAPE CARD</small></h3>' +
          '<span class="section-note">酸度 / 甜度为品鉴参考的相对刻度</span></div>' +
        '<div class="grape-grid">' + cards + "</div>" +
      "</section>"
    );
  }

  function decantHeadline(text) {
    var match = String(text || "").match(/(?:\d+\s*[–\-~至]\s*)?\d+\s*分钟/);
    return match ? "建议醒酒 " + match[0].replace(/\s+/g, "") : "醒酒建议";
  }

  function drawerMarkup(bottle) {
    var meta = CATEGORY_META[bottle.category];
    var status = statusOf(bottle);
    var isWine = bottle.category === "wine";
    var specs = [
      specItem("国家 / 产区", esc(bottle.country) + " <small>· " + esc(bottle.region) + "</small>"),
      specItem(producerLabel(bottle), esc(producerOf(bottle))),
      specItem(
        isWine ? "年份 / VINTAGE" : bottle.category === "spirits" ? "酒龄 / AGE" : "年份 / 酒龄 / VINTAGE · AGE",
        esc(status.value),
        isWine ? "" : bottle.category === "spirits" ? "无酒龄标注时以 NAS 表示" : "无年份、无酒龄标注"
      ),
      specItem("酒精度 / ABV", esc(formatAbv(bottle.abv)) + "% <small>vol</small>"),
      specItem("容量 / VOLUME", esc(bottle.volume)),
      specItem("参考价格", esc(bottle.priceRef), "随市场变动")
    ];
    if (bottle.whiskyType) {
      specs.push(specItem("威士忌类型", esc(bottle.whiskyType)));
    }
    if (isWine && bottle.sweetness) {
      specs.push(specItem("甜度", esc(bottle.sweetness)));
    }
    if (bottle.category === "eastern") {
      specs.push(specItem("类型", esc(bottle.subcategory)));
    }

    var scenarioTags = (bottle.scenarios || []).map(function (scenario) {
      return '<span class="tag solid">' + esc(scenario) + "</span>";
    }).join("");
    var pairings = (bottle.pairings || []).map(function (item) {
      return "<li>" + esc(item) + "</li>";
    }).join("");
    var decantCallout = bottle.decant
      ? '<div class="info-callout"><div><span class="callout-label">DECANTING / 醒酒</span><strong>' + esc(decantHeadline(bottle.decant)) + "</strong></div>" +
        '<p class="callout-note">' + esc(bottle.decant) + "</p></div>"
      : "";

    return (
      '<div class="drawer-ribbon">' +
        '<div class="drawer-ribbon-meta">' +
          "<strong>" + esc(meta.zh) + " / " + esc(meta.en) + "</strong>" +
          "<span>BOTTLE &amp; LABEL · 瓶型示意</span>" +
          "<span>NO. " + esc(String(ALL.indexOf(bottle) + 1).padStart(2, "0")) + " / " + String(ALL.length).padStart(2, "0") + "</span>" +
        "</div>" +
        '<div class="drawer-bottle-wrap">' + bottleSVG(bottle) + "</div>" +
        '<span class="drawer-ribbon-side">' + esc(bottle.brandEn || bottle.brand) + "</span>" +
      "</div>" +
      '<div class="drawer-content">' +
        '<header class="drawer-intro">' +
          '<div class="drawer-brandline"><span>' + esc(bottle.brand) + "</span>" +
            '<span class="brand-en">' + esc(bottle.brandEn) + "</span></div>" +
          '<h2 id="drawerTitle">' + esc(bottle.name) + "</h2>" +
          '<p class="drawer-enname">' + esc(bottle.enName) + " · " + esc(bottle.expression) + "</p>" +
          '<div class="drawer-flags">' +
            '<span class="drawer-flag accent">' + esc(bottle.subcategory) + "</span>" +
            '<span class="drawer-flag">' + esc(bottle.country) + "</span>" +
            (bottle.whiskyType ? '<span class="drawer-flag">' + esc(bottle.whiskyType) + "威士忌</span>" : "") +
            '<span class="drawer-flag">' + esc(PRICE_TIERS[bottle.price] ? PRICE_TIERS[bottle.price].name : "参考") + "档</span>" +
          "</div>" +
          '<div class="drawer-notes"><span class="eyebrow">酒款笔记 / FIELD NOTE</span><p>' + esc(bottle.notes) + "</p></div>" +
        "</header>" +
        '<dl class="spec-grid">' + specs.join("") + "</dl>" +
        '<section class="drawer-section" aria-labelledby="tasteHeading">' +
          '<div class="drawer-section-head"><h3 id="tasteHeading">风味与香气 <small>TASTING REFERENCE</small></h3>' +
            '<span class="section-note">主观品鉴参考 · 非质量结论</span></div>' +
          '<div class="taste-columns">' +
            '<div class="taste-block"><h4><strong>香气</strong>AROMA</h4><div class="tag-cloud">' +
              (bottle.aroma || []).map(function (note) { return '<span class="tag">' + esc(note) + "</span>"; }).join("") +
            "</div></div>" +
            '<div class="taste-block"><h4><strong>风味</strong>FLAVOR</h4><div class="tag-cloud">' +
              (bottle.flavor || []).map(function (note) { return '<span class="tag">' + esc(note) + "</span>"; }).join("") +
            "</div></div>" +
          "</div>" +
        "</section>" +
        grapesMarkup(bottle) +
        '<section class="drawer-section" aria-labelledby="serveHeading">' +
          '<div class="drawer-section-head"><h3 id="serveHeading">什么时候喝 <small>SERVING &amp; SCENE</small></h3>' +
            '<span class="section-note">配餐与适饮温度仅供参考</span></div>' +
          '<div class="taste-columns">' +
            '<div class="taste-block"><h4><strong>适用场景</strong>SCENARIO</h4><div class="tag-cloud">' + scenarioTags + "</div></div>" +
            '<div class="taste-block"><h4><strong>适饮温度</strong>SERVE TEMP</h4>' +
              '<div class="info-callout" style="margin-top:8px;border:0;padding:2px 0"><div><strong>' + esc(bottle.serveTemp) + "</strong></div></div>" +
            "</div>" +
          "</div>" +
          (pairings ? '<div class="info-callout" style="margin-top:12px"><div><span class="callout-label">PAIRING / 配餐</span></div><ul class="pairing-list">' + pairings + "</ul></div>" : "") +
          (decantCallout ? '<div style="margin-top:12px">' + decantCallout + "</div>" : "") +
        "</section>" +
        '<div class="drawer-editorial">' +
          '<section class="editorial-block lore"><h3>传说 / 来头 <span>LORE</span></h3><p>' + esc(bottle.lore) + "</p></section>" +
          '<section class="editorial-block creative"><h3>创作提示 <span>FOR THE WRITER &amp; MAKER</span></h3><p>' + esc(bottle.creative) + "</p></section>" +
          '<section class="editorial-block mistake"><h3>常见误用 <span>COMMON MISTAKE</span></h3><p>' + esc(bottle.mistake) + "</p></section>" +
        "</div>" +
        '<div class="drawer-actions">' +
          '<button class="button print-button" type="button" data-print-bottle="' + esc(bottle.id) + '">' + icons.print + "打印 A5 酒标卡</button>" +
          '<p class="drawer-action-note"><strong>参考价随市场变动</strong>风味描述为主观品鉴参考 · 瓶型为示意</p>' +
        "</div>" +
      "</div>"
    );
  }

  function openBottle(id, options) {
    var opts = options || {};
    var bottle = byId(id);
    if (!bottle) return;
    if (state.openId !== id) {
      if (state.drawerReturnFocus == null) {
        var active = document.activeElement;
        var isVisible = active && active !== document.body && active.offsetParent !== null;
        state.drawerReturnFocus = isVisible ? active : $("[data-open-search]");
      }
      window.clearTimeout(state.drawerHideTimer);
      els.drawerScroll.innerHTML = drawerMarkup(bottle);
      state.openId = id;
      els.drawerLayer.hidden = false;
      window.requestAnimationFrame(function () {
        els.drawerLayer.classList.add("is-open");
      });
      updateScrollLock();
      document.title = bottle.name + " · 酒谱";
      els.drawerScroll.scrollTop = 0;
      window.requestAnimationFrame(function () {
        var close = $(".drawer-close", els.drawerLayer);
        if (close) close.focus({ preventScroll: true });
      });
    }
    if (!opts.fromHash) {
      try {
        history.replaceState(null, "", "#" + encodeURIComponent(id));
      } catch (error) {
        /* file:// environments that restrict history still keep the drawer open. */
      }
    }
  }

  function closeBottle(options) {
    var opts = options || {};
    if (state.openId == null) return;
    var bottle = byId(state.openId);
    state.openId = null;
    els.drawerLayer.classList.remove("is-open");
    updateScrollLock();
    document.title = BASE_TITLE;
    if (bottle && opts.syncHash !== false) {
      try {
        history.replaceState(null, "", window.location.href.split("#")[0]);
      } catch (error) {
        /* Ignore history restrictions on local files. */
      }
    }
    window.clearTimeout(state.drawerHideTimer);
    state.drawerHideTimer = window.setTimeout(function () {
      els.drawerLayer.hidden = true;
      els.drawerScroll.innerHTML = "";
    }, 380);
    if (opts.restoreFocus !== false && state.drawerReturnFocus && typeof state.drawerReturnFocus.focus === "function") {
      state.drawerReturnFocus.focus({ preventScroll: true });
    }
    state.drawerReturnFocus = null;
  }

  function initDrawer() {
    $all("[data-close-drawer]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeBottle();
      });
    });

    els.drawerLayer.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-drawer]")) {
        closeBottle();
        return;
      }
      if (event.target.closest("[data-print-bottle]")) {
        printBottle(event.target.closest("[data-print-bottle]").getAttribute("data-print-bottle"));
      }
    });

    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-bottle-link]");
      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var bottle = byId(link.getAttribute("data-bottle-id"));
      if (!bottle || PAGE !== bottle.category) return;
      event.preventDefault();
      openBottle(bottle.id);
    });

    window.addEventListener("hashchange", function () {
      var id = getHashId();
      if (id && byId(id)) {
        openBottle(id, { fromHash: true });
      } else if (!id && state.openId) {
        closeBottle({ syncHash: false, restoreFocus: false });
      }
    });
  }

  function getHashId() {
    var raw = window.location.hash.replace(/^#/, "");
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      return raw;
    }
  }

  function printBottle(id) {
    var bottle = byId(id) || byId(state.openId);
    if (!bottle) return;
    var meta = CATEGORY_META[bottle.category];
    var status = statusOf(bottle);
    var producer = producerOf(bottle);
    var specItems = [
      ["国家 / 产区", bottle.country + " · " + bottle.region],
      [producerLabel(bottle), producer],
      [status.label, status.value],
      ["酒精度 / 容量", formatAbv(bottle.abv) + "% vol · " + bottle.volume]
    ].map(function (pair) {
      return '<div><dt>' + esc(pair[0]) + "</dt><dd>" + esc(pair[1]) + "</dd></div>";
    }).join("");

    els.printLabel.innerHTML =
      '<div class="print-inner">' +
        '<div class="print-topline"><span class="print-mark">酒谱</span><span>BOTTLE FIELD CARD / 酒标卡</span></div>' +
        '<div class="print-main">' +
          '<div class="print-visual">' + bottleSVG(bottle) + "</div>" +
          '<div class="print-headwrap">' +
            '<p class="print-kicker">' + esc(meta.en) + " / " + esc(bottle.subcategory) + "</p>" +
            '<p class="print-brand">' + esc(bottle.brand) + " · " + esc(bottle.brandEn) + "</p>" +
            '<h1 class="print-title">' + esc(bottle.name) + "</h1>" +
            '<p class="print-en">' + esc(bottle.enName) + "</p>" +
            '<dl class="print-mini-specs">' + specItems + "</dl>" +
          "</div>" +
        "</div>" +
        '<div class="print-taste">' +
          "<div><h3>AROMA / 香气</h3><p>" + esc((bottle.aroma || []).join(" · ")) + "</p></div>" +
          "<div><h3>FLAVOR / 风味</h3><p>" + esc((bottle.flavor || []).join(" · ")) + "</p></div>" +
        "</div>" +
        '<div class="print-notes">' +
          '<p class="print-section-title">PAIRING / 配餐 · SERVE / 适饮</p>' +
          '<p class="print-pairing">' + esc((bottle.pairings || []).slice(0, 4).join(" · ")) + "</p>" +
          '<p style="margin-top:1.5mm">' + esc(bottle.serveTemp) + (bottle.decant ? " · " + esc(truncate(bottle.decant, 44)) : "") + "</p>" +
          '<p style="margin-top:2.5mm">' + esc(truncate(bottle.notes, 92)) + "</p>" +
        "</div>" +
        '<div class="print-footer">' +
          "<div><strong>参考价 " + esc(bottle.priceRef) + "</strong>价格随市场变动 · 风味描述为主观品鉴参考<br>瓶型示意图 · 理性饮酒，未满 18 岁请勿饮酒</div>" +
          '<div class="print-simon">酒谱 · 酒柜标签<br>Simon Workshop™</div>' +
        "</div>" +
      "</div>";

    try {
      window.print();
    } catch (error) {
      showToast("当前浏览器不支持打印，请使用浏览器菜单中的打印功能。");
    }
  }

  /* -------------------------------------------------------
     Filters / category page
     ------------------------------------------------------- */

  var FILTER_DEFS = {
    wine: [
      {
        key: "subcategory",
        label: "类型",
        values: function (b) { return [b.subcategory]; },
        order: ["红葡萄酒", "白葡萄酒", "桃红葡萄酒", "起泡酒", "冰酒", "加强酒"]
      },
      { key: "country", label: "国家", values: function (b) { return [b.country]; }, sort: "locale" },
      { key: "grape", label: "葡萄品种", values: function (b) { return (b.grapes || []).map(function (g) { return g.name; }); }, sort: "locale" },
      { key: "vintage", label: "年份", values: function (b) { return b.vintage ? [b.vintage] : []; }, sort: "vintage" },
      {
        key: "sweetness",
        label: "甜度",
        values: function (b) { return b.sweetness ? [b.sweetness] : []; },
        order: ["干型", "半干", "半甜", "甜型"]
      },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      },
      { key: "scenario", label: "场景", values: function (b) { return b.scenarios || []; }, order: SCENARIOS }
    ],
    beer: [
      { key: "subcategory", label: "类型", values: function (b) { return [b.subcategory]; }, sort: "locale" },
      { key: "country", label: "国家", values: function (b) { return [b.country]; }, sort: "locale" },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      },
      { key: "scenario", label: "场景", values: function (b) { return b.scenarios || []; }, order: SCENARIOS }
    ],
    spirits: [
      {
        key: "subcategory",
        label: "类型",
        values: function (b) { return [b.subcategory]; },
        order: ["单一麦芽威士忌", "调和威士忌", "波本威士忌", "田纳西威士忌", "干邑", "苦艾酒", "龙舌兰", "朗姆", "金酒", "伏特加"]
      },
      { key: "region", label: "产区", values: function (b) { return [spiritRegion(b)]; }, sort: "locale" },
      { key: "age", label: "酒龄", values: function (b) { return [ageBand(b)]; }, order: AGE_BANDS },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      },
      { key: "scenario", label: "场景", values: function (b) { return b.scenarios || []; }, order: SCENARIOS }
    ],
    eastern: [
      { key: "country", label: "国家 / 地区", values: function (b) { return [b.country]; }, sort: "locale" },
      { key: "subcategory", label: "类型", values: function (b) { return [b.subcategory]; }, sort: "locale" },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      },
      { key: "scenario", label: "场景", values: function (b) { return b.scenarios || []; }, order: SCENARIOS }
    ],
    liqueur: [
      { key: "subcategory", label: "类型", values: function (b) { return [b.subcategory]; }, sort: "locale" },
      { key: "brand", label: "品牌", values: function (b) { return [b.brand]; }, sort: "locale" },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      }
    ],
    mixed: [
      { key: "subcategory", label: "类型", values: function (b) { return [b.subcategory]; }, sort: "locale" },
      {
        key: "price",
        label: "价格",
        values: function (b) { return [String(b.price)]; },
        sort: "price",
        format: function (value) { return "¥ " + (PRICE_TIERS[value] ? PRICE_TIERS[value].short : value); }
      }
    ]
  };

  function categoryBottles(category) {
    return ALL.filter(function (bottle) { return bottle.category === category; });
  }

  function filterOptions(def, category) {
    var values = [];
    categoryBottles(category).forEach(function (bottle) {
      (def.values(bottle) || []).forEach(function (value) {
        if (value != null && value !== "" && values.indexOf(value) === -1) values.push(value);
      });
    });
    if (def.order) {
      values.sort(function (a, b) {
        var ai = def.order.indexOf(a);
        var bi = def.order.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || String(a).localeCompare(String(b), "zh-Hans-CN");
      });
    } else if (def.sort === "price") {
      values.sort(function (a, b) { return Number(a) - Number(b); });
    } else if (def.sort === "vintage") {
      values.sort(function (a, b) {
        if (a === "NV") return 1;
        if (b === "NV") return -1;
        return Number(b) - Number(a);
      });
    } else if (def.sort === "locale") {
      values.sort(function (a, b) { return String(a).localeCompare(String(b), "zh-Hans-CN"); });
    }
    return values;
  }

  function filterMatches(bottle, def, value) {
    if (!value) return true;
    return (def.values(bottle) || []).some(function (candidate) {
      return String(candidate) === String(value);
    });
  }

  function filteredBottles(category) {
    var defs = FILTER_DEFS[category] || [];
    return categoryBottles(category).filter(function (bottle) {
      if (!matchesQuery(bottle, state.query)) return false;
      return defs.every(function (def) {
        return filterMatches(bottle, def, state.filters[def.key]);
      });
    });
  }

  function buildFilterControls() {
    var defs = FILTER_DEFS[PAGE] || [];
    els.filterControls.innerHTML = defs.map(function (def) {
      var options = filterOptions(def, PAGE).map(function (value) {
        return '<option value="' + esc(value) + '">' + esc(def.format ? def.format(value) : value) + "</option>";
      }).join("");
      return (
        '<label class="filter-field">' +
          '<span class="filter-field-name">' + esc(def.label) + "</span>" +
          '<span class="filter-field-control">' +
            '<select data-filter="' + esc(def.key) + '" aria-label="按' + esc(def.label) + '筛选">' +
              '<option value="">不限</option>' + options +
            "</select>" +
            icons.chevron +
          "</span>" +
        "</label>"
      );
    }).join("");
  }

  function activeFilterEntries() {
    var defs = FILTER_DEFS[PAGE] || [];
    var entries = [];
    defs.forEach(function (def) {
      var value = state.filters[def.key];
      if (value) {
        entries.push({
          key: def.key,
          label: def.label,
          value: value,
          display: def.format ? def.format(value) : value
        });
      }
    });
    return entries;
  }

  function renderActiveChips() {
    var entries = activeFilterEntries();
    var chips = entries.map(function (entry) {
      return (
        '<button class="chip" type="button" data-remove-filter="' + esc(entry.key) + '" aria-label="移除筛选：' + esc(entry.label) + " " + esc(entry.display) + '">' +
          esc(entry.label) + " · " + esc(entry.display) + icons.close +
        "</button>"
      );
    });
    if (state.query) {
      chips.push(
        '<button class="chip" type="button" data-remove-query aria-label="清空本页搜索">搜索 · ' + esc(truncate(state.query, 16)) + icons.close + "</button>"
      );
    }
    els.activeChips.innerHTML = chips.join("");
    els.filterReset.disabled = entries.length === 0 && !state.query;
  }

  function updateFilterSelectState() {
    $all("select[data-filter]", els.filterControls).forEach(function (select) {
      select.classList.toggle("is-active", Boolean(select.value));
    });
  }

  function updateLocalSearchUI() {
    els.localSearchWrap.classList.toggle("has-value", els.localSearch.value.length > 0);
  }

  function currentPageButtons(page, pageCount) {
    if (pageCount <= 1) return '<button class="pager-btn" type="button" aria-current="page" aria-label="第 1 页">1</button>';
    var wanted = [];
    for (var i = 1; i <= pageCount; i += 1) {
      if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) wanted.push(i);
    }
    var html = "";
    var previous = 0;
    wanted.forEach(function (number) {
      if (previous && number - previous > 1) {
        html += '<span class="pager-dots" aria-hidden="true">…</span>';
      }
      html +=
        '<button class="pager-btn" type="button" data-page-target="' + number + '"' +
        (number === page ? ' aria-current="page" aria-label="第 ' + number + ' 页，当前页"' : ' aria-label="第 ' + number + ' 页"') +
        ">" + number + "</button>";
      previous = number;
    });
    return html;
  }

  function renderPagination(total, pageCount, start, end) {
    var prev = Math.max(1, state.page - 1);
    var next = Math.min(pageCount, state.page + 1);
    var copy = CATALOG_COPY[PAGE] || CATALOG_COPY.wine;
    els.pagination.innerHTML =
      '<p class="pager-summary">显示 <strong>' + (total ? start + 1 : 0) + "–" + end + "</strong> / 共 <strong>" + total +
        "</strong> " + copy.unit + " · 每页 15 " + copy.unit + "</p>" +
      '<span class="pager-rule" aria-hidden="true"></span>' +
      '<div class="pager-controls">' +
        '<button class="pager-btn" type="button" data-page-target="' + prev + '" aria-label="上一页"' + (state.page <= 1 ? " disabled" : "") + ">" + icons.arrowLeft + "</button>" +
        currentPageButtons(state.page, pageCount) +
        '<button class="pager-btn" type="button" data-page-target="' + next + '" aria-label="下一页"' + (state.page >= pageCount ? " disabled" : "") + ">" + icons.arrow + "</button>" +
      "</div>";
  }

  function releaseExtraMarkup(bottle) {
    if (bottle.category === "wine" && bottle.grapes && bottle.grapes.length) {
      return '<p class="release-extra release-grapes"><span>葡萄</span>' +
        esc(bottle.grapes.map(function (grape) { return grape.name; }).join(" / ")) + "</p>";
    }
    if (bottle.category === "spirits" && bottle.whiskyType) {
      return '<p class="release-extra release-kind"><span>类型</span>' + esc(bottle.whiskyType) + "威士忌</p>";
    }
    if (bottle.category === "eastern") {
      return '<p class="release-extra release-kind"><span>地方</span>' + esc(bottle.country + " · " + bottle.subcategory) + "</p>";
    }
    return "";
  }

  function renderBottleCard(bottle, index) {
    var status = statusOf(bottle);
    var statusLabel = bottle.category === "wine" ? "年份" : bottle.category === "spirits" ? "酒龄" : "年份 / 酒龄";
    var flavorText = (bottle.flavor || []).slice(0, 3).join(" · ");
    var kinds = bottle.whiskyType ? (bottle.subcategory.indexOf(bottle.whiskyType) === -1 ? bottle.whiskyType + " / " + bottle.subcategory : bottle.subcategory) : bottle.subcategory;
    var grapeNames = (bottle.grapes || []).map(function (grape) { return grape.name; }).join(",");
    return (
      '<article class="release-card" data-category="' + esc(bottle.category) + '" data-subcategory="' + esc(bottle.subcategory) + '" data-id="' + esc(bottle.id) + '" data-brand="' + esc(bottle.brand) + '" data-grapes="' + esc(grapeNames) + '" style="--i:' + index + '">' +
        '<a class="release-link" href="' + bottleHref(bottle) + '" data-bottle-link data-bottle-id="' + esc(bottle.id) + '">' +
          '<div class="release-visual">' +
            '<span class="release-order">' + pad2(index + 1) + "</span>" +
            '<span class="release-tier" title="价格档 ' + esc(bottle.price) + " / 4：" + esc((PRICE_TIERS[bottle.price] || PRICE_TIERS[1]).name) + '（相对分档，非报价）">' +
              esc("¥".repeat(Number(bottle.price) || 1)) + '<em>' + esc((PRICE_TIERS[bottle.price] || PRICE_TIERS[1]).short) + "</em>" +
            "</span>" +
            '<span class="release-ghost" aria-hidden="true">' + esc(bottleMark(bottle, inferBottleType(bottle))) + "</span>" +
            '<span class="release-bottle">' + bottleSVG(bottle) + "</span>" +
            '<span class="release-caption">瓶型示意</span>' +
            '<span class="release-style">' + esc(bottle.subcategory) + "</span>" +
          "</div>" +
          '<div class="release-body">' +
            '<div class="release-topline"><span>' + esc(shortOrigin(bottle)) + "</span><span>" + esc(kinds) + "</span></div>" +
            '<p class="release-brandline"><span>' + esc(bottle.brand) + '</span><span>' + esc(bottle.brandEn) + "</span></p>" +
            '<h3 class="release-title">' + esc(bottle.name) + "</h3>" +
            '<p class="release-en">' + esc(bottle.enName) + "</p>" +
            '<div class="release-meta">' +
              '<span><b>' + esc(statusLabel) + "</b>" + esc(status.value) + "</span>" +
              '<span><b>ABV</b>' + esc(formatAbv(bottle.abv)) + "%</span>" +
              "<span><b>容量</b>" + esc(bottle.volume) + "</span>" +
            "</div>" +
            '<p class="release-flavors"><span>品鉴</span>' + esc(flavorText) + "</p>" +
            releaseExtraMarkup(bottle) +
            '<div class="release-foot">' +
              '<span class="release-price">' + esc(bottle.priceRef) + '<small>参考价 · 随市场变动</small></span>' +
              '<span class="release-open">打开酒标 ' + icons.arrow + "</span>" +
            "</div>" +
          "</div>" +
          '<span class="release-shine" aria-hidden="true"></span>' +
        "</a>" +
      "</article>"
    );
  }

  function renderEmptyState() {
    var defs = FILTER_DEFS[PAGE] || [];
    var copy = CATALOG_COPY[PAGE] || CATALOG_COPY.wine;
    var hasFilters = state.query || defs.some(function (def) { return Boolean(state.filters[def.key]); });
    els.grid.innerHTML =
      '<div class="empty-state">' +
        '<span class="empty-mark">空</span>' +
        "<h3>" + esc(copy.emptyTitle) + "</h3>" +
        "<p>" + esc(hasFilters ? copy.emptyText : "这一页还没有酒款。") + "</p>" +
        (hasFilters ? '<button class="empty-reset" type="button" data-reset-all>清空条件，重新看一遍 ' + icons.arrow + "</button>" : "") +
      "</div>";
  }

  function renderCatalog(options) {
    var opts = options || {};
    var copy = CATALOG_COPY[PAGE] || CATALOG_COPY.wine;
    var allInCategory = categoryBottles(PAGE);
    var list = filteredBottles(PAGE);
    var pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pageCount) state.page = pageCount;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * PAGE_SIZE;
    var end = Math.min(list.length, start + PAGE_SIZE);
    var visible = list.slice(start, end);
    var filteredCount = list.length;
    var pageText = pageCount > 1 ? " · 第 " + state.page + " / " + pageCount + " 页" : "";
    els.resultCount.innerHTML =
      "<strong>" + filteredCount + "</strong> " + esc(copy.unit) + esc(copy.verb) + " / " + esc(copy.scope) + " " + allInCategory.length + " " + esc(copy.unit) + pageText +
      (state.query || activeFilterEntries().length ? ' <button class="inline-reset" type="button" data-reset-all>清空条件</button>' : "");

    renderActiveChips();

    if (!visible.length) {
      renderEmptyState();
    } else {
      els.grid.innerHTML = visible.map(function (bottle, index) {
        return renderBottleCard(bottle, index);
      }).join("");
    }

    renderPagination(filteredCount, pageCount, start, end);
    scrollUiSync();

    if (opts.scroll) {
      var target = $("#catalogTop") || $("#catalog") || $(".catalog-section");
      if (target) target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }

  function resetAll() {
    state.query = "";
    state.filters = {};
    state.page = 1;
    if (els.localSearch) els.localSearch.value = "";
    $all("select[data-filter]", els.filterControls).forEach(function (select) {
      select.value = "";
    });
    updateLocalSearchUI();
    updateFilterSelectState();
    renderCatalog();
  }

  function initCatalog() {
    if (!FILTER_DEFS[PAGE]) return;
    els.filterControls = $("#filterControls");
    els.filterReset = $("#filterReset");
    els.activeChips = $("#activeFilterChips");
    els.grid = $("#bottleGrid");
    els.resultCount = $("#resultCount");
    els.pagination = $("#pagination");
    els.localSearch = $("#localPageSearch");
    els.localSearchWrap = $("#localSearchWrap");
    els.localSearchClear = $("#localSearchClear");

    var categoryItems = categoryBottles(PAGE);
    $all("[data-category-total]").forEach(function (node) {
      node.textContent = categoryItems.length;
    });
    $all("[data-category-brands]").forEach(function (node) {
      node.textContent = unique(categoryItems.map(function (bottle) { return bottle.brand; })).length;
    });

    buildFilterControls();

    $all("select[data-filter]", els.filterControls).forEach(function (select) {
      select.addEventListener("change", function () {
        state.filters[select.getAttribute("data-filter")] = select.value;
        state.page = 1;
        updateFilterSelectState();
        renderCatalog();
      });
    });

    if (els.localSearch) {
      els.localSearch.addEventListener("input", function () {
        state.query = els.localSearch.value;
        state.page = 1;
        updateLocalSearchUI();
        renderCatalog();
      });
      els.localSearchClear.addEventListener("click", function () {
        state.query = "";
        els.localSearch.value = "";
        state.page = 1;
        updateLocalSearchUI();
        renderCatalog();
        els.localSearch.focus();
      });
    }

    if (els.filterReset) {
      els.filterReset.addEventListener("click", resetAll);
    }

    els.activeChips.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-remove-filter")) {
        var key = button.getAttribute("data-remove-filter");
        state.filters[key] = "";
        var select = $('select[data-filter="' + key + '"]', els.filterControls);
        if (select) select.value = "";
        state.page = 1;
        updateFilterSelectState();
        renderCatalog();
      } else if (button.hasAttribute("data-remove-query")) {
        state.query = "";
        els.localSearch.value = "";
        state.page = 1;
        updateLocalSearchUI();
        renderCatalog();
        els.localSearch.focus();
      }
    });

    els.grid.addEventListener("click", function (event) {
      if (event.target.closest("[data-reset-all]")) {
        resetAll();
      }
    });

    els.resultCount.addEventListener("click", function (event) {
      if (event.target.closest("[data-reset-all]")) {
        resetAll();
      }
    });

    els.pagination.addEventListener("click", function (event) {
      var button = event.target.closest("[data-page-target]");
      if (!button || button.disabled) return;
      var target = Number(button.getAttribute("data-page-target"));
      if (!isFinite(target) || target === state.page) return;
      state.page = target;
      renderCatalog({ scroll: true });
    });

    els.localSearch.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && els.localSearch.value) {
        event.stopPropagation();
        els.localSearch.value = "";
        state.query = "";
        state.page = 1;
        updateLocalSearchUI();
        renderCatalog();
      }
    });

    /* The static markup already has the results count; make it meaningful immediately. */
    renderCatalog();
  }

  /* -------------------------------------------------------
     Home
     ------------------------------------------------------- */

  function dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function hydrateBottleArt() {
    $all("[data-bottle-art]").forEach(function (node) {
      if (node.getAttribute("data-art-ready") === "true") return;
      var bottle = byId(node.getAttribute("data-bottle-art"));
      if (!bottle) return;
      node.insertAdjacentHTML("afterbegin", bottleSVG(bottle));
      node.setAttribute("aria-label", bottle.name + "，瓶型示意");
      node.setAttribute("data-art-ready", "true");
    });
  }

  function renderToday() {
    var mount = $("#todayMount");
    if (!mount || !ALL.length) return;
    var today = new Date();
    var index = (today.getFullYear() * 366 + dayOfYear(today)) % ALL.length;
    var bottle = ALL[index];
    var status = statusOf(bottle);
    var statusLabel = bottle.category === "wine" ? "年份" : bottle.category === "spirits" ? "酒龄" : "年份 / 酒龄";
    var dateCode = pad2(today.getMonth() + 1) + "." + pad2(today.getDate());
    var priceTier = PRICE_TIERS[bottle.price] || PRICE_TIERS[1];
    mount.innerHTML =
      '<article class="daily-card" data-category="' + esc(bottle.category) + '">' +
        '<div class="daily-date">' +
          '<span class="daily-date-label">TODAY</span>' +
          '<strong>' + esc(dateCode) + "</strong>" +
          "<small>" + today.getFullYear() + "</small>" +
        "</div>" +
        '<div class="daily-art">' +
          '<span class="daily-art-index">NO. ' + String(index + 1).padStart(2, "0") + "</span>" +
          '<span class="daily-art-caption">瓶型示意 · BOTTLE STUDY</span>' +
          '<div class="daily-bottle">' + bottleSVG(bottle) + "</div>" +
        "</div>" +
        '<div class="daily-main">' +
          '<p class="daily-kicker">今日酒 / TODAY’S POUR</p>' +
          '<p class="daily-brandline"><span>' + esc(bottle.brand) + '</span><span>' + esc(bottle.brandEn) + "</span></p>" +
          "<h3>" + esc(bottle.name) + "</h3>" +
          '<p class="daily-en">' + esc(bottle.enName) + "</p>" +
          '<p class="daily-note">' + esc(truncate(bottle.notes, 108)) + "</p>" +
          '<div class="daily-facts">' +
            '<div><span>' + esc(statusLabel) + "</span><strong>" + esc(status.value) + "</strong></div>" +
            '<div><span>产区</span><strong>' + esc(shortOrigin(bottle)) + "</strong></div>" +
            '<div><span>酒精度</span><strong>' + esc(formatAbv(bottle.abv)) + "%</strong></div>" +
            '<div><span>价格档</span><strong>¥ ' + esc(priceTier.short) + "</strong></div>" +
          "</div>" +
          '<div class="daily-actions">' +
            '<a class="daily-link" href="' + bottleHref(bottle) + '" data-bottle-link data-bottle-id="' + esc(bottle.id) + '">打开这瓶的完整酒标 ' + icons.arrow + "</a>" +
            '<span class="daily-temp">' + esc(bottle.serveTemp) + "</span>" +
          "</div>" +
        "</div>" +
        '<aside class="daily-aside">' +
          '<span class="daily-aside-label">FOR THE WRITER / 创作提示</span>' +
          '<p>' + esc(bottle.creative) + "</p>" +
          '<span class="daily-aside-meta">' + esc(categoryMeta(bottle.category).zh) + " · " + esc(bottle.subcategory) + "</span>" +
        "</aside>" +
      "</article>";
  }

  function initHome() {
    $all("[data-category-count]").forEach(function (node) {
      var category = node.getAttribute("data-category-count");
      var unit = CATEGORY_COUNT_UNIT[category] || "瓶";
      node.textContent = categoryCount(category) + " " + unit;
    });
    $all("[data-total-categories]").forEach(function (node) {
      node.textContent = "06";
    });
    renderToday();
  }

  /* -------------------------------------------------------
     Global actions, keyboard, init
     ------------------------------------------------------- */

  function randomBottle() {
    if (!ALL.length) {
      showToast("酒柜里还没有酒。");
      return;
    }
    var pool = state.openId ? ALL.filter(function (bottle) { return bottle.id !== state.openId; }) : ALL;
    var bottle = pool[Math.floor(Math.random() * pool.length)] || ALL[0];
    closeSearch(false);
    if (PAGE === bottle.category) {
      openBottle(bottle.id);
    } else {
      window.location.href = bottleHref(bottle);
    }
  }

  function focusableIn(container) {
    return $all(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (element) {
      return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
    });
  }

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    var modal = !els.searchLayer.hidden ? els.searchLayer : !els.drawerLayer.hidden ? els.drawerLayer : null;
    if (!modal) return;
    var elements = focusableIn(modal);
    if (!elements.length) return;
    var first = elements[0];
    var last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initKeyboard() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (!els.searchLayer.hidden) {
          event.preventDefault();
          closeSearch();
          return;
        }
        if (!els.drawerLayer.hidden) {
          event.preventDefault();
          closeBottle();
          return;
        }
      }
      if (event.key === "Tab") {
        trapFocus(event);
      }
      var slashShortcut = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
      var commandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey;
      if ((slashShortcut || commandK) && els.searchLayer.hidden && els.drawerLayer.hidden) {
        var target = event.target;
        var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) return;
        event.preventDefault();
        openSearch("");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!els.searchLayer.hidden && event.key === "Enter" && event.target === els.searchInput) {
        var first = $("[data-bottle-link]", els.searchResults);
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
    });
  }

  function initGlobalActions() {
    $all("[data-random]").forEach(function (button) {
      button.addEventListener("click", randomBottle);
    });

    $all("[data-current-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });

    $all("[data-total-bottles]").forEach(function (node) {
      node.textContent = ALL.length;
    });
    $all("[data-total-brands]").forEach(function (node) {
      node.textContent = brandCount();
    });

    var header = $(".app-head") || $(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* -------------------------------------------------------
     Motion system
     ------------------------------------------------------- */

  var motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var motionState = {
    raf: 0,
    lastX: 0,
    lastY: 0,
    card: null,
    cardX: 0,
    cardY: 0,
    cardTiltX: 0,
    cardTiltY: 0,
    initialized: false
  };

  function initScrollUi() {
    var progress = els.scrollProgress;
    var toTop = els.toTop;
    var ticking = false;
    var reduce = motionMedia.matches;

    function sync() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progress) progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      if (toTop) {
        var visible = window.scrollY > window.innerHeight * 0.72;
        toTop.classList.toggle("is-visible", visible);
        toTop.tabIndex = visible ? 0 : -1;
        if (!visible && document.activeElement === toTop) toTop.blur();
      }
      document.documentElement.style.setProperty("--scroll-ratio", ratio.toFixed(4));
    }

    function requestSync() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }

    scrollUiSync = sync;
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync, { passive: true });
    document.addEventListener("visibilitychange", requestSync);
    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      });
    }
    sync();
  }

  function createAmbientMotes() {
    var hero = document.querySelector("main > section") || document.querySelector("main");
    if (!hero) return;
    var count = window.matchMedia("(max-width: 700px)").matches ? 10 : 20;
    var box = document.createElement("div");
    box.className = "ambient-motes";
    box.setAttribute("aria-hidden", "true");
    for (var i = 0; i < count; i += 1) {
      var mote = document.createElement("span");
      mote.className = "ambient-mote" + (i % 3 === 0 ? " ambient-mote--alt" : "");
      var size = (i % 6 === 0 ? 4.2 : 1.2) + Math.random() * 4.6;
      mote.style.setProperty("--mote-x", (4 + Math.random() * 92).toFixed(2) + "%");
      mote.style.setProperty("--mote-y", (28 + Math.random() * 68).toFixed(2) + "%");
      mote.style.setProperty("--mote-size", size.toFixed(2) + "px");
      mote.style.setProperty("--mote-duration", (10 + Math.random() * 13).toFixed(2) + "s");
      mote.style.setProperty("--mote-delay", (-Math.random() * 20).toFixed(2) + "s");
      mote.style.setProperty("--mote-drift", (-48 + Math.random() * 96).toFixed(0) + "px");
      mote.style.setProperty("--mote-opacity", (0.16 + Math.random() * 0.3).toFixed(2));
      box.appendChild(mote);
    }
    hero.appendChild(box);
  }

  function initPointerMotion() {
    var root = document.documentElement;
    document.addEventListener("pointermove", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      motionState.lastX = event.clientX;
      motionState.lastY = event.clientY;

      var card = event.target && event.target.closest ? event.target.closest(".release-card") : null;
      if (card) {
        var rect = card.getBoundingClientRect();
        motionState.card = card;
        motionState.cardX = event.clientX - rect.left;
        motionState.cardY = event.clientY - rect.top;
        motionState.cardTiltX = (motionState.cardX / Math.max(1, rect.width) - 0.5) * 2;
        motionState.cardTiltY = (motionState.cardY / Math.max(1, rect.height) - 0.5) * 2;
      } else {
        motionState.card = null;
      }

      if (motionState.raf) return;
      motionState.raf = window.requestAnimationFrame(function () {
        motionState.raf = 0;
        var x = motionState.lastX;
        var y = motionState.lastY;
        var nx = (x / Math.max(1, window.innerWidth)) * 2 - 1;
        var ny = (y / Math.max(1, window.innerHeight)) * 2 - 1;
        root.style.setProperty("--pointer-x", nx.toFixed(3));
        root.style.setProperty("--pointer-y", ny.toFixed(3));
        root.style.setProperty("--cursor-x", x.toFixed(0) + "px");
        root.style.setProperty("--cursor-y", y.toFixed(0) + "px");
        root.classList.add("has-pointer");
        if (motionState.card) {
          motionState.card.style.setProperty("--mx", motionState.cardX.toFixed(1) + "px");
          motionState.card.style.setProperty("--my", motionState.cardY.toFixed(1) + "px");
          motionState.card.style.setProperty("--tilt-x", motionState.cardTiltX.toFixed(3));
          motionState.card.style.setProperty("--tilt-y", motionState.cardTiltY.toFixed(3));
        }
      });
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      root.classList.remove("has-pointer");
    });

    if (["beer", "spirits", "liqueur"].indexOf(PAGE) !== -1) {
      var aura = document.createElement("div");
      aura.className = "cursor-aura";
      aura.setAttribute("aria-hidden", "true");
      document.body.appendChild(aura);
      root.style.setProperty("--cursor-x", "50vw");
      root.style.setProperty("--cursor-y", "42vh");
    }
  }

  function initScrollReveal() {
    if (!("IntersectionObserver" in window)) return;
    var selectors = [
      "[data-reveal]",
      ".section-marker",
      ".room-card",
      ".daily-card",
      ".home-notes .notes-lead",
      ".home-notes .note-row",
      ".wine-note",
      ".beer-ritual",
      ".spirits-taxonomy .taxonomy-head",
      ".spirits-taxonomy .taxonomy-list > div",
      ".eastern-glossary",
      ".liqueur-usage .usage-head",
      ".liqueur-usage .usage-grid > div",
      ".mixed-manifesto"
    ];
    var seen = [];
    var candidates = [];
    selectors.forEach(function (selector) {
      $all(selector).forEach(function (node) {
        if (seen.indexOf(node) !== -1) return;
        seen.push(node);
        candidates.push(node);
      });
    });

    var belowFold = candidates.filter(function (node) {
      var rect = node.getBoundingClientRect();
      return rect.top > window.innerHeight * 0.9 && rect.height > 20;
    });
    if (!belowFold.length) return;

    belowFold.forEach(function (node, index) {
      node.setAttribute("data-reveal", "");
      node.style.setProperty("--reveal-delay", Math.min(index * 55, 330) + "ms");
    });
    document.documentElement.classList.add("has-reveal");

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    belowFold.forEach(function (node) { observer.observe(node); });
  }

  function initMotion() {
    initScrollUi();
    if (motionMedia.matches) return;

    document.documentElement.classList.add("has-motion");
    if (finePointer.matches) initPointerMotion();
    createAmbientMotes();
    initScrollReveal();

    if (!motionState.initialized) {
      motionState.initialized = true;
      var onMotionChange = function () {
        if (!motionMedia.matches) return;
        document.documentElement.classList.remove("has-motion");
        $all(".cursor-aura, .ambient-motes").forEach(function (node) { node.remove(); });
        $all("[data-reveal]").forEach(function (node) { node.classList.add("is-revealed"); });
      };
      if (motionMedia.addEventListener) motionMedia.addEventListener("change", onMotionChange);
      else if (motionMedia.addListener) motionMedia.addListener(onMotionChange);
    }
  }

  function initHashDeepLink() {
    var id = getHashId();
    if (id && byId(id)) {
      openBottle(id, { fromHash: true });
    }
  }

  function init() {
    injectUI();
    initGlobalActions();
    initSearch();
    initDrawer();
    initKeyboard();
    if (PAGE === "home") {
      initHome();
    } else {
      initCatalog();
    }
    hydrateBottleArt();
    initMotion();
    if (window.location.hash && byId(getHashId())) {
      initHashDeepLink();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
