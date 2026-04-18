import os

# Define the content for the markdown instruction file
markdown_content = """# Project Specification: "The Impostor" Word Game

## 1. Project Overview
Build a mobile-first, responsive static web application for a local "pass-and-play" social deduction game. The game is designed for groups of friends playing in person using a single mobile device.

**Technical Constraints:**
- **Framework:** Vanilla JS or React (Vite-based).
- **Styling:** Tailwind CSS (Minimalist, flat design, vector-style UI).
- **Backend:** None (Static site).
- **Hosting:** GitHub Pages compatible (Custom domain: `impostor.rgsoft.org`).

---

## 2. Core Game Logic
1. **Word Library:** - A JSON-based library containing `word` and `hint`.
   - *Example:* `{ "word": "Space Station", "hint": "A place far away from home." }`
2. **Setup Phase:**
   - Input field to add player names (list).
   - Slider/Input for "Number of Impostors" (cannot exceed player count - 1).
3. **Role Assignment:**
   - Randomly assign $N$ players as "Innocents" and $M$ players as "Impostors".
   - Pick one random object from the word library.
4. **The Reveal Mechanic:**
   - For Innocents: Show the `word`.
   - For Impostors: Show the `hint`.

---

## 3. Screen-by-Screen Flow

### Screen 1: Setup
- **UI:** Input for names, a list showing added players, and a "Start Game" button.
- **Style:** Clean typography, flat color buttons, rounded corners.

### Screen 2: Pass the Phone
- **Logic:** Iterate through the list of players.
- **UI:** Large text: "Pass the phone to [Player Name]". 
- **Action:** A "Ready" button to move to the reveal.

### Screen 3: Secret Reveal (The "Card")
- **Mechanism:** A "Press and Hold" button.
- **Logic:** - On `mousedown` / `touchstart`: Show the role and the word/hint.
  - On `mouseup` / `touchend`: Hide everything immediately (security measure).
- **UI:** A large colored card that changes state when pressed.

### Screen 4: Gameplay (The Round)
- **Logic:** Randomly pick one player to start the verbal round.
- **UI:** Shows the list of all players. A prominent "Finish Game" button.
- **Context:** Remind players they are playing in the real world now.

### Screen 5: Results
- **Logic:** Reveal who the impostors were.
- **UI:** A list of names with "IMPOSTOR" or "INNOCENT" tags in high-contrast flat colors.
- **Action:** "Play Again" button (reset state but keep player names).

---

## 4. Visual Identity & UI/UX
- **Vibe:** Minimalist, high contrast, vector-based.
- **Color Palette:** Use a bold, flat color palette (e.g., Deep Blue for Innocents, Soft Red for Impostors, Mint Green for buttons).
- **Animations:** Simple CSS transitions for screen changes.
- **Responsiveness:** Must be perfectly optimized for mobile browsers (Safari/Chrome on iOS/Android).

---

## 5. Monetization & SEO
- **Ads:** Reserve a `div` slot (320x50 or 300x250) at the bottom of the **Setup** and **Results** screens for Google AdSense.
- **Custom Domain:** The site should be ready to be hosted at `impostor.rgsoft.org`. Ensure a `CNAME` file or GitHub Actions workflow is considered.
- **SEO:** Meta tags for "Impostor Word Game", "Social Deduction Pass and Play".

---

## 6. Prompt for AI Agent (Copy-Paste this)
> "Please build a React application using Vite and Tailwind CSS based on the provided markdown specification. Focus on a very clean, minimalist 'flat' design. Ensure the state management handles the transition between players smoothly. The 'Press and Hold' component for revealing roles is the most important part—ensure it works perfectly on touch devices."
"""

# Save to a markdown file
file_path = 'impostor_game_instructions.md'
with open(file_path, 'w') as f:
    f.write(markdown_content)

print(f"File saved as {file_path}")