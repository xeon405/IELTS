"""Original IELTS-style Writing prompt bank.

Task 1 (report / process / map) and Task 2 (opinion, discussion, advantages,
disadvantages, problem/solution, double question). Every prompt carries a
high-band model answer ("sampleHighBandAnswer") plus explanation, logic, tip,
suggestions and band advice. Around 20 hand-written prompts; Gemini generates
fresh equivalents on top when it is available, so practice volume is
effectively unlimited ("~500 questions or AI-generated equivalents").
"""

from typing import Any

WRITING_QUESTION_TYPES = [
    "Task 1 Report (Data)",
    "Task 1 Process / Map",
    "Task 2 Opinion",
    "Task 2 Discussion",
    "Task 2 Advantages / Disadvantages",
    "Task 2 Problem / Solution",
    "Task 2 Double Question",
]

TASK_1_TYPES = ["Task 1 Report (Data)", "Task 1 Process / Map"]
TASK_2_TYPES = [
    "Task 2 Opinion",
    "Task 2 Discussion",
    "Task 2 Advantages / Disadvantages",
    "Task 2 Problem / Solution",
    "Task 2 Double Question",
]

ESSAY_MODE_TYPES = {
    "Full Writing Section": ["Task 1 Report (Data)", "Task 2 Opinion"],
    "Task 1": TASK_1_TYPES,
    "Task 2": TASK_2_TYPES,
    "Essay Types": WRITING_QUESTION_TYPES,
    "Quick Practice": ["Task 2 Opinion"],
    "Individual Question Types": WRITING_QUESTION_TYPES,
}

WRITING_BY_TYPE: dict[str, list[dict[str, Any]]] = {}

Item = dict[str, Any]


def _register_label(label: str, *items: Item) -> None:
    WRITING_BY_TYPE.setdefault(label, []).extend(items)


E2_TEMPLATE = "State a clear position, structure the answer in paragraphs, and support every claim with reasons and examples."
SAMPLE_T2 = (
    "The debate over whether students should learn a foreign language at primary school is increasingly relevant in a globalised world, "
    "and while there are credible arguments on both sides, I believe starting early is clearly the better approach. "
    "On the one hand, opponents argue that young children already face heavy curriculum demands, and that an additional subject could "
    "crowd out foundational literacy and mathematics. This concern is not entirely without merit, since primary timetables are notoriously full "
    "and teachers are often unprepared to deliver language lessons. Nevertheless, I would contend that these challenges are administrative rather "
    "than educational, and they can be solved with better training and resourcing. "
    "On the other hand, the advantages of early exposure are both cognitive and linguistic. Children acquire pronunciation and accent with "
    "remarkable ease, because their developing brains are naturally receptive to new sound systems, and early bilingualism has been shown to "
    "improve problem-solving and mental flexibility. A further benefit is motivation: young learners treat language as play rather than pressure, "
    "which sustains the long-term commitment that effective learning demands. "
    "In conclusion, although there are practical objections to early language learning, the cognitive, linguistic and motivational benefits are "
    "so significant that the policy is justified. With adequate investment in teacher training, the early-start model should be adopted widely."
)

