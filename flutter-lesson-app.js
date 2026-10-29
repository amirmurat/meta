import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";

const projectUrl = "https://munmvexfrtqwmwptafkf.supabase.co";
const publishableKey = "sb_publishable_-4QiT3aG9-a54aKVxTFo3g_CjdpFCWz";
const lessonId = new URLSearchParams(location.search).get("id") || "";
const $ = id => document.getElementById(id);
const guestPrefix = "meta-flutter-guest-v1-";
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
  if (type === "code") {
    setText("answer-label", "Редактор кода");
    setText("input-help", "Пиши здесь Dart/Flutter-код. Сайт не компилирует его автоматически: запускай в DartPad, Flutter-проекте или отдельной SQL-среде и проверяй с ИИ.");
    $("dartpad").hidden = lessonId === "P02";
    if (lessonId === "P02") setText("input-help", "Напиши SQL и проверь его в тестовой базе. На этой странице код не выполняется.");
  } else {
    $("answer").classList.add("plain");
    setText("answer-label", type === "practical" ? "Что сделал и какой получил результат" : "Твоё объяснение");
    setText("input-help", type === "practical"
      ? "Опиши реальное выполнение задания и проверку результата. Не утверждай, что код запускался, если это не так."
      : "Ответь своими словами. После попытки открой критерии, обсуди ответ с ИИ и самостоятельно оцени результат.");
    $("editor-toolbar").hidden = true;
  }
}
function updateButton() {
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
    setText("save-state", "Ответ сохранён в твоём аккаунте.");
  });
  try { await attemptQueue; }
  catch (err) { setText("save-state", "Ошибка сохранения ответа: " + err.message); throw err; }
}
function scheduleAttempt() {
  if (attemptTimer) clearTimeout(attemptTimer);
  if (!currentUser) {
    saveLocal(guestKeys.answer, $("answer").value);
    setText("save-state", "Черновик на этом устройстве. Войди, чтобы сохранить в аккаунте.");
    return;
  }
  setText("save-state", "Сохраняю…");
  attemptTimer = setTimeout(() => { void saveAttemptNow().catch(() => {}); }, 700);
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
        user_id:currentUser.id,course_slug:"flutter",lesson_id:row.id,body
      }).select("id").single();
      if (error) throw error;
      noteId = data.id;
    }
    setText("notes-state", "Заметки сохранены в аккаунте.");
  });
  try { await notesQueue; }
  catch (err) { setText("notes-state","Ошибка сохранения заметок: " + err.message); }
}
function scheduleNotes() {
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
    $("auth-notice-link").href = authPage("flutter-lesson.html?id=" + encodeURIComponent(lessonId));
    setText("save-state", "Без входа черновики остаются на этом устройстве.");
    setText("notes-state", "Без входа заметки остаются на этом устройстве.");
    updateButton();
    return;
  }
  setText("account-status", currentUser.email || "Мой аккаунт");
  $("profile-link").href = "./profile.html";
  const [a,n,c] = await Promise.all([
    supabase.from("lesson_attempts").select("answer_text,ai_reviewed,self_passed")
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
    link.href = item ? "./flutter-lesson.html?id=" + encodeURIComponent(item.external_id) : "./flutter.html";
    link.textContent = item ? (offset<0?"← ":"") + item.external_id + (offset>0?" →":"") : fallback;
  }
}
async function completeLesson() {
  if (!currentUser || !row) return;
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
  } catch(err) {
    setText("completion-result", "Не удалось засчитать: " + String(err.message || err));
  } finally {updateButton();}
}
async function unmarkLesson() {
  if (!currentUser || !row) return;
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
  if (!/^(D|U|S|N|P|E|C)\d{2}$/.test(lessonId)) {
    showError("Неверная ссылка. Вернись к списку модулей."); return;
  }
  $("back").href = "./flutter.html#module-" + lessonId[0];
  try {
    const query = "?select=id,external_id,title,sort_order,task_type,lesson_content&course_slug=eq.flutter&external_id=eq." + lessonId + "&limit=1";
    const navQuery = "?select=external_id,sort_order&course_slug=eq.flutter&order=sort_order.asc";
    const [lessonResponse, navResponse, loggedIn] = await Promise.all([
      fetch(projectUrl + "/rest/v1/lessons" + query, {headers:{apikey:publishableKey}}),
      fetch(projectUrl + "/rest/v1/lessons" + navQuery, {headers:{apikey:publishableKey}}),
      authenticatedUser()
    ]);
    if (!lessonResponse.ok || !navResponse.ok) throw new Error("Ошибка получения урока");
    const rows = await lessonResponse.json(), nav = await navResponse.json();
    if (rows.length!==1 || !Array.isArray(nav) || nav.length!==56) throw new Error("Неполный каталог");
    row = rows[0]; currentUser = loggedIn;
    const content = row.lesson_content || {};
    if (!content.theory || !content.example || !content.task || !Array.isArray(content.criteria)) throw new Error("Контент не найден");
    document.title = row.external_id + " — " + row.title + " | Meta";
    setText("code", "Flutter · " + row.external_id);
    setText("title", row.title);
    setText("prerequisites", content.prerequisites ? "Предпосылки: " + content.prerequisites : "");
    setText("theory", content.theory);
    setText("example", content.example);
    setText("task", content.task);
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
        "Ты проверяющий моего самостоятельного микроурока Flutter. Проверь по критериям, не решай за меня.",
        "Микроурок: "+row.external_id+" — "+row.title,
        "Тип: "+row.task_type,
        "Задание:\n"+content.task,
        "Критерии:\n"+content.criteria.map((x,i)=>(i+1)+". "+x).join("\n"),
        "Мой ответ:\n"+response,
        "Дай конкретные замечания, укажи, что исправить, и попроси при необходимости показать вывод запуска.",
        "Не утверждай, что код компилировался или запускался, если ты не выполнял реальный запуск.",
        "В конце скажи, соответствуют ли ответы критериям, или нужно доработать."
      ];
      void copyText(instructions.join("\n\n"),$("copy-ai-request"));
    });
    showTaskMode(row.task_type);
    initCriteria(content.criteria);
    initNav(nav);
    $("answer").addEventListener("input",()=>{updateButton();scheduleAttempt();});
    $("notes").addEventListener("input",scheduleNotes);
    $("ai-reviewed").addEventListener("change",()=>{updateButton();scheduleAttempt();});
    $("self-passed").addEventListener("change",()=>{updateButton();scheduleAttempt();});
    $("confirm-completion").addEventListener("click",completeLesson);
    $("unmark-completion").addEventListener("click",unmarkLesson);
    $("save-now").addEventListener("click",async()=>{
      if (attemptTimer) clearTimeout(attemptTimer);
      try {await saveAttemptNow();}catch{}
    });
    $("save-notes").addEventListener("click",async()=>{
      if (notesTimer) clearTimeout(notesTimer);
      await saveNotesNow();
    });
    await loadPersonalState();
    $("lesson").hidden = false;
  } catch (err) {
    console.error("Flutter lesson:",err);
    showError("Не удалось загрузить страницу. Проверь интернет и повтори.");
  }
}
void load();
