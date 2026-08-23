import { makeEmptyDraftMatches } from './utils.js';

export const FIXED_TITLE = 'دوري الخيمة ٢٠٢٦\\٢٠٢٧';
export const FIXED_TITLE_EN = 'Tent League 2026/2027';
export const FIXED_ADMIN_PIN = '13579';

// ===== ضع رابط نشر Google Apps Script هنا بعد النشر (خطوات النشر بالأسفل في الشات) =====
export const API_URL = 'https://script.google.com/macros/s/AKfycbycf4v0XXzlH3v4D-zOarJ507Qv14mryBjU-U1oysUp1pmuMoZ5iyYerC60Mgmr-p4F/exec';

// Single shared mutable state object — modules import `state` and mutate its
// properties directly (never reassign `state` itself, so the shared reference
// stays valid across every module that imported it).
export const state = {
  lang: 'ar',
  config: null,
  players: [],
  rounds: [],
  predictions: {},
  session: { playerId: null, playerName: null, isAdmin: false },
  activeTab: 'predict',
  selectedRoundId: null,
  adminSubTab: 'rounds',
  draftMatches: makeEmptyDraftMatches(),
  draftRoundName: '',
  loadError: false,
  storageHealthy: false,
  loginMode: 'player',
  importStatus: '',
  lastStorageError: '',
  predictDraft: {},
  predictDraftRoundId: null,
  predictViewMode: 'edit',
  lastFeedRefresh: null,
  editingRoundId: null,
  roundEditDraft: {},
  editingPlayerId: null
};

export function loadLang(){ try { return localStorage.getItem('pr_lang') || 'ar'; } catch(e){ return 'ar'; } }
export function saveLang(){ try { localStorage.setItem('pr_lang', state.lang); } catch(e){} }
export function saveSession(){ try { localStorage.setItem('pr_session', JSON.stringify(state.session)); } catch(e){} }
export function loadSession(){
  try {
    const raw = localStorage.getItem('pr_session');
    if(!raw) return null;
    return JSON.parse(raw);
  } catch(e){ return null; }
}
export function clearSession(){ try { localStorage.removeItem('pr_session'); } catch(e){} }
