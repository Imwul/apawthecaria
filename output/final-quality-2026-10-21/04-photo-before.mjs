export default async ({page,fs,out}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('nav .journal-tab--journals').click();
  await page.getByRole('button',{name:/개인 저널 일지/}).click();
  await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).fill('사진 준비 중 저장 QA');
  await page.getByPlaceholder('오늘 만난 이웃, 숲에서 본 것, 길동무와 나눈 이야기를 적어보세요.',{exact:true}).fill('느린 파일 읽기 중에도 이 사진은 같은 일지에 남아야 한다.');
  await page.getByText('사진도 함께 남기기',{exact:true}).click();
  // Controlled latency only: the real native FileReader still reads the original image.
  await page.evaluate(()=>{
    const native=FileReader.prototype.readAsDataURL;
    window.qaRestoreReader=()=>{FileReader.prototype.readAsDataURL=native;};
    FileReader.prototype.readAsDataURL=function(blob){setTimeout(()=>native.call(this,blob),1200);};
  });
  await page.getByLabel('사진 선택',{exact:true}).setInputFiles('output/full-site-qa-2026-10-09/chatty-barter-preview-after.png');
  const submit=page.getByRole('button',{name:'이 기억을 남기기 →',exact:true});
  const result={loadingSubmitEnabled:await submit.isEnabled()};
  await submit.click();
  await page.locator('.journal-editor img').waitFor();
  await page.evaluate(()=>window.qaRestoreReader());
  result.savedPhotoCount=await page.locator('article').filter({has:page.getByRole('heading',{name:'사진 준비 중 저장 QA',exact:true})}).locator('img').count();
  result.unassociatedDraftPhotos=await page.locator('.journal-editor img').count();
  await page.screenshot({path:out+'/photo-pending-save-before.jpg',type:'jpeg',quality:85,fullPage:true});
  console.log(result);
  await fs.writeFile(out+'/photo-pending-before.json',JSON.stringify(result,null,2));

  await page.getByPlaceholder('예: 버섯 그늘에서',{exact:true}).fill('사진 확대 QA');
  await page.getByPlaceholder('오늘 만난 이웃, 숲에서 본 것, 길동무와 나눈 이야기를 적어보세요.',{exact:true}).fill('확대 사진은 Escape와 키보드로 닫을 수 있어야 한다.');
  await submit.click();
  await page.getByTitle('크게 보기',{exact:true}).click();
  result.photoDialogCount=await page.getByRole('dialog').count();
  result.initialFocus=await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,180));
  await page.keyboard.press('Escape');
  result.escapeClosed=await page.getByRole('button',{name:'×',exact:true}).count()===0;
  await page.screenshot({path:out+'/photo-dialog-before.jpg',type:'jpeg',quality:85});
  await fs.writeFile(out+'/photo-before.json',JSON.stringify(result,null,2));
  console.log(result);
  await page.getByRole('button',{name:'×',exact:true}).click();
};
