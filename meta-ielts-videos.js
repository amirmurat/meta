// Curated videos from IELTS and British Council pages. Match only documented
// topics; a broad section overview is never presented as a lesson-specific video.
const writingSource = "https://ielts.org/take-a-test/preparation-resources/writing-test-resources";
const britishCouncil = "https://takeielts.britishcouncil.org/teach-ielts/teaching-resources/videos/";
const videos = [
  {id:"listening-linking",section:"1",match:/word boundar|end of one word|beginning of the next|adjacent words|fused pronunciation|linking/i,title:"Connected speech: consonant–vowel linking",titleRu:"Слитная речь: связь согласного и гласного",url:"https://www.youtube.com/watch?v=mV_CEIroJs8",source:"https://www.bbclearningenglish.org/programme/tims-pronunciation-workshop",provider:"BBC Learning English",why:"Hear why a word-final consonant can sound attached to the next word.",whyRu:"Услышь, почему конечный согласный может звучать как начало следующего слова."},
  {id:"listening-schwa",section:"1",match:/reduc|weak (?:sound|vowel|form)|unstressed vowel|schwa/i,title:"Connected speech: the schwa",titleRu:"Слитная речь: нейтральный гласный schwa",url:"https://www.youtube.com/watch?v=KwDJnXt3ZVQ",source:"https://www.bbclearningenglish.org/programme/tims-pronunciation-workshop",provider:"BBC Learning English",why:"Recognize the weak vowel that appears in unstressed syllables.",whyRu:"Разбери слабый гласный в безударных слогах."},
  {id:"writing-task1",section:"3",match:/task\s*1|task\s*one|graph|chart|diagram|trend|overview|key features/i,title:"Academic Writing Task 1: task achievement",titleRu:"Academic Writing Task 1: выполнение задания",url:"https://www.youtube.com/watch?v=g5nLLhHjCyI",source:writingSource,provider:"IELTS",why:"Selecting key features, giving an overview and reporting data accurately.",whyRu:"Выбор главных особенностей, общий обзор и точная передача данных."},
  {id:"writing-task2",section:"3",match:/task\s*2|task\s*two|essay|argument|position|opinion|support.*idea/i,title:"Writing Task 2: task response",titleRu:"Writing Task 2: ответ на задание",url:"https://www.youtube.com/watch?v=9POmzmem-w8",source:writingSource,provider:"IELTS",why:"Addressing the prompt, developing a position and supporting ideas.",whyRu:"Разбор вопроса, развитие позиции и подкрепление аргументов."},
  {id:"writing-coherence",section:"3",match:/coheren|cohesion|paragraph|logical (?:order|sequence)|linking device|referenc/i,title:"Writing: coherence and cohesion",titleRu:"Writing: связность и логика",url:"https://www.youtube.com/watch?v=EWLelXJ2ecM",source:writingSource,provider:"IELTS",why:"Paragraphing, logical progression, referencing and linking devices.",whyRu:"Абзацы, развитие мысли, отсылки и связующие выражения."},
  {id:"writing-vocabulary",section:"3",match:/lexical|vocabular|word choice|collocation|spelling|word formation/i,title:"Writing: lexical resource",titleRu:"Writing: словарный запас",url:"https://www.youtube.com/watch?v=X2pir2jhaj4",source:writingSource,provider:"IELTS",why:"Vocabulary range, precision, appropriacy and word formation.",whyRu:"Разнообразие, точность и уместность слов, словообразование."},
  {id:"writing-grammar",section:"3",match:/grammatical|grammar|sentence structure|complex sentence|punctuation/i,title:"Writing: grammatical range and accuracy",titleRu:"Writing: разнообразие и точность грамматики",url:"https://www.youtube.com/watch?v=OKEp3E6s1LA",source:writingSource,provider:"IELTS",why:"How grammatical range and accuracy are assessed.",whyRu:"Как оцениваются разнообразие и точность грамматики."},
  {id:"reading-method",section:"2",match:/skim|scan|locat|keyword|synonym|main idea|specific (?:detail|information)/i,title:"Reading: skimming, scanning and close reading",titleRu:"Reading: обзорное, поисковое и внимательное чтение",url:britishCouncil+"reading",source:britishCouncil+"reading",provider:"British Council",why:"Finding main ideas and specific details before close reading.",whyRu:"Поиск главной мысли и деталей перед внимательным чтением."},
  {id:"listening-method",section:"1",match:/predict|keyword|synonym|paraphras|instruction|distractor|correction|negative|answer type/i,title:"Listening: prediction and careful listening",titleRu:"Listening: прогноз ответа и внимательное слушание",url:britishCouncil+"listening",source:britishCouncil+"listening",provider:"British Council",why:"Question prediction, synonyms, changed answers and instructions.",whyRu:"Прогноз по вопросу, синонимы, исправления и инструкции."},
  {id:"speaking-fluency",section:"4",match:/fluen|coheren|develop.*answer|long turn|organis|hesitat/i,title:"Speaking: fluency and coherence",titleRu:"Speaking: беглость и связность",url:britishCouncil+"speaking-fluency-and-coherence",source:britishCouncil+"speaking-fluency-and-coherence",provider:"British Council",why:"Extending answers and organising ideas across the speaking test.",whyRu:"Развитие ответа и организация мыслей в устной части."},
  {id:"speaking-vocabulary",section:"4",match:/lexical|vocabular|collocation|synonym|paraphras/i,title:"Speaking: lexical resource",titleRu:"Speaking: словарный запас",url:britishCouncil+"speaking-lexical-resource",source:britishCouncil+"speaking-lexical-resource",provider:"British Council",why:"Using words naturally, precisely and flexibly.",whyRu:"Естественный, точный и гибкий выбор слов."},
  {id:"speaking-grammar",section:"4",match:/grammatical|grammar|sentence structure|tense/i,title:"Speaking: grammatical range and accuracy",titleRu:"Speaking: грамматическое разнообразие и точность",url:britishCouncil+"speaking-grammar",source:britishCouncil+"speaking-grammar",provider:"British Council",why:"Using a range of grammatical forms accurately in speech.",whyRu:"Разнообразные и точные грамматические формы в речи."},
  {id:"speaking-pronunciation",section:"4",match:/pronunciat|intonation|word stress|sentence stress|sound/i,title:"Speaking: pronunciation",titleRu:"Speaking: произношение",url:britishCouncil+"speaking-pronunciation",source:britishCouncil+"speaking-pronunciation",provider:"British Council",why:"Sounds, stress, intonation and chunking in spoken answers.",whyRu:"Звуки, ударение, интонация и деление речи на смысловые отрезки."}
];

