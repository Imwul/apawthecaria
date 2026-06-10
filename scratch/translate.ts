import fs from 'fs';
import { GAME_DATA } from '../src/gameData.ts';

// 1. AILMENTS TRANSLATION MAP (Cleaned keys without page numbers)
const ailmentsMap: Record<string, { name: string; description: string; outcome: string; consequence: string }> = {
  "Paw Rot": {
    name: "발썩음 병",
    description: "축축한 흙 위를 며칠이고 걸어 다닌 탓에, 이 야수의 발가락 사이 막이 가렵고 부어올랐습니다. 몇 주 동안 매일 정기적으로 무언가를 발라주면 나을 것입니다...",
    outcome: "티 없이 깨끗하게: 만약 치료제가 보존된다면 - 이 오래 지속되는 연고 덕분에 이 감염병이 다시 발생했을 때 확실하게 치료할 수 있습니다. 다음번에 이 지역을 지날 때, 고마워하는 환자로부터 장신구 1개를 얻습니다.",
    consequence: "짓밟힌 발: 그 자체로는 사소한 문제일 수 있지만, 이 야수는 꽤나 인기가 많습니다. 그가 또 누구에게 발썩음 병을 옮겼을까요? 다음번에 이 지역을 방문할 때 치료할 수 있는 유일한 질병은 발썩음 병뿐입니다."
  },
  "Anxious Scratching": {
    name: "불안성 가려움증",
    description: "지속적이고 가벼운 스트레스로 인해 이 야수는 지쳐버렸습니다. 털이나 깃털이 걷잡을 수 없이 빠지기 시작했습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "털 없는 신세: 야수가 완전히 털갈이를 해버립니다. 이제 그들은 어떤 신체적, 사회적 압박에 직면하게 될까요?"
  },
  "Bad Idea": {
    name: "잘못된 아이디어",
    description: "발명은 브리슬리 숲의 많은 야수들에게 중요한 취미이지만, 모든 아이디어가 좋거나 안전한 것은 아닙니다. 이 가여운 야수가 방금 깨달은 것처럼 말이죠. 치료와 기분 전환이 필요합니다. 그들의 발명품은 무엇이었고, 어떻게 다치게 되었나요? 당신의 치료제에 [독/악취] 성분이 들어가선 안 됩니다. 환자를 더 화나게 할 뿐이니까요.",
    outcome: "영감: 만약 약효(3) 영약재로 이 질병을 해결한다면; 발명가는 크게 기뻐하며 당신의 기존 도구를 개조해주겠다고 제안합니다. 기본 도구 중 하나를 업그레이드하거나, 도구의 무게를 1/3 줄이세요.",
    consequence: "포기: 발명 실패에 낙담한 그들은 열정을 잃고 발명을 완전히 포기합니다. 그들이 버려둔 청사진은 어떻게 될까요?"
  },
  "Blocked Ears": {
    name: "먹먹한 귀",
    description: "네? 뭐라고요? 다시 말씀해주셔야겠어요. 급성 열병을 앓고 난 뒤 이 가여운 야수의 귀가 딱딱한 귀지로 꽉 막혀버렸습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "조용한 최후: 갑작스러운 감각 상실로 방향 감각을 잃은 이 가여운 야수는 포식자의 쉬운 먹잇감이 됩니다. 결국 그들을 덮친 것은 무엇이었을까요?"
  },
  "Bloodthirst": {
    name: "흡혈 본능",
    description: "이 야수에게 끔찍한 굶주림이 깨어났습니다. 정신을 흐리게 만드는 무언가를 먹은 탓에, 고대의 본능이 사냥을 하라고 속삭입니다. 시간이 갈수록 저항하기가 힘들어집니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "야성의 발현: 본능의 안개 속에서 길을 잃은 그들은 결국 사냥을 시작합니다. 누군가를 덮쳤을까요? 아니면 누군가 그들을 저지했을까요?"
  },
  "Brand Care": {
    name: "낙인 상처",
    description: "한 야수가 길드 중 하나에 의해 위험한 범죄자로 낙인찍혀 집에서 쫓겨났습니다. 드러나고 물집이 잡힌 둥근 낙인 자국이 감염되었습니다.",
    outcome: "동정심: 만약 이 야수를 치료하려 시도한다면; 추방된 무리와 어울렸다는 이유로 명성 2를 잃습니다. 이 야수의 사연은 무엇일까요? 왜 낙인이 찍혔을까요? 서둘러 챙겨 나온 소지품 중에서 그가 건넨 장신구는 무엇인가요?\n의무: 치료를 거부한다면; 길드 법을 수호한 공로로 명성 2를 얻습니다. 낙인찍힌 야수는 열병에 신음하며 야생으로 도망칩니다. 이에 대해 어떻게 느끼시나요?",
    consequence: "조용한 흐름: 이 질병을 치료하지 못해도 머무는 시간이 초과(Overstay)되지는 않습니다."
  },
  "Broken Beaks and Thinning Fangs": {
    name: "부러진 부리와 닳은 송곳니",
    description: "충돌, 빗나간 쪼기, 혹은 싸움으로 인해 이 가여운 야수의 부리나 이빨이 부러졌습니다. 그들은 끊임없는 통증에 시달리며 음식을 먹기 위해 분투하고 있습니다.",
    outcome: "송곳니 제작자 길드: 은 조각(Silver Shards)을 찾을 수 있다면, 환자를 위해 인공 의치나 왕관을 만들어 줄 수 있습니다. 그렇게 하면 명성 3을 추가로 얻습니다.",
    consequence: "복합적인 문제: 스트레스와 영양 부족으로 인해 이 가여운 새는 다른 질병에 걸리고 맙니다. 명성 3을 잃습니다. 하루를 더 소모(Mark 1 Day)하고 질병을 하나 더 뽑아 계속 도울 수도 있으며, 그러지 않으면 환자는 목숨을 잃습니다."
  },
  "Crestfallen": {
    name: "낙담한 깃털",
    description: "모든 조류가 자신의 깃털 색에 만족하는 것은 아닙니다. 일부는 더 대담한 색을 원하거나, 포식자의 예리한 눈을 피해 자신을 위장하고 싶어 합니다. (필요 약효: [깃털 2, 기쁨 2 및 밝은 색상의 식물 영약재])",
    outcome: "성공 보상 장신구 획득",
    consequence: "염색 실패: 환자가 스스로 깃털을 염색하려 시도하다가 처참하게 망쳐버립니다. 그리고 그 탓을 당신에게 돌립니다!"
  },
  "Dullsweats": {
    name: "식은땀",
    description: "세상과 단절된 채 땀에 젖은 이불 속에서 너무 오랜 시간을 보낸 야수입니다. 코를 뚫어주고, 눈을 맑게 해주며, 기분을 고조시켜 줄 무언가를 원하고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "기회의 창이 닫힘: 치료 기회가 지나가고, 우울증이 다시 이 야수를 어두운 굴속으로 끌어들입니다. 자취를 감춘 친구를 그리워하는 이는 누구일까요?"
  },
  "Fight Marks": {
    name: "싸움 흔적",
    description: "자존심, 탐욕, 두려움 또는 이 모든 것이 결합되어 지역의 두 야수가 서로 격렬하게 싸워 큰 상처을 입혔습니다. 이것은 별도의 타이머를 가진 두 개의 질병으로 취급합니다. 한 야수가 싸움을 시작했지만, 두 야수 모두 누가 먼저 시작했는지 인정하려 하지 않습니다. 이 야수들이 누구인지, 그리고 누구를 먼저 치료할 것인지 저널에 기록하세요.",
    outcome: "화해: 두 환자를 모두 치료하고 [기쁨 3] 영약재를 채집해 제공한다면; 치료 과정에서 두 환자 모두 마음을 열게 됩니다. 당신의 도움으로 그들은 대화를 나눕니다. 서로 공동의 이해에 도달할 수 있을까요?",
    consequence: "해결되지 못한 비극: 한 야수를 치료하지 못하면 상처가 악화되어 저편으로 떠나버리고, 싸움은 해결되지 못한 채 남습니다. 두 야수 모두 사망하면 명성을 두 번 잃습니다."
  },
  "Firstfever": {
    name: "첫 열병",
    description: "많은 새끼 동물들이 겪는 가벼운 질병입니다. 이 열병을 이겨내면 나중에 걸릴 수 있는 더 위험한 수많은 열병에 대한 면역력을 얻게 됩니다. 많은 부모들이 집단 면역을 기르기 위해 '열병 파티'를 엽니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "가려운 반점: 가렵고 붉은 반점이 이 어린 새끼들을 괴롭히며, 무슨 짓을 해도 울음을 그치지 않습니다. 부모들의 잠 못 드는 밤에 대해 저널을 작성하세요."
  },
  "Fond Farewell": {
    name: "애틋한 작별",
    description: "비극이 닥쳐 사랑받던 반려동물이 저편으로 떠났습니다. 이 야수는 반려동물을 제대로 보내줄 수 있도록 당신의 도움을 간절히 바라고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "잊혀진 존재: 친구의 떠남을 기리는 의식이 제대로 치러지지 못해 어두운 감정이 환자를 사로잡습니다. 그들은 이 슬픔을 어떻게 극복할까요?"
  },
  "Forager's Twitch": {
    name: "채집가의 경련 (Forager's Twitch)",
    description: "이 어리석은 야수가 이상한 버섯을 먹었습니다. 그 바람에 보이지 않는 것을 보게 되고 환각과 그림자에 깜짝깜짝 놀랍니다. 카드 한 장을 뽑아 그가 어떤 경험을 하고 있는지 확인하세요:\n♥ 또는 ♦: 좋은 환각 - 얌전히 제자리에 머물며 말썽을 피우지 않습니다.\n♣ 또는 ♠: 나쁜 환각 - 이 질병의 요구 사항에 [상처 1]을 추가합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "환각의 끝: 환각에서 깨어난 그들은 당황스럽고 변해버린 자신을 느깁니다. 그들이 나누는 심오한 지혜나 말도 안 되는 헛소리는 무엇인가요?"
  },
  "Forge Clawed": {
    name: "대장간 불꽃 부상 (Forge Clawed)",
    description: "뜨거운 금속을 직접 다루다 다쳤거나 그저 잘못된 시간에 잘못된 장소에 있었던 탓에, 이 야수는 뜨거운 불꽃을 온몸에 뒤집어썼습니다. 모피 위로 성난 화상 자국들이 가득하고 가죽이 노출되어 있습니다. 간단한 연고 처치면 충분할 것입니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "차가운 외면: 야수가 당신의 보살핌을 거절하고 화상을 방치한 채 가버립니다. 당신이 없는 사이 상처가 감염되고 진물이 흐르며 흉터가 남을 수도 있습니다."
  },
  "Foul Deceiver": {
    name: "치명적인 속임수 버섯",
    description: "지역 공동체의 중요한 일원이 열정적인 새끼 동물이 가져다준 맛있는 버섯을 먹고 중독되었습니다. 환자는 그것이 무해하고 좋은 버섯인 줄 알았습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "마지막 식사: 제때 치료하지 못하면 환자는 독으로 인해 사망합니다. 그가 없어져 공동체는 어떤 슬픔과 결핍을 겪게 될까요?"
  },
  "Groundhog Syndrome": {
    name: "땅다람쥐 신드롬 (조기 동면)",
    description: "계절에 맞지 않는 급격한 기온 변화로 인해 이 야수들의 본능이 깨어나, 판단력이 흐려진 채 너무 일찍 겨울잠에 들어가기 시작했습니다. 이 질병에는 당신이 치료해야 할 세 명의 환자가 있으며, 패닉을 진정시켜야 합니다. 이 질병의 실패 결과는 계절에 따라 달라집니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "봄 또는 여름: 공포가 퍼져 가장 가까운 정착지가 조기에 동면에 들어갑니다. 다음 계절이 끝날 때까지 이 정착지 혹은 가장 가까운 정착지에서 거래나 사교 행사를 할 수 없습니다. 깨어 있는 야수들이 일을 메우느라 너무 바쁘기 때문입니다.\n가을 또는 겨울: 야수들이 휴식을 취하지 못하고 겨울 식량 비축분이 봄까지 버티지 못합니다. 일부 야수들은 굶주리게 될 것입니다. 다음 계절이 끝날 때까지 이 위치에서 2개 경로 이내의 위치에서는 식물이나 곤충 영약재를 채집할 수 없습니다."
  },
  "Herbivorous Tendencies": {
    name: "초식성 경향 (공황 장애)",
    description: "외상으로 인한 생존 본능적 공포가 이 야수에게 깨어나 마음을 놓지 못하고 있습니다. 다른 야수의 모습이나 냄새만 맡아도 극심한 공황 상태에 빠집니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "굳어진 두려움: 깊은 공포가 야수의 마음에 완전히 자리 잡습니다. 그들은 짐을 싸서 누구도 찾을 수 없는 멀고 외딴 곳으로 숨어버립니다. 이곳이 정착지였다면, 정착지의 지역 서비스 중 하나가 영구적으로 제거됩니다."
  },
  "Hunted": {
    name: "추격당한 부상",
    description: "거대 야수에게 쫓기며 몸의 절반이 물어뜯긴 채, 이 야수는 숨을 헐떡이며 도움을 청하러 왔습니다. 과도한 도망길은 그의 상처를 악화시켰습니다. 현재 위치에서 채집을 시도할 때, ♠ 카드를 뽑으면 거대 야수가 나타납니다. 거대 야수는 당신이 이벤트를 포기하게 만들며, 타이머를 1시간 감소시키고 채집 포인트를 주지 않습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "복수의 굴레: 그가 상처를 이기지 못하고 숨을 거두자, 그의 소중한 동반자가 거대 야수에게 복수를 맹세합니다. 영구적으로 두꺼운 피(Thickblood) 서비스의 비용이 1 장신구 감소합니다."
  },
  "Living With a Black Beast": {
    name: "마음속 검은 야수 (우울증)",
    description: "이 야수는 힘겨운 나날을 보내고 있습니다. 마음이 마비되고 깨지기 쉬운 상태이면서도 늘 알 수 없는 두려움에 떨고 있습니다. 그는 용기를 내어 당신을 찾아왔습니다. 당신의 따뜻한 보살핌이 절실합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "마음의 빗장: 당신이 너무 오래 지체하여 그가 다시 마음의 문을 닫아버렸습니다. 그는 당신과 주변 사람들의 모든 도움을 거부합니다."
  },
  "Lockjaw": {
    name: "파상풍 (턱 마비)",
    description: "티탄이 남긴 날카로운 쓰레기에 베인 탓에, 이 가여운 야수의 턱이 굳어 다물어지지 않고 고열이 시작되었습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "격리 조치: 치료를 받지 못하면 열병이 그를 간호하던 다른 야수들에게로 전염됩니다. 길드는 이러한 비극의 재발을 막기 위해 근처의 티탄 유적을 봉쇄하기로 합의했습니다. 지도에서 가장 가까운 티탄 유적을 제거하세요."
  },
  "Long Drop": {
    name: "추락 사고",
    description: "하늘을 올려다보니 흔한 풍경이 보입니다. 써밋(Summit)에서 온 바다독수리가 환자를 태우고 날아가고 있습니다. 하지만— 잠깐— 오 안 돼! 환자가 독수리의 움켜진 발에서 미끄러져 저 멀리 땅으로 추락하고 맙니다.",
    outcome: "발견 불가: 환자를 제때 찾지 못하면 무슨 일이 일어날까요? 그들은 애초에 어떻게 미끄러진 것일까요?",
    consequence: "날개 꺾인 비행: 손님을 떨어뜨린 것에 크게 낙담하고 부끄러워진 바다독수리 '볼드해트'가 일을 중단합니다. 지도에서 '하늘 택시(Air Taxi)' 서비스를 영구적으로 제거합니다."
  },
  "Mawfoam": {
    name: "구강 거품병 (광견병)",
    description: "이 땅에서 완전히 사라진 줄 알았던 치명적인 질병이 다시 머리를 치켜들었습니다. 감염된 야수들은 빠르게 야성을 잃고 난폭해집니다. 조심하세요; 물을 무서워하는 가장 치명적인 증상은 이미 구제할 단계를 지났음을 의미합니다.",
    outcome: "이빨을 조심해!: 치료제를 만드는 데 성공했지만, 약을 투여할 때 환자가 격렬하게 발버둥 치며 저항합니다. 카드 한 장을 드로우하세요. 만약 ♠ 카드가 나온다면 치료 중 야수에게 물리게 됩니다. 당신은 자신을 위해 또 하나의 구강 거품병 치료제를 조제해야 합니다.",
    consequence: "폐쇄 격리: 길드들은 숲의 이 지역을 완전히 포기하기로 합의합니다. 지도에서 현재 위치를 제거하세요. 만약 이곳이 정착지나 도시였다면, 다른 지역으로 대이동하는 야수들의 감정적 고통과 혼란에 대해 저널을 작성하세요."
  },
  "Midge Munched": {
    name: "모기 물림",
    description: "이 어리석은 야수는 늪지 모기떼에 대한 대비도 없이 그저 늪가에서 낮잠을 자고 말았습니다. 온몸이 가렵고 부어올랐습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "짜증 가득한 거부: 너무 심하게 긁은 탓에 온몸의 상처가 터지고 짜증이 극에 달해 당신의 접근을 거부합니다. 하루 이틀 지나면 괜찮아지겠지만, 깎인 명성을 회복하는 데는 더 오랜 시간이 걸릴 것입니다."
  },
  "Migration Migraine": {
    name: "이주 편두통",
    description: "먼 땅의 부름이 들려오고, 이 야수의 본능은 떠나야 한다고 외치고 있습니다. 그가 떠날 수 없거나 떠나지 않기로 선택했더라도, 몸과 머리는 심각한 고통과 압박감을 겪고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "부름에 이끌려: 그를 가로막고 있던 장애물이 무엇이든 상관없이 본능의 이끌림에 굴복하여 무작정 떠나버립니다. 이로 인해 주변 상황이 어떻게 악화되었을까요?"
  },
  "Monthly Chore": {
    name: "월간 껍질 벗기",
    description: "이 도마뱀은 가려운 비늘을 진정시키기 위해 보이는 단단한 표면마다 몸을 비벼대고 있습니다. 껍질을 벗을 때가 거의 되었지만, 조만간 부드럽게 비늘을 진정시켜주지 못하면 비늘 아래의 새 속살이 쓸려 피가 날 것입니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "허물 투성이: 온 사방에 죽은 비늘 허물이 날리고, 도마뱀은 몸이 너무 아파 치울 엄두를 내지 못합니다. 하루를 소모(Mark 1 Day)해 청소를 도와준다면 명성을 잃지 않습니다."
  },
  "Nervefright": {
    name: "신경 마비 (공포증)",
    description: "거대 야수와 너무 근접하게 마주친 탓에 이 가여운 야수는 공포로 얼어붙었습니다. 본능이 몸을 굳게 만들어 움직이지 못하고 누구의 말에도 반응하지 않습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "심장 마비: 극심한 스트레스를 이기지 못해 심장이 멈추고 맙니다. 이 참사를 일으킨 거대 야수는 누구인가요? 룰북 40페이지 규칙을 사용해 지도에 그의 무덤(Barrow)을 표시하세요."
  },
  "Night Shift": {
    name: "야간 교대근무 피로",
    description: "이 야수는 필생의 역작을 완성하기 위해 특별한 기술을 연마해왔습니다. 동거인들과의 수면 시간 갈등 때문에 낮에는 집중할 수 없어 밤잠을 설쳐가며 작업해왔습니다. 그는 헛소리를 할 정도로 몽롱하지만 작품을 끝내기 위해 필사적입니다.",
    outcome: "헌정사: 그의 평생 역작은 무엇인가요? 제때 치료해 준다면 그의 멋진 작품에 당신을 향한 헌정 문구를 새겨줄 것입니다.",
    consequence: "작업 중 졸음: 작업 도중 밀려오는 잠을 이기지 못하고 쓰러지면서 심혈을 기울이던 작품을 완전히 망쳐버립니다."
  },
  "Pinned by Pine": {
    name: "소나무에 깔림",
    description: "쿵! 가파른 바람이 불어 늙은 소나무를 쓰러뜨렸고, 불행하게도 이 야수가 그 밑에 깔리고 말았습니다. 상처와 다발성 뼈 부상을 입었습니다. 나무를 조심스럽게 치워야 합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "지체된 구조: 구조가 너무 지체되어 깔린 부위의 뼈가 잘못 맞춰지거나 감염이 심해집니다. 그는 평생 절름발이로 살아가야 할 수도 있습니다. 당신의 마음에 얹힌 무거운 짐에 대해 저널을 작성하세요."
  },
  "Quagmire's Scale": {
    name: "콰그마이어의 비늘병 (Quagmire's Scale)",
    description: "수렁의 썩어가는 진흙 속을 걸어 다닌 탓에 이 파충류의 비늘이 부식되고 떨어져 나가고 있습니다. 비늘 사이로 붉고 아픈 살집이 드러나 괴로워하고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "비늘 탈락: 비늘이 거의 다 빠져버려 추위와 병균에 무방비로 노출됩니다. 그가 정착지에서 격리되어 홀로 아픔을 이겨내는 과정에 대해 기록하세요."
  },
  "Safety Stench": {
    name: "방어용 악취",
    description: "포식자로부터 자신을 보호하기 위해 이 야수는 몸에서 뿜어 나오는 강력한 화학적 악취 주머니를 터뜨렸습니다. 하지만 주머니가 파열되어 악취 물질이 피부와 점막에 스며들어 극심한 고통과 염증을 겪고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "지독한 고독: 악취가 너무 오래 몸에 배어 주변의 모든 친구와 가족이 그를 멀리합니다. 그가 겪는 지독한 외로움에 대해 기록하세요."
  },
  "Seasonshift": {
    name: "계절 변화병 (몸살)",
    description: "바람의 방향이 바뀌고 서리가 내리기 시작하자, 이 야수는 계절 변화에 적응하지 못하고 뼈마디가 쑤시는 몸살과 열병을 앓기 시작했습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "드러눕기: 며칠 동안 꼼짝없이 침대에 누워 겨울을 맞이할 준비(식량 비축 등)를 전혀 하지 못합니다. 겨울 동안 그가 겪을 어려움에 대해 저널을 작성하세요."
  },
  "Smokesnout": {
    name: "매연 코 (Smokesnout)",
    description: "대장간의 연기와 석탄 가루를 너무 많이 마신 탓에 코안의 점막이 타들어가고 호흡기가 막혔습니다. 쌕쌕거리는 숨소리와 함께 피가 섞인 기침을 합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "호흡 장애: 만성적인 호흡 곤란을 얻게 되어 더 이상 뜨겁고 먼지가 많은 대장간 일을 할 수 없게 됩니다. 그의 가업은 어떻게 될까요?"
  },
  "Soured Dough": {
    name: "상한 밀가루 독",
    description: "습한 창고에 방치되어 푸른 곰팡이가 피어난 밀가루로 구운 빵을 먹고 식중독에 걸렸습니다. 복통과 함께 구토를 멈추지 못합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "위장 손상: 독소가 위장을 크게 상하게 하여 아주 순하고 가벼운 음식 외에는 소화시키지 못하는 몸이 됩니다. 그가 좋아하는 음식을 더는 먹지 못하는 슬픔을 기록하세요."
  },
  "Stingshock": {
    name: "벌침 쇼크",
    description: "벌집을 채집하다가 여러 마리의 독충에게 쏘였습니다. 얼굴과 목이 심하게 부어오르고 두드러기와 함께 호흡이 가빠지기 시작했습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "벌집 기피: 벌에 대한 극심한 트라우마가 생겨 다치기 쉬운 벌집 채집을 평생 멀리하게 됩니다. 그가 더 이상 달콤한 꿀을 맛보지 못하게 되는 아쉬움을 저널로 쓰세요."
  },
  "Snail Ails": {
    name: "달팽이 점액 알레르기",
    description: "달팽이 껍질이나 점액질을 약재로 가공하려다가 점액 독소에 노출되어 온몸의 가죽과 눈이 짓물렀습니다. 눈을 제대로 뜨지 못하고 괴로워합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "일시적 실명: 한동안 눈을 전혀 뜰 수 없는 상태가 됩니다. 보이지 않는 어둠 속에서 주변 동료들에게 의지해야 하는 그의 심정을 기록하세요."
  },
  "Sunstruck": {
    name: "일사병",
    description: "뙤약볕 아래에서 모자도 쓰지 않고 종일 밭일을 하거나 짐을 나른 탓에 체온이 급격히 오르고 두통과 구토 증세를 보입니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "밭농사 중단: 일사병의 여파로 한동안 농사일을 손에서 놓게 됩니다. 잡초가 무성해진 그의 소중한 채소밭은 어떻게 될까요?"
  },
  "The Runs": {
    name: "배탈 (설사)",
    description: "상한 차가운 우유나 오염된 개울물을 마신 탓에 배탈이 나 하루에도 수십 번씩 덤불 속으로 달려가고 있습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "탈수 증상: 심한 설사로 몸의 기운이 빠지고 탈수 증상이 와 며칠간 아무런 활동도 하지 못하고 요양해야 합니다."
  },
  "Tickbitten, Twice Shy": {
    name: "진드기 물림",
    description: "수풀을 헤치고 가다가 껍질 두꺼운 거대 진드기에 물렸습니다. 진드기가 껍질 아래 깊숙이 머리를 박고 피를 빨아먹고 있으며 상처 주변이 붓고 가렵습니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "상처 감염: 진드기를 억지로 떼어내려다 대가리가 살 속에 박혀 곪아 터집니다. 흉터가 남고 열병이 동반됩니다."
  },
  "Titan Touched": {
    name: "티탄 접촉병",
    description: "고대 티탄의 유적에서 흘러나오는 푸른 광물이나 이상한 소리를 내는 기계와 접촉한 탓에, 온몸의 털이 빠지고 눈동자가 비정상적으로 흐려지며 이명이 들립니다.",
    outcome: "티탄의 계시: 성공적으로 치료한다면, 환자가 깊은 혼수상태에서 깨어나 티탄 유적의 숨겨진 장치와 비밀번호를 읊조립니다. 지도에서 유적 탐사 시 난이도가 2 감소합니다.",
    consequence: "정신 착란: 영구적인 이명과 정신 이상을 겪으며 유적 주변을 배회하는 신세가 됩니다. 그의 슬픈 방랑에 대해 기록하세요."
  },
  "Trowel Troubles": {
    name: "모종삽 부상",
    description: "원예용 모종삽이나 날카로운 농기구를 잘못 휘둘러 발목 가죽에 깊은 갈라진 상처를 입었습니다. 피가 멈추지 않고 흙먼지가 묻어 염증 우려가 큽니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "발목 흉터: 상처가 아물어도 힘줄이 상해 발목을 삐끗하기 쉬운 체질이 됩니다. 험난한 지형을 이동할 때 더 조심해야 합니다."
  },
  "Waen Drops": {
    name: "수렁 물방울병 (수종)",
    description: "습기가 가득하고 공기가 정체된 깊은 수렁에서 살던 야수가 다리와 몸에 물이 차 부풀어 오르는 증상을 보입니다. 숨을 쉴 때마다 가슴에서 물소리가 납니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "만성 비대: 몸의 부기가 완전히 빠지지 않고 굳어버려 움직임이 둔해집니다. 도구를 들고 다닐 수 있는 무게 한도가 1/3 감소합니다."
  },
  "Wake": {
    name: "추모제 피로",
    description: "마을의 족장 야수가 세상을 떠나 며칠 밤낮을 쉬지 않고 추모 의식을 치르느라 온몸이 탈진하고 신경이 날카로워졌습니다. 극심한 두통과 불안증을 호소합니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "전통 중단: 의식이 도중에 중단되어 망자의 영혼이 숲을 떠돌며 마을 야수들의 꿈자리가 숭숭해집니다. 마을 사람들의 불안감에 대해 저널을 쓰세요."
  },
  "Wingbreak": {
    name: "날개 골절",
    description: "강풍을 뚫고 날아가려다 나뭇가지에 부딪혀 한쪽 날개 뼈가 뚝 부러졌습니다. 날개를 축 늘어뜨린 채 극심한 통증을 호소하고 있습니다.",
    outcome: "깃털 스플린트: 부러진 날개를 튼튼한 너도밤나무 판자와 밀랍 줄로 아름답고 견고하게 고정해 줍니다. 환자가 감동하여 다음 비행 조우 시 난이도가 감소합니다.",
    consequence: "평생 불구: 뼈가 비뚤어지게 붙어 다시는 하늘을 날 수 없게 됩니다. 비행 능력을 잃어 슬퍼하는 새의 고독에 대해 기록하세요."
  },
  "Wormridden": {
    name: "기생충 감염",
    description: "오염된 날고기나 날벌레를 집어먹은 탓에 뱃속에 기생충이 들끓어 아무리 먹어도 살이 빠지고 구토와 무기력증에 시달립니다.",
    outcome: "성공 보상 장신구 획득",
    consequence: "영양실조: 몸의 영양분을 모두 빼앗겨 털빛이 칙칙해지고 한동안 제대로 걸어 다니지 못해 채집 효율이 급격히 떨어집니다."
  }
};

