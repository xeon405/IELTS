"""Original IELTS-style Speaking prompt bank.

Part 1 (interview), Part 2 (cue card long turn) and Part 3 (abstract
discussion). Every item carries a high-band sample answer, explanation, logic,
tip, suggestions and band advice, and is typed "speaking-cue" so it receives
the five-criteria speaking evaluation. Around 30 hand-written prompts; Gemini
generates fresh equivalents on top when available, so practice volume is
effectively unlimited ("~500 questions or AI-generated equivalents").
"""

from typing import Any

SPEAKING_QUESTION_TYPES = [
    "Part 1 Interview (personal questions)",
    "Part 2 Cue Card (long turn)",
    "Part 3 Discussion (abstract questions)",
]

PART_TYPES = {
    "Part 1 Interview (personal questions)": "Part 1",
    "Part 2 Cue Card (long turn)": "Part 2",
    "Part 3 Discussion (abstract questions)": "Part 3",
    "Part 1": "Part 1",
    "Part 2": "Part 2",
    "Part 3": "Part 3",
}

SPEAKING_BY_TYPE: dict[str, list[dict[str, Any]]] = {}

Item = dict[str, Any]


def _register_label(label: str, *items: Item) -> None:
    SPEAKING_BY_TYPE.setdefault(label, []).extend(items)


