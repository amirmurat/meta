
import {supabase,authenticatedUser} from "./meta-supabase.js";
import {icon} from "./meta-icons.js";
import {language} from "./meta-language.js";
const $=id=>document.getElementById(id);
const catalogue=location.pathname.endsWith("courses.html");
if(catalogue)$("heading").querySelector("h1").textContent=language()==="en"?"Courses":"Курсы";
const readable=record=>language()==="en"?(record.title_en||record.title):(record.title||record.title_en);
function lessonLink(course,lesson){
 const code=lesson.external_id;
 if(course==="flutter")return "./flutter-lesson.html?id="+encodeURIComponent(code);
 if(course==="ielts")return "./ielts-lesson.html?id="+encodeURIComponent(code);
 if(course==="quran"){
  const match=/^(\d+):(\d+)$/.exec(code);
  if(match)return "./quran.html?s="+Number(match[1])+"&a="+Number(match[2]);
 }
 return null;
}
async function renderResume(user,visible,completedIds,positions){
 const available=visible.filter(c=>["flutter","ielts","quran"].includes(c.slug));
 if(!available.length)return;
 const known=new Map();
 const keys=(positions||[]).filter(p=>available.some(c=>c.slug===p.course_slug)).map(p=>p.lesson_id);
 if(keys.length){
  const {data,error}=await supabase.from("lessons")
   .select("id,course_slug,external_id,title,title_en").in("id",[...new Set(keys)]);
  if(error)console.warn("Resume lesson lookup:",error.message);
  else for(const row of data||[])known.set(row.id,row);
 }
 const seen=new Map((positions||[]).map(p=>[p.course_slug,p]));
 const completed=new Set(completedIds);
 const items=[];
 for(const course of available){
  const stored=seen.get(course.slug);
  let lesson=stored&&known.get(stored.lesson_id);
  if(lesson?.course_slug!==course.slug || completed.has(lesson.id))lesson=null;
  let kind=lesson?"last":"next";
  if(!lesson){
   // The first unmarked unit is a fallback, not a claim about where the user stopped.
   const {data:units,error}=await supabase.from("lessons")
    .select("id,course_slug,external_id,title,title_en")
    .eq("course_slug",course.slug).order("sort_order",{ascending:true}).limit(course.slug==="quran"?400:500);
   if(error){console.warn("Resume fallback:",error.message)}
   else lesson=(units||[]).find(x=>!completed.has(x.id))||null;
  }
  let href=lesson&&lessonLink(course.slug,lesson);
  if(!href){
   href=course.slug==="quran"?"./quran.html?s=1&a=1":"./"+course.slug+".html";
   kind="course";
  }
  const short=course.slug==="quran"&&lesson
   ?(language()==="en"?"Surah ":"Сура ")+lesson.external_id.split(":")[0]+", "+(language()==="en"?"ayah ":"аят ")+lesson.external_id.split(":")[1]
   :lesson?readable(lesson):readable(course);
  items.push({course,href,title:short,kind,visited:kind==="last"?Date.parse(stored.visited_at)||0:0});
 }
 items.sort((a,b)=>b.visited-a.visited || Number(b.course.slug==="ielts")-Number(a.course.slug==="ielts"));
 const list=$("resume-links");list.replaceChildren();
 for(const item of items.slice(0,1)){
  const a=document.createElement("a");a.className="resume-link";a.href=item.href;
  a.dataset.last=String(item.kind==="last");
  const left=document.createElement("span");left.style.minWidth="0";
  const label=document.createElement("span");label.className="resume-label";
  const title=readable(item.course);
  const suffix=item.kind==="last"
   ?(language()==="en"?" · Last opened":" · Последняя открытая тема")
   :item.kind==="next"?(language()==="en"?" · Your next lesson":" · Твой следующий урок")
   :(language()==="en"?" · Open course":" · Открыть курс");
  label.textContent=title+suffix;
  const name=document.createElement("span");name.className="resume-title";name.textContent=item.title;
  left.append(label,name);
  const arrow=document.createElement("span");arrow.className="resume-action";
  arrow.textContent=item.kind==="next" && !completedIds.length ? (language()==="en"?"Start first lesson":"Начать первый урок") : (language()==="en"?"Continue":"Продолжить");
  arrow.append(icon("arrow"));a.append(left,arrow);list.append(a);
 }
 $("resume-heading").textContent=!completedIds.length && !positions?.length ? (language()==="en"?"Your first step":"Твой первый шаг") : (language()==="en"?"Continue learning":"Продолжить обучение");
 $("resume-help").textContent=language()==="en"
  ?"Read the explanation, try the exercise and save your answer. Opening a lesson does not mark it complete."
  :"Прочитай объяснение, выполни задание и сохрани ответ. Открытие урока не считается завершением.";
 $("resume-section").hidden=false;
}
async function main(){
 try{
  const user=await authenticatedUser();
  if(!user){location.replace("./welcome.html");return;}
  void supabase.rpc("meta_admin_access").then(({data,error})=>{if(!error&&data===true){$("admin-nav").hidden=false;$("admin-ops-nav").hidden=false;}}).catch(()=>{});
  const {data:assigned,error:assignedError}=await supabase.from("course_enrollments")
    .select("course_slug").eq("user_id",user.id);
  if(assignedError)throw assignedError;
  $("loading").hidden=true;$("heading").hidden=false;
  if(!assigned?.length){$("empty").hidden=false;return;}
  const [catalog,progress,positions]=await Promise.all([
   supabase.from("courses").select("slug,title,title_en,total_units"),
   supabase.from("lesson_progress").select("lesson_id").eq("user_id",user.id),
   supabase.from("course_resume_positions").select("course_slug,lesson_id,visited_at").eq("user_id",user.id)
  ]);
  for(const result of [catalog,progress])if(result.error)throw result.error;
  if(positions.error)console.warn("Resume positions unavailable:",positions.error.message);
  const assignedSlugs=new Set(assigned.map(x=>x.course_slug));
  const visible=(catalog.data||[]).filter(c=>assignedSlugs.has(c.slug));
  const completedIds=(progress.data||[]).map(x=>x.lesson_id);
  const lookup=completedIds.length
    ?await supabase.from("lessons").select("id,course_slug").in("id",completedIds)
    :{data:[],error:null};
  if(lookup.error)throw lookup.error;
  const lessonCourse=new Map((lookup.data||[]).map(l=>[l.id,l.course_slug]));
  const counts=new Map();
  for(const row of progress.data||[]){
    const slug=lessonCourse.get(row.lesson_id);
    if(slug)counts.set(slug,(counts.get(slug)||0)+1);
  }
  const root=$("courses");
  for(const course of visible){
    const canOpen=["flutter","ielts","quran"].includes(course.slug);
    const card=document.createElement(canOpen?"a":"div");
    card.className="course";
    if(course.slug==="flutter")card.href="./flutter.html";
    if(course.slug==="ielts")card.href="./ielts.html";
    if(course.slug==="quran")card.href="./quran.html?s=1&a=1";
    const top=document.createElement("div");top.className="course-top";
    const title=document.createElement("span");title.className="name";title.textContent=language()==="en"?(course.title_en||course.title):course.title;
    const amount=document.createElement("span");amount.className="count";
    const done=counts.get(course.slug)||0;
    amount.textContent=done+" / "+course.total_units;
    top.append(title,amount);
    const track=document.createElement("div");track.className="track";
    track.setAttribute("role","progressbar");track.setAttribute("aria-label",language()==="en"?(course.title_en||course.title):course.title);
    track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(course.total_units));
    track.setAttribute("aria-valuenow",String(done));
    const fill=document.createElement("div");fill.className="fill";
    fill.style.width=(course.total_units?Math.min(100,100*done/course.total_units):0)+"%";
    track.append(fill);card.append(top,track);root.append(card);
  }
  if(!root.children.length){$("empty").hidden=false;return;}
  root.hidden=false;$("assigned-courses").hidden=false;
  // Suggestions never prevent the main course list from loading.
  try{if(!catalogue)await renderResume(user,visible,completedIds,positions.error?[]:positions.data||[]);}
  catch(error){console.warn("Resume shortcuts:",error.message);}
 }catch(e){
  console.error("Meta dashboard:",e);
  $("loading").hidden=false;$("loading").setAttribute("role","alert");
  $("loading").textContent="Не удалось загрузить твои программы. Обнови страницу или проверь вход в аккаунт.";
 }
}
void main();
