# Counting Meadow

Nine animated counting games for nursery-age children, built with Vue 3 + Vite.
All artwork is inline SVG (no image assets) and all sound is synthesized with the
Web Audio API, so the app is self-contained.

## Games

| Game | Answer input | Skill | How it plays |
| --- | --- | --- | --- |
| **Balloon Pop** | Tap a balloon | Counting quantities 3–9 | Count the little stars printed on each balloon, then pop the balloon that matches the number Pip asks for. |
| **Chompy's Snacks** | Tap food into a mouth | Counting out an exact amount | Chompy asks for N berries/cookies/grapes/apples/fish. Feed him one at a time; a dot meter tracks the count. |
| **Firefly Night** | Tap a 1–10 pad | One-to-one counting | Tap every firefly into the jar, then answer "how many?" on the big number pad. |
| **Pip's Storybook** | Tap a 1–10 pad | Counting to answer, narrative | An eight-page illustrated adventure: ducklings, a log raft, frogs, dragonflies, lanterns, leaping fish, stars and a fireworks finale. Correct answers animate the story forward. |
| **Rocket Countdown** | **Type digits + ✓** | Counting, numeral typing | Count the aliens outside the rocket, type the number on the digit pad (or your keyboard), then launch. |
| **Dino Hatch** | **Type digits + ✓** | Counting, numeral typing | Count the eggs in the nest, type the number, and hatch a baby dino. |
| **Animal Feast** | **Type digits + ✓** | Counting, numeral typing | Leo the Lion, Pia the Panda and friends are hungry. Count the food brought for each animal, type the number, and watch it eat. |
| **Number Parade** | Tap a number pad | Number sequences | A car, rocket, bunny or snail waits at the start. Tap a hidden 3-number sequence on the pad in order and your vehicle travels. |
| **Object Count** | **Type digits + ✓** | Selective attention, counting | A mixed-up meadow of two item kinds — colour pairs (red/green apples, blue/red balls, stars vs moons, orange/blue fish, balloons, lollipops, hearts vs flowers, carrots vs peas) and object pairs (cars vs trains, planes vs boats, bikes vs cars, dogs vs cats, birds vs butterflies, ducks vs frogs, snails vs turtles, fish vs birds). Count only the ones asked for and type the number. |

## Features

- Chunky, hand-drawn cartoon art with ink outlines and hard shadows
- Animated characters (blinking, tail wagging, chomping, egg wobbles, rocket launch), page-turn transitions, confetti
- Big tap targets and a physical-keyboard-friendly typing pad (digits, Backspace, Enter)
- **Read aloud** — prompts are spoken by speech synthesis; the switch lives in the grown-ups panel with the sound effects
- **1–5 toddler mode** — flip the switch on the meadow and every game counts only up to five: answer pads shrink to 1–5, typing pads show 1–5 keys, and the storybook shows two-to-five critters per page. The choice is remembered between visits, and it can be flipped mid-game from the grown-ups panel (⏸ in every game header, the sliders button on the meadow) — the round restarts with the new numbers. That panel is the one place for all the switches: 1–5 mode, **rounds per game (5, 10, 15, 25 or 50 stages, shown as a `round/total` counter)**, read aloud and sound effects.
- Gentle wrong-answer feedback: a hint after two tries, plus an object-glow "count along" mode in the typing games
- 3-star rating per game saved in `localStorage` (27 stars total)
- Mute toggle in the grown-ups panel, optional full-screen mode, skip-link-free keyboard play, reduced-motion support

## Run

```bash
bun install
bun run dev      # http://127.0.0.1:5183
bun run build    # production build in dist/
```

## Layout

```
src/
  App.vue                  screen switching
  screens/HomeScreen.vue   meadow + nine game cards + preferences
  games/                   the nine games
  components/              Pip, Chompy, confetti, number pad, typing pad, shell, …
  lib/                     store (localStorage), audio synth, helpers, speech
  styles/base.css          design tokens, chunky primitives, motion library
```
