"""Large banks reserved for mock exams ONLY.

These banks share the exact generation logic of ``large_bank`` (same official
question types, same item schema) but are built from ENTIRELY different
content pools and seeds: fresh reading topics, listening slot pools (names,
prices, places, times, dates...), writing subjects, chart and process/map
pools. A mock exam therefore NEVER contains a question, topic or wording
that the portal's practice sessions use - the questions are out of the
practice syllabus by construction.

Implementation: each ``large_bank_<skill>`` module is instantiated in
isolation (fresh module globals), its content pools are swapped for the
mock-only pools below, its counters and seeds are reset, and ``build()`` is
re-run with a smaller target. The original large_bank modules are never
touched, so practice sessions keep their exact content.
"""

import importlib.util as _ilu
import random
from pathlib import Path as _Path
from typing import Any

Item = dict[str, Any]

# ---------------------------------------------------------------------------
# Reading seed facts: (topic, [(fact sentence, key value), ...])
# ---------------------------------------------------------------------------

MOCK_R_FACTS: list[tuple[str, list[tuple[str, str]]]] = [
    ("Mangrove restoration", [
        ("Mangroves absorb up to 4 times more carbon per hectare than rainforest", "4"),
        ("The replanting project covered 12,000 hectares of coastline", "12,000"),
        ("Crab populations doubled within 3 years of the first plantings", "doubled"),
        ("The nurseries grow seedlings for 9 months before planting", "9 months"),
        ("Fishermen were trained as restoration wardens from 2019", "2019"),
        ("Storm surges were reduced by an average of 65% behind restored stands", "65%"),
    ]),
    ("Community radio stations", [
        ("Community radio reaches 40% of rural listeners who lack phone signal", "40%"),
        ("The first station in the country opened in 1998", "1998"),
        ("Volunteers must complete 60 hours of training before broadcasting", "60"),
        ("Local news bulletins are repeated every hour", "every hour"),
        ("The stations are funded mainly by listener subscriptions", "listener subscriptions"),
        ("Solar-powered transmitters cut electricity costs by half", "half"),
    ]),
    ("The indigo dye trade", [
        ("Indigo dye was worth more than silver in the 18th century", "silver"),
        ("The dye is extracted by fermenting plant leaves in water", "fermenting"),
        ("Production collapsed when synthetic dye was invented in 1897", "1897"),
        ("Traditional dyeing took 7 days from leaf to cloth", "7"),
        ("The colour deepens with each of the 3 dipping cycles", "3"),
        ("Modern artisans revived the craft after 2010", "2010"),
    ]),
    ("Glacier tourism", [
        ("Glacier visitors increased by 22% between 2015 and 2023", "22%"),
        ("Guided walks are limited to 25 people per group", "25"),
        ("The main observation platform opened at 3,100 metres", "3,100"),
        ("Retreating ice has lengthened the access route by 4 kilometres", "4"),
        ("Visitor fees fund the drilling of monitoring boreholes", "monitoring boreholes"),
        ("Local guides reported 185 rescue call-outs last season", "185"),
    ]),
    ("Urban rooftop gardens", [
        ("Rooftop gardens cover 8% of the city's flat roofs today", "8%"),
        ("Each garden supplies about 30 households with vegetables", "30"),
        ("The city requires green roofs on new buildings above 5 storeys", "5"),
        ("Rooftop temperature dropped by up to 6 degrees on hot days", "6"),
        ("The first public rooftop farm opened in 2012", "2012"),
        ("Bees raised on rooftops produce 55 kilograms of honey per site", "55"),
    ]),
    ("Roman aqueducts", [
        ("The longest Roman aqueduct ran for 90 kilometres", "90"),
        ("The gradient of the water channel was never steeper than 1 in 100", "1 in 100"),
        ("Lead pipes were avoided in drinking supply lines", "Lead pipes"),
        ("The aqueduct supplied nearly 400,000 cubic metres per day", "400,000"),
        ("Engineers used arches to cross 3 major valleys", "3"),
        ("The system operated for about 500 years", "500"),
    ]),
    ("Global seed banks", [
        ("Seed banks preserve seeds at minus 18 degrees Celsius", "minus 18"),
        ("The vault holds samples from 26,000 plant species", "26,000"),
        ("Deposits doubled after the storage facility opened in 2008", "2008"),
        ("Seeds are tested for germination every 10 years", "10"),
        ("The collection occupies 350 square metres of sealed chambers", "350"),
        ("Farmers receive backup seeds through a return programme", "return programme"),
    ]),
    ("Night markets", [
        ("Night markets in tropical cities attract 3 million visitors monthly", "3 million"),
        ("Most stalls operate between 6 pm and 2 am", "6 pm and 2 am"),
        ("Licence fees were reduced by 40% for new vendors", "40%"),
        ("The oldest market district dates back to 1920", "1920"),
        ("Vendors report that repeat customers make up half their trade", "half"),
        ("Plastic waste fell sharply after the reusable dish scheme began", "reusable dish scheme"),
    ]),
    ("Fibre-optic broadband", [
        ("Fibre-optic cables carry signals at 70% of the speed of light", "70%"),
        ("The national rollout connected the first city in 2016", "2016"),
        ("Installation crews lay 5 kilometres of cable each day", "5"),
        ("Faults take an average of 3 hours to repair", "3"),
        ("Rural schools saw download speeds rise by 12 times", "12 times"),
        ("Undersea cables carry 95% of intercontinental data traffic", "95%"),
    ]),
    ("Tidal power", [
        ("The tidal barrage generates 240 megawatts at peak flow", "240"),
        ("Turbines spin fastest at the 2 daily high tides", "2"),
        ("Fish passage counts improved after sluice gates were redesigned", "sluice gates"),
        ("Construction began in 2007 and ended in 2015", "2015"),
        ("The plant supplies power to 150,000 homes", "150,000"),
        ("Sediment build-up reduced output by 8% in the first decade", "8%"),
    ]),
    ("Traditional herbal medicine", [
        ("The clinic's herbal garden grows 140 medicinal species", "140"),
        ("Practitioners record remedies in a manual first printed in 1788", "1788"),
        ("Extracts are standardised by concentration before sale", "concentration"),
        ("Clinical trials covered 6 common ailments", "6"),
        ("Herbal courses last 4 years including field training", "4 years"),
        ("The export value of approved products tripled since 2015", "2015"),
    ]),
    ("Driftwood architecture", [
        ("The festival's largest driftwood hall spans 28 metres", "28"),
        ("Builders sort timber by exposure to salt and sun", "salt and sun"),
        ("The coast supplies 200 tonnes of usable driftwood each year", "200"),
        ("Structures are braced with rope made from recycled netting", "recycled netting"),
        ("The first festival workshop opened in 2005", "2005"),
        ("Half of the timber is returned to the beach after 3 seasons", "3 seasons"),
    ]),
]

