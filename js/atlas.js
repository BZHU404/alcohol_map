/* The Bottle Atlas — country/region browser. */
(function () {
  "use strict";

  var BOTTLES = window.BOTTLES || [];
  var CAT_ORDER = ["wine", "beer", "spirits", "eastern", "liqueur", "mixed"];
  var CAT_LABELS = {
    wine: "葡萄酒",
    beer: "啤酒",
    spirits: "西方酒",
    eastern: "东方酒",
    liqueur: "利口酒",
    mixed: "杂酒"
  };
  var PAGE_BY_CAT = {
    wine: "wine.html",
    beer: "beer.html",
    spirits: "spirits.html",
    eastern: "eastern.html",
    liqueur: "liqueur.html",
    mixed: "mixed.html"
  };
  var COUNTRY_ALIASES = {
    France: "法国", China: "中国", "United Kingdom": "英国", UK: "英国",
    USA: "美国", "United States": "美国", Japan: "日本", Germany: "德国",
    Italy: "意大利", Spain: "西班牙", Australia: "澳大利亚", Canada: "加拿大"
  };
  var CODES = {
    "法国": "FR", "中国": "CN", "英国": "UK", "美国": "US", "德国": "DE",
    "比利时": "BE", "日本": "JP", "意大利": "IT", "爱尔兰": "IE", "西班牙": "ES",
    "澳大利亚": "AU", "加拿大": "CA", "葡萄牙": "PT", "墨西哥": "MX",
    "荷兰": "NL", "捷克": "CZ", "新西兰": "NZ", "智利": "CL", "爱沙尼亚": "EE",
    "波多黎各": "PR", "瑞典": "SE", "委内瑞拉": "VE", "韩国": "KR",
    "黎巴嫩": "LB", "泰国": "TH", "印度": "IN", "特立尼达和多巴哥": "TT",
    "匈牙利": "HU", "巴西": "BR", "秘鲁": "PE", "瑞士": "CH", "挪威": "NO", "丹麦": "DK",
    "奥地利": "AT", "阿根廷": "AR", "南非": "ZA", "波兰": "PL", "希腊": "GR", "古巴": "CU", "牙买加": "JM", "巴巴多斯": "BB", "危地马拉": "GT", "哥伦比亚": "CO", "哥斯达黎加": "CR", "多米尼加": "DO", "越南": "VN", "菲律宾": "PH", "印度尼西亚": "ID"
  };

  var CONTINENTS = [
    { key: "europe", label: "欧洲", en: "EUROPE", countries: ["法国", "英国", "德国", "比利时", "意大利", "爱尔兰", "西班牙", "葡萄牙", "荷兰", "捷克", "爱沙尼亚", "瑞典", "匈牙利", "瑞士", "挪威", "丹麦", "奥地利", "波兰", "希腊"] },
    { key: "americas", label: "美洲", en: "THE AMERICAS", countries: ["美国", "加拿大", "墨西哥", "智利", "波多黎各", "委内瑞拉", "特立尼达和多巴哥", "巴西", "秘鲁", "阿根廷", "古巴", "牙买加", "巴巴多斯", "危地马拉", "哥伦比亚", "哥斯达黎加", "多米尼加"] },
    { key: "asia", label: "亚洲", en: "ASIA", countries: ["中国", "日本", "韩国", "黎巴嫩", "泰国", "印度", "越南", "菲律宾", "印度尼西亚"] },
    { key: "oceania", label: "大洋洲", en: "OCEANIA", countries: ["澳大利亚", "新西兰"] },
    { key: "africa", label: "非洲", en: "AFRICA", countries: ["南非"] }
  ];

  var state = {
    continent: "all",
    country: null,
    region: null
  };

  var byCountry = {};
  var countryOrder = [];
  var countriesByContinent = {};
  var continentTotals = {};

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function continentFor(country) {
    for (var i = 0; i < CONTINENTS.length; i += 1) {
      if (CONTINENTS[i].countries.indexOf(country) !== -1) return CONTINENTS[i];
    }
    return null;
  }

  function categoryOrder(bottle) {
    return CAT_ORDER.indexOf(bottle.category);
  }

  function bottleTime(bottle) {
    if (bottle.vintage && bottle.vintage !== "NV") return bottle.vintage;
    if (bottle.age && bottle.age !== "NAS") return bottle.age;
    return bottle.vintage || bottle.age || "NV";
  }

  function bottleHref(bottle) {
    return PAGE_BY_CAT[bottle.category] + "#" + encodeURIComponent(bottle.id);
  }

  function prepareData() {
    BOTTLES.forEach(function (bottle) {
      var country = bottle.country || "未标注";
      if (!byCountry[country]) {
        byCountry[country] = {
          country: country,
          bottles: [],
          regions: [],
          categories: {}
        };
      }
      byCountry[country].bottles.push(bottle);
      if (byCountry[country].regions.indexOf(bottle.region) === -1) {
        byCountry[country].regions.push(bottle.region);
      }
      byCountry[country].categories[bottle.category] =
        (byCountry[country].categories[bottle.category] || 0) + 1;
    });

    countryOrder = Object.keys(byCountry).sort(function (a, b) {
      return byCountry[b].bottles.length - byCountry[a].bottles.length ||
        a.localeCompare(b, "zh-Hans-CN");
    });

    CONTINENTS.forEach(function (continent) {
      continentTotals[continent.key] = 0;
      countriesByContinent[continent.key] = continent.countries.filter(function (country) {
        return byCountry[country];
      }).sort(function (a, b) {
        return byCountry[b].bottles.length - byCountry[a].bottles.length ||
          a.localeCompare(b, "zh-Hans-CN");
      });
      countriesByContinent[continent.key].forEach(function (country) {
        continentTotals[continent.key] += byCountry[country].bottles.length;
      });
    });

    var total = document.querySelector("[data-atlas-total]");
    var brands = document.querySelector("[data-atlas-brands]");
    var countries = document.querySelector("[data-atlas-countries]");
    var france = document.querySelector("[data-france-count]");
    if (total) total.textContent = BOTTLES.length;
    if (brands) brands.textContent = new Set(BOTTLES.map(function (b) { return b.brand; })).size;
    if (countries) countries.textContent = countryOrder.length;
    if (france) france.textContent = byCountry["法国"] ? byCountry["法国"].bottles.length : 0;

    document.querySelectorAll("[data-continent-count]").forEach(function (node) {
      var key = node.getAttribute("data-continent-count");
      node.textContent = continentTotals[key] == null ? "—" : String(continentTotals[key]);
    });
  }

  function renderToolbar() {
    var mount = document.getElementById("atlasToolbar");
    if (!mount) return;
    var allCount = BOTTLES.length;
    var items = [{ key: "all", label: "全部", en: "ALL", count: allCount }].concat(
      CONTINENTS.map(function (c) {
        return { key: c.key, label: c.label, en: c.en, count: continentTotals[c.key] };
      })
    );
    mount.innerHTML = items.map(function (item) {
      return '<button class="atlas-filter' + (state.continent === item.key ? " is-active" : "") + '" type="button" data-continent-filter="' + esc(item.key) + '" aria-pressed="' + (state.continent === item.key ? "true" : "false") + '">' + esc(item.en) + " / " + esc(item.label) + " <span>" + item.count + "</span></button>";
    }).join("");
  }

  function countryCard(country) {
    var item = byCountry[country];
    var active = state.country === country ? " is-active" : "";
    var france = country === "法国" ? " is-france" : "";
    return '<button class="country-card' + active + france + '" type="button" data-country="' + esc(country) + '" aria-pressed="' + (state.country === country ? "true" : "false") + '">' +
      '<span class="country-card-code">' + esc(CODES[country] || country.slice(0, 2)) + '</span>' +
      '<span class="country-card-name">' + esc(country) + '</span>' +
      '<span class="country-card-meta"><span>' + item.bottles.length + ' 瓶</span><span>' + item.regions.length + ' 个产区</span></span>' +
    '</button>';
  }

  function renderIndex() {
    var mount = document.getElementById("countryIndex");
    if (!mount) return;
    var groups = CONTINENTS.filter(function (continent) {
      return state.continent === "all" || state.continent === continent.key;
    });
    var html = "";
    groups.forEach(function (continent) {
      var countries = countriesByContinent[continent.key] || [];
      if (!countries.length) {
        if (state.continent === continent.key) {
          html += '<div class="atlas-empty">' + esc(continent.label) + '暂无收录；等下一瓶来自这里的酒。</div>';
        }
        return;
      }
      html += '<section class="country-group" aria-label="' + esc(continent.label) + '">' +
        '<div class="country-group-head"><h3>' + esc(continent.en) + ' / ' + esc(continent.label) + '</h3><span>' +
          countries.reduce(function (sum, c) { return sum + byCountry[c].bottles.length; }, 0) + ' bottles / ' + countries.length + ' countries</span></div>' +
        '<div class="country-grid">' + countries.map(countryCard).join("") + '</div>' +
      '</section>';
    });
    mount.innerHTML = html || '<div class="atlas-empty">还没有可显示的国家。</div>';
  }

  function renderCategoryBars(item) {
    return '<div class="atlas-cat-bars">' + CAT_ORDER.filter(function (cat) {
      return item.categories[cat];
    }).map(function (cat) {
      return '<span class="atlas-cat-bar"><strong>' + esc(CAT_LABELS[cat]) + '</strong> ' + item.categories[cat] + '</span>';
    }).join("") + '</div>';
  }

  function renderRegions(item) {
    var regions = item.regions.slice().sort(function (a, b) { return a.localeCompare(b, "zh-Hans-CN"); });
    return '<div class="atlas-regions" aria-label="按产区筛选">' +
      '<button class="atlas-region' + (state.region === null ? " is-active" : "") + '" type="button" data-region="">全部产区</button>' +
      regions.map(function (region) {
        return '<button class="atlas-region' + (state.region === region ? " is-active" : "") + '" type="button" data-region="' + esc(region) + '">' + esc(region) + '</button>';
      }).join("") +
    '</div>';
  }

  function renderBottles(item) {
    var bottles = item.bottles.filter(function (b) {
      return !state.region || b.region === state.region;
    }).sort(function (a, b) {
      return categoryOrder(a) - categoryOrder(b) ||
        a.brand.localeCompare(b.brand, "zh-Hans-CN") ||
        a.name.localeCompare(b.name, "zh-Hans-CN");
    });
    if (!bottles.length) {
      return '<div class="atlas-empty">这个产区还没有酒款记录。</div>';
    }
    return '<div class="atlas-bottle-list">' + bottles.map(function (bottle) {
      return '<a class="atlas-bottle" href="' + bottleHref(bottle) + '">' +
        '<span class="atlas-bottle-top"><span class="atlas-bottle-name">' + esc(bottle.name) + '</span><span class="atlas-bottle-cat">' + esc(CAT_LABELS[bottle.category] || bottle.category) + '</span></span>' +
        '<span class="atlas-bottle-meta">' + esc(bottle.region) + ' · ' + esc(bottleTime(bottle)) + ' · ' + esc(String(bottle.abv)) + '%</span>' +
      '</a>';
    }).join("") + '</div>';
  }

  function renderPanel() {
    var panel = document.getElementById("atlasPanel");
    if (!panel) return;
    if (!state.country) {
      var featured = countryOrder.slice(0, 5);
      panel.innerHTML = '<div class="atlas-panel-empty">' +
        '<div><span class="atlas-panel-label">SELECT A COUNTRY</span>' +
        '<h2>先选一个<br>地方。</h2>' +
        '<p>点左边的国家卡片，或者直接点地图上的大洲。一个国家里可能同时有葡萄酒、啤酒、烈酒和白酒；这只酒柜不按品类分国界。</p>' +
        '<div class="atlas-featured">' + featured.map(function (country) {
          return '<button type="button" data-featured-country="' + esc(country) + '">' + esc(country) + '</button>';
        }).join("") + '</div></div>' +
        '<div class="atlas-panel-foot">' + BOTTLES.length + ' BOTTLES / ' + countryOrder.length + ' COUNTRIES / CLICK TO FILTER</div>' +
      '</div>';
      return;
    }

    var item = byCountry[state.country];
    var isFrance = state.country === "法国";
    panel.innerHTML = '<div class="atlas-panel-inner">' +
      '<div class="atlas-panel-head">' +
        '<span class="atlas-panel-label">COUNTRY FILE / ' + esc(CODES[state.country] || "—") + '</span>' +
        '<h2>' + esc(state.country) + '</h2>' +
        '<p>' + item.bottles.length + ' bottles · ' + item.regions.length + ' regions' + (state.region ? ' · ' + esc(state.region) : '') + '</p>' +
        (isFrance ? '<a class="atlas-france-link" href="france.html">打开法国专页 / FRANCE DOSSIER →</a>' : '') +
      '</div>' +
      renderCategoryBars(item) +
      renderRegions(item) +
      renderBottles(item) +
    '</div>';
  }

  function setCountry(country, opts) {
    if (!byCountry[country]) return;
    state.country = country;
    state.region = null;
    var continent = continentFor(country);
    if (continent && state.continent !== "all" && state.continent !== continent.key) {
      state.continent = continent.key;
      renderToolbar();
      renderIndex();
    }
    renderPanel();
    document.querySelectorAll(".atlas-continent").forEach(function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-continent") === (continent ? continent.key : state.continent));
    });
    document.querySelectorAll(".atlas-country").forEach(function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-country") === country);
    });
    document.querySelectorAll("[data-country]").forEach(function (node) {
      var active = node.getAttribute("data-country") === country;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var url = new URL(window.location.href);
    url.searchParams.set("country", country);
    window.history.replaceState(null, "", url.toString());
    if (opts && opts.scroll) {
      var target = document.getElementById("atlasIndex");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setContinent(key) {
    state.continent = key;
    state.country = null;
    state.region = null;
    renderToolbar();
    renderIndex();
    renderPanel();
    document.querySelectorAll(".atlas-continent").forEach(function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-continent") === key);
    });
    document.querySelectorAll(".atlas-country").forEach(function (node) {
      node.classList.remove("is-active");
    });
    var url = new URL(window.location.href);
    url.searchParams.delete("country");
    window.history.replaceState(null, "", url.toString());
    if (key !== "all") {
      var target = document.getElementById("atlasIndex");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function bindEvents() {
    var toolbar = document.getElementById("atlasToolbar");
    if (toolbar) {
      toolbar.addEventListener("click", function (event) {
        var button = event.target.closest("[data-continent-filter]");
        if (button) setContinent(button.getAttribute("data-continent-filter"));
      });
    }

    var index = document.getElementById("countryIndex");
    if (index) {
      index.addEventListener("click", function (event) {
        var button = event.target.closest("[data-country]");
        if (button) setCountry(button.getAttribute("data-country"), { scroll: window.innerWidth < 900 });
      });
    }

    var panel = document.getElementById("atlasPanel");
    if (panel) {
      panel.addEventListener("click", function (event) {
        var regionButton = event.target.closest("[data-region]");
        if (regionButton) {
          state.region = regionButton.getAttribute("data-region") || null;
          renderPanel();
          return;
        }
        var featured = event.target.closest("[data-featured-country]");
        if (featured) {
          setCountry(featured.getAttribute("data-featured-country"), { scroll: window.innerWidth < 900 });
        }
      });
    }

    document.querySelectorAll(".atlas-continent").forEach(function (node) {
      node.addEventListener("click", function () {
        setContinent(node.getAttribute("data-continent"));
      });
      node.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setContinent(node.getAttribute("data-continent"));
        }
      });
    });

    var worldMap = document.querySelector(".atlas-map");
    if (worldMap) {
      worldMap.addEventListener("click", function (event) {
        var countryPath = event.target.closest(".atlas-country[data-country]");
        if (countryPath) setCountry(countryPath.getAttribute("data-country"), { scroll: true });
      });
      worldMap.addEventListener("keydown", function (event) {
        var countryPath = event.target.closest(".atlas-country[data-country]");
        if (countryPath && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          setCountry(countryPath.getAttribute("data-country"), { scroll: true });
        }
      });
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("country");
    if (initial && !byCountry[initial] && COUNTRY_ALIASES[initial]) {
      initial = COUNTRY_ALIASES[initial];
    }
    if (initial && byCountry[initial]) setCountry(initial);
  }

  function init() {
    prepareData();
    renderToolbar();
    renderIndex();
    renderPanel();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
