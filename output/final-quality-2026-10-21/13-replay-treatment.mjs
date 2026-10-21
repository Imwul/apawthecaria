import prepare from './10-treatment.mjs';
import complete from './12-treatment-complete.mjs';

export default async (args) => {
  const {page,out}=args;
  if(await page.getByRole('alertdialog').count()) await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  await page.locator('nav .journal-tab--journals').click();
  await page.getByLabel('기록 불러오기',{exact:true}).setInputFiles(out+'/prepared-treatment-branch.json');
  await page.getByRole('alertdialog').getByText('세이브 파일을 성공적으로 가져왔습니다.',{exact:true}).waitFor();
  await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  await page.locator('nav .journal-tab--play').click();
  await prepare(args);
  await complete(args);
};
