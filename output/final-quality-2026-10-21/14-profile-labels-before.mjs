export default async ({page,fs,out}) => {
  await page.locator('nav .journal-tab--bio').click();
  await page.getByRole('button',{name:/프로필 편집/}).click();
  const labels=await page.locator('main form label').evaluateAll(es=>es.map(el=>({text:el.textContent.trim(),control:el.control?.tagName||null})));
  await fs.writeFile(out+'/profile-labels-before.json',JSON.stringify(labels,null,2));
  console.log(labels);
};
