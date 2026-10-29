import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js";

"use strict";
const $=id=>document.getElementById(id);
const en=language()==="en";
const t=(english,russian)=>en?english:russian;
const SURAH_NAMES="Al-Fatihah|Al-Baqarah|Ali 'Imran|An-Nisa|Al-Ma'idah|Al-An'am|Al-A'raf|Al-Anfal|At-Tawbah|Yunus|Hud|Yusuf|Ar-Ra'd|Ibrahim|Al-Hijr|An-Nahl|Al-Isra|Al-Kahf|Maryam|Ta-Ha|Al-Anbiya|Al-Hajj|Al-Mu'minun|An-Nur|Al-Furqan|Ash-Shu'ara|An-Naml|Al-Qasas|Al-Ankabut|Ar-Rum|Luqman|As-Sajdah|Al-Ahzab|Saba|Fatir|Ya-Sin|As-Saffat|Sad|Az-Zumar|Ghafir|Fussilat|Ash-Shura|Az-Zukhruf|Ad-Dukhan|Al-Jathiyah|Al-Ahqaf|Muhammad|Al-Fath|Al-Hujurat|Qaf|Adh-Dhariyat|At-Tur|An-Najm|Al-Qamar|Ar-Rahman|Al-Waqi'ah|Al-Hadid|Al-Mujadilah|Al-Hashr|Al-Mumtahanah|As-Saff|Al-Jumu'ah|Al-Munafiqun|At-Taghabun|At-Talaq|At-Tahrim|Al-Mulk|Al-Qalam|Al-Haqqah|Al-Ma'arij|Nuh|Al-Jinn|Al-Muzzammil|Al-Muddaththir|Al-Qiyamah|Al-Insan|Al-Mursalat|An-Naba|An-Nazi'at|Abasa|At-Takwir|Al-Infitar|Al-Mutaffifin|Al-Inshiqaq|Al-Buruj|At-Tariq|Al-A'la|Al-Ghashiyah|Al-Fajr|Al-Balad|Ash-Shams|Al-Layl|Ad-Duha|Ash-Sharh|At-Tin|Al-Alaq|Al-Qadr|Al-Bayyinah|Az-Zalzalah|Al-Adiyat|Al-Qari'ah|At-Takathur|Al-Asr|Al-Humazah|Al-Fil|Quraysh|Al-Ma'un|Al-Kawthar|Al-Kafirun|An-Nasr|Al-Masad|Al-Ikhlas|Al-Falaq|An-Nas".split("|");
const AYAH_COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
if(SURAH_NAMES.length!==114||AYAH_COUNTS.length!==114||AYAH_COUNTS.reduce((a,b)=>a+b,0)!==6236)throw Error("Invalid Quran chapter metadata");
const API="https://quranbench.com/api/v1";
let user,verse,surah=2,ayah=40,lessonId=null,sequence=0;
let tags=[],assigned=new Set(),catalog=new Map(),reverseCatalog=new Map(),completions=new Map(),cache=new Map();
let activeToken=null;
const set=(id,content)=>{$(id).textContent=content;};
function status(msg,error=false){set("status",msg);$("status").className=error?"view-status alert":"view-status";}
function notice(id,msg,error=false){set(id,msg);$(id).className=error?"view-status alert":"view-status";}
function safeDate(){
 return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Almaty",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
function urlFor(s,a){return "./quran.html?s="+s+"&a="+a}
function option(value,text){const o=document.createElement("option");o.value=String(value);o.textContent=text;return o;}
function anchor(text,url){
 const a=document.createElement("a");a.href=url;a.textContent=text;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function readerLabels(){
 const entries=[
 ["back","← My courses","← Мои программы"],["statistics-link","Statistics","Статистика"],
 ["subtitle","Arabic text, word analysis, reliable references and private research notes.","Арабский текст, анализ слов, проверяемые источники и личные заметки."],
 ["progress-label","studied verses","изученных аятов"],
 ["session-start","Start study session","Начать занятие"],
 ["session-stop","End session and save time","Завершить и записать время"],
 ["session-cancel","Discard session","Отменить занятие"],
 ["nav-heading","Navigate","Навигация"],["surah-label","Surah","Сура"],["ayah-label","Ayah","Аят"],
 ["previous","← Previous","← Предыдущий"],["following","Next →","Следующий →"],
 ["tags-heading","My nested tags","Мои вложенные метки"],
 ["tag-help","Assign multiple tags to one verse. Parent tags include verses under their children.","Один аят может иметь несколько меток. Родительская метка включает аяты из дочерних."],
 ["new-tag-label","New tag","Новая метка"],["parent-tag-label","Parent tag","Родительская метка"],["add-tag","Create tag","Создать метку"],
 ["manage-tag-label","Manage an existing tag","Управление меткой"],["rename","Rename","Переименовать"],["remove-tag","Delete","Удалить"],
 ["move-label","Move to parent","Переместить к родителю"],["move-tag","Move","Переместить"],
 ["linked-heading","Related verses","Связанные аяты"],["browse-label","Browse a topic, including child tags","Показать тему, включая дочерние метки"],
 ["word-heading","Word-by-word research","Пословное исследование"],
 ["word-help","Select a word to inspect its root, lemma and morphological segments. A dictionary gloss is not a contextual tafsir.","Нажми на слово: корень, лемма и части слова. Словарное значение не заменяет контекстное толкование."],
 ["sources-heading","Tafsir and dictionaries","Тафсиры и словари"],
 ["sources-help","Open the original source. AI paraphrases are not presented as scholarly quotations.","Открывай оригинальный источник. Пересказы ИИ не выдаются за цитаты учёных."],
 ["research-heading","Private research","Личное исследование"],
 ["question-label","Your question","Твой вопрос"],["analysis-label","Your analysis and distinctions","Твой анализ и различия"],
 ["sources-label","Sources and citations","Источники и ссылки"],["save","Save research","Сохранить исследование"],
 ["copy-question","Copy AI research prompt","Скопировать запрос для ИИ"],
 ["mark","Mark studied","Отметить изученным"],["unmark","Undo completion","Снять отметку"],
 ["attribution","Arabic: Tanzil Uthmani 1.1 (CC BY 3.0, unchanged). Word data: Leeds Quranic Arabic Corpus via QuranBench v0.8.0 (GPL). Translations are separately attributed. No automatic religious rulings.","Арабский текст: Tanzil Uthmani 1.1 (CC BY 3.0, без изменений). Слова: Leeds Quranic Arabic Corpus через QuranBench v0.8.0 (GPL). Авторы переводов указаны отдельно. Никаких автоматических религиозных постановлений."]
 ];
 for(const [id,enText,ruText]of entries)set(id,t(enText,ruText));
 $("new-tag").placeholder=t("e.g. Covenant","Например: Завет");
 $("rename-tag").placeholder=t("New name","Новое название");
 $("question").placeholder=t("What is unclear about this verse?","Что неясно в этом аяте?");
 $("analysis").placeholder=t("Distinguish direct text, dictionary meanings, tafsir and your own conclusions.","Разделяй текст, словари, тафсир и собственный вывод.");
 $("sources").placeholder=t("Reference / source URL / what it supports","Аят / ссылка / что подтверждает источник");
 document.title=t("Quran Study — Meta","Изучение Корана — Meta");
}
async function apiVerse(s,a){
 const ref=s+":"+a;
 if(cache.has(ref))return cache.get(ref);
 const response=await fetch(API+"/verse/"+s+"/"+a);
 if(!response.ok)throw Error(t("Quran source unavailable","Источник Корана недоступен")+": HTTP "+response.status);
 const data=await response.json();
 const value=data.verses?.[0];
 if(!value||value.verse_ref!==ref||!value.text?.uthmani||!Array.isArray(value.tokens)||!data.corpus_version)
  throw Error(t("Source response could not be verified","Ответ источника не прошёл проверку"));
 // Preserve the Arabic text verbatim; do not rewrite or normalize the displayed Uthmani text.
 const obj={verse:value,version:data.corpus_version,text_edition:data.text_edition};
 cache.set(ref,obj);return obj;
}
async function russianTranslation(s,a){
 const response=await fetch("https://quranenc.com/api/v1/translation/aya/russian_rwwad/"+s+"/"+a);
 if(!response.ok)throw Error("QuranEnc HTTP "+response.status);
 const data=await response.json();
 const entry=Array.isArray(data.result)?data.result[0]:data.result;
 if(!entry?.translation||Number(entry.sura)!==s||Number(entry.aya)!==a)throw Error("QuranEnc verse mismatch");
 return entry;
}
async function loadCatalog(){
 const chunks=await Promise.all(Array.from({length:7},(_,i)=>
   supabase.from("lessons").select("id,external_id").eq("course_slug","quran")
      .order("sort_order",{ascending:true}).range(i*1000,i*1000+999)));
 for(const item of chunks){
  if(item.error)throw item.error;
  for(const row of item.data||[]){
   catalog.set(row.external_id,row.id);reverseCatalog.set(row.id,row.external_id);
  }
 }
 if(catalog.size!==6236)throw Error("Quran catalog incomplete: "+catalog.size);
 const {data,error}=await supabase.from("lesson_progress").select("lesson_id,verification_method").eq("user_id",user.id);
 if(error)throw error;
 for(const v of data||[])if(reverseCatalog.has(v.lesson_id))completions.set(v.lesson_id,v.verification_method);
 updateProgress();
}
function updateProgress(){
 const count=completions.size;
 set("progress",count+" / 6236");
 $("progress-bar").style.width=(count/6236*100)+"%";
}
function renderSelects(){
 $("surah").replaceChildren();
 for(let i=0;i<114;i++)$("surah").append(option(i+1,(i+1)+". "+SURAH_NAMES[i]+" ("+AYAH_COUNTS[i]+")"));
 $("surah").value=String(surah);
 $("ayah").replaceChildren();
 for(let i=1;i<=AYAH_COUNTS[surah-1];i++)$("ayah").append(option(i,String(i)));
 $("ayah").value=String(ayah);
 $("previous").disabled=surah===1&&ayah===1;
 $("following").disabled=surah===114&&ayah===AYAH_COUNTS[113];
}
function nextPosition(direction){
 let s=surah,a=ayah+direction;
 if(a<1){s--;a=AYAH_COUNTS[s-1]}
 if(a>AYAH_COUNTS[s-1]){s++;a=1}
 if(s<1||s>114)return;
 void openVerse(s,a);
}
async function openVerse(s,a,addHistory=true){
 if(!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||a>AYAH_COUNTS[s-1])return;
 const id=++sequence;surah=s;ayah=a;lessonId=catalog.get(s+":"+a);
 if(!lessonId){status(t("This verse is not yet in the catalog.","Этот аят отсутствует в каталоге."),true);return;}
 if(addHistory)history.pushState({}, "",urlFor(s,a));
 renderSelects();
 set("verse-ref",s+":"+a);set("verse-heading",SURAH_NAMES[s-1]);
 $("arabic").textContent="";$("translation").textContent="";$("footnotes").textContent="";
 $("translation-source").textContent="";$("words").replaceChildren();$("morph").hidden=true;
 set("completion-help","");notice("save-state","");
 status(t("Loading verified text and word data…","Загружаю проверенный текст и разбор слов…"));
 $("qurancom").href="https://quran.com/"+s+"/"+a;
 $("corpus").href="https://corpus.quran.com/wordbyword.jsp?chapter="+s+"&verse="+a;
 showCompletion();
 await Promise.all([loadNotes(),loadAyahTags()]);
 try{
  const data=await apiVerse(s,a);
  if(id!==sequence)return;
  verse=data.verse;
  set("arabic",verse.text.uthmani);
  status("");
  renderWordButtons();
  renderSources();
  if(en){
   const item=(verse.translations||[]).find(x=>x.edition_id==="en-pickthall");
   set("translation",item?.text||t("Translation unavailable; open the source.","Перевод недоступен; открой источник."));
   set("translation-source",item?("Marmaduke Pickthall (1930, Public Domain) · QuranBench "+data.version):"QuranBench · "+data.version);
  }else{
   try{
    const translation=await russianTranslation(s,a);
    if(id!==sequence)return;
    set("translation",translation.translation);set("footnotes",translation.footnotes||"");
    set("translation-source","Rowwad Translation Center · QuranEnc (russian_rwwad v1.0.1, 29.03.2026)");
   }catch(e){
    if(id!==sequence)return;
    const fallback=(verse.translations||[]).find(x=>x.edition_id==="en-pickthall");
    set("translation",fallback?.text||"");
    set("translation-source","Русский перевод QuranEnc недоступен — показан английский перевод Pickthall (1930, Public Domain). Открой QuranEnc для проверки.");
    const link=anchor("QuranEnc — русский перевод","https://quranenc.com/ru/browse/russian_rwwad/"+s+"/"+a);
    $("translation-source").append(document.createTextNode(" "),link);
   }
  }
 }catch(err){
  if(id!==sequence)return;
  status(t("Could not load authentic text. Use the source links below.","Не удалось загрузить оригинальный текст. Используй ссылки на источники ниже.")+" ("+err.message+")",true);
  renderSources();
 }
}
function showCompletion(){
 const method=completions.get(lessonId);
 set("completion-indicator",method?t("Studied","Изучено"):t("In progress","В процессе"));
 $("mark").hidden=!!method;
 $("unmark").hidden=!method||method==="historical_import";
 set("completion-help",method==="historical_import"
  ?t("Previously confirmed in your learning journal; protected from accidental removal.","Ранее подтверждено в учебном журнале; защищено от случайного удаления.")
  :t("Completion is your own reading confirmation, not an AI evaluation.","Отметка означает твоё подтверждение чтения, а не оценку ИИ."));
}
async function markStudied(){
 if(completions.has(lessonId))return;
 $("mark").disabled=true;
 const {error}=await supabase.from("lesson_progress").insert({
  user_id:user.id,lesson_id:lessonId,verification_method:"manual_quran",
  achieved_on:safeDate(),date_accuracy:"exact_day"
 });
 $("mark").disabled=false;
 if(error){status(error.message,true);return}
 completions.set(lessonId,"manual_quran");updateProgress();showCompletion();
 status(t("Reading completion saved.","Изучение аята отмечено."));
}
async function unmarkStudied(){
 if(completions.get(lessonId)!=="manual_quran")return;
 if(!confirm(t("Remove this completion mark?","Снять отметку об изучении аята?")))return;
 const {error}=await supabase.from("lesson_progress").delete().eq("user_id",user.id).eq("lesson_id",lessonId);
 if(error){status(error.message,true);return}
 completions.delete(lessonId);updateProgress();showCompletion();status(t("Completion removed.","Отметка снята."));
}
function info(dl,label,value){
 const dt=document.createElement("dt");dt.textContent=label;
 const dd=document.createElement("dd");dd.textContent=String(value??"—");
 dl.append(dt,dd);
}
function renderWordButtons(){
 $("words").replaceChildren();activeToken=null;
 for(const token of verse.tokens||[]){
  const button=document.createElement("button");button.type="button";
  button.className="word";
  button.dir="rtl";button.lang="ar";button.textContent=token.text?.uthmani||"";
  button.title=token.morphology?.transliteration||"";
  button.onclick=()=>{
   $("words").querySelectorAll(".word").forEach(b=>b.classList.remove("selected"));
   button.classList.add("selected");activeToken=token;renderMorph(token);
  };
  $("words").append(button);
 }
}
function renderMorph(token){
 const morph=token.morphology||{};const root=$("morph");root.hidden=false;root.replaceChildren();
 const arabic=document.createElement("div");arabic.className="morph-ar";arabic.lang="ar";
 arabic.textContent=token.text?.uthmani||"";root.append(arabic);
 const dl=document.createElement("dl");
 info(dl,t("Dictionary gloss","Словарное значение"),morph.gloss);
 info(dl,t("Transliteration","Транслитерация"),morph.transliteration);
 info(dl,t("Root","Корень"),morph.root||t("Not assigned","Не указан"));
 info(dl,t("Lemma","Лемма"),morph.lemma);
 info(dl,t("Part of speech","Часть речи"),morph.pos);
 info(dl,t("Grammar","Грамматика"),Object.entries(morph.features||{}).map(([k,v])=>k+": "+v).join("; ")||"—");
 root.append(dl);
 const title=document.createElement("strong");title.textContent=t("Morphological segments","Морфемы");root.append(title);
 const parts=document.createElement("div");parts.className="parts";
 for(const seg of morph.segments||[]){
  const block=document.createElement("div");block.className="part";
  const arab=document.createElement("div");arab.dir="rtl";arab.lang="ar";arab.style.fontSize="23px";arab.textContent=seg.text;
  const meta=document.createElement("span");meta.textContent=[seg.type,seg.pos].filter(Boolean).join(" · ");
  block.append(arab,meta);parts.append(block);
 }
 root.append(parts);
 const links=document.createElement("div");links.className="link-list";
 if(token.url?.startsWith("https://quranbench.com/"))links.append(anchor("QuranBench · "+t("word","слово"),token.url));
 if(morph.root_slug)links.append(anchor(t("Root occurrences","Другие формы корня"),"https://quranbench.com/root/"+encodeURIComponent(morph.root_slug)));
 links.append(anchor("Quranic Arabic Corpus","https://corpus.quran.com/wordmorphology.jsp?location="+encodeURIComponent("("+surah+":"+ayah+":"+token.position+")")));
 links.append(anchor("Lane's Lexicon","https://laneslexicon.github.io/lexicon/"));
 root.append(links);
 const caption=document.createElement("p");caption.className="source";
 caption.textContent=t("Morphology: Leeds QAC via QuranBench. Root and gloss show possible lexical information, not a ruling or definitive verse interpretation.","Морфология: Leeds QAC через QuranBench. Корень и значения не являются окончательным толкованием аята.");root.append(caption);
}
function renderSources(){
 const box=$("source-links");box.replaceChildren();
 for(const [label,url]of [
  ["Tanzil (Uthmani 1.1)","https://tanzil.net/docs/Text_License"],
  ["QuranBench (QAC morphology)","https://quranbench.com/"+surah+"/"+ayah],
  ["QuranEnc (Rowwad RU)","https://quranenc.com/ru/browse/russian_rwwad/"+surah+"/"+ayah],
  ["At-Tabari","https://quran.ksu.edu.sa/tafseer/tabary/sura"+surah+"-aya"+ayah+".html"],
  ["Ibn Kathir","https://quran.ksu.edu.sa/tafseer/katheer/sura"+surah+"-aya"+ayah+".html"],
  ["As-Sa'di","https://quran.ksu.edu.sa/tafseer/saadi/sura"+surah+"-aya"+ayah+".html"],
  ["Quranic Arabic Corpus","https://corpus.quran.com/wordbyword.jsp?chapter="+surah+"&verse="+ayah]
 ])box.append(anchor(label,url));
}
function descendants(startId){
 const found=new Set();const todo=[startId];
 while(todo.length){const id=todo.pop();if(found.has(id))continue;found.add(id);
  for(const tag of tags)if(tag.parent_id===id&&!found.has(tag.id))todo.push(tag.id);
 }
 return found;
}
function sortedTags(){
 const out=[],visited=new Set();
 function visit(parent,depth){
  for(const item of tags.filter(x=>x.parent_id===parent).sort((a,b)=>a.sort_order-b.sort_order||a.name.localeCompare(b.name))){
   if(visited.has(item.id))continue;visited.add(item.id);
   out.push({...item,depth});visit(item.id,depth+1);
  }
 }
 visit(null,0);return out;
}
function renderTags(){
 const rows=sortedTags();
 for(const id of ["parent-tag","manage-tag","move-parent","browse-tag"])$(id).replaceChildren();
 $("parent-tag").append(option("",t("(Root level)","(Корневая метка)")));
 $("move-parent").append(option("",t("(Root level)","(Корневая метка)")));
 $("manage-tag").append(option("",t("Select tag","Выбери метку")));
 $("browse-tag").append(option("",t("Select topic","Выбери тему")));
 const currentManage=$("manage-tag").dataset.picked||"", currentBrowse=$("browse-tag").dataset.picked||"";
 for(const tag of rows){
  const label=("  ".repeat(Math.min(tag.depth,6)))+tag.name;
  for(const id of ["parent-tag","manage-tag","move-parent","browse-tag"])$(id).append(option(tag.id,label));
 }
 $("manage-tag").value=tags.some(x=>x.id===currentManage)?currentManage:"";
 $("browse-tag").value=tags.some(x=>x.id===currentBrowse)?currentBrowse:"";
 const tree=$("tag-tree");tree.replaceChildren();
 if(!rows.length){const p=document.createElement("p");p.className="help";p.textContent=t("No tags yet. Create your own hierarchy.","Меток пока нет. Создай свою структуру.");tree.append(p);return;}
 for(const tag of rows){
  const row=document.createElement("div");row.className="tag-item";row.style.marginLeft=Math.min(tag.depth,5)*12+"px";
  const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.checked=assigned.has(tag.id);
  checkbox.setAttribute("aria-label",t("Assign","Привязать")+": "+tag.name);
  checkbox.onchange=()=>{void toggleTag(tag.id,checkbox.checked,checkbox)};
  const label=document.createElement("label");label.textContent=tag.name;
  label.onclick=()=>{checkbox.click()};
  row.append(checkbox,label);tree.append(row);
 }
}
async function loadTags(){
 const {data,error}=await supabase.from("quran_tags")
 .select("id,name,parent_id,sort_order").eq("user_id",user.id).order("sort_order",{ascending:true});
 if(error)throw error;tags=data||[];
 renderTags();
}
async function loadAyahTags(){
 assigned.clear();
 const current=lessonId;
 const {data,error}=await supabase.from("quran_ayah_tags").select("tag_id")
  .eq("user_id",user.id).eq("lesson_id",current);
 if(error){notice("tag-status",error.message,true);return}
 if(current!==lessonId)return;
 for(const row of data||[])assigned.add(row.tag_id);
 renderTags();
}
async function toggleTag(tagId,enabled,checkbox){
 checkbox.disabled=true;
 try{
  const query=supabase.from("quran_ayah_tags");
  const {error}=enabled
   ?await query.insert({user_id:user.id,tag_id:tagId,lesson_id:lessonId})
   :await query.delete().eq("user_id",user.id).eq("tag_id",tagId).eq("lesson_id",lessonId);
  if(error)throw error;
  if(enabled)assigned.add(tagId);else assigned.delete(tagId);
  notice("tag-status",t("Verse tags saved.","Метки аята сохранены."));
  if($("browse-tag").value)void showRelated();
 }catch(err){checkbox.checked=!enabled;notice("tag-status",err.message,true)}
 finally{checkbox.disabled=false}
}
async function createTag(){
 const name=$("new-tag").value.trim();
 if(!name){notice("tag-status",t("Enter a name.","Укажи название."),true);return}
 const parent_id=$("parent-tag").value||null;
 const {error}=await supabase.from("quran_tags").insert({user_id:user.id,name,parent_id});
 if(error){notice("tag-status",error.message,true);return}
 $("new-tag").value="";await loadTags();notice("tag-status",t("Tag created.","Метка создана."));
}
async function renameTag(){
 const id=$("manage-tag").value,name=$("rename-tag").value.trim();if(!id||!name)return;
 const {error}=await supabase.from("quran_tags").update({name,updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
 if(error){notice("tag-status",error.message,true);return}
 $("rename-tag").value="";$("manage-tag").dataset.picked=id;await loadTags();notice("tag-status",t("Renamed.","Переименовано."));
}
async function moveTag(){
 const id=$("manage-tag").value,parent=$("move-parent").value||null;
 if(!id)return;
 if(id===parent||parent&&descendants(id).has(parent)){notice("tag-status",t("A tag cannot be its own ancestor.","Метка не может находиться внутри своего потомка."),true);return}
 const {error}=await supabase.from("quran_tags").update({parent_id:parent,updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
 if(error){notice("tag-status",error.message,true);return}
 $("manage-tag").dataset.picked=id;await loadTags();notice("tag-status",t("Moved.","Перемещено."));
}
async function deleteTag(){
 const id=$("manage-tag").value;if(!id)return;
 const name=tags.find(x=>x.id===id)?.name||"";
 if(!confirm(t("Delete tag and its verse links? Child tags must be moved first.","Удалить метку и её связи с аятами? Сначала перемести дочерние метки.")+"\n"+name))return;
 const {error}=await supabase.from("quran_tags").delete().eq("id",id).eq("user_id",user.id);
 if(error){notice("tag-status",error.message,true);return}
 $("manage-tag").dataset.picked="";await loadTags();await loadAyahTags();
 notice("tag-status",t("Tag deleted.","Метка удалена."));void showRelated();
}
async function showRelated(){
 const root=$("tag-results");root.replaceChildren();
 const id=$("browse-tag").value;$("browse-tag").dataset.picked=id;
 if(!id)return;
 const tagIds=[...descendants(id)];
 const {data,error}=await supabase.from("quran_ayah_tags")
  .select("lesson_id").eq("user_id",user.id).in("tag_id",tagIds).limit(1000);
 if(error){root.textContent=error.message;return}
 const refs=[...new Set((data||[]).map(x=>reverseCatalog.get(x.lesson_id)).filter(Boolean))];
 refs.sort((a,b)=>{
  const [s1,v1]=a.split(":").map(Number),[s2,v2]=b.split(":").map(Number);
  return s1-s2||v1-v2;
 });
 if(!refs.length){root.textContent=t("No verses under this topic yet.","Нет аятов по этой теме.");return}
 const info=document.createElement("p");info.className="help";
 info.textContent=refs.length+(data.length===1000?"+":"")+" "+t("related verses","связанных аятов");
 root.append(info);
 // Preview five verses side-by-side in a single list; no interpretations generated.
 const excerptRefs=refs.slice(0,5);
 const fetched=await Promise.allSettled(excerptRefs.map(ref=>{const [s,a]=ref.split(":").map(Number);return apiVerse(s,a)}));
 fetched.forEach((result,i)=>{
  const ref=excerptRefs[i],a=document.createElement("a");a.href=urlFor(...ref.split(":").map(Number));
  a.style.display="block";a.style.padding="11px 0";a.textContent=ref;
  if(result.status==="fulfilled"){
   const arab=document.createElement("div");arab.lang="ar";arab.dir="rtl";
   arab.style.cssText="font-size:18px;line-height:1.8;max-height:65px;overflow:hidden";
   arab.textContent=result.value.verse.text.uthmani;
   a.append(arab);
  }
  a.onclick=e=>{e.preventDefault();const [s,v]=ref.split(":").map(Number);void openVerse(s,v)};
  root.append(a);
 });
 if(refs.length>5){
  for(const ref of refs.slice(5,75)){
   const [s,a]=ref.split(":").map(Number);
   const link=document.createElement("a");link.href=urlFor(s,a);link.textContent=ref;
   link.onclick=e=>{e.preventDefault();void openVerse(s,a)};
   root.append(link);
  }
  if(refs.length>75){const msg=document.createElement("p");msg.className="help";msg.textContent=t("Showing first 75 results.","Показаны первые 75 результатов.");root.append(msg)}
 }
}
async function loadNotes(){
 const current=lessonId;
 const {data,error}=await supabase.from("quran_research_notes")
  .select("question,analysis,sources").eq("user_id",user.id).eq("lesson_id",current).maybeSingle();
 if(current!==lessonId)return;
 if(error){notice("save-state",error.message,true);return}
 $("question").value=data?.question||"";
 $("analysis").value=data?.analysis||"";
 $("sources").value=data?.sources||"";
}
async function saveNotes(){
 const save=$("save");save.disabled=true;
 notice("save-state",t("Saving…","Сохраняю…"));
 try{
  const {error}=await supabase.from("quran_research_notes").upsert({
   user_id:user.id,lesson_id:lessonId,
   question:$("question").value,analysis:$("analysis").value,sources:$("sources").value,
   updated_at:new Date().toISOString()
  },{onConflict:"user_id,lesson_id"});
  if(error)throw error;
  notice("save-state",t("Research saved privately to your account.","Исследование сохранено в личном аккаунте."));
 }catch(err){notice("save-state",err.message,true)}
 finally{save.disabled=false}
}
async function copyResearchPrompt(){
 const prompt=[
 t("You are my research assistant for Quran study. Cite primary sources and distinguish direct Quranic wording, lexical possibilities, classical tafsir and my own interpretation.","Ты помощник по изучению Корана. Ссылайся на первоисточники и разделяй прямой текст, словарные значения, классический тафсир и мои предположения."),
 t("Verse: ","Аят: ")+surah+":"+ayah,
 t("My question: ","Мой вопрос: ")+$("question").value,
 t("My analysis: ","Мой анализ: ")+$("analysis").value,
 t("Sources so far: ","Источники: ")+$("sources").value,
 t("Do not invent Arabic roots, quotations, grammatical forms or religious rulings. State uncertainty and provide links to the cited verse, dictionary or named tafsir.","Не выдумывай корни, цитаты, грамматические формы и религиозные постановления. Отмечай неопределённость и давай ссылки на аят, словарь или конкретный тафсир.")
 ].join("\n\n");
 try{await navigator.clipboard.writeText(prompt);notice("save-state",t("Research prompt copied. Paste it into your preferred AI chat.","Запрос скопирован. Вставь его в чат с ИИ."))}
 catch{notice("save-state",t("Could not copy; check browser clipboard permissions.","Не удалось скопировать; проверь разрешения браузера."),true)}
}
function sessionKey(){return "meta-quran-active-session-"+user.id}
function getSessionStart(){
 try{return localStorage.getItem(sessionKey())||null}catch{return null}
}
function refreshSession(){
 const start=getSessionStart(),active=!!start;
 $("session-start").hidden=active;
 $("session-stop").hidden=!active;
 $("session-cancel").hidden=!active;
 if(!active){set("session-status","");return}
 const date=new Date(start);
 if(!Number.isFinite(date.getTime())){
  set("session-status",t("Invalid session timestamp; discard it.","Неверная дата занятия; отмени запись."));
  return;
 }
 set("session-status",t("Started: ","Начато: ")+new Intl.DateTimeFormat(en?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"medium",timeStyle:"short"}).format(date));
}
function beginSession(){
 if(getSessionStart())return;
 try{localStorage.setItem(sessionKey(),new Date().toISOString());refreshSession()}
 catch{set("session-status",t("Browser storage is unavailable.","Не удалось сохранить начало занятия."))}
}
async function finishSession(){
 const started=getSessionStart();if(!started)return;
 const startDate=new Date(started),endDate=new Date(),minutes=(endDate.getTime()-startDate.getTime())/60000;
 if(!Number.isFinite(minutes)||minutes<0||minutes>1440){
  set("session-status",t("Session is invalid or older than 24 hours. Discard it and start a new one.","Сессия неверна или старше 24 часов. Отмени её и начни новую."));
  return;
 }
 $("session-stop").disabled=true;
 const {error}=await supabase.from("learning_sessions").insert({
  user_id:user.id,course_slug:"quran",session_date:safeDate(),
  started_at:started,ended_at:endDate.toISOString(),evidence:"confirmed_fact"
 });
 $("session-stop").disabled=false;
 if(error){set("session-status",t("Could not save: ","Ошибка сохранения: ")+error.message);return}
 try{localStorage.removeItem(sessionKey())}catch{}
 refreshSession();
 set("session-status",t("Session saved: ","Занятие сохранено: ")+Math.floor(minutes)+" "+t("minutes","мин."));
}
function cancelSession(){
 if(!getSessionStart())return;
 if(!confirm(t("Discard this unsaved study session?","Отменить незаписанное занятие?")))return;
 try{localStorage.removeItem(sessionKey())}catch{}
 refreshSession();
}
async function init(){
 readerLabels();
 user=await authenticatedUser();
 if(!user){location.replace(authPage("./quran.html"+location.search));return}
 const {data:assigned,error:enrollError}=await supabase.from("course_enrollments")
  .select("course_slug").eq("user_id",user.id).eq("course_slug","quran").maybeSingle();
 if(enrollError)throw enrollError;
 if(!assigned){status(t("Quran Study is not assigned to this account.","Изучение Корана не назначено этому аккаунту."),true);return}
 status(t("Preparing your private Quran study data…","Подготавливаю личные данные для изучения Корана…"));
 await loadCatalog();
 const url=new URL(location.href),s=Number(url.searchParams.get("s")||"2"),a=Number(url.searchParams.get("a")||"40");
 const first=Number.isInteger(s)&&s>=1&&s<=114?s:2;
 const second=Number.isInteger(a)&&a>=1&&a<=AYAH_COUNTS[first-1]?a:1;
 await loadTags();
 $("app").hidden=false;
 $("surah").onchange=()=>{void openVerse(Number($("surah").value),1)};
 $("ayah").onchange=()=>{void openVerse(surah,Number($("ayah").value))};
 $("previous").onclick=()=>nextPosition(-1);
 $("following").onclick=()=>nextPosition(1);
 $("session-start").onclick=beginSession;
 $("session-stop").onclick=finishSession;
 $("session-cancel").onclick=cancelSession;
 refreshSession();
 $("mark").onclick=markStudied;
 $("unmark").onclick=unmarkStudied;
 $("add-tag").onclick=createTag;$("rename").onclick=renameTag;
 $("move-tag").onclick=moveTag;$("remove-tag").onclick=deleteTag;
 $("browse-tag").onchange=()=>{void showRelated()};
 $("manage-tag").onchange=()=>{$("manage-tag").dataset.picked=$("manage-tag").value};
 $("save").onclick=saveNotes;$("copy-question").onclick=copyResearchPrompt;
 window.addEventListener("popstate",()=>{const u=new URL(location.href);void openVerse(Number(u.searchParams.get("s")||2),Number(u.searchParams.get("a")||40),false)});
 await openVerse(first,second,false);
}
void init().catch(err=>{console.error("Quran Study:",err);status(t("Cannot start Quran Study: ","Не удалось открыть Quran Study: ")+err.message,true)});
