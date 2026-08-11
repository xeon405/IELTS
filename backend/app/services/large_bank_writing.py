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
    ("Task 1 Charts & Graphs", "essay"),
    ("Task 1 Tables", "essay"),
    ("Task 1 Mixed Charts", "essay"),
    ("Task 1 Process", "essay"),
    ("Task 1 Maps / Plans", "essay"),
    ("Task 1 Diagrams", "essay"),
    ("Task 2 Opinion", "essay"),
    ("Task 2 Discussion", "essay"),
    ("Task 2 Advantages / Disadvantages", "essay"),
    ("Task 2 Problem / Solution", "essay"),
    ("Task 2 Double Question", "essay"),
    ("Task 2 Mixed / Combined Question", "essay"),
]

_TIPS = {
    "Task 1 Charts & Graphs": ["Start with an overview; never list every number.", "Group the data (highest, lowest, trends).", "Compare, using language like 'whereas' and 'three times'."],
    "Task 1 Tables": ["Group rows (totals, highest/lowest) into 2-3 body paragraphs.", "Report the biggest and smallest values first.", "Compare across rows, never list every cell."],
    "Task 1 Mixed Charts": ["Describe each visual separately, then compare across both.", "One overview must cover both charts.", "Balance the paragraphs evenly between the two visuals."],
    "Task 1 Process": ["Describe the sequence in order with linking steps.", "Use the passive voice for machine processes.", "Keep the description neutral; no opinion."],
    "Task 1 Maps / Plans": ["Mention both time periods and how things changed.", "Use location phrases (north of, opposite, adjacent to).", "Keep the description neutral; no opinion."],
    "Task 1 Diagrams": ["Describe the object's components and how it works.", "Order the description by location, not time.", "Keep the explanation neutral; no opinion."],
    "Task 2 Opinion": ["State your position clearly in the introduction.", "Support every claim with a reason and example.", "Finish by restating your view."],
    "Task 2 Discussion": ["Discuss both views fairly in separate paragraphs.", "Aim for a balanced conclusion with your own opinion.", "Introduce each side with a topic sentence."],
    "Task 2 Advantages / Disadvantages": ["Cover BOTH sides, then a reasoned conclusion.", "Use 'On the one hand... On the other hand...'.", "Give one developed example per side."],
    "Task 2 Problem / Solution": ["Answer the two-part question fully.", "Link each solution to its cause.", "Use conditionals: 'If governments invest...'."],
    "Task 2 Double Question": ["Answer BOTH sub-questions in separate paragraphs.", "Use one clear position for the opinion question.", "Check each paragraph answers its assigned question."],
    "Task 2 Mixed / Combined Question": ["Map every clause of the prompt to a paragraph.", "Discuss views AND give your opinion AND propose solutions.", "Connect the parts in the conclusion."],
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
_MIXED = [
    "Some people think {topic} is a positive development while others disagree. Discuss both views, give your own opinion, and suggest how society should respond to its spread.",
    "Some argue that {topic} should be encouraged, while others believe it causes serious problems. Discuss both sides, state your position, and outline the most effective solutions.",
    "People hold conflicting views about the effects of {topic}. Compare the main arguments on each side, give your opinion, and explain what should be done about any problems it creates.",
    "{topic} has both supporters and critics. Examine the advantages and disadvantages, then decide whether its benefits outweigh the risks, and suggest how any drawbacks could be reduced.",
    "While some celebrate {topic}, others call for greater regulation. Discuss the arguments for and against, give your own view, and propose measures that could address the concerns.",
    "There is ongoing debate about {topic}. Discuss the views of its supporters and critics, state your own position, and explain what steps individuals or governments could take in response.",
    "Opinions are divided over {topic}. Outline the main arguments on each side, say whether you agree with its promotion, and recommend practical ways to manage any negative consequences.",
    "Public reactions to {topic} range widely from enthusiasm to alarm. Discuss the reasons behind both positions, give your own judgement, and describe how policymakers should balance the benefits and risks.",
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
    ("Online food delivery orders", ["Pizza", "Burgers", "Salads", "Sushi", "Curry", "Desserts"]),
    ("Books borrowed by genre", ["Fiction", "Thrillers", "Biography", "Science", "Cookery", "Children"]),
    ("Phone brand market share", ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E", "Other"]),
    ("Foreign visitors by entry type", ["Air", "Sea", "Rail", "Road", "Ferry", "Cruise"]),
    ("Pet ownership by type", ["Dogs", "Cats", "Fish", "Birds", "Reptiles", "Hamsters"]),
    ("Advertising spend by channel", ["Television", "Radio", "Press", "Online", "Billboard", "Cinema"]),
    ("Energy bills by type of home", ["Flat", "Semi-detached", "Detached", "Terraced", "Bungalow", "Apartment"]),
    ("Mobile data use by activity", ["Streaming", "Social media", "Games", "Browsing", "Email", "Maps"]),
    ("Volunteer hours by cause", ["Environment", "Education", "Health", "Housing", "Food banks", "Youth"]),
    ("Car sales by fuel type", ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "Hydrogen"]),
    ("Tourists by accommodation", ["Hotels", "B&Bs", "Hostels", "Apartments", "Camping", "Friends"]),
    ("Crop yield by region", ["Wheat", "Barley", "Maize", "Rice", "Oats", "Soy"]),
    ("Complaints by reason type", ["Delivery", "Billing", "Quality", "Returns", "App", "Service"]),
    ("New firms registered by sector", ["Retail", "Tech", "Food", "Finance", "Construction", "Logistics"]),
    ("Cinema attendance by film genre", ["Action", "Comedy", "Drama", "Horror", "Documentary", "Animation"]),
    ("Gym membership by age", ["Under 18", "18-30", "31-45", "46-60", "61-75", "75+"]),
    ("Bicycle hire by season", ["Spring", "Summer", "Autumn", "Winter"]),
    ("Municipal events attendance", ["Concerts", "Markets", "Sports", "Parades", "Exhibitions", "Workshops"]),
    ("Household recycling rates", ["Plastic", "Paper", "Glass", "Metals", "Organic", "Textiles"]),
    ("Small business export destinations", ["EU", "Asia", "USA", "Middle East", "Africa", "Australia"]),
    ("Energy use in public buildings", ["Heating", "Lighting", "Catering", "IT", "Lifts", "Pumps"]),
    ("Passenger numbers on coastal ferries", ["Weekday", "Weekend"]),
    ("Sugar-free drink sales", ["Cola", "Lemonade", "Tea", "Sparkling water", "Juice", "Energy drinks"]),
]

_CHART_LOCATIONS = ["a capital city", "a coastal town", "an island region", "a university", "a manufacturing region", "an industrial district", "a farming community", "a port city", "a mountain region", "a border town", "a historic market town", "a university town", "a seaside resort", "a riverside district", "a suburban county"]
_CHART_YEARS = ["2015-2021", "2016-2022", "2017-2023", "2018-2024", "2019-2025", "2014-2020", "2012-2019", "2010-2018", "2005-2015", "2020-2025"]
_CHART_UNITS = ["percentage of total", "number of people", "tonnes", "hours per month", "megawatts", "thousand units", "household share", "flights per month"]

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
    ("tea processing", ["Withering", "Rolling", "Oxidation", "Drying", "Sorting", "Packing"]),
    ("bamboo flooring production", ["Cutting culms", "Splitting", "Boiling", "Pressing", "Sanding", "Varnishing"]),
    ("biogas production from waste", ["Waste collection", "Shredding", "Digester filling", "Gas capture", "Purification", "Storage and use"]),
    ("perfume manufacturing", ["Plant harvesting", "Steam extraction", "Oil separation", "Blending", "Ageing", "Bottling"]),
    ("natural rubber harvesting", ["Tapping trees", "Latex collection", "Coagulation", "Washing", "Rolling sheets", "Smoking"]),
    ("cotton fabric production", ["Ginnings", "Sawing", "Carding", "Spinning", "Weaving", "Finishing"]),
    ("canned tuna production", ["Catching", "Cleaning", "Separation", "Filling cans", "Sterilising", "Labelling"]),
    ("instant noodle production", ["Flour mixing", "Rolling", "Cutting strands", "Steaming", "Frying", "Seasoning and packing"]),
    ("cider production", ["Apple picking", "Crushing", "Pressing", "Fermentation", "Filtering", "Bottling"]),
    ("silk thread production", ["Cocoon selection", "Boiling", "Silk reeling", "Twisting", "Dyeing", "Weaving"]),
    ("mushroom cultivation", ["Spawning", "Composting", "Growing rooms", "Pinning", "Harvesting", "Packing"]),
    ("greenhouse tomato production", ["Seed sowing", "Transplanting", "Trellising", "Pollination", "Harvesting", "Grading"]),
    ("palm oil refining", ["Fresh fruit bunches", "Sterilising", "Pressing", "Crushing", "Refining", "Fractionating"]),
    ("candle manufacturing", ["Wax melting", "Wick placing", "Casting", "Cooling", "Trimming", "Boxing"]),
    ("wind turbine assembly", ["Blade fabrication", "Hub casting", "Gearbox fitting", "Tower sections", "Final assembly", "Transport"]),
    ("potato starch extraction", ["Washing", "Grinding", "Screening", "Sedimenting", "Drying", "Bagging"]),
]