SPEAKING_BY_TYPE.setdefault("Part 1", []).extend(
    [
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Work and study",
            "prompt": "Do you work or are you a student? What do you enjoy most about it?",
            "correctAnswer": (
                "I am a student at the moment, studying English and economics. The part I enjoy most is project work, "
                "because it lets me combine research with discussion, and I always learn faster when I have to explain ideas to other people."
            ),
            "explanation": "A Band 7 Part 1 answer answers the first question directly, then extends with a reason and a small detail.",
            "logic": "1. Answer directly (student). 2. Say what you enjoy. 3. Add one reason with 'because'.",
            "tip": "Never give a one-word answer. Answer + reason + example in 2-3 sentences.",
            "suggestions": "Practise this shape with ten different questions: 'Actually, I ... because ... for example ...'.",
            "bandAdvice": "Natural connectors ('at the moment', 'always') raise fluency perception more than memorised phrases.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Home and family",
            "prompt": "Do you live in a house or an apartment? What do you like about it?",
            "correctAnswer": (
                "I live in an apartment in the city centre, which is very convenient because everything is nearby. "
                "What I like most is the view from the balcony in the morning, and the neighbourhood is quiet enough to study, "
                "which matters a lot to me."
            ),
            "explanation": "The answer stays personal, uses a relative clause ('which is very convenient') and closes with a reason.",
            "logic": "1. State where you live. 2. One positive feature. 3. Reason or small detail.",
            "tip": "Use relative clauses ('which is...') — examiners hear them as band-lifting grammar.",
            "suggestions": "Record yourself answering and check that every sentence adds new information, not repetition.",
            "bandAdvice": "Fluency comes from connecting sentences, so end each sentence with the hook for the next.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Free time and hobbies",
            "prompt": "What do you usually do in your free time?",
            "correctAnswer": (
                "I usually read short stories and go for long walks in the evening. Reading relaxes my mind after classes, "
                "and walking gives me time to listen to podcasts, so I feel like I am combining rest with learning."
            ),
            "explanation": "Two activities plus two reasons make the answer long enough without repeating the question.",
            "logic": "1. Name one or two activities. 2. Say why each one. 3. Link them with 'so'.",
            "tip": "Do not list many hobbies; developing one activity is worth more than naming five.",
            "suggestions": "Prepare three 'favourite' answers (activity, place, person) that can be reused across topics.",
            "bandAdvice": "Linking ideas with 'so', 'because' and 'which means' builds the coherence strand of your band.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Travel and places",
            "prompt": "Do you prefer travelling to new places or returning to places you already know? Why?",
            "correctAnswer": (
                "I prefer new places, because discovery makes me more curious and open-minded. "
                "When I visited Japan for the first time, even simple things like using the train system felt exciting, "
                "and that feeling of novelty is something I cannot get from familiar cities."
            ),
            "explanation": "A clear preference, a reason, and one concrete memory — the memory is what makes it Band 7+.",
            "logic": "1. State preference. 2. Reason. 3. Personal example (one sentence).",
            "tip": "Personal examples from your life are the fastest way to lift a Part 1 answer.",
            "suggestions": "Keep a list of 5 true travel memories you can attach to any 'places' question.",
            "bandAdvice": "Concrete detail ('even simple things like the train system') outperforms abstract adjectives.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Food and culture",
            "prompt": "Do you like cooking? What kind of food do you usually eat?",
            "correctAnswer": (
                "I do like cooking, though I am better at simple dishes than complicated ones. "
                "During the week I usually eat rice with vegetables and fish, but at weekends I try new recipes, "
                "especially soups, because they are healthy and cheap."
            ),
            "explanation": "'Though' shows a contrast, and the weekday/weekend split gives natural structure.",
            "logic": "1. Answer the first question. 2. Answer the second. 3. Add a detail or contrast.",
            "tip": "Structure everyday answers with time contrasts: 'during the week... but at weekends...'.",
            "suggestions": "Practise connecting pairs: 'I like X, though I am better at Y'.",
            "bandAdvice": "Contrasts and time markers are cheap fluency wins that examiners notice immediately.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Technology in daily life",
            "prompt": "What kinds of apps do you use most often, and why?",
            "correctAnswer": (
                "I use study and transport apps most often, because they help me organise my day. "
                "The study app reminds me of my practice schedule, and the transport app helps me plan my commute, "
                "so together they save me about an hour every day."
            ),
            "explanation": "Names two apps, explains why, and adds a small measurable detail ('about an hour').",
            "logic": "1. Name the apps. 2. Say why each. 3. Add one result or detail.",
            "tip": "Avoid memorised tech answers; give YOUR apps and YOUR reasons.",
            "suggestions": "Practise quantifying: 'it saves me X', 'I use it X times a week'.",
            "bandAdvice": "Specific numbers and time markers ('every day', 'about an hour') signal natural fluency.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Cities and public space",
            "prompt": "How do you usually travel around your city?",
            "correctAnswer": (
                "I usually travel by metro, because it is fast and reliable, and I can read while I commute. "
                "For short distances I walk, and I only take a taxi when I am carrying something heavy, "
                "which happens quite rarely."
            ),
            "explanation": "One main mode, a reason, and a contrast for short distances — three sentences of natural extension.",
            "logic": "1. Main mode + reason. 2. Alternative for other situations. 3. One exception.",
            "tip": "The word 'usually' invites a contrast — give the exception and sound fluent doing it.",
            "suggestions": "Prepare one sentence per transport mode so any travel question has a ready answer.",
            "bandAdvice": "Fluency markers ('usually', 'rarely', 'only when') create rhythm without extra vocabulary.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Health and habits",
            "prompt": "Do you do any exercise? What kind?",
            "correctAnswer": (
                "Yes, I walk a lot and swim once a week. Walking is easy because I do it on my way to class, "
                "and swimming is my way of relaxing, since it clears my head after a stressful day of studying."
            ),
            "explanation": "Two exercises, each with its own reason — enough detail without becoming a monologue.",
            "logic": "1. Answer yes. 2. Name the exercise. 3. Reason per activity.",
            "tip": "Connect exercise to your routine ('on my way to class') — it makes the answer personal.",
            "suggestions": "Learn topic collocations: 'keep fit', 'clear my head', 'on a regular basis'.",
            "bandAdvice": "Collocations like 'clear my head' move vocabulary beyond basic words.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Environment and daily habits",
            "prompt": "Do you do anything to help the environment in your daily life?",
            "correctAnswer": (
                "Yes, I try to, in small ways. I carry a reusable water bottle, I sort my rubbish at home, "
                "and I have reduced how much plastic I buy, mainly by choosing loose fruit at the market. "
                "These habits are small, but they have become automatic, so they do not cost me any effort."
            ),
            "explanation": "Three concrete habits plus a reflection on effort — the reflection shows range.",
            "logic": "1. Answer yes. 2. List 2-3 specific habits. 3. Reflect on how easy they are now.",
            "tip": "Small, specific daily habits beat big vague claims ('I recycle', alone, is too thin).",
            "suggestions": "Prepare three true daily habits so this question is never a surprise.",
            "bandAdvice": "The comment 'they have become automatic' demonstrates self-awareness examiners reward.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 1",
            "title": "Education and learning",
            "prompt": "Do you prefer to study in the morning or in the evening? Why?",
            "correctAnswer": (
                "I prefer mornings, because I focus better before the day gets busy. "
                "For example, I review vocabulary right after breakfast, when the flat is quiet, "
                "and I notice I remember more when I study then."
            ),
            "explanation": "Direct preference, a reason, and a routine detail ('right after breakfast').",
            "logic": "1. State preference. 2. Reason. 3. Routine example.",
            "tip": "Use 'for example' with a real daily routine — it makes fluency visible.",
            "suggestions": "Answer the same question with 'evenings' too, to build flexibility.",
            "bandAdvice": "A clear position stated early ('I prefer mornings') is the backbone of fluency.",
        },
    ]
)

