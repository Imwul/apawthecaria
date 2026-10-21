import assert from 'node:assert/strict';
import create from './02-create.mjs';

export default async ({browser,fs,out}) => {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(45000);
  const pageErrors=[],consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try {
    await page.goto('http://127.0.0.1:5178',{waitUntil:'domcontentloaded'});
    const input=page.getByPlaceholder('어떤 이름으로 불리나요?',{exact:true});
    await input.waitFor();
    const inputY=(await input.boundingBox()).y;
    await page.screenshot({path:out+'/onboarding-desktop-after.png',fullPage:true});
    const widths=[];
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:1000});
      const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
      assert.ok(dimensions.scroll<=width);
      widths.push(dimensions);
      await page.screenshot({path:`${out}/onboarding-${width}-after.jpg`,type:'jpeg',quality:85,fullPage:true});
    }
    await create({page,context,fs,out});
    await page.getByRole('button',{name:'약제사 시트에 저장',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bio.name==='가을 수첩 QA');
    await page.locator('nav .journal-tab--play').waitFor();
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bio.name),'가을 수첩 QA');
    assert.deepEqual(pageErrors,[]);
    assert.deepEqual(consoleErrors,[]);
    await fs.writeFile(out+'/fresh-onboarding-after.json',JSON.stringify({allEightStepsCompleted:true,inputY,widths,reloadRetainsCharacter:true,pageErrors,consoleErrors},null,2));
    console.log('PASS fresh eight-step creation at320px, save, reload; desktop name input y='+inputY);
  } finally {await context.close();}
};
