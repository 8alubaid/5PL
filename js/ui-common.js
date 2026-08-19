import { state, saveLang } from './state.js';

function applyDirAttrs(){
  const html = document.documentElement;
  html.setAttribute('dir', state.lang === 'en' ? 'ltr' : 'rtl');
  html.setAttribute('lang', state.lang === 'en' ? 'en' : 'ar');
}

export function langToggleBtn(extraClass){
  return `<button class="pr-lang-toggle ${extraClass||''}" onclick="prToggleLang()" title="${state.lang==='en'?'التبديل للعربية':'Switch to English'}">
    <span class="pr-lang-globe">🌐</span>${state.lang==='en' ? 'العربية' : 'English'}
  </button>`;
}

export function toggleLang(){
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  saveLang();
  applyDirAttrs();
}

export { applyDirAttrs };