# ---------------------------------------------------------------------------
# Listening slot pools (same formats as large_bank_listening)
# ---------------------------------------------------------------------------

MOCK_L_NAMES = [
    "Beshara", "Kowalczyk", "Sandoval", "Ibrahim", "Haapala", "Oyelaran", "Mendes", "Takahashi",
    "Ferreira", "Zubair", "Lindgren", "Okonkwo", "Petrova", "Alvarez", "Nilsson", "Esmail",
    "Ribeiro", "Kovac", "Hastings", "Diallo", "Moreau", "Stojanovic", "Abebe", "Farkas",
    "Vlachos", "Nkosi", "Bergström", "Hassan", "Czerny", "Mwangi", "Delgado", "Fernqvist",
]

MOCK_L_ITEMS = [
    ("studio apartment", "week", "185 pounds", "230 pounds"),
    ("river cruise pass", "person", "52 dollars", "78 dollars"),
    ("ski hire package", "day", "24 pounds", "36 pounds"),
    ("evening language course", "term", "95 pounds", "140 pounds"),
    ("photo workshop", "session", "18 dollars", "27 dollars"),
    ("car hire with insurance", "day", "58 dollars", "89 dollars"),
    ("fitness retreat", "weekend", "210 dollars", "320 dollars"),
    ("pottery class", "session", "14 pounds", "21 pounds"),
    ("festival weekend pass", "weekend", "64 pounds", "98 pounds"),
    ("boat mooring", "month", "130 dollars", "195 dollars"),
    ("sports court hire", "hour", "11 pounds", "17 pounds"),
    ("guided hiking tour", "person", "29 dollars", "44 dollars"),
    ("gallery annual pass", "year", "48 pounds", "72 pounds"),
    ("co-working desk", "month", "155 dollars", "235 dollars"),
    ("term locker rental", "term", "16 pounds", "25 pounds"),
    ("rehearsal room", "hour", "9 dollars", "13 dollars"),
]

MOCK_L_OPENERS = [
    "Woman: I'd like to book the {item} for this {unit}. Man: Certainly, that will be {price_a} after discount, or {price_b} at the full rate. Woman: I'll take the {price_a} option.",
    "Clerk: Good morning. The {item} comes to {price_a} per {unit}, with {price_b} applying if you add the extras. Customer: I'll go for the {price_a}.",
    "Receptionist: The {item} is {price_a} for each {unit}, or {price_b} with the premium service. Caller: I'll choose the {price_a} deal.",
    "Agent: For the {item}, the special offer is {price_a} per {unit} and the usual cost is {price_b}. Client: I'll take the {price_a} offer.",
]

MOCK_L_TIMEPHRASE = [
    ("quarter past nine", "9:15"), ("twenty to three", "2:40"), ("half past eleven", "11:30"),
    ("five to seven", "6:55"), ("twenty-five past four", "4:25"), ("ten past eight", "8:10"),
    ("quarter to one", "12:45"), ("twenty past six", "6:20"), ("five past nine", "9:05"),
    ("ten to twelve", "11:50"), ("twenty-five to four", "3:35"), ("half past two", "2:30"),
]

MOCK_L_DESTINATIONS = ["art studio", "music room", "greenhouse", "sports pavilion", "guest lounge", "repair shop", "storage shed", "info desk", "darkroom", "quiet wing", "garden shed", "exhibition hall", "workshop bay", "clubhouse"]
MOCK_L_REFERENCE = ["the clock tower", "the water fountain", "the ticket booth", "the notice wall", "the entrance arch", "the lift lobby", "the souvenir shelf", "the courtyard bench", "the bike rack", "the kiosk", "the side gate", "the stairs", "the front desk", "the news stand"]
MOCK_L_DIRWORDS = ["beside", "across from", "in front of", "behind", "to the left of", "past"]

MOCK_L_REASONS = [
    ("the venue flooded", "The venue flooded"),
    ("the tutor fell ill", "The tutor fell ill"),
    ("the venue was double-booked", "The venue was double-booked"),
    ("student feedback was split", "Student feedback was split"),
    ("the equipment shipment was delayed", "The equipment shipment was delayed"),
    ("the timetable was reworked", "The timetable was reworked"),
    ("the speakers were unavailable", "The speakers were unavailable"),
    ("the group size doubled", "The group size doubled"),
    ("the roof was under repair", "The roof was under repair"),
    ("the budget was cut again", "The budget was cut again"),
]

MOCK_L_VENUES = ["the lecture", "the tasting", "the rehearsal", "the orientation", "the expo", "the masterclass", "the camp", "the briefing", "the derby", "the retreat"]

MOCK_L_TOPICS = [
    ("coral reef health", "tourist anchors", "water temperature"),
    ("municipal composting", "collection crews", "kitchen sorting"),
    ("coastal erosion", "seawall gaps", "storm frequency"),
    ("study spaces on campus", "booking slots", "opening hours"),
    ("river water quality", "farm runoff", "sewage overflow"),
    ("greywater recycling", "filter upkeep", "plumbing age"),
    ("road-safety cameras", "sign visibility", "junction design"),
    ("public park use", "dog access", "pavilion lighting"),
]

