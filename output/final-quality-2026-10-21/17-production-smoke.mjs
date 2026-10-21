import assert from 'node:assert/strict';

export default async ({browser,fs,out}) => {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(45000);
  const pageErrors=[],consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try {
    await page.goto('http://127.0.0.1:4188',{waitUntil:'domcontentloaded'});
    await page.getByLabel('JSON 백업 기록 파일 선택',{exact:true}).setInputFiles(out+'/current-campaign-backup.json');
    await page.getByRole('alertdialog').getByText('가을 수첩 QA 약제사 기록을 가져왔습니다.',{exact:true}).waitFor();
    await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
    const open=async tab=>{
      if(['ailments','patientArchive','livingArchive'].includes(tab)) await page.locator('details.direct-navigation__more').evaluate(el=>{el.open=true;});
      await page.locator('nav .journal-tab--'+tab).click();
      await page.locator('nav .journal-tab--'+tab+'[aria-current="page"]').waitFor();
    };
    const screens=[];
    for(const width of [360,768,1440]) {
      await page.setViewportSize({width,height:1000});
      for(const tab of ['play','map','bio','reagents','almanack','journals','ailments','patientArchive','livingArchive']) {
        await open(tab);
        const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
        assert.ok(dimensions.scroll<=width);
        screens.push({width,tab,...dimensions});
      }
    }
    await open('map');
    const mapContent=page.locator('.paper-map__content');
    await page.getByRole('button',{name:'지도 맞춤',exact:true}).click();
    const initialWidth=await mapContent.evaluate(el=>el.clientWidth);
    await page.getByRole('button',{name:'확대',exact:true}).click();
    assert.ok(await mapContent.evaluate(el=>el.clientWidth)>initialWidth);
    await page.getByRole('button',{name:'축소',exact:true}).click();
    assert.equal(await mapContent.evaluate(el=>el.clientWidth),initialWidth);
    await page.getByRole('button',{name:'장소 검색',exact:true}).click();
    await page.getByLabel('장소 이름 검색',{exact:true}).fill('Odoak');
    await page.locator('.paper-map__search').getByRole('button',{name:/^Odoak/}).click();
    assert.equal(await page.getByRole('button',{name:'Odoak',exact:true}).getAttribute('aria-pressed'),'true');
    await open('bio');
    await page.getByRole('button',{name:/프로필 편집/}).click();
    const name=page.getByLabel('약제사 이름:',{exact:true});
    await name.fill('프로덕션 취소 검증');
    const form=page.locator('main form').filter({has:name});
    await form.getByRole('button',{name:'취소',exact:true}).click();
    await page.getByRole('button',{name:/프로필 편집/}).click();
    assert.equal(await name.inputValue(),'가을 수첩 QA');
    await form.getByRole('button',{name:'취소',exact:true}).click();
    await open('reagents');
    await open('almanack');
    await page.goBack();
    assert.ok(page.url().endsWith('#reagents'));
    await page.goForward();
    assert.ok(page.url().endsWith('#almanack'));
    const search=page.getByPlaceholder('이름, 지역, 계절, 약효 또는 p.141',{exact:true});
    await search.fill('Canvas Tent');
    assert.equal(await page.getByRole('heading',{name:'캔버스 천막',exact:true}).count(),1);
    await open('journals');
    await page.getByRole('button',{name:/개인 저널 일지/}).click();
    const title='사진과 함께 남긴 가을 기록 QA';
    const article=page.locator('article').filter({has:page.getByRole('heading',{name:title,exact:true})});
    await page.setViewportSize({width:360,height:1000});
    await article.getByTitle('크게 보기',{exact:true}).click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});
    assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
    await page.keyboard.press('Tab');
    assert.equal(await dialog.getByRole('button',{name:'확대 사진 닫기',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');
    assert.equal(await article.getByTitle('크게 보기',{exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).journals.find(j=>j.title==='사진과 함께 남긴 가을 기록 QA').photos.length),1);
    assert.deepEqual(pageErrors,[]);
    assert.deepEqual(consoleErrors,[]);
    await fs.writeFile(out+'/production-smoke.json',JSON.stringify({target:'Local production build preview, not external deployment',nativeHeaderImport:true,screens,mapZoomChangesWidthAndReturns:true,mapSearchSelectsActualMarker:true,profileCancel:true,historyBackForward:true,ruleLookup:true,photoKeyboardAndReload:true,pageErrors,consoleErrors},null,2));
    console.log('PASS production build: 27page/width views, real import, profile cancel, browser Back/Forward, lookup, photo modal and reload; zero runtime/console errors');
  } finally {await context.close();}
};
