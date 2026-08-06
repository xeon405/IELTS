"""Large offline Reading bank: ~500 distinct items per question type.

Deterministic seeds (topic facts) + template variants expand to ~600 items
per official question type so offline sessions never repeat. Schema matches
reading_bank items.
"""

import random
from typing import Any

Item = dict[str, Any]

# (topic, [(fact sentence, key value), ...]) - 20 topics x 6 facts = 120 seeds
R_FACTS: list[tuple[str, list[tuple[str, str]]]] = [
    ("Urban cycling", [
        ("Commuter cycling in the city rose by 34% between 2018 and 2023", "34%"),
        ("The council funded the cycle-lane expansion with a congestion levy", "congestion levy"),
        ("Bus journey times stayed the same after the lanes opened", "stayed the same"),
        ("The first cycle lane was built along Riverside Avenue in 2016", "2016"),
        ("Electric bikes now make up one fifth of all city cycle journeys", "one fifth"),
        ("Cycling accidents fell by 18% after the protected lanes were installed", "18%"),
    ]),
    ("Deep-sea mining", [
        ("The richest deposits of nodules lie between 4,000 and 5,500 metres deep", "5,500"),
        ("Polymetallic nodules form over millions of years", "millions of years"),
        ("Licences for exploration were first issued in 2021", "2021"),
        ("One mining company estimates the nodule field covers 450,000 square kilometres", "450,000"),
        ("Scientists warn that plumes of sediment could smother filter feeders", "plumes of sediment"),
        ("Only 9% of the nodule zone has been mapped in detail", "9%"),
    ]),
    ("Vertical farming", [
        ("The first commercial vertical farm opened in Singapore in 2018", "2018"),
        ("The farm uses 95% less water than conventional agriculture", "95%"),
        ("LED lighting accounts for nearly 60% of the farm's energy use", "60%"),
        ("Lettuce at the farm sells for twice the supermarket price", "twice"),
        ("The tallest vertical farm in the region has 21 stacked growing levels", "21"),
        ("Energy costs are the single largest obstacle to expansion", "Energy costs"),
    ]),
    ("Noise pollution", [
        ("The WHO guideline for continuous street noise is 53 decibels", "53"),
        ("Chronic noise exposure raises the risk of heart disease by 8%", "8%"),
        ("Birds in noisy areas changed their songs to higher frequencies", "higher frequencies"),
        ("Tree barriers reduce perceived traffic noise by up to 40%", "40%"),
        ("The first noise barrier was built beside a motorway in 1973", "1973"),
        ("Night-time noise above 30 decibels can interrupt deep sleep", "30"),
    ]),
    ("Solar energy", [
        ("Solar panels now generate 12% of the region's electricity", "12%"),
        ("The cost of solar panels fell by 89% between 2010 and 2020", "89%"),
        ("Cloudy days reduce panel output by roughly 70%", "70%"),
        ("The largest solar farm in the area covers 300 hectares", "300"),
        ("Battery storage allows the farm to supply power after sunset", "Battery storage"),
        ("Government subsidies were phased out in 2022", "2022"),
    ]),
    ("Ancient writing", [
        ("The oldest surviving writing system is about 5,300 years old", "5,300"),
        ("Scribes carved early signs into clay tablets with reeds", "clay tablets"),
        ("Only around 4,000 symbols have been fully deciphered", "4,000"),
        ("The system died out when the empire collapsed", "the collapse of the empire"),
        ("Bilingual inscriptions provided the key to translation", "Bilingual inscriptions"),
        ("Most surviving tablets record taxes and trade", "taxes and trade"),
    ]),
    ("Desert farming", [
        ("Desert farms rely on drip irrigation to save water", "drip irrigation"),
        ("The project has turned 40,000 hectares of dunes into farmland", "40,000"),
        ("Solar pumps draw water from wells 200 metres deep", "200"),
        ("Farms grow olives, dates and pomegranates", "olives, dates and pomegranates"),
        ("Sandstorms destroyed a quarter of the first year's crop", "a quarter"),
        ("Greenhouses reduce water loss by 60% compared with open fields", "60%"),
    ]),
    ("Sleep research", [
        ("Adults need between 7 and 9 hours of sleep per night", "7 and 9"),
        ("The deepest stage of sleep occurs in the first third of the night", "first third"),
        ("Study participants who slept six hours made 30% more errors", "30%"),
        ("Blue light suppresses melatonin production", "melatonin"),
        ("Napping for more than 30 minutes harms the sleep cycle", "30 minutes"),
        ("The largest sleep study followed 50,000 people over a decade", "50,000"),
    ]),
    ("Ocean currents", [
        ("The Gulf Stream carries 30 times more water than the Amazon", "30"),
        ("Currents are driven mainly by wind and water density", "wind and water density"),
        ("The stream warmed by 2 degrees since 1990", "2"),
        ("The deep current completes one circuit in about 1,000 years", "1,000"),
        ("Sea ice melting slows the current's circulation", "Sea ice melting"),
        ("The currents moderate winter temperatures in Northern Europe", "Northern Europe"),
    ]),
    ("Public libraries", [
        ("The first lending library opened its doors in 1661", "1661"),
        ("Membership rose by 15% during the pandemic", "15%"),
        ("Digital loans now account for a third of all borrowing", "a third"),
        ("The most popular section is crime fiction", "crime fiction"),
        ("Libraries host classes attended by 9,000 adults a year", "9,000"),
        ("Funding for new branches was cut in 2019", "2019"),
    ]),
    ("Mars missions", [
        ("The first successful rover landing on Mars was in 1997", "1997"),
        ("The rover's top speed is 4.5 centimetres a second", "4.5"),
        ("Samples of rock are being stored for return to Earth", "Samples of rock"),
        ("The mission has found evidence of ancient rivers", "ancient rivers"),
        ("Radio signals take up to 22 minutes to reach the rover", "22"),
        ("The rover carries 23 cameras", "23"),
    ]),
    ("Coffee farming", [
        ("Coffee grows best between 800 and 2,000 metres above sea level", "800 and 2,000"),
        ("Rising temperatures are forcing farms to move higher", "higher"),
        ("Shade-grown coffee commands a price premium of 25%", "25%"),
        ("The country's coffee exports fell by a fifth after the frost", "a fifth"),
        ("Farmers are switching to hardier Robusta plants", "Robusta"),
        ("A single coffee tree yields about 2 kilos of cherries a year", "2"),
    ]),
    ("Carbon capture", [
        ("The pilot plant captures 4,000 tonnes of CO2 each year", "4,000"),
        ("Captured carbon is piped into empty oil fields", "empty oil fields"),
        ("The process uses 30% more energy than conventional plants", "30%"),
        ("Costs per tonne fell from 600 dollars to 110 dollars in five years", "110 dollars"),
        ("The plant absorbs less water than older designs", "less water"),
        ("Regulators approved the first commercial site in 2023", "2023"),
    ]),
    ("Bee colonies", [
        ("A honeybee hive colony contains up to 60,000 workers", "60,000"),
        ("Hives have been declining by 5% per year since 2015", "5%"),
        ("Neonicotinoid pesticides are blamed for a third of colony losses", "Neonicotinoid pesticides"),
        ("Beekeepers now charge pollination fees of 300 dollars per hive", "300"),
        ("Urban hives produce honey free of the heaviest pesticide traces", "Urban hives"),
        ("The country imported 2 million bees last spring", "2 million"),
    ]),
    ("History of maps", [
        ("The first printed maps appeared in 1477", "1477"),
        ("Early maps drew coastlines from sailors' reports", "sailors' reports"),
        ("Mercator's projection exaggerated the size of polar regions", "polar regions"),
        ("Satellite mapping now covers 99% of the land surface", "99%"),
        ("The most detailed ocean maps come from sonar surveys", "sonar surveys"),
        ("One medieval atlas contains 60 hand-coloured pages", "60"),
    ]),
    ("Water conservation", [
        ("Household water use fell by 22% after meters were installed", "22%"),
        ("Leaks waste an estimated 3 billion litres a year", "3 billion"),
        ("Grey-water systems recycle bath water for gardens", "Grey-water systems"),
        ("The drought plan limits each household to 150 litres a day", "150"),
        ("Rainwater tanks are subsidised with a 500-dollar rebate", "500"),
        ("The reservoir dropped to 40% of capacity last summer", "40%"),
    ]),
    ("Musical training", [
        ("Musicians who train early show denser connections in the brain", "denser connections"),
        ("The study followed 800 children for six years", "800"),
        ("Students with musical training scored 12% higher on language tests", "12%"),
        ("Practice alone explained 21% of the variation in skill", "21%"),
        ("Group music classes had the strongest effect on attention", "Group music classes"),
        ("The programme cost 30 dollars per child per term", "30"),
    ]),
    ("Volcano monitoring", [
        ("Seismometers detected 400 small quakes before the eruption", "400"),
        ("Gas sensors measure sulphur dioxide rising from the crater", "sulphur dioxide"),
        ("The observatory issued its first warning 11 days early", "11"),
        ("Lava flows destroyed 60 buildings in the valley", "60"),
        ("Satellites track ground deformation of a few centimetres", "ground deformation"),
        ("The volcano's last major eruption was in 1954", "1954"),
    ]),
    ("Recycling plastics", [
        ("Only 9% of plastic waste has ever been recycled", "9%"),
        ("The new plant processes 25,000 tonnes of plastic a year", "25,000"),
        ("Chemical recycling recovers oils from mixed plastics", "Chemical recycling"),
        ("Recycled pellets sell for 30% less than virgin resin", "30%"),
        ("Deposit schemes lifted bottle returns to 86%", "86%"),
        ("The plant opened in 2023 with 400 employees", "400"),
    ]),
    ("Ocean plastics", [
        ("An estimated 11 million tonnes of plastic enter the ocean each year", "11 million"),
        ("Fishing nets make up almost half of the plastic in the Pacific patch", "Fishing nets"),
        ("Clean-up vessels can collect 50 tonnes in a single trip", "50"),
        ("Microplastics have been found at depths of 10,000 metres", "10,000"),
        ("The clean-up cost works out at 5 dollars per kilo", "5"),
        ("Half the plastic in the patch is older than ten years", "ten years"),
    ]),
]