MOCK_L_NEEDED_ITEMS = ["a foldable chair", "a rain poncho", "a measuring tape", "a head torch", "a whistle", "a clip-board", "ear plugs", "a jack", "a cooler box", "a roll of tape"]

MOCK_L_PHONES = [
    "07790 118 342", "07915 773 490", "0203 887 1452", "0161 702 3341", "07843 290 618",
    "07752 461 780", "0207 662 4108", "07988 504 223", "0151 443 9067", "07811 902 554",
    "0204 390 7716", "07741 826 095", "0163 776 4201", "07966 218 473", "0174 665 2098",
]

MOCK_L_ADDRESSES = [
    "9 Birch Crescent", "61 Willow Way", "17 Elm Gardens", "38 Sycamore Road", "5 Linden Close",
    "112 Spruce Drive", "2 Hawthorn Walk", "84 Ash Grove", "26 Poplar Lane", "73 Juniper Row",
]

MOCK_L_DATES = [
    ("the third of February", "3 February"), ("the twenty-seventh of April", "27 April"),
    ("the eleventh of October", "11 October"), ("the first of November", "1 November"),
    ("the twenty-third of March", "23 March"), ("the twenty-ninth of August", "29 August"),
    ("the fifteenth of July", "15 July"), ("the eighth of September", "8 September"),
]

MOCK_L_CONCERNS = [
    ("the noisy corridor", "closing the doors"),
    ("the crowded timetable", "fewer seminars"),
    ("the short booking window", "earlier reminders"),
    ("the flickering screens", "replacing the monitors"),
    ("the cold auditorium", "extra heaters"),
    ("the slow lift", "using the stairs"),
    ("the muddy car park", "gravel surfacing"),
    ("the late newsletter", "moving it online"),
    ("the dim signage", "bigger lettering"),
    ("the stuffy hall", "opening the vents"),
    ("the long queue", "self-service kiosks"),
    ("the inconsistent wifi", "a second router"),
]

MOCK_L_FLOW_SETS = [
    ("cleaning the filter", "checking the gauge", "restarting the pump"),
    ("drawing the curtains", "adjusting the screen", "starting the film"),
    ("grinding the spices", "heating the pan", "adding the sauce"),
    ("rolling the dough", "cutting the shapes", "glazing the pastries"),
    ("loading the camera", "framing the shot", "reviewing the photo"),
    ("connecting the printer", "installing the driver", "printing a test page"),
    ("winding the clock", "setting the alarm", "checking the time"),
    ("waxing the board", "tightening the bindings", "carrying the gear"),
    ("scraping the paint", "applying the primer", "spraying the colour"),
    ("folding the seats", "lowering the table", "closing the door"),
    ("charging the battery", "inserting the card", "powering the device"),
    ("rinsing the jars", "drying the lids", "stacking the boxes"),
]

MOCK_L_MCQ_EXTRA = [
    ("the canoe trip departs at eight forty-five", "When does the canoe trip leave?", ["At ten past eight", "At eight forty-five", "At quarter past nine", "At half past nine"]),
    ("the workshop is held in the annex building", "Where is the workshop held?", ["In the main hall", "In the annex building", "In the library", "In the gym"]),
    ("entries close on the last Friday of April", "When do entries close?", ["On the first Friday", "On the last Friday of April", "On the last Friday of May", "On the fifteenth of April"]),
    ("the deposit is refunded with a valid receipt", "How is the deposit refunded?", ["With a valid receipt", "By post", "In the shop", "In vouchers"]),
    ("the morning tour lasts two hours", "How long is the morning tour?", ["An hour and a half", "Two hours", "Two and a half hours", "Three hours"]),
    ("the class is capped at fourteen students", "What is the class limit?", ["Ten students", "Fourteen students", "Sixteen students", "Twenty students"]),
    ("the bus leaves from platform three", "Which platform does the bus leave from?", ["Platform one", "Platform three", "Platform five", "Platform seven"]),
    ("the kit includes a safety vest", "What does the kit include?", ["A helmet", "A safety vest", "Gloves", "Goggles"]),
]

# ---------------------------------------------------------------------------
# Writing pools (same formats as large_bank_writing)
# ---------------------------------------------------------------------------

MOCK_W_SUBJECTS = [
    "urban tree-planting programmes", "the four-day school week", "drone delivery services",
    "community fridge schemes", "citizen science projects", "paperless offices",
    "public swimming pools", "cycling couriers", "language exchange apps",
    "municipal markets", "school kitchen gardens", "carpool platforms",
    "central heating in homes", "green walls on buildings", "outdoor cinemas",
    "repair cafés for electronics",
]

MOCK_W_OPINION = [
    "Some people believe that {subject} is a positive development, while others strongly oppose it. Discuss both views and give your own opinion.",
    "Some people argue that {subject} should be encouraged, while others claim it does more harm than good. Discuss both views and state your opinion.",
    "To what extent do you agree or disagree that {subject} brings more benefits than drawbacks?",
    "Some people think {subject} is the solution to many current problems. Others believe it creates new ones. Give your opinion.",
    "It is sometimes argued that {subject} should be restricted. Do you agree or disagree with this statement?",
    "How far do you agree that {topic} should be expanded in the coming decade?",
    "Some hold that {topic} is inevitable. Do you agree that it should be embraced rather than resisted?",
    "Discuss whether the growth of {topic} is mainly beneficial or mainly harmful, and give your position.",
]

MOCK_W_DISCUSSION = [
    "Some people think {topic} has a positive effect on modern life, while others believe it is mostly negative. Discuss both sides.",
    "While some support {topic}, others consider it harmful. Discuss both perspectives and why each may hold this view.",
    "Some people favour the growth of {topic}; others are concerned about its consequences. Discuss both viewpoints.",
    "There is debate about whether {topic} helps or hinders society. Discuss both sides of this argument.",
    "People disagree about the value of {topic}. Present the arguments on each side and conclude.",
    "Some commentators claim {topic} brings people together; others say it creates conflict. Examine both views.",
    "Is {topic} considered by some as progress and by others as a threat? Discuss the two positions.",
]

