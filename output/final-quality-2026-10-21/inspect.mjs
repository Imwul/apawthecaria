export default async ({page}) => {
  console.log('URL',page.url());
  console.log((await page.locator('main').innerText()).slice(0,5500));
  console.log(await page.locator('main input,main select,main textarea').evaluateAll(es=>es.filter(el=>el.getClientRects().length>0).map(el=>({tag:el.tagName,label:el.getAttribute('aria-label'),placeholder:el.getAttribute('placeholder'),value:el.value}))));
};
