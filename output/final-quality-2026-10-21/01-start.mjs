export default async ({page, out}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:5178',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'랜덤 한 장 뽑기',exact:true}).first().waitFor({timeout:30000});
  console.log((await page.locator('body').innerText()).slice(0,7000));
  console.log(await page.locator('input,textarea,select').evaluateAll(elements => elements.map(el => ({tag:el.tagName,type:el.type,label:el.getAttribute('aria-label'),placeholder:el.getAttribute('placeholder')}))));
  await page.screenshot({path:out+'/onboarding-desktop-before.png',fullPage:true});
};
