# Vibe Check — App Summary

## Goal
A mobile-first web app for two people in the **talking phase** (not dating yet) who are in **different timezones**. Designed to span ~1 year of async daily interaction, helping them get to know each other, build connection, and eventually plan a real date. Built with React + Firebase (free tier), deployed on Vercel.

## Core Concept
- Async card game — play at your own pace across timezones
- Gamified with XP, levels, streaks, and unlockable features
- Pixel art aesthetic with customizable characters and pets
- Everything they share feeds into a **Date Board** for planning the real meetup

---

## Features

### Card Game System
- 10 deck categories: Would You Rather, This or That, Daily Vibes, Hot Takes, Butterflies, Deep Talks, About Us, Rate Wars, 2 Truths 1 Lie, Challenges (photo)
- 180+ cards with types: choice, text, photo (camera required), hot take (partner rates with fire), rate (both rate, compare), 2 truths (interactive guessing phase)
- Custom card creation — either player can add cards
- Dice roll for random deck selection
- Answers hidden until both respond
- Can go back to hub while waiting for partner
- Cards locked while waiting (no double-drawing)

### Pixel Art Characters
- Male/female body types
- 8 hair styles, 8 hair colors, 6 skin tones, 8 outfit colors, 5 shoe colors
- Canvas-rendered with idle/walk/happy/thinking animations
- Editable anytime

### Level Progression (XP-based)
- 10 levels with unlockable features
- Heart between characters evolves: seed -> sprout -> bloom -> white heart -> yellow -> orange -> pink -> purple -> fire heart -> red heart
- Phase labels: "Planting the seed" through "All in"
- "Coming Soon" preview showing locked features with required level

### Virtual Pets
- 8 species: cat, dog, bunny, hamster (L2), fox (L4), panda (L6), turtle (L7), parrot (L8)
- Hunger + happiness meters (drain over time)
- Feed, pet, teach tricks (sit, shake, roll, fetch, dance)
- Pet playground with toys (ball, frisbee, rope, bone)
- Pet loyalty — sits beside whoever cares for it more (cumulative count)
- Max 1 pet until L8 unlocks second
- Pets shown on hub beside characters

### Apartment / Home
- 6 pixel art rooms: Living Room, Bedroom, Kitchen, Balcony, Pet Park, Movie Room
- Tap to move character — acts as passive status ("Cooking", "Resting", etc.)
- Partner sees your location in real-time
- Separate offices for each person (customizable desk)
- Visit partner's office

### Date Planning
- Pin Board — pin any card answer for later (favorite food, dream date, etc.)
- Watch List — movies/shows to watch together
- Food List — foods/restaurants to try
- Favorites — replay favorite questions as bonus rounds

### Gifts & Communication
- 10 gifts gated by level (rose, star, cookie through love letter at L7)
- Love letter opens a compose screen with message
- Bouquets that need watering or they wilt
- Notes with optional photo attachments
- Song sharing with embedded Spotify/YouTube players

### Mood System
- 12 moods: happy, loving, excited, energized, chill, sleepy, moody, sad, angry, anxious, low, missing you
- Your mood changes the **entire color theme** on partner's app
- Floating particle animations per mood (hearts, zzz, raindrops, etc.)
- Mood banner on hub: "[Name] is feeling sad"

### Real-Time Features
- Online/offline status (green dot, 30s ping)
- Toast notification when partner comes online
- Browser notifications (tab in background)
- Poke by tapping partner's character
- Phone vibration on poke

### Mini Games (both must be online)
- 5 games: Speed WYR, Memory Match, Word Chain, Quick Trivia, Tap Battle
- Timed (30s to 3min)
- Leaderboard tracking wins (shown on hub)
- Winner gets a trophy gift to send to partner

### Onboarding
- Room creator sets partner's name + writes welcome message
- Personalized invite link with `?code=XXXXXX` parameter
- Partner sees welcome screen with their name + your message
- 7-step walkthrough explaining all features
- Character creation with name pre-filled (editable)