// 2. REAGENTS TRANSLATION MAP (preps and locs)
const reagentsPrepsMap: Record<string, { name: string; locs: string; preps: string }> = {
  "Horse Chestnuts": {
    name: "마로니에/말밤",
    locs: "b f l g m tpsa w\n이 영약재는 치료 효과 못지않게 많은 상처를 내기도 합니다. 종종 떨어지는 밤송이에 머리를 맞곤 하죠.",
    preps: "1/3 가시 껍질: [ELSEWHERE 1]로 조제\n1 완벽한 밤톨: 놀이용 [JOY 2]로 사용\n2/3 말밤 알맹이: 끓여서 [STOMACH 2], 요리해서 [FAIR 2]에 사용"
  },
  "Animal Sheddings": {
    name: "동물의 부산물",
    locs: "bf lgmtpsaw\n계절이 변할 때마다 숲의 동물들이 남기는 흔적들입니다.",
    preps: "2/3 똥 환약: 빻아서 [STOMACH 1]에 사용\n2/3 모피/털: 끓여서 [HIDE 1]에 사용\n1/3 땀: 끓여서 [HIDE 1]에 발라 사용"
  },
  "Beech": {
    name: "너도밤나무",
    locs: "bflgmtpsaw\n전설에 따르면 자작나무는 티탄들이 떠나며 남긴 작별 선물이라고 합니다.",
    preps: "1/3 겉껍질: 갈아서 [HIDE 2]에 사용\n1/3 열매: [FAIR 1]로 사용, 요리하여 [FAIR 2]로 사용\n1 나무껍질: 달여서 [WOUND 2]로 조제"
  },
  "Beehive": {
    name: "벌집",
    locs: "bf l gmtpsaw\n용감하게 단것을 찾는 야수들이 늘 탐내는 벌들의 둥지입니다.",
    preps: "1/3 밀랍: [FEATHER 2]에 사용\n1/3 로열 젤리: [HIDE 2] 및 [BURN 2]에 사용\n1/3 꿀: [WOUND 2]에 첨가, 복용 치료제에 사용"
  },
  "Beetles": {
    name: "딱정벌레",
    locs: "bf l gmtpsa w\n딱정벌레의 껍질은 겁 많은 야수들이 알아채지 못하는 영롱한 빛을 띱니다.",
    preps: "1/3 겉껍질: 빻아서 [SCALE 2]에 사용, [ELSEWHERE 1]로 조제"
  },
  "Behemoth Bits": {
    name: "거대 야수 부속물",
    locs: "bf l gmtpsaw\n숲의 거대 야수들에게서 조심스럽게 채취한 희귀한 부속물들입니다.",
    preps: "1/3 사향: [INSTINCT 2]에 바름\n2/3 소변: 끓여서 [SENSES 2]에 사용\n1 가죽 털: [TEMPERATURE 3]에 바름"
  },
  "Big Fish": {
    name: "큰 물고기",
    locs: "b f l g m tpsaw\n맑은 호수나 강에서 갓 건져 올린 크고 묵직한 물고기입니다.",
    preps: "2/3 껍질: 기름을 내기 위해 끓인 뒤 발라서 사용\n1 살코기: 요리하여 [MOOD 2] 및 [SENSES 3]에 사용\n1/3 비늘: 빻아서 [SCALE 3]에 사용"
  },
  "Birch Polypore": {
    name: "자작나무 버섯",
    locs: "bf l g m tpsaw\n자작나무 둥치에 넓게 자라나는 갈색 버섯입니다.",
    preps: "1/3 버섯: [HIDE 2] 및 [WOUND 1]에 발라 사용"
  },
  "Bird Leavings": {
    name: "새 배설물/배사",
    locs: "bf l gmtpsaw\n하늘을 날아다니는 깃털 달린 동물들이 떨어뜨리고 간 둥지 잔해물입니다.",
    preps: "1/3 구아노: 갈아서 요리해 [POISON 1]에 사용\n1/3 알껍질: 빻아서 [SCALE 1]에 사용\n1/3 깃털: [JOY 1]에 사용"
  },
  "Blackcurrant": {
    name: "블랙커런트",
    locs: "b f l gm tpsa w\n야수들은 집의 안정을 위해 블랙커런트 나뭇가지를 엮어 벽에 걸어둡니다.",
    preps: "1/3 열매: 생으로 [FAIR 1]에 사용\n1/3 잎사귀: 달여서 [INFECTION 1]에 사용\n1 뿌리: 씹어서 [MOOD 1]에 사용"
  },
  "Blackthorn": {
    name: "야생 자두/슬로나무",
    locs: "bf l g m tpsaw\n열매가 아주 시지만 요리하면 훌륭한 잼이 됩니다.",
    preps: "1 슬로 열매: 복용 치료제에 넣어 [FOUL 2]에 사용, 요리하여 [FAIR 2] 및 [STOMACH 2]에 사용\n1/3 가시: 갈아서 달인 뒤 [POISON 2]에 사용"
  },
  "Brambles": {
    name: "가시덤불 나뭇가지",
    locs: "b f l gm tpsaw\n가시덤불 지대는 종종 작은 새들의 안전한 보금자리가 됩니다.",
    preps: "1/3 열매: 씹어서 [FAIR 2]에 사용, 요리하여 [FAIR 3]에 사용\n2/3 껍질: 끓여서 연고를 만든 뒤 [HIDE 1]에 사용\n1 뿌리: 씹어서 달인 후 사용"
  },
  "Burdock": {
    name: "우엉",
    locs: "b flg m tpsa w\n밭두렁이나 길가에서 흔히 볼 수 있는 생명력 강한 풀입니다.",
    preps: "1 뿌리: 달여서 [INFECTION 1]에 사용\n2/3 줄기: 갈아서 [FUR 1] 결 고르는 데 사용\n1/3 꽃: 소화시켜 밝은 페이스트로 만들어 사용\n1/3 씨꼬투리: 빗처럼 쓸어 [PARASITES 1]에 사용"
  },
  "Butterfly": {
    name: "나비",
    locs: "bflgm t psa w\n어린 야수들이 숲의 화사한 초원에서 쫓아다니길 좋아하는 곤충입니다.",
    preps: "1/3 살아있는 나비: 이마에 얹어 진정시키는 데 사용"
  },
  "Catnip": {
    name: "개박하",
    locs: "b f l g m t psa w\n고양이과 야수뿐 아니라 숲의 모든 야수를 나른하고 즐겁게 만드는 최고의 약초입니다.",
    preps: "1/3 뿌리: 씹어서 [BREATH 1]에 사용\n1/3 꽃: 달여서 [INSTINCT 2] 및 [MOOD 1]에 사용"
  },
  "Chalk": {
    name: "분필/석회석",
    locs: "b f l g m t psaw\n아무런 맛도 없지만 빻으면 미세한 가루가 되는 흙 원소입니다.",
    preps: "1/3 석회 가루: 빻아서 [STOMACH 2] 및 [POISON 1]에 사용"
  },
  "Cherry Trees": {
    name: "벚나무/체리",
    locs: "b f l g m t psaw\n브리슬리 숲의 야수들이 아주 좋아하는 달콤한 열매가 열리는 나무입니다.",
    preps: "1/3 버찌: 요리하여 [JOY 3] 및 [FAIR 4]에 사용\n1/3 껍질: 빻아서 [BREATH 1]에 사용"
  },
  "Chillies": {
    name: "고추/매운고추",
    locs: "bf l g mtpsa w\n어떤 야수들에게는 혀가 타들어 갈 것 같지만 훌륭한 각성 유발 약재가 됩니다.",
    preps: "1/3 속껍질: 끓여서 [PAIN 1]에 사용\n1/3 씨앗: 빻아서 사용"
  },
  "Clay": {
    name: "진흙/찰흙",
    locs: "b f l g m t psaw\n물과 부드러운 흙이 만나는 하천가에서 채취하는 흙 원소입니다.",
    preps: "2/3 진흙: [NERVES 1] 및 [POISON 1]에 사용, 소화시켜 [STOMACH 1]에 사용"
  },
  "Coarse Grit": {
    name: "굵은 모래/사석",
    locs: "b f l g m t psaw\n많은 조류 야수들은 소화를 돕기 위해 굵은 모래를 삼키곤 합니다.",
    preps: "1/3 모래알: 씹어서 [STOMACH 2]에 사용"
  },
  "Concocted Calm": {
    name: "조제된 평정약 (Titan Hissbox)",
    locs: "b f l g m tpsaw\n향수병이나 향정신적 긴장을 호소하는 야수들에게 특효약인 티탄의 잔해 도구입니다.",
    preps: "2/3 분무액: [INSTINCT 3] 및 [MOOD 3]에 분사하여 사용"
  },
  "Crab Apples": {
    name: "야생 사과/고욤사과",
    locs: "bf l gm tps a w\n제대로 조리하지 않으면 입안이 텁텁하고 신맛이 강한 야생 과일입니다.",
    preps: "1 과육: 복용 치료제에 넣어 [FOUL 1]에 사용, 요리하여 보존(PRESERVED) 속성을 부여해 복용 치료제에 사용"
  },
  "Cucumbers": {
    name: "오이",
    locs: "b f lgmtpsa w\n샐러드와 샌드위치의 필수적인 수분 보충 야채입니다.",
    preps: "1/3 꽃: 달여서 [SENSES 2], [SLEEP 1]에 사용\n1/3 오이 속살: 복용 치료제에 넣어 사용"
  },
  "Dandelions": {
    name: "민들레",
    locs: "bf l gmtpsa w\n초원을 황금빛으로 물들이는 아름다운 풀꽃입니다.",
    preps: "1/3 꽃: [JOY 1]에 사용\n1/3 뿌리: 갈아서 [STOMACH 1]에 사용\n1/3 잎: 복용 치료제에 넣어 [FAIR 1]에 사용\n1/3 줄기: 달여서 [HIDE 1]에 사용"
  },
  "Doused Bonfires": {
    name: "꺼진 모닥불 재/숯",
    locs: "b f l gm t psaw\n약초 연고를 빻는 약제사들은 모닥불 잔해도 결코 낭비하지 않습니다.",
    preps: "1/3 재: 비늘 각질 제거를 위한 [SCALE 2]에 바르거나, 비누로 끓여 [HIDE 2]에 사용\n1/3 숯: 빻아서 [POISON 2] 및 [ELSEWHERE 2]에 사용"
  },
  "False Deathcap": {
    name: "광대버섯아재비",
    locs: "b f l g m tpsaw\n조심해서 다루지 않으면 치명적인 중독 증상을 보이는 독버섯입니다.",
    preps: "2/3 버섯 속살: 소화시켜 [SENSES 3] 및 [FOUL 6]에 사용"
  },
  "Field Blewit": {
    name: "민자 자주방망이버섯",
    locs: "b f l gmtpsaw\n민간 전설에 신비로운 힘이 깃들어 있다고 전해지는 자주색 버섯입니다.",
    preps: "1/3 버섯 갓: 요리해서 [STOMACH 2]에 사용"
  },
  "Fine Sand": {
    name: "고운 모래",
    locs: "b f l g m t psaw\n숲의 파충류 야수들은 허물을 벗을 때 도움을 줄 수 있는 고운 모래를 늘 찾아 헤맵니다.",
    preps: "2/3 고운 모래: 마시는 약의 필터로 사용하여 조제"
  },
  "Firegizzards": {
    name: "불꽃 주머니 (Titan Firegizzard)",
    locs: "b f l g m tpsaw\n힘차게 두드리면 은은한 불처럼 타오르는 신비한 티탄의 주머니입니다.",
    preps: "1 붉은 액체 주머니: [TEMPERATURE 3]에 사용"
  },
  "Fly Agaric": {
    name: "광대버섯",
    locs: "b f l g m tpsaw\n붉은 갓에 흰 점이 콕콕 박힌 전형적인 판타지 버섯입니다.",
    preps: "1/3 포자: 달여서 [INSTINCT 1] 및 [MOOD 2]에 사용\n1 버섯 갓: 요리하여 [SLEEP 3]에 사용"
  },
  "Forget-Me-Not": {
    name: "물망초",
    locs: "b f l g m tpsa w\n우정과 사랑을 전할 때 꽃다발로 가장 많이 선물하는 작고 푸른 꽃입니다.",
    preps: "1/3 꽃: 달여서 [NERVES 3]에 사용\n1/3 꿀샘: 달여서 [BREATH 2]에 사용"
  },
  "can only be Foraged for in Summer Frog Slime": {
    name: "개구리 점액",
    locs: "b f l g m t psaw\n여름철 개구리의 피부에서 분비되는 천연의 질병 억제 점액질입니다.",
    preps: "1/3 점액: 끓여서 [INFECTION 2] 및 [PARASITE 2]에 사용"
  },
  "Garden Mint": {
    name: "박하/민트",
    locs: "bf l g m tpsaw\n머리를 맑게 해주는 상쾌한 정원 허브의 대명사입니다.",
    preps: "1/3 잎사귀: 씹어서 [BREATH 2] 및 [PAIN 1]에 사용\n1/3 줄기: 달여서 [STOMACH 2]에 사용"
  },
  "Glass Silk": {
    name: "유리 섬유 (Titan Glass Silk)",
    locs: "b f l g m tpsaw\n삼밧줄보다 열 배는 더 질긴 고대 티탄들의 광택 섬유 실입니다.",
    preps: "1/3 유리 실타래: [HIDE 3] 및 [WOUND 3]에 실로 엮어 사용"
  },
  "Goosegrass": {
    name: "갈퀴덩굴",
    locs: "bf l g m t psa w\n어린 동물들이 털옷에 던지며 노는 거칠거칠한 잡초입니다.",
    preps: "1/3 씨앗: 갈아서 달인 뒤 [SLEEP 1]에 사용\n1/3 어린줄기: 끓여서 [HIDE 1] 및 [PAIN 1]에 사용"
  },
  "Haircap Moss": {
    name: "솔이끼",
    locs: "bf l g m t psaw\n축축한 바위 그늘에 자라며 방광염에 효과가 좋은 이끼류입니다.",
    preps: "1/3 솔이끼 잎: 끓여서 [FEATHER 2] 및 [HIDE 1]에 사용"
  },
  "Hidelendings": {
    name: "인조 가죽 밴드 (Titan Hidelendings)",
    locs: "b f l g m tpsaw\n쥐 가죽 색깔을 띤 접착식 티탄의 인조 피부 보호재입니다.",
    preps: "1/3 가죽 조각: [HIDE 2] 및 [WOUND 2]에 부착해 사용"
  },
  "Hoarhound": {
    name: "쓴풀/호하운드",
    locs: "b f l gm tpsa w\n쉽게 지나치기 쉽지만 아주 독특하고 쓴 향을 풍기는 약초입니다.",
    preps: "2/3 잎사귀 뭉치: 요리하여 [PAIN 2] 및 [BREATH 3]에 사용"
  },
  "Honeybees": {
    name: "꿀벌",
    locs: "bflgmtpsa w\n숲속 곳곳을 바쁘게 잉잉거리며 날아다니는 작은 곤충입니다.",
    preps: "1/3 꽃가루: [STOMACH 1] 및 [MOOD 2]에 첨가하여 사용"
  },
  "Horsetails": {
    name: "쇠뜨기/개뜨기",
    locs: "b f l g m t psaw\n실제 말의 꼬리가 아니라 마디가 져 자라나는 약용 양치식물입니다.",
    preps: "1/3 줄기: 끓여서 [WOUND 2] 및 [FEATHER 3] 혹은 [FUR 3]에 사용"
  },
  "Iron Ore": {
    name: "철광석/철 자갈",
    locs: "b f l g mtpsaw\n부모에게서 자식에게로 전해져 내려오는 치료 전설에 자주 등장하는 단단한 돌입니다.",
    preps: "1/3 철 자갈: 마시는 치료제에 넣어 끓인 뒤 [NERVES 1] 및 [STOMACH 3]에 사용. 광부들에게 명성이나 장신구로 교환 가능합니다."
  },
  "Trinket Ironslug": {
    name: "철 민달팽이 (Titan Ironslug)",
    locs: "b f l g m tpsaw\n이 달팽이를 꾹 쥐어짜면 화상 상처를 즉시 달래주는 부드럽고 향기로운 흰 연고 크림이 나옵니다.",
    preps: "1/3 점액 내장: [PAIN 2] 및 [BURN 3]에 연고로 사용"
  },
  "Lavender": {
    name: "라벤더",
    locs: "bf l g m t psa w\n일부 연고 약제사들은 라벤더 하나만 있으면 숲의 모든 병을 고칠 수 있다고 굳게 믿습니다.",
    preps: "1/3 라벤더 꽃: 달여서 [NERVES 2] 및 [SLEEP 2]에 사용"
  },
  "Leech": {
    name: "거머리",
    locs: "b f l g m tpsa w\n연고 조제사들은 오래전부터 상처의 나쁜 피를 뽑아내는 거머리의 신비한 가치를 잘 알고 있었습니다.",
    preps: "2/3 거머리: 빻아서 페이스트로 만들어 [WOUND 2] 및 [PARASITE 2]에 사용"
  },
  "Maggots": {
    name: "구더기",
    locs: "bf l g m t psa w\n피부가 깊게 썩어 들어가는 끔찍한 상처에는 죽은 살을 먹어치우는 구더기를 쓰는 것이 최선입니다.",
    preps: "2/3 유충: [INFECTION 3] 및 [WOUND 3]에 얹어 상처를 소독하는 데 사용"
  },
  "Marigold": {
    name: "금잔화/메리골드",
    locs: "b f l g m t psa w\n벌집 관리인들과 꿀벌들이 단 꿀을 모으기 위해 가장 즐겨 찾는 주황색 꽃입니다.",
    preps: "1/3 꽃꿀: [FAIR 1]에 첨가하여 사용\n2/3 꽃잎: [JOY 2]로 조제"
  },
  "Marshgold": {
    name: "동의나물/늪금잔화",
    locs: "bfl g m t ps a w\n습지와 늪지대를 밝혀주는 가장 화사하고 아름다운 야생화 중 하나입니다.",
    preps: "2/3 꽃잎: [ELSEWHERE 2]에 사용\n1/3 꽃잎: 달여서 [JOY 2] 및 [BREATH 2]에 사용"
  },
  "Marshmallow": {
    name: "마시멜로 풀 (양아욱)",
    locs: "b f l g m t psa w\n캠프파이어 때 구워 먹는 말랑말랑한 과자와 혼동해서는 안 되는 허브 식물입니다.",
    preps: "1/3 꽃잎: 끓여서 [FEATHER 1], [FUR 1]에 사용\n1/3 뿌리 수액: 요리해서 [STOMACH 3] 및 [FAIR 1]에 사용"
  },
  "Meadow Waxcap": {
    name: "꽃버섯/초원 왁스캡",
    locs: "b f l g m tpsaw\n양들이 풀을 뜯는 목초지 그늘에서 흔히 자라나는 버섯입니다.",
    preps: "1/3 버섯: [STOMACH 1]에 첨가, 요리해서 [STOMACH 3] 및 [FAIR 2]에 사용"
  },
  "Miracle Loaf": {
    name: "기적의 빵 (Titan Miracle Loaf)",
    locs: "b f l g m tpsaw\n은박지 같은 금속 막에 감싸인 영양 가득한 티탄의 비상식량 조각입니다.",
    preps: "1/3 부스러기: 빻아서 [FEATHER 3] 및 [FUR 3]에 사용"
  },
  "Musk Scrapings": {
    name: "사향 병 (Titan Musk Scrapings)",
    locs: "bf l g mtpsaw\n아주 신비롭고 이상한 온갖 냄새들이 가득 담겨 있는 실린더 형태의 티탄 용기입니다.",
    preps: "향수 원액: [JOY 3], [BREATH 3], [SENSES 3], [ELSEWHERE 3], [MOOD 3] 및 [NERVES 3]에 다양하게 스프레이하여 사용"
  },
  "Nettles": {
    name: "쐐기풀",
    locs: "bflgmtpsaw\n숲속 발가락 사이에 밟히는 흙먼지처럼 어디서든 흔히 볼 수 있는 풀입니다.",
    preps: "1/3 쐐기 잎: 달여서 [INFECTION 1] 및 [PAIN 1]에 사용\n1/3 줄기: 씹어서 [STOMACH 2]에 사용"
  },
  "Nightshade": {
    name: "까마중/벨라도나",
    locs: "b f l gm t psa w\n죽음의 어둠처럼 검게 익어가는 매우 치명적인 독을 품은 검은 열매입니다.",
    preps: "1/3 검은 열매: 갈아서 달인 뒤 [SENSES 3]에 독성 마취제로 사용"
  },
  "Oak": {
    name: "참나무/오크나무",
    locs: "bf l gmtpsaw\n브리슬리 숲에서 가장 거대하고 위엄 있게 우뚝 솟아오른 고목입니다.",
    preps: "1/3 미선나무 꽃: [JOY 1]에 사용\n1/3 도토리: 갈아 요리해 [FAIR 2]에 사용\n2/3 나무껍질: 갈아서 끓인 후 [POISON 3]에 사용\n1 튼튼한 나뭇가지: 골절된 뼈를 고정하는 데 사용"
  },
  "Orange Peel Fungus": {
    name: "귤껍질버섯",
    locs: "b f l gmt psa w\n야수들이 다른 야수를 저편으로 보낸 추모제 의식 때 전통적으로 올리던 오렌지빛 버섯입니다.",
    preps: "1/3 버섯 꽃잎: [JOY 1] 혹은 [ELSEWHERE 1]로 사용"
  },
  "Pearls": {
    name: "진주",
    locs: "b f l g m t psaw\n맑은 강조개 안에서 간혹 발견되는 영롱하고 매우 아름다운 지구 원소입니다.",
    preps: "1/3 조개 진주: [ELSEWHERE 3] 혹은 [JOY 2]로 사용"
  },
  "Pox-Be-Gones": {
    name: "질병 퇴치제 알약 (Titan Pox-Be-Gones)",
    locs: "b f l g m tpsaw\n맛이 매우 쓰고 삼키기 힘들지만 온갖 염증과 감염을 즉시 날려버리는 티탄의 작은 백색 하드 알약입니다.",
    preps: "1/3 알약 가루: 빻아서 [INFECTION 3]에 사용\n2/3 알약 즙: [INFECTION 1]에 첨가해 사용"
  },
  "Redsap": {
    name: "적색 나무 수액 (Titan Redsap)",
    locs: "b f l g m tpsaw\n수 세기 전에 살던 조상 야수들이 가장 즐겨 마셨다던 진하고 달콤한 붉은 나무 수액 액체입니다.",
    preps: "1 병입 수액: [PAIN 3] 및 [BREATH 3] 완화를 위해 첨가해 사용"
  },
  "Rhubarb": {
    name: "루바브/당작약",
    locs: "bf l gm t psa w\n산비탈을 따라 군락을 지어 자라며 씹으면 극도로 쓰고 신맛이 강한 풀입니다.",
    preps: "1/3 줄기: 씹어서 [FOUL 2]에 사용, 요리하여 [FAIR 2]에 사용\n1/3 질긴 줄기 섬유: 씹어서 붕대 고정 줄로 묶는 데 사용"
  },
  "Ribwort": {
    name: "창질경이/리브워트",
    locs: "bf l g m tpsaw\n야수들 사이에서 종종 나그네의 풀이라고도 불리는 생명력이 끈질긴 약초입니다.",
    preps: "1/3 씨꼬투리: 빻아서 [FAIR 1]에 사용\n1/3 잎사귀: 즙을 내어 연고로 사용"
  },
  "Rivermint": {
    name: "강가박하",
    locs: "b f l g m t psaw\n물안개가 피어나는 서늘한 하천변에서 돋아나는 향긋하고 여린 박하 풀입니다.",
    preps: "1/3 잎: 갈아서 상처에 바르거나 [BREATH 2]를 위해 달여서 사용\n1/3 줄기: 씹어서 [PAIN 1]에 사용"
  },
  "Rock Salt": {
    name: "암염",
    locs: "b f l g m t psaw\n높은 산맥에 사는 현자 염소들이 소중하게 보관하고 지키는 결정 소금입니다.",
    preps: "2/3 소금 결정: [INFECTION 2] 및 [WOUND 2] 소독용으로 사용"
  },
  "Roses": {
    name: "장미",
    locs: "bf l g m tpsa w\n어떤 다른 이름으로 불려도 그 향기는 여전히 달콤할 붉은 꽃송이입니다.",
    preps: "1/3 장미 꽃잎: [JOY 1]에 사용\n1/3 들장미 열매: 빻아서 사용"
  },
  "Shells": {
    name: "강조개 껍데기",
    locs: "b f l g m t psaw\n내부가 매끄럽고 평평하여 물감이나 연고를 개는 그릇으로 요긴하게 쓰이는 껍데기입니다.",
    preps: "2/3 껍데기: 물꼬를 틀 때 다른 영약재 교환 수단으로 요긴하게 가치 발휘"
  },
  "Silver Ore": {
    name: "은광석/은 조각",
    locs: "b f l g m t psaw\n부드럽고 가공하기 쉬워 뼈 고정 스플린트나 의치 보철물에 최고로 꼽히는 광물입니다.",
    preps: "1/3 은 조각: 갈아서 붕대 안쪽에 얹어 [WOUND 2] 소독 및 뼈 지지용으로 사용"
  },
  "Slugs": {
    name: "민달팽이",
    locs: "bflgmtpsa w\n브리슬리 숲의 야수들이 기력이 떨어졌을 때 단백질을 보충하기 위해 삼키는 주식입니다.",
    preps: "2/3 민달팽이: 요리하여 [FAIR 2]에 단백질 보충식으로 사용"
  },
  "Small Fish": {
    name: "작은 물고기",
    locs: "b f l g m t psaw\n개울가에서 족대로 쉽게 건져 올릴 수 있는 평범한 물고기입니다.",
    preps: "1/3 생선 가시: 정교한 봉합 침으로 사용\n1 살코기: 요리하여 마시는 약에 풍미 보충\n1/3 생선 비늘: 기름을 짜내어 연고 기제로 사용"
  },
  "Sourchits": {
    name: "신맛 사탕 (Titan Sourchits)",
    locs: "b f l g m tpsaw\n입안에 넣자마자 눈물이 찔끔 날 정도로 신맛이 나는 침 분비용 티탄의 가공 캔디입니다.",
    preps: "1/3 알약 사탕: 빻아서 [PAIN 3] 완화에 마취 보조로 사용"
  },
  "Spiders": {
    name: "거미/거미줄",
    locs: "bf l gmtpsa w\n여덟 개의 다리로 나뭇가지 사이에 정교한 집을 짓는 숲의 사냥꾼 곤충입니다.",
    preps: "1/3 거미줄: 상처를 지혈하고 붙잡는 [WOUND 1] 붕대로 사용"
  },
  "Strawberries": {
    name: "야생 딸기",
    locs: "bf l g m t psa w\n맛이 좋은 딸기가 자라나는 덩굴의 위치는 부모가 자식에게만 몰래 가르쳐주는 가문 비밀입니다.",
    preps: "2/3 딸기 열매: [FAIR 2]로 조제, 요리하여 [FAIR 4]로 조제\n1/3 딸기꽃: 달이거나 발라서 [JOY 2]에 사용\n1/3 잎사귀: 빻아서 [HIDE 1]에 사용"
  },
  "Tansies": {
    name: "쑥국화/탄지 꽃",
    locs: "b flgm t psa w\n지역의 경계선이나 길가 모퉁이에서 주로 자라며 톡 쏘는 향이 나는 노란 꽃입니다.",
    preps: "1/3 쓴 잎: 소화시켜 뱃속 [PARASITE 3] 구충에 사용\n2/3 줄기: 달여서 [INSTINCT 1]에 사용"
  },
  "Thistles": {
    name: "엉겅퀴",
    locs: "bflgmtpsaw\n고대 티탄들이 이 보랏빛의 가시 돋친 아름다운 식물을 아주 좋아했다고 전해집니다.",
    preps: "1/3 엉겅퀴 가시 머리: 발라서 [FUR 2]에 사용\n1/3 엉겅퀴 꿀: [MOOD 1]에 첨가하여 사용"
  },
  "Titansorrel": {
    name: "티탄 수영 (Titan Sorrel)",
    locs: "b f l gmtpsaw\n샐러드에 넣으면 톡 쏘는 신맛과 쓴맛이 어우러져 입맛을 돋우는 붉은 잎 풀입니다.",
    preps: "1/3 잎: [MOOD 1]에 첨가(단, [FOUL 1]도 함께 부가)\n1/3 뿌리: 요리하여 상처에 연고로 부착 사용"
  },
  "Toads": {
    name: "두꺼비",
    locs: "b f l g m tpsaw\n스트레스를 받으면 피부에서 찐득한 분비물을 내뿜는 양서류 동물입니다.",
    preps: "1/3 피부 독성 점액: [SENSES 1]에 소량 첨가(단, [FOUL 3]이 다량 유발됨)"
  },
  "Wasps": {
    name: "말벌",
    locs: "bflgm tpsa w\n꿀벌보다 몸집이 크고 공격적이며 꿀을 만들지 않는 독충입니다.",
    preps: "1/3 말벌 침 독: 신경 자극용 [SENSES 2]에 소량 사용"
  },
  "Waychalk": {
    name: "길잡이 백분 벽돌 (Titan Waychalk)",
    locs: "b f l g m tpsaw\n티탄들이 영역을 표시할 때 쓰던 묵직하고 거대한 흰색 석고 분필 벽돌입니다.",
    preps: "1/3 석고 조각: 조제용 [ELSEWHERE 3]에 사용"
  },
  "Whiskerburner": {
    name: "수염 태우개 술 (Titan Whiskerburner)",
    locs: "b f l g m tpsaw\n곡물 발효 길드의 야수들이 빚어낸 어떤 강한 술보다도 독해 코털이 탈 듯한 티탄의 알코올 액체입니다.",
    preps: "2/3 소독용 액체: 상처 소독 및 통증 마비용으로 사용"
  },
  "White Willow": {
    name: "흰버드나무",
    locs: "b f l g m t psaw\n숲의 야수들은 이 버드나무를 강과 호수를 보살피는 물의 수호신으로 여깁니다.",
    preps: "1 껍질: 빻아서 해열용 [INSTINCT 1]에 사용\n2/3 버들개지: 끓여서 [PAIN 2]에 통증 완화 연고로 사용"
  },
  "Can only be Foraged for in Summer Wild Garlic": {
    name: "야생 마늘/명이풀",
    locs: "b f l gm t ps a w\n마늘 특유의 짙은 향이 사방에 퍼져 한여름 채집가들의 코를 즐겁게 만드는 풀입니다.",
    preps: "2/3 잎사귀: 씹어서 [FAIR 1]에 부착해 사용\n1/3 줄기: 빻아서 [BREATH 2]에 사용"
  },
  "Wild Violet": {
    name: "야생 제비꽃",
    locs: "bflgm t psa w\n벌레에 물린 부위에 바르면 부기를 가라앉히고 가려움을 달래주는 아름다운 보랏빛 꽃입니다.",
    preps: "1/3 제비꽃 잎: 소화시켜 [PAIN 1]에 사용\n1/3 잎사귀: 씹어서 [SENSES 2]에 사용"
  }
};

