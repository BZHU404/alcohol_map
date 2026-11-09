import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "screenshots", "redesign");
fs.mkdirSync(path.join(OUT, "desktop"), { recursive: true });
fs.mkdirSync(path.join(OUT, "mobile"), { recursive: true });
fs.mkdirSync(path.join(OUT, "details"), { recursive: true });

const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No page target");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });

let seq = 0;
const pending = new Map();
const events = new Map();
const errors = [];
let current = "";

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const p = pending.get(message.id);
    pending.delete(message.id);
    message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(`[${current}] exception ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(`[${current}] console ${message.params.args.map(a => a.value || a.description || "").join(" ")}`);
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    errors.push(`[${current}] log ${message.params.entry.text}`);
  }
  if (events.has(message.method)) {
    const list = events.get(message.method);
    events.delete(message.method);
    list.forEach(fn => fn(message.params));
  }
});

function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function waitEvent(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const list = events.get(method) || [];
    list.push(resolve);
    events.set(method, list);
    setTimeout(() => {
      const now = events.get(method) || [];
      const i = now.indexOf(resolve);
      if (i >= 0) { now.splice(i, 1); reject(new Error(`timeout ${method}`)); }
    }, timeout);
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function viewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600, screenWidth: width, screenHeight: height });
  await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
}
async function navigate(page, hash = "") {
  current = page + hash;
  const loaded = waitEvent("Page.loadEventFired");
  await send("Page.navigate", { url: pathToFileURL(path.join(ROOT, page)).href + hash });
  try { await loaded; } catch {}
  await wait(520);
}
async function shot(name, opts = {}) {
  let clip = opts.clip;
  if (opts.full) {
    const metrics = await send("Page.getLayoutMetrics");
    const size = metrics.cssContentSize || metrics.contentSize;
    clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 };
  }
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: Boolean(opts.full), ...(clip ? { clip } : {}) });
  const file = path.join(OUT, name + ".png");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(result.data, "base64"));
  console.log("saved", path.relative(ROOT, file));
}
async function infoFor(label) {
  const data = await evaluate(`(() => ({
    label: ${JSON.stringify(label)},
    title: document.title,
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    cards: document.querySelectorAll('.release-card').length,
    rooms: document.querySelectorAll('.room-card').length,
    filters: document.querySelectorAll('#filterControls select').length,
    result: document.getElementById('resultCount')?.innerText.replace(/\\s+/g, ' ').trim() || '',
    drawers: document.querySelectorAll('.page-bottle-art svg, .daily-bottle svg').length,
    h1: document.querySelector('h1')?.innerText.replace(/\\s+/g, ' ').trim() || '',
    dupIds: (() => { const ids = [...document.querySelectorAll('[id]')].map(n=>n.id); return ids.filter((v,i,a)=>a.indexOf(v)!==i); })()
  }))()`);
  if (data.scrollWidth > data.clientWidth + 1) errors.push(`${label}: horizontal overflow ${data.scrollWidth} > ${data.clientWidth}`);
  if (data.dupIds.length) errors.push(`${label}: duplicate ids ${data.dupIds.join(",")}`);
  return data;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await viewport(1440, 1000);

/* -------- Home -------- */
await navigate("index.html");
const home = await infoFor("home desktop");
console.log("home", home);
await shot("desktop/index", { full: true });
await shot("views/desktop-index", { full: false });
const homeCounts = await evaluate(`(() => ({
  bottles: document.querySelector('[data-total-bottles]')?.textContent,
  brands: document.querySelector('[data-total-brands]')?.textContent,
  roomCounts: [...document.querySelectorAll('[data-category-count]')].map(n => n.textContent),
  today: document.querySelector('#todayMount h3')?.innerText,
  roomArts: document.querySelectorAll('.room-art svg').length,
  heroArts: document.querySelectorAll('.cover-cabinet .page-bottle-art svg').length,
  allTotal: window.BOTTLES.length,
  allBrands: new Set(window.BOTTLES.map(b => b.brand)).size
}))()`);
console.log("home counts", homeCounts);
if (homeCounts.bottles !== String(homeCounts.allTotal) || homeCounts.brands !== String(homeCounts.allBrands)) errors.push("home total counts wrong");
const globalCounts = await evaluate(`(() => ({
  cover: document.querySelector('.cover-topline')?.innerText.replace(/\s+/g,' ').trim(),
  foot: document.querySelector('.foot-data')?.innerText.replace(/\s+/g,' ').trim(),
  bottleNodes: [...document.querySelectorAll('[data-total-bottles]')].map(n => n.textContent),
  brandNodes: [...document.querySelectorAll('[data-total-brands]')].map(n => n.textContent)
}))()`);
console.log("global counts", globalCounts);
if (!globalCounts.foot.includes(homeCounts.allTotal + ' BOTTLES') || !globalCounts.foot.includes(homeCounts.allBrands + ' BRANDS')) errors.push("footer global counts not data-driven");
if (homeCounts.roomArts !== 6 || homeCounts.heroArts !== 3) errors.push("home bottle art hydration incomplete");
const structural = await evaluate(`(() => ({
  warnings: (document.body.innerText.match(/理性饮酒/g) || []).length,
  externalAssets: [...document.querySelectorAll('script[src], link[href], img[src]')].map(n => n.getAttribute('src') || n.getAttribute('href')).filter(v => v && /^https?:/i.test(v)),
  navLinks: document.querySelectorAll('.app-nav-link').length,
  healthClaims: /解酒|护肝|养生|保健|治疗/.test(document.body.innerText)
}))()`);
console.log("structure", structural);
if (structural.warnings !== 1) errors.push("expected exactly one footer drinking warning");
if (structural.externalAssets.length) errors.push("external asset dependency found");
if (structural.navLinks !== 7) errors.push("top nav does not contain seven links");
if (structural.healthClaims) errors.push("health claim copy found");

/* -------- Global search -------- */
await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'/', bubbles:true}))");
await wait(250);
const searchOpen = await evaluate(`(() => ({
  open: !document.getElementById('searchLayer').hidden,
  focused: document.activeElement?.id,
  panelFont: getComputedStyle(document.querySelector('.search-panel')).fontFamily
}))()`);
console.log("search open", searchOpen);
if (!searchOpen.open || searchOpen.focused !== "globalSearchInput") errors.push("slash search did not open/focus");
const brandDirectory = await evaluate(`(() => ({
  chips: [...document.querySelectorAll('[data-brand-search]')].map(b => b.innerText.replace(/\s+/g,' ').trim()),
  categories: document.querySelectorAll('.search-category-link').length
}))()`);
console.log("brand directory", brandDirectory.chips.slice(0,8));
if (brandDirectory.chips.length < 5) errors.push("brand directory did not render");
await shot("details/search-brand-index");
await evaluate(`(() => { const b=[...document.querySelectorAll('[data-brand-search]')].find(n => n.getAttribute('data-brand-search')==='尊尼获加'); if (b) b.click(); })()`);
await wait(250);
const johnnieSearch = await evaluate(`(() => ({ query: document.getElementById('globalSearchInput').value, hits: document.querySelectorAll('#searchResults [data-bottle-link]').length, groups: document.querySelectorAll('#searchResults .search-brand-group').length }))()`);
console.log("johnnie brand search", johnnieSearch);
if (johnnieSearch.query !== '尊尼获加' || johnnieSearch.hits !== 5) errors.push("brand chip search for Johnnie Walker failed");
await evaluate(`(() => { const i=document.getElementById('globalSearchInput'); i.value='格兰菲迪'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
await wait(250);
const gfSearch = await evaluate(`(() => ({
  groups: document.querySelectorAll('#searchResults .search-brand-group').length,
  hits: document.querySelectorAll('#searchResults [data-bottle-link]').length,
  summary: document.getElementById('searchSummary').innerText.replace(/\\s+/g,' ').trim()
}))()`);
console.log("gf search", gfSearch);
if (gfSearch.groups !== 1 || gfSearch.hits !== 7) errors.push("GF brand search aggregation failed");
await shot("details/search");
const crossLoaded = waitEvent("Page.loadEventFired");
await evaluate("document.querySelector('#searchResults [data-bottle-link]').click()");
try { await crossLoaded; } catch {}
await wait(600);
const cross = await evaluate(`(() => ({
  file: location.pathname.split('/').pop(), hash: location.hash,
  drawer: !document.getElementById('drawerLayer').hidden,
  title: document.getElementById('drawerTitle')?.innerText,
  active: document.querySelector('.app-nav-link[aria-current="page"]')?.innerText
}))()`);
console.log("cross search", cross);
if (cross.file !== 'spirits.html' || cross.hash !== '#glenfiddich-12' || !cross.drawer) errors.push("cross-page search failed");
await shot("details/drawer-glf12", { full: false });
await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
await wait(450);

/* -------- Wine: filter, pagination, deep link, print -------- */
await navigate("wine.html");
const wine = await infoFor("wine desktop");
console.log("wine", wine);
await shot("desktop/wine", { full: true });
await shot("views/desktop-wine", { full: false });
await evaluate(`(() => { const s=document.querySelector('select[data-filter="subcategory"]'); s.value='红葡萄酒'; s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await wait(250);
const wineFilter = await evaluate(`(() => ({
  cards: document.querySelectorAll('.release-card').length,
  chips: [...document.querySelectorAll('#activeFilterChips .chip')].map(n=>n.innerText.trim()),
  result: document.getElementById('resultCount').innerText.replace(/\\s+/g,' ').trim(),
  redTotal: window.BOTTLES.filter(b => b.category === 'wine' && b.subcategory === '红葡萄酒').length
}))()`);
console.log("wine filter", wineFilter);
if (wineFilter.cards !== Math.min(15, wineFilter.redTotal)) errors.push("wine red filter count mismatch");
await shot("details/wine-filter");
await evaluate("document.getElementById('filterReset').click()");
await wait(200);
await evaluate(`(() => { const i=document.getElementById('localPageSearch'); i.value='拉菲'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
await wait(230);
const local = await evaluate("document.querySelectorAll('.release-card').length");
if (local !== 1) errors.push("wine local search failed");
await evaluate("document.getElementById('localSearchClear').click()");
await wait(150);
await evaluate("document.querySelector('.pager [data-page-target=\"2\"]').click()");
await wait(700);
const page2 = await evaluate(`(() => ({ cards: document.querySelectorAll('.release-card').length, current: document.querySelector('.pager [aria-current="page"]')?.textContent, wineTotal: window.BOTTLES.filter(b => b.category === 'wine').length }))()`);
console.log("wine page2", page2);
if (page2.cards !== Math.min(15, page2.wineTotal - 15) || page2.current !== '2') errors.push("wine pagination failed");
const winePage3 = await evaluate(`(() => { document.querySelector('.pager [data-page-target="3"]')?.click(); return true; })()`);
await wait(520);
const page3 = await evaluate(`(() => ({ cards: document.querySelectorAll('.release-card').length, current: document.querySelector('.pager [aria-current="page"]')?.textContent, wineTotal: window.BOTTLES.filter(b => b.category === 'wine').length }))()`);
console.log("wine page3", page3);
if (page3.cards !== Math.min(15, page3.wineTotal - 30) || page3.current !== '3') errors.push("wine page 3 pagination failed");
await navigate("wine.html", "#lafite-2016");
const drawer = await evaluate(`(() => ({
  open: !document.getElementById('drawerLayer').hidden,
  title: document.getElementById('drawerTitle')?.innerText,
  hasGrape: Boolean(document.querySelector('.grape-card')),
  hasDecant: document.body.innerText.includes('建议醒酒'),
  sections: ['传说','创作提示','常见误用','配餐','适饮温度'].filter(t => document.body.innerText.includes(t)),
  hash: location.hash
}))()`);
console.log("wine drawer", drawer);
if (!drawer.open || !drawer.hasGrape || !drawer.hasDecant) errors.push("wine drawer incomplete");
await shot("details/drawer-wine", { full: false });
await evaluate("window.print=function(){}; document.querySelector('[data-print-bottle]').click();");
await send("Emulation.setEmulatedMedia", { media: "print" });
await wait(180);
const printMeasure = await evaluate(`(() => {
  const label=document.getElementById('printLabel');
  const inner=label.querySelector('.print-inner');
  return { title: label.querySelector('.print-title')?.textContent, label: label.getBoundingClientRect().toJSON(), scroll: inner?.scrollHeight, client: inner?.clientHeight };
})()`);
console.log("print", printMeasure);
if (printMeasure.scroll > printMeasure.client + 2) errors.push("A5 print overflow");
await shot("details/print-a5", { clip: { x: 0, y: 0, width: Math.ceil(printMeasure.label.width), height: Math.ceil(printMeasure.label.height), scale: 1 } });
await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(120);
await evaluate("document.querySelector('.drawer-close').click()");
await wait(430);

/* -------- Remaining categories -------- */
const pageFacts = {};
const filterResults = {};
for (const page of ["beer.html", "spirits.html", "eastern.html", "liqueur.html", "mixed.html"]) {
  await navigate(page);
  const info = await infoFor(page + " desktop");
  pageFacts[page] = info;
  console.log(page, info);
  await shot("desktop/" + page.replace('.html', ''), { full: true });
  await shot("views/desktop-" + page.replace('.html', ''), { full: false });
  const filterSpecs = {
    "beer.html": ["subcategory", "IPA", 1],
    "spirits.html": ["age", "18–24 年", null],
    "eastern.html": ["country", "日本", null],
    "liqueur.html": ["brand", "君度", 1],
    "mixed.html": ["subcategory", "硬苏打", 1]
  };
  const spec = filterSpecs[page];
  if (spec) {
    await evaluate(`(() => { const s=document.querySelector('select[data-filter=${JSON.stringify(spec[0])}]'); s.value=${JSON.stringify(spec[1])}; s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await wait(220);
    const filterResult = await evaluate(`(() => ({ cards: document.querySelectorAll('.release-card').length, chips: document.querySelectorAll('#activeFilterChips .chip').length, resetDisabled: document.getElementById('filterReset').disabled, ageCount: window.BOTTLES.filter(b => b.category === 'spirits' && Number.isFinite(parseInt(b.age, 10)) && parseInt(b.age, 10) >= 18 && parseInt(b.age, 10) < 25).length, japanCount: window.BOTTLES.filter(b => b.category === 'eastern' && b.country === '日本').length }))()`);
    console.log(page + " filter", filterResult);
    filterResults[page] = filterResult;
    const expectedCards = spec[2] === null ? (spec[0] === 'country' ? Math.min(15, filterResult.japanCount) : filterResult.ageCount) : spec[2];
    if (filterResult.cards !== expectedCards || filterResult.chips !== 1 || filterResult.resetDisabled) errors.push(page + ": filter behavior failed");
    await evaluate("document.getElementById('filterReset').click()");
    await wait(180);
  }
  if (page === "spirits.html") {
    await evaluate("document.querySelector('.pager [data-page-target=\"2\"]').click()");
    await wait(650);
    const spiritsPage2 = await evaluate(`(() => ({ cards: document.querySelectorAll('.release-card').length, total: window.BOTTLES.filter(b => b.category === 'spirits').length }))()`);
    console.log("spirits page 2", spiritsPage2);
    if (spiritsPage2.cards !== Math.min(15, spiritsPage2.total - 15)) errors.push("spirits pagination failed");
    await evaluate("document.querySelector('.pager [data-page-target=\"1\"]').click()");
    await wait(600);
  }
  await evaluate("document.querySelector('.release-link').click()");
  await wait(350);
  const open = await evaluate("!document.getElementById('drawerLayer').hidden && Boolean(document.getElementById('drawerTitle'))");
  if (!open) errors.push(page + ": drawer did not open");
  await evaluate("document.querySelector('.drawer-close').click()");
  await wait(420);
}

/* -------- Mobile: screenshots, all seven overflow checks, search, random -------- */
await viewport(390, 844);
const mobile = {};
for (const page of ["index.html", "wine.html", "beer.html", "spirits.html", "eastern.html", "liqueur.html", "mixed.html"]) {
  await navigate(page);
  const info = await infoFor("mobile " + page);
  mobile[page] = info;
  console.log("mobile", page, info);
  await shot("mobile/" + page.replace('.html', ''), { full: true });
  await shot("views/mobile-" + page.replace('.html', ''), { full: false });
}
await navigate("beer.html");
await evaluate("document.querySelector('[data-open-search]').click()");
await wait(300);
await shot("details/search-mobile", { full: false });
await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
await wait(120);
await navigate("index.html");
await evaluate("document.querySelector('[data-random]').click()");
await wait(300);
const randomCard = await evaluate(`(() => ({
  open: !document.getElementById('randomCard').hidden,
  title: document.getElementById('randomCardTitle')?.innerText,
  category: document.getElementById('randomCardCategory')?.innerText,
  reason: document.getElementById('randomCardReason')?.innerText
}))()`);
console.log("random card", randomCard);
if (!randomCard.open || !randomCard.title || !randomCard.category || !randomCard.reason) errors.push("random card did not render");
await evaluate("document.querySelector('[data-random-open]').click()");
await wait(650);
const random = await evaluate(`(() => ({ file: location.pathname.split('/').pop(), hash: location.hash, open: !document.getElementById('drawerLayer').hidden, title: document.getElementById('drawerTitle')?.innerText }))()`);
console.log("random", random);
if (!random.open || !random.hash || random.title !== randomCard.title) errors.push("random bottle did not open");

/* -------- Normal-motion pass: entrance, pointer, reveals, aura -------- */
await send("Emulation.setEmulatedMedia", { media: "screen" });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
await navigate("index.html");
await wait(1300);
const motionHome = await evaluate(`(() => ({
  hasMotion: document.documentElement.classList.contains('has-motion'),
  motes: document.querySelectorAll('.ambient-mote').length,
  veil: getComputedStyle(document.querySelector('.page-veil')).visibility,
  toTop: Boolean(document.getElementById('toTop')),
  shineSpans: document.querySelectorAll('.release-shine').length
}))()`);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 720, y: 420, button: "none", pointerType: "mouse" });
await wait(220);
const pointerVars = await evaluate(`(() => ({
  pointerX: getComputedStyle(document.documentElement).getPropertyValue('--pointer-x').trim(),
  cursorX: getComputedStyle(document.documentElement).getPropertyValue('--cursor-x').trim(),
  hasPointer: document.documentElement.classList.contains('has-pointer')
}))()`);
await evaluate("window.scrollTo(0, 1500)");
await wait(650);
const scrollMotion = await evaluate(`(() => ({
  progress: getComputedStyle(document.querySelector('#scrollProgress span')).transform,
  toTop: document.getElementById('toTop').className,
  revealed: document.querySelectorAll('[data-reveal].is-revealed').length,
  pendingReveal: document.querySelectorAll('[data-reveal]:not(.is-revealed)').length
}))()`);
console.log("motion home", motionHome, pointerVars, scrollMotion);
if (!motionHome.hasMotion || motionHome.motes < 10 || motionHome.veil !== 'hidden') errors.push("home motion layer incomplete");
if (!pointerVars.hasPointer || !pointerVars.pointerX || !pointerVars.cursorX) errors.push("pointer motion variables missing");
if (scrollMotion.toTop.indexOf('is-visible') === -1 || scrollMotion.revealed < 1) errors.push("scroll progress / reveal did not activate");

await navigate("spirits.html");
await wait(1300);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 520, y: 500, button: "none", pointerType: "mouse" });
await wait(220);
const motionSpirits = await evaluate(`(() => ({
  aura: Boolean(document.querySelector('.cursor-aura')),
  auraOpacity: document.querySelector('.cursor-aura') ? getComputedStyle(document.querySelector('.cursor-aura')).opacity : '0',
  pageMotes: document.querySelectorAll('.ambient-mote').length,
  headCount: document.querySelector('.head-context')?.innerText.replace(/\s+/g,' ').trim(),
  footCount: document.querySelector('.foot-data')?.innerText.replace(/\s+/g,' ').trim(),
  total: window.BOTTLES.length,
  brands: new Set(window.BOTTLES.map(b => b.brand)).size,
  spiritsTotal: window.BOTTLES.filter(b => b.category === 'spirits').length
}))()`);
console.log("motion spirits", motionSpirits);
if (!motionSpirits.aura || motionSpirits.auraOpacity === '0') errors.push("dark-page cursor aura missing");
if (!motionSpirits.headCount.includes(String(motionSpirits.spiritsTotal)) || !motionSpirits.footCount.includes(motionSpirits.total + ' BOTTLES') || !motionSpirits.footCount.includes(motionSpirits.brands + ' BRANDS')) errors.push("dynamic category/footer counts wrong");

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ errors, home, homeCounts, globalCounts, structural, searchOpen, brandDirectory, johnnieSearch, gfSearch, cross, wine, wineFilter, filterResults, page2, page3, drawer, printMeasure, pageFacts, mobile, random, motionHome, pointerVars, scrollMotion, motionSpirits }, null, 2));
console.log("\nERRORS", errors.length);
errors.forEach(e => console.log("-", e));
ws.close();
