import assert from 'node:assert/strict';

export default async ({page,fs,out}) => {
  for(const width of [390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.getByRole('button',{name:'장소 검색',exact:true}).click();
    await page.getByLabel('장소 이름 검색',{exact:true}).fill('NOT-A-REAL-PLACE-20261021');
    await page.getByText('해당하는 장소가 없습니다.',{exact:true}).waitFor();
    await page.getByLabel('장소 이름 검색',{exact:true}).fill('Odoak');
    await page.getByRole('button',{name:'Odoak',exact:true}).last().waitFor();
    await page.getByRole('button',{name:'장소 검색',exact:true}).click();
    assert.equal(await page.getByLabel('장소 이름 검색',{exact:true}).count(),0);
    await page.getByRole('button',{name:'겹침 설정',exact:true}).click();
    const check=page.getByRole('dialog',{name:'지도 겹침',exact:true}).getByRole('checkbox').first();
    const checked=await check.isChecked();
    await check.setChecked(!checked);
    assert.equal(await check.isChecked(),!checked);
    await check.setChecked(checked);
    await page.getByRole('button',{name:'겹침 설정',exact:true}).click();
    await page.getByRole('button',{name:'확대',exact:true}).click();
    await page.getByRole('button',{name:'축소',exact:true}).click();
  }
  await fs.writeFile(out+'/map-controls.json',JSON.stringify({widths:[390,768,1440],emptyAndNamedSearch:true,layersRestored:true,zoomInOut:true},null,2));
  await page.locator('nav .journal-tab--journals').click();
  await page.getByLabel('기록 불러오기',{exact:true}).setInputFiles(out+'/prepared-treatment-branch.json');
  await page.getByRole('alertdialog').getByText('세이브 파일을 성공적으로 가져왔습니다.',{exact:true}).waitFor();
  await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  await page.locator('nav .journal-tab--play').click();
  console.log('PREPARED CARE BRANCH', (await page.locator('main').innerText()).slice(0,6500));
  console.log('BUTTONS',await page.locator('main button').evaluateAll(es=>es.filter(el=>el.getClientRects().length>0).map(el=>({name:el.getAttribute('aria-label')||el.textContent?.trim(),disabled:el.disabled})).filter(x=>x.name.length<150)));
};