// 3. APPLY TRANSLATIONS
const translatedAilments = GAME_DATA.ailments.map(ail => {
  // Normalize raw key by removing page prefixes and multi-spaces
  let rawNameClean = ail.rawName
    .replace(/^PAGE\s*\d+\s*(---|--|-)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Find matching key by normalizing keys of ailmentsMap too
  let key = Object.keys(ailmentsMap).find(k => {
    const normK = k.replace(/\s+/g, ' ').trim();
    return normK === rawNameClean || normK.includes(rawNameClean) || rawNameClean.includes(normK);
  });
  
  if (rawNameClean.toLowerCase().includes('snout') || rawNameClean.toLowerCase().includes('smoke')) {
    key = 'Smokesnout';
  }
  if (rawNameClean.toLowerCase().includes('twitch')) {
    key = "Forager's Twitch";
  }
  if (rawNameClean.toLowerCase().includes('scale') && rawNameClean.toLowerCase().includes('quagmire')) {
    key = "Quagmire's Scale";
  }

  const trans = key ? ailmentsMap[key] : null;

  // Enforce English tags by replacing any leftover Korean mappings in ailments tags
  const cleanEnglishTags = (str: string) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/통증/g, 'pain')
      .replace(/상처/g, 'wound')
      .replace(/감염/g, 'infection')
      .replace(/기생충/g, 'parasite')
      .replace(/감각/g, 'senses')
      .replace(/수면/g, 'sleep')
      .replace(/호흡/g, 'breath')
      .replace(/화상/g, 'burn')
      .replace(/털/g, 'fur')
      .replace(/깃털/g, 'feather')
      .replace(/가죽/g, 'hide')
      .replace(/비늘/g, 'scale')
      .replace(/독/g, 'poison')
      .replace(/위장/g, 'stomach')
      .replace(/체온/g, 'temperature')
      .replace(/기쁨/g, 'joy')
      .replace(/기분/g, 'mood')
      .replace(/본능/g, 'instinct')
      .replace(/저편/g, 'elsewhere')
      .replace(/신경/g, 'nerves')
      .replace(/something to set a bone/g, '부목용 약재 (something to set a bone)')
      .replace(/a brightly coloured plant reagent/g, '밝은 색상의 식물 영약재 (a brightly coloured plant reagent)')
      .replace(/\band\s+either\b/g, '') // remove "and either" to leave "A or B" -> "A 또는 B"
      .replace(/\bor\b/g, '또는')
      .replace(/\band\b/g, '및')
      .replace(/&/g, '및')
      .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2') // ensure space between word and number
      .toUpperCase();
  };

  if (trans) {
    const cleanKoreanName = trans.name.replace(/\s*\([^)]+\)/g, '').trim();
    const englishName = key || rawNameClean;
    return {
      ...ail,
      name: `${cleanKoreanName} (${englishName})`,
      tags: cleanEnglishTags(ail.tags), // Keep tags in clean English
      description: trans.description,
      outcome: trans.outcome,
      consequence: trans.consequence
    };
  } else {
    console.log('No translation found for ailment:', ail.rawName);
    return {
      ...ail,
      tags: cleanEnglishTags(ail.tags)
    };
  }
});