WRITING_BY_TYPE.setdefault("Task 2 Opinion", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Opinion",
        "title": "Early foreign language learning",
        "prompt": "Some people think that children should start learning a foreign language at primary school, while others believe this should wait until secondary school. Discuss both views and give your own opinion.",
        "context": "Task 2 opinion essay. Write at least 250 words. Address BOTH views and clearly state your own position.",
        "options": [],
        "correctAnswer": SAMPLE_T2,
        "explanation": "This sample earns a Band 8 because it presents both sides fairly, uses a clear four-paragraph structure, and signs its opinion with 'I believe' and 'I would contend'.",
        "logic": "1. Paraphrase the prompt. 2. Body 1: acknowledge the opposing view and concede. 3. Body 2: present your side with two developed reasons. 4. Conclusion restates your position with a condition.",
        "tip": "Never disappear inside 'some people think' — an explicit 'I believe' every 2 paragraphs keeps the band on task response.",
        "suggestions": "After writing, count sentences over 18 words and vary at least one long sentence with a short one.",
        "bandAdvice": "A clear position plus balanced discussion is the difference between Band 6.5 and 7.5 on Task 2.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Opinion", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Opinion",
        "title": "University funding",
        "prompt": "Some people believe that charging students tuition fees for university is unfair. Others believe fees are necessary to maintain high quality education. Discuss both views and give your opinion.",
        "context": "Task 2 opinion essay. Write at least 250 words and state your own position clearly.",
        "options": [],
        "correctAnswer": (
            "Whether universities should charge tuition fees provokes strong feelings about fairness and quality, and although both positions "
            "deserve consideration, I side with those who see fees as a necessary engine of quality. "
            "Those who oppose fees make a powerful equity argument: education is a public good, and charging for it blocks talented students from "
            "poorer backgrounds, entrenching inequality. In many countries where tuition is free, participation rates have risen sharply, and the "
            "burden on graduates disappears. Yet free education rarely means free of cost — the expense is merely transferred to the taxpayer, "
            "and underfunded systems commonly suffer overcrowded lectures and overworked staff. "
            "By contrast, fee-based systems can fund smaller classes, modern laboratories and generous scholarship schemes that target exactly "
            "the students the equity argument worries about. Evidence from mixed models, such as Australia's income-contingent loans, shows that "
            "fees and fairness can coexist when repayment is deferred until earnings reach a threshold. "
            "In conclusion, tuition fees are not inherently unfair; the unfairness lies in how they are structured. A model that couples fees with "
            "income-contingent loans and need-based scholarships preserves both quality and access, and I therefore regard fees as justified."
        ),
        "explanation": "Band 8: balanced treatment, a clear mechanism (loans) that reframes the debate, and signalled opinion only in the conclusion and an early 'I side with'.",
        "logic": "1. Introduce the tension. 2. Concede the equity case. 3. Reframe: free ≠ free-of-cost, quality suffers. 4. Offer a synthesis model (loans) and conclude.",
        "tip": "Reframing the debate (here: fairness depends on loan structure) lifts lexical resource and task response together.",
        "suggestions": "Practise writing one 'synthesis' sentence that combines both sides before concluding.",
        "bandAdvice": "Band 7+ opinions move beyond agreement or disagreement into conditions ('when repayment is deferred').",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Discussion", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Discussion",
        "title": "Remote work",
        "prompt": "Remote working has become common in many industries. Discuss the advantages and disadvantages of working from home, and give your own opinion.",
        "context": "Task 2 discussion essay. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "The shift towards remote working has reshaped professional life, and while it clearly benefits some, it presents genuine drawbacks "
            "that organisations must manage with care. "
            "The most obvious advantage is flexibility. Employees save hours previously lost to commuting, gain control over their schedules, and "
            "often report higher focus when free from open-plan interruptions. For employers, distributed teams can recruit talent beyond one city "
            "and reduce office overheads, which explains why many firms have embraced hybrid models even after the immediate health crisis. "
            "The disadvantages, however, are real. Isolation is the most frequently cited; junior employees in particular miss the informal mentoring "
            "that happens around a desk, and collaboration can become rigid and scheduled rather than spontaneous. There is also evidence that "
            "long-term homeworking erodes the boundary between personal and professional time, increasing burnout among those who cannot switch off. "
            "In my view, the balance depends on the arrangement rather than the location: fully remote roles carry the highest risks, whereas "
            "hybrid models that reserve core days for in-person collaboration appear to capture most advantages with far fewer costs. "
            "In conclusion, homeworking offers flexibility and efficiency but risks isolation and burnout. A well-managed hybrid approach, rather "
            "than a blanket policy, best reconciles the two."
        ),
        "explanation": "Band 8: advantage and disadvantage paragraphs of similar depth, a nuanced personal view ('depends on the arrangement'), and cohesive signposting.",
        "logic": "1. General introduction. 2. Advantages with two strands (employee, employer). 3. Disadvantages with two strands (isolation, burnout). 4. Opinion that resolves rather than arbitrates.",
        "tip": "A discussion essay scores highest when your opinion synthesises both sides ('hybrid reconciles them') rather than merely siding with one.",
        "suggestions": "Write a one-sentence thesis in the introduction so the examiner predicts your direction.",
        "bandAdvice": "Balanced depth on both sides is the Band 7 discussion ticket; asymmetric essays cap at 6.5.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Discussion", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Discussion",
        "title": "Technology in education",
        "prompt": "Technology has changed the way students learn. Discuss the advantages and disadvantages of this development.",
        "context": "Task 2 discussion essay. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "Digital technology has so thoroughly transformed learning that a classroom today bears little resemblance to one from a generation ago, "
            "and the change brings both remarkable opportunities and significant risks. "
            "The advantages centre on access and personalisation. Students can reach high-quality materials, video lectures and international peers "
            "with a few clicks, bypassing the uneven resources of their own school. Adaptive platforms tailor exercises to each learner's pace, and "
            "immediate feedback lets errors be corrected at the moment they happen, which accelerates mastery of basic skills. "
            "The disadvantages are equally concrete. Unsupervised devices expose learners to constant distraction, and there is mounting evidence "
            "that heavy screen use reduces sustained attention and handwriting fluency. A further concern is inequality: students in affluent homes "
            "gain the most from private access to technology, while those without reliable devices fall further behind, widening rather than "
            "narrowing the achievement gap. "
            "My own view is that technology is a multiplier of existing habits rather than an independent force: it amplifies both the effective "
            "routines of disciplined learners and the procrastination of the distracted, so its value depends on how schools guide its use. "
            "In conclusion, technology has democratised learning but also amplified distraction and inequality. With deliberate pedagogy, its "
            "benefits can be captured while curbing the harms."
        ),
        "explanation": "Band 8: explicit advantage/disadvantage structure, a memorable thesis ('a multiplier of habits'), and cohesive markers throughout.",
        "logic": "1. Frame the transformation. 2. Advantages paragraph: access + personalisation. 3. Disadvantages paragraph: distraction + inequality. 4. Opinion paragraph, then conclusion.",
        "tip": "Give each paragraph one umbrella idea and two concrete examples; that is the simplest route to coherence.",
        "suggestions": "Highlight every linking word in a model answer to internalise cohesion devices you can reuse.",
        "bandAdvice": "Coherence and cohesion scoring rewards an obvious paragraph plan — this sample is a model of it.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Advantages / Disadvantages", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Advantages / Disadvantages",
        "title": "Cities banning cars",
        "prompt": "More cities are banning cars from central areas in order to reduce pollution. Is this a positive or negative development?",
        "context": "Task 2 advantages/disadvantages essay. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "The decision of several cities to remove private cars from their centres is a bold environmental measure, and in my judgement its "
            "benefits decisively outweigh the inconveniences it creates. "
            "The principal advantage is a dramatic improvement in air quality. Vehicle emissions are a leading source of the nitrogen oxides and "
            "particulates that damage public health, so pedestrianised zones measurably lower respiratory illness and make streets safer for "
            "children and the elderly. Cities such as Madrid and Oslo report not only cleaner air but thriving shopfront trade, because pedestrians "
            "linger and spend more than drivers circling for parking. "
            "The drawbacks, however, must be acknowledged. Residents with limited mobility, and workers such as delivery drivers and tradespeople, "
            "can find their journeys complicated, and smaller businesses fear losing the custom of car-borne shoppers. These difficulties are real "
            "but transitional: when schemes are paired with dedicated bus lanes, secure cycle routes and generous exemptions for the disabled, "
            "objections fade in practice. "
            "Weighing the two, I consider car-free centres a clearly positive development. The health and environmental gains are permanent, "
            "whereas the practical inconveniences can be engineered away through thoughtful transport planning."
        ),
        "explanation": "Band 8: clear stance licensed by the question ('positive or negative'), advantages and drawbacks of comparable depth, and a decisive reasoned conclusion.",
        "logic": "1. Answer the evaluative question early. 2. Advantages: health + trade, with country evidence. 3. Drawbacks: mobility + trade, rebutted with mitigations. 4. Conclusion weighs and decides.",
        "tip": "For 'positive or negative' questions, state your stance in the introduction and repeat it, strengthened, in the conclusion.",
        "suggestions": "Learn two model cities (Oslo, Madrid) and two counterarguments with mitigations for reuse across environment essays.",
        "bandAdvice": "A stance that is both firm and contingent ('decisively outweighs') signals Band 7+ judgement.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Advantages / Disadvantages", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Advantages / Disadvantages",
        "title": "Social media and young people",
        "prompt": "Social media has had a significant influence on the lives of young people. Is this a positive or negative development?",
        "context": "Task 2 advantages/disadvantages essay. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "Social media has become the primary arena in which young people form identities and friendships, and while it offers genuine "
            "opportunities, I believe its overall effect on the young has been more negative than positive. "
            "On the positive side, the platforms have given adolescents unprecedented access to community. A teenager with niche interests — beekeeping, "
            "robotics, classical composition — can now find mentors and peers instantly, reducing the isolation that limited social circles once caused. "
            "Social media also lowers barriers to creativity and activism, allowing young people to publish work and organise causes without "
            "institutional permission. "
            "The negative effects, however, are weightier. The platforms are engineered to maximise engagement, and the resulting comparison culture "
            "is repeatedly linked to anxiety and poor self-image, particularly among teenage girls. Constant notification cycles fragment attention, "
            "and the anonymity of the medium facilitates cyberbullying, which researchers consistently connect to depressive symptoms. All three "
            "harms operate at a scale and intensity no earlier generation faced. "
            "In conclusion, although social media can connect and empower, its default design — comparison, distraction and anonymity — compounds "
            "the particular vulnerabilities of adolescence. I therefore regard its influence on young people as, on balance, negative."
        ),
        "explanation": "Band 8: balanced yet decisive ('more negative than positive'), vocabulary that is precise ('engineered to maximise engagement'), and clear criterion-depth parity.",
        "logic": "1. Open and flag the balance. 2. Positives paragraph (community, creativity). 3. Negatives paragraph (comparison, attention, bullying). 4. Verdict paragraph + conclusion.",
        "tip": "One per paragraph: comparison, distraction, anonymity — three precise harms beat three vague complaints.",
        "suggestions": "Practise turning generic terms (bad for mental health) into mechanisms (comparison culture, fragmented attention).",
        "bandAdvice": "Precision of mechanisms is what separates Band 6.5 generalities from Band 8 subtlety.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Problem / Solution", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Problem / Solution",
        "title": "Traffic congestion",
        "prompt": "Traffic congestion is growing in many cities. What are the causes of this problem, and what solutions can you suggest?",
        "context": "Task 2 problem/solution essay. Cover causes AND solutions, linked. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "Gridlocked streets have become a defining complaint of modern urban life, and the causes are structural rather than accidental. "
            "Unless cities act, congestion will simply worsen as populations grow. "
            "The first cause is car-dependent design. Suburbs laid out around single-occupancy vehicles force residents to drive for every errand, "
            "while decades of underinvestment in rail and bus networks leave public transport slow, unreliable and poor value. A second cause is the "
            "mismatched pricing of road space: parking is cheap and driving carries no congestion price, so the true social cost of the empty seat "
            "beside every commuter is never paid, inflating demand for driving at the expense of other modes. "
            "The solutions follow directly from these causes. Cities should make alternatives genuinely competitive: dedicated bus and cycle "
            "corridors, electrified suburban rail, and integrated ticketing that makes a journey by train faster than the equivalent trip by car. "
            "Pricing should then realign behaviour, through congestion charges and parking levies whose revenues are ring-fenced for the very "
            "transport improvements that reduce driving. "
            "In conclusion, congestion is driven by design and under-priced car use, and it is reversible. By investing in competitive alternatives "
            "and pricing road space honestly, cities can shift the balance of journeys away from the private car and recover the streets."
        ),
        "explanation": "Band 8: each solution is explicitly paired with a cause ('follow directly from these causes'), with precise economics vocabulary.",
        "logic": "1. State the two causes clearly. 2. Cause 1: car-dependent design. 3. Cause 2: un-priced road space. 4. Solution paragraphs mirroring both causes. 5. Conclusion.",
        "tip": "Problem/solution essays score highest when solution 1 answers cause 1 and solution 2 answers cause 2.",
        "suggestions": "Before writing, draw two columns (causes | solutions) and match them — this guarantees task achievement.",
        "bandAdvice": "Cause-to-solution matching is the hallmark of a Band 7 problem/solution essay.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Problem / Solution", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Problem / Solution",
        "title": "Housing affordability",
        "prompt": "In many cities, housing has become too expensive for young people to buy. What problems does this cause, and what measures could address it?",
        "context": "Task 2 problem/solution essay. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "The widening distance between house prices and young people's incomes is one of the defining economic pressures of our time, and its "
            "consequences reach far beyond the property market. "
            "The most immediate problem is delayed independence. When purchasing a home remains out of reach, young adults continue to live with "
            "parents well into their thirties, with measurable effects on family formation and fertility. A second, deeper problem is the transfer "
            "of wealth between generations: because property owners benefit from rising values while renters do not, the housing market increasingly "
            "reproduces inequality, and those who entered the market early accumulate capital that later cohorts cannot match. "
            "Addressing the problem requires both supply-side and demand-side measures. On the supply side, governments must accelerate planning, "
            "release underused public land and permit denser, mid-rise development near transit, since housing stock has simply not kept pace with "
            "urban populations. On the demand side, stable tenancy protections — long leases with predictable rent — would make renting a credible "
            "alternative to ownership rather than a precarious stage of life. "
            "In conclusion, expensive housing postpones adulthood and entrenches inequality. A joined-up strategy of faster building and secure "
            "tenancy is the most realistic route to stabilising the market."
        ),
        "explanation": "Band 8: two sharply drawn problems (independence, wealth transfer), paired supply/demand solutions, and precise policy vocabulary.",
        "logic": "1. Frame the gap. 2. Problem 1: delayed independence and demography. 3. Problem 2: generational wealth transfer. 4. Solutions: supply + demand. 5. Conclusion.",
        "tip": "Name the mechanism ('wealth transfer', 'precarious tenure') — mechanisms impress examiners far more than adjectives.",
        "suggestions": "Keep a bank of paired cause/solution essays; the vocabulary transfers across tasks.",
        "bandAdvice": "Interlinked problems and matched solutions signal Band 8 judgement and task response.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Double Question", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Double Question",
        "title": "Reasons people move; effects on society",
        "prompt": "Increasing numbers of people are moving from rural areas to cities. Why is this happening? What effects does this have on society?",
        "context": "Task 2 double question. Answer BOTH parts in equal depth. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "The accelerating drift of people from countryside to city is reshaping nations, and to understand it we need to examine its drivers "
            "before considering its wider consequences. "
            "People move because cities concentrate opportunity. They offer the largest labour markets, the most prestigious higher education, and "
            "infrastructure — hospitals, transport, cultural institutions — that rural areas simply cannot sustain. Beyond economics, there is also "
            "a social pull: young people, in particular, move for the anonymity, diversity and pace of urban life, which acts as a magnet for "
            "talent wherever the gap in services is pronounced. "
            "The effects on society are profound and double-edged. Positively, cities become engines of productivity and innovation, since "
            "clustered talent generates ideas, firms and services more efficiently than dispersed populations can, and many national capitals owe "
            "their dynamism to exactly this concentration. Negatively, the same migration hollows out rural communities: schools close, ageing "
            "populations are left with stretched services, and abandoned agricultural land places pressure on prices and freight networks. "
            "In conclusion, the rural-to-urban shift is driven by the concentration of opportunity and by social pull, and its effects — urban "
            "dynamism bought at the price of rural decline — demand balanced regional policy rather than nostalgia for a settled countryside."
        ),
        "explanation": "Band 8: both questions answered with equal depth, the two effects framed as a deliberate double-edged structure.",
        "logic": "1. Answer part one (why) with two causes. 2. Answer part two (effects) with benefit and cost. 3. Tie the two into a single balanced conclusion.",
        "tip": "For double questions, devote one development paragraph to each 'what' to keep task response even.",
        "suggestions": "Budget words: 40 introduction, 90 per body, 30 conclusion — never run out on the second question.",
        "bandAdvice": "Unequal attention to the two parts caps task response at Band 6; equal depth unlocks 7+.",
    }
)

