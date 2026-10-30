// Original, hand-authored pilot items. No official IELTS content is reproduced.
// This is a short Reading-skills diagnostic, NOT an IELTS mock or band estimate.
export const ASSESSMENT={
 key:"ielts-reading-foundations-v1",course:"ielts",version:"1",
 name:{ru:"IELTS Reading · диагностика навыков",en:"IELTS Reading · Skills Check"},
 description:{ru:"12 оригинальных тренировочных вопросов · 3 коротких текста · ориентир: 12–18 минут",en:"12 original practice questions · 3 short passages · about 12–18 minutes"},
 warning:{ru:"Это не официальный IELTS mock. Результат показывает только навыки, проверенные здесь; IELTS band не рассчитывается.",en:"This is not an official IELTS mock. It assesses only the skills sampled here and does not generate an IELTS band score."},
 skills:{
  detail:{ru:"Поиск точной информации",en:"Finding details",lesson:"A.2.3.1.1"},
  paraphrase:{ru:"Понимание перефразирования",en:"Recognising paraphrases",lesson:"A.2.3.2.1"},
  inference:{ru:"Выводы на основе текста",en:"Evidence-based inference",lesson:"A.2.4.1.1"},
  not_given:{ru:"Отличать факт от Not Given",en:"True / False / Not Given",lesson:"A.2.4.2.3"}
 },
 passages:[
  {id:"garden",title:"Community gardens",text:"At the beginning of 2024, the Eastbridge Community Garden allowed residents to reserve a planting bed for a small annual fee. Of the 80 beds, 20 were reserved for local schools. During dry months, gardeners were asked to collect rainwater from shared tanks. A university team monitored the site for six months and found that average afternoon surface temperature was 1.5°C lower inside the garden than on the nearby paved square. The researchers did not measure air quality. The organisers hope to offer free workshops but have not announced a starting date."},
  {id:"study",title:"Two revision methods",text:"A college compared two revision routines among 60 volunteers preparing for a terminology quiz. Students in Group A read their notes twice. Students in Group B completed a short practice quiz and then reviewed every incorrect answer. Both groups were given 40 minutes to prepare. In a test the following week, Group B answered more questions correctly on average. However, the college did not record how much studying the students did outside the experiment. The researchers therefore called the results promising rather than proof that one approach always works better."},
  {id:"shuttle",title:"A city transport trial",text:"Riverton launched a six-week electric shuttle trial on a route connecting the railway station and the public library. Shuttles ran every 15 minutes on weekdays and every 30 minutes at weekends. Passengers travelled free during the trial. The city collected 420 online comments, but submission was voluntary, so officials warned that the comments might not represent every passenger. The council will decide whether to continue the service after examining operating costs and passenger numbers. It has not announced when the decision will be made."}
 ],
 questions:[
  {id:"g1",passage:"garden",skill:"detail",prompt:"How many planting beds were reserved for schools?",options:["20","60","80","The passage does not say"],answer:0,explanation:{ru:"Из 80 грядок 20 были закреплены за школами. Не путай общее количество с частью.",en:"Of the 80 beds, 20 were reserved for schools. Distinguish the total from the subset."}},
  {id:"g2",passage:"garden",skill:"paraphrase",prompt:"What were gardeners asked to do in dry months?",options:["Buy bottled water","Collect rainwater from shared tanks","Stop using their planting beds","Pay an additional water fee"],answer:1,explanation:{ru:"В тексте сказано «collect rainwater from shared tanks». Вариант перефразирует то же действие.",en:"The passage says 'collect rainwater from shared tanks'. The answer preserves the original meaning."}},
  {id:"g3",passage:"garden",skill:"inference",prompt:"Which conclusion is supported by the measurements?",options:["The garden improved air quality","The garden was cooler at all times of day","The garden had a lower average afternoon surface temperature than the paved square","The garden reduced the city's annual energy consumption"],answer:2,explanation:{ru:"Измеряли температуру поверхности днём, а не качество воздуха или температуру в любое время.",en:"Only afternoon surface temperatures were compared, not air quality or all-day temperatures."}},
  {id:"g4",passage:"garden",skill:"not_given",prompt:"Statement: The garden improved the quality of the surrounding air.",options:["TRUE","FALSE","NOT GIVEN"],answer:2,explanation:{ru:"Исследователи не измеряли качество воздуха. Отсутствие данных не означает, что улучшения не было.",en:"Air quality was not measured. Missing evidence is NOT GIVEN, not FALSE."}},
  {id:"s1",passage:"study",skill:"detail",prompt:"How long did each group have to prepare?",options:["One week","60 minutes","40 minutes","The researchers did not specify"],answer:2,explanation:{ru:"В тексте: «Both groups were given 40 minutes to prepare».",en:"The passage states that both groups were given 40 minutes."}},
  {id:"s2",passage:"study",skill:"paraphrase",prompt:"Which option best describes Group B's routine?",options:["They read all notes twice","They tested themselves and revisited mistakes","They listened to an instructor's lecture","They studied without attempting any questions"],answer:1,explanation:{ru:"«Completed a short practice quiz» и «reviewed every incorrect answer» = самопроверка и разбор ошибок.",en:"A short practice quiz followed by review of incorrect answers means self-testing and error review."}},
  {id:"s3",passage:"study",skill:"inference",prompt:"Why did researchers avoid claiming their method was always superior?",options:["They had not tracked outside study time","Group A had more volunteers","The two groups prepared for different tests","Group B had no improvement at all"],answer:0,explanation:{ru:"Дополнительное обучение вне эксперимента не контролировалось, поэтому нельзя сделать универсальный причинный вывод.",en:"Outside study time was unrecorded, limiting the strength of a causal conclusion."}},
  {id:"s4",passage:"study",skill:"not_given",prompt:"Statement: Group B's students slept longer than Group A's students before the final quiz.",options:["TRUE","FALSE","NOT GIVEN"],answer:2,explanation:{ru:"Сон участников вообще не упоминался. Это Not Given.",en:"The passage gives no information about sleep. This is NOT GIVEN."}},
  {id:"t1",passage:"shuttle",skill:"detail",prompt:"How often did shuttles run at weekends?",options:["Every 15 minutes","Every 30 minutes","Every 45 minutes","Once an hour"],answer:1,explanation:{ru:"Каждые 15 минут — в будни, каждые 30 — в выходные.",en:"Every 15 minutes applies to weekdays; 30 minutes applies to weekends."}},
  {id:"t2",passage:"shuttle",skill:"paraphrase",prompt:"Why should officials be cautious about the 420 online comments?",options:["All comments came from paid passengers","People chose whether to comment, so the sample might be unrepresentative","The comments were collected before the trial","None of the comments mentioned the shuttle"],answer:1,explanation:{ru:"Добровольная обратная связь может не отражать мнение всех пассажиров — это смысл «voluntary» и «might not represent».",en:"Voluntary comments may be unrepresentative of the entire passenger population."}},
  {id:"t3",passage:"shuttle",skill:"inference",prompt:"Which statement best describes the council's current position?",options:["It has not yet decided whether to continue the service","It has permanently cancelled the route","It has approved a ten-year expansion","It plans to charge passengers from next Monday"],answer:0,explanation:{ru:"Совет примет решение после анализа расходов и пассажиропотока; решение ещё не объявлено.",en:"The council will decide after reviewing costs and ridership; no decision is stated."}},
  {id:"t4",passage:"shuttle",skill:"not_given",prompt:"Statement: The electric shuttle was powered exclusively by renewable electricity.",options:["TRUE","FALSE","NOT GIVEN"],answer:2,explanation:{ru:"Электрический транспорт упоминается, но источник электроэнергии — нет.",en:"The shuttle is described as electric, but the source of its electricity is not specified."}}
 ]
};
export function evaluateAssessment(responses){
 const bySkill={};
 for(const key of Object.keys(ASSESSMENT.skills))bySkill[key]={correct:0,total:0};
 let correct=0;
 const details=[];
 for(const q of ASSESSMENT.questions){
  const answer=Number.isInteger(responses?.[q.id])?responses[q.id]:null;
  const isCorrect=answer===q.answer;
  if(isCorrect)correct++;
  bySkill[q.skill].total++;
  if(isCorrect)bySkill[q.skill].correct++;
  details.push({id:q.id,answer,correct:isCorrect});
 }
 return {correct,total:ASSESSMENT.questions.length,bySkill,details};
}