const translatedReagents = GAME_DATA.reagents.map(reag => {
  const regMap: { [key: string]: string } = {
    'b': 'Bog', 'f': 'Forest', 'l': 'Loch', 'g': 'Meadow', 'm': 'Mountain', 't': 'Titan'
  };
  const seasonMap: { [key: string]: string } = {
    'p': 'Spring', 's': 'Summer', 'a': 'Autumn', 'w': 'Winter'
  };

  const trans = reagentsPrepsMap[reag.rawName];
  let finalName = reag.name;
  let finalLocs = reag.locs || "";
  let finalPreps = reag.preps;

  // If the source data already has separate description or is restructured, handle gracefully
  if (reag.description && finalLocs === "") {
    // fallback if already run
    const mockCodeLine = (reag.regions || []).map(r => {
      return Object.keys(regMap).find(k => regMap[k] === r) || "";
    }).join('') + 
    (reag.seasons || []).map(s => {
      return Object.keys(seasonMap).find(k => seasonMap[k] === s) || "";
    }).join('');
    finalLocs = mockCodeLine + '\n' + reag.description;
  }

  if (trans) {
    finalName = trans.name;
    finalLocs = finalLocs.split('\n')[0] + '\n' + trans.locs.split('\n')[1];
    finalPreps = trans.preps;
  } else {
    // try fallback mapping for naming anomalies
    let altKey = Object.keys(reagentsPrepsMap).find(k => k.includes(reag.rawName) || reag.rawName.includes(k));
    const altTrans = altKey ? reagentsPrepsMap[altKey] : null;
    if (altTrans) {
      finalName = altTrans.name;
      finalLocs = finalLocs.split('\n')[0] + '\n' + altTrans.locs.split('\n')[1];
      finalPreps = altTrans.preps;
    } else {
      console.log('No translation found for reagent:', reag.rawName);
    }
  }

  // Parse locs into regions, seasons, description
  const lines = finalLocs.split('\n');
  const codeLine = lines[0] || "";
  const description = lines.slice(1).join('\n') || "";

  const regions: string[] = [];
  const seasons: string[] = [];
  
  const cleanCode = codeLine.replace(/\s+/g, '').toLowerCase();
  for (const char of cleanCode) {
    if (regMap[char]) regions.push(regMap[char]);
    else if (seasonMap[char]) seasons.push(seasonMap[char]);
  }

  const cleanPrepFraction = (str: string) => {
    if (!str) return str;
    return str
      .replace(/^1\/3\s+/gm, '🟢⚪⚪ ')
      .replace(/^2\/3\s+/gm, '🟢🟢⚪ ')
      .replace(/^1\s+/gm, '🟢🟢🟢 ');
  };

  return {
    name: finalName,
    rawName: reag.rawName,
    type: reag.type.toUpperCase(),
    br: reag.br,
    regions,
    seasons,
    description,
    preps: cleanPrepFraction(finalPreps)
  };
});