MOCK_W_ADD = [
    "What are the advantages and disadvantages of {topic}?",
    "Some people think {topic} brings mainly benefits. Discuss the advantages and possible disadvantages.",
    "Should {topic} be developed or limited? Discuss the advantages and disadvantages.",
    "Outline the benefits and drawbacks associated with the spread of {topic}.",
    "Discuss both the positive and negative sides of {topic} and say which you find stronger.",
    "Weigh the advantages against the risks of {topic}. Which should guide policy, and why?",
    "Examine what individuals gain and lose as {topic} becomes normal.",
    "Evaluate the benefits of {topic} against the problems it may create for communities.",
]

MOCK_W_PROBSOL = [
    "What are the causes of problems linked to {topic}, and what solutions can you suggest?",
    "Explain the main issue behind {topic} and propose solutions that governments or individuals could take.",
    "What problems does {topic} present, and how can they be solved?",
    "What do you see as the key problems created by {topic}, and who should act first to solve them?",
    "Identify the difficulties {topic} raises for ordinary people and suggest practical ways to reduce them.",
    "Analyse the reasons why {topic} creates difficulties and evaluate the most effective remedies.",
    "What steps should be taken to address the issues surrounding {topic}, and who is responsible?",
]

MOCK_W_DOUBLE = [
    "Why has {topic} become more common in recent years, and is this a positive or negative development?",
    "What has made {topic} so popular today, and what should happen next?",
    "Explain why {topic} is growing in importance, and discuss whether this trend is welcome.",
    "Why is {topic} now a frequent topic of discussion, and what does the future hold for it?",
    "What has caused the recent rise of {topic}, and how should society respond?",
    "Why are more people paying attention to {topic}, and what are the likely consequences?",
    "What explains the growing interest in {topic}, and is this attention justified?",
]

MOCK_W_MIXED = [
    "Some people think {topic} is a positive development while others disagree. Discuss both views, give your own opinion, and suggest how society should respond to its spread.",
    "Some argue that {topic} should be encouraged, while others believe it causes serious problems. Discuss both sides, state your position, and outline the most effective solutions.",
    "People hold conflicting views about the effects of {topic}. Compare the main arguments on each side, give your opinion, and explain what should be done about any problems it creates.",
    "{topic} has both supporters and critics. Examine the advantages and disadvantages, then decide whether its benefits outweigh the risks, and suggest how any drawbacks could be reduced.",
    "While some celebrate {topic}, others call for greater regulation. Discuss the arguments for and against, give your own view, and propose measures that could address the concerns.",
    "There is ongoing debate about {topic}. Discuss the views of its supporters and critics, state your own position, and explain what steps individuals or governments could take in response.",
    "Opinions are divided over {topic}. Outline the main arguments on each side, say whether you agree with its promotion, and recommend practical ways to manage any negative consequences.",
]

MOCK_W_CHART_TOPICS = [
    ("Coffee shop orders by category", ["Espresso", "Filter", "Cold drinks", "Cakes", "Sandwiches", "Loyalty cards"]),
    ("Rainfall by district", ["North", "South", "East", "West", "Centre", "Hills"]),
    ("Tyres recycled by type", ["Cars", "Buses", "Trucks", "Bicycles", "Tractors", "Scooters"]),
    ("Weekend train departures", ["Friday", "Saturday", "Sunday", "Monday"]),
    ("Fish landed at coastal ports", ["Haddock", "Mackerel", "Sole", "Sardines", "Crab", "Lobster"]),
    ("Office lighting costs by floor", ["Ground", "First", "Second", "Third", "Fourth", "Basement"]),
    ("Concert tickets sold by genre", ["Rock", "Jazz", "Classical", "Pop", "Folk", "Electronic"]),
    ("Parcel deliveries by month", ["January", "April", "July", "October"]),
    ("Hospital visits by department", ["Accident", "Outpatients", "Dental", "Eye", "Physiotherapy", "Pharmacy"]),
    ("Farm employment by season", ["Spring", "Summer", "Autumn", "Winter"]),
    ("Scooter rentals by district", ["Old town", "Harbour", "Campus", "Station", "Park", "Suburbs"]),
    ("Museum visitors by exhibition", ["Dinosaurs", "Space", "Ancient", "Modern art", "Robots", "Photography"]),
]

MOCK_W_CHART_LOCATIONS = ["a river city", "an industrial town", "an island capital", "a hill region", "a coastal county", "a lake district", "a frontier town", "a farming valley", "a port quarter", "a university city"]
MOCK_W_CHART_YEARS = ["2008-2014", "2009-2015", "2011-2017", "2013-2019", "2014-2020", "2016-2022", "2018-2024", "2020-2026"]
MOCK_W_CHART_UNITS = ["share of total", "visits per month", "kilogrammes", "hours per week", "gigawatts", "thousand litres", "journeys per day", "boxes per season"]

MOCK_W_PROCESS_POOL = [
    ("oolong tea making", ["Plucking leaves", "Withering", "Shaking and bruising", "Partial oxidation", "Firing", "Rolling and drying"]),
    ("oyster farming", ["Seed collection", "Nursery trays", "Rope hanging", "Growing years", "Harvesting", "Shucking and packing"]),
    ("mango jam production", ["Fruit washing", "Peeling and stoning", "Cooking with sugar", "Reaching setting point", "Hot filling", "Sealing and cooling"]),
    ("aquarium water filtration", ["Water intake", "Mechanical filter", "Biological media", "UV treatment", "Return pump", "Display tank"]),
    ("metal cabinet manufacturing", ["Sheet cutting", "Bending", "Welding", "Painting", "Drying", "Hardware fitting"]),
    ("neon sign making", ["Tube bending", "Gas filling", "Electrode sealing", "Testing", "Mounting", "Installation"]),
    ("coconut oil pressing", ["Coconut husking", "Meat grating", "Drying", "Cold pressing", "Filtering", "Bottling"]),
    ("rubber boot production", ["Material mixing", "Sheet rolling", "Mould pressing", "Vulcanising", "Trimming", "Quality stamping"]),
    ("sustainable fish feed plant", ["Insect rearing", "Harvesting larvae", "Drying", "Grinding", "Blending with grain", "Pellet forming"]),
    ("lemonade bottling line", ["Lemon washing", "Juice extraction", "Syrup mixing", "Carbonating", "Filling", "Capping and labelling"]),
    ("carpet weaving workshop", ["Wool sorting", "Spinning", "Dyeing", "Warp setting", "Hand weaving", "Trimming and washing"]),
    ("bamboo furniture making", ["Culm cutting", "Splitting", "Steam bending", "Joining", "Sanding", "Lacquering"]),
]

