// All scripts and questions are original; audio is browser-provided text-to-speech, not authentic IELTS audio.
export const LISTENING = {
  "key": "ielts-listening-tts-practice-1",
  "version": "1",
  "course": "ielts",
  "title": {
    "en": "Listening TTS Practice · 40 questions",
    "ru": "Listening TTS-тренировка · 40 вопросов"
  },
  "notice": {
    "en": "Unofficial synthetic-voice listening practice. Browser speech quality, voice, accents and timings vary. This is NOT an authentic IELTS audio mock or calibrated band score.",
    "ru": "Неофициальная тренировка с синтезированным голосом. Качество речи, акцент и скорость зависят от браузера. Это НЕ настоящий аудио-мок IELTS и не калиброванная оценка."
  },
  "parts": [
    {
      "id": "p1",
      "title": "Part 1 — Workshop registration",
      "script": "A: Hello, I would like to book the weekend field-sketching workshop. B: Of course. The workshop is on Saturday, the fourteenth of November. A: And when should I arrive? B: It starts at nine thirty in the morning. Please come to Cedar Hall, room two hundred and four. The tutor is Morgan Lee. A: Is it a big group? B: No, we limit it to twelve people. A: What is the student fee? B: Eighteen pounds. A: Do I need special equipment? B: Just pencils and a notebook. We provide paper for the final drawing. A: Will you send a confirmation? B: Yes, by email on Friday. A: Can I call you if I need to change my booking? B: Yes, the office telephone number ends in seven three. A: Great. Please register me. B: Done. The class will begin with simple observation exercises, before participants move outside to sketch trees and buildings.",
      "questions": [
        {
          "id": "l1",
          "prompt": "When does the workshop take place?",
          "options": [
            "14 November",
            "14 October",
            "4 November"
          ],
          "answer": 0,
          "skill": "date"
        },
        {
          "id": "l2",
          "prompt": "What time does the workshop begin?",
          "options": [
            "9:00",
            "9:30",
            "10:30"
          ],
          "answer": 1,
          "skill": "time"
        },
        {
          "id": "l3",
          "prompt": "Where is the workshop held?",
          "options": [
            "Oak Centre",
            "Cedar Hall",
            "Maple House"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l4",
          "prompt": "What room is used?",
          "options": [
            "204",
            "240",
            "402"
          ],
          "answer": 0,
          "skill": "details"
        },
        {
          "id": "l5",
          "prompt": "Who is the tutor?",
          "options": [
            "Morgan Lee",
            "Miriam Hill",
            "Martin King"
          ],
          "answer": 0,
          "skill": "names"
        },
        {
          "id": "l6",
          "prompt": "What is the maximum group size?",
          "options": [
            "10",
            "12",
            "20"
          ],
          "answer": 1,
          "skill": "numbers"
        },
        {
          "id": "l7",
          "prompt": "How much is the student fee?",
          "options": [
            "£8",
            "£18",
            "£80"
          ],
          "answer": 1,
          "skill": "numbers"
        },
        {
          "id": "l8",
          "prompt": "What should students bring?",
          "options": [
            "Watercolour paints",
            "Pencils and a notebook",
            "A camera"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l9",
          "prompt": "When will confirmation be sent?",
          "options": [
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "answer": 1,
          "skill": "time"
        },
        {
          "id": "l10",
          "prompt": "Which two digits end the telephone number?",
          "options": [
            "37",
            "73",
            "17"
          ],
          "answer": 1,
          "skill": "numbers"
        }
      ]
    },
    {
      "id": "p2",
      "title": "Part 2 — Community history centre",
      "script": "Welcome to the South Quay History Centre. We are open from Tuesday through Sunday, and we are closed every Monday. You are now standing in the entrance foyer. Audio guides are available here and are free to borrow. If you need the lift, it is located to the left of the reception desk. Our exhibition on the old river industry is on the second floor. Families following the children's route should look for green arrows on the walls. Today's craft session begins at two fifteen in the workshop room. Please remember that the last admission to the exhibitions is at four thirty in the afternoon. Visitor lockers are beside the cafe, not next to the ticket desk. You may take photographs inside the building, but please turn off your camera flash. At the end of your visit, leave through the courtyard gate. A temporary exhibition about bridge construction is also available, and the ticket desk can explain the route. Enjoy your visit.",
      "questions": [
        {
          "id": "l11",
          "prompt": "On which day is the centre closed?",
          "options": [
            "Monday",
            "Tuesday",
            "Sunday"
          ],
          "answer": 0,
          "skill": "details"
        },
        {
          "id": "l12",
          "prompt": "How much does an audio guide cost?",
          "options": [
            "£2",
            "Free",
            "£5"
          ],
          "answer": 1,
          "skill": "paraphrase"
        },
        {
          "id": "l13",
          "prompt": "Where is the lift?",
          "options": [
            "To the right of the cafe",
            "Behind the courtyard",
            "Left of reception"
          ],
          "answer": 2,
          "skill": "navigation"
        },
        {
          "id": "l14",
          "prompt": "Which floor has the river industry exhibition?",
          "options": [
            "First",
            "Second",
            "Third"
          ],
          "answer": 1,
          "skill": "navigation"
        },
        {
          "id": "l15",
          "prompt": "What colour marks the children's route?",
          "options": [
            "Blue",
            "Green",
            "Yellow"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l16",
          "prompt": "What time does the craft session start?",
          "options": [
            "2:15",
            "2:50",
            "3:15"
          ],
          "answer": 0,
          "skill": "time"
        },
        {
          "id": "l17",
          "prompt": "When is last admission?",
          "options": [
            "4:00",
            "4:30",
            "5:30"
          ],
          "answer": 1,
          "skill": "time"
        },
        {
          "id": "l18",
          "prompt": "Where are lockers?",
          "options": [
            "Beside the cafe",
            "Next to the ticket desk",
            "In the courtyard"
          ],
          "answer": 0,
          "skill": "navigation"
        },
        {
          "id": "l19",
          "prompt": "Which photography rule applies?",
          "options": [
            "No photos allowed",
            "Photos without flash",
            "Only printed cameras"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l20",
          "prompt": "Which exit should visitors use?",
          "options": [
            "Main road door",
            "Courtyard gate",
            "Reception window"
          ],
          "answer": 1,
          "skill": "navigation"
        }
      ]
    },
    {
      "id": "p3",
      "title": "Part 3 — University project discussion",
      "script": "Tutor: How is your environmental science group project going? Dina: We chose the restoration of urban wetlands. At first we planned to study birds, but now we are focusing on insects because the sites contain better records of insect numbers. Raj: We are comparing three sites. We plan to collect our own observations in May. Tutor: How many sample points will you have? Dina: Fifty across the study areas. Raj: We originally wanted to work with paper maps, but digital maps make it easier to compare locations, so we changed our plan. Tutor: What is your biggest practical risk? Raj: Flooding may stop us reaching the path beside the water. Dina: We will also use a local council dataset for historical comparisons. Tutor: Good. Include charts in the written report, not only long tables. Dina: The poster is due on Thursday. Tutor: Yes, and your oral presentation is six minutes, followed by questions. Raj: Should we focus on a final conclusion? Tutor: Explain your methods and limitations as well. Do not claim that your small sample proves results for every wetland.",
      "questions": [
        {
          "id": "l21",
          "prompt": "What is the project topic?",
          "options": [
            "Urban wetlands",
            "Mountain tourism",
            "Air pollution"
          ],
          "answer": 0,
          "skill": "details"
        },
        {
          "id": "l22",
          "prompt": "Which animal group is the new focus?",
          "options": [
            "Birds",
            "Insects",
            "Fish"
          ],
          "answer": 1,
          "skill": "discussion"
        },
        {
          "id": "l23",
          "prompt": "How many sites will students compare?",
          "options": [
            "2",
            "3",
            "4"
          ],
          "answer": 1,
          "skill": "numbers"
        },
        {
          "id": "l24",
          "prompt": "In which month will field observations happen?",
          "options": [
            "March",
            "April",
            "May"
          ],
          "answer": 2,
          "skill": "time"
        },
        {
          "id": "l25",
          "prompt": "How many sample points are planned?",
          "options": [
            "15",
            "50",
            "150"
          ],
          "answer": 1,
          "skill": "numbers"
        },
        {
          "id": "l26",
          "prompt": "Which mapping method did the students decide to use?",
          "options": [
            "Digital maps",
            "Paper maps only",
            "No maps"
          ],
          "answer": 0,
          "skill": "discussion"
        },
        {
          "id": "l27",
          "prompt": "What might prevent access to a path?",
          "options": [
            "Construction",
            "Flooding",
            "Traffic"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l28",
          "prompt": "Who supplies historical comparison data?",
          "options": [
            "A newspaper",
            "The local council",
            "A charity"
          ],
          "answer": 1,
          "skill": "details"
        },
        {
          "id": "l29",
          "prompt": "What does the tutor suggest adding to the report?",
          "options": [
            "Charts",
            "Photographs only",
            "More tables only"
          ],
          "answer": 0,
          "skill": "paraphrase"
        },
        {
          "id": "l30",
          "prompt": "How long is the oral presentation?",
          "options": [
            "4 minutes",
            "6 minutes",
            "10 minutes"
          ],
          "answer": 1,
          "skill": "time"
        }
      ]
    },
    {
      "id": "p4",
      "title": "Part 4 — Seed germination study",
      "script": "Today's lecture considers a fictional university experiment on alpine seeds. Some plants begin growth only after experiencing a period of cold conditions. Scientists call the controlled cold treatment stratification. The study lasted twenty four weeks. It compared a moist cold-storage group with a dry-storage group, using one hundred and twenty seeds in each group. The cold group was kept at four degrees Celsius. Both groups were later moved to identical growing conditions. The team assessed germination after eight weeks of growth. The germination rate in the cold-treatment group was sixty five per cent, compared with forty two per cent in the dry-storage group. Researchers deliberately excluded strong light during the initial storage phase to reduce a possible confounding factor. They noted that germination and later plant survival are different outcomes. In future work they want to examine the effect of soil type, because the current experiment used only one growing medium. The researchers stressed that a single species and a controlled laboratory setting cannot establish how every alpine plant will behave in the wild. Their conclusion was narrower: cold moist storage was associated with higher germination in this particular test.",
      "questions": [
        {
          "id": "l31",
          "prompt": "What is the lecture mainly about?",
          "options": [
            "Alpine seed germination",
            "Ocean salt",
            "Bird migration"
          ],
          "answer": 0,
          "skill": "main_idea"
        },
        {
          "id": "l32",
          "prompt": "What is the term for controlled cold treatment?",
          "options": [
            "Irrigation",
            "Stratification",
            "Evaporation"
          ],
          "answer": 1,
          "skill": "academic"
        },
        {
          "id": "l33",
          "prompt": "How long did the study last?",
          "options": [
            "8 weeks",
            "12 weeks",
            "24 weeks"
          ],
          "answer": 2,
          "skill": "numbers"
        },
        {
          "id": "l34",
          "prompt": "How many groups were compared?",
          "options": [
            "Two",
            "Three",
            "Four"
          ],
          "answer": 0,
          "skill": "numbers"
        },
        {
          "id": "l35",
          "prompt": "How many seeds were in each group?",
          "options": [
            "20",
            "120",
            "240"
          ],
          "answer": 1,
          "skill": "numbers"
        },
        {
          "id": "l36",
          "prompt": "At what temperature was the cold group stored?",
          "options": [
            "4°C",
            "14°C",
            "40°C"
          ],
          "answer": 0,
          "skill": "numbers"
        },
        {
          "id": "l37",
          "prompt": "After how long was germination assessed?",
          "options": [
            "4 weeks",
            "8 weeks",
            "24 weeks"
          ],
          "answer": 1,
          "skill": "time"
        },
        {
          "id": "l38",
          "prompt": "What percentage germinated in the cold-treatment group?",
          "options": [
            "42%",
            "56%",
            "65%"
          ],
          "answer": 2,
          "skill": "numbers"
        },
        {
          "id": "l39",
          "prompt": "Why was strong light excluded during storage?",
          "options": [
            "To reduce a confounding factor",
            "To speed up counting",
            "To colour the seeds"
          ],
          "answer": 0,
          "skill": "inference"
        },
        {
          "id": "l40",
          "prompt": "What factor should future studies examine?",
          "options": [
            "Soil type",
            "Leaf colour",
            "Bird calls"
          ],
          "answer": 0,
          "skill": "academic"
        }
      ]
    }
  ],
  "skills": {
    "date": {
      "en": "Dates",
      "ru": "Даты",
      "lesson": "A.1.2.3.1"
    },
    "time": {
      "en": "Times and sequence",
      "ru": "Время и последовательность",
      "lesson": "A.1.4.4.2"
    },
    "details": {
      "en": "Specific details",
      "ru": "Точные факты",
      "lesson": "A.1.2.3.1"
    },
    "names": {
      "en": "Names",
      "ru": "Имена",
      "lesson": "A.1.1.4.1"
    },
    "numbers": {
      "en": "Numbers",
      "ru": "Числа",
      "lesson": "A.1.1.4.3"
    },
    "navigation": {
      "en": "Following directions",
      "ru": "Ориентиры и маршруты",
      "lesson": "A.1.4.3.2"
    },
    "paraphrase": {
      "en": "Recognising paraphrase",
      "ru": "Перефразирование",
      "lesson": "A.1.3.4.1"
    },
    "discussion": {
      "en": "Changing decisions",
      "ru": "Изменение решений",
      "lesson": "A.1.3.3.3"
    },
    "academic": {
      "en": "Academic concepts",
      "ru": "Академические термины",
      "lesson": "A.1.2.1.1"
    },
    "main_idea": {
      "en": "Main idea",
      "ru": "Основная мысль",
      "lesson": "A.1.3.1.1"
    },
    "inference": {
      "en": "Inference",
      "ru": "Вывод на основе записи",
      "lesson": "A.1.3.2.3"
    }
  }
};
