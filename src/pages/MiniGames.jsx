import { useState, useEffect, useRef } from "react";
import { updateDoc, doc, getFirestore, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import Tutorial from "./Tutorial";

// ====== GAME DEFINITIONS ======

const GAMES = [
  { id: "speed-wyr", name: "Speed WYR", emoji: "⚡", desc: "10s to pick — do you match?", duration: 120 },
  { id: "memory", name: "Memory Match", emoji: "🧠", desc: "Flip cards, find pairs, beat them", duration: 180 },
  { id: "word-chain", name: "Word Chain", emoji: "🔗", desc: "Last letter → first letter. Don't choke", duration: 120 },
  { id: "trivia", name: "Quick Trivia", emoji: "🧐", desc: "Random trivia — who's smarter?", duration: 120 },
  { id: "reaction", name: "Tap Battle", emoji: "👆", desc: "Tap as fast as you can in 10s", duration: 30 },
  { id: "emoji-guess", name: "Emoji Guess", emoji: "🎨", desc: "Guess what the emoji combo means", duration: 120 },
  { id: "rank-it", name: "Rank It", emoji: "📊", desc: "Rank the same things — do you agree?", duration: 120 },
  { id: "number-guess", name: "Higher Lower", emoji: "🔢", desc: "Is the next number higher or lower?", duration: 90 },
];

// Speed WYR questions
const WYR_QS = [
  { a: "Never use your phone again", b: "Never eat your favorite food again" },
  { a: "Always be early", b: "Always be perfectly on time" },
  { a: "Read minds", b: "See the future" },
  { a: "Live in space", b: "Live underwater" },
  { a: "Free flights forever", b: "Free food forever" },
  { a: "No AC in summer", b: "No heating in winter" },
  { a: "Only whisper", b: "Only shout" },
  { a: "Unlimited money", b: "Unlimited time" },
  { a: "Be 10 again knowing what you know", b: "Be your age with $10M" },
  { a: "Give up music", b: "Give up movies" },
  { a: "Always be overdressed", b: "Always be underdressed" },
  { a: "Know how you die", b: "Know when you die" },
  { a: "Live without the internet", b: "Live without AC and heating" },
  { a: "Have a personal chef", b: "Have a personal driver" },
  { a: "Be able to fly", b: "Be able to breathe underwater" },
  { a: "Speak every language", b: "Play every instrument" },
  { a: "Never feel cold", b: "Never feel hot" },
  { a: "Relive your best day every week", b: "Skip your worst day every month" },
  { a: "Have a rewind button", b: "Have a pause button" },
  { a: "Be famous but alone", b: "Be unknown but deeply loved" },
  { a: "Only eat sweet food forever", b: "Only eat savory food forever" },
  { a: "Live in a treehouse", b: "Live on a houseboat" },
  { a: "Have free WiFi everywhere", b: "Have free coffee everywhere" },
  { a: "Never be stuck in traffic", b: "Never wait in a queue" },
  { a: "Have unlimited plane tickets", b: "Have unlimited concert tickets" },
  { a: "Date someone exactly like you", b: "Date your complete opposite" },
  { a: "Forget your first kiss", b: "Forget your first heartbreak" },
  { a: "Always say what's on your mind", b: "Never speak again" },
  { a: "Live in the past", b: "Live in the future" },
  { a: "Have a personal stylist", b: "Have a personal trainer" },
  { a: "Be the funniest person in the room", b: "Be the smartest person in the room" },
  { a: "Never use social media again", b: "Never watch TV again" },
  { a: "Have a photographic memory", b: "Have the ability to forget anything on command" },
  { a: "Always have to sing instead of speak", b: "Always have to dance instead of walk" },
  { a: "Win the lottery", b: "Live twice as long" },
  { a: "Be a famous actor", b: "Be a famous musician" },
  { a: "Have the power to heal others", b: "Have the power to heal yourself" },
  { a: "Never eat pizza again", b: "Never eat chocolate again" },
  { a: "Live in a city that never sleeps", b: "Live in a quiet countryside" },
  { a: "Be invisible for a day", b: "Be able to fly for a day" },
  { a: "Only listen to one song forever", b: "Never listen to the same song twice" },
  { a: "Have a pause button for life", b: "Have a skip button for life" },
  { a: "Always be 10 minutes late", b: "Always be 30 minutes early" },
  { a: "Have to eat the same meal every day", b: "Never eat the same meal twice" },
  { a: "Live without your phone for a year", b: "Live without your bed for a year" },
  { a: "Have a third eye", b: "Have a third arm" },
  { a: "Be the best player on a losing team", b: "Be the worst player on a winning team" },
  { a: "Control fire", b: "Control water" },
  { a: "Be stranded on an island alone", b: "Be stranded on an island with someone you hate" },
  { a: "Eat only spicy food forever", b: "Eat only bland food forever" },
  { a: "Have no elbows", b: "Have no knees" },
  { a: "Lose your long-term memory", b: "Lose your short-term memory" },
  { a: "Be able to talk to animals", b: "Be able to speak every human language" },
  { a: "Never cut your hair again", b: "Never cut your nails again" },
  { a: "Have a British accent forever", b: "Have an Australian accent forever" },
  { a: "Always have to tell the truth", b: "Always have to lie" },
  { a: "Be the hero", b: "Be the villain" },
  { a: "Have a magic carpet", b: "Have a time machine" },
  { a: "Never age physically", b: "Never age mentally" },
  { a: "Wake up in a new country every morning", b: "Wake up in the same place every morning" },
  { a: "Only be able to text", b: "Only be able to call" },
  { a: "Lose your sense of taste", b: "Lose your sense of smell" },
  { a: "Be a kid your whole life", b: "Be an adult your whole life" },
  { a: "Have one real best friend", b: "Have 20 acquaintances" },
  { a: "Live in a world with no rules", b: "Live in a world where you make the rules" },
  { a: "Be an early bird", b: "Be a night owl" },
  { a: "Go back 10 years with all your knowledge", b: "Skip ahead 10 years" },
  { a: "Have a personal robot", b: "Have a personal clone" },
  { a: "Never get angry", b: "Never get sad" },
  { a: "Be feared by everyone", b: "Be loved by everyone" },
  { a: "Have a dog-sized elephant", b: "Have an elephant-sized dog" },
  { a: "Live in a world without color", b: "Live in a world without sound" },
  { a: "Always be freezing cold", b: "Always be boiling hot" },
  { a: "Give up breakfast", b: "Give up dinner" },
  { a: "Be the funniest person alive but ugly", b: "Be the hottest person alive but boring" },
  { a: "Have your dream job but minimum wage", b: "Have a boring job but $500k salary" },
  { a: "Travel the world for free", b: "Have your dream house for free" },
  { a: "Know what everyone thinks of you", b: "Never know what anyone thinks of you" },
  { a: "Only wear formal clothes", b: "Only wear pajamas" },
  { a: "Eat a raw onion", b: "Drink a glass of hot sauce" },
  { a: "Have super speed", b: "Have super strength" },
  { a: "Lose all your money", b: "Lose all your photos and memories" },
  { a: "Be locked in a library for a week", b: "Be locked in a mall for a week" },
  { a: "Have no eyebrows", b: "Have one giant eyebrow" },
  { a: "Be a wizard", b: "Be a superhero" },
  { a: "Always have to rhyme when you speak", b: "Always have to speak in questions" },
  { a: "Live in the Harry Potter universe", b: "Live in the Marvel universe" },
  { a: "Have unlimited battery on your phone", b: "Have unlimited storage on your phone" },
  { a: "Never have to clean again", b: "Never have to cook again" },
  { a: "Be beautiful but stupid", b: "Be ugly but brilliant" },
  { a: "Be alone for 5 years", b: "Be constantly surrounded by people for 5 years" },
  { a: "Eat only McDonald's forever", b: "Eat only home-cooked meals forever" },
  { a: "Have no fingers", b: "Have no toes" },
  { a: "Live without mirrors", b: "Live without cameras" },
  { a: "Know every language on Earth", b: "Know how to code in every language" },
  { a: "Be a famous YouTuber", b: "Be a famous author" },
  { a: "Always have the perfect comeback", b: "Always know the right thing to say" },
  { a: "Sweat melted cheese", b: "Cry maple syrup" },
  { a: "Have legs as long as your fingers", b: "Have fingers as long as your legs" },
  { a: "Fight 1 horse-sized duck", b: "Fight 100 duck-sized horses" },
];

// Trivia questions
const TRIVIA_QS = [
  { q: "How many hearts does an octopus have?", a: "3", opts: ["1", "2", "3", "8"] },
  { q: "What's the smallest country in the world?", a: "Vatican City", opts: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"] },
  { q: "Which planet has the most moons?", a: "Saturn", opts: ["Jupiter", "Saturn", "Uranus", "Neptune"] },
  { q: "What year was the first iPhone released?", a: "2007", opts: ["2005", "2006", "2007", "2008"] },
  { q: "How many bones does a human have?", a: "206", opts: ["186", "196", "206", "216"] },
  { q: "What's the longest river in the world?", a: "Nile", opts: ["Amazon", "Nile", "Yangtze", "Mississippi"] },
  { q: "Which element has the chemical symbol 'Au'?", a: "Gold", opts: ["Silver", "Gold", "Aluminum", "Argon"] },
  { q: "How many time zones does Russia have?", a: "11", opts: ["7", "9", "11", "13"] },
  { q: "What is the hardest natural substance?", a: "Diamond", opts: ["Titanium", "Diamond", "Quartz", "Obsidian"] },
  { q: "How many strings does a standard guitar have?", a: "6", opts: ["4", "5", "6", "8"] },
  { q: "What is the largest organ in the human body?", a: "Skin", opts: ["Liver", "Skin", "Brain", "Lungs"] },
  { q: "Which country invented tea?", a: "China", opts: ["India", "Japan", "China", "England"] },
  { q: "How many colors are in a rainbow?", a: "7", opts: ["5", "6", "7", "8"] },
  { q: "What is the speed of light in km/s (approx)?", a: "300,000", opts: ["150,000", "300,000", "500,000", "1,000,000"] },
  { q: "Which animal can sleep for 3 years?", a: "Snail", opts: ["Sloth", "Koala", "Snail", "Bear"] },
  { q: "What year did the Titanic sink?", a: "1912", opts: ["1905", "1912", "1918", "1923"] },
  { q: "How many stomachs does a cow have?", a: "4", opts: ["1", "2", "3", "4"] },
  { q: "What is the capital of Australia?", a: "Canberra", opts: ["Sydney", "Melbourne", "Canberra", "Brisbane"] },
  { q: "Which planet is known as the Red Planet?", a: "Mars", opts: ["Venus", "Mars", "Jupiter", "Mercury"] },
  { q: "What does DNA stand for?", a: "Deoxyribonucleic acid", opts: ["Deoxyribonucleic acid", "Dinitrogen acid", "Dual nucleic acid", "Dynamic natural acid"] },
  { q: "How many teeth does an adult human have?", a: "32", opts: ["28", "30", "32", "36"] },
  { q: "Which country has the most islands?", a: "Sweden", opts: ["Indonesia", "Philippines", "Sweden", "Finland"] },
  { q: "What is the boiling point of water in Fahrenheit?", a: "212°F", opts: ["100°F", "180°F", "200°F", "212°F"] },
  { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", opts: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Picasso"] },
  { q: "What is the most spoken language in the world?", a: "English", opts: ["Mandarin", "English", "Spanish", "Hindi"] },
  { q: "How many continents are there?", a: "7", opts: ["5", "6", "7", "8"] },
  { q: "Which ocean is the largest?", a: "Pacific", opts: ["Atlantic", "Indian", "Pacific", "Arctic"] },
  { q: "What gas do plants absorb?", a: "Carbon dioxide", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"] },
  { q: "How many days are in a leap year?", a: "366", opts: ["364", "365", "366", "367"] },
  { q: "Which mammal can fly?", a: "Bat", opts: ["Flying squirrel", "Bat", "Sugar glider", "Lemur"] },
  { q: "What is the chemical formula for water?", a: "H2O", opts: ["HO2", "H2O", "H2O2", "OH"] },
  { q: "Which country is the Eiffel Tower in?", a: "France", opts: ["Italy", "France", "Spain", "Germany"] },
  { q: "How many legs does a spider have?", a: "8", opts: ["6", "8", "10", "12"] },
  { q: "What year did World War II end?", a: "1945", opts: ["1943", "1944", "1945", "1946"] },
  { q: "What is the largest mammal?", a: "Blue whale", opts: ["Elephant", "Blue whale", "Giraffe", "Whale shark"] },
  { q: "Which vitamin does the sun provide?", a: "Vitamin D", opts: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"] },
  { q: "What is the currency of Japan?", a: "Yen", opts: ["Won", "Yuan", "Yen", "Ringgit"] },
  { q: "How many planets are in our solar system?", a: "8", opts: ["7", "8", "9", "10"] },
  { q: "What is the tallest mountain in the world?", a: "Mount Everest", opts: ["K2", "Mount Everest", "Kangchenjunga", "Mount Kilimanjaro"] },
  { q: "Which animal is known as the King of the Jungle?", a: "Lion", opts: ["Tiger", "Lion", "Elephant", "Gorilla"] },
  { q: "What does 'www' stand for?", a: "World Wide Web", opts: ["World Wide Web", "Wide World Web", "Web World Wide", "World Web Wide"] },
  { q: "How many sides does a hexagon have?", a: "6", opts: ["5", "6", "7", "8"] },
  { q: "Which planet is closest to the sun?", a: "Mercury", opts: ["Venus", "Mercury", "Mars", "Earth"] },
  { q: "What is the largest desert in the world?", a: "Antarctica", opts: ["Sahara", "Arabian", "Gobi", "Antarctica"] },
  { q: "What blood type is the universal donor?", a: "O negative", opts: ["A positive", "B negative", "AB positive", "O negative"] },
  { q: "How many chambers does the human heart have?", a: "4", opts: ["2", "3", "4", "5"] },
  { q: "Which country gifted the Statue of Liberty to the US?", a: "France", opts: ["England", "France", "Spain", "Italy"] },
  { q: "What is the largest continent?", a: "Asia", opts: ["Africa", "Asia", "North America", "Europe"] },
  { q: "Which element makes up most of the atmosphere?", a: "Nitrogen", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"] },
  { q: "What is the fastest land animal?", a: "Cheetah", opts: ["Lion", "Cheetah", "Horse", "Gazelle"] },
  { q: "How many Great Lakes are there?", a: "5", opts: ["4", "5", "6", "7"] },
  { q: "What temperature (°C) does water freeze at?", a: "0", opts: ["-10", "0", "10", "32"] },
  { q: "Which planet has rings?", a: "Saturn", opts: ["Jupiter", "Saturn", "Neptune", "Uranus"] },
  { q: "How many weeks are in a year?", a: "52", opts: ["48", "50", "52", "54"] },
  { q: "What is the smallest bone in the human body?", a: "Stapes", opts: ["Stapes", "Femur", "Patella", "Radius"] },
  { q: "Which gas makes balloons float?", a: "Helium", opts: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"] },
  { q: "What year did humans first land on the moon?", a: "1969", opts: ["1965", "1967", "1969", "1971"] },
  { q: "How many zeros are in a million?", a: "6", opts: ["5", "6", "7", "9"] },
  { q: "What is sushi traditionally wrapped in?", a: "Seaweed", opts: ["Rice paper", "Seaweed", "Bamboo", "Lettuce"] },
  { q: "Which instrument has 88 keys?", a: "Piano", opts: ["Organ", "Piano", "Accordion", "Harpsichord"] },
  { q: "What is the most common eye color?", a: "Brown", opts: ["Blue", "Brown", "Green", "Hazel"] },
  { q: "How many Olympic rings are there?", a: "5", opts: ["4", "5", "6", "7"] },
  { q: "What is the main ingredient in guacamole?", a: "Avocado", opts: ["Tomato", "Avocado", "Lime", "Onion"] },
  { q: "Which planet is the hottest in our solar system?", a: "Venus", opts: ["Mercury", "Venus", "Mars", "Jupiter"] },
  { q: "How many dots are on a pair of dice?", a: "42", opts: ["36", "42", "48", "21"] },
  { q: "What country has the most people?", a: "India", opts: ["China", "India", "USA", "Indonesia"] },
  { q: "Which fruit is known as the king of fruits?", a: "Durian", opts: ["Mango", "Durian", "Jackfruit", "Pineapple"] },
  { q: "What does NASA stand for?", a: "National Aeronautics and Space Administration", opts: ["National Aeronautics and Space Administration", "North American Space Agency", "National Aerospace and Space Administration", "National Air and Space Administration"] },
  { q: "How many Harry Potter books are there?", a: "7", opts: ["5", "6", "7", "8"] },
  { q: "What is the longest bone in the human body?", a: "Femur", opts: ["Tibia", "Femur", "Humerus", "Spine"] },
  { q: "Which metal is liquid at room temperature?", a: "Mercury", opts: ["Lead", "Mercury", "Gallium", "Tin"] },
  { q: "What is the national sport of Canada?", a: "Lacrosse", opts: ["Hockey", "Lacrosse", "Curling", "Baseball"] },
  { q: "How many keys are on a standard keyboard?", a: "104", opts: ["88", "96", "101", "104"] },
  { q: "Which animal has the longest lifespan?", a: "Tortoise", opts: ["Elephant", "Whale", "Tortoise", "Parrot"] },
  { q: "What is the rarest blood type?", a: "AB negative", opts: ["O negative", "B negative", "A negative", "AB negative"] },
  { q: "Which country invented pizza?", a: "Italy", opts: ["Greece", "Italy", "France", "USA"] },
  { q: "What is the smallest planet in our solar system?", a: "Mercury", opts: ["Mars", "Mercury", "Pluto", "Venus"] },
  { q: "How many points is a touchdown worth in football?", a: "6", opts: ["5", "6", "7", "3"] },
  { q: "What is the most consumed drink in the world?", a: "Tea", opts: ["Coffee", "Water", "Tea", "Beer"] },
  { q: "How many cards are in a standard deck?", a: "52", opts: ["48", "50", "52", "54"] },
  { q: "What is the largest bird in the world?", a: "Ostrich", opts: ["Eagle", "Ostrich", "Condor", "Albatross"] },
  { q: "Which vitamin is found in oranges?", a: "Vitamin C", opts: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"] },
  { q: "What is the deepest ocean?", a: "Pacific", opts: ["Atlantic", "Indian", "Pacific", "Arctic"] },
  { q: "How many letters are in the English alphabet?", a: "26", opts: ["24", "25", "26", "27"] },
  { q: "Which planet is known as Earth's twin?", a: "Venus", opts: ["Mars", "Venus", "Mercury", "Jupiter"] },
  { q: "What is the most popular sport in the world?", a: "Soccer", opts: ["Cricket", "Basketball", "Soccer", "Tennis"] },
  { q: "How many faces does a cube have?", a: "6", opts: ["4", "6", "8", "12"] },
  { q: "What is the largest country by area?", a: "Russia", opts: ["Canada", "China", "USA", "Russia"] },
  { q: "Which animal is the tallest?", a: "Giraffe", opts: ["Elephant", "Giraffe", "Camel", "Moose"] },
  { q: "What year was Google founded?", a: "1998", opts: ["1996", "1998", "2000", "2002"] },
  { q: "How many calories are in a glass of water?", a: "0", opts: ["0", "2", "5", "10"] },
  { q: "What is the capital of Canada?", a: "Ottawa", opts: ["Toronto", "Vancouver", "Ottawa", "Montreal"] },
  { q: "Which animal can change its color?", a: "Chameleon", opts: ["Octopus", "Chameleon", "Frog", "Gecko"] },
];

// Memory cards (emojis to match)
const MEMORY_EMOJIS = [
  "🌸", "🦋", "🌙", "⭐", "🎵", "💜", "🔥", "🌊",
  "🍕", "🎀", "🌈", "🐱", "🎲", "💎", "🌺", "🦊",
  "🍩", "🎭", "🌴", "🐙", "🎸", "🍀", "🦄", "🌻",
];

// Emoji Guess puzzles — emoji combos with answers
const EMOJI_PUZZLES = [
  { emojis: "🎬🦁👑", answer: "The Lion King", opts: ["The Lion King", "Madagascar", "Jungle Book", "Tarzan"] },
  { emojis: "🧙‍♂️💍🌋", answer: "Lord of the Rings", opts: ["Lord of the Rings", "The Hobbit", "Harry Potter", "Narnia"] },
  { emojis: "🕷️🧑‍🦱🏙️", answer: "Spider-Man", opts: ["Spider-Man", "Batman", "Superman", "Ant-Man"] },
  { emojis: "🚢❄️💔", answer: "Titanic", opts: ["Titanic", "Frozen", "Ice Age", "The Notebook"] },
  { emojis: "👻🔫👨‍👨‍👦", answer: "Ghostbusters", opts: ["Ghostbusters", "Scooby-Doo", "Casper", "The Exorcist"] },
  { emojis: "🐠🔍🌊", answer: "Finding Nemo", opts: ["Finding Nemo", "Moana", "Shark Tale", "The Little Mermaid"] },
  { emojis: "🏠⬆️🎈", answer: "Up", opts: ["Up", "Inside Out", "Wall-E", "Ratatouille"] },
  { emojis: "❄️👸⛄", answer: "Frozen", opts: ["Frozen", "Ice Age", "Snow White", "Narnia"] },
  { emojis: "🦖🏝️⚡", answer: "Jurassic Park", opts: ["Jurassic Park", "King Kong", "Godzilla", "Avatar"] },
  { emojis: "🧪👨‍🔬💚", answer: "Breaking Bad", opts: ["Breaking Bad", "The Hulk", "Dexter", "Better Call Saul"] },
  { emojis: "🐀👨‍🍳🇫🇷", answer: "Ratatouille", opts: ["Ratatouille", "Chef", "Julie & Julia", "Cloudy with Meatballs"] },
  { emojis: "🤖❤️🌱", answer: "Wall-E", opts: ["Wall-E", "Big Hero 6", "I, Robot", "Terminator"] },
  { emojis: "🧛‍♂️🌲💕", answer: "Twilight", opts: ["Twilight", "Dracula", "Vampire Diaries", "True Blood"] },
  { emojis: "🏴‍☠️💀🗺️", answer: "Pirates of the Caribbean", opts: ["Pirates of the Caribbean", "Treasure Island", "One Piece", "Peter Pan"] },
  { emojis: "👽📞🏠", answer: "E.T.", opts: ["E.T.", "Alien", "Men in Black", "Mars Attacks"] },
  { emojis: "🎩🐇⏰", answer: "Alice in Wonderland", opts: ["Alice in Wonderland", "Peter Pan", "Pinocchio", "Wizard of Oz"] },
  { emojis: "🦈🌊😱", answer: "Jaws", opts: ["Jaws", "Sharknado", "The Meg", "Deep Blue Sea"] },
  { emojis: "🧙‍♂️⚡👓", answer: "Harry Potter", opts: ["Harry Potter", "Merlin", "Lord of the Rings", "Doctor Strange"] },
  { emojis: "🐒🍌👑", answer: "Donkey Kong", opts: ["Donkey Kong", "King Kong", "Tarzan", "Planet of the Apes"] },
  { emojis: "🏎️💨🏁", answer: "Fast & Furious", opts: ["Fast & Furious", "Cars", "Need for Speed", "Rush"] },
  { emojis: "🌹👹📚", answer: "Beauty and the Beast", opts: ["Beauty and the Beast", "Shrek", "Phantom of the Opera", "Hunchback"] },
  { emojis: "🎸🤘👻", answer: "Coco", opts: ["Coco", "Rock of Ages", "School of Rock", "Guitar Hero"] },
  { emojis: "🧊🐿️🌍", answer: "Ice Age", opts: ["Ice Age", "Frozen", "Happy Feet", "March of the Penguins"] },
  { emojis: "👸💤🍎", answer: "Snow White", opts: ["Snow White", "Sleeping Beauty", "Cinderella", "Rapunzel"] },
  { emojis: "🤠🚀🧸", answer: "Toy Story", opts: ["Toy Story", "Space Cowboys", "The Lego Movie", "Wreck-It Ralph"] },
];

// Rank It categories — items to rank 1-4
const RANK_ITEMS = [
  { title: "Best pizza topping", items: ["Pepperoni", "Mushroom", "Pineapple", "Margherita"] },
  { title: "Best season", items: ["Spring", "Summer", "Autumn", "Winter"] },
  { title: "Best pet", items: ["Dog", "Cat", "Fish", "Hamster"] },
  { title: "Best way to relax", items: ["Netflix", "Bath", "Nap", "Walk"] },
  { title: "Best date activity", items: ["Dinner", "Movie", "Hike", "Cooking together"] },
  { title: "Best social media", items: ["Instagram", "TikTok", "YouTube", "Twitter"] },
  { title: "Best breakfast", items: ["Pancakes", "Eggs", "Cereal", "Toast"] },
  { title: "Best superpower", items: ["Flying", "Invisibility", "Time travel", "Telepathy"] },
  { title: "Best holiday", items: ["Christmas", "Halloween", "Birthday", "New Year's"] },
  { title: "Best music genre", items: ["Pop", "Hip Hop", "Rock", "R&B"] },
  { title: "Best comfort food", items: ["Mac & Cheese", "Pizza", "Ice Cream", "Ramen"] },
  { title: "Best way to spend $100", items: ["Clothes", "Food", "Concert", "Save it"] },
  { title: "Best school subject", items: ["Math", "English", "Science", "Art"] },
  { title: "Best movie genre", items: ["Comedy", "Action", "Romance", "Horror"] },
  { title: "Best city vibe", items: ["New York", "Paris", "Tokyo", "London"] },
  { title: "Best weekend activity", items: ["Sleep in", "Brunch", "Adventure", "Movie marathon"] },
  { title: "Best drink", items: ["Coffee", "Tea", "Boba", "Smoothie"] },
  { title: "Best love language", items: ["Words", "Touch", "Gifts", "Quality time"] },
  { title: "Best late night snack", items: ["Chips", "Ice cream", "Leftovers", "Cereal"] },
  { title: "Best rainy day activity", items: ["Read", "Game", "Cook", "Movie"] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function MiniGames({ room, playerId, roomData, onBack }) {
  const [screen, setScreen] = useState("lobby"); // lobby | playing | results
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const db = getFirestore();
  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  const theirOnlineTs = partnerId ? roomData?.[`online_${partnerId}`] : null;
  const theirOnline = theirOnlineTs && (Date.now() - (theirOnlineTs?.toDate?.()?.getTime?.() || 0) < 60000);

  const leaderboard = roomData?.leaderboard || {};
  const myWins = leaderboard[playerId] || 0;
  const theirWins = leaderboard[partnerId] || 0;

  // Subscribe to active game session
  useEffect(() => {
    if (!room) return;
    return onSnapshot(doc(db, "rooms", room, "game", "current"), (snap) => {
      setGameState(snap.exists() ? snap.data() : null);
    });
  }, [room]);

  // Timer — when time's up, end the game properly (clears Firebase)
  const timerEndedRef = useRef(false);
  useEffect(() => {
    if (screen !== "playing" || !gameState) return;
    timerEndedRef.current = false;
    const end = gameState.endsAt?.toDate?.()?.getTime?.() || (Date.now() + 120000);
    function tick() {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTimer(left);
      if (left <= 0 && !timerEndedRef.current) {
        timerEndedRef.current = true;
        clearInterval(timerRef.current);
        // Determine winner from scores and end properly
        const myScore = gameState[`score_${playerId}`] || gameState[`wyrscore_${playerId}`] || gameState[`taps_${playerId}`] || 0;
        const theirScore = gameState[`score_${partnerId}`] || gameState[`wyrscore_${partnerId}`] || gameState[`taps_${partnerId}`] || 0;
        const winner = myScore > theirScore ? playerId : theirScore > myScore ? partnerId : null;
        endGame(winner);
      }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, gameState?.endsAt]);

  async function startGame(id) {
    const game = GAMES.find((g) => g.id === id);

    let data = {
      gameId: id,
      startedBy: playerId,
      startedAt: serverTimestamp(),
      endsAt: null, // Timer starts when both join
      ready: { [playerId]: true },
      duration: game.duration,
    };

    // Game-specific init
    if (id === "speed-wyr") {
      data.questions = shuffle(WYR_QS).slice(0, 5);
      data.round = 0;
    } else if (id === "memory") {
      const pairs = shuffle(MEMORY_EMOJIS).slice(0, 6);
      data.board = shuffle([...pairs, ...pairs]);
      data.revealed = [];
      data.matched = [];
      data.turn = playerId;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "word-chain") {
      data.words = [];
      data.turn = playerId;
    } else if (id === "trivia") {
      data.questions = shuffle(TRIVIA_QS).slice(0, 5);
      data.round = 0;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "reaction") {
      data[`taps_${playerId}`] = 0;
      data[`taps_${partnerId}`] = 0;
    } else if (id === "emoji-guess") {
      data.puzzles = shuffle(EMOJI_PUZZLES).slice(0, 5);
      data.round = 0;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "rank-it") {
      data.items = shuffle(RANK_ITEMS).slice(0, 5);
      data.round = 0;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "number-guess") {
      data.numbers = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1);
      data.round = 0;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
      data.turn = playerId;
    }

    await setDoc(doc(db, "rooms", room, "game", "current"), data);
    setGameId(id);
    setScreen("waiting");
  }

  // Join game — mark self as ready
  async function joinGame() {
    if (!gameState) return;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      ready: { ...gameState.ready, [playerId]: true },
    }, { merge: true });
  }

  // Detect when both players are ready → start the timer
  useEffect(() => {
    if (!gameState?.ready || !gameState?.gameId || gameState?.endsAt) return;
    const bothReady = gameState.ready[playerId] && gameState.ready[partnerId];
    if (bothReady) {
      const dur = gameState.duration || GAMES.find(g => g.id === gameState.gameId)?.duration || 120;
      const endsAt = new Date(Date.now() + dur * 1000);
      setDoc(doc(db, "rooms", room, "game", "current"), { endsAt }, { merge: true });
      setScreen("playing");
    }
  }, [gameState?.ready, gameState?.endsAt]);

  // Detect game started by partner — go to waiting/playing
  useEffect(() => {
    if (gameState && gameState.gameId && screen === "lobby") {
      setGameId(gameState.gameId);
      // If already has endsAt, both are ready — go straight to playing
      if (gameState.endsAt) {
        setScreen("playing");
      } else {
        // Partner started, I need to join
        setScreen("waiting");
        joinGame();
      }
    }
    // Game was cleared (cancel or end) — return to lobby
    if (gameState && !gameState.gameId && (screen === "waiting" || screen === "playing")) {
      setScreen("lobby");
      setGameId(null);
    }
  }, [gameState?.gameId]);

  const [lastWinner, setLastWinner] = useState(null);

  const PRIZE_GIFTS = ["🏆", "⭐", "🌟", "🎖️", "💎"];

  async function endGame(winnerId) {
    if (winnerId) {
      const lb = { ...leaderboard };
      lb[winnerId] = (lb[winnerId] || 0) + 1;
      // Winner gets a gift token to give to partner
      const gifts = roomData?.gameGifts || {};
      gifts[winnerId] = (gifts[winnerId] || 0) + 1;
      await updateDoc(doc(db, "rooms", room), { leaderboard: lb, gameGifts: gifts });
    }
    setLastWinner(winnerId);
    await setDoc(doc(db, "rooms", room, "game", "current"), { gameId: null });
    setScreen("results");
  }

  async function sendPrize() {
    if (!lastWinner) return;
    const gifts = roomData?.gameGifts || {};
    if ((gifts[lastWinner] || 0) <= 0) return;
    gifts[lastWinner] = gifts[lastWinner] - 1;
    await updateDoc(doc(db, "rooms", room), { gameGifts: gifts });
    // Send a gift in the gifts collection
    await setDoc(doc(db, "rooms", room, "gifts", Date.now().toString()), {
      emoji: PRIZE_GIFTS[Math.floor(Math.random() * PRIZE_GIFTS.length)],
      name: "Game Trophy",
      from: lastWinner === playerId ? me?.name : them?.name,
      to: lastWinner === playerId ? them?.name : me?.name,
      message: "Won it fair and square! 🏆",
      at: serverTimestamp(),
    });
  }

  async function backToLobby() {
    // Clear the game from Firebase so both players are released
    await setDoc(doc(db, "rooms", room, "game", "current"), { gameId: null });
    setScreen("lobby");
    setGameId(null);
    setLastWinner(null);
  }

  // ====== LOBBY ======
  if (screen === "lobby") {
    return (
      <div className="page games fade-in">
        <div className="games-header">
          <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
          <h2>🎮 Game Night</h2>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <div className={`lb-player ${myWins >= theirWins ? "leading" : ""}`}>
            <span className="lb-name">{me?.name}</span>
            <span className="lb-score">{myWins}</span>
          </div>
          <span className="lb-vs">vs</span>
          <div className={`lb-player ${theirWins > myWins ? "leading" : ""}`}>
            <span className="lb-name">{them?.name}</span>
            <span className="lb-score">{theirWins}</span>
          </div>
        </div>

        {!theirOnline && (
          <div className="games-offline">
            <p>⏳ Waiting for {them?.name} to come online</p>
            <p className="os-hint">Both players need to be online to play games</p>
          </div>
        )}

        {theirOnline && (
          <div className="game-list">
            {GAMES.map((g) => (
              <button key={g.id} className="game-card" onClick={() => startGame(g.id)}>
                <span className="game-emoji">{g.emoji}</span>
                <div className="game-info">
                  <span className="game-name">{g.name}</span>
                  <span className="game-desc">{g.desc}</span>
                </div>
                <span className="game-time">{g.duration >= 60 ? Math.floor(g.duration / 60) + "m" : g.duration + "s"}</span>
              </button>
            ))}
          </div>
        )}

        <button className="btn btn-ghost" onClick={() => setScreen("tutorial")} style={{ marginTop: ".5rem" }}>
          How to Play
        </button>
      </div>
    );
  }

  // ====== WAITING FOR PARTNER ======
  if (screen === "waiting") {
    const gameName = GAMES.find((g) => g.id === gameId)?.name || "Game";
    const gameEmoji = GAMES.find((g) => g.id === gameId)?.emoji || "🎮";
    const iStarted = gameState?.startedBy === playerId;
    const partnerReady = gameState?.ready?.[partnerId];

    return (
      <div className="page games fade-in">
        <div className="game-waiting-screen">
          <span className="game-waiting-emoji">{gameEmoji}</span>
          <h2>{gameName}</h2>
          {iStarted && !partnerReady && (
            <>
              <div className="pulse-dot" style={{ width: 12, height: 12, margin: "1rem auto" }} />
              <p>Waiting for {them?.name} to join...</p>
              <p className="os-hint">They'll be pulled in automatically</p>
            </>
          )}
          {!iStarted && !partnerReady && (
            <>
              <p>{them?.name} wants to play!</p>
              <button className="btn btn-primary" onClick={joinGame} style={{ marginTop: "1rem" }}>
                Join Game
              </button>
            </>
          )}
          {partnerReady && (
            <>
              <div className="pulse-dot" style={{ width: 12, height: 12, margin: "1rem auto" }} />
              <p>Both ready — starting...</p>
            </>
          )}
          <button className="btn btn-ghost" onClick={backToLobby} style={{ marginTop: "1.5rem" }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ====== TUTORIAL (from lobby) ======
  if (screen === "tutorial") {
    return <Tutorial type="games" onBack={() => setScreen("lobby")} />;
  }

  // ====== PLAYING ======
  if (screen === "playing" && gameState) {
    return (
      <div className="page games fade-in">
        <div className="games-header">
          <span className="game-timer">⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>
          <span className="game-title">{GAMES.find((g) => g.id === gameId)?.emoji} {GAMES.find((g) => g.id === gameId)?.name}</span>
        </div>

        {/* Speed WYR */}
        {gameId === "speed-wyr" && <SpeedWYR gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Memory */}
        {gameId === "memory" && <MemoryGame gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Reaction / Tap Battle */}
        {gameId === "reaction" && <TapBattle gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} timer={timer} onEnd={endGame} />}

        {/* Word Chain */}
        {gameId === "word-chain" && <WordChain gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Trivia */}
        {gameId === "trivia" && <TriviaGame gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Emoji Guess */}
        {gameId === "emoji-guess" && <EmojiGuess gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Rank It */}
        {gameId === "rank-it" && <RankIt gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Higher Lower */}
        {gameId === "number-guess" && <HigherLower gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}
      </div>
    );
  }

  // ====== RESULTS ======
  const winnerName = lastWinner === playerId ? me?.name : lastWinner === partnerId ? them?.name : null;
  const iWon = lastWinner === playerId;

  return (
    <div className="page games fade-in">
      <div className="games-result">
        <h2>{lastWinner ? "🏆 Winner!" : "🤝 It's a tie!"}</h2>
        {winnerName && <p className="winner-name">{winnerName} wins!</p>}

        <div className="leaderboard big">
          <div className={`lb-player ${myWins >= theirWins ? "leading" : ""}`}>
            <span className="lb-name">{me?.name}</span>
            <span className="lb-score">{myWins}</span>
          </div>
          <span className="lb-vs">vs</span>
          <div className={`lb-player ${theirWins > myWins ? "leading" : ""}`}>
            <span className="lb-name">{them?.name}</span>
            <span className="lb-score">{theirWins}</span>
          </div>
        </div>

        {iWon && (
          <button className="btn btn-secondary" onClick={sendPrize}>
            🏆 Send Trophy to {them?.name}
          </button>
        )}

        <button className="btn btn-primary" onClick={backToLobby}>Play Again</button>
        <button className="btn btn-ghost" onClick={async () => { await setDoc(doc(db, "rooms", room, "game", "current"), { gameId: null }); onBack(); }}>Back to Hub</button>
      </div>
    </div>
  );
}

// ====== SPEED WYR COMPONENT ======
function SpeedWYR({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const q = gs.questions?.[round];
  const myPick = gs[`r${round}_${playerId}`];
  const theirPick = gs[`r${round}_${partnerId}`];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); }, [round]);

  useEffect(() => {
    if (myPick && theirPick && !revealed) {
      setRevealed(true);
      setTimeout(async () => {
        if (round + 1 >= (gs.questions?.length || 5)) {
          const myScore = gs[`wyrscore_${playerId}`] || 0;
          const theirScore = gs[`wyrscore_${partnerId}`] || 0;
          await onEnd(myScore >= theirScore ? playerId : partnerId);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { ...gs, round: round + 1 }, { merge: true });
        }
      }, 2000);
    }
  }, [myPick, theirPick, revealed]);

  async function pick(choice) {
    const matched = theirPick === choice;
    const scoreKey = `wyrscore_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`r${round}_${playerId}`]: choice,
      [scoreKey]: (gs[scoreKey] || 0) + (matched ? 1 : 0),
    }, { merge: true });
  }

  if (!q) return <p>Loading...</p>;

  return (
    <div className="wyr-game">
      <p className="wyr-round">Round {round + 1}/{gs.questions?.length || 5}</p>
      <h3 className="wyr-q">Would you rather...</h3>
      {!myPick ? (
        <div className="choice-buttons">
          <button className="choice-btn a" onClick={() => pick("a")}>{q.a}</button>
          <span className="choice-or">or</span>
          <button className="choice-btn b" onClick={() => pick("b")}>{q.b}</button>
        </div>
      ) : !theirPick ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="wyr-reveal fade-in">
          <div className={`reveal-choice ${myPick === theirPick ? "match" : "diff"}`}>
            {myPick === theirPick ? "Match! 🎉" : "Different! 😅"}
          </div>
        </div>
      )}
    </div>
  );
}

// ====== MEMORY MATCH ======
function MemoryGame({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const board = gs.board || [];
  const revealed = gs.revealed || [];
  const matched = gs.matched || [];
  const turn = gs.turn;
  const isMyTurn = turn === playerId;
  const myScore = gs[`score_${playerId}`] || 0;
  const theirScore = gs[`score_${partnerId}`] || 0;

  async function flipCard(idx) {
    if (!isMyTurn || revealed.includes(idx) || matched.includes(idx)) return;

    const newRevealed = [...revealed, idx];

    if (newRevealed.length === 2) {
      const [a, b] = newRevealed;
      if (board[a] === board[b]) {
        const newMatched = [...matched, a, b];
        const scoreKey = `score_${playerId}`;
        const update = { revealed: [], matched: newMatched, [scoreKey]: (gs[scoreKey] || 0) + 1 };
        if (newMatched.length >= board.length) {
          await setDoc(doc(db, "rooms", room, "game", "current"), update, { merge: true });
          setTimeout(() => onEnd(myScore + 1 > theirScore ? playerId : theirScore > myScore + 1 ? partnerId : null), 1000);
          return;
        }
        await setDoc(doc(db, "rooms", room, "game", "current"), update, { merge: true });
      } else {
        await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: newRevealed }, { merge: true });
        setTimeout(async () => {
          await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: [], turn: partnerId }, { merge: true });
        }, 1000);
      }
    } else {
      await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: newRevealed }, { merge: true });
    }
  }

  return (
    <div className="memory-game">
      <div className="memory-scores">
        <span className={isMyTurn ? "active" : ""}>{me?.name}: {myScore}</span>
        <span className={!isMyTurn ? "active" : ""}>{them?.name}: {theirScore}</span>
      </div>
      <p className="os-hint">{isMyTurn ? "Your turn — flip two cards" : `${them?.name}'s turn...`}</p>
      <div className="memory-board">
        {board.map((emoji, i) => {
          const show = revealed.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              className={`mem-card ${show ? "flipped" : ""} ${matched.includes(i) ? "matched" : ""}`}
              onClick={() => flipCard(i)}
              disabled={!isMyTurn || show}
            >
              {show ? emoji : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====== TAP BATTLE ======
function TapBattle({ gs, db, room, playerId, partnerId, me, them, timer, onEnd }) {
  const myTaps = gs[`taps_${playerId}`] || 0;
  const theirTaps = gs[`taps_${partnerId}`] || 0;

  async function tap() {
    const key = `taps_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), { [key]: (gs[key] || 0) + 1 }, { merge: true });
  }

  useEffect(() => {
    if (timer <= 0 && myTaps + theirTaps > 0) {
      onEnd(myTaps > theirTaps ? playerId : theirTaps > myTaps ? partnerId : null);
    }
  }, [timer]);

  return (
    <div className="tap-game">
      <div className="tap-scores">
        <div className="tap-score mine"><span>{myTaps}</span><span className="tap-name">{me?.name}</span></div>
        <span className="tap-vs">vs</span>
        <div className="tap-score theirs"><span>{theirTaps}</span><span className="tap-name">{them?.name}</span></div>
      </div>
      <button className="tap-btn" onClick={tap}>
        <span>👆</span>
        <span>TAP!</span>
      </button>
      <p className="os-hint">Tap as fast as you can!</p>
    </div>
  );
}

// ====== WORD CHAIN ======
function WordChain({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const [word, setWord] = useState("");
  const words = gs.words || [];
  const turn = gs.turn;
  const isMyTurn = turn === playerId;
  const lastWord = words[words.length - 1];
  const lastLetter = lastWord?.word?.slice(-1)?.toLowerCase();

  async function submitWord() {
    if (!word.trim()) return;
    const w = word.trim().toLowerCase();
    if (lastLetter && w[0] !== lastLetter) return;
    if (words.some((x) => x.word.toLowerCase() === w)) return;
    const newWords = [...words, { word: w, by: playerId }];
    await setDoc(doc(db, "rooms", room, "game", "current"), { words: newWords, turn: partnerId }, { merge: true });
    setWord("");
  }

  async function giveUp() {
    await onEnd(partnerId);
  }

  return (
    <div className="chain-game">
      <div className="chain-words">
        {words.slice(-8).map((w, i) => (
          <div key={i} className={`chain-word ${w.by === playerId ? "mine" : "theirs"}`}>
            {w.word}
          </div>
        ))}
      </div>
      {isMyTurn ? (
        <div className="chain-input">
          {lastLetter && <p className="chain-hint">Start with: <strong>{lastLetter.toUpperCase()}</strong></p>}
          <div className="chain-row">
            <input className="input" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Type a word..." maxLength={30} onKeyDown={(e) => e.key === "Enter" && submitWord()} />
            <button className="btn btn-primary" onClick={submitWord} style={{ width: "auto", padding: ".7rem 1rem" }}>→</button>
          </div>
          <button className="btn btn-ghost" onClick={giveUp} style={{ fontSize: ".8rem" }}>Give up 🏳️</button>
        </div>
      ) : (
        <p className="os-hint">Waiting for {them?.name}...</p>
      )}
    </div>
  );
}

// ====== TRIVIA ======
function TriviaGame({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const q = gs.questions?.[round];
  const myPick = gs[`t${round}_${playerId}`];
  const theirPick = gs[`t${round}_${partnerId}`];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); }, [round]);

  useEffect(() => {
    if (myPick && theirPick && !revealed) {
      setRevealed(true);
      setTimeout(async () => {
        if (round + 1 >= (gs.questions?.length || 5)) {
          const ms = gs[`score_${playerId}`] || 0;
          const ts = gs[`score_${partnerId}`] || 0;
          await onEnd(ms > ts ? playerId : ts > ms ? partnerId : null);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { round: round + 1 }, { merge: true });
        }
      }, 2000);
    }
  }, [myPick, theirPick, revealed]);

  async function answer(opt) {
    const correct = opt === q.a;
    const scoreKey = `score_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`t${round}_${playerId}`]: opt,
      [scoreKey]: (gs[scoreKey] || 0) + (correct ? 1 : 0),
    }, { merge: true });
  }

  if (!q) return <p>Loading...</p>;

  return (
    <div className="trivia-game">
      <p className="wyr-round">Q{round + 1}/{gs.questions?.length || 5}</p>
      <h3 className="trivia-q">{q.q}</h3>
      {!myPick ? (
        <div className="trivia-opts">
          {q.opts.map((o) => (
            <button key={o} className="trivia-opt" onClick={() => answer(o)}>{o}</button>
          ))}
        </div>
      ) : !theirPick ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="trivia-reveal fade-in">
          <p>Correct: <strong>{q.a}</strong></p>
          <p>{me?.name}: {myPick === q.a ? "✅" : "❌"} | {them?.name}: {theirPick === q.a ? "✅" : "❌"}</p>
        </div>
      )}
      <div className="trivia-scores">
        <span>{me?.name}: {gs[`score_${playerId}`] || 0}</span>
        <span>{them?.name}: {gs[`score_${partnerId}`] || 0}</span>
      </div>
    </div>
  );
}

// ====== EMOJI GUESS ======
function EmojiGuess({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const puzzle = gs.puzzles?.[round];
  const myPick = gs[`eg${round}_${playerId}`];
  const theirPick = gs[`eg${round}_${partnerId}`];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); }, [round]);

  useEffect(() => {
    if (myPick && theirPick && !revealed) {
      setRevealed(true);
      setTimeout(async () => {
        if (round + 1 >= (gs.puzzles?.length || 5)) {
          const ms = gs[`score_${playerId}`] || 0;
          const ts = gs[`score_${partnerId}`] || 0;
          await onEnd(ms > ts ? playerId : ts > ms ? partnerId : null);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { round: round + 1 }, { merge: true });
        }
      }, 2500);
    }
  }, [myPick, theirPick, revealed]);

  async function answer(opt) {
    const correct = opt === puzzle.answer;
    const scoreKey = `score_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`eg${round}_${playerId}`]: opt,
      [scoreKey]: (gs[scoreKey] || 0) + (correct ? 1 : 0),
    }, { merge: true });
  }

  if (!puzzle) return <p>Loading...</p>;

  return (
    <div className="trivia-game">
      <p className="wyr-round">Round {round + 1}/{gs.puzzles?.length || 5}</p>
      <div style={{ fontSize: "2.5rem", margin: ".75rem 0", letterSpacing: ".1em" }}>{puzzle.emojis}</div>
      <h3 className="trivia-q" style={{ fontSize: ".9rem" }}>What movie/show is this?</h3>
      {!myPick ? (
        <div className="trivia-opts">
          {puzzle.opts.map((o) => (
            <button key={o} className="trivia-opt" onClick={() => answer(o)}>{o}</button>
          ))}
        </div>
      ) : !theirPick ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="trivia-reveal fade-in">
          <p>Answer: <strong>{puzzle.answer}</strong></p>
          <p>{me?.name}: {myPick === puzzle.answer ? "✅" : "❌"} | {them?.name}: {theirPick === puzzle.answer ? "✅" : "❌"}</p>
        </div>
      )}
      <div className="trivia-scores">
        <span>{me?.name}: {gs[`score_${playerId}`] || 0}</span>
        <span>{them?.name}: {gs[`score_${partnerId}`] || 0}</span>
      </div>
    </div>
  );
}

// ====== RANK IT ======
function RankIt({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const item = gs.items?.[round];
  const myRank = gs[`rk${round}_${playerId}`];
  const theirRank = gs[`rk${round}_${partnerId}`];
  const [ranking, setRanking] = useState([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); setRanking([]); }, [round]);

  useEffect(() => {
    if (myRank && theirRank && !revealed) {
      setRevealed(true);
      // Score: count matching positions
      const matches = myRank.filter((r, i) => r === theirRank[i]).length;
      setTimeout(async () => {
        const scoreKey = `score_${playerId}`;
        const partnerKey = `score_${partnerId}`;
        const myMatches = myRank.filter((r, i) => r === theirRank[i]).length;
        await setDoc(doc(db, "rooms", room, "game", "current"), {
          [scoreKey]: (gs[scoreKey] || 0) + myMatches,
          [partnerKey]: (gs[partnerKey] || 0) + myMatches,
        }, { merge: true });
        if (round + 1 >= (gs.items?.length || 5)) {
          const ms = (gs[scoreKey] || 0) + myMatches;
          const ts = (gs[partnerKey] || 0) + myMatches;
          await onEnd(ms > ts ? playerId : ts > ms ? partnerId : null);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { round: round + 1 }, { merge: true });
        }
      }, 3000);
    }
  }, [myRank, theirRank, revealed]);

  function toggleItem(itemName) {
    if (myRank) return;
    if (ranking.includes(itemName)) {
      setRanking(ranking.filter((r) => r !== itemName));
    } else if (ranking.length < 4) {
      setRanking([...ranking, itemName]);
    }
  }

  async function submitRanking() {
    if (ranking.length !== 4) return;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`rk${round}_${playerId}`]: ranking,
    }, { merge: true });
  }

  if (!item) return <p>Loading...</p>;

  return (
    <div className="trivia-game">
      <p className="wyr-round">Round {round + 1}/{gs.items?.length || 5}</p>
      <h3 className="trivia-q">{item.title}</h3>
      <p className="os-hint" style={{ marginBottom: ".5rem" }}>Tap items in order: best → worst</p>
      {!myRank ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: ".3rem", marginBottom: ".5rem" }}>
            {item.items.map((name) => {
              const pos = ranking.indexOf(name);
              return (
                <button
                  key={name}
                  className={`trivia-opt ${pos >= 0 ? "selected" : ""}`}
                  onClick={() => toggleItem(name)}
                  style={{
                    textAlign: "left", padding: ".6rem .75rem",
                    border: pos >= 0 ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,.08)",
                    background: pos >= 0 ? "var(--accent-soft)" : "var(--bg-card)",
                  }}
                >
                  {pos >= 0 ? `${pos + 1}. ` : ""}{name}
                </button>
              );
            })}
          </div>
          <button className="btn btn-primary" onClick={submitRanking} disabled={ranking.length !== 4} style={{ fontSize: ".85rem" }}>
            Lock In
          </button>
        </>
      ) : !theirRank ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="trivia-reveal fade-in">
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", fontSize: ".8rem" }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: ".3rem" }}>{me?.name}</p>
              {myRank.map((r, i) => <p key={i}>{i + 1}. {r}</p>)}
            </div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: ".3rem" }}>{them?.name}</p>
              {theirRank.map((r, i) => <p key={i} style={{ color: r === myRank[i] ? "var(--green, #22c55e)" : "var(--text)" }}>{i + 1}. {r} {r === myRank[i] ? "✓" : ""}</p>)}
            </div>
          </div>
          <p style={{ marginTop: ".5rem", fontWeight: 700 }}>{myRank.filter((r, i) => r === theirRank[i]).length}/4 matched!</p>
        </div>
      )}
    </div>
  );
}

// ====== HIGHER LOWER ======
function HigherLower({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const numbers = gs.numbers || [];
  const currentNum = numbers[round];
  const nextNum = numbers[round + 1];
  const turn = gs.turn;
  const isMyTurn = turn === playerId;
  const myScore = gs[`score_${playerId}`] || 0;
  const theirScore = gs[`score_${partnerId}`] || 0;
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => { setLastResult(null); }, [round]);

  async function guess(choice) {
    const correct = choice === "higher" ? nextNum >= currentNum : nextNum <= currentNum;
    const scoreKey = `score_${playerId}`;
    const newRound = round + 1;

    if (newRound + 1 >= numbers.length) {
      const finalScore = (gs[scoreKey] || 0) + (correct ? 1 : 0);
      const otherScore = gs[`score_${partnerId}`] || 0;
      await setDoc(doc(db, "rooms", room, "game", "current"), {
        [scoreKey]: finalScore,
        round: newRound,
        turn: partnerId,
      }, { merge: true });
      setTimeout(() => onEnd(finalScore > otherScore ? playerId : otherScore > finalScore ? partnerId : null), 1500);
      return;
    }

    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [scoreKey]: (gs[scoreKey] || 0) + (correct ? 1 : 0),
      round: newRound,
      turn: partnerId,
      [`hl${round}_result`]: correct ? "correct" : "wrong",
    }, { merge: true });
  }

  const prevResult = gs[`hl${round - 1}_result`];

  return (
    <div className="trivia-game">
      <div className="trivia-scores">
        <span className={isMyTurn ? "active" : ""}>{me?.name}: {myScore}</span>
        <span className={!isMyTurn ? "active" : ""}>{them?.name}: {theirScore}</span>
      </div>
      {prevResult && (
        <p className="fade-in" style={{ fontSize: ".8rem", color: prevResult === "correct" ? "var(--green, #22c55e)" : "var(--danger, #ef4444)", marginBottom: ".3rem" }}>
          {prevResult === "correct" ? "✅ Correct!" : "❌ Wrong!"}
        </p>
      )}
      <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--text-bright)", margin: ".5rem 0" }}>
        {currentNum}
      </div>
      <p className="os-hint" style={{ marginBottom: ".75rem" }}>Is the next number higher or lower?</p>
      {isMyTurn ? (
        <div style={{ display: "flex", gap: ".5rem", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => guess("higher")} style={{ flex: 1 }}>
            ⬆️ Higher
          </button>
          <button className="btn btn-secondary" onClick={() => guess("lower")} style={{ flex: 1 }}>
            ⬇️ Lower
          </button>
        </div>
      ) : (
        <p className="os-hint">{them?.name}'s turn...</p>
      )}
    </div>
  );
}