MOCK_W_MAP_POOL = [
    ("map of a docklands redevelopment", ["Old warehouses", "Marina village", "Promenade cafes", "Apartment blocks", "Ferry pier", "Linear park"]),
    ("map of a zoo expansion", ["Entry plaza", "Primate house", "Reptile hall", "Safari bus stop", "Children's farm", "Lake walk"]),
    ("map of a market town centre", ["Market square", "Guildhall", "Craft arcade", "Bus interchange", "Museum quarter", "Garden terrace"]),
    ("map of a riverside hotel", ["Lobby", "Restaurant", "Pool terrace", "Conference wing", "Rooms block", "Riverside garden"]),
    ("map of a science museum", ["Entrance atrium", "Physics gallery", "Planetarium", "Workshop lab", "Cafeteria", "Rooftop observatory"]),
    ("map of a vineyard estate", ["Cellar door", "Tasting room", "Vineyard rows", "Press house", "Barrel hall", "Picnic orchard"]),
    ("map of a marina expansion", ["Existing basin", "New pontoons", "Fuel jetty", "Sail loft", "Chandlery store", "Café deck"]),
    ("map of a cultural quarter", ["Theatre foyer", "Concert hall", "Art gallery", "Dance studios", "Piazza", "Bookshop arcade"]),
    ("map of a farm park", ["Farmhouse", "Dairy parlour", "Paddocks", "Ford crossing", "Play barn", "Woodland trail"]),
    ("map of a rail station quarter", ["Station hall", "Bus forecourt", "Cycle hub", "Retail wing", "Hotel block", "Garden square"]),
    ("map of a bird sanctuary", ["Visitor centre", "Reed beds", "Hide A", "Hide B", "Boardwalk", "Meadow pools"]),
    ("map of a castle grounds", ["Gatehouse", "Keep", "Chapel", "Walled garden", "Guard house", "Outer bailey"]),
]

MOCK_W_DIAGRAM_POOL = [
    ("a desalination plant produces drinking water", ["Seawater intake", "Pre-treatment", "Reverse osmosis", "Mineral dosing", "Storage tank", "Supply mains"]),
    ("a heat pump dries clothes", ["Moist air intake", "Refrigerant coils", "Compressor", "Condenser", "Water tank", "Dry air outlet"]),
    ("a compost bin processes kitchen waste", ["Lid", "Brown layer", "Green layer", "Air vents", "Worm chamber", "Collection tray"]),
    ("a water wheel generates power", ["River flow", "Paddle wheel", "Axle", "Gearbox", "Generator", "Transmission line"]),
    ("a sump pump guards a basement", ["Water channel", "Sump pit", "Float switch", "Pump motor", "Discharge pipe", "Garden outlet"]),
    ("a balcony solar panel charges a scooter", ["Solar tile", "Charge controller", "Battery pack", "Scooter port", "Display meter", "Grid backup"]),
    ("a kebab-shaped BBQ smoker cooks meat", ["Firebox", "Smoke chamber", "Drip tray", "Grates", "Thermometer", "Chimney"]),
    ("a fountain recirculates water", ["Reservoir", "Pump", "Riser pipe", "Top basin", "Overflow channel", "Filter"]),
    ("a greenhouse drip system waters plants", ["Rain barrel", "Filter", "Main line", "Drip emitters", "Soil sensors", "Overflow drain"]),
    ("a paper shredder processes waste", ["Paper feed", "Cutting blades", "Motor drive", "Bin sensor", "Waste bin", "Safety stop"]),
    ("a pedal generator powers a lamp", ["Pedals", "Chain drive", "Flywheel", "Generator", "Rectifier", "LED lamp"]),
    ("a water cooler chills bottles", ["Bottle rack", "Pre-cool chamber", "Cooling coils", "Compressor", "Dispenser tap", "Drip tray"]),
]

# ---------------------------------------------------------------------------
# Speaking pools (same formats as large_bank_speaking). Category names in
# mock_papers selection logic are preserved: Personal Information (P1) and
# Reasons / Causes + Opinion (P3 follow-up lanes).
# ---------------------------------------------------------------------------

