import { useState, useEffect } from "react";
import { db, isFirebaseConfigured, auth, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { GAME_DATA } from "./gameData";
import RULEBOOK_KO from "./rulebook_ko.json";

// =================================================================
// 1. SYNC & STORAGE SYSTEM
// =================================================================
const withTimeout = (promise: Promise<any>, ms: number = 10000) => {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
};

const store = {
  set: async (key: string, value: any) => {
    const jsonString = JSON.stringify(value);
    if (jsonString.length > 1000000) {
      console.error('데이터가 너무 큽니다.');
      alert('데이터 크기가 제한(1MB)을 초과했습니다.');
      return false;
    }
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'saves', `uid_${currentUser.uid}`);
          await withTimeout(setDoc(docRef, { [key]: jsonString }, { merge: true }));
        }
      } catch (e: any) {
        console.error('Firebase 저장 에러:', e);
      }
    }
    try {
      localStorage.setItem(key, jsonString);
    } catch (e) {}
  },
  load: async (key: string, fallback: any) => {
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'saves', `uid_${currentUser.uid}`);
          const snap = await withTimeout(getDoc(docRef));
          if (snap.exists() && snap.data()[key]) {
            return JSON.parse(snap.data()[key]);
          }
        }
      } catch (e) {
        console.error('Firebase 로드 에러:', e);
      }
    }
    try {
      const r = localStorage.getItem(key);
      if (r) return JSON.parse(r);
    } catch {}
    return fallback;
  }
};

// =================================================================
// 2. INTERFACES & INITIAL STATES
// =================================================================

interface BagItem {
  id: string;
  name: string;
  weight: number; // in thirds, e.g. 1/3 is 0.3333
  type: 'tool' | 'reagent' | 'trinket' | 'item';
  qty?: number;
  tags?: string;
  preps?: string;
}

interface ApothecaryBio {
  name: string;
  descriptor: string;
  examples: string;
  travelStyle: string;
  speed: number;
  carry: number;
  originName: string;
  originDesc: string;
  familiarName: string;
  familiarBenefit: string;
  familiarRelation: string;
}

interface ActiveAilment {
  id: string;
  name: string;
  severity: string;
  timer: number;
  maxTimer: number;
  tags: string;
  description: string;
  outcome: string;
  consequence: string;
  foragingPoints: number;
  reagentsGathered: string[];
}

interface GameState {
  bio: ApothecaryBio;
  reputation: number; // starts at 5
  currentLocationName: string;
  currentLocationType: string; // Wilds, Settlement, City, Ruin, Barrow
  currentRegion: string; // Bog, Forest, Loch, Meadow, Mountain, Titan, Barrow
  currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  
  // Inventory
  bag: BagItem[];
  trinkets: string[];

  // Journey details
  journeyActive: boolean;
  journeyDestination: string;
  journeyDistance: string;
  journeyDirection: string;
  journeyGoalTitle: string;
  journeyGoalDesc: string;
  journeyGoalProgress: string;
  calendarDays: number;
  calendarMaxDays: number;
  calendarHistory: string[];

  // Ongoing patient
  activeAilment: ActiveAilment | null;

  // Log history
  journals: { id: string; title: string; text: string; timestamp: number }[];
}

const INITIAL_BIO: ApothecaryBio = {
  name: "",
  descriptor: "Burrowing",
  examples: "오소리, 토끼, 고슴도치, 두더지",
  travelStyle: "Rambling and Ready",
  speed: 3,
  carry: 4,
  originName: "약제사 사고 후의 치료 서비스",
  originDesc: "큰 사고를 당하고 치유를 받으면서 약제사의 길을 걷기로 결심했습니다.",
  familiarName: "",
  familiarBenefit: "따뜻한 약제사 (모든 질병 치료 시작 타이머 +2시간)",
  familiarRelation: "깊은 동반자 (서로 아끼고 의지함)"
};

const INITIAL_BAG: BagItem[] = [
  { id: "tool_knife", name: "벨트 칼 (Belt Knife)", weight: 1/3, type: "tool" },
  { id: "tool_mortar", name: "나무 절구와 공이 (Mortar & Pestle) [GRIND/CRUSH]", weight: 1/3, type: "tool" },
  { id: "tool_kettle", name: "낡은 캠프 주전자 (Camp Kettle) [BOIL/BREW]", weight: 1/3, type: "tool" },
  { id: "tool_jaws", name: "이빨 (Jaws) [CHEW/DIGEST]", weight: 0, type: "tool" },
  { id: "tool_paws", name: "앞발/발톱 (Paws/Claws) [ADD/APPLY]", weight: 0, type: "tool" }
];

const INITIAL_STATE: GameState = {
  bio: INITIAL_BIO,
  reputation: 5,
  currentLocationName: "Starting Oak Road",
  currentLocationType: "Wilds",
  currentRegion: "Forest",
  currentSeason: "Spring",
  bag: INITIAL_BAG,
  trinkets: ["기념품 (Memento)"],
  journeyActive: false,
  journeyDestination: "",
  journeyDistance: "",
  journeyDirection: "",
  journeyGoalTitle: "",
  journeyGoalDesc: "",
  journeyGoalProgress: "",
  calendarDays: 0,
  calendarMaxDays: 12,
  calendarHistory: [],
  activeAilment: null,
  journals: []
};

// =================================================================
// 3. FORMATTING HELPERS
// =================================================================
const formatWeight = (w: number) => {
  if (w <= 0) return "0";
  const thirds = Math.round(w * 3);
  const whole = Math.floor(thirds / 3);
  const rem = thirds % 3;
  if (rem === 0) return `${whole}`;
  if (whole === 0) return `${rem}/3`;
  return `${whole} ${rem}/3`;
};

const getReputationRank = (rep: number) => {
  if (rep >= 35) return { rank: "신뢰받음 (Trusted)", color: "#5c9c6f" };
  if (rep >= 25) return { rank: "명망 높음 (Upstanding)", color: "#6ba6c9" };
  if (rep >= 15) return { rank: "인지도 있음 (Established)", color: "#e59a73" };
  return { rank: "미등록 (Unknown)", color: "#9b9487" };
};

const formatDateTime = (ts: number) => {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
};

const getCardSvgUrl = (suit: string, value: number | string) => {
  let suitPart = "";
  const s = String(suit).toUpperCase();
  if (s.includes("HEART") || s.includes("♥")) suitPart = "HEART";
  else if (s.includes("DIAMOND") || s.includes("♦")) suitPart = "DIAMOND";
  else if (s.includes("CLUB") || s.includes("♣")) suitPart = "CLUB";
  else if (s.includes("SPADE") || s.includes("♠")) suitPart = "SPADE";
  else return "";

  let valNum = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(valNum)) {
    const valStr = String(value).toUpperCase();
    if (valStr.includes("ACE") || valStr === "A") valNum = 1;
    else if (valStr.includes("JACK") || valStr === "J") valNum = 11;
    else if (valStr.includes("QUEEN") || valStr === "Q") valNum = 12;
    else if (valStr.includes("KING") || valStr === "K") valNum = 13;
    else valNum = 1;
  }

  let valPart = "";
  if (valNum === 1) valPart = "1";
  else if (valNum === 11) valPart = "11-JACK";
  else if (valNum === 12) valPart = "12-QUEEN";
  else if (valNum === 13) valPart = "13-KING";
  else valPart = String(valNum);

  return `/cards/${suitPart}-${valPart}.svg`;
};

