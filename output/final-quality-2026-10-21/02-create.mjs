export default async ({page, context, fs, out}) => {
  await page.getByPlaceholder('어떤 이름으로 불리나요?',{exact:true}).fill('가을 수첩 QA');
  for(let step=0;step<7;step++) {
    const wizard=page.locator('.character-wizard');
    if(Number(await wizard.getAttribute('data-step'))!==step) throw new Error('Unexpected creation step '+step);
    if(step===3) await wizard.locator('textarea').fill('가을에 들고 나온 약초 수첩');
    else {
      if(step===4) await page.getByPlaceholder('함께 걸을 친구의 이름',{exact:true}).fill('이끼');
      await wizard.getByRole('button',{name:'랜덤 한 장 뽑기',exact:true}).click();
      await wizard.getByRole('button',{name:'랜덤 한 장 뽑기',exact:true}).waitFor();
    }
    if(step===0||step===4) {
      const choices=wizard.locator('.wizard-animal-choices button');
      if(await choices.count()) await choices.first().click();
    }
    await wizard.getByRole('button',{name:/다음 ·/}).click();
  }
  console.log((await page.locator('.character-wizard').innerText()).slice(0,4500));
  console.log(await page.locator('.character-wizard input,.character-wizard textarea,.character-wizard select').evaluateAll(es=>es.map(e=>({tag:e.tagName,placeholder:e.getAttribute('placeholder'),label:e.getAttribute('aria-label')}))));
  await fs.writeFile(out+'/creation-mid-state.json',JSON.stringify(await context.storageState(),null,2));
};
