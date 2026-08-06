"""Large offline Writing bank: ~500 distinct items per writing question type.

Deterministic combinatorial generator: Task 2 essay prompts from topic wording
templates x subject/side pools, Task 1 data reports from parametrised charts,
and process/map descriptions. Schema matches writing_bank items.
"""

import random
from typing import Any

Item = dict[str, Any]

_TARGET = 500
_rnd = random.Random(11)

_TYPES = [
    ("Task 1 Report (Data)", "essay"),
    ("Task 1 Process / Map", "essay"),
    ("Task 2 Opinion", "essay"),
    ("Task 2 Discussion", "essay"),
    ("Task 2 Advantages / Disadvantages", "essay"),
    ("Task 2 Problem / Solution", "essay"),
    ("Task 2 Double Question", "essay"),
]

_TIPS = {
    "Task 1 Report (Data)": ["Start with an overview; never list every number.", "Group the data (highest, lowest, trends).", "Compare, using language like 'whereas' and 'three times'."],
    "Task 1 Process / Map": ["Describe the sequence using linking steps.", "For maps, mention both time periods and how they differ.", "Keep the description neutral; no opinion."],
    "Task 2 Opinion": ["State your position clearly in the introduction.", "Support every claim with a reason and example.", "Finish by restating your view."],
    "Task 2 Discussion": ["Discuss both views fairly in separate paragraphs.", "Aim for a balanced conclusion with your own opinion.", "Introduce each side with a topic sentence."],
    "Task 2 Advantages / Disadvantages": ["Cover BOTH sides, then a reasoned conclusion.", "Use 'On the one hand... On the other hand...'.", "Give one developed example per side."],
    "Task 2 Problem / Solution": ["Answer the two-part question fully.", "Link each solution to its cause.", "Use conditionals: 'If governments invest...'."],
    "Task 2 Double Question": ["Answer BOTH sub-questions in separate paragraphs.", "Use one clear position for the opinion question.", "Check each paragraph answers its assigned question."],
}

_SUBJECTS = [
    "artificial intelligence at work", "remote learning in schools", "air travel and emissions",
    "urban public transport", "renewable energy adoption", "online shopping", "working from home",
    "the role of museums", "social media and teenagers", "genetic modification of crops",
    "space exploration", "the growth of tourism", "digital books", "fast food and health",
    "recycling schemes", "the rail vs road debate", "university tuition fees", "screen time for children",
    "the decline of small shops", "ai-generated content", "global food imports", "urban green spaces",
    "the gig economy", "tax on sugary drinks", "autonomous vehicles", "diet and government",
    "cultural festivals", "childhood obesity", "crowdfunding", "the future of print media",
    "vertical farming", "electric vehicles", "telemedicine", "the sharing economy",
    "home schooling", "fast fashion", "company surveillance", "public health campaigns",
    "the olympics in cities", "plastic packaging", "personal data privacy", "high-speed rail",
    "urban birdlife", "film streaming", "cashless payments", "language learning apps",
    "international aid", "the beauty industry", "knowledge tests at work", "community libraries",
    "the meat industry", "workplace wellbeing programmes", "digital currencies", "museum fees",
    "street food markets", "environmental taxes", "the four-day week", "sports education",
    "urban beekeeping", "night-time economies", "pet ownership in cities", "public art",
    "self-checkout kiosks", "online banking", "the housing shortage", "youth volunteering",
    "teacher pay", "cycling infrastructure", "river clean-up schemes", "the film industry at home",
    "commuter villages", "city rooftop gardens", "subscription services", "open-source software",
    "the right to disconnect", "school uniform policies", "cash-back schemes", "artificial reefs",
    "microcredit for small firms", "the winter tourism season", "fire safety in buildings",
]

