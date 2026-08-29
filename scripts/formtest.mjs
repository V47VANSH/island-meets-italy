/** Exercises the contact form: preselect, validation, a11y wiring, submit. */
import { spawn } from 'node:child_process';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const base=process.argv[2]??'http://localhost:4321';
const port=9500+Math.floor(Math.random()*80);
const c=spawn(CHROME,['--headless=new','--disable-gpu','--remote-debugging-port='+port,
 '--window-size=1440,900','--user-data-dir='+process.env.TEMP+'/imi-form-'+port,'about:blank']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pg;for(let i=0;i<60&&!pg;i++){try{pg=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');}catch{} if(!pg)await sleep(250);}
const ws=new WebSocket(pg.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const p=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m.result);p.delete(m.id);}};
const send=(me,pa={})=>new Promise(r=>{const n=++id;p.set(n,r);ws.send(JSON.stringify({id:n,method:me,params:pa}));});
const ev=async(x)=>{const r=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{${x}})())`,returnByValue:true,awaitPromise:true});return JSON.parse(r.result.value);};
const evAsync=async(x)=>{const r=await send('Runtime.evaluate',{expression:`(async()=>{${x}})().then(v=>JSON.stringify(v))`,returnByValue:true,awaitPromise:true});return JSON.parse(r.result.value);};
await send('Page.enable');await send('Runtime.enable');

console.log('--- ?type=media preselect ---');
await send('Page.navigate',{url:base+'/contact?type=media'});await sleep(2600);
console.log(await ev(`const s=document.querySelector('#contact-type');return {selected:s.value};`));

console.log('\n--- empty submit: validation + a11y ---');
console.log(await ev(`
 document.querySelector('[data-contact-form]').requestSubmit();
 const f=(n)=>document.querySelector('[name="'+n+'"]');
 return {
  nameInvalid: f('name').getAttribute('aria-invalid'),
  nameDescribedBy: f('name').getAttribute('aria-describedby'),
  nameError: document.querySelector('[data-error-for=name]').textContent,
  emailError: document.querySelector('[data-error-for=email]').textContent,
  messageError: document.querySelector('[data-error-for=message]').textContent,
  summary: document.querySelector('[data-form-summary]').textContent,
  focused: document.activeElement && document.activeElement.name,
 };`));

console.log('\n--- bad email ---');
console.log(await ev(`
 const e=document.querySelector('[name=email]'); e.value='kenton@'; e.dispatchEvent(new Event('blur'));
 return {error:document.querySelector('[data-error-for=email]').textContent};`));

console.log('\n--- valid submit (dev: logs, returns success) ---');
console.log(await evAsync(`
 document.querySelector('[name=name]').value='Raj Goyal';
 document.querySelector('[name=email]').value='raj@example.com';
 document.querySelector('[name=message]').value='Interested in a feature on Island Meets Italy.';
 document.querySelector('[data-contact-form]').requestSubmit();
 await new Promise(r=>setTimeout(r,1800));
 return {
  formHidden: document.querySelector('[data-contact-form]').hidden,
  successShown: !document.querySelector('[data-form-success]').hidden,
  successRole: document.querySelector('[data-form-success]').getAttribute('role'),
  stillOnContact: location.pathname,
 };`));

console.log('\n--- honeypot: filled trap is accepted silently, nothing sent ---');
console.log(await evAsync(`
 const r=await fetch('/api/contact',{method:'POST',body:new URLSearchParams({
   name:'Bot',email:'bot@spam.test',inquiryType:'General Inquiry',message:'x',company:'AcmeBots'})});
 return {status:r.status, body:await r.json()};`));

ws.close();c.kill();process.exit(0);