_MAP_POOL = [
    ("town map regeneration", ["Old industrial zone", "New housing estate", "Pedestrian square", "River walk", "New transport hub"]),
    ("map of a new library", ["Entrance", "Reception", "Reading rooms", "Study desks", "Café", "Garden terrace"]),
    ("map of an airport terminal", ["Check-in", "Security", "Duty-free", "Gates", "Lounge", "Baggage claim"]),
    ("map of a university campus", ["Main building", "Library", "Lecture halls", "Sports centre", "Student village", "Bus stop"]),
    ("map of a harbour redevelopment", ["Warehouses", "Marina", "Restaurants", "Housing", "Ferry terminal", "Park"]),
    ("map of a town square", ["Old market hall", "Fountain", "Cafés", "Bus stop", "Playground", "Trees"]),
    ("map of a hospital site", ["Outpatients", "Emergency", "Wards", "Pharmacy", "Car park", "Helipad"]),
    ("map of a coastal resort", ["Beach huts", "Promenade", "Guesthouse", "Pool", "Arcade", "Lifeguard station"]),
    ("map of an industrial estate", ["Factory", "Warehouses", "Offices", "Lorry park", "Rail spur", "Canteen"]),
    ("map of a train station area", ["Station building", "Ticket hall", "Platforms", "Cycle racks", "Taxi rank", "Shops"]),
    ("map of a park expansion", ["Entrance gates", "Lake", "Woodland", "Playing fields", "Café", "Playground"]),
    ("map of a new office park", ["Reception", "Open offices", "Meeting rooms", "Cafeteria", "Gym", "Landscaped court"]),
    ("map of a retail park", ["Anchor store", "Shops", "Restaurants", "Cinema", "Car park", "Bus stop"]),
    ("map of a museum extension", ["Original building", "New gallery wing", "Glass link", "Café", "Shop", "Garden"]),
    ("map of a riverside quay", ["Old warehouses", "Promenade", "Market stalls", "Cycle path", "Ferry stop", "Park"]),
    ("map of a sports complex", ["Stadium", "Training pitches", "Gym", "Pool", "Car parks", "Metro stop"]),
    ("map of a new shopping centre", ["Main mall", "Department store", "Food court", "Cinema", "Roof garden", "Underground parking"]),
    ("map of a festival site", ["Welcome gate", "Show gardens", "Glasshouses", "Tea pavilion", "Lakeside walk", "Craft market"]),
    ("map of a business campus", ["Incubator", "Manufacturing labs", "Start-up units", "Café", "Green court", "Bike hub"]),
    ("map of a transport museum", ["Entrance hall", "Vintage cars", "Great collection", "Air gallery", "Workshop", "Gift shop"]),
    ("map of a memorial gardens", ["Central memorial", "Reflection pool", "Rose garden", "Chapel", "Visitors shed", "Car park"]),
    ("map of a wildlife reserve", ["Entrance gates", "Meadow trail", "Bird hides", "Wetland boardwalk", "Education centre", "Viewing tower"]),
    ("map of a go-kart track", ["Track area", "Tyre barriers", "Finish line", "Paddock", "Pit buildings", "Spectator stand"]),
    ("map of a holiday park", ["Reception", "Caravan pitches", "Amenity block", "Pool complex", "Play area", "Café"]),
    ("map of a campsite", ["Gatehouse", "Tent circles", "BBQ zone", "Shower block", "Buffer woodland", "River walk"]),
    ("map of a technical park", ["Science halls", "Millennium lab", "Data centre", "Cafeteria", "Conference hub", "Green roof"]),
    ("map of a seafront boulevard", ["Boardwalk", "Beach kiosks", "Promenade", "Lifeboat station", "Observation deck", "Surf school"]),
    ("map of a research station", ["Main lab", "Met station", "Accommodation", "Storage block", "Helipad", "Access track"]),
    ("map of an equestrian centre", ["Stables", "Riding arena", "Trailer park", "Clubhouse", "Vet clinic", "Cross-country field"]),
    ("map of a community park", ["Plots", "Old oak", "Compost yard", "Shared greenhouse", "Play corner", "Garden gate"]),
    ("map of a quarry park", ["Quarry lake", "Climbing wall", "Picnic lawn", "Café", "Lookout point", "Nature trail"]),
    ("map of a campus expansion", ["New library", "Lecture theatre", "Green courtyard", "Sports hall", "Student hub", "Bus interchange"]),
    ("map of a freight district", ["Logistics hub", "Warehouses", "Container park", "Rail spur", "Customs", "Truck arrivals"]),
    ("map of a wedding pavilion", ["Garden house", "Ceremony lawn", "Marquee", "Orchard", "Chapel", "Parking"]),
    ("map of a school grounds", ["Reception", "Classrooms", "STEM lab", "Sports hall", "Playground", "Garden plots"]),
    ("map of a theme park expansion", ["Entrance gate", "Thrill rides", "Water zone", "Family rides", "Food village", "Pod stop"]),
    ("map of a boatyard", ["Boat sheds", "Craft workshops", "Slipway", "Quayside", "Fuel pump", "Small marina"]),
    ("map of a lakeside leisure area", ["Beach", "Jetty", "Boathouse", "Café", "Cycling loop", "Picnic meadow"]),
    ("map of a petting farm", ["Ticket gate", "Animal barns", "Goat paddock", "Play fields", "Farm shop", "Picnic lawn"]),
    ("map of a heritage tram depot", ["Station", "Tram sheds", "Platforms", "Museum hall", "Workshop", "Café"]),
    ("map of a clinical quarter", ["Main clinic", "Outpatients", "Consultation", "Park pharmacy", "Café", "Helipad"]),
    ("map of a convention quarter", ["Main hall", "Exhibit booths", "Meeting rooms", "Plaza", "Lobby", "Food court"]),
    ("map of a coastal defence park", ["Dune wall", "Boardwalk", "Lookout posts", "Wetland ponds", "Education shed", "Car park"]),
    ("map of an open-air stadium site", ["Sports stadium", "Warm-up track", "Field events", "Terraces", "Clubhouse", "Public gym"]),
    ("map of a miniature railway", ["Station", "Track loop", "Lodge", "Bridge", "Depot", "Picnic shelter"]),
    ("map of a youth activity centre", ["Main hall", "Dance rooms", "Climbing wall", "Sports lawn", "Dining hall", "Youth hub"]),
    ("map of a city farm", ["Market garden", "House", "Animal sheds", "Compost yard", "Farm shop", "Playground"]),
    ("map of a garden park", ["Furnace hall", "Kiln area", "Drawing studio", "Garden", "Café", "Gallery"]),
    ("map of a clipped park", ["Forest entrance", "Woodland boardwalk", "Canopy towers", "Campfire zone", "Playground", "Illuminated trail"]),
    ("map of a marina village", ["Marina", "Harbour wall", "Waterfront cafés", "House quarter", "Fish quay", "Junction park"]),
]

