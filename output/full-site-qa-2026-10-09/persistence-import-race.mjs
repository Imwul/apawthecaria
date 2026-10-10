import { chromium } from '/Users/imwul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const out='output/full-site-qa-2026-10-09';const baseline=await fs.readFile(`${out}/persistence-qa-save.json`,'utf8');
const browser=await chromium.launch({headless:true,executablePath:'/Users/imwul/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(r=>{if(!localStorage.getItem('apawthecaria_rpg_state'))localStorage.setItem('apawthecaria_rpg_state',r)},baseline);
const page=await context.newPage();page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://127.0.0.1:5173/#journals');await page.waitForTimeout(800);
await page.getByLabel('기록 불러오기',{exact:true}).evaluate((input,raw)=>{
 window.qaReaderFinishes=[];
 const originalRead=FileReader.prototype.readAsText;
 FileReader.prototype.readAsText=function(file){this.addEventListener('load',()=>window.qaReaderFinishes.push(file.name));return originalRead.call(this,file)};
 for(const [name,padding] of [['Selected first',10000000],['Selected last',0]]){
   const save=JSON.parse(raw);save.bio.name=name;
   const file=new File([JSON.stringify(save),' '.repeat(padding)],`${name}.json`,{type:'application/json'});
   const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 }
},baseline);
await page.waitForTimeout(2200);
const result=await page.evaluate(()=>({readFinishes:window.qaReaderFinishes,storedName:JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bio.name}));
console.log(JSON.stringify(result));await fs.writeFile(`${out}/persistence-import-race-after.json`,JSON.stringify(result,null,2));await browser.close();
