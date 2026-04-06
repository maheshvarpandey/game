# Mini Battle Survival

A lightweight browser survival game built with Next.js, React, HTML5 Canvas, and Zustand.

The game is inspired by battle royale survival loops, but simplified for the web:
- Move a blue player square around the arena
- Auto-attack the nearest enemy
- Survive waves of red enemies
- Stay inside the shrinking and moving safe zone
- Score points by defeating enemies

## Tech Stack

- Next.js App Router
- React
- HTML5 Canvas
- Zustand

## Features

- Keyboard controls with `WASD` and arrow keys
- Mobile-friendly touch controls
- Auto-targeting attack system
- Enemy spawning over time
- Health and score HUD
- Moving and shrinking battle zone
- Restart flow after game over

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Open the game

Visit:

```text
http://localhost:3000
```

## Production Build

To create a production build:

```bash
npm run build
```

To run the production server:

```bash
npm run start
```

## How To Play

### Desktop

- Press `Start Game`
- Move with `W`, `A`, `S`, `D`
- Or use the arrow keys

### Mobile

- Tap `Start Game`
- Use the on-screen directional touch controls
- Hold to keep moving
- Drag across the touch pad to switch direction
- Use multiple fingers for diagonal movement

## Gameplay Rules

- The player automatically attacks the nearest enemy
- Enemies spawn regularly and move toward the player
- Touching enemies damages the player
- The safe zone moves around the map and gradually shrinks
- Staying outside the safe zone causes damage over time
- Defeating enemies increases your score
- The game ends when your health reaches `0`

## Controls Summary

- `W` / `ArrowUp`: move up
- `S` / `ArrowDown`: move down
- `A` / `ArrowLeft`: move left
- `D` / `ArrowRight`: move right
- Touch controls: mobile movement

## Project Structure

```text
app/
  game/
    GameCanvas.jsx      # Main game UI, canvas loop, input handling
    gameLogic.js        # Movement, combat, spawning, zone, drawing logic
    useGameStore.js     # Zustand store for game state
  globals.css           # Global styles
  layout.js             # Root layout
  page.js               # Entry page
```

## Architecture Notes

- `GameCanvas.jsx` runs the animation loop with `requestAnimationFrame`
- `gameLogic.js` contains the pure gameplay and rendering helpers
- `useGameStore.js` keeps UI and game state centralized
- Canvas rendering is used for gameplay visuals to keep the loop fast
- React is mainly used for the HUD, overlays, and control layout

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run start`: run production server

## Notes

- Canvas size is `500 x 500`
- The player is a blue square
- Enemies are red squares
- The game is intentionally lightweight with no heavy external libraries

## Future Ideas

- Virtual joystick for mobile
- Projectile effects instead of instant-hit attacks
- Power-ups and pickups
- Sound effects and music
- Difficulty scaling over time
