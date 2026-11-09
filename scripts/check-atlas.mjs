import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screenshots", "atlas");
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const target = targets.find((t) => t.type === "page");
if (!target) throw new Error("No CDP page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
const waiters = new Map();
const errors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const p = pending.get(message.id);
    pending.delete(message.id);
    message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(message.params.exceptionDetails.text + ": " + (message.params.exceptionDetails.exception?.description || ""));
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(message.params.args.map((a) => a.value || a.description || "").join(" "));
  }
  if (waiters.has(message.method)) {
    const list = waiters.get(message.method);
    waiters.delete(message.method);
    list.forEach((fn) => fn(message.params));
  }
});

function send(method, params = {}) {
  const n = ++id;
  return new Promise((resolve, reject) => {
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
function once(method) {
  return new Promise((resolve) => {
    const list = waiters.get(method) || [];
    list.push(resolve);
    waiters.set(method, list);
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setViewport(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile,
    screenWidth: width, screenHeight: height,
  });
}
async function navigate(file, width = 1440, height = 1100, query = "") {
  await setViewport(width, height, width < 700);
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: pathToFileURL(path.join(ROOT, file)).href + query });
  try { await loaded; } catch (_) {}
  await wait(800);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", {
  media: "screen",
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});

const results = {};

await navigate("map.html", 1440, 1100);
results.mapInitial = await evaluate(`(() => ({
  title: document.title,
  scrollWidth: document.documentElement.scrollWidth,
  countryCards: document.querySelectorAll(".country-card").length,
  atlasTotal: document.querySelector("[data-atlas-total]")?.textContent,
  atlasBrands: document.querySelector("[data-atlas-brands]")?.textContent,
  atlasCountries: document.querySelector("[data-atlas-countries]")?.textContent,
  mapContinents: document.querySelectorAll(".atlas-continent").length,
  filterButtons: document.querySelectorAll(".atlas-filter").length
}))()`);

await evaluate(`document.querySelector('[data-country="法国"]').dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
await wait(300);
results.franceSelected = await evaluate(`(() => ({
  heading: document.querySelector("#atlasPanel h2")?.innerText,
  bottleLinks: document.querySelectorAll("#atlasPanel .atlas-bottle").length,
  regionChips: document.querySelectorAll("#atlasPanel .atlas-region").length,
  activeMapCountry: document.querySelector(".atlas-country.is-active")?.getAttribute("data-country"),
  query: location.search,
  dossierHref: document.querySelector(".atlas-france-link")?.getAttribute("href")
}))()`);

await evaluate(`document.querySelector('#atlasPanel [data-region="波尔多 · 波美侯"]').dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
await wait(250);
results.regionSelected = await evaluate(`(() => ({
  bottleLinks: document.querySelectorAll("#atlasPanel .atlas-bottle").length,
  regionActive: document.querySelector("#atlasPanel .atlas-region.is-active")?.getAttribute("data-region")
}))()`);

await evaluate(`document.querySelector('.atlas-filter[data-continent-filter="asia"]').dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
await wait(400);
results.asiaFiltered = await evaluate(`(() => ({
  countryCards: document.querySelectorAll(".country-card").length,
  groups: document.querySelectorAll(".country-group").length,
  activeFilter: document.querySelector(".atlas-filter.is-active")?.textContent.trim()
}))()`);

await navigate("map.html", 1440, 1100, "?country=France");
results.querySelected = await evaluate(`(() => ({
  heading: document.querySelector("#atlasPanel h2")?.innerText,
  bottleLinks: document.querySelectorAll("#atlasPanel .atlas-bottle").length
}))()`);

await navigate("map.html", 768, 1024);
results.mapTablet = await evaluate(`(() => ({ scrollWidth: document.documentElement.scrollWidth, countryCards: document.querySelectorAll(".country-card").length }))()`);

await navigate("map.html", 390, 844);
results.mapMobile = await evaluate(`(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  countryCards: document.querySelectorAll(".country-card").length,
  panelHeading: document.querySelector("#atlasPanel h2")?.innerText
}))()`);

await navigate("france.html", 1440, 1100);
results.france = await evaluate(`(() => ({
  title: document.title,
  scrollWidth: document.documentElement.scrollWidth,
  count: document.querySelector("[data-france-count]")?.textContent,
  categories: [...document.querySelectorAll("[data-france-cat]")].map((n) => n.textContent),
  regionCards: document.querySelectorAll(".region-card").length,
  styleCards: document.querySelectorAll(".style-card").length,
  rotCards: document.querySelectorAll(".rot-card").length,
  mapMarkers: document.querySelectorAll(".france-region-marker").length,
  legendItems: document.querySelectorAll(".region-legend-item").length,
  panelHasCoord: document.querySelector("#regionPanel")?.innerText.includes("44.8°N"),
  panelHasAltitude: document.querySelector("#regionPanel")?.innerText.includes("0–100 m"),
  panelHasRipen: document.querySelector("#regionPanel")?.innerText.includes("9 月中–10 月上")
}))()`);

await evaluate(`document.querySelector('.france-region[data-region="savoie"]').dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
await wait(300);
results.franceRegionSelected = await evaluate(`(() => ({
  panel: document.querySelector("#regionPanel")?.innerText.includes("45.6°N") && document.querySelector("#regionPanel")?.innerText.includes("300–800 m") && document.querySelector("#regionPanel")?.innerText.includes("9 月中–10 月"),
  activeMarker: document.querySelector(".france-region-marker.is-active")?.getAttribute("data-region")
}))()`);

await navigate("france.html", 768, 1024);
results.franceTablet = await evaluate(`(() => ({ scrollWidth: document.documentElement.scrollWidth, count: document.querySelector("[data-france-count]")?.textContent }))()`);

await navigate("france.html", 390, 844);
results.franceMobile = await evaluate(`(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  count: document.querySelector("[data-france-count]")?.textContent
}))()`);

const failures = [];
if (results.mapInitial.countryCards !== 48) failures.push("map country cards");
if (results.mapInitial.atlasTotal !== "606") failures.push("map total");
if (results.mapInitial.scrollWidth !== 1440) failures.push("map desktop overflow");
if (results.franceSelected.bottleLinks !== 83) failures.push("France selection bottles");
if (results.franceSelected.dossierHref !== "france.html") failures.push("France dossier link");
if (results.franceSelected.activeMapCountry !== "法国") failures.push("map country path click");
if (results.regionSelected.bottleLinks !== 1) failures.push("region filter");
if (results.asiaFiltered.countryCards !== 9) failures.push("Asia filter");
if (results.querySelected.bottleLinks !== 83) failures.push("query selection");
if (results.mapTablet.scrollWidth !== 768) failures.push("map tablet overflow");
if (results.mapMobile.scrollWidth !== 390) failures.push("map mobile overflow");
if (results.france.count !== "83" || results.france.regionCards !== 12 || results.france.styleCards !== 6 || results.france.rotCards !== 5) failures.push("France page content");
if (results.france.mapMarkers !== 12 || results.france.legendItems !== 12) failures.push("France map markers / legend");
if (!results.france.panelHasCoord || !results.france.panelHasAltitude || !results.france.panelHasRipen) failures.push("France panel data");
if (!results.franceRegionSelected.panel || results.franceRegionSelected.activeMarker !== "savoie") failures.push("France region selection");
if (results.france.scrollWidth !== 1440) failures.push("France desktop overflow");
if (results.franceTablet.scrollWidth !== 768) failures.push("France tablet overflow");
if (results.franceMobile.scrollWidth !== 390) failures.push("France mobile overflow");

const report = { results, failures, errors };
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
ws.close();
if (failures.length || errors.length) process.exitCode = 1;
