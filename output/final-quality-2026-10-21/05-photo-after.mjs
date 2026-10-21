import assert from 'node:assert/strict';

export default async ({page,fs,out}) => {
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('nav .journal-tab--journals').click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:/개인 저널 일지/}).click();
  const title='사진과 함께 남긴 가을 기록 QA';
  await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).fill(title);
  await page.getByPlaceholder('오늘 만난 이웃, 숲에서 본 것, 길동무와 나눈 이야기를 적어보세요.',{exact:true}).fill('사진 읽기가 끝나면 이 기억에 함께 남깁니다. '.repeat(40));
  await page.getByText('사진도 함께 남기기',{exact:true}).click();
  await page.evaluate(()=>{
    const native=FileReader.prototype.readAsDataURL;
    window.qaRestoreReader=()=>{FileReader.prototype.readAsDataURL=native;};
    FileReader.prototype.readAsDataURL=function(blob){setTimeout(()=>native.call(this,blob),1200);};
  });
  await page.getByLabel('사진 선택',{exact:true}).setInputFiles({name:'가을에 남긴 아주 긴 사진 이름 '.repeat(7)+'.png',mimeType:'image/png',buffer:await fs.readFile('output/full-site-qa-2026-10-09/chatty-barter-preview-after.png')});
  const submit=page.locator('.journal-editor button[type=submit]');
  assert.equal(await submit.isDisabled(),true);
  assert.equal(await page.locator('.journal-editor').getAttribute('aria-busy'),'true');
  await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).press('Enter');
  assert.equal(await page.getByRole('heading',{name:title,exact:true}).count(),0);
  await page.screenshot({path:out+'/photo-pending-save-after.jpg',type:'jpeg',quality:85});
  await page.locator('.journal-editor img').waitFor();
  await page.evaluate(()=>window.qaRestoreReader());
  await page.getByRole('button',{name:'이 기억을 남기기 →',exact:true}).click();
  const article=page.locator('article').filter({has:page.getByRole('heading',{name:title,exact:true})});
  assert.equal(await article.locator('img').count(),1);
  assert.equal(await page.locator('.journal-editor img').count(),0);
  await page.waitForFunction(title=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).journals.some(j=>j.title===title&&j.photos?.length===1),title);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/개인 저널 일지/}).click();
  assert.equal(await article.locator('img').count(),1);
  assert.equal(await article.getByText('전체 기억 읽기',{exact:true}).count(),1);
  await article.getByText('전체 기억 읽기',{exact:true}).click();

  const sizes=[];
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    const opener=article.getByTitle('크게 보기',{exact:true});
    await opener.click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});
    await dialog.waitFor();
    assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
    await page.keyboard.press('Tab');
    assert.equal(await dialog.getByRole('button',{name:'확대 사진 닫기',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);
    assert.equal(await page.locator('nav .journal-tab--play').evaluate(el=>Boolean(el.closest('[inert]'))),true);
    const rect=await dialog.boundingBox();
    assert.ok(rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0&&rect.y+rect.height<=1000);
    sizes.push({width,rect});
    await page.screenshot({path:`${out}/photo-dialog-${width}-after.jpg`,type:'jpeg',quality:85});
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(),0);
    assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.locator('[inert]').count(),0);
  }

  await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).fill('실패해도 남는 초안 QA');
  await page.getByPlaceholder('오늘 만난 이웃, 숲에서 본 것, 길동무와 나눈 이야기를 적어보세요.',{exact:true}).fill('읽을 수 없는 파일을 골라도 이 글은 남습니다.');
  await page.getByLabel('사진 선택',{exact:true}).setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  assert.equal(await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).inputValue(),'실패해도 남는 초안 QA');
  assert.equal(await submit.isEnabled(),true);
  await page.locator('nav .journal-tab--reagents').click();
  await page.locator('nav .journal-tab--journals').click();
  assert.equal(await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).inputValue(),'실패해도 남는 초안 QA');
  await fs.writeFile(out+'/photo-after.json',JSON.stringify({delayedReadBlocksSave:true,savedPhotos:1,blankDraftPhotos:0,reloadRetained:true,keyboardFocusAndEscape:true,invalidReadRetainsText:true,draftReturn:true,sizes},null,2));
  console.log('PASS photo readiness, saved association/reload, long content, mobile keyboard modal and failed-read/draft recovery');
};