_DIAGRAM_POOL = [
    ("a hydroelectric dam generates electricity", ["Reservoir", "Intake gate", "Penstock", "Turbine", "Generator", "Transmission lines"]),
    ("a washing machine cleans clothes", ["Water inlet", "Soap dispenser", "Rotating drum", "Heating element", "Pump", "Drain hose"]),
    ("a coffee machine makes coffee", ["Water tank", "Heating coil", "Pump", "Filter basket", "Carafe", "Warming plate"]),
    ("a bicycle pump inflates a tyre", ["Barrel", "Plunger", "Valve connection", "Air chamber", "Hose", "Tyre valve"]),
    ("a wind turbine generates power", ["Blades", "Nacelle", "Gearbox", "Generator", "Tower", "Grid transformer"]),
    ("a refrigerator cools food", ["Compressor", "Condenser coils", "Expansion valve", "Evaporator coils", "Heat exchange", "Cabinet"]),
    ("a solar water heater warms water", ["Collector panel", "Glass cover", "Absorber plate", "Circulation pump", "Storage tank", "Cold water inlet"]),
    ("a domestic boiler heats water", ["Cold water tank", "Burner", "Heat exchanger", "Circulating pump", "Radiators", "Hot taps"]),
    ("a dishwasher cleans dishes", ["Water inlet", "Spray arms", "Drain pump", "Heating element", "Rinse cycle", "Cutlery basket"]),
    ("a vacuum cleaner picks up dirt", ["Dust inlet", "Brush roller", "Filter", "Motor", "Dust bag", "Exhaust grille"]),
    ("an air conditioner cools a room", ["Compressor", "Condenser coil", "Expansion valve", "Evaporator coil", "Fan", "Warm air vent"]),
    ("a heat pump warms a house", ["Compressor", "Evaporator", "Conveyor coils", "Water loop", "Floor pipes", "Radiated heat"]),
    ("a clothes dryer dries laundry", ["Air intake", "Heater", "Rotating drum", "Lint filter", "Moisture sensor", "Exhaust vent"]),
    ("a pressure cooker cooks food fast", ["Steel pot", "Lid seal", "Pressure valve", "Steam chamber", "Heat source", "Safety lock"]),
    ("a smartphone is assembled", ["Screen layer", "Motherboard", "Battery pack", "Camera lens", "Case mounting", "Quality test"]),
    ("a guitar produces sound", ["Steel strings", "Neck", "Frets", "Sound box", "Sound hole", "Bridge"]),
    ("a thermometer measures temperature", ["Liquid bulb", "Glass tube", "Capillary column", "Scale markings", "Stem"]),
    ("a barometer forecasts pressure", ["Glass tube", "Mercury column", "Vacuum", "Scale plate", "Housing", "Mounting holes"]),
    ("a seismograph records earthquakes", ["Frame", "Suspended mass", "Pen arm", "Rotating drum", "Graph paper", "Timing ratchet"]),
    ("a nuclear reactor generates electricity", ["Inside core", "Steam generator", "Turbine hall", "Condenser", "Cooling tower", "Control rods"]),
    ("a hybrid energy farm supplies power", ["Solar arrays", "Wind towers", "Storage battery", "Inverter", "Grid connection", "Control room"]),
    ("a traffic light controls junctions", ["Signal controller", "Red light", "Amber light", "Green light", "Vehicle loop", "Timing unit"]),
    ("a water filter jug cleans water", ["Reservoir", "Filter cartridge", "Carbon layer", "Antibacterial", "Lid", "Spout"]),
    ("a solar cooker heats food", ["Cooking pot", "Glass cover", "Reflective panels", "Black interior", "Vent holes", "Stand"]),
    ("a greenhouse warms plants", ["Glass panels", "Sunlight", "Thermal mass", "Vent flaps", "Soil beds", "Drip irrigation"]),
    ("bees produce honey", ["Nectar collection", "Hive storage", "Comb building", "Ripening", "Capping cells", "Extraction"]),
    ("an oak tree grows from a seed", ["Acorn", "Root sprout", "Seedling", "Sapling", "Flowering tree", "New acorns"]),
    ("a frog develops in water", ["Frog eggs", "Tadpole stage", "Gills", "Tail absorption", "Adult frog"]),
    ("a butterfly completes its life cycle", ["Egg stage", "Caterpillar", "Pupa", "Wings spread", "Adult butterfly"]),
    ("a salmon completes its journey", ["River spawning", "Eggs in gravel", "Hatch into fry", "Sea migration", "Return upstream", "Repeat cycle"]),
    ("a bean plant grows from a seed", ["Seed in soil", "Root development", "Shoot growth", "Leaves", "Flowering", "Bean pods"]),
    ("a four-stroke engine runs a car", ["Intake stroke", "Compression", "Combustion", "Exhaust stroke", "Piston", "Crankshaft"]),
    ("bicycle gears change speed", ["Pedals", "Chain rings", "Derailleur", "Rear cogs", "Shifter", "Hub"]),
    ("an inkjet printer loads paper", ["Paper tray", "Ink cartridges", "Print head", "Feed rollers", "Output tray", "Control panel"]),
    ("an elevator moves people", ["Rope system", "Counterweight", "Guide rails", "Motor drive", "Safety brake", "Landing doors"]),
    ("an escalator moves passengers", ["Comb plates", "Steps", "Chain drive", "Motor", "Handrail", "Landing"]),
    ("a lighthouse warns ships", ["Lamp house", "Focal", "Lens assembly", "Fog signal", "Tower shaft", "Flashing cycle"]),
    ("a cylinder lock opens with a key", ["Keyhole", "Plug", "Driver pins", "Spring", "Cylinder housing", "Collar"]),
    ("a camera takes a photo", ["Lens", "Shutter blades", "Sensor", "Aperture", "Memory card", "Processor"]),
    ("a microwave oven heats food", ["Magnetron", "Waveguide", "Turntable", "Cavity", "Digital timer", "Safety interlock"]),
    ("a radio receives broadcasts", ["Antenna", "Tuner circuit", "Amplifier", "Speaker", "Dial", "Battery"]),
    ("a ceiling fan cools a room", ["Blades", "Motor", "Balancing", "Shaft", "Speed control", "Swan"]),
    ("a smart thermostat manages heating", ["Temperature sensor", "Display", "Relay switch", "Heating wiring", "Internet module", "Schedule app"]),
    ("a hand dryer dries hands", ["Motor", "Air heater", "Nozzle", "Auto sensor", "Drip tray", "Grille"]),
    ("a pop-up toaster toasts bread", ["Bread slot", "Heating coils", "Lever mechanism", "Timer", "Chassis", "Crumb tray"]),
    ("a projector shows images", ["Lamp", "Condenser lens", "Color wheel", "Mirror prism", "Projection lens", "Screen"]),
    ("an espresso machine pulls a shot", ["Boiler", "Vibratory pump", "Group head", "Portofilter", "Steam wand", "Drip tray"]),
    ("a water softener removes scale", ["Salt tank", "Brine", "Resin beads", "Control valve", "Pipe", "Sink connections"]),
    ("a garage door opens remotely", ["Door panels", "Torsion", "Rail", "Motor opener", "Remote receiver", "Photo eye"]),
    ("a smartwatch tracks activity", ["Screen", "Accelerometer", "Heart sensor", "Bluetooth chip", "Battery", "Phone sync"]),
]

