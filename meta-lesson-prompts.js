// A teaching prompt intentionally contains no learner answer or private notes.
export function explanationPrompt({course,title,theory,example,task,criteria,resourceUrl},en=false){
  const lines=en?[
    `I am studying a ${course} lesson: ${title}.`,
    'Explain the knowledge and method needed to solve this task. Start with prerequisites, then explain the idea in simple words, walk through a different example, and give me a short plan for my own attempt.',
    'Do not complete the exact task for me. Ask one question to check my understanding. If the task requires audio, text or running code that you cannot access, say what evidence I should provide.',
    `Lesson explanation:\n${theory}`,`Lesson example:\n${example}`,`My task:\n${task}`,
    `What my work will be checked against:\n${criteria.map((x,i)=>`${i+1}. ${x}`).join('\n')}`
  ]:[
    `Я изучаю урок ${course}: ${title}.`,
    'Объясни знания и способ, необходимые для решения. Сначала назови предпосылки, затем объясни идею простыми словами, разбери другой пример и предложи короткий план моей попытки.',
    'Не выполняй моё точное задание за меня. Задай один вопрос для проверки понимания. Если нужны аудио, текст или запуск кода, к которым у тебя нет доступа, скажи, какие доказательства предоставить.',
    `Объяснение урока:\n${theory}`,`Пример урока:\n${example}`,`Моё задание:\n${task}`,
    `Критерии результата:\n${criteria.map((x,i)=>`${i+1}. ${x}`).join('\n')}`
  ];
  if(resourceUrl)lines.push((en?'Exercise source: ':'Источник задания: ')+resourceUrl);
  return lines.join('\n\n');
}