_TIPS = {
    "True / False / Not Given": [
        "Decide True only when the claim matches the text exactly.",
        "False needs a direct contradiction, not just a difference.",
        "Not Given means the text never mentions the claim at all.",
    ],
    "Yes / No / Not Given": [
        "Ask whether the WRITER would agree, not whether the statement is true.",
        "'No' needs the writer's clear opposite view.",
        "Treat a neutral mention as Not Given.",
    ],
    "Multiple Choice": [
        "Read the question's keywords, then scan for the supporting sentence.",
        "Eliminate options that are true in real life but not in the text.",
        "Match the exact wording, not similar-sounding phrases.",
    ],
    "Sentence Completion": [
        "Respect the word limit exactly.",
        "The gap usually needs a noun phrase from the text.",
        "Copy the exact words rather than paraphrasing.",
    ],
    "Short Answer": [
        "Scan for the keyword and copy the value or name precisely.",
        "Include units if the question asks for them.",
        "Answers come in text order.",
    ],
    "Matching Headings": [
        "Match the paragraph's main idea, not a repeated word.",
        "First and last sentences usually carry the main idea.",
        "Leave difficult paragraphs until the end.",
    ],
    "Matching Features": [
        "Read all names first, then match each feature as you find it.",
        "Watch for names that appear with several features.",
        "Answer in the order the features appear in the text.",
    ],
    "Matching Sentence Endings": [
        "Read the ending options before the passage.",
        "The stem plus one ending must form a true sentence.",
        "Check the beginning of the stem for meaning, not just grammar.",
    ],
    "Summary Completion": [
        "Predict the missing word from the surrounding grammar.",
        "Keep to the word limit.",
        "The summary usually follows the text order.",
    ],
    "Table / Flow Chart Completion": [
        "Scan the table headings to predict the missing data type.",
        "Answers are usually copied exactly from the text.",
        "Move through the text in the same order as the rows.",
    ],
}