// =================================================================
// 4. MAIN APP COMPONENT
// =================================================================
export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'play' | 'bio' | 'reagents' | 'ailments' | 'map' | 'rulebook' | 'journals'>('play');
  const [user, setUser] = useState<User | null>(null);
  const [activeTravelEncounter, setActiveTravelEncounter] = useState<any | null>(null);
  const [activeForageEncounter, setActiveForageEncounter] = useState<any | null>(null);

  // Preload card & map images for zero-latency display
  useEffect(() => {
    const suits = ["HEART", "DIAMOND", "CLUB", "SPADE"];
    const values = [
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
      "11-JACK", "12-QUEEN", "13-KING"
    ];
    suits.forEach(suit => {
      values.forEach(val => {
        const img = new Image();
        img.src = `/cards/${suit}-${val}.svg`;
      });
    });
    // Preload maps
    const mapFront = new Image();
    mapFront.src = "/Apawthecaria Map Front.jpg";
    const mapBack = new Image();
    mapBack.src = "/Apawthecaria Map Back.jpg";
  }, []);
  
  // Custom dialogs & edit variables
  const [rulebookPage, setRulebookPage] = useState<number>(5);
  const [searchReagent, setSearchReagent] = useState("");
  const [searchAilment, setSearchAilment] = useState("");
  const [reagentFilter, setReagentFilter] = useState("");
  const [ailmentFilter, setAilmentFilter] = useState("");

  // Map image zoom state
  const [mapScale, setMapScale] = useState(1);
  const [mapType, setMapType] = useState<'front' | 'back'>('front');

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDocRef = doc(db!, 'saves', `uid_${u.uid}`);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && cloudData['apawthecaria_rpg_state']) {
              const parsed = JSON.parse(cloudData['apawthecaria_rpg_state']);
              const localStr = localStorage.getItem('apawthecaria_rpg_state');
              if (localStr) {
                const localParsed = JSON.parse(localStr);
                const isLocalDefault = !localParsed.bio?.name && (!localParsed.journals || localParsed.journals.length === 0);
                if (isLocalDefault || confirm("구글 클라우드에 백업된 아포테카리아 데이터를 발견했습니다. 불러오시겠습니까?\n(불러오면 현재 진행 중인 로컬 데이터는 덮어씌워집니다.)")) {
                  setState(parsed);
                  localStorage.setItem('apawthecaria_rpg_state', JSON.stringify(parsed));
                }
              } else {
                setState(parsed);
                localStorage.setItem('apawthecaria_rpg_state', JSON.stringify(parsed));
              }
            }
          } else {
            const localStr = localStorage.getItem('apawthecaria_rpg_state');
            if (localStr) {
              await setDoc(userDocRef, { 'apawthecaria_rpg_state': localStr }, { merge: true });
            }
          }
        } catch (err) {
          console.error("Failed to check cloud save during login:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Load initial state
  useEffect(() => {
    const loadSave = async () => {
      const loaded = await store.load('apawthecaria_rpg_state', null);
      if (loaded) {
        setState(loaded);
      } else {
        setState(INITIAL_STATE);
      }
      setLoading(false);
    };
    loadSave();
  }, []);

  // Auto-save wrapper
  const updateState = (updater: (prev: GameState) => GameState) => {
    setState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      store.set('apawthecaria_rpg_state', next);
      return next;
    });
  };

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google Sign-in error:", e);
      alert("로그인 중 에러가 발생했습니다: " + e.message);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        const loaded = await store.load('apawthecaria_rpg_state', null);
        if (loaded) {
          setState(loaded);
        } else {
          setState(INITIAL_STATE);
        }
      } catch (e: any) {
        console.error("Sign-out error:", e);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("⚠️ 경고: 정말 모든 진행상황과 연대기를 초기화하고 새로운 아포테카리로 시작하시겠습니까? (저널 일지 기록도 함께 삭제됩니다.)")) {
      updateState(() => INITIAL_STATE);
      setActiveTab('play');
    }
  };

  if (loading || !state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.2rem', background: 'var(--bg-gradient)', color: 'var(--text-bright)' }}>
        <div style={{ fontSize: '3.5rem', animation: 'cute-bounce 2s infinite ease-in-out' }}>🌿</div>
        <h2 style={{ letterSpacing: '0.05em', color: 'var(--primary)' }}>아포테카리아 (Apawthecaria)</h2>
        <p style={{ color: 'var(--text-muted)' }}>풀티스파운더 약초 가방을 싸는 중...</p>
      </div>
    );
  }

  // Calculate current weight
  const currentWeight = state.bag.reduce((acc, item) => acc + (item.weight * (item.qty || 1)), 0);
  const isOverEncumbered = currentWeight > state.bio.carry;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      {/* Header Banner */}
      <header style={{ borderBottom: '1.5px solid var(--glass-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(244, 238, 225, 0.92)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🌿</span>
          <div>
            <h1 className="cute-title" style={{ margin: 0, fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setActiveTab('play')}>
              아포테카리아 (Apawthecaria)
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {state.bio.name ? `${state.bio.name}의 약제 방랑 일지` : '수의 약제사 저널 기록장'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {isFirebaseConfigured && auth && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', background: 'var(--primary-light)', borderRadius: '20px', border: '1.5px solid var(--glass-border)' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '1rem' }}>🐹</span>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{user.displayName || '약제사'}</span>
                <button onClick={handleSignOut} style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={handleSignIn} style={{ padding: '0.4rem 0.8rem', border: '1.5px solid var(--primary)', borderRadius: '20px', background: 'transparent', color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 'bold' }}>
                🔑 Google 로그인 동기화
              </button>
            )
          )}
          <button onClick={handleReset} style={{ padding: '0.4rem 0.8rem', border: '1.5px solid var(--accent-red)', borderRadius: '20px', background: 'transparent', color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
            새 약제사 캐릭터 시작 (초기화)
          </button>
        </div>
      </header>

      <div className="grid-dashboard">
        {/* =================================================================
            SIDEBAR PANEL
           ================================================================= */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Navigation panel */}
          <div className="glass-panel cute-border" style={{ padding: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {[
                { id: 'play', label: '🎮 약제 여정', sub: '진행 및 활동' },
                { id: 'bio', label: '🐹 약제사 시트', sub: '프로필 및 배낭' },
                { id: 'reagents', label: '🌿 영약재 도감', sub: '약초 및 준비법' },
                { id: 'ailments', label: '🤒 질병 도감', sub: '증상 및 처방전' },
                { id: 'map', label: '🗺️ 가시나무 숲', sub: '전체 지도 보기' },
                { id: 'rulebook', label: '📖 한국어 룰북', sub: '페이지 뷰어' },
                { id: 'journals', label: '📝 약제사 일지', sub: '저널 백업 및 기록' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`nav-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{t.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Profile Summary */}
          <div className="glass-panel" style={{ padding: '1.2rem', background: '#fff' }}>
            <h3 style={{ borderBottom: '1.5px dashed var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🐹 캐릭터 요약</span>
              <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: getReputationRank(state.reputation).color, color: '#fff' }}>
                {getReputationRank(state.reputation).rank}
              </span>
            </h3>
            {state.bio.name ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                <div><strong>이름:</strong> {state.bio.name}</div>
                <div><strong>종족:</strong> {state.bio.descriptor} ({state.bio.examples})</div>
                <div><strong>이동 스타일:</strong> {state.bio.travelStyle}</div>
                <div><strong>속도(Speed):</strong> {state.bio.speed} | <strong>명성(Reputation):</strong> {state.reputation}</div>
                
                {state.bio.familiarName && (
                  <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                    🐾 <strong>사역마:</strong> {state.bio.familiarName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>- 특성: {state.bio.familiarBenefit}</div>
                  </div>
                )}
                
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                  🎒 <strong>배낭 무게:</strong> <span style={{ color: isOverEncumbered ? 'var(--accent-red)' : 'var(--primary)', fontWeight: 'bold' }}>{formatWeight(currentWeight)}</span> / {state.bio.carry}
                  {isOverEncumbered && (
                    <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.1rem' }}>
                      ⚠️ 과다적재! 이동 거리가 1일당 1경로로 고정됩니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                [약제사 시트] 탭에서 이름을 작성하고 캐릭터를 잠금해제 하세요!
              </div>
            )}
          </div>

          {/* Current Journey Calendar */}
          <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', background: '#fff' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 여정 일정 및 목적지</span>
            {state.journeyActive ? (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{state.journeyDestination}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>방향: {state.journeyDirection} | 거리: {state.journeyDistance}</div>
                
                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{state.calendarDays}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/</div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{state.calendarMaxDays} 일</div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.8rem' }}>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: s.calendarDays + 1 }))} style={{ flex: 1, padding: '0.3rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem' }}>+1일 경과</button>
                  <button onClick={() => updateState(s => ({ ...s, calendarDays: Math.max(0, s.calendarDays - 1) }))} style={{ padding: '0.3rem 0.5rem', background: '#f5f5f5', color: '#666', borderRadius: '4px', fontSize: '0.8rem' }}>-1</button>
                </div>
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                활성화된 여정이 없습니다.
              </div>
            )}
          </div>
        </aside>

        {/* =================================================================
            MAIN CONTENT VIEWS
           ================================================================= */}
        <main className="glass-panel" style={{ padding: '1.8rem', background: '#fff' }}>
          {activeTab === 'play' && (
            <PlayView 
              state={state} 
              updateState={updateState} 
              currentWeight={currentWeight} 
              activeTravelEncounter={activeTravelEncounter} 
              setActiveTravelEncounter={setActiveTravelEncounter} 
              activeForageEncounter={activeForageEncounter}
              setActiveForageEncounter={setActiveForageEncounter}
            />
          )}
          {activeTab === 'bio' && <BioView state={state} updateState={updateState} currentWeight={currentWeight} />}
          {activeTab === 'reagents' && (
            <ReagentsView
              state={state}
              updateState={updateState}
              search={searchReagent}
              setSearch={setSearchReagent}
              filter={reagentFilter}
              setFilter={setReagentFilter}
            />
          )}
          {activeTab === 'ailments' && (
            <AilmentsView
              state={state}
              updateState={updateState}
              search={searchAilment}
              setSearch={setSearchAilment}
              filter={ailmentFilter}
              setFilter={setAilmentFilter}
            />
          )}
          {activeTab === 'map' && <MapView mapScale={mapScale} setMapScale={setMapScale} mapType={mapType} setMapType={setMapType} />}
          {activeTab === 'rulebook' && <RulebookView page={rulebookPage} setPage={setRulebookPage} />}
          {activeTab === 'journals' && <JournalsView state={state} updateState={updateState} />}
        </main>
      </div>

      {/* Travel Encounter Dialog Modal */}
      {activeTravelEncounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src={getCardSvgUrl(activeTravelEncounter.suit, activeTravelEncounter.cardValue)} 
                alt={`${activeTravelEncounter.suitLabel} ${activeTravelEncounter.cardValue}`}
                style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
              />
              <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>여정 조우 (Page {activeTravelEncounter.page})</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: {activeTravelEncounter.cardValue} {activeTravelEncounter.suitLabel}</div>
            </div>
            
            <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
              {activeTravelEncounter.title}
            </h3>
            
            <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
              {activeTravelEncounter.text}
            </p>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => {
                  // Prompt user to write about this encounter
                  const note = prompt("이 조우에 대해 저널에 한 줄 소감을 남겨주세요 (선택):");
                  if (note !== null) {
                    updateState(s => ({
                      ...s,
                      journals: [
                        {
                          id: 'journal_' + Date.now(),
                          title: `여정 조우: ${activeTravelEncounter.title}`,
                          text: `[페이지 ${activeTravelEncounter.page} - 드로우: ${activeTravelEncounter.cardValue} ${activeTravelEncounter.suitLabel}]\n${activeTravelEncounter.text}\n\n나의 행동: ${note || '묵묵히 길을 나아갔다.'}`,
                          timestamp: Date.now()
                        },
                        ...s.journals
                      ]
                    }));
                  }
                  setActiveTravelEncounter(null);
                }} 
                style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
              >
                저널 기록 및 조우 해결
              </button>
              <button onClick={() => setActiveTravelEncounter(null)} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Foraging Encounter Dialog Modal */}
      {activeForageEncounter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(50, 45, 35, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', background: '#fff', position: 'relative', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src={getCardSvgUrl(activeForageEncounter.suit, activeForageEncounter.cardValue)} 
                alt={`${activeForageEncounter.suitLabel} ${activeForageEncounter.cardValue}`}
                style={{ width: '100px', height: '150px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', marginBottom: '0.8rem' }}
              />
              <h2 style={{ color: 'var(--primary)', margin: '0.5rem 0 0 0' }}>채집 및 조우 (Page {activeForageEncounter.page})</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽑은 카드: {activeForageEncounter.cardValue} {activeForageEncounter.suitLabel}</div>
            </div>
            
            <h3 style={{ borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-bright)' }}>
              {activeForageEncounter.title}
            </h3>
            
            <p style={{ fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', background: '#faf8f4', padding: '1rem', borderRadius: '10px', color: 'var(--text-bright)', borderLeft: '4.5px solid var(--primary)' }}>
              {activeForageEncounter.text}
            </p>

            <div style={{ marginTop: '1rem', background: '#f0f9f4', padding: '1rem', borderRadius: '10px', borderLeft: '4.5px solid var(--secondary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--secondary)', fontSize: '0.95rem' }}>🌿 발견한 영약재 결과</h4>
              {activeForageEncounter.foundReagents.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {activeForageEncounter.foundReagents.map((r: string, idx: number) => (
                    <li key={idx} style={{ color: '#2b5e3d', fontWeight: 'bold' }}>{r}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                  영약재의 희귀도가 뽑은 카드 값보다 높아 발견하지 못했습니다. (+1 채집 포인트 획득)
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => {
                  const note = prompt("채집 조우와 발견한 약초에 대한 저널 기록 소감 (선택):");
                  if (note !== null) {
                    updateState(s => {
                      const listStr = activeForageEncounter.foundReagents.length > 0 ? activeForageEncounter.foundReagents.join(', ') : '없음 (+1 채집포인트)';
                      return {
                        ...s,
                        journals: [
                          {
                            id: 'forage_' + Date.now(),
                            title: `🌿 채집 일지: ${activeForageEncounter.title}`,
                            text: `[페이지 ${activeForageEncounter.page} - 드로우: ${activeForageEncounter.cardValue} ${activeForageEncounter.suitLabel}]\n위치: ${s.currentLocationName} (${activeForageEncounter.region} / ${s.currentSeason})\n조우 결과: ${activeForageEncounter.text}\n발견한 영약재: ${listStr}\n\n기록: ${note || '조심스럽게 약초 채집을 마무리했다.'}`,
                            timestamp: Date.now()
                          },
                          ...s.journals
                        ]
                      };
                    });
                  }
                  setActiveForageEncounter(null);
                }} 
                style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}
              >
                저널 기록 및 조우 해결
              </button>
              <button onClick={() => setActiveForageEncounter(null)} style={{ padding: '0.8rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 5. PLAY VIEW COMPONENT
// =================================================================
function PlayView({ state, updateState, currentWeight, activeTravelEncounter, setActiveTravelEncounter, activeForageEncounter, setActiveForageEncounter }: { state: GameState; updateState: any; currentWeight: number; activeTravelEncounter: any; setActiveTravelEncounter: any; activeForageEncounter: any; setActiveForageEncounter: any }) {
  const [destName, setDestName] = useState("");
  const [destRegion, setDestRegion] = useState("Forest");
  const [destType, setDestType] = useState("Wilds");

  const [newAilmentName, setNewAilmentName] = useState("");

  // Concoction State
  const [selectedBagItems, setSelectedBagItems] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Manual Card Selector State
  const [nextLocName, setNextLocName] = useState("");
  const [travelCardMode, setTravelCardMode] = useState<'random' | 'manual'>('random');
  const [selectedTravelSuit, setSelectedTravelSuit] = useState('♥');
  const [selectedTravelValue, setSelectedTravelValue] = useState(1);

  const [forageCardMode, setForageCardMode] = useState<'random' | 'manual'>('random');
  const [selectedForageSuit, setSelectedForageSuit] = useState('♥');
  const [selectedForageValue, setSelectedForageValue] = useState(1);

  // Timer modifiers based on location type and foraging points
  const handlePassHour = (amt: number = 1) => {
    if (!state.activeAilment) return;
    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      const nextTimer = Math.max(0, s.activeAilment.timer - amt);
      
      let nextAilment = { ...s.activeAilment, timer: nextTimer };
      let newRep = s.reputation;
      let journals = [...s.journals];

      if (nextTimer === 0) {
        // Trigger Consequence
        alert(`💥 시간이 다 되었습니다! 환자의 질병이 악화되어 후과를 받습니다: \n${s.activeAilment.consequence}`);
        // Deduct reputation based on severity
        const loss = s.activeAilment.severity === 'dire' ? 4 : s.activeAilment.severity === 'severe' ? 3 : s.activeAilment.severity === 'intermediate' ? 2 : 1;
        newRep = Math.max(0, s.reputation - loss);
        
        journals.unshift({
          id: 'conseq_' + Date.now(),
          title: `💥 치료 실패 후과: ${s.activeAilment.name}`,
          text: `환자 치료를 완수하지 못하고 시간이 마감되었습니다.\n\n[후과(Consequence)]\n${s.activeAilment.consequence}\n\n길드 명성 점수가 ${loss}점 깎입니다.`,
          timestamp: Date.now()
        });

        nextAilment = null as any;
      }

      return {
        ...s,
        reputation: newRep,
        activeAilment: nextAilment === null ? null : nextAilment,
        journals
      };
    });
  };

  const handleStartJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName) {
      alert("목적지 이름을 적어주세요!");
      return;
    }

    // Goal and Distance Draw
    const suits = ['♥', '♦', '♣', '♠'];
    const suitNames: { [key: string]: string } = { '♥': '북쪽 (North)', '♦': '남쪽 (South)', '♣': '동쪽 (East)', '♠': '서쪽 (West)' };
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const cardVal = Math.floor(Math.random() * 13) + 1; // 1 to 13
    
    let distLabel = "";
    let maxDays = 12;

    if (cardVal <= 6) {
      distLabel = "가까운 거리 (Near) — 12일 경로 이하";
      maxDays = state.reputation >= 35 ? 3 : state.reputation >= 25 ? 6 : state.reputation >= 15 ? 9 : 12;
    } else if (cardVal <= 9) {
      distLabel = "먼 거리 (Far) — 13~24일 경로";
      maxDays = state.reputation >= 35 ? 6 : state.reputation >= 25 ? 9 : state.reputation >= 15 ? 12 : 15;
    } else {
      distLabel = "지평선 너머 (Over the Horizon) — 24일 이상 대도시";
      maxDays = state.reputation >= 35 ? 9 : state.reputation >= 25 ? 12 : state.reputation >= 15 ? 15 : 20;
    }

    // Select random goal
    const goalObj = GAME_DATA.goals[Math.floor(Math.random() * GAME_DATA.goals.length)];

    updateState(s => ({
      ...s,
      journeyActive: true,
      journeyDestination: destName,
      journeyDistance: distLabel,
      journeyDirection: suitNames[randomSuit] || randomSuit,
      journeyGoalTitle: goalObj.title,
      journeyGoalDesc: goalObj.desc,
      journeyGoalProgress: goalObj.goalText,
      calendarDays: 0,
      calendarMaxDays: maxDays,
      calendarHistory: [`여정 시작: ${destName}로 출발! (일수: ${maxDays}일 목표: ${goalObj.title})`],
      journals: [
        {
          id: 'start_' + Date.now(),
          title: `새 여정 시작: ${destName}`,
          text: `${destName}로 출발합니다.\n목표: ${goalObj.title} - ${goalObj.desc}\n해결 일정: ${maxDays}일\n방향: ${suitNames[randomSuit]}`,
          timestamp: Date.now()
        },
        ...s.journals
      ]
    }));

    setDestName("");
  };

  const handleTravelMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.journeyActive) return;
    
    if (!nextLocName) {
      alert("이동할 새 위치의 이름을 적어주세요!");
      return;
    }

    // Mark calendar days: 1 day per move, or speed calculation
    // Speed: standard is Speed. Over Encumbered is always 1 path per day.
    const isOverEncumbered = currentWeight > state.bio.carry;
    const pathsTravelled = isOverEncumbered ? 1 : state.bio.speed;

    // Draw Travel Encounter card
    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = travelCardMode === 'random' 
      ? suits[Math.floor(Math.random() * suits.length)] 
      : selectedTravelSuit;
    const cardVal = travelCardMode === 'random'
      ? Math.floor(Math.random() * 13) + 1
      : selectedTravelValue;
    
    // Map cardVal to look up string
    let cardKey = "";
    if (cardVal === 1) cardKey = "ace & 2";
    else if (cardVal === 2) cardKey = "ace & 2";
    else if (cardVal === 3 || cardVal === 4) cardKey = "3 & 4";
    else if (cardVal === 5 || cardVal === 6) cardKey = "5 & 6";
    else if (cardVal === 7 || cardVal === 8) cardKey = "7 & 8";
    else if (cardVal === 9 || cardVal === 10) cardKey = "9 & 10";
    else if (cardVal === 11) cardKey = "J";
    else cardKey = "M"; // Jack / Monarch

    // Seek the travel encounters list in gameData
    const regionEncounters = GAME_DATA.travelEncounters[destRegion as any] || [];
    // Match based on cardKey
    // Also, seasonal adjustments if multiple exist
    const matchingEncs = regionEncounters.filter((e: any) => e.card === cardKey);
    let selectedEnc = matchingEncs[0] || { title: "호젓한 오솔길", text: "특별한 문제 없이 평화롭게 가시나무 숲 길을 지나갑니다. 주변 약초들의 향기를 맡으며 길을 재촉합니다.", page: 74 };
    
    if (matchingEncs.length > 1) {
      // Choose based on season
      // For J, M, 9 & 10, the rulebook distributes pages by seasons.
      // E.g. Spring is first, Summer second, Autumn third, Winter fourth.
      const seasonIndex = state.currentSeason === 'Spring' ? 0 : state.currentSeason === 'Summer' ? 1 : state.currentSeason === 'Autumn' ? 2 : 3;
      selectedEnc = matchingEncs[seasonIndex % matchingEncs.length] || matchingEncs[0];
    }

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    setActiveTravelEncounter({
      ...selectedEnc,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      region: destRegion,
      locName: nextLocName
    });

    updateState(s => {
      const nextDays = s.calendarDays + 1;
      return {
        ...s,
        currentLocationName: nextLocName,
        currentRegion: destRegion,
        currentLocationType: destType,
        calendarDays: nextDays,
        calendarHistory: [
          ...s.calendarHistory,
          `Day ${nextDays}: ${nextLocName} (${destRegion} / ${destType})로 이동. 속도 기준 ${pathsTravelled}경로 진입.`
        ]
      };
    });

    setNextLocName("");
  };

  // Resolve Ailment Diagnoses
  const handleDiagnoseAilment = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.activeAilment) {
      alert("이미 치료 중인 질병 환자가 있습니다. 먼저 치료제를 Concoct하거나 환자가 악화되길 기다려야 합니다.");
      return;
    }

    const chosenName = newAilmentName.trim();
    if (!chosenName) {
      alert("질병명을 골라주세요!");
      return;
    }

    // Seek in database
    const dbAil = GAME_DATA.ailments.find(a => a.name.toLowerCase().includes(chosenName.toLowerCase()) || a.rawName.toLowerCase().includes(chosenName.toLowerCase()));
    
    if (!dbAil) {
      alert("해당 질병을 도감에서 찾을 수 없습니다. 도감 탭에서 이름을 참고해 주세요.");
      return;
    }

    const startTimer = dbAil.timer + (state.bio.familiarBenefit.includes("따뜻한 치유사") ? 2 : 0);

    updateState(s => ({
      ...s,
      activeAilment: {
        id: 'ail_' + Date.now(),
        name: dbAil.name,
        severity: dbAil.severity,
        timer: startTimer,
        maxTimer: startTimer,
        tags: dbAil.tags,
        description: dbAil.description,
        outcome: dbAil.outcome,
        consequence: dbAil.consequence,
        foragingPoints: state.bio.familiarBenefit.includes("예리한 관찰자") ? 2 : 0,
        reagentsGathered: []
      },
      journals: [
        {
          id: 'diag_' + Date.now(),
          title: `🤒 새로운 환자 진단: ${dbAil.name}`,
          text: `환자를 진단했습니다: ${dbAil.name} (${dbAil.severity} 난이도)\n- 필요 약효 태그: ${dbAil.tags}\n- 치료 기한 타이머: ${startTimer}시간\n\n[질병 증상 설명]\n${dbAil.description}`,
          timestamp: Date.now()
        },
        ...s.journals
      ]
    }));

    setNewAilmentName("");
  };

  // Foraging Drawing Resolution
  const handleForageDraw = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!state.activeAilment) return;
    
    const suits = ['♥', '♦', '♣', '♠'];
    const drawnSuit = forageCardMode === 'random'
      ? suits[Math.floor(Math.random() * suits.length)]
      : selectedForageSuit;
    const cardVal = forageCardMode === 'random'
      ? Math.floor(Math.random() * 13) + 1
      : selectedForageValue;

    // Resolve Foraging Event
    const regionForage = GAME_DATA.foragingEncounters[state.currentRegion as any] || [];
    
    let cardKey = String(cardVal);
    if (cardVal === 1) cardKey = "ace & 2";
    else if (cardVal === 2) cardKey = "ace & 2";
    else if (cardVal === 3 || cardVal === 4) cardKey = "3 & 4";
    else if (cardVal === 5 || cardVal === 6) cardKey = "5 & 6";
    else if (cardVal === 7 || cardVal === 8) cardKey = "7 & 8";
    else if (cardVal === 9 || cardVal === 10) cardKey = "9 & 10";
    else if (cardVal === 11) cardKey = "J";
    else cardKey = "M";

    const matchingFEnc = regionForage.filter((fe: any) => fe.card === cardKey);
    let selectedFEnc = matchingFEnc[0] || { title: "조용히 풀을 뜯다", text: "위험을 만나지 않고 무사히 채집을 진행합니다.", page: 153 };
    
    if (matchingFEnc.length > 1) {
      const seasonIdx = state.currentSeason === 'Spring' ? 0 : state.currentSeason === 'Summer' ? 1 : state.currentSeason === 'Autumn' ? 2 : 3;
      selectedFEnc = matchingFEnc[seasonIdx % matchingFEnc.length];
    }

    // Search reagents native to the current region
    const localReagents = GAME_DATA.reagents.filter(r => {
      // Locs string matches current region initials (e.g. b: Bog, f: Forest, l: Loch, g: Meadow, m: Mountain, t: Titan)
      const regMap: { [key: string]: string } = { "Bog": "b", "Forest": "f", "Loch": "l", "Meadow": "g", "Mountain": "m", "Titan": "t" };
      const regChar = regMap[state.currentRegion] || "";
      return r.locs.includes(regChar);
    });

    // Pick a list of reagents found
    const foundReagents: string[] = [];
    localReagents.forEach(r => {
      // Rarity is calculated
      // Common if in season, Rare if out of season
      // Check if season matches
      const seasonMap: { [key: string]: string } = { "Spring": "p", "Summer": "s", "Autumn": "a", "Winter": "w" };
      const seasonChar = seasonMap[state.currentSeason] || "";
      const isInSeason = r.locs.includes(seasonChar);
      
      let finalRarity = r.br + (isInSeason ? 0 : 3);
      if (state.bio.familiarBenefit.includes("덤불 마스터") && r.type === 'plant') {
        finalRarity = Math.max(1, finalRarity - 2);
      }
      if (state.bio.familiarBenefit.includes("유적/고분 마스터") && r.type === 'titan') {
        finalRarity = Math.max(1, finalRarity - 2);
      }

      if (cardVal >= finalRarity) {
        foundReagents.push(`${r.name} (희귀도: ${finalRarity})`);
      }
    });

    const suitLabels: { [key: string]: string } = { '♥': '하트 ♥', '♦': '다이아 ♦', '♣': '클로버 ♣', '♠': '스페이드 ♠' };

    setActiveForageEncounter({
      title: selectedFEnc.title,
      text: selectedFEnc.text,
      page: selectedFEnc.page,
      cardValue: cardVal === 1 ? 'Ace' : cardVal === 11 ? 'Jack' : cardVal === 12 ? 'Queen' : cardVal === 13 ? 'King' : cardVal,
      suitLabel: suitLabels[drawnSuit],
      suit: drawnSuit,
      foundReagents: foundReagents,
      region: state.currentRegion,
      season: state.currentSeason
    });

    // Update state: Add foraging point if not found
    updateState((s: GameState) => {
      if (!s.activeAilment) return s;
      let nextPoints = s.activeAilment.foragingPoints + (foundReagents.length === 0 ? 1 : 0);
      return {
        ...s,
        activeAilment: {
          ...s.activeAilment,
          foragingPoints: nextPoints
        }
      };
    });

    // Pass hour (timer countdown)
    handlePassHour(1); // 1 hour for current location foraging
  };

  // Bartering Resolution
  const handleBarterAttempt = (reagentName: string) => {
    if (!state.activeAilment) return;
    const r = GAME_DATA.reagents.find(item => item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));
    
    if (!r) {
      alert("해당 이름의 영약재를 찾을 수 없습니다.");
      return;
    }

    // Rarity calculation
    const isCity = state.currentLocationType === 'City';
    const isSettlement = state.currentLocationType === 'Settlement';
    if (!isCity && !isSettlement) {
      alert("물꼬 거래는 정착지(Settlement)나 도시(City)에서만 가능합니다.");
      return;
    }

    const seasonMap: { [key: string]: string } = { "Spring": "p", "Summer": "s", "Autumn": "a", "Winter": "w" };
    const seasonChar = seasonMap[state.currentSeason] || "";
    const isInSeason = r.locs.includes(seasonChar);

    let finalRarity = r.br + (isInSeason ? -1 : 2);
    // Guild Reputation impact
    if (state.reputation >= 35) finalRarity -= 2;
    else if (state.reputation >= 25) finalRarity -= 1;
    else if (state.reputation < 15) finalRarity += 1;

    if (state.bio.familiarBenefit.includes("말동무")) {
      finalRarity = Math.max(1, finalRarity - 2);
    }

    const cardVal = Math.floor(Math.random() * 13) + 1;
    const success = cardVal >= finalRarity;

    if (success) {
      alert(`🤝 거래 성공! 카드 값: ${cardVal} (목표 희귀도: ${finalRarity})\n${r.name}을 가방에 넣습니다!`);
      // Add Reagent Part to bag
      updateState(s => {
        const itemId = 'item_' + Date.now();
        const firstPart = r.preps.split(']')[0] ? r.preps.split(']')[0] + ']' : 'Reagent Part';
        const newBagItem: BagItem = {
          id: itemId,
          name: `${r.name} (Part: ${firstPart})`,
          weight: 1/3,
          type: 'reagent',
          qty: 1,
          preps: r.preps
        };
        return {
          ...s,
          bag: [...s.bag, newBagItem],
          journals: [
            {
              id: 'barter_' + Date.now(),
              title: `🤝 거래 성사: ${r.name}`,
              text: `${state.currentLocationName}에서 ${r.name}을 거래했습니다. (드로우: ${cardVal} >= Rarity: ${finalRarity})`,
              timestamp: Date.now()
            },
            ...s.journals
          ]
        };
      });
    } else {
      const diff = finalRarity - cardVal;
      const payTrinket = confirm(`거래 실패 (카드 값: ${cardVal} < Rarity: ${finalRarity}).\n장신구(Trinket) ${diff}개를 지불해 물꼬를 성사시키겠습니까?`);
      if (payTrinket) {
        // Deduct trinkets if possible
        // Since trinkets are a list of strings, let's see if we have enough
        if (state.trinkets.length >= diff) {
          updateState(s => {
            const nextTrinkets = [...s.trinkets];
            nextTrinkets.splice(0, diff); // remove diff items
            
            const itemId = 'item_' + Date.now();
            const firstPart = r.preps.split(']')[0] ? r.preps.split(']')[0] + ']' : 'Reagent Part';
            const newBagItem: BagItem = {
              id: itemId,
              name: `${r.name} (Part: ${firstPart})`,
              weight: 1/3,
              type: 'reagent',
              qty: 1,
              preps: r.preps
            };

            return {
              ...s,
              trinkets: nextTrinkets,
              bag: [...s.bag, newBagItem],
              journals: [
                {
                  id: 'barter_buy_' + Date.now(),
                  title: `🤝 거래 강제 성사: ${r.name}`,
                  text: `${state.currentLocationName}에서 장신구 ${diff}개를 건네주며 수소문 끝에 ${r.name}을 구매했습니다.`,
                  timestamp: Date.now()
                },
                ...s.journals
              ]
            };
          });
        } else {
          alert("장신구가 부족합니다! 물꼬 거래에 실패해 빈손으로 돌아옵니다.");
        }
      }
    }

    handlePassHour(1); // Bartering takes 1 hour
  };

  // Add Foraged item directly (Manual collection)
  const handleCollectReagent = (reagentName: string) => {
    const r = GAME_DATA.reagents.find(item => item.name.toLowerCase().includes(reagentName.toLowerCase()) || item.rawName.toLowerCase().includes(reagentName.toLowerCase()));
    if (!r) {
      alert("영약재 이름을 도감에서 찾을 수 없습니다.");
      return;
    }

    // Split preps by lines or commas to show parts
    const parts = r.preps.split(/(?=⅓|⅔|1\s)/);
    const chosenPart = prompt(`원하는 영약재 부위를 번호로 선택하세요:\n${parts.map((p, i) => `${i+1}. ${p.trim()}`).join('\n')}`);
    
    if (!chosenPart) return;
    const partIdx = parseInt(chosenPart) - 1;
    const partText = parts[partIdx] || parts[0];

    updateState(s => {
      const itemId = 'reag_' + Date.now();
      const newItem: BagItem = {
        id: itemId,
        name: `${r.name} (${partText.trim()})`,
        weight: 1/3,
        type: 'reagent',
        qty: 1,
        preps: r.preps
      };
      return {
        ...s,
        bag: [...s.bag, newItem]
      };
    });
  };

  // Concoction remedy checker
  const handleConcoctRemedy = () => {
    if (!state.activeAilment) return;

    if (selectedBagItems.length === 0) {
      alert("치료제로 조제할 영약재들을 가방에서 선택해주세요!");
      return;
    }

    // Check what properties the combined reagents have under selected tools
    // Tool maps:
    // grind/crush -> Mortar & Pestle
    // boil/brew -> Kettle
    // chew/digest -> Jaws
    // add/apply -> Paws/Claws
    
    // In Apawthecaria, you must match the required Ailment symptom tags (e.g. pain 2, infection 1)
    // with your prepared reagents.
    // Let's summarize the active ailment symptoms:
    alert(`💊 치료제 조제 검토:\n환자 증상 태그: ${state.activeAilment.tags}\n\n모든 약효가 만족되면 환자가 치료됩니다.\n환자 완치 시 난이도에 해당하는 Trinket과 Guild Reputation을 얻습니다.`);

    // Perform manual/roleplay concoction: Ask player if they are satisfied
    const ok = confirm("선택한 영약재와 도구들의 처방 조건이 충족되었다고 판단하십니까?\n(예를 들어, [감염 1 & 통증 1]에 발썩음병 환자를 위해 쐐기풀을 주전자에 끓여 감염 1을 채우고, 쇠뜨기를 찧어 상처를 발라준 경우 등)");

    if (ok) {
      // Clear Ailment & Gain Rewards
      const severity = state.activeAilment.severity;
      const repGain = severity === 'dire' ? 4 : severity === 'severe' ? 3 : severity === 'intermediate' ? 2 : 1;
      const trinketGain = severity === 'dire' ? 4 : severity === 'severe' ? 3 : severity === 'intermediate' ? 2 : 1;

      updateState(s => {
        // Discard the used items from bag
        const nextBag = s.bag.filter(item => !selectedBagItems.includes(item.id));
        
        // Add Trinkets (as strings)
        const earnedTrinkets = Array(trinketGain).fill("치료 보상 장신구 (Trinket)");
        const nextTrinkets = [...s.trinkets, ...earnedTrinkets];
        
        // Boost reputation
        const nextRep = s.reputation + repGain;

        return {
          ...s,
          bag: nextBag,
          trinkets: nextTrinkets,
          reputation: nextRep,
          activeAilment: null,
          journals: [
            {
              id: 'cure_' + Date.now(),
              title: `🎉 완치 완료: ${s.activeAilment!.name}`,
              text: `${s.currentLocationName}에서 환자의 치료를 마쳤습니다!\n- 사용 약초: ${selectedBagItems.map(id => s.bag.find(i=>i.id===id)?.name || '영약재').join(', ')}\n- 획득 보상: 장신구 +${trinketGain}개, 길드 명성 점수 +${repGain}점`,
              timestamp: Date.now()
            },
            ...s.journals
          ]
        };
      });

      setSelectedBagItems([]);
      alert("🎉 치료에 성공하여 환자가 가벼운 발걸음으로 물러났습니다! 보상을 획득하고 명성이 올랐습니다.");
    }
  };

  const handleEndJourney = () => {
    if (!state.journeyActive) return;

    if (confirm("여정 목적지에 무사히 도달하여 이 챕터를 마감하시겠습니까?\n달력 일정 내에 도착했는지 확인하고 저널에 마무리 소감을 정리하게 됩니다.")) {
      updateState(s => {
        const isOntime = s.calendarDays <= s.calendarMaxDays;
        return {
          ...s,
          journeyActive: false,
          calendarDays: 0,
          journals: [
            {
              id: 'end_' + Date.now(),
              title: `🏁 여정 마감: ${s.journeyDestination}`,
              text: `${s.journeyDestination}로의 모험을 끝마쳤습니다.\n- 총 이동 일수: ${s.calendarDays}일 (제한기한: ${s.calendarMaxDays}일 - ${isOntime ? '기한 내 성공!' : '지각 도착'})\n- 달성 여정 목표: ${s.journeyGoalTitle}`,
              timestamp: Date.now()
            },
            ...s.journals
          ]
        };
      });

      alert("🏁 여정이 마감되었습니다! [약제사 일지] 또는 아래의 정산 프롬프트를 보며 휴식기(Downtime) 활동을 이어나가세요.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. If journey is NOT active */}
      {!state.journeyActive && (
        <div className="cute-card" style={{ background: '#fff9ef', border: '1.5px solid var(--secondary)' }}>
          <h2 style={{ color: 'var(--secondary)' }}>🧭 새로운 여정 떠나기 (New Journey)</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            브리슬리 우즈(가시나무 숲)의 지도를 열고 어디로 가야할 지, 이번 여행의 목표는 무엇일지 의도를 설정합니다.
          </p>
          
          <form onSubmit={handleStartJourney} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label><strong>📍 도착 목표 정착지/도시 명칭:</strong></label>
              <input 
                type="text" 
                placeholder="예: Odoak (숲 도시), Glasswall (산맥 도시)" 
                value={destName}
                onChange={e => setDestName(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              style={{ padding: '0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              🎲 목적지 카드 드로우 및 여행 출발!
            </button>
          </form>
        </div>
      )}

      {/* 2. Active Journey Dashboard */}
      {state.journeyActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active stats panel */}
          <div className="cute-card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
            <h2 style={{ color: 'var(--primary)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏃‍♂️ 활성화된 방랑 여정</span>
              <button 
                onClick={handleEndJourney} 
                style={{ padding: '0.4rem 0.8rem', background: 'var(--secondary)', color: '#fff', borderRadius: '20px', fontSize: '0.85rem' }}
              >
                🏁 여정 도착지 도달 (마감)
              </button>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.95rem' }}>
              <div>
                <strong>📍 목적지:</strong> {state.journeyDestination} ({state.journeyDistance}) <br />
                <strong>🧭 방향:</strong> {state.journeyDirection} <br />
                <strong>📅 현재 누적 경과일:</strong> {state.calendarDays} / {state.calendarMaxDays} 일
              </div>
              <div style={{ background: '#ffffff', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <strong>🎯 여정 수행 목표: {state.journeyGoalTitle}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{state.journeyGoalDesc}</p>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>수행 과제: {state.journeyGoalProgress}</div>
              </div>
            </div>
          </div>

          {/* Current location and movement form */}
          <div className="cute-card">
            <h3>📍 현재 머무는 곳: <span style={{ color: 'var(--primary)' }}>{state.currentLocationName}</span></h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>지역: <strong>{state.currentRegion}</strong></span>
              <span>지형 종류: <strong>{state.currentLocationType}</strong></span>
              <span>계절: 
                <select 
                  value={state.currentSeason} 
                  onChange={e => updateState(s => ({ ...s, currentSeason: e.target.value as any }))}
                  style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.85rem', marginLeft: '5px' }}
                >
                  <option value="Spring">🌸 봄 (Spring)</option>
                  <option value="Summer">☀️ 여름 (Summer)</option>
                  <option value="Autumn">🍂 가을 (Autumn)</option>
                  <option value="Winter">❄️ 겨울 (Winter)</option>
                </select>
              </span>
            </div>

            {/* Travel Form */}
            <form onSubmit={handleTravelMove} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
              <input 
                name="locName" 
                type="text" 
                placeholder="이동해 도달할 새 장소 이름..." 
                value={nextLocName}
                onChange={e => setNextLocName(e.target.value)}
              />
              
              <select value={destRegion} onChange={e => setDestRegion(e.target.value)}>
                <option value="Forest">🌿 Forest (숲)</option>
                <option value="Meadow">🌾 Meadow (초원)</option>
                <option value="Loch">💧 Loch (호수/강)</option>
                <option value="Bog">🪵 Bog (수렁)</option>
                <option value="Mountain">🏔️ Mountain (산맥)</option>
                <option value="Titan">⚙️ Titan (티탄 유적)</option>
                <option value="Soar">🦅 Soar (비행 하늘)</option>
              </select>

              <select value={destType} onChange={e => setDestType(e.target.value)}>
                <option value="Wilds">야생 (Wilds)</option>
                <option value="Settlement">정착지 (Settlement)</option>
                <option value="City">대도시 (City)</option>
                <option value="Ruin">유적지 (Ruin)</option>
                <option value="Barrow">야수 고분 (Barrow)</option>
              </select>

              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>
                🚶‍♂️ 경로 이동 및 카드 조우
              </button>

              <div style={{ gridColumn: 'span 4', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', background: '#faf8f5', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <strong>🃏 조우 드로우 방식:</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input type="radio" checked={travelCardMode === 'random'} onChange={() => setTravelCardMode('random')} />
                  🎲 랜덤 드로우 (무작위)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input type="radio" checked={travelCardMode === 'manual'} onChange={() => setTravelCardMode('manual')} />
                  🎴 수동 카드 선택
                </label>
                {travelCardMode === 'manual' && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', alignItems: 'center' }}>
                    <span>문양:</span>
                    <select value={selectedTravelSuit} onChange={e => setSelectedTravelSuit(e.target.value)} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                      <option value="♥">하트 ♥ (북쪽)</option>
                      <option value="♦">다이아 ♦ (남쪽)</option>
                      <option value="♣">클로버 ♣ (동쪽)</option>
                      <option value="♠">스페이드 ♠ (서쪽)</option>
                    </select>
                    <span>값:</span>
                    <select value={selectedTravelValue} onChange={e => setSelectedTravelValue(Number(e.target.value))} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                      <option value={1}>A (Ace)</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                      <option value={7}>7</option>
                      <option value={8}>8</option>
                      <option value={9}>9</option>
                      <option value={10}>10</option>
                      <option value={11}>J (Jack)</option>
                      <option value={12}>Q (Queen)</option>
                      <option value={13}>K (King)</option>
                    </select>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* 3. Ailment Patient Care Section */}
          <div className="cute-card" style={{ border: '1.5px solid var(--accent-purple)' }}>
            <h3 style={{ color: 'var(--accent-purple)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🤒 환자 약제소 (Patient Clinic)</span>
              {state.activeAilment && (
                <span style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>⏱️ 치료 완료 기한: <strong>{state.activeAilment.timer} 시간 남음</strong></span>
              )}
            </h3>

            {!state.activeAilment ? (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  현재 돌보는 환자가 없습니다. 정착지나 야생에서 만난 환자의 질병을 도감에서 검색해 진단하세요.
                </p>
                <form onSubmit={handleDiagnoseAilment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                  <input 
                    type="text" 
                    placeholder="질병 이름 입력 (예: 발썩음병, 귀 막힘증...)" 
                    value={newAilmentName}
                    onChange={e => setNewAilmentName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" style={{ padding: '0.6rem 1rem', background: 'var(--accent-purple)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>
                    🏥 진단 및 타이머 작동
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{state.activeAilment.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '2px' }}>등급: {state.activeAilment.severity.toUpperCase()}</div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', background: '#fcfaf6', padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                      {state.activeAilment.description}
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem' }}>
                      💊 <strong>필요 약효 성분:</strong>
                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {state.activeAilment.tags.split(/[,&]+/).map((t, i) => (
                          <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#ffebeb', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                      🧺 <strong>누적 채집 포인트:</strong> <strong style={{ color: 'var(--primary)' }}>{state.activeAilment.foragingPoints} FP</strong>
                    </div>
                  </div>
                </div>

                {/* Foraging Drawing selector */}
                <div style={{ margin: '0.8rem 0', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', background: '#faf8f5', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', width: '100%' }}>
                  <strong>🃏 채집 드로우 방식:</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input type="radio" checked={forageCardMode === 'random'} onChange={() => setForageCardMode('random')} />
                    🎲 랜덤 드로우 (무작위)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input type="radio" checked={forageCardMode === 'manual'} onChange={() => setForageCardMode('manual')} />
                    🎴 수동 카드 선택
                  </label>
                  {forageCardMode === 'manual' && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', alignItems: 'center' }}>
                      <span>문양:</span>
                      <select value={selectedForageSuit} onChange={e => setSelectedForageSuit(e.target.value)} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                        <option value="♥">하트 ♥</option>
                        <option value="♦">다이아 ♦</option>
                        <option value="♣">클로버 ♣</option>
                        <option value="♠">스페이드 ♠</option>
                      </select>
                      <span>값:</span>
                      <select value={selectedForageValue} onChange={e => setSelectedForageValue(Number(e.target.value))} style={{ padding: '0.2rem', fontSize: '0.8rem' }}>
                        <option value={1}>A (Ace)</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                        <option value={11}>J (Jack)</option>
                        <option value={12}>Q (Queen)</option>
                        <option value={13}>K (King)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Foraging and Bartering buttons */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                  <button 
                    onClick={(e) => handleForageDraw(e)}
                    style={{ flex: 1, padding: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    🌿 이 위치 채집 및 조우 (Draw Forage)
                  </button>
                  
                  <button 
                    onClick={() => {
                      const req = prompt("수소문하여 구매할 영약재 이름을 입력하세요 (예: 너도밤나무):");
                      if (req) handleBarterAttempt(req);
                    }}
                    style={{ flex: 1, padding: '0.7rem', background: 'var(--secondary-light)', color: 'var(--secondary)', border: '1.5px solid var(--secondary)', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    🤝 정착지/도시 물꼬 거래 (Barter)
                  </button>

                  <button 
                    onClick={() => {
                      const req = prompt("발견(채집완료) 처리할 영약재 이름을 입력하세요 (예: 너도밤나무):");
                      if (req) handleCollectReagent(req);
                    }}
                    style={{ padding: '0.7rem 1rem', background: '#f5f5f5', color: '#555', borderRadius: '8px' }}
                  >
                    🧺 수작업 영약재 획득
                  </button>

                  <button 
                    onClick={() => handlePassHour(1)}
                    style={{ padding: '0.7rem 1.2rem', background: '#eee', color: '#555', borderRadius: '8px' }}
                  >
                    ⏱️ 1시간 흘려보내기
                  </button>
                </div>

                {/* Concocting Remedy Panel */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                  <h4>🔬 치료제 조제하기 (Concoct Remedy)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    가방 속 영약재들을 도구를 사용하여 가공한 뒤 환자의 증상을 치료해 치료제를 만듭니다.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Reagents selection */}
                    <div style={{ background: '#fafafa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '180px', overflowY: 'auto' }}>
                      <strong style={{ fontSize: '0.85rem' }}>🎒 가방 내 영약재 선택:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {state.bag.filter(item => item.type === 'reagent').length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>가방에 쓸 수 있는 영약재가 없습니다.</span>
                        ) : (
                          state.bag.filter(item => item.type === 'reagent').map(item => (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={selectedBagItems.includes(item.id)}
                                onChange={e => {
                                  if (e.target.checked) setSelectedBagItems([...selectedBagItems, item.id]);
                                  else setSelectedBagItems(selectedBagItems.filter(id => id !== item.id));
                                }}
                              />
                              {item.name}
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Tools selection */}
                    <div style={{ background: '#fafafa', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <strong style={{ fontSize: '0.85rem' }}>⚒️ 사용할 기본 도구/조제법:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {state.bag.filter(item => item.type === 'tool').map(item => (
                          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={selectedTools.includes(item.id)}
                              onChange={e => {
                                if (e.target.checked) setSelectedTools([...selectedTools, item.id]);
                                else setSelectedTools(selectedTools.filter(id => id !== item.id));
                              }}
                            />
                            {item.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleConcoctRemedy}
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem' }}
                  >
                    🧪 치료제 완성하기 (Concoct Remedy)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// 6. CHARACTER SHEET (BIO & BAGS) VIEW
// =================================================================
function BioView({ state, updateState, currentWeight }: { state: GameState; updateState: any; currentWeight: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.bio.name);
  const [familiarName, setFamiliarName] = useState(state.bio.familiarName);

  const [newTrinket, setNewTrinket] = useState("");
  const [newBagItemName, setNewBagItemName] = useState("");
  const [newBagItemWeight, setNewBagItemWeight] = useState<number>(1/3);

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    updateState(s => ({
      ...s,
      bio: {
        ...s.bio,
        name,
        familiarName
      }
    }));
    setEditing(false);
    alert("캐릭터 프로필이 저장되었습니다.");
  };

  const handleAddTrinket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrinket.trim()) return;
    updateState(s => ({
      ...s,
      trinkets: [...s.trinkets, newTrinket.trim()]
    }));
    setNewTrinket("");
  };

  const handleAddBagItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBagItemName.trim()) return;
    updateState(s => {
      const newItem: BagItem = {
        id: 'user_item_' + Date.now(),
        name: newBagItemName.trim(),
        weight: newBagItemWeight,
        type: 'item',
        qty: 1
      };
      return {
        ...s,
        bag: [...s.bag, newItem]
      };
    });
    setNewBagItemName("");
  };

  const handleRemoveBagItem = (id: string) => {
    if (confirm("이 아이템을 가방에서 버리시겠습니까?")) {
      updateState(s => ({
        ...s,
        bag: s.bag.filter(item => item.id !== id)
      }));
    }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>👤 약제사 캐릭터 시트</h2>
      
      {!editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Bio display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3>📋 캐릭터 인적사항</h3>
            <div><strong>이름:</strong> {state.bio.name || '미등록'}</div>
            <div><strong>종족:</strong> {state.bio.descriptor} ({state.bio.examples})</div>
            <div><strong>약제사 출발 동기:</strong> <br /><span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{state.bio.originName} - {state.bio.originDesc}</span></div>
            <div><strong>사역마/메신저:</strong> {state.bio.familiarName || '없음'}</div>
            <div><strong>사역마 관계:</strong> {state.bio.familiarRelation}</div>
            <div><strong>사역마 조력 효과:</strong> <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{state.bio.familiarBenefit}</span></div>
            <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', marginTop: '1rem', width: 'fit-content' }}>
              🔧 프로필 수정하기
            </button>
          </div>

          {/* Bags & Weight */}
          <div>
            <h3>🎒 배낭 보관함 ({formatWeight(currentWeight)} / {state.bio.carry} Weight)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '250px', overflowY: 'auto', background: '#faf8f4', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid var(--glass-border)' }}>
              {state.bag.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.3rem 0.5rem', background: '#fff', borderRadius: '6px', border: '1px solid #eee' }}>
                  <span>{item.name} <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>(무게: {formatWeight(item.weight)})</span></span>
                  {!item.id.startsWith("tool_") && (
                    <button onClick={() => handleRemoveBagItem(item.id)} style={{ background: 'transparent', color: 'var(--accent-red)', border: 'none', cursor: 'pointer' }}>❌ 버리기</button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom item to bag */}
            <form onSubmit={handleAddBagItem} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.4rem', marginTop: '0.8rem' }}>
              <input 
                type="text" 
                placeholder="가방에 넣을 물품/영약재 수동 추가..." 
                value={newBagItemName}
                onChange={e => setNewBagItemName(e.target.value)}
              />
              <select value={newBagItemWeight} onChange={e => setNewBagItemWeight(parseFloat(e.target.value))}>
                <option value={0.3333333333333333}>무게 1/3</option>
                <option value={0.6666666666666666}>무게 2/3</option>
                <option value={1.0}>무게 1.0</option>
                <option value={0.0}>무게 없음 (0)</option>
              </select>
              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '6px' }}>🎒 넣기</button>
            </form>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveBio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxWidth: '500px' }}>
          <h3>🔧 프로필 편집</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>약제사 이름:</strong></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="약제사 동물의 이름을 지어주세요" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label><strong>사역마 이름:</strong></label>
            <input type="text" value={familiarName} onChange={e => setFamiliarName(e.target.value)} placeholder="사역마 친구의 이름을 지어주세요" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>저장</button>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '0.6rem 1.2rem', background: '#ccc', color: '#333', borderRadius: '8px' }}>취소</button>
          </div>
        </form>
      )}

      {/* Trinkets section */}
      <div style={{ marginTop: '2.5rem', borderTop: '1.5px solid var(--glass-border)', paddingTop: '1.5rem' }}>
        <h3>🪙 획득한 장신구 목록 (Trinkets - 물꼬 화폐)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          가시나무 숲에는 표준 화폐가 없습니다. 대신 장신구나 소문, 우정으로 거래합니다. 치료 완치 시 획득합니다.
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {state.trinkets.map((t, idx) => (
            <span key={idx} style={{ padding: '0.4rem 0.8rem', background: '#fff9ef', border: '1px solid var(--secondary)', color: 'var(--secondary-hover)', borderRadius: '20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              🪙 {t}
              <button 
                onClick={() => {
                  if (confirm("이 장신구를 소모합니까?")) {
                    updateState(s => {
                      const next = [...s.trinkets];
                      next.splice(idx, 1);
                      return { ...s, trinkets: next };
                    });
                  }
                }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                ✖
              </button>
            </span>
          ))}
          {state.trinkets.length === 0 && <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>보유한 장신구가 없습니다.</span>}
        </div>

        <form onSubmit={handleAddTrinket} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="장신구 아이템 획득 수동 입력..." 
            value={newTrinket}
            onChange={e => setNewTrinket(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--secondary)', color: '#fff', borderRadius: '6px' }}>🪙 추가</button>
        </form>
      </div>
    </div>
  );
}

// =================================================================
// 7. REAGENTS VIEW COMPONENT
// =================================================================
function ReagentsView({ state, updateState, search, setSearch, filter, setFilter }: { state: GameState; updateState: any; search: string; setSearch: any; filter: string; setFilter: any }) {
  const filtered = GAME_DATA.reagents.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || r.preps.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>🌿 영약재 도감 (Reagents Almanack)</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        각 영약재 부위는 특정한 조제법(빻기, 끓이기, 바르기 등)을 통과해 질병 증상을 Soothe(치료)할 수 있는 고유 약효를 냅니다.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input 
          type="text" 
          placeholder="영약재 이름 검색..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">전체 치료 효과</option>
          <option value="pain">통증 (Pain)</option>
          <option value="wound">상처 (Wound)</option>
          <option value="infection">감염 (Infection)</option>
          <option value="parasite">기생충 (Parasite)</option>
          <option value="senses">감각 (Senses)</option>
          <option value="sleep">수면 (Sleep)</option>
          <option value="breath">호흡 (Breath)</option>
          <option value="burn">화상 (Burn)</option>
          <option value="fur">털 (Fur)</option>
          <option value="feather">깃털 (Feather)</option>
          <option value="hide">가죽 (Hide)</option>
          <option value="scale">비늘 (Scale)</option>
          <option value="poison">독 (Poison)</option>
          <option value="stomach">위장 (Stomach)</option>
          <option value="temperature">체온 (Temperature)</option>
          <option value="joy">기쁨 (Joy)</option>
          <option value="mood">기분 (Mood)</option>
          <option value="instinct">본능 (Instinct)</option>
          <option value="elsewhere">저편 (Elsewhere)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
        {filtered.map((r, i) => (
          <div key={i} className="cute-card" style={{ background: '#fafafa' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{r.name}</span>
              <span style={{ fontSize: '0.8rem', background: '#eee', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#555' }}>
                기본 희귀도 (BR): {r.br}
              </span>
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              분류: {r.type} | 지역/계절코드: {r.locs}
            </div>
            
            <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', background: '#fff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #eee' }}>
              <strong>📋 부위별 조제 성분:</strong>
              <div style={{ marginTop: '0.3rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{r.preps}</div>
            </div>

            {state.journeyActive && (
              <button 
                onClick={() => {
                  updateState(s => {
                    const item: BagItem = {
                      id: 'user_reag_' + Date.now(),
                      name: `${r.name} (수동 채집)`,
                      weight: 1/3,
                      type: 'reagent',
                      qty: 1,
                      preps: r.preps
                    };
                    return {
                      ...s,
                      bag: [...s.bag, item]
                    };
                  });
                  alert(`${r.name}을 수동으로 배낭에 추가했습니다.`);
                }}
                style={{ width: '100%', padding: '0.3rem', marginTop: '0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                🧺 배낭에 수동 획득 추가
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// 8. AILMENTS VIEW COMPONENT
// =================================================================
function AilmentsView({ state, updateState, search, setSearch, filter, setFilter }: { state: GameState; updateState: any; search: string; setSearch: any; filter: string; setFilter: any }) {
  const filtered = GAME_DATA.ailments.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.rawName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || a.tags.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem' }}>🤒 질병 도감 (Ailments Book)</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        약제사는 주민 야수들의 다양한 병증을 식별할 수 있습니다. 환자를 약제소에 등록할 때 이름을 도감에서 찾아 적용해 주세요.
      </p>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input 
          type="text" 
          placeholder="질병 이름 검색..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">전체 치료 효과</option>
          <option value="pain">통증 (Pain)</option>
          <option value="wound">상처 (Wound)</option>
          <option value="infection">감염 (Infection)</option>
          <option value="parasite">기생충 (Parasite)</option>
          <option value="senses">감각 (Senses)</option>
          <option value="sleep">수면 (Sleep)</option>
          <option value="breath">호흡 (Breath)</option>
          <option value="burn">화상 (Burn)</option>
          <option value="fur">털 (Fur)</option>
          <option value="feather">깃털 (Feather)</option>
          <option value="hide">가죽 (Hide)</option>
          <option value="scale">비늘 (Scale)</option>
          <option value="poison">독 (Poison)</option>
          <option value="stomach">위장 (Stomach)</option>
          <option value="temperature">체온 (Temperature)</option>
          <option value="joy">기쁨 (Joy)</option>
          <option value="mood">기분 (Mood)</option>
          <option value="instinct">본능 (Instinct)</option>
          <option value="elsewhere">저편 (Elsewhere)</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
        {filtered.map((a, i) => (
          <div key={i} className="cute-card" style={{ background: '#fafafa' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{a.name}</span>
              <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>
                등급: {a.severity.toUpperCase()} | 시간: {a.timer}시간
              </span>
            </h4>
            <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
              <strong>💊 요구 약효 태그:</strong> <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{a.tags}</span>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: '#fff', padding: '0.6rem', borderRadius: '6px', margin: '0.6rem 0', lineHeight: '1.5' }}>
              {a.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', background: '#fff', padding: '0.6rem', borderRadius: '6px' }}>
              <div>
                <strong style={{ color: 'var(--primary)' }}>💡 성공 시 특별 결과 (Outcome):</strong>
                <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>{a.outcome || '성공 보상 장신구 획득'}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--accent-red)' }}>💥 실패 시 후과 (Consequence):</strong>
                <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>{a.consequence}</div>
              </div>
            </div>

            {state.journeyActive && !state.activeAilment && (
              <button 
                onClick={() => {
                  updateState(s => {
                    const startTimer = a.timer + (s.bio.familiarBenefit.includes("따뜻한 치유사") ? 2 : 0);
                    return {
                      ...s,
                      activeAilment: {
                        id: 'ail_' + Date.now(),
                        name: a.name,
                        severity: a.severity,
                        timer: startTimer,
                        maxTimer: startTimer,
                        tags: a.tags,
                        description: a.description,
                        outcome: a.outcome,
                        consequence: a.consequence,
                        foragingPoints: s.bio.familiarBenefit.includes("예리한 관찰자") ? 2 : 0,
                        reagentsGathered: []
                      }
                    };
                  });
                  alert(`${a.name} 환자를 임상에 추가해 타이머를 기동했습니다.`);
                }}
                style={{ width: '100%', padding: '0.4rem', marginTop: '0.6rem', background: 'var(--accent-purple)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                🏥 이 환자를 현재 약제소에 진단/등록
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// 9. MAP VIEW COMPONENT
// =================================================================
function MapView({ mapScale, setMapScale, mapType, setMapType }: { mapScale: number; setMapScale: any; mapType: 'front' | 'back'; setMapType: any }) {
  // Panning using scroll container
  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🗺️ 브리슬리 우즈 지도 (Map Front / Back)</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setMapType('front')} style={{ padding: '0.3rem 0.6rem', background: mapType === 'front' ? 'var(--primary)' : '#eee', color: mapType === 'front' ? '#fff' : '#333', borderRadius: '4px', fontSize: '0.85rem' }}>전면부 지도 (Front)</button>
          <button onClick={() => setMapType('back')} style={{ padding: '0.3rem 0.6rem', background: mapType === 'back' ? 'var(--primary)' : '#eee', color: mapType === 'back' ? '#fff' : '#333', borderRadius: '4px', fontSize: '0.85rem' }}>후면부 지도 (Back)</button>
          <button onClick={() => setMapScale(Math.max(0.5, mapScale - 0.2))} style={{ padding: '0.3rem', background: '#eee', borderRadius: '4px', width: '30px' }}>-</button>
          <button onClick={() => setMapScale(Math.min(3, mapScale + 0.2))} style={{ padding: '0.3rem', background: '#eee', borderRadius: '4px', width: '30px' }}>+</button>
          <button onClick={() => setMapScale(1)} style={{ padding: '0.3rem 0.6rem', background: '#eee', borderRadius: '4px' }}>초기화</button>
        </div>
      </h2>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
        마우스를 올리거나 터치하여 스크롤해 보세요. 경로와 지형을 보며 속도에 맞춰 이동합니다.
      </p>

      <div style={{ border: '2px solid var(--glass-border)', borderRadius: '12px', height: '500px', overflow: 'auto', background: '#eee', position: 'relative' }}>
        <div 
          style={{
            transform: `scale(${mapScale})`,
            transformOrigin: 'top left',
            width: 'fit-content',
            height: 'fit-content',
            transition: 'transform 0.1s ease'
          }}
        >
          {/* Map Back HQ / Back / Front image loading */}
          <img 
            src={mapType === 'front' ? "/Apawthecaria Map Front.jpg" : "/Apawthecaria Map Back.jpg"} 
            alt="Apawthecaria Map" 
            style={{ display: 'block', maxWidth: 'none', height: 'auto', width: '1200px' }}
          />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 10. RULEBOOK VIEW COMPONENT
// =================================================================
function RulebookView({ page, setPage }: { page: number; setPage: any }) {
  // Seek the page
  const pageObj = RULEBOOK_KO.find(p => p.page === page) || { page, text: "해당 페이지 정보가 없습니다." };

  const handlePrev = () => setPage(Math.max(1, page - 1));
  const handleNext = () => setPage(Math.min(220, page + 1));

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📖 아포테카리아 룰북 뷰어 (Page {page} / 220)</span>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button onClick={handlePrev} disabled={page === 1} style={{ padding: '0.3rem 0.6rem', background: '#eee', borderRadius: '4px', opacity: page === 1 ? 0.5 : 1 }}>이전</button>
          
          <select 
            value={page} 
            onChange={e => setPage(parseInt(e.target.value))}
            style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.9rem' }}
          >
            {Array.from({ length: 220 }, (_, i) => i + 1).map(p => (
              <option key={p} value={p}>Page {p}</option>
            ))}
          </select>

          <button onClick={handleNext} disabled={page === 220} style={{ padding: '0.3rem 0.6rem', background: '#eee', borderRadius: '4px', opacity: page === 220 ? 0.5 : 1 }}>다음</button>
        </div>
      </h2>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        룰북의 내용을 한 페이지씩 원어 추출 및 한국어로 맞춤 요약/번역하였습니다. 5페이지부터 코어 규칙 설명이 나옵니다.
      </p>

      <div style={{ marginTop: '1.5rem', background: '#faf6ee', padding: '2rem', borderRadius: '14px', border: '1.5px dashed var(--glass-border)', minHeight: '300px', whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-bright)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)' }}>
        {pageObj.text}
      </div>
    </div>
  );
}

// =================================================================
// 11. JOURNALS VIEW COMPONENT
// =================================================================
function JournalsView({ state, updateState }: { state: GameState; updateState: any }) {
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    updateState(s => ({
      ...s,
      journals: [
        {
          id: 'user_journal_' + Date.now(),
          title: newTitle.trim(),
          text: newText.trim(),
          timestamp: Date.now()
        },
        ...s.journals
      ]
    }));

    setNewTitle("");
    setNewText("");
    alert("새 저널 일지가 등록되었습니다.");
  };

  const handleRemoveJournal = (id: string) => {
    if (confirm("이 일지 기록을 삭제하시겠습니까?")) {
      updateState(s => ({
        ...s,
        journals: s.journals.filter(j => j.id !== id)
      }));
    }
  };

  // Export JSON
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apawthecaria_save_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.bio && parsed.bag) {
          updateState(() => parsed);
          alert("세이브 파일을 성공적으로 가져왔습니다!");
        } else {
          alert("유효하지 않은 아포테카리아 세이브 파일입니다.");
        }
      } catch (err) {
        alert("세이브 파일 파싱 중 에러가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📝 약제사 연대기 일지 (Journals & Saves)</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportData} style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}>💾 내 데이터 백업하기</button>
          <label style={{ padding: '0.4rem 0.8rem', background: '#eee', color: '#333', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
            📥 데이터 가져오기 (Import)
            <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
          </label>
        </div>
      </h2>

      {/* Write custom journal */}
      <form onSubmit={handleAddJournal} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#fafafa', padding: '1.2rem', borderRadius: '12px', border: '1px solid #ddd', marginTop: '1rem' }}>
        <h4>✍️ 새로운 저널 일지 작성하기</h4>
        <input 
          type="text" 
          placeholder="제목 (예: Odoak 정착지 도착, 곰의 다리를 꿰매다...)" 
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <textarea 
          placeholder="여행 기록 내용, 묘사, 환자의 상태나 내 동물의 느낌을 자유롭게 서술해 주세요..."
          rows={4}
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <button type="submit" style={{ padding: '0.6rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>🖋️ 저널 등록</button>
      </form>

      {/* List journals */}
      <div style={{ marginTop: '2rem' }}>
        <h3>📖 과거 저널 기록 ({state.journals.length}개)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', padding: '0.5rem' }}>
          {state.journals.map(j => (
            <div key={j.id} className="cute-card" style={{ background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '0.4rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary)' }}>{j.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateTime(j.timestamp)}</span>
                  <button onClick={() => handleRemoveJournal(j.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.8rem' }}>❌ 삭제</button>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-bright)', marginTop: '0.5rem' }}>
                {j.text}
              </p>
            </div>
          ))}
          {state.journals.length === 0 && (
            <div style={{ fontStyle: 'italic', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
              아직 등록된 일지 기록이 없습니다. 여정 이동과 환자 완치 시 자동으로 기록되거나 직접 쓸 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
