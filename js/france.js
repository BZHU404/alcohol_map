/* FRANCE / region map, data sheet and dynamic cellar counts. */
(function () {
  "use strict";

  var REGIONS = [
    {
      id: "bordeaux", no: "01", name: "波尔多", en: "BORDEAUX", color: "#3b7fc4",
      coord: "44.8°N / 0.6°W", altitude: "0–100 m", ripen: "9 月中–10 月上",
      harvest: "Merlot 早 / Cabernet 晚", climate: "海洋性", soil: "砾石、黏土-石灰岩",
      red: "赤霞珠、梅洛、品丽珠、小维多",
      white: "赛美蓉、长相思、密斯卡岱",
      aoc: "玛歌、波亚克、圣朱利安、圣埃美隆、波美侯、苏玳",
      style: "红 / 干白 / 贵腐甜",
      note: "左岸赤霞珠，右岸梅洛；苏玳与巴萨克是贵腐甜白核心。"
    },
    {
      id: "southwest", no: "02", name: "西南产区", en: "SUD-OUEST", color: "#df8a2d",
      coord: "44.3°N / 0.8°E", altitude: "50–400 m", ripen: "9 月上–10 月",
      harvest: "Merlot 早 / Malbec、Tannat 晚", climate: "海洋性 / 大陆性", soil: "砾石、石灰岩",
      red: "马尔贝克、丹娜、梅洛、品丽珠",
      white: "小满胜、大满胜、赛美蓉、长相思",
      aoc: "卡奥尔、马迪朗、瑞朗松、蒙巴兹雅克、贝尔热拉克",
      style: "红 / 白 / 甜",
      note: "卡奥尔的马尔贝克、马迪朗的丹娜；瑞朗松与蒙巴兹雅克有甜白。"
    },
    {
      id: "loire", no: "03", name: "卢瓦尔河谷", en: "LOIRE VALLEY", color: "#76a84a",
      coord: "47.4°N / 0.7°E", altitude: "20–200 m", ripen: "9 月上–10 月上",
      harvest: "Sauvignon 早 / Chenin 晚", climate: "海洋性 / 大陆性", soil: "片岩、石灰岩、黏土",
      red: "品丽珠、黑皮诺",
      white: "长相思、白诗南、勃艮第香瓜",
      aoc: "桑塞尔、武弗雷、希侬、慕斯卡德、莱昂丘",
      style: "白 / 红 / 桃红 / 起泡 / 甜",
      note: "河流从大西洋到内陆，风格跨度极大；莱昂丘是贵腐甜白。"
    },
    {
      id: "champagne", no: "04", name: "香槟区", en: "CHAMPAGNE", color: "#7d3f9a",
      coord: "49.0°N / 4.0°E", altitude: "80–300 m", ripen: "9 月上–9 月下",
      harvest: "Pinot / Meunier 早 / Chardonnay 晚", climate: "大陆性", soil: "白垩土、黏土",
      red: "黑皮诺、莫尼耶",
      white: "霞多丽",
      aoc: "兰斯山、白丘、马恩河谷、巴尔丘",
      style: "起泡",
      note: "多数是无年份调配；白中白、黑中白、桃红是风格，不是等级。"
    },
    {
      id: "alsace", no: "05", name: "阿尔萨斯", en: "ALSACE", color: "#1f8a8a",
      coord: "48.3°N / 7.4°E", altitude: "200–500 m", ripen: "9 月下–11 月",
      harvest: "Riesling 中 / Gewürz、SGN 晚", climate: "大陆性 / 干燥", soil: "花岗岩、石灰岩、泥灰岩",
      red: "黑皮诺",
      white: "雷司令、琼瑶浆、灰皮诺、麝香、白皮诺",
      aoc: "阿尔萨斯、阿尔萨斯特级园、晚收、贵腐精选",
      style: "白 / 甜 / 起泡",
      note: "法国少见的品种标注区；SGN 是贵腐精选，甜度高但酸度也高。"
    },
    {
      id: "burgundy", no: "06", name: "勃艮第", en: "BURGUNDY", color: "#c23a72",
      coord: "47.0°N / 4.8°E", altitude: "200–500 m", ripen: "9 月上–9 月下",
      harvest: "Pinot 早 / Chardonnay 中", climate: "大陆性", soil: "石灰岩、泥灰岩",
      red: "黑皮诺",
      white: "霞多丽、阿里高特",
      aoc: "香贝丹、慕西尼、罗曼尼-康帝、蒙哈榭、科通-查理曼、夏布利",
      style: "红 / 白 / 起泡",
      note: "地块细到克里玛；金丘是核心，夏布利只做白，马贡也有红白。"
    },
    {
      id: "jura", no: "07", name: "汝拉", en: "JURA", color: "#d9685a",
      coord: "46.7°N / 5.9°E", altitude: "250–500 m", ripen: "9 月上–10 月",
      harvest: "Poulsard 早 / Savagnin 晚", climate: "大陆性", soil: "泥灰岩、石灰岩",
      red: "普萨、特卢梭、黑皮诺",
      white: "萨瓦涅、霞多丽",
      aoc: "汝拉丘、阿尔布瓦、夏龙堡、莱托瓦勒",
      style: "白 / 黄酒 / 红",
      note: "黄酒（Vin Jaune）在酵母下陈年；夏龙堡是标志性产区，风格近雪利。"
    },
    {
      id: "savoie", no: "08", name: "萨瓦", en: "SAVOIE", color: "#e3b52f",
      coord: "45.6°N / 6.2°E", altitude: "300–800 m", ripen: "9 月中–10 月",
      harvest: "Jacquère 中 / Mondeuse 晚", climate: "阿尔卑斯 / 大陆性", soil: "石灰岩、片岩",
      red: "蒙德斯",
      white: "雅凯尔、阿泰斯、夏瑟拉",
      aoc: "萨瓦葡萄酒、萨瓦鲁塞特",
      style: "白 / 红",
      note: "阿尔卑斯山区的清瘦白葡萄酒；配奶酪和山地菜很合适。"
    },
    {
      id: "rhone", no: "09", name: "罗讷河谷", en: "RHÔNE VALLEY", color: "#d23b6a",
      coord: "44.5°N / 4.8°E", altitude: "100–500 m", ripen: "9 月上–10 月上",
      harvest: "Syrah 早 / Grenache 中 / Mourvèdre 晚", climate: "地中海 / 大陆性", soil: "花岗岩、砾石、石灰岩",
      red: "西拉、歌海娜、慕合怀特",
      white: "维欧尼、玛珊、胡珊",
      aoc: "罗第丘、埃米塔日、教皇新堡、孔得里约、博姆-德沃尼斯",
      style: "红 / 白 / 甜",
      note: "北罗讷陡坡、南罗讷圆石；博姆-德沃尼斯有天然甜酒。"
    },
    {
      id: "provence", no: "10", name: "普罗旺斯", en: "PROVENCE", color: "#9b6bab",
      coord: "43.7°N / 5.5°E", altitude: "50–400 m", ripen: "8 月下–9 月",
      harvest: "Rosé 早 / Mourvèdre 晚", climate: "地中海", soil: "石灰岩、片岩",
      red: "歌海娜、神索、西拉、慕合怀特",
      white: "罗尔、克莱雷特",
      aoc: "普罗旺斯丘、邦多尔、卡西斯、贝莱",
      style: "桃红 / 红 / 白",
      note: "桃红是名片，但邦多尔的慕合怀特红同样重要；不是所有桃红都甜。"
    },
    {
      id: "languedoc", no: "11", name: "朗格多克-露喜龙", en: "LANGUEDOC-ROUSSILLON", color: "#e46a2f",
      coord: "43.5°N / 3.5°E", altitude: "20–500 m", ripen: "8 月下–10 月",
      harvest: "Early 8 月下 / Carignan 晚", climate: "地中海", soil: "石灰岩、片岩、砾石",
      red: "歌海娜、西拉、慕合怀特、佳丽酿、神索",
      white: "皮克普尔、白歌海娜、玛珊、胡珊",
      aoc: "皮克-圣卢、拉尔扎克梯田、科比埃、米内瓦、皮克普尔",
      style: "红 / 桃红 / 白",
      note: "地中海大产区，产量大、风格多；不要只用“便宜酒”概括。"
    },
    {
      id: "corsica", no: "12", name: "科西嘉", en: "CORSICA", color: "#8a5a3b",
      coord: "42.2°N / 9.0°E", altitude: "0–600 m", ripen: "9 月上–10 月",
      harvest: "Vermentino 中 / Niellucciu 晚", climate: "地中海", soil: "花岗岩、片岩",
      red: "涅露秋、夏卡雷卢",
      white: "维蒙蒂诺、麝香",
      aoc: "科西嘉、帕特里莫尼奥、阿雅克肖、卡普科斯麝香",
      style: "红 / 桃红 / 白 / 甜",
      note: "地中海岛屿风格；帕特里莫尼奥的涅露秋红值得单独记一笔。"
    }
  ];

  var selected = "bordeaux";
  var byId = {};
  REGIONS.forEach(function (region) { byId[region.id] = region; });

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function panelHtml(region) {
    return '<div class="region-panel-inner" style="--panel-accent:' + region.color + '">' +
      '<div class="region-panel-head">' +
        '<span class="region-panel-kicker">REGION FILE / ' + region.no + '</span>' +
        '<h3>' + esc(region.name) + '</h3>' +
        '<p>' + esc(region.en) + '</p>' +
      '</div>' +
      '<dl class="region-panel-facts">' +
        '<div><dt>坐标 / COORD</dt><dd>' + esc(region.coord) + '</dd></div>' +
        '<div><dt>海拔 / ALT</dt><dd>' + esc(region.altitude) + '</dd></div>' +
        '<div><dt>成熟 / 采收</dt><dd>' + esc(region.ripen) + '</dd></div>' +
        '<div><dt>气候 / 土壤</dt><dd>' + esc(region.climate) + ' · ' + esc(region.soil) + '</dd></div>' +
      '</dl>' +
      '<div class="region-panel-copy">' +
        '<p><b>AOC</b> ' + esc(region.aoc) + '</p>' +
        '<p><b>RED</b> ' + esc(region.red) + '</p>' +
        '<p><b>WHITE</b> ' + esc(region.white) + '</p>' +
        '<p><b>STYLE</b> ' + esc(region.style) + '</p>' +
        '<p class="region-panel-note">' + esc(region.note) + '</p>' +
      '</div>' +
    '</div>';
  }

  function cardHtml(region) {
    return '<article class="region-card" data-region-card="' + region.id + '" role="button" tabindex="0" aria-pressed="' + (selected === region.id ? 'true' : 'false') + '" style="--region-accent:' + region.color + '">' +
      '<div class="region-top"><span class="region-no">' + region.no + '</span><h3>' + esc(region.name) + ' <em>' + esc(region.en) + '</em></h3><span class="region-style">' + esc(region.style) + '</span></div>' +
      '<p class="region-appellations"><b>AOC</b> ' + esc(region.aoc) + '</p>' +
      '<div class="region-data">' +
        '<span><b>COORD</b>' + esc(region.coord) + '</span>' +
        '<span><b>ALT</b>' + esc(region.altitude) + '</span>' +
        '<span><b>RIPEN</b>' + esc(region.ripen) + '</span>' +
      '</div>' +
      '<p class="region-grapes"><b>RED</b> ' + esc(region.red) + '<br><b>WHITE</b> ' + esc(region.white) + '</p>' +
      '<p class="region-note">' + esc(region.note) + '</p>' +
    '</article>';
  }

  function legendHtml() {
    return REGIONS.map(function (region) {
      return '<button class="region-legend-item" type="button" data-region-legend="' + region.id + '" aria-pressed="' + (selected === region.id ? 'true' : 'false') + '">' +
        '<i style="--legend-color:' + region.color + '"></i>' +
        '<span class="legend-no">' + region.no + '</span>' +
        '<span class="legend-name">' + esc(region.name) + '</span>' +
        '<span class="legend-en">' + esc(region.en) + '</span>' +
      '</button>';
    }).join("");
  }

  function render() {
    var panel = document.getElementById("regionPanel");
    var legend = document.getElementById("regionLegend");
    var list = document.getElementById("regionList");
    if (panel) panel.innerHTML = panelHtml(byId[selected]);
    if (legend) legend.innerHTML = legendHtml();
    if (list) list.innerHTML = REGIONS.map(cardHtml).join("");

    document.querySelectorAll("[data-region-card], [data-region-legend]").forEach(function (node) {
      var id = node.getAttribute("data-region-card") || node.getAttribute("data-region-legend");
      var active = id === selected;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.querySelectorAll("#franceMap [data-region]").forEach(function (node) {
      var active = node.getAttribute("data-region") === selected;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function selectRegion(id, opts) {
    if (!byId[id]) return;
    selected = id;
    render();
    if (opts && opts.scroll) {
      var panel = document.getElementById("regionPanel");
      if (panel && window.innerWidth < 900) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function bind() {
    var map = document.querySelector(".france-carte-map");
    if (map) {
      map.addEventListener("click", function (event) {
        var target = event.target.closest("[data-region]");
        if (target) selectRegion(target.getAttribute("data-region"), { scroll: true });
      });
      map.addEventListener("keydown", function (event) {
        var target = event.target.closest("[data-region]");
        if (target && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          selectRegion(target.getAttribute("data-region"), { scroll: true });
        }
      });
    }

    var legend = document.getElementById("regionLegend");
    if (legend) {
      legend.addEventListener("click", function (event) {
        var button = event.target.closest("[data-region-legend]");
        if (button) selectRegion(button.getAttribute("data-region-legend"));
      });
    }

    var list = document.getElementById("regionList");
    if (list) {
      list.addEventListener("click", function (event) {
        var card = event.target.closest("[data-region-card]");
        if (card) selectRegion(card.getAttribute("data-region-card"));
      });
      list.addEventListener("keydown", function (event) {
        var card = event.target.closest("[data-region-card]");
        if (card && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          selectRegion(card.getAttribute("data-region-card"));
        }
      });
    }
  }

  var bottles = (window.BOTTLES || []).filter(function (b) { return b.country === "法国"; });
  var cats = {};
  bottles.forEach(function (b) { cats[b.category] = (cats[b.category] || 0) + 1; });
  document.querySelectorAll("[data-france-count]").forEach(function (node) { node.textContent = bottles.length; });
  document.querySelectorAll("[data-france-cat]").forEach(function (node) {
    node.textContent = cats[node.getAttribute("data-france-cat")] || 0;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { render(); bind(); }, { once: true });
  } else {
    render();
    bind();
  }
})();