export function selectIeltsVideos(lesson) {
  const section = /^A\.([1-4])\./.exec(lesson.external_id || "")?.[1];
  if (!section) return [];
  const title = String(lesson.title_en || lesson.title || "");
  return videos.filter(video => video.section === section && video.match.test(title)).slice(0,2);
}

export function renderIeltsVideos(container, matches, lang) {
  container.replaceChildren();
  if (!matches.length) {container.hidden=true;return;}
  container.hidden=false;
  const heading=document.createElement("h2");
  heading.textContent=lang==="ru"?"Видеоурок по теме":"Video lesson on this topic";
  container.append(heading);
  const intro=document.createElement("p");
  intro.textContent=lang==="ru"?"Дополнительное объяснение откроется на сайте автора. Просмотр не отмечает урок пройденным.":"An additional explanation opens on the creator’s site. Watching does not mark this lesson complete.";
  intro.className="instructions";container.append(intro);
  const list=document.createElement("ul");list.className="meta-video-list";
  for (const video of matches) {
    const item=document.createElement("li");
    const link=document.createElement("a");link.href=video.url;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=lang==="ru"?video.titleRu:video.title;
    const detail=document.createElement("p");detail.textContent=`${video.provider} · ${lang==="ru"?video.whyRu:video.why}`;
    const source=document.createElement("a");source.href=video.source;source.target="_blank";source.rel="noopener noreferrer";
    source.textContent=lang==="ru"?"Страница автора":"Publisher page";
    item.append(link,detail,source);list.append(item);
  }
  container.append(list);
}