MOCK_S1 = [
    ('Personal Information', [
        'What is your full name?',
        'Where do you come from?',
        'What is your favourite thing about the place you come from?',
        'How often do you see your family?',
        'Who do you live with at the moment?',
        'What job would your parents like you to do?',
        'Are you an early riser or a night owl?',
        'How do you usually start your day?',
        'What do you do to relax after a long day?',
        'Is your room tidy most of the time?',
        'What do you keep on your desk?',
        'How much time do you spend looking at screens?',
        'Do you prefer talking on the phone or texting?',
        'What was the last thing you bought for yourself?',
        'Do you like trying new things or sticking to habits?',
        'What makes you feel proud?',
        'How has your life changed in the last five years?',
        'What are you looking forward to this month?',
    ]),
    ('Umbrellas & Rain', [
        'Do you always carry an umbrella?',
        'Has anyone ever borrowed your umbrella and not returned it?',
        'Are umbrellas considered good gifts in your country?',
        'What do people do in your country when it rains heavily?',
        'Is rain important for your region?',
        'Do you enjoy the sound of rain?',
        'Would you rather walk or take a taxi in the rain?',
        'Do children in your country play outside when it rains?',
        'Why do some people dislike rainy weather?',
        'How do heavy rains affect daily life where you live?',
        'Do you check weather forecasts every morning?',
        'Which season brings the most rain to your area?',
        'Are there any traditional songs about rain in your culture?',
        'What would you do on a rainy weekend?',
        'Is rain good for farming in your country?',
        'Do you take photos in the rain?',
        'How do you dry your clothes in wet weather?',
        'What can cities do to prepare for heavy rainfall?',
    ]),
    ('Numbers & Counting', [
        'Which numbers are lucky in your country?',
        'Can you remember phone numbers easily?',
        'Do you keep track of how much you spend each week?',
        'Is there a number that is considered unlucky where you live?',
        'Did you enjoy maths at school?',
        'How often do you need to do calculations in daily life?',
        'Do you count things like steps or coins out of habit?',
        'What uses numbers for important dates in your culture?',
        'Can you do mental maths quickly?',
        'Do you prefer prices ending in whole numbers?',
        'How important are numbers in sports?',
        'Do you play any number games?',
        'What big numbers are people impressed by?',
        'Are birthdays more special at certain ages in your country?',
        'Do you measure things when you cook?',
        'How do you remember your own accounts and passwords?',
        'What would life be like without numbers?',
        'Do old people and young people use numbers differently?',
    ]),
    ('Keys & Locks', [
        'Which keys do you carry every day?',
        'Have you ever lost your keys?',
        'Do you prefer keys or keypads on doors?',
        'What do people usually lock in your country?',
        'Are there things in your home that you would never leave unlocked?',
        'How do you find your keys in the morning?',
        'Would you ever use a smart lock on your phone?',
        'Do children need their own keys where you live?',
        'Why do some people keep spare keys with neighbours?',
        'What items are kept in a safe at home?',
        'Do hotels still use physical keys in your country?',
        'How do road or building workers use keys in their jobs?',
        'Is losing a key a big problem for you?',
        'Are there locks that confused you the first time?',
        'What do you do before leaving the house?',
        'Do libraries or gyms in your country use lockers?',
        'Would you like a door that opens automatically?',
        'What makes a lock secure?',
    ]),
    ('Postcards & Letters', [
        'When did you last write a letter?',
        'Do you keep postcards from trips?',
        'Are handwritten letters better than emails?',
        'Who would you like to receive a letter from?',
        'Did your grandparents write many letters?',
        'Do post offices matter in your country today?',
        'What do people send instead of letters nowadays?',
        'Would you send a postcard from a dream holiday?',
        'Are stamps collected as a hobby in your country?',
        'How long does a letter take to arrive where you live?',
        'Do you pass notes at work or school?',
        'What messages are better in writing?',
        'Have you ever received a surprise letter?',
        'Do invitations still come in the mail?',
        'Is handwriting becoming a lost skill?',
        'What would you write in a letter to your future self?',
        'Why do some people prefer digital cards?',
        'Should schools still teach letter writing?',
    ]),
    ('Mirrors', [
        'How often do you look in a mirror during the day?',
        'Why do people put mirrors near entrances?',
        'Are mirrors important for trying on clothes?',
        'Do you have a favourite mirror in your home?',
        'Why are some people uncomfortable seeing themselves on camera?',
        'Are there traditional uses of mirrors in your culture?',
        'How do mirrors make small rooms feel bigger?',
        'Do you use a mirror when you exercise?',
        'What would change if mirrors were banned?',
        'Can mirrors help people practise presentations?',
        'Why do dancers use full-length mirrors?',
        'Have mirrors always been expensive?',
        'Do you clean your mirrors often?',
        'What do people check in a mirror before leaving home?',
        'Is a mirror a good gift idea?',
        'How do shops use mirrors?',
        'Do you trust mirror reflections more than photos?',
        'Why do some cultures cover mirrors after a loss?',
    ]),
    ('Stairs & Lifts', [
        'Do you take the stairs or the lift more often?',
        'Are stairs good for your health?',
        'Do buildings in your country always have both?',
        'Have you ever been stuck in a lift?',
        'Why do some people avoid lifts?',
        'Are escalators common in your city?',
        'What makes stairs dangerous?',
        'Do you count steps when you climb?',
        'Which public places have the busiest lifts?',
        'How do people with heavy luggage manage?',
        'Are there buildings with famous staircases in your country?',
        'Would you live on a very high floor?',
        'Do children find stairs fun?',
        'Is it better to live in a building with a lift?',
        'How often do lifts need repair where you live?',
        'Why do fire drills use stairs rather than lifts?',
        'What would a world without stairs be like?',
        'Do stairs help with daily exercise?',
    ]),
]

MOCK_S2_CARDS = {
    "person": [
        "a teacher who changed the way you think", "a neighbour you remember well", "a colleague you enjoy working with",
        "a relative you admire", "a friend you have known for a long time", "a person from history you would like to meet",
        "a famous athlete from your country", "a person who helped you when you needed it",
    ],
    "place": [
        "a quiet corner where you like to study", "a street market you visit often", "a building with interesting architecture",
        "a park you loved as a child", "a library or reading room you enjoy", "a restaurant you always recommend",
        "a place near water you have visited", "a village or neighbourhood you know well",
    ],
    "object": [
        "a device you could not live without", "a piece of clothing you are attached to", "a keepsake from a trip",
        "an item your family has kept for years", "a tool you use for a hobby", "a gift you received recently",
        "something in your room you would save first", "a book that changed something for you",
    ],
    "event": [
        "a celebration that went exactly right", "a day when everything went wrong", "a trip you remember in detail",
        "a time you had to speak in public", "a sporting event you watched", "a concert or performance you enjoyed",
        "an occasion when you helped someone", "a moment when you felt proud",
    ],
    "activity": [
        "a hobby you started in the last year", "an activity you do with friends", "a sport you watch but do not play",
        "something you do every weekend", "a skill you taught yourself", "an outdoor activity you love",
        "a team activity you take part in", "an activity that helps you concentrate",
    ],
    "future": [
        "a skill you want to learn", "a city you want to live in", "a goal you want to reach in five years",
        "a country you want to visit", "something you want to give up", "a course you want to take",
        "a place you want to see again", "a way you want to help your community",
    ],
}