WRITING_BY_TYPE.setdefault("Task 2 Double Question", []).append(
    {
        "type": "essay",
        "typeLabel": "Task 2 Double Question",
        "title": "Reasons to read for pleasure; effects",
        "prompt": "Many young people no longer read books for pleasure. Why is this the case? What are the consequences for their development?",
        "context": "Task 2 double question. Answer both parts. Write at least 250 words.",
        "options": [],
        "correctAnswer": (
            "The decline of pleasure reading among the young is well documented, and it stems from competition for attention rather than from any "
            "discovery that books have become irrelevant. "
            "The principal cause is the shift of leisure towards algorithmically served screens. Streaming services, short-form video and social "
            "platforms deliver continuous novelty with no effort required, whereas a book demands patience before it rewards the reader, and "
            "reading habits formed in a lifetime of screens are rarely established at all. Schools compound the problem when they frame reading "
            "as assessment rather than enjoyment, converting an appealing leisure activity into a task to be endured. "
            "The consequences for development are serious. Sustained reading is the most reliable builder of vocabulary, written expression and "
            "background knowledge, and its absence shows in shallower essays and narrower general knowledge. Perhaps more importantly, long-form "
            "narrative is where young people practise focused attention, empathy and the tolerance of ambiguity — capacities that short, vivid "
            "screens do not train. "
            "In conclusion, pleasure reading is losing the competition against effortless digital entertainment, and the price is a generation "
            "with weaker language resources and thinner attentional stamina. Rebuilding the habit is one of the most valuable investments "
            "educators and parents can make."
        ),
        "explanation": "Band 8: both parts answered, persuasion via mechanism ('competition for attention'), and precise developmental vocabulary.",
        "logic": "1. State the driver (competition for attention). 2. Cause paragraph: screens + assessment framing. 3. Consequence paragraph: language + attention. 4. Conclusion ties habit loss to investment.",
        "tip": "Defend every claim with a mechanism; 'books are less attractive' becomes 'screens deliver effortless reward that books do not'.",
        "suggestions": "Practise converting abstractions into mechanisms, then reuse them across essays on leisure and technology.",
        "bandAdvice": "Mechanism-based reasoning is a reliable Band 7.5+ signalling device.",
    }
)

