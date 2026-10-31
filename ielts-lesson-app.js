import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language,localizeRecord,tr} from "./meta-language.js?v=3";
import {icon} from "./meta-icons.js";
import {completionRequirements} from "./meta-routing.js";
import {rememberCoursePosition} from "./meta-resume.js";

const lessonId = new URLSearchParams(location.search).get("id") || "";
const $ = id => document.getElementById(id);
const guestPrefix = "meta-ielts-guest-v1-";
const guestKeys = {
  answer: guestPrefix + "answer-" + lessonId,
  notes: guestPrefix + "notes-" + lessonId
};
let currentUser = null;
let row = null;
let noteId = null;
let attemptTimer = null;
let notesTimer = null;
let attemptQueue = Promise.resolve();
let notesQueue = Promise.resolve();
let answerDirty=false,notesDirty=false;
window.addEventListener("beforeunload",event=>{if(answerDirty||notesDirty){event.preventDefault();event.returnValue="";}});

function setText(id, text) { $(id).textContent = text; }
function showError(text) {
  $("error").hidden = false;
  setText("error", text);
  setText("code", "Ошибка");
}
function getLocal(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}
function saveLocal(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const old = button.textContent;
    button.textContent = "Скопировано";
    setTimeout(() => { button.textContent = old; }, 1500);
  } catch {
    setText("save-state", "Не удалось скопировать. Выдели текст вручную.");
  }
}
function showTaskMode(type) {
  $("answer").classList.add("plain");
  $("answer-label").textContent=type==="practical"?"Ответ и свидетельство практики":"Твой письменный ответ";
  const sec=lessonId.split(".")[1];
  $("input-help").textContent=sec==="1"
   ?"Используй реальное аудио из официального задания. Укажи источник и номер вопроса/таймкод. Без записи/транскрипта ИИ не может проверить, что ты действительно услышал."
   :sec==="2"?"Укажи конкретный английский текст, абзац и доказательство ответа."
   :sec==="3"?"Напиши английский фрагмент самостоятельно. Проверь смысл, структуру и язык."
   :"Сначала произнеси ответ вслух и по возможности запиши аудио отдельно. Сюда внеси текст/наблюдения; одна расшифровка не доказывает беглость и произношение.";
  $("editor-toolbar").hidden=false;$("dartpad").hidden=true;
}
function updateButton() {
  const missing=completionRequirements({signedIn:!!currentUser,answer:$("answer").value,criteria:[...document.querySelectorAll("#criteria input")].map(x=>x.checked),aiReviewed:$("ai-reviewed").checked,selfPassed:$("self-passed").checked},language()==="en");
  $("completion-help").textContent=missing.length?(language()==="en"?"To finish: ":"Чтобы завершить: ")+missing.join("; ")+".":(language()==="en"?"Ready. Save your confirmed completion below.":"Всё готово. Сохрани подтверждение выполнения ниже.");
  const answer = $("answer").value.trim();
  $("check-button").disabled = !answer;
  const allCriteriaChecked = [...document.querySelectorAll("#criteria input[type=checkbox]")].every(x => x.checked);
  $("confirm-completion").disabled =
    !currentUser || !answer || !allCriteriaChecked ||
    !$("ai-reviewed").checked || !$("self-passed").checked;
}
async function saveAttemptNow() {
  if (!row) return;
  if (!currentUser) {
    setText("save-state", saveLocal(guestKeys.answer, $("answer").value)
      ? "Локальный черновик сохранён. Для синхронизации войди в аккаунт."
      : "Черновик не удалось сохранить.");
    return;
  }
  const payload = {
    user_id: currentUser.id,
    lesson_id: row.id,
    answer_text: $("answer").value,
    ai_reviewed: $("ai-reviewed").checked,
    self_passed: $("self-passed").checked
  };
  attemptQueue = attemptQueue.catch(() => {}).then(async () => {
    const {error} = await supabase.from("lesson_attempts").upsert(payload, {onConflict:"user_id,lesson_id"});
    if (error) throw error;
    if($("answer").value===payload.answer_text && $("ai-reviewed").checked===payload.ai_reviewed && $("self-passed").checked===payload.self_passed)answerDirty=false;
    setText("save-state", "Ответ сохранён в твоём аккаунте.");
  });
  try { await attemptQueue; }
  catch (err) { setText("save-state", "Ошибка сохранения ответа: " + err.message); throw err; }
}
function scheduleAttempt() {
  answerDirty=true;
  if (attemptTimer) clearTimeout(attemptTimer);
  if (!currentUser) {
    saveLocal(guestKeys.answer, $("answer").value);
    setText("save-state", "Черновик на этом устройстве. Войди, чтобы сохранить в аккаунте.");
    return;
  }
  setText("save-state", "Сохраняю…");
  attemptTimer = setTimeout(() => { void saveAttemptNow().catch(() => {}); }, 700);
}
async function recordSubmission() {
  if (!row || !currentUser) {
    setText("submission-state","Войди в аккаунт, чтобы зафиксировать время.");
    return;
  }
  if (!$("answer").value.trim()){
    setText("submission-state","Сначала напиши ответ.");
    $("answer").focus();
    return;
  }
  const button=$("record-submission");
  button.disabled=true;
  setText("submission-state","Записываю время сдачи…");
  try{
    if(attemptTimer)clearTimeout(attemptTimer);
    await saveAttemptNow();
    const timestamp=new Date().toISOString();
    const {error}=await supabase.from("lesson_attempts")
      .update({submitted_at:timestamp})
      .eq("user_id",currentUser.id).eq("lesson_id",row.id);
    if(error)throw error;
    setText("submission-state","Сдача зафиксирована: "+
      new Intl.DateTimeFormat(language()==="en"?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"short",timeStyle:"medium"}).format(new Date(timestamp))+
      " (Алматы).");
  }catch(error){
    setText("submission-state","Ошибка записи: "+error.message);
  }finally{button.disabled=false;}
}
async function saveNotesNow() {
  if (!row) return;
  if (!currentUser) {
    setText("notes-state", saveLocal(guestKeys.notes, $("notes").value)
      ? "Локально сохранено (без синхронизации)."
      : "Не удалось сохранить.");
    return;
  }
  const body = $("notes").value;
  notesQueue = notesQueue.catch(() => {}).then(async () => {
    if (noteId) {
      const {error} = await supabase.from("notes").update({body,updated_at:new Date().toISOString()})
        .eq("id",noteId).eq("user_id",currentUser.id);
      if (error) throw error;
    } else {
      const {data,error} = await supabase.from("notes").insert({
        user_id:currentUser.id,course_slug:"ielts",lesson_id:row.id,body
      }).select("id").single();
      if (error) throw error;
      noteId = data.id;
    }
    if($("notes").value===body)notesDirty=false;
    setText("notes-state", "Заметки сохранены в аккаунте.");
  });
  try { await notesQueue; }
  catch (err) { setText("notes-state","Ошибка сохранения заметок: " + err.message); }
}
function scheduleNotes() {
  notesDirty=true;
  if (notesTimer) clearTimeout(notesTimer);
  if (!currentUser) {
    saveLocal(guestKeys.notes, $("notes").value);
    setText("notes-state", "Локальная заметка. Для синхронизации войди.");
    return;
  }
  setText("notes-state", "Сохраняю…");
  notesTimer = setTimeout(() => { void saveNotesNow(); }, 700);
}
function initCriteria(criteria) {
  const list = $("criteria");
  for (const criterion of criteria) {
    const li = document.createElement("li"), label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const span = document.createElement("span"); span.textContent = criterion;
    checkbox.addEventListener("change", updateButton);
    label.append(checkbox, span); li.append(label); list.append(li);
  }
  $("check-button").addEventListener("click", () => {
    if (!$("answer").value.trim()) return;
    $("check-panel").hidden = !$("check-panel").hidden;
    $("check-button").textContent = $("check-panel").hidden ? "Показать критерии после попытки" : "Скрыть критерии";
    updateButton();
  });
}
async function loadPersonalState() {
  if (!currentUser) {
    $("answer").value = getLocal(guestKeys.answer);
    $("notes").value = getLocal(guestKeys.notes);
    $("auth-notice").hidden = false;
    $("auth-notice-link").href = authPage("ielts-lesson.html?id=" + encodeURIComponent(lessonId));
    setText("save-state", "Без входа черновики остаются на этом устройстве.");
    setText("notes-state", "Без входа заметки остаются на этом устройстве.");
    updateButton();
    return;
  }
  setText("account-status", currentUser.email || "Мой аккаунт");
  $("profile-link").href = "./profile.html";
  const [a,n,c] = await Promise.all([
    supabase.from("lesson_attempts").select("answer_text,ai_reviewed,self_passed,submitted_at,ai_review_confirmed_at")
      .eq("user_id",currentUser.id).eq("lesson_id",row.id).maybeSingle(),
    supabase.from("notes").select("id,body").eq("user_id",currentUser.id)
      .eq("lesson_id",row.id).order("updated_at",{ascending:false}).limit(1),
    supabase.from("lesson_progress").select("lesson_id")
      .eq("user_id",currentUser.id).eq("lesson_id",row.id).maybeSingle()
  ]);
  for (const result of [a,n,c]) if (result.error) throw result.error;
  $("answer").value = a.data?.answer_text || "";
  $("ai-reviewed").checked = !!a.data?.ai_reviewed;
  $("self-passed").checked = !!a.data?.self_passed;
  if(a.data?.submitted_at){
    setText("submission-state","Последняя сдача: "+
      new Intl.DateTimeFormat(language()==="en"?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"short",timeStyle:"medium"})
        .format(new Date(a.data.submitted_at))+" (Алматы).");
  }
  const note = (n.data || [])[0];
  noteId = note?.id || null;
  $("notes").value = note?.body || "";
  if (c.data) {
    $("completion-status").hidden = false;
    setText("completion-status", "Этот урок отмечен выполненным в твоём аккаунте.");
    $("unmark-completion").hidden = false;
  }
  setText("save-state", "Черновик синхронизируется с аккаунтом.");
  setText("notes-state", "Заметки синхронизируются с аккаунтом.");
  updateButton();
}
function initNav(nav) {
  const index = nav.findIndex(x => x.external_id === lessonId);
  setText("position", (index+1) + " / " + nav.length);
  for (const [linkId, offset, fallback] of [
    ["prev", -1, "← Все модули"], ["next", 1, "Все модули →"]
  ]) {
    const item = nav[index+offset], link = $(linkId);
    link.href = item ? "./ielts-lesson.html?id=" + encodeURIComponent(item.external_id) : "./ielts.html";
    link.textContent = item ? (offset<0?(language()==="en"?"← Previous · ":"← Предыдущий · "):(language()==="en"?"Next lesson · ":"Следующий урок · ")) + item.external_id + (offset>0?" →":"") : fallback;
  }
}
async function completeLesson() {
  if (!currentUser || !row || $("confirm-completion").disabled) return;
  const button = $("confirm-completion"); button.disabled = true;
  setText("completion-result", "Сохраняю подтверждение…");
  try {
    if (attemptTimer) clearTimeout(attemptTimer);
    await saveAttemptNow();
    // Completion table intentionally disallows UPDATE to clients.
    // Insert only when not already complete, rather than upserting.
    const {data:existing,error:readError} = await supabase.from("lesson_progress")
      .select("lesson_id").eq("user_id",currentUser.id).eq("lesson_id",row.id).maybeSingle();
    if (readError) throw readError;
    if (!existing) {
      const {error} = await supabase.from("lesson_progress").insert({
        user_id:currentUser.id,
        lesson_id:row.id,
        verification_method:"self_ai_review"
      });
      if (error) throw error;
    }
    $("completion-status").hidden = false;
    setText("completion-status", "Отмечено выполненным. Проверку с ИИ подтвердил ты сам; автоматической оценки нет.");
    $("unmark-completion").hidden = false;
    setText("completion-result", "Сохранено в твоём аккаунте.");
    $("next").classList.add("meta-primary-action");
    const onward=$("next").cloneNode(true);onward.removeAttribute("id");$("completion-result").append(document.createElement("br"),onward);
  } catch(err) {
    setText("completion-result", "Не удалось засчитать: " + String(err.message || err));
  } finally {updateButton();}
}
async function unmarkLesson() {
  if (!currentUser || !row) return;
  if(!confirm(language()==="en"?"Remove completion? Your answer and notes will remain.":"Снять отметку выполнения? Ответ и заметки сохранятся."))return;
  const {error} = await supabase.from("lesson_progress").delete()
    .eq("user_id",currentUser.id).eq("lesson_id",row.id);
  if (error) {
    setText("completion-result", "Ошибка отмены: " + error.message);
    return;
  }
  $("completion-status").hidden = true; $("unmark-completion").hidden = true;
  $("self-passed").checked = false;
  scheduleAttempt();
  setText("completion-result", "Отметка выполнения снята.");
  updateButton();
}
async function load() {
  if (!/^A\.[1-4](?:\.\d+){3}$/.test(lessonId)) {
    showError("Неверная ссылка. Вернись к разделам IELTS."); return;
  }
  $("back").href = "./ielts.html#group-" + lessonId.split(".").slice(0,4).join(".");
  try {
    currentUser=await authenticatedUser();
    if(!currentUser){
      location.replace(authPage("ielts-lesson.html?id="+encodeURIComponent(lessonId)));
      return;
    }
    const [lessonResult,navResult]=await Promise.all([
      supabase.from("lessons")
        .select("id,external_id,title,title_en,sort_order,task_type,lesson_content,lesson_content_en")
        .eq("course_slug","ielts").eq("external_id",lessonId).limit(1),
      supabase.from("lessons")
        .select("external_id,sort_order")
        .eq("course_slug","ielts").order("sort_order",{ascending:true})
    ]);
    if(lessonResult.error)throw lessonResult.error;
    if(navResult.error)throw navResult.error;
    const rows=lessonResult.data||[],nav=navResult.data||[];
    if(!rows.length){
      showError("Эта программа не назначена твоему аккаунту. Перейди в «Мои программы».");
      return;
    }
    if(rows.length!==1||nav.length!==332)throw new Error("Неполный каталог");
    row={...rows[0],...localizeRecord(rows[0])};
    const content = row.lesson_content || {};
    if (!content.theory || !content.example || !content.task || !Array.isArray(content.criteria)) throw new Error("Контент не найден");
    document.title = row.external_id + " — " + row.title + " | Meta";
    setText("code", "IELTS · " + row.external_id);
    setText("title", row.title);
    setText("prerequisites", content.prerequisites ? "Предпосылки: " + content.prerequisites : "");
    setText("theory", content.theory);
    setText("example", content.example);
    setText("task", content.task);
    const official=$("official-source");
    official.href=content.resource_url||"https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test";
    $("copy-example").addEventListener("click",()=>copyText(content.example, $("copy-example")));
    $("copy-answer").addEventListener("click",()=>copyText($("answer").value, $("copy-answer")));
    $("copy-ai-request").addEventListener("click",()=>{
      const response=$("answer").value.trim();
      if(!response){
        setText("save-state","Сначала напиши собственный ответ.");
        $("answer").focus();
        return;
      }
      const instructions=[
        "Ты проверяющий моего самостоятельного микроурока IELTS. Проверь по критериям, не решай за меня.",
        "Микроурок: "+row.external_id+" — "+row.title,
        "Официальные тренировочные материалы: "+(content.resource_url||"https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test"),
        "Тип: "+row.task_type,
        "Задание:\n"+content.task,
        "Критерии:\n"+content.criteria.map((x,i)=>(i+1)+". "+x).join("\n"),
        "Мой ответ:\n"+response,
        "Дай конкретные замечания, укажи, что исправить, и попроси при необходимости показать вывод запуска.",
        "Не утверждай, что услышал аудио или оценил произношение без реальной записи. Отличай текстовую проверку от фактического Listening/Speaking.",
        "В конце скажи, соответствуют ли ответы критериям, или нужно доработать."
      ];
      void copyText(instructions.map(tr).join("\n\n"),$("copy-ai-request"));
    });
    showTaskMode(row.task_type);
    initCriteria(content.criteria);
    initNav(nav);
    $("answer").addEventListener("input",()=>{updateButton();scheduleAttempt();});
    $("notes").addEventListener("input",scheduleNotes);
    $("ai-reviewed").addEventListener("change",()=>{
      updateButton();
      scheduleAttempt();
      if($("ai-reviewed").checked && currentUser){
        void (async()=>{
          try{
            if(attemptTimer)clearTimeout(attemptTimer);
            await saveAttemptNow();
            const {error}=await supabase.from("lesson_attempts")
              .update({ai_review_confirmed_at:new Date().toISOString()})
              .eq("user_id",currentUser.id).eq("lesson_id",row.id);
            if(error)throw error;
          }catch(error){setText("save-state","Ошибка записи проверки: "+error.message);}
        })();
      }
    });
    $("self-passed").addEventListener("change",()=>{updateButton();scheduleAttempt();});
    $("confirm-completion").addEventListener("click",completeLesson);
    $("unmark-completion").addEventListener("click",unmarkLesson);
    $("save-now").addEventListener("click",async()=>{
      if (attemptTimer) clearTimeout(attemptTimer);
      try {await saveAttemptNow();}catch{}
    });
    $("record-submission").addEventListener("click",recordSubmission);
    $("save-notes").addEventListener("click",async()=>{
      if (notesTimer) clearTimeout(notesTimer);
      await saveNotesNow();
    });
    await loadPersonalState();
    $("save-now").prepend(icon("check"));$("confirm-completion").prepend(icon("check"));
    $("lesson").hidden = false;
    rememberCoursePosition(currentUser.id,"ielts",row.id);
  } catch (err) {
    console.error("IELTS lesson:",err);
    showError("Не удалось загрузить страницу. Проверь интернет и повтори.");
  }
}
void load();