MOCK_S2_BULLETS = {
    "person": [
        ("who this person is", "how you first met them", "what they are like", "why you chose this person"),
        ("who they are", "how long you have known them", "what you do together", "how they have influenced you"),
        ("who it is", "when you last met them", "what makes them special", "how you feel about them"),
        ("who they are", "where they live", "what kind of person they are", "what you would ask them"),
        ("who this person is", "how often you see them", "what qualities they have", "why you admire them"),
    ],
    "place": [
        ("where this place is", "how often you go there", "what you do there", "why you like it"),
        ("what it looks like", "who goes there with you", "what you did there", "why it matters to you"),
        ("where it is", "when you first went there", "what happens there", "why you would recommend it"),
        ("what kind of place it is", "who you went with", "what stands out about it", "how it makes you feel"),
        ("where you found it", "how you get there", "what you enjoy most", "why you keep returning"),
    ],
    "object": [
        ("what it is", "when and where you got it", "what it looks like", "why it is important to you"),
        ("what it is used for", "how often you use it", "what you like about it", "why it is so useful"),
        ("what it is", "who gave it to you", "what makes it special", "why you would keep it forever"),
        ("what it looks like", "where you keep it", "who else uses it", "what memories it brings back"),
        ("what it is", "how much it cost", "what it does", "why you chose it"),
    ],
    "event": [
        ("what the event was", "when it happened", "who was there", "why it was memorable"),
        ("what happened", "where it took place", "how you prepared", "how you felt afterwards"),
        ("what the occasion was", "who organised it", "what happened during it", "why it stands out"),
        ("what you did", "when it happened", "who was with you", "what you learned from it"),
        ("what the event was", "how it started", "what went well", "why you would repeat it"),
    ],
    "activity": [
        ("what the activity is", "when you do it", "who you do it with", "why you enjoy it"),
        ("how you started it", "where you do it", "what it involves", "what it gives you"),
        ("what it is", "how often you do it", "what you need for it", "why it relaxes you"),
        ("what you do", "where you learned it", "what it costs", "why you keep doing it"),
        ("what the activity is", "who taught you", "what you are good at now", "what you still want to improve"),
    ],
    "future": [
        ("what it is", "why you want to do it", "why now", "what the first step would be"),
        ("what you plan to do", "when you want it to happen", "what you need to prepare", "how it would change your life"),
        ("what it is", "who would help you", "what could delay it", "how likely it is to happen"),
        ("what you hope for", "why it matters", "what might get in the way", "what you would do when it happens"),
        ("what it is", "where it would happen", "who might be involved", "why you feel confident about it"),
    ],
}

MOCK_S3 = [
    ('Reasons / Causes', [
        'Why do you think so many people move to big cities?',
        'What makes some places feel welcoming to visitors?',
        'Why do teenagers often disagree with their parents?',
        'What causes people to give up a hobby?',
        'Why has online learning become so common?',
        'Why do some people prefer cash to cards?',
        'What helps people feel safe in the area where they live?',
        'Why are some foods more popular than others?',
        'What causes stress in modern workplaces?',
        'Why do countries invest in sport?',
        'What makes some songs stay popular for decades?',
        'Why do people collect things?',
        'What causes traffic problems in your country?',
        'Why are small shops disappearing?',
    ]),
    ('Opinion', [
        'Do you agree that schools should teach financial skills?',
        'Some say public art is a waste of money. What is your view?',
        'Is it better to own a home or to rent?',
        'Should governments limit screen time for children?',
        'Are museums still necessary in the digital age?',
        'Do you think tourism harms or helps local culture?',
        'Should public transport be free?',
        'Is it fair that celebrities are paid so much?',
        'Do you believe homework is necessary?',
        'Should people be allowed to work after sixty-five?',
        'Are paper books better than e-books?',
        'Do you agree that cities need more green space?',
        'Should sports stars be good role models?',
        'Is advertising for children acceptable?',
    ]),
    ('Learning & Memory', [
        'Why do people forget things they learned at school?',
        'What is the best age to learn a new language?',
        'How has technology changed the way people memorise things?',
        'Why do some people learn faster than others?',
        'Do old people and young people learn differently?',
        'How important is memory in daily life?',
        'Why do people forget names so easily?',
        'Should schools teach study skills explicitly?',
    ]),
    ('Culture & Tradition', [
        'Why do traditions change over time?',
        'Is it important to keep old festivals alive?',
        'How does food define a culture?',
        'Why do young people care less about traditional dress?',
        'Can costumes and music attract tourists?',
        'What happens when cultures borrow from each other?',
        'Should governments fund cultural festivals?',
        'Why do some customs disappear and others survive?',
    ]),
    ('Work & Careers', [
        'Why do some jobs command higher salaries?',
        'Is job satisfaction more important than pay?',
        'How will automation change future careers?',
        'Why do people change jobs more often today?',
        'Should young people choose careers by passion or income?',
        'What makes a good employer?',
        'Do part-time jobs benefit students?',
        'Why are some skills so hard to learn alone?',
    ]),
    ('Cities & Living', [
        'Why are housing costs rising so quickly?',
        'What makes a city attractive to young people?',
        'Are suburbs better than city centres for families?',
        'How can cities reduce pollution?',
        'Why do some cities feel more liveable than others?',
        'Should historic buildings be protected at any cost?',
        'What problems do large cities share?',
        'Why do people stay in crowded cities?',
    ]),
    ('Health & Habits', [
        'Why do healthy habits rarely stick?',
        'Should exercise be part of the school day?',
        'Why is sleep still undervalued?',
        'How do eating habits differ between generations?',
        'Do governments do enough to encourage walking?',
        'Why is mental health talked about more today?',
        'Should healthy food cost less?',
        'What role do families play in healthy habits?',
    ]),
    ('Media & Screens', [
        'Why do people trust online reviews?',
        'Is social media making people lonelier?',
        'How has video changed news reporting?',
        'Why do some videos go viral?',
        'Should screen time be limited for adults too?',
        'Do platforms shape what people believe?',
        'Why do people still watch live television?',
        'What are the risks of quick online content?',
    ]),
]

