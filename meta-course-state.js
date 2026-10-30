import {supabase} from './meta-supabase.js';
import {language} from './meta-language.js';
export async function loadAttemptedLessons(userId) {
 const {data,error}=await supabase.from('lesson_attempts').select('lesson_id').eq('user_id',userId);
 // Unknown is not the same as no activity.
 return error ? null : new Set((data||[]).map(x=>x.lesson_id));
}
export function lessonStatus(done,attempted,id) {
 const en=language()==='en';
 if(done)return en?'✓ Completed':'✓ Завершено';
 if(attempted?.has(id))return en?'In progress · answer saved':'В процессе · ответ сохранён';
 if(attempted===null)return en?'Not marked complete':'Нет отметки завершения';
 return en?'Not started':'Не начато';
}
