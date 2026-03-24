# FocusGuard
A real-time accountability app for focused work sessions. Two people enter a shared room — one focuses, one guards. The guardian receives live alerts when the focuser requests a break or exits fullscreen, and can approve or deny break requests, or send encouragement mid-session.

## The Idea
Most focus apps rely on willpower: "please don't open Instagram." FocusGuard introduces a social accountability layer instead. Psychological research consistently shows that external accountability is a significantly stronger behavioral mechanism than self-imposed rules.

## How it works
* **Two users join** a shared room via a room code
* **One takes the Focuser role**, the other becomes the Guardian
* **The Focuser starts** a timed focus session
* **Tab Change Detection**: If the Focuser changes the current tab, the Guardian gets an immediate alert
* **Break Requests**: If the Focuser requests a break, the Guardian receives a notification and can approve or deny it
* **Encouragement**: The Guardian can send messages that appear on the Focuser's screen mid-session

> **Note on app blocking:** FocusGuard does not block other applications or browser tabs. Browsers cannot interact with OS-level processes without native integrations (e.g. Electron). Instead, the app detects when the user leaves the tab.


## Tech Stack
- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Real-time:** WebSocket (ws)
- **Database:** SQLite

## Live Demo
Demo: [https://polite-tree-0d40da803.2.azurestaticapps.net/](https://polite-tree-0d40da803.2.azurestaticapps.net/)