SPEAKING_BY_TYPE.setdefault("Part 2", []).extend(
    [
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a place that helps you focus",
            "prompt": (
                "Describe a place where you can concentrate well. You should say: where it is, what you do there, "
                "why it helps you focus, and how you feel after spending time there."
            ),
            "correctAnswer": (
                "I would like to describe a small public library near my apartment. It is quiet but not completely silent, "
                "so I feel calm without feeling isolated. I usually read articles there, plan essays, and review vocabulary, "
                "always at the same wooden desk by the window. The place helps me focus because everyone around me is working too, "
                "and that atmosphere keeps me disciplined. After spending time there, I feel organised and more confident about my study plan, "
                "and that feeling is why I keep going back."
            ),
            "explanation": "Band 7-8 long turn: covers all four prompt points, each with detail, and ends with a reflective sentence.",
            "logic": "1. Where (library near apartment). 2. What you do (read, plan, review). 3. Why it helps (atmosphere). 4. How you feel (organised).",
            "tip": "Use your 1-minute preparation to write 4 keywords — one per prompt point — and speak each one as a paragraph.",
            "suggestions": "Record a 2-minute version and check you never went silent for more than a second.",
            "bandAdvice": "Speaking for the full 2 minutes without repeating the same detail is the Part 2 band 7 test.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a time you learned something difficult",
            "prompt": (
                "Describe a time when you learned something difficult. You should say: what it was, why it was difficult, "
                "how you learned it, and how it changed you."
            ),
            "correctAnswer": (
                "A difficult thing I learned was how to drive. It was hard because I had to coordinate my hands, feet, and attention at the same time, "
                "and for weeks I stalled the car at every junction. I learned it by practising every weekend with an instructor, and by watching "
                "driving videos between lessons so the steps felt familiar. Eventually it became automatic, and that changed me because I stopped "
                "believing I was bad at practical skills. It also taught me that slow, repeated practice works for everything, which I now apply to my studies."
            ),
            "explanation": "Clear story with a problem, a process, and a change — the 'how it changed you' point is fully developed.",
            "logic": "1. What (driving). 2. Why difficult (coordination). 3. How learned (practice + videos). 4. Change (confidence, method).",
            "tip": "Time markers ('at first', 'eventually', 'now') carry the story forward without pauses.",
            "suggestions": "Story-telling power: prepare one 'difficult thing' story and one 'person' story that fit many cue cards.",
            "bandAdvice": "The reflection ('that changed me because...') is what separates Band 6 narratives from Band 7.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a person who helped you",
            "prompt": (
                "Describe a person who helped you at an important time. You should say: who they are, how you know them, "
                "how they helped you, and why their help was important."
            ),
            "correctAnswer": (
                "The person I want to describe is my first English teacher, Mrs. Park. I met her when I was in secondary school, "
                "and at that time I was very shy about speaking in class. She helped me by giving me small speaking tasks — like reading "
                "announcements aloud — until I felt confident enough to join debates. Her help was important because she saw ability in me "
                "that I could not see myself, and her belief gave me the courage to choose an English-related career."
            ),
            "explanation": "Answers all four points with a specific example (announcements) and a lasting impact.",
            "logic": "1. Who (teacher). 2. How you know (secondary school). 3. How helped (small tasks). 4. Why important (belief → career).",
            "tip": "People stories work when one concrete memory stands in for years of relationship.",
            "suggestions": "Keep one 'teacher' story and one 'family member' story ready — they cover most people cue cards.",
            "bandAdvice": "Linking the help to a change in your life ('chose an English-related career') lifts the whole answer.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a habit that keeps you healthy",
            "prompt": (
                "Describe a habit that helps you stay healthy. You should say: what it is, how often you do it, "
                "and why it is important to you."
            ),
            "correctAnswer": (
                "A habit that keeps me healthy is walking after dinner. I do it every evening for about twenty minutes, "
                "whatever the weather. It is important to me for three reasons: it helps me digest my food, it clears my mind after a long day of studying, "
                "and it reduces my screen time before bed, so I sleep much better. I used to skip it on cold evenings, "
                "but once I started treating it as part of dinner, it stopped feeling like effort."
            ),
            "explanation": "A habit, its frequency, and three specific reasons — plus a small honesty about difficulty.",
            "logic": "1. What (walking). 2. Frequency (every evening). 3. Why important (three reasons). 4. Honesty + change.",
            "tip": "Numbering reasons ('for three reasons: ... ... ...') is a fluency technique examiners reward.",
            "suggestions": "Practise the 'used to... but once I...' pattern to show self-development.",
            "bandAdvice": "Structured lists inside natural speech demonstrate coherence, a key Band 7 criterion.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe something you do to help the environment",
            "prompt": (
                "Describe something you do to help the environment. You should say: what you do, how often you do it, "
                "why you started, and how it makes you feel."
            ),
            "correctAnswer": (
                "Something I do to help the environment is cycling instead of taking the bus. I do it every day for short trips, "
                "and on weekends I cycle longer distances instead of using a car. I started because I read that transport is one of the "
                "biggest sources of city pollution, and I wanted to do something real rather than just talk about the problem. "
                "It makes me feel useful and a little proud, because it is a visible choice — people can see me doing it, and a few friends have started too."
            ),
            "explanation": "Covers all points, gives a clear reason for starting, and the feeling is concrete, not generic.",
            "logic": "1. What (cycling). 2. Frequency (daily). 3. Why started (pollution reading). 4. Feeling (useful, influence).",
            "tip": "A specific origin story ('I read that...') makes the answer sound genuinely personal.",
            "suggestions": "Practise the word 'instead of' — it adds comparison to any habit answer.",
            "bandAdvice": "Ending on the impact on others ('friends have started too') extends ideas beyond the obvious.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a piece of technology you use often",
            "prompt": (
                "Describe a piece of technology you use often. You should say: what it is, how long you have had it, "
                "how you use it, and why it is important to you."
            ),
            "correctAnswer": (
                "The piece of technology I use most is my laptop. I have had it for about two years, and I chose it because the battery "
                "lasts a whole day. I use it for everything academic — lectures, note-taking, essays, and language practice — and also for "
                "video calls with my family, since I live far from home. It is important because it is my classroom, my library, and my office "
                "in one device, and without it, my study routine would simply not exist."
            ),
            "explanation": "Each prompt point gets a developed sentence, and the ending summarises the importance strongly.",
            "logic": "1. What (laptop). 2. How long (two years). 3. How used (study + family). 4. Why important (everything).",
            "tip": "Summarising importance in one image ('my classroom, my library, and my office') is memorable and fluent.",
            "suggestions": "For any technology question, prepare three uses: study, communication, and one more.",
            "bandAdvice": "Triple structures ('X, Y, and Z') show lexical range and give natural rhythm.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a meal you enjoyed with other people",
            "prompt": (
                "Describe a meal you enjoyed with other people. You should say: when and where it was, who you were with, "
                "what you ate, and why you remember it."
            ),
            "correctAnswer": (
                "A meal I remember very clearly was a family dinner last spring, at my grandmother's house in the countryside. "
                "All my cousins were there, and some I had not seen for almost two years. We ate traditional dishes my grandmother still cooks "
                "by memory — dumplings, marinated vegetables, and a chicken soup that she always makes for celebrations. I remember it because "
                "everyone helped prepare it, and the whole evening was full of stories and laughter; it reminded me that the best meals are not "
                "about the food but about the people around the table."
            ),
            "explanation": "Rich sensory detail and a reflective conclusion — the mark of a developed long turn.",
            "logic": "1. When/where. 2. Who. 3. What. 4. Why memorable + reflection.",
            "tip": "Food answers are easy to lengthen: describe smells, preparation, and the people — not just the menu.",
            "suggestions": "Prepare one 'celebration meal' story; it fits meal, family, and tradition cue cards.",
            "bandAdvice": "A reflective last sentence ('the best meals are not about the food...') is signature Band 7+ material.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a time you helped someone",
            "prompt": (
                "Describe a time when you helped someone. You should say: who you helped, what the situation was, "
                "how you helped, and how it made you feel."
            ),
            "correctAnswer": (
                "I once helped a classmate who was struggling with our final group presentation. She was so anxious the week before "
                "that she could not start her slides, and the situation was stressful because the presentation counted for half our grade. "
                "I helped by breaking the work into small pieces — first an outline, then one slide a day — and we met after class to practise "
                "the delivery twice. It made me feel genuinely useful, and it also taught me that helping someone is usually about structure, "
                "not about doing the work for them."
            ),
            "explanation": "A complete story arc: problem, method, result, and a general lesson learned.",
            "logic": "1. Who (classmate). 2. Situation (presentation anxiety). 3. How helped (small steps). 4. Feeling + lesson.",
            "tip": "The lesson at the end ('helping is about structure...') turns a story into a thinking answer.",
            "suggestions": "Keep a 'helping' story and a 'being helped' story — together they cover many cue cards.",
            "bandAdvice": "Balancing story and reflection is the core skill of the Part 2 long turn.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a place you would like to visit",
            "prompt": (
                "Describe a place you would like to visit in the future. You should say: where it is, how you know about it, "
                "what you would do there, and why you want to visit it."
            ),
            "correctAnswer": (
                "A place I would love to visit is the north of Norway, especially the city of Tromsø. I first heard about it from a documentary "
                "about the northern lights, and since then I have seen so many photographs online that it feels like a place I already half-know. "
                "I would stay for a week in winter, go husky sledding, and spend nights watching the sky from a cabin with glass walls. "
                "I want to visit because the silence and the light there are completely unlike anything in my city, and I think experiencing "
                "that would reset the way I see nature."
            ),
            "explanation": "Personal connection (documentary), specific plans, and a poetic reason — everything an examiner wants.",
            "logic": "1. Where (Tromsø). 2. How you know (documentary). 3. What you'd do (sledding, lights). 4. Why (silence, perspective).",
            "tip": "Learn the phrase 'it feels like a place I already half-know' — it expresses anticipation naturally.",
            "suggestions": "Prepare one 'future place' answer with 2 specific activities to avoid generic travel talk.",
            "bandAdvice": "Specific place names and activities signal lexical resource far better than 'a nice beach'.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 2",
            "title": "Describe a skill you want to learn",
            "prompt": (
                "Describe a skill you would like to learn. You should say: what it is, why you want to learn it, "
                "how you plan to learn it, and how difficult it will be."
            ),
            "correctAnswer": (
                "A skill I really want to learn is playing the piano. I want to learn it because my grandfather was a pianist, "
                "and music was always playing in our house when I was a child, so the piano feels connected to my family history. "
                "My plan is to take one lesson a week with a teacher and practise for thirty minutes every morning, using an app to track "
                "my progress. I expect it to be difficult at first, because my fingers are not used to independent movement, but I know from "
                "language learning that daily practice makes hard skills eventually feel natural."
            ),
            "explanation": "A personal motivation, a realistic plan, and an honest difficulty estimate with a comparison.",
            "logic": "1. What (piano). 2. Why (family). 3. How (lessons + practice). 4. Difficulty (fingers, but doable).",
            "tip": "Comparing the new skill to one you already mastered (language learning) shows thinking, not memorising.",
            "suggestions": "Prepare this answer around a real skill you actually want — honesty beats perfection.",
            "bandAdvice": "Conditionals and comparatives ('as difficult as', 'if I practise') are band-lifting grammar in speech.",
        },
    ]
)

