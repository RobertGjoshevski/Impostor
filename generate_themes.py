import json

data_dict = {
  "Locations": [
    {"word": "Space Station", "hint": "Orbit"},
    {"word": "Submarine", "hint": "Vessel"},
    {"word": "Casino", "hint": "Betting"},
    {"word": "Hospital", "hint": "Clinic"},
    {"word": "Library", "hint": "Books"}
  ],
  "Occupations": [
    {"word": "Doctor", "hint": "Medical"}, {"word": "Teacher", "hint": "School"}, {"word": "Police Officer", "hint": "Law"}, {"word": "Chef", "hint": "Kitchen"}, {"word": "Firefighter", "hint": "Rescue"},
    {"word": "Pilot", "hint": "Flying"}, {"word": "Artist", "hint": "Creative"}, {"word": "Engineer", "hint": "Design"}, {"word": "Farmer", "hint": "Agriculture"}, {"word": "Scientist", "hint": "Research"},
    {"word": "Actor", "hint": "Stage"}, {"word": "Musician", "hint": "Instruments"}, {"word": "Lawyer", "hint": "Court"}, {"word": "Judge", "hint": "Gavel"}, {"word": "Plumber", "hint": "Pipes"},
    {"word": "Electrician", "hint": "Wires"}, {"word": "Carpenter", "hint": "Wood"}, {"word": "Mechanic", "hint": "Fixes"}, {"word": "Programmer", "hint": "Code"}, {"word": "Astronaut", "hint": "Space"}
  ],
  "Animals": [
    {"word": "Lion", "hint": "Roar"}, {"word": "Elephant", "hint": "Trunk"}, {"word": "Giraffe", "hint": "Neck"}, {"word": "Tiger", "hint": "Stripes"}, {"word": "Penguin", "hint": "Ice"},
    {"word": "Kangaroo", "hint": "Pouch"}, {"word": "Dolphin", "hint": "Ocean"}, {"word": "Whale", "hint": "Huge"}, {"word": "Shark", "hint": "Teeth"}, {"word": "Eagle", "hint": "Wings"},
    {"word": "Wolf", "hint": "Howl"}, {"word": "Bear", "hint": "Honey"}, {"word": "Monkey", "hint": "Trees"}, {"word": "Snake", "hint": "Slither"}, {"word": "Crocodile", "hint": "Swamp"},
    {"word": "Hippopotamus", "hint": "River"}, {"word": "Rhinoceros", "hint": "Horn"}, {"word": "Zebra", "hint": "Stripes"}, {"word": "Cheetah", "hint": "Fast"}, {"word": "Panda", "hint": "Bamboo"}
  ],
  "Vehicles": [
    {"word": "Car", "hint": "Road"}, {"word": "Bicycle", "hint": "Pedals"}, {"word": "Motorcycle", "hint": "Two wheels"}, {"word": "Bus", "hint": "Public"}, {"word": "Train", "hint": "Tracks"},
    {"word": "Airplane", "hint": "Sky"}, {"word": "Helicopter", "hint": "Chopper"}, {"word": "Boat", "hint": "Water"}, {"word": "Ship", "hint": "Ocean"}, {"word": "Spaceship", "hint": "Stars"},
    {"word": "Submarine", "hint": "Underwater"}, {"word": "Truck", "hint": "Cargo"}, {"word": "Tractor", "hint": "Farm"}, {"word": "Scooter", "hint": "Small"}, {"word": "Skateboard", "hint": "Tricks"},
    {"word": "Rollerblades", "hint": "Wheels"}, {"word": "Hot Air Balloon", "hint": "Basket"}, {"word": "Blimp", "hint": "Floating"}, {"word": "Hovercraft", "hint": "Air cushion"}, {"word": "Snowmobile", "hint": "Winter"}
  ],
  "Food & Drinks": [
    {"word": "Pizza", "hint": "Slices"}, {"word": "Burger", "hint": "Buns"}, {"word": "Sushi", "hint": "Raw fish"}, {"word": "Pasta", "hint": "Noodles"}, {"word": "Salad", "hint": "Greens"},
    {"word": "Taco", "hint": "Shell"}, {"word": "Steak", "hint": "Beef"}, {"word": "Ice Cream", "hint": "Cold dessert"}, {"word": "Cake", "hint": "Birthday"}, {"word": "Chocolate", "hint": "Sweet cocoa"},
    {"word": "Coffee", "hint": "Morning drink"}, {"word": "Tea", "hint": "Leaves"}, {"word": "Soda", "hint": "Bubbly"}, {"word": "Juice", "hint": "Fruit extract"}, {"word": "Water", "hint": "H2O"},
    {"word": "Wine", "hint": "Grapes"}, {"word": "Beer", "hint": "Brew"}, {"word": "Milk", "hint": "Dairy"}, {"word": "Cheese", "hint": "Mice love it"}, {"word": "Bread", "hint": "Baker"}
  ],
  "Countries": [
    {"word": "USA", "hint": "Stars and Stripes"}, {"word": "Canada", "hint": "Maple Leaf"}, {"word": "Brazil", "hint": "Samba"}, {"word": "UK", "hint": "Tea & Monarchy"}, {"word": "France", "hint": "Eiffel"},
    {"word": "Germany", "hint": "Oktoberfest"}, {"word": "Italy", "hint": "Boot shape"}, {"word": "Spain", "hint": "Flamenco"}, {"word": "Russia", "hint": "Largest area"}, {"word": "China", "hint": "Great Wall"},
    {"word": "Japan", "hint": "Rising Sun"}, {"word": "India", "hint": "Taj Mahal"}, {"word": "Australia", "hint": "Kangaroos"}, {"word": "Egypt", "hint": "Pyramids"}, {"word": "South Africa", "hint": "Safari"},
    {"word": "Mexico", "hint": "Sombrero"}, {"word": "Argentina", "hint": "Tango"}, {"word": "Sweden", "hint": "Ikea"}, {"word": "Norway", "hint": "Fjords"}, {"word": "Switzerland", "hint": "Alps"}
  ],
  "Famous People": [
    {"word": "Albert Einstein", "hint": "E=mc2"}, {"word": "Isaac Newton", "hint": "Apple gravity"}, {"word": "Leonardo da Vinci", "hint": "Mona Lisa"}, {"word": "Vincent van Gogh", "hint": "Starry Night"}, {"word": "William Shakespeare", "hint": "Playwright"},
    {"word": "Mozart", "hint": "Classical composer"}, {"word": "Beethoven", "hint": "Deaf composer"}, {"word": "Elvis Presley", "hint": "King of Rock"}, {"word": "Michael Jackson", "hint": "King of Pop"}, {"word": "Marilyn Monroe", "hint": "Hollywood icon"},
    {"word": "Charlie Chaplin", "hint": "Silent comedy"}, {"word": "Walt Disney", "hint": "Mickey's creator"}, {"word": "Steve Jobs", "hint": "Apple founder"}, {"word": "Bill Gates", "hint": "Microsoft founder"}, {"word": "Elon Musk", "hint": "Tesla"},
    {"word": "Nelson Mandela", "hint": "South Africa leader"}, {"word": "Martin Luther King Jr.", "hint": "I have a dream"}, {"word": "Gandhi", "hint": "Peaceful protest"}, {"word": "Abraham Lincoln", "hint": "Top hat"}, {"word": "George Washington", "hint": "First US President"}
  ],
  "Movies": [
    {"word": "Star Wars", "hint": "Jedi"}, {"word": "Jurassic Park", "hint": "Dinosaurs"}, {"word": "The Matrix", "hint": "Red pill"}, {"word": "Titanic", "hint": "Sinking ship"}, {"word": "Avatar", "hint": "Blue aliens"},
    {"word": "The Godfather", "hint": "Mafia"}, {"word": "Harry Potter", "hint": "Wizards"}, {"word": "Lord of the Rings", "hint": "One ring"}, {"word": "Avengers", "hint": "Marvel heroes"}, {"word": "Spider-Man", "hint": "Web-slinger"},
    {"word": "Batman", "hint": "Dark Knight"}, {"word": "Superman", "hint": "Man of Steel"}, {"word": "Toy Story", "hint": "Living toys"}, {"word": "The Lion King", "hint": "Hakuna Matata"}, {"word": "Frozen", "hint": "Let it go"},
    {"word": "Home Alone", "hint": "Left behind child"}, {"word": "Jaws", "hint": "Giant shark"}, {"word": "E.T.", "hint": "Phone home"}, {"word": "Indiana Jones", "hint": "Archaeologist whip"}, {"word": "Back to the Future", "hint": "DeLorean time"}
  ],
  "Superheroes": [
    {"word": "Superman", "hint": "Krypton"}, {"word": "Batman", "hint": "Gotham"}, {"word": "Spider-Man", "hint": "Webs"}, {"word": "Iron Man", "hint": "Tony Stark"}, {"word": "Captain America", "hint": "Vibranium shield"},
    {"word": "Thor", "hint": "Hammer"}, {"word": "Hulk", "hint": "Green angry"}, {"word": "Black Widow", "hint": "Spy Avenger"}, {"word": "Wolverine", "hint": "Adamantium claws"}, {"word": "Flash", "hint": "Fastest man"},
    {"word": "Wonder Woman", "hint": "Lasso of Truth"}, {"word": "Aquaman", "hint": "Atlantis"}, {"word": "Green Lantern", "hint": "Power ring"}, {"word": "Deadpool", "hint": "Merc with a mouth"}, {"word": "Black Panther", "hint": "Wakanda"},
    {"word": "Doctor Strange", "hint": "Sorcerer Supreme"}, {"word": "Ant-Man", "hint": "Shrinking"}, {"word": "Daredevil", "hint": "Blind hero"}, {"word": "Punisher", "hint": "Vigilante"}, {"word": "Ghost Rider", "hint": "Flaming skull"}
  ],
  "Sports": [
    {"word": "Soccer", "hint": "Penalty kick"}, {"word": "Basketball", "hint": "Hoop"}, {"word": "Baseball", "hint": "Home run"}, {"word": "Tennis", "hint": "Racket"}, {"word": "Golf", "hint": "Hole in one"},
    {"word": "Volleyball", "hint": "Net and spike"}, {"word": "Swimming", "hint": "Pool lanes"}, {"word": "Athletics", "hint": "Track & field"}, {"word": "Gymnastics", "hint": "Balance beam"}, {"word": "Boxing", "hint": "Gloves and ring"},
    {"word": "Wrestling", "hint": "Pin to win"}, {"word": "Martial Arts", "hint": "Black belt"}, {"word": "Cycling", "hint": "Bicycles racing"}, {"word": "Skiing", "hint": "Snow mountain"}, {"word": "Snowboarding", "hint": "One board on snow"},
    {"word": "Surfing", "hint": "Ocean waves"}, {"word": "Rugby", "hint": "Scrum"}, {"word": "Cricket", "hint": "Batsman and bowler"}, {"word": "Hockey", "hint": "Puck on ice"}, {"word": "Table Tennis", "hint": "Ping pong"}
  ],
  "Musical Instruments": [
    {"word": "Piano", "hint": "Black and white keys"}, {"word": "Guitar", "hint": "Six strings strums"}, {"word": "Violin", "hint": "Bow and chin"}, {"word": "Drum", "hint": "Beats and sticks"}, {"word": "Flute", "hint": "Blow across hole"},
    {"word": "Trumpet", "hint": "Brass valves"}, {"word": "Saxophone", "hint": "Jazz brass"}, {"word": "Cello", "hint": "Large string seated"}, {"word": "Clarinet", "hint": "Black woodwind"}, {"word": "Harp", "hint": "Angel strings"},
    {"word": "Trombone", "hint": "Brass slide"}, {"word": "Tuba", "hint": "Largest brass bass"}, {"word": "Accordion", "hint": "Squeeze box"}, {"word": "Banjo", "hint": "Folk strings round"}, {"word": "Mandolin", "hint": "Eight strings small"},
    {"word": "Ukulele", "hint": "Hawaiian four strings"}, {"word": "Xylophone", "hint": "Wooden bars mallets"}, {"word": "Synthesizer", "hint": "Electronic keys"}, {"word": "Bass", "hint": "Low frequency strings"}, {"word": "Oboe", "hint": "Double reed"}
  ],
  "Historical Events": [
    {"word": "World War I", "hint": "Trenches"}, {"word": "World War II", "hint": "Axis & Allies"}, {"word": "French Revolution", "hint": "Guillotine"}, {"word": "American Revolution", "hint": "1776"}, {"word": "Moon Landing", "hint": "Apollo 11"},
    {"word": "Fall of the Berlin Wall", "hint": "Cold War ending"}, {"word": "Cold War", "hint": "USA vs USSR tension"}, {"word": "Renaissance", "hint": "Rebirth of art"}, {"word": "Industrial Revolution", "hint": "Factories & steam"}, {"word": "Discovery of America", "hint": "Columbus 1492"},
    {"word": "Black Death", "hint": "Plague"}, {"word": "Titanic Sinking", "hint": "Iceberg 1912"}, {"word": "Independence of India", "hint": "1947 partition"}, {"word": "Magna Carta", "hint": "1215 document"}, {"word": "Declaration of Independence", "hint": "July 4"},
    {"word": "Invention Printing Press", "hint": "Gutenberg"}, {"word": "Internet Creation", "hint": "World Wide Web starts"}, {"word": "Chernobyl Disaster", "hint": "Nuclear meltdown"}, {"word": "9/11 Attacks", "hint": "Twin towers"}, {"word": "COVID-19 Pandemic", "hint": "Global quarantine"}
  ],
  "Fictional Characters": [
    {"word": "Sherlock Holmes", "hint": "Detective"}, {"word": "Mickey Mouse", "hint": "Disney mascot"}, {"word": "Bugs Bunny", "hint": "What's up doc"}, {"word": "Homer Simpson", "hint": "D'oh!"}, {"word": "SpongeBob", "hint": "Pineapple under sea"},
    {"word": "Mario", "hint": "Plumber hero"}, {"word": "Pikachu", "hint": "Electric mouse"}, {"word": "Sonic", "hint": "Blue fast hedgehog"}, {"word": "Darth Vader", "hint": "I am your father"}, {"word": "James Bond", "hint": "007"},
    {"word": "Harry Potter", "hint": "Boy who lived"}, {"word": "Frodo Baggins", "hint": "Ring bearer"}, {"word": "Dracula", "hint": "Vampire count"}, {"word": "Frankenstein", "hint": "Monster creator"}, {"word": "King Kong", "hint": "Giant ape"},
    {"word": "Godzilla", "hint": "Radioactive lizard"}, {"word": "Superman", "hint": "Clark Kent"}, {"word": "Batman", "hint": "Bruce Wayne"}, {"word": "Spider-Man", "hint": "Peter Parker"}, {"word": "Peter Pan", "hint": "Neverland boy"}
  ],
  "Video Games": [
    {"word": "Super Mario Bros", "hint": "Jump on Goombas"}, {"word": "Minecraft", "hint": "Blocks and Creepers"}, {"word": "Tetris", "hint": "Falling shapes"}, {"word": "Pac-Man", "hint": "Yellow circle ghosts"}, {"word": "Grand Theft Auto", "hint": "Steal cars"},
    {"word": "Call of Duty", "hint": "Military shooter"}, {"word": "Legend of Zelda", "hint": "Link's quest"}, {"word": "Pokemon", "hint": "Gotta catch them all"}, {"word": "World of Warcraft", "hint": "Huge MMO"}, {"word": "Fortnite", "hint": "Battle Royale building"},
    {"word": "League of Legends", "hint": "MOBA lanes"}, {"word": "Overwatch", "hint": "Hero team shooter"}, {"word": "The Sims", "hint": "Control virtual lives"}, {"word": "Animal Crossing", "hint": "Island villagers"}, {"word": "Skyrim", "hint": "Dragonborn"},
    {"word": "Red Dead Redemption", "hint": "Cowboy outlaw"}, {"word": "Halo", "hint": "Master Chief"}, {"word": "Portal", "hint": "Teleporting gun puzzle"}, {"word": "Bioshock", "hint": "Underwater city"}, {"word": "Half-Life", "hint": "Gordon Freeman crowbar"}
  ],
  "Landmarks": [
    {"word": "Eiffel Tower", "hint": "Paris iron"}, {"word": "Great Wall of China", "hint": "Longest brick structure"}, {"word": "Statue of Liberty", "hint": "NY torch"}, {"word": "Colosseum", "hint": "Roman gladiators"}, {"word": "Taj Mahal", "hint": "Indian marble mausoleum"},
    {"word": "Pyramids of Giza", "hint": "Egyptian ancient tombs"}, {"word": "Machu Picchu", "hint": "Inca ruins"}, {"word": "Stonehenge", "hint": "UK standing stones"}, {"word": "Big Ben", "hint": "London clock"}, {"word": "Mount Rushmore", "hint": "Presidents carved mountain"},
    {"word": "Christ the Redeemer", "hint": "Rio statue"}, {"word": "Sydney Opera House", "hint": "Australian sails roof"}, {"word": "Acropolis", "hint": "Athens hilltop"}, {"word": "Petronas Towers", "hint": "Kuala Lumpur twin high"}, {"word": "Burj Khalifa", "hint": "Dubai tallest"},
    {"word": "Golden Gate Bridge", "hint": "San Francisco red"}, {"word": "Niagara Falls", "hint": "US/Canada huge waterfall"}, {"word": "Grand Canyon", "hint": "Arizona huge gorge"}, {"word": "Leaning Tower of Pisa", "hint": "Tilted Italian base"}, {"word": "Mount Everest", "hint": "Highest peak"}
  ],
  "Fears & Phobias": [
    {"word": "Spiders", "hint": "Arachnophobia"}, {"word": "Heights", "hint": "Acrophobia"}, {"word": "Confined Spaces", "hint": "Claustrophobia"}, {"word": "Dark", "hint": "Nyctophobia"}, {"word": "Snakes", "hint": "Ophidiophobia"},
    {"word": "Flying", "hint": "Aviophobia"}, {"word": "Dogs", "hint": "Cynophobia"}, {"word": "Needles", "hint": "Trypanophobia"}, {"word": "Socializing", "hint": "Social Phobia"}, {"word": "Germs", "hint": "Mysophobia"},
    {"word": "Public Speaking", "hint": "Glossophobia"}, {"word": "Death", "hint": "Thanatophobia"}, {"word": "Water", "hint": "Aquaphobia"}, {"word": "Blood", "hint": "Hemophobia"}, {"word": "Crowds", "hint": "Agoraphobia"},
    {"word": "Clowns", "hint": "Coulrophobia"}, {"word": "Dentists", "hint": "Dentophobia"}, {"word": "Thunder", "hint": "Astraphobia"}, {"word": "Fire", "hint": "Pyrophobia"}, {"word": "Ghosts", "hint": "Phasmophobia"}
  ],
  "Mythological Creatures": [
    {"word": "Dragon", "hint": "Breathing fire scaling"}, {"word": "Unicorn", "hint": "One horn horse"}, {"word": "Phoenix", "hint": "Reborn fiery bird"}, {"word": "Mermaid", "hint": "Half fish half woman"}, {"word": "Centaur", "hint": "Half horse half man"},
    {"word": "Griffin", "hint": "Lion eagle hybrid"}, {"word": "Pegasus", "hint": "Winged horse"}, {"word": "Minotaur", "hint": "Bull headed man"}, {"word": "Medusa", "hint": "Snake hair"}, {"word": "Kraken", "hint": "Giant sea monster"},
    {"word": "Cyclops", "hint": "One eyed giant"}, {"word": "Sphinx", "hint": "Lion body human head"}, {"word": "Cerberus", "hint": "Three headed dog"}, {"word": "Chimera", "hint": "Lion goat snake fusion"}, {"word": "Hydra", "hint": "Multi-headed serpent"},
    {"word": "Vampire", "hint": "Bloodsucker"}, {"word": "Werewolf", "hint": "Full moon transformation"}, {"word": "Troll", "hint": "Bridge guardian"}, {"word": "Goblin", "hint": "Little green mischief"}, {"word": "Yeti", "hint": "Abominable snowman"}
  ],
  "Household Items": [
    {"word": "Television", "hint": "Watching screen"}, {"word": "Refrigerator", "hint": "Cooling food"}, {"word": "Microwave", "hint": "Fast heating"}, {"word": "Washing Machine", "hint": "Cleaning clothes"}, {"word": "Bed", "hint": "Sleeping furniture"},
    {"word": "Sofa", "hint": "Living room seating"}, {"word": "Table", "hint": "Eating surface"}, {"word": "Chair", "hint": "Sitting furniture"}, {"word": "Lamp", "hint": "Lighting device"}, {"word": "Clock", "hint": "Telling time"},
    {"word": "Mirror", "hint": "Reflection glass"}, {"word": "Oven", "hint": "Baking food"}, {"word": "Toaster", "hint": "Crispy bread"}, {"word": "Blender", "hint": "Mixing smoothies"}, {"word": "Vacuum Cleaner", "hint": "Sucking dust"},
    {"word": "Iron", "hint": "Pressing clothes"}, {"word": "Trash Can", "hint": "Garbage holder"}, {"word": "Bathtub", "hint": "Washing body"}, {"word": "Toilet", "hint": "Bathroom necessity"}, {"word": "Bookcase", "hint": "Holding novels"}
  ],
  "Nature": [
    {"word": "Tree", "hint": "Leaves & trunk"}, {"word": "Flower", "hint": "Petals"}, {"word": "Mountain", "hint": "High peak"}, {"word": "River", "hint": "Flowing water"}, {"word": "Ocean", "hint": "Salty sea"},
    {"word": "Forest", "hint": "Many trees"}, {"word": "Desert", "hint": "Sand and dry"}, {"word": "Snow", "hint": "Cold white flakes"}, {"word": "Rain", "hint": "Water falling from sky"}, {"word": "Sun", "hint": "Daytime star"},
    {"word": "Moon", "hint": "Nighttime satellite"}, {"word": "Star", "hint": "Twinkling sky point"}, {"word": "Cloud", "hint": "White fluffy sky object"}, {"word": "Lightning", "hint": "Electric storm flash"}, {"word": "Wind", "hint": "Moving air breeze"},
    {"word": "Volcano", "hint": "Lava erupting mountain"}, {"word": "Cave", "hint": "Dark hollow rocky"}, {"word": "Waterfall", "hint": "Water dropping cliff"}, {"word": "Island", "hint": "Land surrounded by water"}, {"word": "Grass", "hint": "Green lawn blades"}
  ],
  "Clothing": [
    {"word": "Shirt", "hint": "Upper body wear"}, {"word": "Pants", "hint": "Lower body legs"}, {"word": "Dress", "hint": "One piece women wear"}, {"word": "Skirt", "hint": "Dangling lower wear"}, {"word": "Jacket", "hint": "Outer wear coat"},
    {"word": "Sweater", "hint": "Warm knitted top"}, {"word": "Socks", "hint": "Foot covering soft"}, {"word": "Shoes", "hint": "Foot covering hard"}, {"word": "Hat", "hint": "Head covering gear"}, {"word": "Gloves", "hint": "Hand warming cover"},
    {"word": "Scarf", "hint": "Neck wrapper"}, {"word": "Belt", "hint": "Waist tightener"}, {"word": "Tie", "hint": "Suit neck accessory"}, {"word": "Underwear", "hint": "Base layer bottom"}, {"word": "Shorts", "hint": "Summer leg wear"},
    {"word": "Jeans", "hint": "Denim pants"}, {"word": "T-shirt", "hint": "Casual short sleeve"}, {"word": "Coat", "hint": "Heavy winter top"}, {"word": "Boots", "hint": "High footwear ankle"}, {"word": "Sandals", "hint": "Open toe summer shoes"}
  ],
  "Hobbies": [
    {"word": "Reading", "hint": "Books pages novels"}, {"word": "Writing", "hint": "Pen paper stories"}, {"word": "Drawing", "hint": "Pencil art sketch"}, {"word": "Painting", "hint": "Brush colors canvas"}, {"word": "Photography", "hint": "Taking pictures camera"},
    {"word": "Cooking", "hint": "Making meals"}, {"word": "Baking", "hint": "Oven sweets dough"}, {"word": "Gardening", "hint": "Plants soil flowers"}, {"word": "Fishing", "hint": "Rod reel water"}, {"word": "Hiking", "hint": "Walking trails mountains"},
    {"word": "Camping", "hint": "Tent outdoors fire"}, {"word": "Knitting", "hint": "Yarn needles sweater"}, {"word": "Sewing", "hint": "Thread fabric needle"}, {"word": "Woodworking", "hint": "Carving constructing timber"}, {"word": "Pottery", "hint": "Clay spinning wheel"},
    {"word": "Gaming", "hint": "Playing video consoles"}, {"word": "Dancing", "hint": "Moving body rhythm"}, {"word": "Singing", "hint": "Vocal melodies"}, {"word": "Traveling", "hint": "Visiting new places"}, {"word": "Collecting", "hint": "Gathering specific items"}
  ],
  "Colors": [
    {"word": "Red", "hint": "Blood apple"}, {"word": "Blue", "hint": "Sky ocean"}, {"word": "Yellow", "hint": "Sun banana"}, {"word": "Green", "hint": "Grass leaves"}, {"word": "Orange", "hint": "Citrus fruit"},
    {"word": "Purple", "hint": "Grapes royalty"}, {"word": "Pink", "hint": "Pig cotton candy"}, {"word": "Black", "hint": "Night coal"}, {"word": "White", "hint": "Snow milk"}, {"word": "Gray", "hint": "Ash clouds"},
    {"word": "Brown", "hint": "Dirt wood"}, {"word": "Gold", "hint": "Shiny wealth"}, {"word": "Silver", "hint": "Second place metal"}, {"word": "Bronze", "hint": "Third place metal"}, {"word": "Cyan", "hint": "Light bright blue"},
    {"word": "Magenta", "hint": "Deep purplish red"}, {"word": "Indigo", "hint": "Dark violet blue"}, {"word": "Teal", "hint": "Blue green hue"}, {"word": "Maroon", "hint": "Dark brownish red"}, {"word": "Navy", "hint": "Dark military blue"}
  ],
  "Science": [
    {"word": "Biology", "hint": "Life study"}, {"word": "Chemistry", "hint": "Elements reactions"}, {"word": "Physics", "hint": "Matter forces energy"}, {"word": "Astronomy", "hint": "Space planets study"}, {"word": "Geology", "hint": "Earth rocks study"},
    {"word": "Atom", "hint": "Smallest particle core"}, {"word": "Molecule", "hint": "Atoms bonded"}, {"word": "Cell", "hint": "Basic life unit"}, {"word": "DNA", "hint": "Genetic ladder"}, {"word": "Gravity", "hint": "Falling pulling force"},
    {"word": "Evolution", "hint": "Species change over time"}, {"word": "Microscope", "hint": "Seeing tiny things"}, {"word": "Telescope", "hint": "Seeing far things"}, {"word": "Laboratory", "hint": "Science workplace"}, {"word": "Experiment", "hint": "Testing hypothesis"},
    {"word": "Theory", "hint": "Scientific explanation base"}, {"word": "Fossil", "hint": "Ancient rock remains"}, {"word": "Virus", "hint": "Microscopic disease agent"}, {"word": "Bacteria", "hint": "Single cell organisms"}, {"word": "Element", "hint": "Periodic table item"}
  ],
  "Emotions": [
    {"word": "Happiness", "hint": "Joy smile"}, {"word": "Sadness", "hint": "Tears crying"}, {"word": "Anger", "hint": "Mad furious rage"}, {"word": "Fear", "hint": "Scared afraid terror"}, {"word": "Surprise", "hint": "Shock unexpected"},
    {"word": "Disgust", "hint": "Grossed out sick"}, {"word": "Love", "hint": "Affection romance hearts"}, {"word": "Jealousy", "hint": "Envy wanting theirs"}, {"word": "Guilt", "hint": "Feeling bad doing wrong"}, {"word": "Shame", "hint": "Embarrassment humiliating"},
    {"word": "Excitement", "hint": "Thrilled looking forward"}, {"word": "Boredom", "hint": "Nothing to do dull"}, {"word": "Hope", "hint": "Optimism future bright"}, {"word": "Despair", "hint": "Total loss hope"}, {"word": "Confusion", "hint": "Not understanding puzzle"},
    {"word": "Pride", "hint": "Satisfied personal achievement"}, {"word": "Relief", "hint": "Stress gone relaxing"}, {"word": "Nostalgia", "hint": "Missing past fondly"}, {"word": "Loneliness", "hint": "Feeling isolated solo"}, {"word": "Curiosity", "hint": "Wanting to know more"}
  ],
  "School Subjects": [
    {"word": "Mathematics", "hint": "Numbers equations shapes"}, {"word": "Science", "hint": "Experiments biology physics"}, {"word": "English", "hint": "Literature grammar writing"}, {"word": "History", "hint": "Past events wars"}, {"word": "Geography", "hint": "Maps countries capitals"},
    {"word": "Art", "hint": "Painting drawing creative"}, {"word": "Music", "hint": "Playing instruments singing"}, {"word": "Physical Education", "hint": "Gym sports running"}, {"word": "Computer Science", "hint": "Coding programming tech"}, {"word": "Foreign Language", "hint": "Speaking idioms overseas"},
    {"word": "Chemistry", "hint": "Elements lab periodic"}, {"word": "Biology", "hint": "Life cells plants"}, {"word": "Physics", "hint": "Forces gravity motion"}, {"word": "Algebra", "hint": "Letters and numbers math"}, {"word": "Geometry", "hint": "Shapes angles lines"},
    {"word": "Calculus", "hint": "Advanced math derivatives"}, {"word": "Economics", "hint": "Money markets trade"}, {"word": "Psychology", "hint": "Mind behavior study"}, {"word": "Sociology", "hint": "Society people culture"}, {"word": "Drama", "hint": "Theater acting plays"}
  ],
  "Toys": [
    {"word": "Lego", "hint": "Building blocks plastic"}, {"word": "Barbie", "hint": "Popular fashion doll"}, {"word": "Teddy Bear", "hint": "Stuffed animal plush"}, {"word": "Action Figure", "hint": "Posable hero toy"}, {"word": "Yo-Yo", "hint": "String spinning down up"},
    {"word": "Kite", "hint": "Flying string wind"}, {"word": "Frisbee", "hint": "Flying disc throw"}, {"word": "Dollhouse", "hint": "Miniature home toy"}, {"word": "Puzzle", "hint": "Fitting pieces together picture"}, {"word": "Board Game", "hint": "Table top dice rules"},
    {"word": "Rubik's Cube", "hint": "Twisting colorful square"}, {"word": "Train Set", "hint": "Tracks miniature engines"}, {"word": "Remote Control Car", "hint": "Driving via frequency"}, {"word": "Play-Doh", "hint": "Modeling clay colors"}, {"word": "Hula Hoop", "hint": "Spinning around waist"},
    {"word": "Jump Rope", "hint": "Skipping string exercise"}, {"word": "Water Gun", "hint": "Shooting liquid summer squirter"}, {"word": "Slingshot", "hint": "Pull back launch rock"}, {"word": "Trampoline", "hint": "Bouncy jumping surface"}, {"word": "Rocking Horse", "hint": "Swing back forth animal seat"}
  ],
  "Weapons": [
    {"word": "Sword", "hint": "Long metal blade knight"}, {"word": "Bow and Arrow", "hint": "String pulling projectiles archery"}, {"word": "Gun", "hint": "Firearm bullets shooting"}, {"word": "Knife", "hint": "Short sharp blade cutting"}, {"word": "Spear", "hint": "Long pole pointy end"},
    {"word": "Axe", "hint": "Chopping wood blade"}, {"word": "Mace", "hint": "Spiked club medieval"}, {"word": "Shield", "hint": "Defensive blocking gear"}, {"word": "Crossbow", "hint": "Horizontal mechanical bow"}, {"word": "Whip", "hint": "Snapping leather cord"},
    {"word": "Cannon", "hint": "Heavy ball firing artillery"}, {"word": "Grenade", "hint": "Explosive thrown pin"}, {"word": "Dagger", "hint": "Small personal stabbing knife"}, {"word": "Boomerang", "hint": "Returning thrown curve"}, {"word": "Nunchucks", "hint": "Two sticks chain martial arts"},
    {"word": "Katana", "hint": "Japanese samurai sword"}, {"word": "Sniper Rifle", "hint": "Long range scope gun"}, {"word": "Shotgun", "hint": "Scatter close range gun"}, {"word": "Machine Gun", "hint": "Rapid fire heavy weapon"}, {"word": "Rocket Launcher", "hint": "Explosive projectile huge"}
  ],
  "Technology": [
    {"word": "Computer", "hint": "Desktop PC screen CPU"}, {"word": "Smartphone", "hint": "Mobile touchscreen device"}, {"word": "Tablet", "hint": "Flat screen portable computer"}, {"word": "Laptop", "hint": "Foldable portable PC"}, {"word": "Smartwatch", "hint": "Wrist wearable tech"},
    {"word": "Headphones", "hint": "Ear listening audio"}, {"word": "Camera", "hint": "Photo video capturing lens"}, {"word": "Drone", "hint": "Unmanned flying gadget"}, {"word": "Virtual Reality Headset", "hint": "Goggles 3D immersive"}, {"word": "Game Console", "hint": "TV hooked playing system"},
    {"word": "Router", "hint": "WiFi internet signal box"}, {"word": "Speaker", "hint": "Loud audio output"}, {"word": "Microphone", "hint": "Voice sound input"}, {"word": "Keyboard", "hint": "Typing keys buttons"}, {"word": "Mouse", "hint": "Clicking pointing cursor"},
    {"word": "Printer", "hint": "Paper ink output"}, {"word": "Scanner", "hint": "Digitalizing paper document"}, {"word": "Monitor", "hint": "Display screen unit"}, {"word": "Hard Drive", "hint": "Data storage disk"}, {"word": "USB Flash Drive", "hint": "Thumb stick storage byte"}
  ],
  "Holidays": [
    {"word": "Christmas", "hint": "December trees presents Santa"}, {"word": "Halloween", "hint": "October costumes candy spooky"}, {"word": "Thanksgiving", "hint": "November turkey grateful"}, {"word": "Easter", "hint": "Spring bunnies eggs chocolate"}, {"word": "Valentine's Day", "hint": "February love hearts romantic"},
    {"word": "New Year's Eve", "hint": "December 31st midnight fireworks"}, {"word": "Independence Day", "hint": "July 4th freedom fireworks"}, {"word": "St. Patrick's Day", "hint": "March green luck Irish"}, {"word": "Mother's Day", "hint": "Appreciating mom Sunday"}, {"word": "Father's Day", "hint": "Appreciating dad Sunday"},
    {"word": "Earth Day", "hint": "April helping planet nature"}, {"word": "Labor Day", "hint": "September workers end summer"}, {"word": "Memorial Day", "hint": "May remembering fallen soldiers"}, {"word": "Veterans Day", "hint": "November honoring military output"}, {"word": "Hanukkah", "hint": "Jewish festival lights menorah"},
    {"word": "Diwali", "hint": "Indian festival lights"}, {"word": "Ramadan", "hint": "Islamic fasting month"}, {"word": "Oktoberfest", "hint": "German beer festival"}, {"word": "Cinco de Mayo", "hint": "May 5th Mexican pride"}, {"word": "Chinese New Year", "hint": "Lunar calendar dragon"}
  ],
  "Insects": [
    {"word": "Butterfly", "hint": "Colorful flying wings cocoon"}, {"word": "Bee", "hint": "Yellow black buzzing honey"}, {"word": "Ant", "hint": "Tiny marching strong colony"}, {"word": "Mosquito", "hint": "Biting annoying blood sucker"}, {"word": "Fly", "hint": "Buzzing house pest wing"},
    {"word": "Spider", "hint": "Eight legs webs (Wait technically arachnid)"}, {"word": "Beetle", "hint": "Hard shell crawling bug"}, {"word": "Ladybug", "hint": "Red black dots spotted wings"}, {"word": "Grasshopper", "hint": "Jumping green long legs"}, {"word": "Cricket", "hint": "Chirping night sound jumper"},
    {"word": "Cockroach", "hint": "Surviving gross fast crawler"}, {"word": "Moth", "hint": "Dusty wings attracted light"}, {"word": "Wasp", "hint": "Aggressive stinging yellow striped"}, {"word": "Hornet", "hint": "Large aggressive stinging nest"}, {"word": "Dragonfly", "hint": "Long body fast flying four wings"},
    {"word": "Caterpillar", "hint": "Crawling wormy fuzzy butterfly baby"}, {"word": "Centipede", "hint": "Many long legs crawler fast"}, {"word": "Flea", "hint": "Jumping tiny pet pest"}, {"word": "Tick", "hint": "Blood sucking woods parasite"}, {"word": "Bedbug", "hint": "Mattress biting nuisance"}
  ],
  "Fairy Tales": [
    {"word": "Cinderella", "hint": "Glass slipper pumpkin coach"}, {"word": "Snow White", "hint": "Seven dwarfs poisoned apple"}, {"word": "Sleeping Beauty", "hint": "Spinning wheel hundred years nap"}, {"word": "Little Red Riding Hood", "hint": "Grandma wolf basket"}, {"word": "Beauty and the Beast", "hint": "Cursed prince magical rose"},
    {"word": "Peter Pan", "hint": "Neverland Tinkerbell hook"}, {"word": "Alice in Wonderland", "hint": "Rabbit hole mad hatter queen"}, {"word": "Pinocchio", "hint": "Wooden boy growing nose string"}, {"word": "Aladdin", "hint": "Magic lamp genie carpet"}, {"word": "The Little Mermaid", "hint": "Ariel sea legs voice"},
    {"word": "Hansel and Gretel", "hint": "Breadcrumbs gingerbread witch"}, {"word": "Rapunzel", "hint": "Long hair tower let down"}, {"word": "Rumpelstiltskin", "hint": "Spinning straw gold name guess"}, {"word": "Goldilocks", "hint": "Three bears porridge bed chair"}, {"word": "The Ugly Duckling", "hint": "Swan transformation outcast"},
    {"word": "Jack and the Beanstalk", "hint": "Magic beans giant sky stalk"}, {"word": "Puss in Boots", "hint": "Clever cat feline footwear"}, {"word": "The Princess and the Pea", "hint": "Mattress stacking sensitive royal test"}, {"word": "The Gingerbread Man", "hint": "Run fast catch me dough"}, {"word": "The Pied Piper", "hint": "Rats children flute magic tune"}
  ]
}

with open("data/en.json", "w") as f:
    json.dump(data_dict, f, indent=2)

print("en.json updated successfully.")
