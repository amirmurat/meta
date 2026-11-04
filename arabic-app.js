import {supabase,authenticatedUser,authPage} from './meta-supabase.js';
import {language} from './meta-language.js?v=3';
import {arabicLessons,arabicContexts} from './arabic-lessons.js';
import {rememberCoursePosition} from './meta-resume.js?v=2';
const $=id=>document.getElementById(id), en=language()==='en';
const say=(ru,eng)=>en?eng:ru;
function text(id,value){$(id).textContent=value;}
function state(id,value){text(id,value);$(id).hidden=false;}
function localize(){document.querySelectorAll('[data-ru][data-en]').forEach(x=>x.textContent=x.dataset[en?'en':'ru']);}
async function access(){
 const user=await authenticatedUser();
 if(!user){location.replace(authPage('./'+location.pathname.split('/').pop()+location.search));return null;}
 const {data,error}=await supabase.from('course_enrollments').select('course_slug').eq('user_id',user.id).eq('course_slug','arabic').maybeSingle();
 if(error)throw error;
 if(!data)return {user,enrolled:false};
 return {user,enrolled:true};
}
async function course(){
 const result=await access();if(!result)return;
 if(!result.enrolled){
  text('intro',say('Курс пока не назначен твоему аккаунту.','This course is not assigned to your account yet.'));
  $('course-state').replaceChildren();const a=document.createElement('a');a.href='./support.html';a.textContent=say('Запросить доступ →','Request access →');$('course-state').append(a);return;
 }
 const [{data:rows,error:rowsError},{data:done,error:doneError},{data:attempts,error:attemptError}]=await Promise.all([
  supabase.from('lessons').select('id,external_id').eq('course_slug','arabic').order('sort_order'),
  supabase.from('lesson_progress').select('lesson_id').eq('user_id',result.user.id),
  supabase.from('lesson_attempts').select('lesson_id').eq('user_id',result.user.id)
 ]);
 if(rowsError||doneError||attemptError)throw rowsError||doneError||attemptError;
 const byCode=new Map((rows||[]).map(x=>[x.external_id,x]));
 if(!arabicLessons.every(x=>byCode.has(x.id)))throw new Error(say('Уроки ещё не опубликованы в базе.','Lessons are not yet published in the database.'));
 const finished=new Set((done||[]).map(x=>x.lesson_id)), started=new Set((attempts||[]).map(x=>x.lesson_id));
 const next=arabicLessons.find(x=>!finished.has(byCode.get(x.id).id))||arabicLessons.at(-1);
 $('start').href='./arabic-lesson.html?id='+next.id;
 text('start',finished.size?say('Продолжить →','Continue →'):say('Начать первый урок →','Start first lesson →'));
 text('intro',say(`Завершено ${arabicLessons.filter(x=>finished.has(byCode.get(x.id).id)).length} из ${arabicLessons.length} занятий первого маршрута.`,`Completed ${arabicLessons.filter(x=>finished.has(byCode.get(x.id).id)).length} of ${arabicLessons.length} first-path lessons.`));
 const list=$('lesson-list');
 arabicLessons.forEach((lesson,index)=>{
  const row=byCode.get(lesson.id),li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('span'),status=document.createElement('small');
  a.href='./arabic-lesson.html?id='+lesson.id;title.textContent=`${index+1}. ${en?lesson.en:lesson.ru}`;
  status.textContent=finished.has(row.id)?say('✓ Репетиция завершена','✓ Practice completed'):started.has(row.id)?say('Ответ сохранён','Answer saved'):say('Не начато','Not started');
  a.append(title,status);li.append(a);list.append(li);
 });
 arabicContexts.slice(1).forEach(([ru,eng],i)=>{const box=document.createElement('div');box.textContent=`${String(i+2).padStart(2,'0')} · ${en?eng:ru} · ${say('в плане','planned')}`;$('roadmap').append(box)});
 $('course-content').hidden=false;
}
async function lesson(){
 const code=new URLSearchParams(location.search).get('id');
 const model=arabicLessons.find(x=>x.id===code);
 if(!model){state('lesson-state',say('Урок не найден.','Lesson not found.'));return;}
 const result=await access();if(!result)return;
 if(!result.enrolled){state('lesson-state',say('Нет доступа к курсу. Запроси его в Сообщениях.','Course access required. Request it in Messages.'));return;}
 const {data:row,error}=await supabase.from('lessons').select('id,external_id').eq('course_slug','arabic').eq('external_id',code).maybeSingle();
 if(error)throw error;if(!row)throw new Error(say('Урок ещё не опубликован.','Lesson is not published yet.'));
 const index=arabicLessons.indexOf(model);
 text('position',say(`Арабский · знакомство · урок ${index+1} из ${arabicLessons.length}`,`Arabic · introductions · lesson ${index+1} of ${arabicLessons.length}`));
 text('lesson-title',en?model.en:model.ru);text('goal',model.goal[en?'en':'ru']);
 for(const [arabic,ru,eng] of model.words){const div=document.createElement('div');div.className='arabic-word';const a=document.createElement('span');a.className='arabic-script';a.lang='ar';a.textContent=arabic;const meaning=document.createElement('span');meaning.textContent=en?eng:ru;div.append(a,meaning);$('words').append(div)}
 text('note',model.note[en?'en':'ru']);model.example.forEach(line=>{const p=document.createElement('p');p.lang='ar';p.textContent=line;$('example').append(p)});
 text('task',model.task[en?'en':'ru']);text('check',model.check[en?'en':'ru']);
 const next=arabicLessons[index+1];$('next').href=next?'./arabic-lesson.html?id='+next.id:'./arabic.html';
 text('next',next?say('Следующий урок →','Next lesson →'):say('Вернуться к курсу →','Return to course →'));
 const [{data:attempt,error:attemptError},{data:done,error:doneError},{data:notes,error:notesError}]=await Promise.all([
  supabase.from('lesson_attempts').select('answer_text').eq('user_id',result.user.id).eq('lesson_id',row.id).maybeSingle(),
  supabase.from('lesson_progress').select('lesson_id').eq('user_id',result.user.id).eq('lesson_id',row.id).maybeSingle(),
  supabase.from('notes').select('id,body').eq('user_id',result.user.id).eq('lesson_id',row.id).order('updated_at',{ascending:false}).limit(1)
 ]);
 if(attemptError||doneError||notesError)throw attemptError||doneError||notesError;
 let note=notes?.[0];$('notes').value=note?.body||'';
 $('save-notes').addEventListener('click',async()=>{
  const button=$('save-notes');button.disabled=true;state('notes-state',say('Сохраняю…','Saving…'));
  try{const payload={user_id:result.user.id,course_slug:'arabic',lesson_id:row.id,body:$('notes').value};
   const response=note?.id?await supabase.from('notes').update({body:payload.body,updated_at:new Date().toISOString()}).eq('id',note.id).eq('user_id',result.user.id):await supabase.from('notes').insert(payload).select('id').single();
   if(response.error)throw response.error;if(!note)note={id:response.data.id};state('notes-state',say('Заметки сохранены.','Notes saved.'));
  }catch(e){state('notes-state',say('Ошибка сохранения: ','Save failed: ')+e.message)}finally{button.disabled=false}
 });
 $('answer').value=attempt?.answer_text||'';let saved=attempt?.answer_text||'';
 if(done){$('rehearsed').checked=true;state('complete-help',say('Эта репетиция уже отмечена завершённой.','This practice is already marked complete.'))}
 const update=()=>{
  const missing=[];if($('answer').value.trim().length<12)missing.push(say('напиши ответ (не менее 12 символов)','write an answer (at least 12 characters)'));
  if($('answer').value!==saved)missing.push(say('сохрани ответ','save your answer'));
  if(!$('rehearsed').checked)missing.push(say('подтверди устную репетицию','confirm speaking rehearsal'));
  $('complete').disabled=!!missing.length||!!done;
  if(!done)text('complete-help',missing.length?say('Чтобы завершить: ','To complete: ')+missing.join('; ')+'.':say('Можно отметить репетицию завершённой.','Ready to mark practice complete.'));
 };
 $('answer').addEventListener('input',update);$('rehearsed').addEventListener('change',update);update();
 $('save').addEventListener('click',async()=>{
  const value=$('answer').value;$('save').disabled=true;state('save-state',say('Сохраняю…','Saving…'));
  try{const {error:saveError}=await supabase.from('lesson_attempts').upsert({user_id:result.user.id,lesson_id:row.id,answer_text:value,ai_reviewed:false,self_passed:false},{onConflict:'user_id,lesson_id'});if(saveError)throw saveError;saved=value;state('save-state',say('Ответ сохранён в аккаунте.','Answer saved to your account.'))}
  catch(e){state('save-state',say('Ошибка сохранения: ','Save failed: ')+e.message)}
  finally{$('save').disabled=false;update()}
 });
 $('complete').addEventListener('click',async()=>{
  if($('complete').disabled)return;$('complete').disabled=true;state('complete-help',say('Сохраняю завершение…','Saving completion…'));
  const {error:completeError}=await supabase.rpc('meta_complete_arabic_lesson',{p_lesson_id:row.id});
  if(completeError){state('complete-help',say('Не удалось завершить: ','Could not complete: ')+completeError.message);update();return;}
  state('complete-help',say('Репетиция сохранена. Проверки произношения не было.','Practice saved. Pronunciation was not assessed.'));$('next').classList.add('arabic-button');
 });
 try{await rememberCoursePosition(result.user.id,'arabic',row.id)}catch{}
 $('lesson-state').hidden=true;$('lesson-content').hidden=false;
}
localize();(document.getElementById('lesson-content')?lesson():course()).catch(error=>{console.error('Arabic course:',error);state(document.getElementById('lesson-content')?'lesson-state':'course-state',say('Не удалось загрузить курс: ','Could not load course: ')+error.message)});
