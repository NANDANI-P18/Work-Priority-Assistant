# TS-13 · Intelligent Work Prioritization & Productivity Assistant

> **Team:** Hexacoders &nbsp;|&nbsp; **By:** Nandani Patel & Siddhi Panchal &nbsp;|&nbsp; **Event:** 24-Hour Hackathon — GTU

---

##  Live Demo

> Open `index.html` directly in your browser — no server, no installation needed.

**Demo Accounts:**

| Role | Username | Password |
|------|----------|----------|
| Team Member | `raj` | `team123` |
| Faculty Mentor | `mentor` | `faculty123` |
| Subject Teacher | `teacher` | `teach123` |

---

##  Problem Statement

In fast-paced college teams, task prioritization is handled manually — leading to inefficient execution. High-impact urgent tasks get ignored while low-priority work consumes valuable time. Managers have no real-time visibility into what their team is actually working on.

**Our solution** automatically calculates a priority score for every task using deadline, business impact, and effort — and continuously re-sorts the task list so teams always know what to work on first.

---

##  Features

| Feature | Description |
|---------|-------------|
| **AI Priority Scoring** | Weighted formula: `Deadline×0.50 + Impact×0.35 − Effort×0.15` |
| **Eisenhower Matrix** | Tasks auto-classified into Q1/Q2/Q3/Q4 — no manual urgency input |
| **Real-Time Reordering** | List re-sorts automatically after every add, edit, or completion |
| **Tiebreaker Logic** | Handles same-deadline tasks — higher impact wins, lower effort wins |
| **AI Suggestion Box** | Always shows the single most important pending task at the top |
| **Role-Based Login** | 3 roles: Team Member, Faculty Mentor, Subject Teacher |
| **Manager Dashboard** | Live stats: completion rate, overdue count, workload per person |
| **Deadline Alerts** | Auto color-coded: 🔴 Overdue, 🟡 Due Soon, 🔵 Reminder |
| **Email Alert Preview** | Shows what automated emails would be sent to team members |
| **Email Parser** | Paste email text → system extracts task title, deadline, impact |
| **Eisenhower Matrix View** | Visual 4-quadrant board of all pending tasks |
| **CSV Export** | One-click download of full task report (Excel-compatible) |
| **Data Persistence** | Tasks saved in browser localStorage — survives page refresh |

---

##  The Scoring Formula

```
Score = (Deadline × 0.50) + (Impact × 0.35) − (Effort × 0.15)
```

**Why these weights?**
- **Deadline gets 50%** — a task due tomorrow is always more critical than one due next month
- **Impact gets 35%** — high business-value tasks matter more to organizational goals
- **Effort gets −15%** — when two tasks are equal, the easier one is done first to free up time

**Deadline is converted to an urgency score first:**

| Days Left | Deadline Score |
|-----------|---------------|
| Overdue (≤ 0) | 10 |
| 1 day | 8 |
| ≤ 3 days | 6 |
| ≤ 7 days | 4 |
| 8+ days | 1 |

**Tiebreaker:** When two tasks have identical scores, higher impact wins. If impact is also equal, lower effort wins.

---

##  Eisenhower Matrix Logic

Tasks are automatically placed into quadrants — the user never manually enters urgency:

```
Urgent = deadline within 5 days
Important = impact rating ≥ 3

Q1 (Do First)  → Urgent   + Important
Q2 (Schedule)  → Not Urgent + Important
Q3 (Delegate)  → Urgent   + Not Important
Q4 (Eliminate) → Not Urgent + Not Important
```

---

##  User Roles

**Team Member**
- Add tasks, view prioritized list, mark tasks done
- See AI suggestion for what to work on next
- Check personal deadline alerts

**Faculty Mentor**
- View all team members' tasks
- Edit task deadlines (triggers instant re-prioritization)
- See team dashboard and workload distribution
- Export CSV report

**Subject Teacher**
- Organization-level dashboard
- Productivity trends and category breakdown
- Full CSV export for evaluation

---

##  Project Structure

```
WorkAssistant/
├── index.html      # Full app structure — login, navbar, all sections
├── style.css       # Complete styling — cards, badges, dashboard, alerts
└── app.js          # All logic — scoring, sorting, alerts, export, storage
```

---

##  Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | App structure and layout |
| CSS3 | Styling, responsive design, color-coded badges |
| JavaScript (ES6) | Priority scoring, Eisenhower Matrix, all business logic |
| localStorage | Data persistence across sessions (no backend needed) |

> **No frameworks. No libraries. No installation.** Pure HTML/CSS/JS — runs directly in any browser.

---

##  How to Run

**Option 1 — Direct (recommended):**
1. Download or clone this repository
2. Open `index.html` in Chrome or Edge
3. Login with any demo account above

**Option 2 — Clone via Git:**
```bash
git clone https://github.com/NANDANI-P18/https://github.com/NANDANI-P18/Work-Priority-Assistant.git
cd YOUR_REPO_NAME
# Open index.html in your browser
```

**No npm install. No terminal commands. No server required.**

---

##  Sample GTU Data

The app pre-loads with realistic GTU-affiliated task data on first login:

- GTU Project Expo Registration — LDCE (Overdue, Score: 9.4)
- Hackathon Final Submission — GTU (1 day left, Score: 8.2)
- College Cultural Event Planning (3 days, Score: 5.7)
- Lab Manual Submission — Physics (5 days, Score: 4.1)
- Industry Visit Report (8 days, Score: 2.9)

Data sourced from: GTU college event & project submission forms, GTU affiliated college registry (400+ institutions), student participation records.

---

##  Future Improvements

1. **Backend + Database** — Node.js + MySQL so multiple users share data across devices
2. **Real Email Notifications** — Connect to EmailJS API to send actual deadline alerts
3. **Machine Learning** — Train a model on past completion patterns to auto-suggest effort and impact ratings
4. **Mobile App** — React Native version for on-the-go task management
5. **Calendar Integration** — Sync deadlines with Google Calendar

---

##  Screenshots

> Add screenshots here after taking them from your running app.
> Suggested shots: Login screen · Task list with scores · Eisenhower Matrix view · Manager Dashboard · Alerts tab

---

##  License

This project was built for the GTU 24-Hour Hackathon. Free to use for educational purposes.

---

*Built with  by Team Hexacoders — Nandani Patel & Siddhi Panchal*
