export const esc = (s) => (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid = (p) => p + '_' + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);

export function makeEmptyDraftMatches(){
  return Array.from({ length: 9 }, () => ({ home:'', away:'', kickoff:'', stadium:'' }));
}
export function toLocalDatetimeValue(d){
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function prToast(msg, isError){
  let t = document.getElementById('pr-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'pr-toast';
    t.className = 'pr-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove('pr-toast-error','pr-toast-ok','pr-toast-show');
  t.classList.add(isError ? 'pr-toast-error' : 'pr-toast-ok');
  void t.offsetWidth;
  t.classList.add('pr-toast-show');
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => { t.classList.remove('pr-toast-show'); }, 3500);
}