// 4. WRITE UPDATED FILE
const outputData = {
  ...GAME_DATA,
  ailments: translatedAilments,
  reagents: translatedReagents
};

// Generate full gameData.ts content
const tsContent = `export interface Ailment {
  name: string;
  rawName: string;
  severity: 'lesser' | 'intermediate' | 'severe' | 'dire';
  timer: number;
  tags: string;
  description: string;
  outcome: string;
  consequence: string;
}

export interface Reagent {
  name: string;
  rawName: string;
  type: 'PLANT' | 'ANIMAL' | 'INSECT' | 'EARTH' | 'TITAN';
  br: number;
  regions: string[];
  seasons: string[];
  description: string;
  preps: string;
}

export interface Encounter {
  page: number;
  card?: string;
  suit?: string;
  title: string;
  text: string;
}

export const GAME_DATA = ${JSON.stringify(outputData, null, 2)};
`;

// Replace double escaped newlines (\\n) and clean up remaining unicode fraction symbols
// across the entire output code text.
const finalContent = tsContent
  .replace(/\\\\n/g, '\\n')
  .replace(/⅓/g, '1/3')
  .replace(/⅔/g, '2/3')
  .replace(/½/g, '1/2')
  .replace(/¼/g, '1/4')
  .replace(/¾/g, '3/4');

fs.writeFileSync('./src/gameData.ts', finalContent, 'utf8');
console.log('Successfully translated and saved gameData.ts!');
