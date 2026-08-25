/** Verifies the persisted header updates its state across client-side routes. */
import { spawn } from 'node:child_process';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.argv[2]??'http://localhost:4321';
const port=9600+Math.floor(Math.random()*90);
const chrome=spawn(CHROME,['--headless=new','--disable-gpu',`--remote-debugging-port=${port}`,
 '--window-size=1440,900','--user-data-dir='+process.env.TEMP+'/imi-nav-'+port,'about:blank']);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let page; for(let i=0;i<60&&!page;i++){try{page=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');}catch{} if(!page)await sleep(250);}
const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const p=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
const send=(m,pr={})=>new Promise(res=>{const n=++id;p.set(n,res);ws.send(JSON.stringify({id:n,method:m,params:pr}));});
const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{${expr}})())`,returnByValue:true,awaitPromise:true});return JSON.parse(r.result.value);};

await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate',{url:base+'/'}); await sleep(2800);

const state=async(label)=>{
  const s=await ev(`const h=document.querySelector('[data-header]');
    return {where:location.pathname, solid:h.hasAttribute('data-solid'),
      bg:getComputedStyle(h).backgroundColor,
      current:[...document.querySelectorAll('.header__link[aria-current]')].map(a=>a.textContent.trim())};`);
  console.log(label.padEnd(34), JSON.stringify(s));
  return s;
};

await state('1. fresh load /');
// Client-side navigate via the persisted header's own link.
await ev(`document.querySelector('.header__link[href="/about"]').click(); return 1;`);
await sleep(1600);
await state('2. client-side -> /about');
await ev(`document.querySelector('.header__link[href="/"]').click(); return 1;`);
await sleep(1600);
await state('3. client-side back -> /');
await ev(`document.querySelector('.header__link[href="/gallery"]').click(); return 1;`);
await sleep(1600);
await state('4. client-side -> /gallery');

ws.close(); chrome.kill(); process.exit(0);