_chart_used_titles: set[str] = set()

def _chart_variant() -> tuple[str, list[str]]:
    """Produce a unique-ish chart title by combining pools."""
    base = _CHART_TOPICS[_rnd.randrange(len(_CHART_TOPICS))]
    loc = _CHART_LOCATIONS[_rnd.randrange(len(_CHART_LOCATIONS))]
    yr = _CHART_YEARS[_rnd.randrange(len(_CHART_YEARS))]
    title = f"{base[0]} in {loc}, {yr}"
    return title, base[1]

_chart_ids = 0


def _chart(topic: str, cats: list[str], kind: str | None = None) -> dict:
    global _chart_ids
    _chart_ids += 1
    vals = [(_rnd.randrange(5, 80), _rnd.choice([0, 5])) for _ in range(len(cats))]
    values = [a + b for a, b in vals]
    values = sorted(values, reverse=(_chart_ids % 2 == 0))
    pod_type = kind or ("bar" if _chart_ids % 3 else "pie")
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
        ("Task 2 Double Question", _DOUBLE), ("Task 2 Mixed / Combined Question", _MIXED),
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
                prompt = template.format(subject=subject, topic=subject) + (
                    " Give reasons for your answer and include any relevant examples "
                    "from your own knowledge or experience. Write at least 250 words."
                )
                model = (f"Model answer: address the prompt directly, give a clear position on {subject}, keep a "
                         f"paragraph structure (introduction, two body paragraphs with reasons and an example, conclusion), "
                         f"use linking words and topic vocabulary, and stay within the word limit.")
                item = _mk(family, f"{family} · {subject[:40]}", prompt, model, None, tips[made % 3], i)
                if item:
                    _bank.append(item)
                    made += 1
    # Task 1 data: 500 each for charts & graphs, tables and mixed charts
    for label, kind in [
        ("Task 1 Charts & Graphs", "chart"),
        ("Task 1 Tables", "table"),
        ("Task 1 Mixed Charts", "mixed"),
    ]:
        made = 0
        t = 0
        while made < _TARGET and t < 20000:
            t += 1
            title, cats = _chart_variant()
            if title in _chart_used_titles:
                continue
            _chart_used_titles.add(title)
            i += 1
            if kind == "table":
                chart = _chart(title, cats)
                chart["type"] = "table"
                prompt = (f"The table below shows {title.lower()}. "
                          f"Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.")
            elif kind == "mixed":
                chart = _chart(title, cats)
                chart["type"] = "bar"
                second = _chart(title, cats)
                second["type"] = "line"
                chart["mixedWith"] = second
                prompt = (f"The bar chart and line graph below show {title.lower()}. Summarise the information by "
                          f"selecting and reporting the main features from both visuals, and make comparisons where relevant. Write at least 150 words.")
            else:
                chart = _chart(title, cats)
                prompt = (f"The {chart['type']} chart below shows {title.lower()}. "
                          f"Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.")
            model = (f"Model answer: give an overview of the overall trend, report the highest and lowest entries, "
                     f"describe the direction of change, and compare groups using structures like 'more than', 'three times', 'in contrast'.")
            item = _mk(label, f"Task 1 · {title}", prompt, model, chart, _TIPS[label][made % 3], i)
            if item:
                _bank.append(item)
                made += 1
    # Task 1 maps (500) and processes (500), from two dedicated pools
    for label, kind, pool in [
        ("Task 1 Maps / Plans", "map", _MAP_POOL),
        ("Task 1 Process", "process", _PROCESS_POOL),
    ]:
        made = 0
        for (name, steps) in pool:
            if made >= _TARGET:
                break
            for variant in range(10):
                if made >= _TARGET:
                    break
                i += 1
                if kind == "map":
                    prompt = (f"The maps show a {name} at two different periods (version {variant + 1}). Summarise the information by "
                              f"selecting and reporting the main changes, and make comparisons where relevant. Write at least 150 words.")
                    model = (f"Model answer (version {variant + 1}): describe the main changes between the two periods with comparison "
                             f"language, and include an overview of the overall transformation. Landmarks: " + " → ".join(steps))
                    chart = {"type": "map", "title": f"{name} — before and after", "unit": "two periods",
                             "categories": list(steps), "values": []}
                    item = _mk(label, f"Task 1 · {name} (map, v{variant + 1})", prompt,
                               model, chart, _TIPS[label][made % 3], i)
                else:
                    prompt = (f"The diagram shows the stages of {name} (version {variant + 1}). Summarise the information by selecting "
                              f"and reporting the main features and make comparisons where relevant. Write at least 150 words.")
                    model = ("Model answer: describe the flow in order with sequence markers: first, then, next, "
                             "afterwards, finally. Mention inputs and outputs and keep a neutral, factual tone. "
                             f"Sequence: " + " → ".join(steps))
                    chart = _chart(f"{name} stages", list(steps), "process")
                    item = _mk(label, f"Task 1 · {name} (v{variant + 1})", prompt,
                               model, chart, _TIPS[label][made % 3], i)
                if item:
                    _bank.append(item)
                    made += 1
    # (processes and maps are generated earlier from the module-level pools above)
    # Task 1 object/device diagrams: 500 items from the module-level pool
    made = 0
    for t, (device, parts) in enumerate(_DIAGRAM_POOL):
        if made >= _TARGET:
            break
        for variant in range(10):
            if made >= _TARGET:
                break
            i += 1
            prompt = (f"The diagram shows {device} (version {variant + 1}). Summarise the information by selecting "
                      f"and reporting the main features and make comparisons where relevant. Write at least 150 words.")
            model = ("Model answer: explain the overall function first, then describe the parts in working order with "
                     "passive and impersonal language: 'the water is heated', 'steam is released'. Make clear how each "
                     f"part contributes to the whole. Sequence: " + " → ".join(parts))
            chart = _chart(f"{device} parts", list(parts), "diagram")
            item = _mk("Task 1 Diagrams", f"Task 1 · {device} (v{variant + 1})", prompt,
                       model, chart, _TIPS["Task 1 Diagrams"][made % 3], i)
            if item:
                _bank.append(item)
                made += 1
    return list(_bank)


WRITING_LARGE_BANK = build()

WRITING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in WRITING_LARGE_BANK:
    WRITING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)