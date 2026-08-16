import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCBiEh_2YmbU9W_isONi2FugkTzDIYJ0mE",
  authDomain: "skogsduvasbookshop.firebaseapp.com",
  projectId: "skogsduvasbookshop",
  storageBucket: "skogsduvasbookshop.firebasestorage.app",
  messagingSenderId: "1051912666392",
  appId: "1:1051912666392:web:effb955c211c174b26326d",
  databaseURL: "https://skogsduvasbookshop-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Check if Firebase config is loaded correctly
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const shouldUseRedirectSignIn = () =>
  typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

export const googleSignInErrorMessage = (error: { code?: string; message?: string }) => {
  const code = error.code || '';
  const message = error.message || '';
  if (code === 'auth/popup-blocked') {
    return '브라우저가 로그인 창을 막았습니다. 팝업을 허용한 뒤 다시 시도해 주세요.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '로그인 창이 닫혔습니다. 본인 구글 계정을 골라 다시 시도해 주세요.';
  }
  if (code === 'auth/unauthorized-domain') {
    return '이 사이트 주소가 Firebase 허용 도메인에 없습니다. Firebase Authentication → Settings → Authorized domains에 apawthecaria.vercel.app을 추가해 주세요.';
  }
  if (code === 'auth/operation-not-allowed') {
    return '이 Firebase 프로젝트에서 Google 로그인이 꺼져 있습니다.';
  }
  if (/access.?denied|403: access_denied|has not completed the Google verification|앱이 확인되지/i.test(`${code} ${message}`)) {
    return 'Google 로그인 앱이 테스트 모드라 등록된 계정만 들어갈 수 있습니다. Google Cloud OAuth 동의 화면을 게시(Production)하거나, 로그인할 사람을 테스트 사용자로 추가해 주세요.';
  }
  return `로그인 중 에러가 발생했습니다: ${message || code || '알 수 없는 오류'}`;
};