_OPINION = [
    "Some people believe that {subject} is a positive development, while others strongly oppose it. Discuss both views and give your own opinion.",
    "Some people argue that {subject} should be encouraged, while others claim it does more harm than good. Discuss both views and state your opinion.",
    "To what extent do you agree or disagree that {subject} brings more benefits than drawbacks?",
    "Some people think {subject} is the solution to many current problems. Others believe it creates new ones. Give your opinion.",
    "It is sometimes argued that {subject} should be restricted. Do you agree or disagree with this statement?",
    "How far do you agree that {topic} should be expanded in the coming decade?",
    "Some hold that {topic} is inevitable. Do you agree that it should be embraced rather than resisted?",
    "Discuss whether the growth of {topic} is mainly beneficial or mainly harmful, and give your position.",
]
_DISCUSSION = [
    "Some people think {topic} has a positive effect on modern life, while others believe it is mostly negative. Discuss both sides.",
    "While some support {topic}, others consider it harmful. Discuss both perspectives and why each may hold this view.",
    "Some people favour the growth of {topic}; others are concerned about its consequences. Discuss both viewpoints.",
    "There is debate about whether {topic} helps or hinders society. Discuss both sides of this argument.",
    "People disagree about the value of {topic}. Present the arguments on each side and conclude.",
    "Some commentators claim {topic} unites people; others say it divides them. Examine both views.",
    "Is {topic} considered by some as progress and by others as a threat? Discuss the two positions.",
]
_ADD = [
    "What are the advantages and disadvantages of {topic}?",
    "Some people think {topic} brings mainly benefits. Discuss the advantages and possible disadvantages.",
    "Should {topic} be developed or limited? Discuss the advantages and disadvantages.",
    "Outline the benefits and drawbacks associated with the spread of {topic}.",
    "Discuss both the positive and negative sides of {topic} and say which you find stronger.",
    "Weigh the advantages against the risks of {topic}. Which should guide policy, and why?",
    "Examine what individuals gain and lose as {topic} becomes normal.",
    "Describe the short-term gains and long-term costs of {topic}.",
]
_PROBSOL = [
    "What are the causes of problems linked to {topic}, and what solutions can you suggest?",
    "Explain the main issue behind {topic} and propose solutions that governments or individuals could take.",
    "What problems does {topic} present, and how can they be solved?",
    "What do you see as the key problems created by {topic}, and who should act first to solve them?",
    "Identify the difficulties {topic} raises for ordinary people and suggest practical ways to reduce them.",
    "Analyse the reasons why {topic} creates difficulties and evaluate the most effective remedies.",
    "What steps should be taken to address the issues surrounding {topic}, and who is responsible?",
]
_DOUBLE = [
    "Why has {topic} become more common in recent years, and is this a positive or negative development?",
    "What has made {topic} so popular today, and what should happen next?",
    "Explain why {topic} is growing in importance, and discuss whether this trend is welcome.",
    "Why is {topic} now a frequent topic of discussion, and what does the future hold for it?",
    "What has caused the recent rise of {topic}, and how should society respond?",
    "Why are more people paying attention to {topic}, and what are the likely consequences?",
    "What explains the growing interest in {topic}, and is this attention justified?",
]