# ---------------------------------------------------------------------------
# Task 1 — data tasks
# ---------------------------------------------------------------------------

REGISTERED = WRITING_BY_TYPE

REGISTERED.setdefault("Task 1 Report (Data)", []).extend(
    [
        {
            "type": "essay",
            "typeLabel": "Task 1 Report (Data)",
            "title": "International students over time",
            "prompt": "The chart shows the number of international students at a university from 2010 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
            "context": "Task 1 line/bar chart. Write at least 150 words. Do NOT give opinions.",
            "chart": {
                "type": "bar",
                "title": "International students at a university (2010-2025)",
                "unit": "students",
                "categories": ["2010", "2013", "2016", "2019", "2022", "2025"],
                "values": [3000, 3500, 3800, 4200, 6000, 7500],
            },
            "options": [],
            "correctAnswer": (
                "The chart illustrates the change in the number of international students enrolled at a single university between 2010 and 2025. "
                "Overall, the university experienced steady growth over the period, with the sharpest increase occurring after 2018. "
                "Between 2010 and 2016 intake grew gradually from roughly 3,000 to 3,800 students, an increase of about 800. The pace then slowed "
                "slightly until 2018, when numbers plateaued near 4,000. From that point the trend accelerated sharply, and by 2022 enrolment had "
                "surpassed 6,000, rising to almost 7,500 by 2025. "
                "The regional composition also changed. Asia contributed the largest share throughout, and its dominance widened after 2018, "
                "whereas arrivals from Europe grew only moderately and the African intake, although small, more than doubled over the fifteen years. "
                "In summary, total international enrolment nearly tripled over the period, and the growth was concentrated entirely in the final "
                "seven years."
            ),
            "explanation": "A Band 8 report: overview sentence after the general statement, one comparison paragraph, and figures selectively reported — not every datum.",
            "logic": "1. Introduce: what + time span. 2. Overview: overall trend + main contrast. 3. Body 1: trend and figures. 4. Body 2: comparisons. 5. One-sentence summary.",
            "tip": "Always put the overview in the second sentence — examiners look for the 'big picture' immediately.",
            "suggestions": "Report figures as ranges ('roughly 3,000') and use precise change verbs (plateaued, accelerated) instead of 'went up'.",
            "bandAdvice": "A strong overview alone often lifts task achievement from Band 6 to 7 on Task 1.",
        },
        {
            "type": "essay",
            "typeLabel": "Task 1 Report (Data)",
            "title": "Household energy use",
            "prompt": "The pie charts show household energy consumption for lighting, heating, cooling and appliances in two countries in 2025. Summarise the information and make comparisons where relevant.",
            "context": "Task 1 pie charts. Write at least 150 words. Do NOT give opinions.",
            "chart": {
                "type": "bar",
                "title": "Household energy use in two countries (2025)",
                "unit": "percentage of energy use",
                "categories": ["Heating", "Cooling", "Appliances", "Lighting", "Other", "Heating (B)"],
                "values": [55, 10, 20, 15, 25, 35],
            },
            "options": [],
            "correctAnswer": (
                "The two pie charts compare how households in Country A and Country B distributed their energy use across four categories in 2025. "
                "Overall, heating dominated consumption in both countries, although the balance between heating and the remaining categories differed "
                "markedly. "
                "In Country A, heating accounted for 55% of all household energy, by far the largest share, followed by appliances at 20%. Lighting "
                "and cooling were minor uses, representing 15% and 10% respectively. "
                "Country B presented a more even profile. Heating still led at 35%, but the margin was far smaller, and cooling was much more "
                "significant, consuming 25% of the total. Appliances contributed 25% as well, while lighting fell to 15%. "
                "In summary, both countries depended on heating as their primary use, yet Country B used its energy across categories far more evenly, "
                "most notably devoting a much larger share to cooling."
            ),
            "explanation": "Band 8: correct overview (shared dominance + the difference), comparable constructions ('both…yet'), and figures in scope about 150 words.",
            "logic": "1. Introduce the two charts and year. 2. Overview: common leader + key contrast. 3. Country A figures. 4. Country B figures + comparison. 5. Summary.",
            "tip": "Use comparative frame 'both X, yet Y' to satisfy the 'make comparisons' requirement in one sentence.",
            "suggestions": "Learn three comparative templates (twice/twofold, the largest share, far more even) and reuse them.",
            "bandAdvice": "Comparison is the criterion that separates a Band 7 from a Band 6.5 Task 1 report.",
        },
        {
            "type": "essay",
            "typeLabel": "Task 1 Report (Data)",
            "title": "Coffee consumption trends",
            "prompt": "The table shows coffee consumption in five countries between 2015 and 2025, measured in cups per person per year. Summarise the information and make comparisons where relevant.",
            "context": "Task 1 table. Write at least 150 words.",
            "options": [],
            "correctAnswer": (
                "The table compares per-capita coffee consumption across five countries at two points: 2015 and 2025. "
                "Overall, two opposing trends are visible: consumption rose in nearly every country in the sample, with the single exception of "
                "Italy, where it declined. "
                "In 2015 Finland recorded the highest intake with 12.1 cups per person annually, well above all competitors, while China registered "
                "by far the lowest figure at 1.7 cups. By 2025 Finland's lead had narrowed to 12.8 cups, reflecting only modest growth, whereas "
                "consumption in Vietnam climbed sharply from 4.3 to 7.2 cups. Germany and Japan both increased steadily, from 7.9 to 9.1 and 2.9 to "
                "4.4 respectively, and China, though still lowest, more than doubled from 1.7 to 3.6 cups. Italy was the outlier, dropping from 11.4 "
                "to 10.5 cups. "
                "In summary, rising consumption was the norm across the table, led by Vietnam and China, whose figures grew fastest from the "
                "smallest bases, while Finland remained the heaviest per-capita drinker."
            ),
            "explanation": "Band 8: an overview that captures both the general rise and the exception, with ranks ('well above', 'by far the lowest') handled.",
            "logic": "1. Introduce measure + period. 2. Overview with the exception. 3. Bodies: leaders, then fastest risers, then outlier. 4. Summary.",
            "tip": "Highlight the exception in your overview — examiners reward reports that notice what does NOT fit the trend.",
            "suggestions": "Practise writing an exception sentence ('Italy was the outlier…') for every dataset you meet.",
            "bandAdvice": "Noticing exceptions demonstrates selection of salient features, a Band 7+ task achievement signal.",
        },
    ]
)


