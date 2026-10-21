export default async ({page,context,fs,out}) => {
  await page.getByRole('button',{name:'약제사 시트에 저장',exact:true}).click();
  if(await page.getByRole('alertdialog').count()) await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  await page.locator('nav .journal-tab--play').waitFor();
  await page.getByText('기기에 저장됨',{exact:true}).waitFor();
  await fs.writeFile(out+'/created-campaign.json',JSON.stringify(await context.storageState(),null,2));
  const pages=['play','map','bio','reagents','almanack','journals','ailments','patientArchive','livingArchive'];
  const survey=[];
  for(const width of [1440,390,320,1920]) {
    await page.setViewportSize({width,height:1000});
    for(const tab of pages) {
      if(['ailments','patientArchive','livingArchive'].includes(tab)) await page.locator('details.direct-navigation__more').evaluate(el=>{el.open=true;});
      await page.locator('nav .journal-tab--'+tab).click();
      await page.locator('nav .journal-tab--'+tab+'[aria-current="page"]').waitFor();
      await page.evaluate(()=>scrollTo(0,0));
      const metrics=await page.evaluate(()=>{
        const visible=el=>el&&el.getClientRects().length>0;
        const first=Array.from(document.querySelectorAll('main input:not([type=file]),main select,main textarea')).find(visible);
        return {scroll:document.documentElement.scrollWidth,viewport:innerWidth,openingHeight:document.querySelector('.folio-frontispiece')?.getBoundingClientRect().height||0,headingEnd:document.querySelector('.station-heading')?.getBoundingClientRect().bottom||0,firstField:first?.getBoundingClientRect().top||null};
      });
      survey.push({tab,width,...metrics});
      await page.screenshot({path:`${out}/${tab}-${width}-before.jpg`,type:'jpeg',quality:80});
    }
  }
  await fs.writeFile(out+'/survey-before.json',JSON.stringify(survey,null,2));
  console.log(survey);
  console.log('END MAIN', (await page.locator('main').innerText()).slice(0,1500));
};
