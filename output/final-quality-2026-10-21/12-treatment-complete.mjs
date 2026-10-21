import assert from 'node:assert/strict';

export default async ({page,context,fs,out}) => {
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')));
  await page.getByRole('dialog').getByRole('button',{name:'취소',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bag),before.bag);
  assert.equal(await page.getByRole('checkbox',{name:/Beetles/}).isChecked(),true);
  await page.locator('nav .journal-tab--almanack').click();
  await page.getByRole('button',{name:'오늘의 플레이로 돌아가기',exact:true}).click();
  assert.equal(await page.getByRole('checkbox',{name:/Beetles/}).isChecked(),true);
  await page.getByRole('button',{name:'치료제 완성',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox',{name:'기록',exact:true}).fill('가을 품질 검사: 딱정벌레 껍질과 금잔화 꽃잎을 절구에 빻아 치료했다.');
  await page.getByRole('dialog').getByRole('button',{name:'선택 확정',exact:true}).click();
  await page.getByRole('button',{name:/^Trading/}).waitFor();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).bag),before.bag);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/^Trading/}).click();
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).patients.find(p=>p.id===id)?.status==='cured',before.activePatientId);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')));
  const remaining=after.bag.filter(i=>i.canonicalReagentId==='reagent-beetles'||i.canonicalReagentId==='reagent-marigold');
  assert.equal(remaining.length,0);
  // Original printed p.36: +1 Trinket per Severity level. Lesser=1, FAIR/FOUL=0 here.
  assert.equal(after.trinkets.length-before.trinkets.length,1);
  assert.equal(after.reputation-before.reputation,1);
  if(await page.getByRole('alertdialog').count()) await page.getByRole('alertdialog').getByRole('button',{name:'확인',exact:true}).click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apawthecaria_rpg_state')).trinkets.length),after.trinkets.length);
  await page.locator('nav .journal-tab--journals').click();
  await page.getByRole('button',{name:/진료 기록 \(1\)/}).click();
  assert.match(await page.locator('main').innerText(),/QA 환자/);
  await context.storageState({path:out+'/treated-campaign-state.json'});
  await page.screenshot({path:out+'/treatment-mobile-complete.jpg',type:'jpeg',quality:85});
  await fs.writeFile(out+'/treatment-result.json',JSON.stringify({branch:'Prepared saved patient imported via actual UI; not new-character continuous run',recordCancelPreservesBagAndDraft:true,referenceReturnKeepsDraft:true,rewardCheckpointSurvivesReload:true,reagentsConsumedOnce:true,trinketsBefore:before.trinkets.length,trinketsAfter:after.trinkets.length,patientStatus:'cured',journalRecordVisible:true},null,2));
  console.log('PASS treatment cancellation, reference roundtrip, reload/reward checkpoint, ingredient consumption, printed p.36 +1Trading/+1Reputation and casebook');
};