_CHART_TOPICS = [
    ("Household spending by category", ["Housing", "Food", "Transport", "Health", "Education", "Leisure"]),
    ("International student numbers", ["2018", "2019", "2020", "2021", "2022", "2023"]),
    ("Electricity from renewable sources", ["Solar", "Wind", "Hydro", "Geothermal", "Biomass", "Tidal"]),
    ("Weekly time spent on activities", ["Study", "Work", "Sleep", "Exercise", "Socialising", "Screen time"]),
    ("Water usage by household activity", ["Bathing", "Washing", "Cooking", "Gardening", "Cleaning", "Drinking"]),
    ("Passenger numbers on city transport", ["Bus", "Metro", "Train", "Tram", "Cycle", "Walk"]),
    ("Waste recycled by material", ["Paper", "Glass", "Plastic", "Metal", "Food", "Fabric"]),
    ("New flats built each year", ["One-bed", "Two-bed", "Three-bed", "Studio", "Penthouse"]),
    ("Email time by age group", ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"]),
]

_CHART_LOCATIONS = ["a capital city", "a coastal town", "an island region", "a university", "a manufacturing region", "an industrial district", "a farming community", "a port city", "a mountain region", "a border town"]
_CHART_YEARS = ["2015-2021", "2016-2022", "2017-2023", "2018-2024", "2019-2025", "2014-2020", "2012-2019"]
_CHART_UNITS = ["percentage of total", "number of people", "tonnes", "hours per month", "megawatts", "thousand units", "household share", "flights per month"]

_chart_used_titles: set[str] = set()

def _chart_variant() -> tuple[str, list[str]]:
    """Produce a unique-ish chart title by combining pools."""
    base = _CHART_TOPICS[_rnd.randrange(len(_CHART_TOPICS))]
    loc = _CHART_LOCATIONS[_rnd.randrange(len(_CHART_LOCATIONS))]
    yr = _CHART_YEARS[_rnd.randrange(len(_CHART_YEARS))]
    title = f"{base[0]} in {loc}, {yr}"
    return title, base[1]

_chart_ids = 0


def _chart(topic: str, cats: list[str]) -> dict:
    global _chart_ids
    _chart_ids += 1
    vals = [(_rnd.randrange(5, 80), _rnd.choice([0, 5])) for _ in range(len(cats))]
    values = [a + b for a, b in vals]
    values = sorted(values, reverse=(_chart_ids % 2 == 0))
    pod_type = "bar" if _chart_ids % 3 else "pie"
    units = "percentage" if _chart_ids % 2 else "units"
    return {"type": pod_type, "title": f"{topic} ({_chart_ids})", "unit": units,
            "categories": list(cats), "values": values}


_used: set[str] = set()
_bank: list[Item] = []
_ids = 0


def _mk(type_label: str, title: str, prompt: str, model: str, chart: dict | None, tip: str, i: int) -> Item | None:
    global _ids
    key = type_label + "|" + prompt
    if key in _used:
        return None
    _used.add(key)
    _ids += 1
    return {
        "id": f"lb-writing-{_ids:05d}",
        "type": "essay",
        "typeLabel": type_label,
        "title": title,
        "context": "",
        "prompt": prompt,
        "options": [],
        "correctAnswer": model,
        "explanation": "Structure: cover each required part, support every claim, and check grammar, range and task response.",
        "logic": "1. Plan for five minutes: position, two body points, example. 2. Paragraph per idea with a topic sentence. 3. Conclude by restating the position.",
        "tip": tip,
        "suggestions": "Rewrite once with the model answer in view, then compare paragraph by paragraph.",
        "bandAdvice": "Each band rise follows one focused fix: structure, then range, then accuracy.",
        "chart": chart or {},
    }


def build() -> list[Item]:
    if _bank:
        return list(_bank)
    i = 0
    # Task 2 families
    for family, templates in [
        ("Task 2 Opinion", _OPINION), ("Task 2 Discussion", _DISCUSSION),
        ("Task 2 Advantages / Disadvantages", _ADD), ("Task 2 Problem / Solution", _PROBSOL),
        ("Task 2 Double Question", _DOUBLE),
    ]:
        tips = _TIPS[family]
        made = 0
        t = 0
        while made < _TARGET and t < 2000:
            t += 1
            for j, template in enumerate(templates):
                subject = _SUBJECTS[(t + j * 3) % len(_SUBJECTS)]
                if made >= _TARGET:
                    break
                i += 1
                prompt = template.format(subject=subject, topic=subject)
                model = (f"Model answer: address the prompt directly, give a clear position on {subject}, keep a "
                         f"paragraph structure (introduction, two body paragraphs with reasons and an example, conclusion), "
                         f"use linking words and topic vocabulary, and stay within the word limit.")
                item = _mk(family, f"{family} · {subject[:40]}", prompt, model, None, tips[made % 3], i)
                if item:
                    _bank.append(item)
                    made += 1
    # Task 1 data
    made = 0
    t = 0
    while made < _TARGET and t < 3000:
        t += 1
        title, cats = _chart_variant()
        if title in _chart_used_titles:
            continue
        _chart_used_titles.add(title)
        i += 1
        chart = _chart(title, cats)
        prompt = (f"The {chart['type']} chart below shows {title.lower()}. "
                  f"Summarise the information by selecting and reporting the main features, and make comparisons where relevant.")
        model = (f"Model answer: give an overview of the overall trend, report the highest and lowest entries, "
                 f"describe the direction of change, and compare groups using structures like 'more than', 'three times', 'in contrast'.")
        item = _mk("Task 1 Report (Data)", f"Task 1 · {title}", prompt, model, chart, _TIPS["Task 1 Report (Data)"][made % 3], i)
        if item:
            _bank.append(item)
            made += 1
    # Task 1 process/map
    made = 0
    _PROCESS_POOL = [
        ("water treatment plant", ["Raw water intake", "Coagulation", "Filtration", "Chlorination", "Storage", "Distribution"]),
        ("coffee production", ["Harvesting", "Drying", "Roasting", "Grinding", "Packing", "Shipping"]),
        ("bottle recycling", ["Collection", "Sorting", "Crushing", "Melting", "Moulding", "New bottles"]),
        ("bread production", ["Mixing flour and water", "Kneading", "Proving", "Baking", "Cooling", "Slicing and packing"]),
        ("paper manufacturing", ["Log chipping", "Pulping", "Drying sheets", "Pressing", "Coating", "Rolling"]),
        ("solar panel installation", ["Site survey", "Frame fitting", "Panel mounting", "Wiring", "Connection to grid", "Testing"]),
        ("tomato sauce factory", ["Washing", "Chopping", "Cooking", "Sieving", "Bottling", "Labelling"]),
        ("fishing industry", ["Trawling", "Sorting", "Freezing at sea", "Docking", "Processing", "Market sale"]),
        ("maple syrup production", ["Tapping trees", "Collecting sap", "Boiling", "Filtering", "Grading", "Bottling"]),
        ("brick production", ["Clay digging", "Mixing", "Moulding", "Drying", "Firing", "Cooling and stacking"]),
        ("wool processing", ["Shearing", "Washing", "Carding", "Spinning", "Weaving", "Dyeing"]),
        ("glass bottle making", ["Sand melting", "Blowing", "Annealing", "Coating", "Filling", "Capping"]),
        ("wastewater treatment", ["Screening", "Primary settling", "Aeration", "Secondary settling", "Disinfection", "Release"]),
        ("cocoa processing", ["Pod harvesting", "Fermenting", "Drying", "Roasting", "Grinding", "Pressing"]),
        ("town map regeneration", ["Two periods shown", "Old industrial zone", "New housing estate", "Pedestrian square", "River walk", "New transport hub"]),
        ("map of a new library", ["Entrance", "Reception", "Reading rooms", "Study desks", "Café", "Garden terrace"]),
        ("map of an airport terminal", ["Check-in", "Security", "Duty-free", "Gates", "Lounge", "Baggage claim"]),
        ("map of a university campus", ["Main building", "Library", "Lecture halls", "Sports centre", "Student village", "Bus stop"]),
        ("map of a harbour redevelopment", ["Warehouses", "Marina", "Restaurants", "Housing", "Ferry terminal", "Park"]),
        ("map of a town square", ["Old market hall", "Fountain", "Cafés", "Bus stop", "Playground", "Trees"]),
        ("map of a hospital site", ["Outpatients", "Emergency", "Wards", "Pharmacy", "Car park", "Helipad"]),
        ("map of a coastal resort", ["Beach huts", "Promenade", "Hotel", "Pool", "Arcade", "Lifeguard station"]),
        ("map of an industrial estate", ["Factory", "Warehouses", "Offices", "Lorry park", "Rail spur", "Canteen"]),
        ("map of a train station area", ["Station building", "Ticket hall", "Platforms", "Cycle racks", "Taxi rank", "Shops"]),
        ("map of a park expansion", ["Entrance gates", "Lake", "Woodland", "Playing fields", "Café", "Playground"]),
        ("chocolate production", ["Bean selection", "Roasting", "Grinding", "Conching", "Tempering", "Moulding"]),
        ("cheese making", ["Milk pasteurisation", "Starter culture", "Curd cutting", "Pressing", "Salting", "Maturation"]),
        ("beer brewing", ["Malt milling", "Mashing", "Boiling with hops", "Fermentation", "Filtering", "Bottling"]),
        ("yoghurt production", ["Milk reception", "Standardising", "Heating", "Culturing", "Cooling", "Packing"]),
        ("olive oil pressing", ["Olive harvest", "Washing", "Crushing", "Malaxing", "Centrifuging", "Bottling"]),
        ("honey production", ["Nectar collection", "Hive storage", "Comb extraction", "Filtering", "Heating", "Jarring"]),
        ("sugar refining", ["Cane crushing", "Juice extraction", "Clarifying", "Crystallising", "Centrifuging", "Drying"]),
        ("salt production", ["Seawater intake", "Evaporation ponds", "Harvesting", "Washing", "Drying", "Grading"]),
        ("rice milling", ["Paddy intake", "Cleaning", "Husking", "Whitening", "Polishing", "Packing"]),
        ("cement production", ["Quarrying limestone", "Crushing", "Mixing", "Rotary kiln heating", "Cooling", "Bagging"]),
        ("steel recycling", ["Scrap collection", "Sorting", "Melting", "Alloying", "Casting", "Rolling"]),
        ("aluminium can recycling", ["Collection", "Shredding", "Melting", "Casting ingots", "Rolling sheets", "New cans"]),
        ("ceramic production", ["Clay mixing", "Shaping", "Drying", "First firing", "Glazing", "Second firing"]),
        ("textile finishing", ["Fabric weaving", "Scouring", "Dyeing", "Printing", "Finishing", "Quality control"]),
        ("leather processing", ["Hide selection", "Soaking", "Liming", "Tanning", "Dyeing", "Drying"]),
        ("wine making", ["Grape picking", "Crushing", "Fermentation", "Aging", "Filtering", "Bottling"]),
        ("whisky distilling", ["Malt milling", "Mashing", "Fermenting", "Distilling", "Cask aging", "Bottling"]),
        ("fruit juice production", ["Fruit washing", "Extraction", "Pasteurisation", "Clarification", "Filling", "Chilling"]),
        ("potato crisp making", ["Potato washing", "Peeling", "Slicing", "Frying", "Seasoning", "Packing"]),
        ("pasta production", ["Flour mixing", "Kneading", "Extrusion", "Drying", "Cutting", "Packing"]),
        ("map of a new office park", ["Reception", "Open offices", "Meeting rooms", "Cafeteria", "Gym", "Landscaped court"]),
        ("map of a retail park", ["Anchor store", "Shops", "Restaurants", "Cinema", "Car park", "Bus stop"]),
        ("map of a museum extension", ["Original building", "New gallery wing", "Glass link", "Café", "Shop", "Garden"]),
        ("map of a riverside quay", ["Old warehouses", "Promenade", "Market stalls", "Cycle path", "Ferry stop", "Park"]),
        ("map of a sports complex", ["Stadium", "Training pitches", "Gym", "Pool", "Car parks", "Metro stop"]),
    ]
    for t, (proc, steps) in enumerate(_PROCESS_POOL):
        if made >= _TARGET:
            break
        for variant in range(10):
            if made >= _TARGET:
                break
            i += 1
            if "map" in proc or "town" in proc or "campus" in proc or "airport" in proc:
                kind = "map"
                prompt = (f"The maps show a {proc} at two different periods (version {variant + 1}). Summarise the information by "
                          f"selecting and reporting the main changes, and make comparisons where relevant.")
                model = (f"Model answer (version {variant + 1}): describe the main changes between the two periods with comparison "
                         f"language, and include an overview of the overall transformation. Landmarks: " + " → ".join(steps))
            else:
                kind = "process"
                prompt = (f"The diagram shows the stages of {proc} (version {variant + 1}). Summarise the information by selecting "
                          f"and reporting the main features and make comparisons where relevant.")
                model = ("Model answer: describe the flow in order with sequence markers: first, then, next, "
                         "afterwards, finally. Mention inputs and outputs and keep a neutral, factual tone. "
                         f"Sequence: " + " → ".join(steps))
            chart = None if kind == "map" else _chart(f"{proc} stages", list(steps))
            item = _mk("Task 1 Process / Map", f"Task 1 · {proc} ({kind}, v{variant + 1})", prompt,
                       model, chart, _TIPS["Task 1 Process / Map"][made % 3], i)
            if item:
                _bank.append(item)
                made += 1
    return list(_bank)


WRITING_LARGE_BANK = build()

WRITING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in WRITING_LARGE_BANK:
    WRITING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)