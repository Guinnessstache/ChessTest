# ChessTest

## Concept
A 2D platformer starter: the player jumps between platforms collecting coins.

## Controls
- Arrows / WASD: move
- Up / W / Space: jump (press again in mid-air for a double jump)
- R: toggle the rain on/off

## Current features
- Player with arcade physics and gravity
- Double jump: 2 jumps, refreshed on landing, with an air-jump ring/dust effect
- Coyote time (100ms) after leaving a ledge and jump buffering (120ms) so chained
  double jumps feel responsive; falling off a ledge spends the ground jump
- Jump counter pips in the top-right showing remaining jumps
- Static platforms
- Coins that respawn when all are collected
- Score display
- Code-generated weather (`src/rain.js`): three parallax layers of streaks, wandering
  wind that drifts and tilts them, splash droplets + ripple rings on the ground and
  platform tops, and an occasional lightning flash. `R` toggles it; HUD stays on top

## Ideas / to do
- Puddles that linger on the ground after heavy rain
- Thunder sound (WebAudio noise burst) a beat after each lightning flash
