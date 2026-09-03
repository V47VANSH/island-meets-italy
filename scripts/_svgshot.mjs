import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const [,,htmlPath,outPng,w='1224',h='792']=process.argv;
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=9270+Math.floor(Math.random()*60);
const c=spawn(CHROME,['--headless=new','--disable-gpu','--remote-debugging-port='+port,
 `--window-size=${w},${h}`,'--user-data-dir='+process.env.TEMP+'/imi-svg-'+port,'about:blank']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pg;for(let i=0;i<80&&!pg;i++){try{pg=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');}catch{} if(!pg)await sleep(250);}
const ws=new WebSocket(pg.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const p=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
const send=(me,pa={})=>new Promise(r=>{const n=++id;p.set(n,r);ws.send(JSON.stringify({id:n,method:me,params:pa}));});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:+w,height:+h,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:pathToFileURL(resolve(htmlPath)).href});
await sleep(7000);
const s=await send('Page.captureScreenshot',{format:'png'});
writeFileSync(outPng,Buffer.from(s.data,'base64'));
console.log(outPng,'written');
ws.close();c.kill();process.exit(0);