REGISTERED.setdefault("Task 1 Process / Map", []).extend(
    [
        {
            "type": "essay",
            "typeLabel": "Task 1 Process / Map",
            "title": "Water purification process",
            "prompt": "The diagram shows the process by which a community turns river water into safe drinking water. Summarise the information by reporting the main stages and making comparisons where appropriate.",
            "context": "Task 1 process. Write at least 150 words. Use sequencing and passive voice.",
            "options": [],
            "correctAnswer": (
                "The diagram illustrates a sequence of seven stages through which river water is converted into safe drinking water for a community. "
                "Overall, the process begins with extraction from the river and ends with distribution to households, passing through filtration "
                "and chemical treatment in between. "
                "Having been drawn from the river by a pump, the water first passes through a coarse screen that removes leaves and larger debris. "
                "It then enters a settlement tank, where heavier particles are allowed to sink to the bottom. The next stage transfers the water to "
                "a sand filter, which traps finer sediment, before activated carbon removes remaining impurities and improves taste. "
                "Following filtration, chlorine is added to disinfect the water, and it is finally stored in a covered reservoir ready for "
                "distribution. From there the treated water is delivered through an underground pipe network to taps in homes and businesses. "
                "In summary, the process moves from raw extraction to fully treated supplies in seven clearly defined stages, with the two filtration "
                "steps and the chlorine stage doing the critical work of making the water safe."
            ),
            "explanation": "Band 8 process report: a clear stage count, sequencing devices, and the passive voice ('is drawn', 'is delivered') throughout.",
            "logic": "1. Introduce the number of stages. 2. Overview of the arc. 3. Body 1: first four stages. 4. Body 2: final three stages. 5. Summary highlighting key steps.",
            "tip": "Do not describe the diagram itself — describe the action it represents, using passive sentences.",
            "suggestions": "Build a sequencing toolkit (having been…, next, following…, finally, from there) and use all of it once.",
            "bandAdvice": "Anti-required passive control is what moves a process report from Band 6 to Band 7+.",
        },
        {
            "type": "essay",
            "typeLabel": "Task 1 Process / Map",
            "title": "Town centre redevelopment",
            "prompt": "The maps show the layout of a town centre in 2010 and its redeveloped version in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
            "context": "Task 1 map comparison. Write at least 150 words.",
            "options": [],
            "correctAnswer": (
                "The two maps compare the layout of a town centre in 2010 and after its redevelopment in 2025. "
                "Overall, the transformation replaced a car-dominated centre with a pedestrian-friendly one: the ring road was moved, the car park "
                "and bus station were repositioned, and new public and green spaces were created. "
                "In 2010 the centre was organised around a large central car park, with the bus station immediately to its south and the pedestrian "
                "zone confined to a single block. By 2025 the central car park had been removed entirely and replaced with a landscaped square, "
                "while the bus station expanded on the same southern site and gained a dedicated interchange. "
                "The most striking change occurred at the ring road. Where it had previously encircled the old centre, in 2025 it has been rerouted "
                "along the eastern edge, and the vacated corridor now contains a linear park with trees and cycle paths. The pedestrian zone was also "
                "extended northwards, now covering nearly the full width of the northern block. "
                "In summary, the redevelopment reversed the priorities of the centre: the central car park vanished, the ring road retreated to the "
                "periphery, and open space in the heart of the town increased substantially."
            ),
            "explanation": "Band 8 maps answer: overview captures the 'before/after' philosophy, then removal, relocation and addition are each reported.",
            "logic": "1. Introduce both years. 2. Overview: the change of philosophy. 3. Body 1: car park and bus station. 4. Body 2: ring road. 5. Body 3: pedestrian zone. 6. Summary.",
            "tip": "Organise maps by action type — removed, relocated, added — before writing a single sentence.",
            "suggestions": "Highlight removals in red, additions in green; then report each group once.",
            "bandAdvice": "Grouping changes by type (remove/relocate/add) is the Band 7+ coherence secret of map answers.",
        },
    ]
)

WRITING_BY_TYPE = REGISTERED


def items_for_type(type_label: str) -> list[Item]:
    return list(WRITING_BY_TYPE.get(type_label, []))


def mixed_items() -> list[Item]:
    flat: list[Item] = []
    for type_label in WRITING_QUESTION_TYPES:
        flat.extend(WRITING_BY_TYPE[type_label])
    return flat


def items_for_mode(mode: str) -> list[Item]:
    """Official-style item pool for a writing mode (task slot or type)."""
    if mode in WRITING_QUESTION_TYPES:
        return items_for_type(mode)
    if mode == "Quick Practice":
        return [WRITING_BY_TYPE["Task 2 Opinion"][0]]
    types = ESSAY_MODE_TYPES.get(mode, WRITING_QUESTION_TYPES)
    flat: list[Item] = []
    for type_label in types:
        flat.extend(WRITING_BY_TYPE[type_label])
    return flat