SPEAKING_BY_TYPE.setdefault("Part 3", []).extend(
    [
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Education and technology",
            "prompt": "Do you think schools should teach students how to manage their own learning? Why?",
            "correctAnswer": (
                "Yes, I think they should, because the world of work is changing so quickly that no school can predict the exact knowledge "
                "students will need. If students learn how to research, test ideas, and improve from feedback, they can adapt to new jobs later. "
                "For instance, self-managed learners can retrain quickly when industries change, whereas students who only follow instructions "
                "tend to become stuck. So teaching self-management is not a luxury; it is the most practical subject a school can offer."
            ),
            "explanation": "A clear opinion, a chain of reasoning, an example, and a strong concluding claim.",
            "logic": "1. Opinion. 2. Why (change of work). 3. Consequence (adapt). 4. Contrast + conclusion.",
            "tip": "Part 3 answers are mini essays: claim, reason, example, consequence.",
            "suggestions": "Practise the 'if... then...' conditional chain; it is the backbone of abstract answers.",
            "bandAdvice": "Concluding with a judgement ('it is the most practical subject') shows the depth Band 7 requires.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Cities and public space",
            "prompt": "Are public parks more important than sports facilities in cities? Why or why not?",
            "correctAnswer": (
                "I would say parks are at least as important, though I understand why people value sports facilities. Parks provide free, "
                "unstructured space for everyone — children, elderly people, office workers — while sports facilities usually serve one purpose "
                "and often charge a fee. However, the ideal city does not force a choice; it mixes both, because a sports complex surrounded by "
                "trees serves fitness and mental health at the same time. So the real issue is balance, not competition."
            ),
            "explanation": "Weighs both sides, makes a precise comparison, and lands on a nuanced conclusion.",
            "logic": "1. Position. 2. Compare (access, cost). 3. Synthesis (both together). 4. Conclusion (balance).",
            "tip": "The word 'however' before your synthesis shows the balanced reasoning Part 3 is scored on.",
            "suggestions": "Prepare the 'both, and here is how they combine' move — it fits most compare questions.",
            "bandAdvice": "Avoiding forced either/or answers is what separates Band 6 from Band 7+ discussion.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Technology and society",
            "prompt": "How has technology changed the way people learn languages?",
            "correctAnswer": (
                "Technology has made language learning dramatically more accessible, because apps, podcasts, and video calls connect learners "
                "to native speakers in ways that classrooms could not. At the same time, it can make learners passive if they only watch or tap "
                "instead of speaking. In my view, the best learners use technology as a gym: apps for daily practice, but real conversation for "
                "the actual match. So the change is positive overall, but only for people who still speak."
            ),
            "explanation": "Two-sided analysis with a vivid metaphor ('a gym') and a clear personal judgement.",
            "logic": "1. Positive change (access). 2. Risk (passivity). 3. Synthesis (gym metaphor). 4. Judgement.",
            "tip": "One original metaphor can lift an entire Part 3 answer — prepare one per favourite topic.",
            "suggestions": "Discuss this answer with a partner: agree or disagree, then rebuild it.",
            "bandAdvice": "A clear final judgement ('only for people who still speak') ties the whole answer together.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Health and society",
            "prompt": "Should governments do more to encourage people to exercise, or is it a personal responsibility?",
            "correctAnswer": (
                "I believe it is a shared responsibility, though governments must act first. Most people do not exercise because of environment — "
                "no safe cycle lanes, no parks nearby, long working hours — and no amount of personal willpower fixes a city without pavements. "
                "But government action only works if citizens respond, so both sides matter. For example, when a city builds cycling lanes, "
                "cycling rises sharply, yet it still depends on people choosing the bike. So the fair answer is: governments create the conditions, "
                "and individuals make the choice."
            ),
            "explanation": "A nuanced 'shared responsibility' position with a concrete mechanism and an example.",
            "logic": "1. Position (shared). 2. Why government first (environment). 3. Why citizens too (choice). 4. Example + conclusion.",
            "tip": "Back every abstraction with a mechanism: 'because ... and no willpower fixes ...'.",
            "suggestions": "The 'conditions vs choice' frame can be reused for many responsibility questions.",
            "bandAdvice": "Complex sentences with cause and condition demonstrate grammatical range under pressure.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Work and careers",
            "prompt": "Why do some people change careers several times in their lives today?",
            "correctAnswer": (
                "I think the main reason is that industries themselves change so quickly, and a single career path no longer survives "
                "a whole working life. Thirty years ago, a young person could train for one profession and stay in it; today, automation and "
                "globalisation remove whole roles, so people must change to stay employed. Another reason is that people now want meaning from work, "
                "not just a salary, so they move until they find a field that suits them. Both forces — external change and internal ambition — "
                "push people toward multiple careers."
            ),
            "explanation": "Two distinct causes (external and internal) with historical contrast — a model Part 3 structure.",
            "logic": "1. Main cause (industry change). 2. Historical contrast. 3. Second cause (meaning). 4. Summary.",
            "tip": "Part 3 'why' questions reward two causes plus one comparison with the past.",
            "suggestions": "Practise the 'another reason is' pivot — it keeps abstract answers structured.",
            "bandAdvice": "Summarising both causes in one final sentence is a coherence technique that earns marks.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Environment and behaviour",
            "prompt": "Do you think individual actions can really help the environment, or is that just an excuse for governments to avoid responsibility?",
            "correctAnswer": (
                "I think individual actions genuinely matter, but they are not enough alone, and the criticism of 'excuses' has some truth in it. "
                "On one hand, millions of small choices — cycling, buying less plastic, eating less meat — add up to significant demand, and demand "
                "is what moves companies. On the other hand, a single citizen cannot stop industrial pollution, so governments must regulate. "
                "The danger is when politicians praise personal actions while blocking policy, which does feel like a distraction. "
                "My conclusion is that individual action builds the political will for government action, so the two support each other."
            ),
            "explanation": "Engages directly with a pointed question and rejects both extreme positions.",
            "logic": "1. Nuanced position. 2. How individuals help (demand). 3. Why government needed (scale). 4. The 'excuse' point + synthesis.",
            "tip": "When a question is deliberately provocative, acknowledge it ('the criticism has some truth') before answering.",
            "suggestions": "Practise the phrase 'on one hand... on the other hand...' in three different topics.",
            "bandAdvice": "Handling a pointed question calmly is fluency under pressure — exactly what examiners assess.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Education and society",
            "prompt": "Why do some people succeed at learning a language while others never really improve?",
            "correctAnswer": (
                "I believe the difference is rarely talent; it is almost always method and consistency. Successful learners practise a little "
                "every day, and they use the language, not just study it — they speak, even with mistakes, because using the language creates the "
                "feedback loop that fixes errors. People who do not improve usually study in bursts and stay in their comfort zone, repeating exercises "
                "they already know. There is also an emotional factor: learners who accept embarrassment improve faster, because speaking badly "
                "today is the price of speaking well tomorrow. So success is a habit, not a gift."
            ),
            "explanation": "A strong thesis ('method, not talent'), two mechanisms, and an emotional insight.",
            "logic": "1. Thesis. 2. Mechanism 1 (daily use). 3. Mechanism 2 (comfort zone). 4. Emotional factor + conclusion.",
            "tip": "A memorable thesis sentence ('success is a habit, not a gift') anchors a long answer.",
            "suggestions": "Prepare one 'why some succeed' answer — it appears in many topic areas.",
            "bandAdvice": "Generalised insight plus concrete mechanism is the Band 7+ abstract answer formula.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Cities and lifestyle",
            "prompt": "Do you think life in big cities has more advantages than disadvantages these days?",
            "correctAnswer": (
                "I think for most young people the advantages still outweigh the disadvantages, though the balance is shifting. Cities offer "
                "opportunities that small towns cannot: jobs, universities, cultural events, and the chance to meet people with similar interests. "
                "But the costs are rising — housing is expensive, and the constant noise and commuting pressure affect mental health. "
                "Interestingly, the pandemic taught cities they could be quieter, and some people chose to leave, which means the advantage is no "
                "longer automatic. On balance, I would say cities remain the best option for career-building years, but not forever."
            ),
            "explanation": "Evaluates both sides, adds a recent historical shift, and qualifies the conclusion by life stage.",
            "logic": "1. Position (outweigh). 2. Advantages. 3. Rising costs. 4. Recent shift + qualified conclusion.",
            "tip": "Qualifying with 'for most young people... but not forever' shows sophisticated judgement.",
            "suggestions": "The 'advantages vs disadvantages' frame fits dozens of Part 3 questions — master one full version.",
            "bandAdvice": "Temporal qualification ('in career-building years') is the vocabulary and range examiners reward.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Media and attention",
            "prompt": "Do you think people today have shorter attention spans than in the past?",
            "correctAnswer": (
                "I think the honest answer is yes for most people, and the cause is design, not biology. Platforms are built to keep attention "
                "moving — short videos, endless feeds, constant notifications — so the average mind is trained to expect a new stimulus every few "
                "seconds. At the same time, I would add that people can still focus when they genuinely care: many young people read long texts "
                "about subjects they love. So attention has not disappeared; it has become selective, and the skill of deep focus now has to be "
                "practised deliberately, almost like a muscle."
            ),
            "explanation": "A nuanced yes with a designed cause, a counter-example, and a memorable final image.",
            "logic": "1. Yes, but cause is design. 2. Mechanism (platforms). 3. Counter-example (passion focus). 4. Reframe (selective attention).",
            "tip": "Reframing the question ('attention has not disappeared; it has become selective') is a Band 8 move.",
            "suggestions": "Practise one reframe sentence per favourite topic — they make answers memorable.",
            "bandAdvice": "The 'like a muscle' metaphor shows flexible vocabulary use under real discussion pressure.",
        },
        {
            "type": "speaking-cue",
            "typeLabel": "Part 3",
            "title": "Society and rules",
            "prompt": "Are rules more important in schools today than they were in the past?",
            "correctAnswer": (
                "I would say rules are fewer but more important today, in a different way. In the past, schools relied on many small rules about "
                "appearance and behaviour, enforced by fear; today there are fewer of those, but the rules that remain — around safety, respect, and "
                "digital behaviour — carry more weight, because the consequences of breaking them are bigger. Technology is the reason: one careless "
                "post can affect a whole school, so boundaries matter more than ever. So the real change is not the number of rules but their quality "
                "and their reasonableness, because students today accept rules they understand."
            ),
            "explanation": "Contrasts past and present, explains the shift with technology, and ends with an insight about understanding.",
            "logic": "1. Position (fewer but weightier). 2. Past (many, fear-based). 3. Present (few, consequential). 4. Cause + insight.",
            "tip": "Compare generations explicitly ('in the past... today...') — comparison is a core Part 3 skill.",
            "suggestions": "Master the 'X has changed, but the change is not what you expect' structure.",
            "bandAdvice": "Answering with a twist ('fewer but more important') signals top-range critical thinking.",
        },
    ]
)

SPEAKING_BY_TYPE = SPEAKING_BY_TYPE
REGISTERED = SPEAKING_BY_TYPE


def items_for_type(type_label: str) -> list[Item]:
    part = PART_TYPES.get(type_label, type_label)
    return list(SPEAKING_BY_TYPE.get(part, []))


def mixed_items() -> list[Item]:
    flat: list[Item] = []
    for part in ("Part 1", "Part 2", "Part 3"):
        flat.extend(SPEAKING_BY_TYPE[part])
    return flat


def items_for_mode(mode: str) -> list[Item]:
    """Official-style item pool for a speaking mode (full section, part, or type)."""
    if mode in SPEAKING_QUESTION_TYPES or mode in ("Part 1", "Part 2", "Part 3"):
        return items_for_type(mode)
    if mode == "Full Speaking Section":
        return mixed_items()
    if mode == "Quick Practice":
        return [SPEAKING_BY_TYPE["Part 1"][0]]
    if mode == "Topic Practice":
        return [
            SPEAKING_BY_TYPE["Part 1"][2],
            SPEAKING_BY_TYPE["Part 2"][4],
            SPEAKING_BY_TYPE["Part 3"][2],
        ]
    return mixed_items()
