import assert from 'node:assert/strict';

export default async ({page,fs,out}) => {
  if(await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  const title='사진과 함께 남긴 가을 기록 QA';
  const article=page.locator('article').filter({has:page.getByRole('heading',{name:title,exact:true})});
  const colors=[];
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    await article.getByTitle('크게 보기',{exact:true}).click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});
    const contrast=await dialog.locator('h2').evaluate(el=>{
      const color=getComputedStyle(el).color;
      const backdrop=getComputedStyle(el.closest('.journal-photo-backdrop')).backgroundColor;
      const fg=color.match(/[\d.]+/g).map(Number);
      const bg=backdrop.match(/[\d.]+/g).map(Number);
      const alpha=bg[3]??1;
      const luminance=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
      const darkestText=luminance(fg),lightestBackdrop=luminance(bg.slice(0,3).map(v=>v*alpha+255*(1-alpha)));
      return {color,ratio:(darkestText+0.05)/(lightestBackdrop+0.05)};
    });
    assert.ok(contrast.ratio>=4.5);
    assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
    await page.screenshot({path:`${out}/photo-dialog-${width}-after.jpg`,type:'jpeg',quality:85});
    colors.push({width,...contrast});
    await page.keyboard.press('Escape');
    assert.equal(await article.getByTitle('크게 보기',{exact:true}).evaluate(el=>el===document.activeElement),true);
  }
  await page.getByText('사진도 함께 남기기',{exact:true}).click();
  await page.getByLabel('사진 선택',{exact:true}).setInputFiles({name:'cancel-this-attachment.png',mimeType:'image/png',buffer:await fs.readFile('output/full-site-qa-2026-10-09/chatty-barter-preview-after.png')});
  await page.locator('.journal-editor img').waitFor();
  await page.locator('nav .journal-tab--reagents').click();
  await page.locator('nav .journal-tab--journals').click();
  assert.equal(await page.locator('.journal-editor img').count(),1);
  await page.getByRole('button',{name:'cancel-this-attachment.png 첨부 취소',exact:true}).click();
  assert.equal(await page.locator('.journal-editor img').count(),0);
  await page.locator('nav .journal-tab--map').click();
  console.log('MAP', (await page.locator('main').innerText()).slice(0,2600));
  console.log('MAP CONTROLS',await page.locator('main input,main select,main button').evaluateAll(es=>es.filter(el=>el.getClientRects().length>0).map(el=>({tag:el.tagName,type:el.type,label:el.getAttribute('aria-label'),text:el.textContent?.slice(0,65),placeholder:el.getAttribute('placeholder')}))));
  await fs.writeFile(out+'/photo-final.json',JSON.stringify({colors,completedPhotoDraftSurvivesNavigation:true,accessibleAttachmentCancel:true},null,2));
};