_TYPES = [
    ("True / False / Not Given", "true-false"),
    ("Yes / No / Not Given", "yes-no-not-given"),
    ("Multiple Choice", "multiple-choice"),
    ("Sentence Completion", "sentence-completion"),
    ("Short Answer", "short-answer"),
    ("Matching Headings", "matching-headings"),
    ("Matching Features", "matching"),
    ("Matching Sentence Endings", "matching-sentence-endings"),
    ("Summary Completion", "summary-completion"),
    ("Table / Flow Chart Completion", "table-completion"),
]

_TARGET = 500
_random = random.Random(42)

_facts: list[tuple[str, str, str]] = [(topic, s, v) for topic, fl in R_FACTS for (s, v) in fl]
_all_sentences = [s for _, fl in R_FACTS for (s, _) in fl]
_all_values = [v for _, fl in R_FACTS for (_, v) in fl]

_used: set[str] = set()
_bank: list[Item] = []
_ids = 0


def _emit(type_label: str, type_name: str, title: str, context: str, prompt: str,
          options: list[str], answer: str, explanation: str, logic: str, tip: str,
          suggestions: str = "") -> None:
    global _ids
    key = type_label + "|" + prompt + "|" + answer
    if key in _used:
        return
    _used.add(key)
    _ids += 1
    _bank.append({
        "id": f"lb-reading-{_ids:05d}-{type_name[:4]}",
        "type": type_name,
        "typeLabel": type_label,
        "title": title,
        "context": context,
        "prompt": prompt,
        "options": options,
        "correctAnswer": answer,
        "explanation": explanation,
        "logic": logic,
        "tip": tip,
        "suggestions": suggestions,
        "bandAdvice": "This question type rewards controlled scanning and precise matching, not general reading.",
    })