### Persistence & Rejoin
- All state in Firebase — survives browser close, device switch
- Rejoin by name if localStorage clears
- Invite link auto-fills room code
- Stale/deleted rooms auto-detected

### Heartbreak
- "End It" option with confirmation
- Falling broken heart animation
- Stats on how far you got
- Both players see it

---

## Tech Stack
- **Frontend**: React + Vite
- **Database**: Firebase Firestore (free Spark plan)
- **Hosting**: Vercel (free, edge CDN)
- **Pixel art**: Canvas-based rendering
- **PWA**: Manifest for Add to Home Screen
- **Firestore rules**: versioned in `firestore.rules` at repo root (Day 6 of Adventures build, 2026-04-28). Deploy with `firebase deploy --only firestore:rules` whenever rules change. Vercel does NOT auto-deploy these.

## Deploy

- **App**: `git push` to `main` → Vercel auto-deploys.
- **Firestore rules**: `firebase deploy --only firestore:rules` (manual). Run alongside the Vercel deploy whenever `firestore.rules` changes.
- **Firestore emulator** (for local rule testing): `firebase emulators:start --only firestore`. UI at http://localhost:4000.

## Dev Mode

Open the app with `?dev=1` in the URL to enter dev mode. Adds:
- A "🧪 Open Dev Room" button on RoomList — creates / rejoins a private dev room with a code only your device knows.
- A floating "🧪 Dev" pill (top-right of any room) with quick level jumps (L1, L3, L5, L7, L10, L20) and an exact XP setter.
- The 24h Adventures advance gate is skipped inside dev rooms so you can walk Chapter 1 in one sitting for testing.

Dev rooms are tagged `dev: true` and filtered out of the regular room list. They're functionally normal rooms — the founder can play both sides via the "Acting as" toggle in Adventures.

---

## Level Unlock Map

| Level | XP | Unlocks |
|---|---|---|
| 1 | 0 | Basic decks, apartment, notes, games |
| 2 | 50 | Pet adoption (4 species) |
| 3 | 150 | Hot Takes, gifts, songs |
| 4 | 300 | Playground, fox species |
| 5 | 500 | Butterflies deck, bouquets |
| 6 | 800 | 2 Truths 1 Lie, panda species |
| 7 | 1200 | About Us, love letters, turtle |
| 8 | 1700 | Deep Talks, second pet, parrot |
| 9 | 2400 | All decks |
| 10 | 3200 | Soulmates |

---

## Key Files

| File | Purpose |
|---|---|
| `src/App.jsx` | Root router, mood theme, invite code handling |
| `src/firebase.js` | All Firestore operations |
| `src/data/cards.js` | 10 card decks, 180+ cards |
| `src/data/milestones.js` | Level progression, feature unlocking |
| `src/components/PixelChar.jsx` | Pixel art character (canvas) |
| `src/components/PixelPet.jsx` | Pixel art pets (canvas), 8 species |
| `src/components/MoodSlider.jsx` | 12 moods with theme colors |
| `src/components/MoodParticles.jsx` | Floating mood particles |
| `src/components/DiceRoll.jsx` | Animated dice for deck selection |
| `src/pages/Home.jsx` | Landing, create room, invite flow, character creation |
| `src/pages/Hub.jsx` | Main hub — characters, stats, decks, leaderboard |
| `src/pages/Play.jsx` | Card game — answer, wait, reveal, rate, pin, fav |
| `src/pages/OurSpace.jsx` | Pets, gifts, notes, bouquets, songs, playground |
| `src/pages/Apartment.jsx` | Pixel art rooms, offices, movie/food lists |
| `src/pages/MiniGames.jsx` | 5 real-time games with leaderboard |
| `src/pages/Onboarding.jsx` | Welcome message + 7-step tutorial |
| `src/pages/DateBoard.jsx` | Pinned answers for date planning |
| `src/pages/CharEdit.jsx` | Character customization |
| `src/pages/CreateCard.jsx` | Custom card creation |
| `src/index.css` | All styling (mobile-first, dark theme) |
