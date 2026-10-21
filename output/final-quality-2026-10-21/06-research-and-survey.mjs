import assert from 'node:assert/strict';

export default async ({page,fs,out}) => {
  await page.setViewportSize({width:390,height:1000});
  await page.locator('nav .journal-tab--almanack').click();
  const search=page.getByPlaceholder('이름, 지역, 계절, 약효 또는 p.141',{exact:true});
  const top=(await search.boundingBox()).y;
  assert.ok(top<1000);
  await search.fill('Canvas Tent');
  const entry=page.locator('.almanack-entry').filter({has:page.getByRole('heading',{name:'캔버스 천막',exact:true})});
  await entry.locator('.almanack-entry__open').click();
  await page.getByRole('textbox',{name:/캔버스 천막.*개인 메모/}).fill('검증용 참고: 원문의 무게 2 확인');
  const favorite=entry.locator('.almanack-entry__favorite');
  if(await favorite.getAttribute('aria-pressed')!=='true') await favorite.click();
  await page.reload({waitUntil:'domcontentloaded'});
  await search.fill('Canvas Tent');
  await entry.locator('.almanack-entry__open').click();
  assert.equal(await page.getByRole('textbox',{name:/캔버스 천막.*개인 메모/}).inputValue(),'검증용 참고: 원문의 무게 2 확인');
  assert.equal(await favorite.getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'상세 참조 닫기',exact:true}).click();
  await search.fill('zz-no-record-20261021');
  await page.getByText('맞는 기록을 찾지 못했습니다.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'전체 색인으로 돌아가기',exact:true}).click();
  await page.getByRole('button',{name:/현재 지역·계절/}).click();
  assert.equal(await page.getByRole('button',{name:/현재 지역·계절/}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'전체 색인 보기',exact:true}).click();
  await page.getByRole('button',{name:'오늘의 플레이로 돌아가기',exact:true}).click();
  assert.ok(page.url().endsWith('#play'));
  await page.locator('nav .journal-tab--reagents').click();
  const reagentSearch=page.getByPlaceholder('예: Marigold, 꽃잎, PAIN 2',{exact:true});
  await reagentSearch.fill('Marigold');
  await page.locator('.herbarium-entry').first().getByRole('button').first().click();
  assert.match(await page.locator('main').innerText(),/꽃잎/);
  await reagentSearch.fill('zz-no-herb-20261021');
  console.log('REAGENT EMPTY', (await page.locator('main').innerText()).slice(-700));
  await reagentSearch.fill('');
  await page.getByRole('button',{name:/이 화면의 규칙/}).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement)),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);

  const tabs=['play','map','bio','reagents','almanack','journals','ailments','patientArchive','livingArchive'];
  const survey=[];
  for(const width of [1440,390,320,768,1920]) {
    await page.setViewportSize({width,height:1000});
    for(const tab of tabs) {
      if(['ailments','patientArchive','livingArchive'].includes(tab)) await page.locator('details.direct-navigation__more').evaluate(el=>{el.open=true;});
      await page.locator('nav .journal-tab--'+tab).click();
      await page.locator('nav .journal-tab--'+tab+'[aria-current="page"]').waitFor();
      await page.evaluate(()=>scrollTo(0,0));
      const metrics=await page.evaluate(()=>{
        const first=Array.from(document.querySelectorAll('main input:not([type=file]),main select,main textarea')).find(el=>el.getClientRects().length>0);
        return {scroll:document.documentElement.scrollWidth,viewport:innerWidth,openingHeight:document.querySelector('.folio-frontispiece')?.getBoundingClientRect().height||0,headingEnd:document.querySelector('.station-heading')?.getBoundingClientRect().bottom||0,firstField:first?.getBoundingClientRect().top||null};
      });
      assert.ok(metrics.scroll<=width,tab+'/'+width+' overflows');
      survey.push({tab,width,...metrics});
      await page.screenshot({path:`${out}/${tab}-${width}-after.jpg`,type:'jpeg',quality:80});
    }
  }
  await fs.writeFile(out+'/survey-after.json',JSON.stringify(survey,null,2));
  console.log({screens:survey.length,mobileRuleSearchY:top,desktopReagentSearch:survey.find(row=>row.tab==='reagents'&&row.width===1440),mobileRuleSearch:survey.find(row=>row.tab==='almanack'&&row.width===390)});
};
