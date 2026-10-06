# OpenFront Build Assistant

[![Chrome Store](https://img.shields.io/badge/platform-Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/search/OstinUA)
[![Chrome Portfolio](https://img.shields.io/badge/Chrome_Web_Store-Portfolio-34A853?style=for-the-badge&logo=google-chrome&logoColor=white)](https://devs-in-exile.pages.dev/extensions)

A highly optimized, hardware-level event emulator designed as a Google Chrome Extension. It automates high-frequency repetitive tasks (such as building upgrades) in canvas-based web games, specifically targeting the OpenFront engine architecture.

## Architecture Overview

Browser game engines utilizing Canvas/WebGL often implement strict anti-cheat mechanisms that intercept `isTrusted: false` events and monitor input event lifecycles. Traditional Content Scripts fail in these environments due to Chrome's **Isolated World** constraints.

This extension bypasses those limitations by utilizing a payload injection pattern. The `content.js` script dynamically injects `inject.js` directly into the DOM tree. This grants the script execution rights within the host page's context, allowing it to:
* Seamlessly hook into the engine's global input handlers during the Capture Phase.
* Avoid recursive feedback loops by accurately distinguishing between physical `isTrusted` keystrokes and self-generated synthetic macros.
* Dispatch raw `KeyboardEvent` and `MouseEvent` lifecycles directly to the underlying canvas nodes without triggering browser-level security banners or DevTools debugger sessions.

## Core Features

* **Dynamic Keybinding Macros:** Supports composite triggers mapping `Z + [Digit 1-9]` + `LMB`.
* **Adaptive Polling Rate:** Configured to an aggressive 75ms dispatch interval (approx. 13 operations per second) for rapid execution, while ensuring the engine has sufficient time to parse the event frames.
* **Positional Variance Abort:** Actively monitors Euclidean distance deltas on `mousemove`. The macro immediately terminates if the cursor drifts beyond a 50px threshold, preventing accidental cross-canvas clicks.
* **State Management:** Implements automated hardware state registry purging on window `blur` to prevent phantom input locks if the user switches tabs mid-execution.

## Installation (Developer Mode)

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** via the toggle switch in the upper right corner.
4. Click **Load unpacked** and select the directory containing the extension files.
5. Navigate to the game environment.
6. **Important:** Execute a Hard Reload (`Ctrl + F5`) to purge the browser cache and ensure the payload is successfully injected into the fresh page context.

## Usage Guide

1. Hover your cursor over the target coordinate/entity on the canvas.
2. Press and hold the primary modifier key: `Z`.
3. Press and hold any secondary numeric modifier corresponding to the desired entity index (e.g., `1`, `2`, `3`...).
4. Click and hold the Left Mouse Button (`LMB`).
5. Keep the cursor stationary. The script will rapidly dispatch synthetic building sequences until any of the modifier keys are released or the cursor is moved outside the safety threshold.

## Technical Stack

* JavaScript (ES6+)
* Manifest V3
* DOM Synthetic Event Dispatching (`KeyboardEvent`, `MouseEvent`, `PointerEvent`)
