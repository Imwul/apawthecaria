import assert from 'node:assert/strict';

export default async ({page,fs,out}) => {
  await page.setViewportSize({width:390,height:1000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')));
  assert.equal(before.patients.find(p=>p.id===before.activePatientId).status,'active');
  const finish=page.getByRole('button',{name:'치료제 완성',exact:true});
  assert.equal(await finish.isDisabled(),true);
  await page.getByRole('checkbox',{name:/Beetles/}).check();
  await page.getByRole('checkbox',{name:/Marigold/}).check();
  assert.equal(await finish.isDisabled(),true);
  await page.getByRole('checkbox',{name:/^나무 절구와 공이/}).check();
  assert.equal(await finish.isEnabled(),true);
  await page.screenshot({path:out+'/treatment-mobile-ready.jpg',type:'jpeg',quality:85});
  await finish.click();
  await page.getByRole('dialog').waitFor();
  console.log('TREATMENT PROMPT',await page.getByRole('dialog').innerText());
  console.log('PROMPT BUTTONS',await page.getByRole('dialog').getByRole('button').allTextContents());
  await fs.writeFile(out+'/treatment-before.json',JSON.stringify({activePatientId:before.activePatientId,bag:before.bag,trinkets:before.trinkets,reputation:before.reputation},null,2));
};
