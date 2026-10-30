import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
const $=id=>document.getElementById(id);
const integer=n=>new Intl.NumberFormat("ru-RU").format(Number(n)||0);
const percent=(a,b)=>b?Math.round(100*a/b)+"%":"—";
const date=v=>v?new Intl.DateTimeFormat("ru-RU",{timeZone:"Asia/Almaty",day:"2-digit",month:"short",year:"numeric"}).format(new Date(v)):"—";
const short=v=>v?String(v).slice(5):"—";
let days=30,report=null,field="signups",loading=false;
function el(tag,cls="",value=""){const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x}
function status(s,error=false){$("status").textContent=s;$("status").style.color=error?"#a10f1c":"";$("status").hidden=!s}
function metric(label,value,hint=""){
 const div=el("div","analytics-kpi"),strong=el("strong","",value),span=el("span","",label);
 div.append(strong,span);if(hint)div.append(el("small","",hint));return div;
}
function overview(o){
 const root=$("overview");root.replaceChildren();
 const rows=[
 ["Зарегистрировано всего",o.registered,"все аккаунты"],
 ["Email подтверждён",o.confirmed,percent(o.confirmed,o.registered)+" регистраций"],
 ["Новые регистрации",o.new_users,days+" дн."],
 ["Входили в аккаунт",o.recent_signins,days+" дн. · не равно посещениям"],
 ["Активные учащиеся",o.active_learners,days+" дн. · по событиям"],
 ["Назначений программ",o.enrollments,"один человек может иметь несколько"],
 ["Пройденных единиц всего",o.completions_total,"включая исторические записи"],
 ["Завершения за период",o.completions_period,"только датированные события"],
 ["Сдачи заданий",o.submissions_period,days+" дн."],
 ["Попытки тестов",o.assessments_period,days+" дн."],
 ["Writing-попытки",o.writing_period,days+" дн."],
 ["Занятия с таймингом",o.recorded_sessions_period,integer(o.session_minutes_period)+" минут записано"]
 ];
 for(const [label,value,hint]of rows)root.append(metric(label,integer(value),hint));
}
function groupTrend(rows){
 if(days===365){
  const groups=new Map();
  for(const r of rows){const key=r.day.slice(0,7);if(!groups.has(key))groups.set(key,{label:key,signups:0,active_learners:0,completions:0,assessments:0,minutes:0});
   const g=groups.get(key);for(const k of ["signups","completions","assessments","minutes"])g[k]+=Number(r[k])||0;
   // Distinct active learners per month require server-side distinct aggregation; sum of daily active learners is learner-days.
   g.active_learners+=Number(r.active_learners)||0;}
  return [...groups.values()];
 }
 if(days===90){
  const groups=[];
  rows.forEach((r,i)=>{const n=Math.floor(i/7);if(!groups[n])groups[n]={label:r.day.slice(5),signups:0,active_learners:0,completions:0,assessments:0,minutes:0};
   const g=groups[n];for(const k of ["signups","completions","assessments","minutes","active_learners"])g[k]+=Number(r[k])||0;});
  return groups;
 }
 return rows.map(r=>({...r,label:r.day.slice(5)}));
}
function trend(){
 const rows=groupTrend(report.daily||[]),root=$("trend");root.replaceChildren();
 const max=Math.max(1,...rows.map(r=>Number(r[field])||0));
 const total=rows.reduce((n,r)=>n+(Number(r[field])||0),0);
 const fLabel={signups:"регистраций",active_learners:"активных пользователь-дней",completions:"завершений",assessments:"попыток тестов",minutes:"минут"};
 for(const r of rows){
  const v=Number(r[field])||0;
  const col=el("div","analytics-bar-col");
  const val=el("span","analytics-bar-value",String(v));
  const bar=el("div","analytics-bar");bar.style.height=(v?Math.max(3,143*v/max):0)+"px";
  bar.title=r.label+": "+v+" "+fLabel[field];
  const label=el("span","analytics-bar-label",r.label);
  col.append(val,bar,label);root.append(col);
 }
 root.setAttribute("aria-label","Тренд: "+fLabel[field]+". За период суммарно "+total);
 $("trend-note").textContent="Всего "+integer(total)+" "+fLabel[field]+". "+(days===365?"Группировка по месяцам.":days===90?"Группировка по 7 дням.":"Группировка по дням.")+(field==="active_learners"&&days>30?" Сумма активности по дням не равна количеству уникальных пользователей.":"");
}
function courses(){
 const root=$("courses"),filter=$("course-filter");root.replaceChildren();
 filter.replaceChildren(new Option("Все курсы",""));
 for(const c of report.courses||[]){
  filter.append(new Option(c.title,c.slug));
  const box=el("article","analytics-panel"),h=el("h3","",c.title);
  const enrolled=Number(c.learners)||0,complete=Number(c.completions)||0,total=Number(c.total_units)||0;
  const pct=total&&enrolled?100*complete/(enrolled*total):0;
  box.append(h,
    el("p","analytics-note",integer(enrolled)+" учеников · "+integer(c.active_learners)+" активных за период"),
    el("p","analytics-note",integer(complete)+" отмеченных единиц на всех учеников · "+integer(c.assessments)+" попыток тестов всего"));
  const track=el("div","analytics-track"),fill=el("div","analytics-fill");
  fill.style.width=Math.max(0,Math.min(100,pct))+"%";
  track.append(fill);box.append(track,el("p","analytics-note","Доля отмеченного прогресса: "+pct.toFixed(1)+"% от "+integer(enrolled*total)+" назначенных единиц."));
  root.append(box);
 }
}
function assessments(){
 const root=$("assessments");root.replaceChildren();
 for(const a of report.assessment_types||[]){
  const tr=el("tr");
  for(const v of [a.key,a.course,integer(a.attempts),integer(a.learners),date(a.last)]){
   tr.append(el("td","",v));
  }
  root.append(tr);
 }
 if(!root.children.length){const tr=el("tr"),td=el("td","analytics-empty","Пока нет сданных тестов.");td.colSpan=5;tr.append(td);root.append(tr);}
}
function rosterData(){
 const q=$("search").value.trim().toLowerCase(),course=$("course-filter").value,activity=$("activity-filter").value;
 return (report.learners||[]).filter(u=>{
  if(q&&!String(u.email+" "+u.name).toLowerCase().includes(q))return false;
  if(course&&!(u.courses||[]).includes(course))return false;
  if(activity==="active"&&!Number(u.active_days))return false;
  if(activity==="inactive"&&Number(u.active_days))return false;
  if(activity==="unconfirmed"&&u.confirmed)return false;
  return true;
 });
}
function roster(){
 const rows=rosterData(),root=$("roster");root.replaceChildren();
 $("roster-count").textContent="Показано "+integer(rows.length)+" из "+integer(report.learners.length)+" зарегистрированных аккаунтов";
 for(const u of rows){
  const tr=el("tr");
  const id=el("td");id.append(el("strong","",u.name),el("div","analytics-note",u.email||"—"));
  tr.append(id);
  const values=[date(u.registered),u.confirmed?"Да":"Нет",date(u.last_signin),null,
    integer(u.completed),integer(u.submissions),integer(u.assessments),integer(u.writing),integer(u.active_days)];
  for(let i=0;i<values.length;i++){
   if(i===3){
    const cell=el("td");for(const slug of u.courses||[])cell.append(el("span","analytics-badge",slug));
    if(!(u.courses||[]).length)cell.append(el("span","muted","—"));tr.append(cell);
   }else tr.append(el("td",i>=4?"num":"",values[i]));
  }
  root.append(tr);
 }
 if(!rows.length){const tr=el("tr"),td=el("td","analytics-empty","Пользователей по выбранным фильтрам нет.");td.colSpan=10;tr.append(td);root.append(tr)}
}
function integrity(){
 const o=report.overview,root=$("integrity");root.replaceChildren();
 for(const [label,value,desc] of [
  ["Исторические отметки",o.historical_imports,"не превращаем в события текущего периода"],
  ["Неоднозначная точность дат",o.imprecise_dates,"не равны подтверждённому точному времени"],
  ["Записанные минуты",o.session_minutes_period,"только период, не оценка всех часов"],
  ["Пользователь-дни",report.daily.reduce((n,r)=>n+Number(r.active_learners||0),0),"сумма по дням, возможны повторы пользователей"]
 ])root.append(metric(label,integer(value),desc));
}
function escapeCSV(value){
 const raw=String(value??"");
 const safe=/^[\s]*[=+@\-]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
function exportCSV(){
 if(!report)return;
 const rows=[["Имя","Email","Регистрация","Подтвержден","Последний вход","Курсы","Пройдено","Сдачи заданий","Тесты","Writing","Активных дней","Последнее учебное событие"]];
 for(const u of rosterData())rows.push([u.name,u.email,u.registered,u.confirmed,u.last_signin,(u.courses||[]).join("; "),u.completed,u.submissions,u.assessments,u.writing,u.active_days,u.last_activity]);
 const csv="\uFEFF"+rows.map(row=>row.map(escapeCSV).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="meta-admin-users-"+days+"days.csv";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
async function reload(){
 if(loading)return;loading=true;$("refresh").disabled=true;
 status("Загружаю административную аналитику…");
 const {data,error}=await supabase.rpc("meta_admin_report",{p_days:days});
 loading=false;$("refresh").disabled=false;
 if(error){showDashboard(false);status("Доступ к отчёту отклонён или произошла ошибка: "+error.message,true);return;}
 report=data;showDashboard(true);status("");
 $("report-date").textContent=(report.start_date||"")+" — "+(report.end_date||"")+" · Asia/Almaty";
 document.querySelectorAll("[data-days]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.days)===days)));
 overview(report.overview);courses();assessments();trend();roster();integrity();
}
function showDashboard(visible){$("admin").hidden=!visible}
async function boot(){
 const u=await authenticatedUser();
 if(!u){location.replace(authPage("./admin-statistics.html"));return}
 const {data,error}=await supabase.rpc("meta_admin_access");
 if(error||!data){status("Недостаточно прав. Административная аналитика доступна только администратору Meta.",true);return}
 document.querySelectorAll("[data-days]").forEach(b=>b.onclick=()=>{days=Number(b.dataset.days);void reload()});
 document.querySelectorAll("[data-field]").forEach(b=>b.onclick=()=>{field=b.dataset.field;
  document.querySelectorAll("[data-field]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));if(report)trend()});
 $("refresh").onclick=()=>void reload();$("export").onclick=exportCSV;
 for(const id of ["search","course-filter","activity-filter"]){
  $(id).addEventListener(id==="search"?"input":"change",()=>{if(report)roster()});
 }
 await reload();
}
void boot().catch(e=>{console.error("Meta admin statistics:",e);status("Не удалось открыть панель: "+String(e.message||e),true)});
