export default async ({page,fs,out}) => {
  await page.locator('nav .journal-tab--bio').click();
  if(await page.getByRole('button',{name:/프로필 편집/}).count()) await page.getByRole('button',{name:/프로필 편집/}).click();
  const name=page.getByLabel('약제사 이름:',{exact:true});
  const storedName=await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bio.name);
  await name.fill('취소되어야 하는 편집 QA');
  await page.locator('main form').filter({has:page.getByRole('heading',{name:/약제사 프로필 수정/})}).getByRole('button',{name:'취소',exact:true}).click();
  await page.getByRole('button',{name:/프로필 편집/}).click();
  const reopened=await name.inputValue();
  await fs.writeFile(out+'/profile-cancel-before.json',JSON.stringify({storedName,reopened,cancelledDraftDiscarded:reopened===storedName},null,2));
  console.log({storedName,reopened});
};
