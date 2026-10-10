import { chromium } from '/Users/imwul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out='output/full-site-qa-2026-10-09';const baseline=await fs.readFile(`${out}/persistence-qa-save.json`,'utf8');
const browser=await chromium.launch({headless:true,executablePath:'/Users/imwul/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const results=[];
const add2=async page=>{await page.waitForTimeout(800);const detail=page.locator('details').filter({has:page.getByLabel('장신구 보정값',{exact:true})});if(!await detail.evaluate(e=>e.open))await detail.locator('summary').click();const input=page.getByLabel('장신구 보정값',{exact:true});await input.fill('2');await input.locator('xpath=ancestor::form').getByRole('button',{name:'적용',exact:true}).click();await page.waitForTimeout(1800)};
{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(r=>{if(!localStorage.getItem('apawthecaria_rpg_state'))localStorage.setItem('apawthecaria_rpg_state',r);const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='apawthecaria_rpg_state')throw new DOMException('QA quota failure','QuotaExceededError');return set.call(this,key,value)}},baseline);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/#bio');await add2(page);
 assert.equal(await page.getByText('기기에 저장됨',{exact:true}).isVisible(),true);
 const primaryBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).trinkets.length);assert.equal(primaryBefore,1);
 await page.reload();await page.waitForTimeout(1800);assert.match(await page.locator('body').innerText(),/장신구 3/);assert.deepEqual(errors,[]);
 results.push({check:'injected localStorage quota failure persists +2 in real IndexedDB and restores on refresh',pass:true,primaryRetained:primaryBefore===1,pageErrors:errors});
 await context.close();
}
{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(r=>{if(!localStorage.getItem('apawthecaria_rpg_state'))localStorage.setItem('apawthecaria_rpg_state',r)},baseline);
 const page1=await context.newPage(),page2=await context.newPage();await page1.goto('http://127.0.0.1:5173/#bio');await page2.goto('http://127.0.0.1:5173/#bio');await add2(page1);
 const saved=await page1.evaluate(()=>localStorage.getItem('apawthecaria_rpg_state'));
 // An older tab should refuse to overwrite the shared record after receiving the real StorageEvent.
 const text=await page2.locator('body').innerText();assert.match(text,/다른 탭/);
 const notice=page2.getByRole('button',{name:'확인',exact:true});if(await notice.isVisible())await notice.click();await add2(page2);
 assert.equal(await page2.evaluate(()=>localStorage.getItem('apawthecaria_rpg_state')),saved);
 results.push({check:'real shared-context StorageEvent marks older tab stale and prevents overwrite',pass:true});await context.close();
}
await fs.writeFile(`${out}/persistence-device-boundaries.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
