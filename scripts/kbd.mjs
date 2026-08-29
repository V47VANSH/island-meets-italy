/** Keyboard pass: visible focus ring everywhere, nav overlay traps and returns. */
import { spawn } from 'node:child_process';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.argv[2]??'http://localhost:4321';
const routes=['/','/about','/cookbook','/gallery','/media','/contact'];
const port=9350+Math.floor(Math.random()*80);
const c=spawn(CHROME,['--headless=new','--disable-gpu','--remote-debugging-port='+port,
 '--window-size=1440,900','--user-data-dir='+process.env.TEMP+'/imi-kbd-'+port,'about:blank']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pg;for(let i=0;i<60&&!pg;i++){try{pg=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');}catch{} if(!pg)await sleep(250);}
const ws=new WebSocket(pg.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const p=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
const send=(me,pa={})=>new Promise(r=>{const n=++id;p.set(n,r);ws.send(JSON.stringify({id:n,method:me,params:pa}));});
const ev=async(x)=>{const r=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{${x}})())`,returnByValue:true});return JSON.parse(r.result.value);};
await send('Page.enable');await send('Runtime.enable');

const tab = async () => {
  // A real Tab press. Programmatic .focus() does not satisfy :focus-visible in
  // Chrome, so scripting the focus would report a false negative on every link.
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',windowsVirtualKeyCode:9,key:'Tab',code:'Tab'});
  await send('Input.dispatchKeyEvent',{type:'char',text:'	'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',windowsVirtualKeyCode:9,key:'Tab',code:'Tab'});
  await sleep(45);
};

for(const route of routes){
  await send('Page.navigate',{url:base+route});await sleep(2200);
  await ev(`document.body.focus(); return 1;`);

  const seen=[]; const bad=[];
  for(let i=0;i<40;i++){
    await tab();
    const r=await ev(`
      const el=document.activeElement;
      if(!el||el===document.body) return null;
      const cs=getComputedStyle(el);
      const ring=(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||cs.boxShadow!=='none';
      return {tag:el.tagName.toLowerCase(),
        cls:((el.className||'').toString().trim().split(/\s+/)[0]||''),
        visible:!!(el.offsetParent||el.getClientRects().length),
        focusVisible: el.matches(':focus-visible'), ring,
        outline: cs.outlineWidth+' '+cs.outlineStyle+' '+cs.outlineColor};
    `);
    if(!r) break;
    const key=r.tag+'.'+r.cls;
    if(seen.includes(key)&&seen.length>6) break;
    seen.push(key);
    if(r.visible && r.focusVisible && !r.ring) bad.push(key+' ('+r.outline+')');
  }
  console.log(route.padEnd(10),'tabbed:'+String(seen.length).padEnd(4),
    bad.length? ('NO RING: '+[...new Set(bad)].join(', ')) : 'every tab stop shows a gold ring');
}

// Mobile nav focus trap
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:base+'/'});await sleep(2400);
console.log('\nmobile nav:', await ev(`
  const t=document.querySelector('.mobile-nav__trigger');
  const panel=document.querySelector('.mobile-nav__panel');
  t.click();
  const openState={expanded:t.getAttribute('aria-expanded'), focusInPanel:panel.contains(document.activeElement),
    scrollLocked:document.body.style.overflow==='hidden'};
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  return {...openState, afterEscape:{expanded:t.getAttribute('aria-expanded'), focusReturned:document.activeElement===t}};
`));
ws.close();c.kill();process.exit(0);
