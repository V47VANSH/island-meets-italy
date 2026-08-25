/** Interaction + a11y spot checks: mobile nav, focus visibility, reduced motion. */
import { spawn } from 'node:child_process';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const [,,url='http://localhost:4321/',w='390',h='844',reduced]=process.argv;
const port=9900+Math.floor(Math.random()*90);
const args=['--headless=new','--disable-gpu',`--remote-debugging-port=${port}`,
 `--window-size=${w},${h}`,'--user-data-dir='+process.env.TEMP+'/imi-int-'+port,'about:blank'];
if(reduced==='reduced') args.push('--force-prefers-reduced-motion');
const chrome=spawn(CHROME,args);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let page; for(let i=0;i<60&&!page;i++){try{page=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');}catch{} if(!page)await sleep(250);}
const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const p=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
const send=(method,params={})=>new Promise(res=>{const n=++id;p.set(n,res);ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async(expr)=>{const r=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{${expr}})())`,returnByValue:true,awaitPromise:true});return JSON.parse(r.result.value);};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:+w,height:+h,deviceScaleFactor:1,mobile:+w<700});
await send('Page.navigate',{url}); await sleep(2600);
console.log(JSON.stringify(await evaluate(`
  const out={};
  out.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  out.jsRevealClass=document.documentElement.classList.contains('js-reveal');
  const trig=document.querySelector('.mobile-nav__trigger');
  const panel=document.querySelector('.mobile-nav__panel');
  out.triggerVisible=trig?getComputedStyle(trig.closest('.header__menu')).display!=='none':false;
  if(trig){
    out.beforeOpen={expanded:trig.getAttribute('aria-expanded'),panelHidden:panel.hidden};
    trig.click();
    out.afterOpen={expanded:trig.getAttribute('aria-expanded'),panelHidden:panel.hidden,
      bodyOverflow:document.body.style.overflow,
      focusInPanel:panel.contains(document.activeElement),
      focused:document.activeElement&&document.activeElement.textContent.trim()};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    out.afterEscape={expanded:trig.getAttribute('aria-expanded'),
      focusReturned:document.activeElement===trig, bodyOverflow:document.body.style.overflow};
  }
  // Reveal state: nothing may be left invisible.
  const rev=[...document.querySelectorAll('[data-reveal]')];
  out.revealCount=rev.length;
  out.revealInvisible=rev.filter(e=>getComputedStyle(e).opacity==='0'&&e.getBoundingClientRect().top<window.innerHeight).length;
  return out;
`),null,1));
ws.close(); chrome.kill(); process.exit(0);
