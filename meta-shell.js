import {supabase, authenticatedUser, authPage} from './meta-supabase.js';
import {language} from './meta-language.js?v=3';
const en = language() === 'en';
const page = location.pathname.split('/').pop() || 'index.html';
import {icon} from "./meta-icons.js";
function link(href, text, name) {
 const a=document.createElement('a');a.href=href;a.append(icon(name),document.createTextNode(text));return a;
}
async function boot() {
 // A failed session check never exposes page data; existing controllers retain RLS checks.
 const user=await authenticatedUser();
 if (!user) {if(page==='privacy.html')return;location.replace(page==='index.html'?'./welcome.html':authPage('./'+page+location.search+location.hash));return;}
 const shell=document.createElement('div');shell.className='meta-appbar';
 const brand=link('./','Meta.','book');brand.className='meta-brand';
 const nav=document.createElement('nav');nav.className='meta-primary-nav';nav.setAttribute('aria-label',en?'Main navigation':'Основная навигация');
 const coursePage=/ielts|flutter|quran|assessment|mock|practice|courses/.test(page);
 for(const [href,ru,eng,name,active] of [
  ['./','Главная','Home','home',page==='index.html'],
  ['./courses.html','Курсы','Courses','book',coursePage],
  ['./statistics.html','Прогресс','Progress','chart',page==='statistics.html'],
  ['./support.html','Сообщения','Messages','message',page==='support.html']
 ]){const a=link(href,en?eng:ru,name);if(active)a.setAttribute('aria-current','page');nav.append(a);}
 const profile=link('./profile.html',en?'Profile':'Профиль','user');profile.className='meta-profile-link';
 if(page==='profile.html')profile.setAttribute('aria-current','page');
 const menu=document.createElement('details');menu.className='meta-more';
 const summary=document.createElement('summary');summary.textContent=en?'More':'Ещё';menu.append(summary);
 const menuPanel=document.createElement('div');menuPanel.className='meta-more-panel';
 menuPanel.append(link('./about.html',en?'About Meta':'О Meta','info'));
 const logout=document.createElement('button');logout.type='button';logout.textContent=en?'Sign out':'Выйти';
 logout.onclick=async()=>{logout.disabled=true;try{const {error}=await supabase.auth.signOut();if(error)throw error;location.replace('./welcome.html');}catch{logout.disabled=false;status.textContent=en?'Could not sign out. Try again.':'Не удалось выйти. Повтори попытку.';menu.open=true;}};
 const status=document.createElement('p');status.setAttribute('role','status');menuPanel.append(logout,status);menu.append(menuPanel);
 document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;summary.focus()}});
 shell.append(brand,nav,profile,menu);const placeholder=document.querySelector('.meta-shell-placeholder');if(placeholder)placeholder.replaceWith(shell);else document.body.prepend(shell);document.body.classList.add('meta-has-shell');
 const main=document.querySelector('main');if(main){main.id ||= 'main-content';main.tabIndex=-1;const skip=document.createElement('a');skip.className='meta-skip';skip.href='#'+main.id;skip.textContent=en?'Skip to content':'К содержимому';document.body.prepend(skip);}
 // Retain contextual course/back links, suppress redundant global links without removing controller IDs.
 document.querySelectorAll('main > nav.meta-page-nav a, #heading .nav-links').forEach(a=>{
  const href=(a.getAttribute('href')||'').split(/[?#]/)[0];
  if(a.matches('.nav-links') || /^(?:\.\/)?(?:index\.html|profile\.html|support\.html|statistics\.html|account\.html|welcome\.html)?$/.test(href))a.hidden=true;
 });
 supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){if(main)main.replaceChildren();location.replace('./welcome.html');}});
 try{const {data,error}=await supabase.rpc('meta_admin_access');if(!error&&data===true){
  menuPanel.insertBefore(link('./admin-statistics.html',en?'Administration':'Администрирование','chart'),logout);
  menuPanel.insertBefore(link('./admin-operations.html',en?'Manage access':'Управление доступом','book'),logout);
 }}catch{}
}
void boot().catch(()=>{
 const p=document.createElement('p');p.className='meta-shell-error';p.setAttribute('role','alert');p.textContent=en?'Connection unavailable. Reload to try again.':'Нет соединения. Обнови страницу для повторной попытки.';document.body.prepend(p);
});
