import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "screenshots", "redesign");
const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const target = targets.find(t => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",rej,{once:true});});
let id=0; const pending=new Map(); const events=new Map(); const errors=[];
ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==="Runtime.consoleAPICalled"&&m.params.type==="error")errors.push(m.params.args.map(a=>a.value||a.description||"").join(" "));if(events.has(m.method)){const l=events.get(m.method);events.delete(m.method);l.forEach(f=>f(m.params));}});
function send(method,params={}){const n=++id;return new Promise((resolve,reject)=>{pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
function event(method){return new Promise(res=>{const l=events.get(method)||[];l.push(res);events.set(method,l);});}
async function ev(expr){const r=await send("Runtime.evaluate",{expression:expr,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
const loaded=event("Page.loadEventFired");
await send("Page.navigate",{url:pathToFileURL(path.join(ROOT,"wine.html")).href});
try{await loaded;}catch{}
await wait(550);
await ev("window.print=function(){};");
const result=await ev(`(async () => {
  const failures = [];
  const overflows = [];
  let checked = 0;
  const activePage = document.body.dataset.page;
  const duplicateIds = (() => { const ids=[...document.querySelectorAll('[id]')].map(n=>n.id); return ids.filter((v,i,a)=>a.indexOf(v)!==i); })();
  for (const bottle of window.BOTTLES) {
    window.location.hash = '#' + encodeURIComponent(bottle.id);
    for (let tries = 0; tries < 30; tries += 1) {
      if (document.getElementById('drawerTitle')?.textContent?.trim() === bottle.name) break;
      await new Promise(r => setTimeout(r, 10));
    }
    const title = document.getElementById('drawerTitle')?.textContent?.trim();
    const content = document.querySelector('.drawer-content');
    if (!title || title !== bottle.name) failures.push(bottle.id + ': title mismatch');
    if (!content) { failures.push(bottle.id + ': missing content'); continue; }
    if (/undefined|NaN/.test(content.textContent)) failures.push(bottle.id + ': undefined/NaN');
    if (bottle.category === 'wine') {
      const grapes = content.querySelectorAll('.grape-card').length;
      if (grapes !== bottle.grapes.length) failures.push(bottle.id + ': grape cards ' + grapes + '/' + bottle.grapes.length);
    }
    const button = content.querySelector('[data-print-bottle]');
    if (!button) { failures.push(bottle.id + ': missing print button'); continue; }
    button.click();
    await new Promise(r => setTimeout(r, 20));
    const inner = document.querySelector('#printLabel .print-inner');
    if (!inner) { failures.push(bottle.id + ': print empty'); continue; }
    if (inner.scrollHeight > inner.clientHeight + 2) overflows.push({ id: bottle.id, name: bottle.name, scroll: inner.scrollHeight, client: inner.clientHeight });
    if (document.querySelector('#printLabel .print-title')?.textContent?.trim() !== bottle.name) failures.push(bottle.id + ': print title mismatch');
    checked += 1;
  }
  history.replaceState(null, '', location.pathname + location.search);
  document.querySelector('[data-close-drawer]')?.click();
  await new Promise(r => setTimeout(r, 420));
  return { checked, total: window.BOTTLES.length, activePage, failures, overflows, hashAfter: location.hash, drawerOpen: !document.getElementById('drawerLayer').hidden, duplicateIds };
})()`);
// Keep a sample populated for a real A5 PDF.
await ev(`(async()=>{history.replaceState(null,'','#lafite-2016');window.dispatchEvent(new HashChangeEvent('hashchange'));await new Promise(r=>setTimeout(r,30));document.querySelector('[data-print-bottle]')?.click();return true;})()`);
await wait(120);
const pdf = await send("Page.printToPDF",{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,marginTop:0,marginBottom:0,marginLeft:0,marginRight:0});
const pdfPath = path.join(OUT,"lafite-a5-print.pdf");
fs.writeFileSync(pdfPath,Buffer.from(pdf.data,"base64"));
const pdfBuffer=fs.readFileSync(pdfPath);
const pageCount=(pdfBuffer.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
const boxes=[...pdfBuffer.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(m=>[Number(m[1]),Number(m[2])]);
const report = {result,errors,pdf:{path:path.relative(ROOT,pdfPath),bytes:pdfBuffer.length,pageCount,boxes}};
fs.writeFileSync(path.join(OUT,"report-all.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report,null,2));
ws.close();