# ---------------------------------------------------------------------------
# Instantiation
# ---------------------------------------------------------------------------


def _load_bank(skill: str, pools: dict[str, Any], target: int, seeds: dict[str, int]) -> tuple[list[Item], dict[str, list[Item]]]:
    """Instantiate the matching large_bank_<skill> generator in isolation,
    swap its content pools, reset its state and rebuild it from scratch."""
    path = _Path(__file__).resolve().parent / f"large_bank_{skill}.py"
    spec = _ilu.spec_from_file_location(f"large_mock_{skill}", str(path))
    mod = _ilu.module_from_spec(spec)
    spec.loader.exec_module(mod)
    for key, value in pools.items():
        setattr(mod, key, value)
    mod._TARGET = target
    mod._bank = []
    mod._used = set()
    mod._ids = 0
    if hasattr(mod, "_chart_ids"):
        mod._chart_ids = 0
    if hasattr(mod, "_chart_used_titles"):
        mod._chart_used_titles = set()
    if hasattr(mod, "_facts"):
        mod._facts = [(topic, s, v) for topic, facts in mod.R_FACTS for (s, v) in facts]
        mod._all_sentences = [s for _, facts in mod.R_FACTS for (s, _) in facts]
        mod._all_values = [v for _, facts in mod.R_FACTS for (_, v) in facts]
    if hasattr(mod, "_random"):
        mod._random = random.Random(seeds.get("_random", 23))
    if hasattr(mod, "_rnd"):
        mod._rnd = random.Random(seeds.get("_rnd", 17))
    bank = mod.build()
    by_type: dict[str, list[Item]] = {}
    for item in bank:
        by_type.setdefault(item.get("typeLabel") or item.get("type") or "type", []).append(item)
    return bank, by_type


_MOCK_READING_BANK, _MOCK_READING_BY_TYPE = _load_bank(
    "reading",
    {"R_FACTS": MOCK_R_FACTS},
    target=80,
    seeds={"_random": 23},
)

_MOCK_LISTENING_BANK, _MOCK_LISTENING_BY_TYPE = _load_bank(
    "listening",
    {
        "_NAMES": MOCK_L_NAMES,
        "_ITEMS": MOCK_L_ITEMS,
        "_OPENERS": MOCK_L_OPENERS,
        "_TIMEPHRASE": MOCK_L_TIMEPHRASE,
        "_DESTINATIONS": MOCK_L_DESTINATIONS,
        "_REFERENCE": MOCK_L_REFERENCE,
        "_DIRWORDS": MOCK_L_DIRWORDS,
        "_REASONS": MOCK_L_REASONS,
        "_VENUES": MOCK_L_VENUES,
        "_TOPICS": MOCK_L_TOPICS,
        "_NEEDED_ITEMS": MOCK_L_NEEDED_ITEMS,
        "_PHONES": MOCK_L_PHONES,
        "_ADDRESSES": MOCK_L_ADDRESSES,
        "_DATES": MOCK_L_DATES,
        "_CONCERNS": MOCK_L_CONCERNS,
        "_MCQ_EXTRA": MOCK_L_MCQ_EXTRA,
        "_FLOW_SETS": MOCK_L_FLOW_SETS,
    },
    target=80,
    seeds={},
)

_MOCK_WRITING_BANK, _MOCK_WRITING_BY_TYPE = _load_bank(
    "writing",
    {
        "_SUBJECTS": MOCK_W_SUBJECTS,
        "_OPINION": MOCK_W_OPINION,
        "_DISCUSSION": MOCK_W_DISCUSSION,
        "_ADD": MOCK_W_ADD,
        "_PROBSOL": MOCK_W_PROBSOL,
        "_DOUBLE": MOCK_W_DOUBLE,
        "_MIXED": MOCK_W_MIXED,
        "_CHART_TOPICS": MOCK_W_CHART_TOPICS,
        "_CHART_LOCATIONS": MOCK_W_CHART_LOCATIONS,
        "_CHART_YEARS": MOCK_W_CHART_YEARS,
        "_CHART_UNITS": MOCK_W_CHART_UNITS,
        "_PROCESS_POOL": MOCK_W_PROCESS_POOL,
        "_MAP_POOL": MOCK_W_MAP_POOL,
        "_DIAGRAM_POOL": MOCK_W_DIAGRAM_POOL,
    },
    target=40,
    seeds={"_rnd": 17},
)

_MOCK_SPEAKING_BANK, _MOCK_SPEAKING_BY_TYPE = _load_bank(
    "speaking",
    {
        "_P1": MOCK_S1,
        "_P2_CARDS": MOCK_S2_CARDS,
        "_P2_BULLETS": MOCK_S2_BULLETS,
        "_P3": MOCK_S3,
    },
    target=1,
    seeds={},
)

MOCK_SPEAKING_BY_TYPE: dict[str, list[Item]] = _MOCK_SPEAKING_BY_TYPE

MOCK_SPEAKING_OFFICIAL_LABELS: dict[str, str] = {
    "Part 1 \u2014 Introduction & Interview (personal questions)": "Part 1",
    "Part 2 \u2014 Cue Card / Individual Long Turn": "Part 2",
    "Part 3 \u2014 Discussion (abstract questions)": "Part 3",
}
for _official, _short in MOCK_SPEAKING_OFFICIAL_LABELS.items():
    MOCK_SPEAKING_BY_TYPE[_official] = list(MOCK_SPEAKING_BY_TYPE.get(_short, []))

MOCK_LARGE_BANK: dict[str, list[Item]] = {
    "reading": _MOCK_READING_BANK,
    "listening": _MOCK_LISTENING_BANK,
    "writing": _MOCK_WRITING_BANK,
    "speaking": _MOCK_SPEAKING_BANK,
}

MOCK_LARGE_BY_TYPE: dict[str, dict[str, list[Item]]] = {
    "reading": _MOCK_READING_BY_TYPE,
    "listening": _MOCK_LISTENING_BY_TYPE,
    "writing": _MOCK_WRITING_BY_TYPE,
    "speaking": _MOCK_SPEAKING_BY_TYPE,
}