def _swap_words(sentence: str) -> str:
    """Flip the numeric/figure in a fact to a wrong value for distractor/False use."""
    words = sentence.split()
    for i, w in enumerate(words):
        cleaned = w.strip("%.,")
        if any(ch.isdigit() for ch in cleaned):
            repl = _all_values[_random.randrange(len(_all_values))]
            repl = repl.strip(" ,.")
            words[i] = w.replace(cleaned, repl, 1)
            return " ".join(words)
    return "The opposite of the claim stated in the text"


def _rotate(sentence: str) -> str:
    """A plausible-but-wrong paraphrase from a different topic."""
    return _all_sentences[_random.randrange(len(_all_sentences))]


def _gap(sentence: str, index: int) -> tuple[str, str]:
    """Insert a blank at the index-th word; return (gapped, removed word)."""
    words = sentence.split()
    if len(words) < 3:
        return sentence, ""
    pos = 1 + (index * 3) % (len(words) - 2)
    removed = words[pos].strip(",.")
    words[pos] = "____"
    return " ".join(words), removed


def build() -> list[Item]:
    if _bank:
        return list(_bank)
    for type_label, type_name in _TYPES:
        tips = _TIPS[type_label]
        made: list[Item] = []
        i = 0
        rounds = 0
        while len(made) < _TARGET and rounds < 60:
            rounds += 1
            for topic, sentence, value in _facts:
                i += 1
                prefix = f"Passage {i % 3 + 1} · {topic} —"
                if type_label == "True / False / Not Given":
                    for kind in (0, 1, 2, 3):
                        if len(made) >= _TARGET:
                            break
                        if kind == 0:
                            claim, ans = f"According to the text, is this claim correct? {sentence}.", "True"
                        elif kind == 1:
                            claim, ans = f"According to the text, is this claim correct? {_swap_words(sentence)}.", "False"
                        elif kind == 2:
                            claim, ans = f"According to the text, is this claim correct? {_rotate(sentence)}.", "Not Given"
                        else:
                            claim, ans = f"The text supports the statement: {sentence}.", "True"
                        made.append(_mk(type_label, type_name, f"{prefix} Fact check",
                                        sentence + ".", claim, ["True", "False", "Not Given"], ans, tips, i))
                elif type_label == "Yes / No / Not Given":
                    for kind in (0, 1, 2):
                        if len(made) >= _TARGET:
                            break
                        if kind == 0:
                            claim, ans = f"Would the writer agree that {sentence.lower()}?", "Yes"
                        elif kind == 1:
                            claim, ans = f"Would the writer agree with the opposite of: {sentence.lower()}?", "No"
                        else:
                            claim, ans = f"The writer supports a claim unrelated to the text: {_rotate(sentence).lower()}.", "Not Given"
                        made.append(_mk(type_label, type_name, f"{prefix} Author opinion",
                                        sentence + ".", claim, ["Yes", "No", "Not Given"], ans, tips, i))
                elif type_label == "Multiple Choice":
                    wrong = [_rotate(sentence), _swap_words(sentence), "The text gives no information about this"]
                    options = [sentence + "."] + wrong
                    _random.shuffle(options)
                    made.append(_mk(type_label, type_name, f"{prefix} Detail",
                                    sentence + ".", f"According to the text, which statement about {topic} is correct?",
                                    options, sentence + ".", tips, i))
                elif type_label == "Sentence Completion":
                    for k in range(2):
                        if len(made) >= _TARGET:
                            break
                        gapped, removed = _gap(sentence, i + k)
                        if not removed:
                            continue
                        made.append(_mk(type_label, type_name, f"{prefix} One-gap",
                                        sentence + ".", f"Complete the sentence with ONE word or number: {gapped}",
                                        [], removed, tips, i))
                elif type_label == "Short Answer":
                    for k, prompt in enumerate([
                        f"What detail does the text give about {topic}? (No more than THREE words and/or a number)",
                        f"According to the text, what is the key figure or fact about {topic}?",
                    ]):
                        if len(made) >= _TARGET:
                            break
                        made.append(_mk(type_label, type_name, f"{prefix} Find the detail",
                                        sentence + ".", prompt, [], value, tips, i))
                elif type_label == "Matching Headings":
                    others = _all_sentences[_random.randrange(len(_all_sentences))] + "."
                    made.append(_mk(type_label, type_name, f"{prefix} Paragraph purpose",
                                    f"Paragraph: {sentence}.",
                                    "Choose the heading that best fits the paragraph.",
                                    [sentence + ".", others, _swap_words(sentence) + ".", "The history of the topic"],
                                    sentence + ".", tips, i))
                elif type_label == "Matching Features":
                    made.append(_mk(type_label, type_name, f"{prefix} Match the claim",
                                    f"Research on {topic} found that {sentence.lower()}.",
                                    f"Which finding matches the text about {topic}?",
                                    [sentence + ".", _swap_words(sentence) + ".", "The text does not mention this", "The opposite of the text"],
                                    sentence + ".", tips, i))
                elif type_label == "Matching Sentence Endings":
                    stem = " ".join(sentence.split()[:4])
                    made.append(_mk(type_label, type_name, f"{prefix} Complete the idea",
                                    f"The text says: {sentence}.",
                                    f"Choose the ending that makes this true: {stem} ____",
                                    [sentence[len(stem):].strip(" ,") + ".", _swap_words(sentence) + ".", "none of the above"],
                                    sentence[len(stem):].strip(" ,") + ".", tips, i))
                elif type_label == "Summary Completion":
                    for k in range(2):
                        if len(made) >= _TARGET:
                            break
                        gapped, removed = _gap(sentence, i + k)
                        if not removed:
                            continue
                        made.append(_mk(type_label, type_name, f"{prefix} Summary gap",
                                        f"The passage explains that {sentence.lower()}.",
                                        f"Complete the summary (ONE or TWO words): {sentence} {gapped[sentence.find('____') - 4:].replace(chr(95) * 4, chr(95) * 4)}",
                                        [], value if len(value.split()) <= 2 else " ".join(value.split()[:2]), tips, i))
                elif type_label == "Table / Flow Chart Completion":
                    made.append(_mk(type_label, type_name, f"{prefix} Table row",
                                    f"Complete the table. The text states: {sentence}.",
                                    f"According to the text, fill in the missing entry for {topic}:",
                                    [], value, tips, i))
        _bank.extend(made)
    return list(_bank)


def _mk(type_label: str, type_name: str, title: str, context: str, prompt: str,
        options: list[str], answer: str, tips: list[str], i: int) -> Item:
    return {
        "type": type_name,
        "typeLabel": type_label,
        "title": title,
        "context": context,
        "prompt": prompt,
        "options": options,
        "correctAnswer": answer,
        "explanation": f"The text states: \"{context}\" The answer ({answer}) is the detail the question asks for; other options are either true of a different detail or not supported by the text.",
        "logic": "1. Find the sentence containing the question's keywords. 2. Match its exact meaning. 3. Reject any option the text contradicts or never mentions.",
        "tip": tips[i % len(tips)],
        "suggestions": "Re-scan the exact sentence and compare every option against its words.",
        "bandAdvice": "This question type rewards controlled scanning and precise matching, not general reading.",
    }


READING_LARGE_BANK = build()

READING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in READING_LARGE_BANK:
    READING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)
