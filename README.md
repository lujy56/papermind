# PaperMind — Teacher & Student Portals

PaperMind helps Grade 1–5 teachers review **handwritten exams**. A student uploads a photo of the exam, the teacher checks the OCR transcription, reviews an AI‑suggested grade, confirms or overrides every decision, and publishes child‑friendly feedback. The teacher always makes the final decision.

This repository contains the **frontend** of our HCI project: one website with two role‑based portals (Teacher and Student) that share one design system and one set of demo data.

| Page | File | What it contains |
|---|---|---|
| Login | `index.html` | Role choice (Student / Teacher), validation, sign‑in help |
| Teacher portal | `teacher.html` | Dashboard, Submissions, 4‑step Grading, Learning Gaps, Practice, Support Sessions, Insights, Notifications, Profile |
| Student portal | `student.html` | Home, Upload Exam, My Exams & Results, Progress, Practice, Support Sessions, Notifications, Profile |

---

## 1. Requirements

- A modern browser: **Google Chrome or Microsoft Edge** (recommended), Firefox or Safari.
- **No installation, build step or packages are needed.** The project is plain HTML, CSS and JavaScript.
- An internet connection is only needed to load the Google Fonts. Without it the site still works with system fonts.

---

## 2. Running the project locally

Download or clone the repository first:

```bash
git clone https://github.com/lujy56/papermind.git
cd papermind
```

Then use **one** of these options.

### Option A — VS Code + Live Server (recommended)
1. Open the `papermind` folder in VS Code (*File → Open Folder…*).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel.
3. Right‑click `index.html` → **Open with Live Server**.
4. The site opens at `http://127.0.0.1:5500/index.html`.

### Option B — Python (no VS Code needed)
```bash
cd papermind
python -m http.server 8000        # on macOS/Linux you may need: python3 -m http.server 8000
```
Open **http://localhost:8000** in your browser. Press `Ctrl + C` in the terminal to stop the server.

### Option C — Node.js
```bash
npx serve .
```
Open the address that is printed (usually `http://localhost:3000`).

> Double‑clicking `index.html` also works in most browsers, but a local server (A, B or C) is recommended.

---

## 3. Login accounts

| Role | Username / Email | PIN / Password |
|---|---|---|
| **Student** | `salma.ahmed` | `1234` |
| **Teacher** | `sarah.educator@papermind.school` | `teacher123` |
| Other students | `omar.ali`, `lina.hassan`, `noah.becker`, `emma.adel`, `youssef.karim` (Grade 4A) | `1234` |

- On the login page, choose **I’m a Student** or **I’m a Teacher** first.
- **Need help signing in?** (at the bottom of the login page) has one‑click **Use** buttons that fill in the accounts above.
- **Resetting the demo:** the same section has **“Restore the sample class to its starting point”**. Use it before testing to start from clean sample data.
- Use the **Log Out** button at the bottom of the sidebar to switch roles.

---

## 4. How to test the project

All data is saved in the browser (`localStorage`). Actions in one portal therefore appear in the other portal **in the same browser**. You can log out and log in as the other role, or open the two portals in **two tabs**, which update each other automatically.

### 4.1 Main walkthrough (≈ 10 minutes)

| # | Role | Steps | Expected result |
|---|---|---|---|
| 1 | — | Open the login page and press **Log In** with empty fields, then a wrong PIN. | Clear error messages appear under the fields. |
| 2 | Student | Log in as `salma.ahmed`. | Student **Home** with greeting, level/stars, next steps and badges. |
| 3 | Student | **Upload Exam** → *Or try with a sample exam paper* → choose subject and exam → tick the “whole page is visible” box → **Send**. | Success screen and toast. The exam appears in **My Exams → Under Review** with **no grade**. |
| 4 | Student | Upload a `.txt` file instead. | The file is rejected with a child‑friendly error. |
| 5 | Teacher | Log out, then log in as the teacher. | Teacher **Dashboard**. The new upload appears in *Needs your attention* and in **Submissions**. |
| 6 | Teacher | Use the **class dropdown** in the header (Grade 4A / 4B / 5A). | Submissions, dashboard and insights change to the selected class. Switch back to **Grade 4A**. |
| 7 | Teacher | **Submissions** → use the status filters and the search box (try “salma”). | The list filters correctly. |
| 8 | Teacher | Open **Salma Ahmed – Math Quiz 3** (*Start Step 1*). | **Step 1 OCR Verification**: the scan and the extracted answers side by side. |
| 9 | Teacher | Click **Save Corrections & Run AI Grading** before resolving Q4. | Blocked with an error, because the uncertain answer must be resolved first. |
| 10 | Teacher | Click a line on the scan. For Q4, pick **9/4** or **7/4** → **Confirm this reading** → **Run AI Grading**. | **Step 2 AI Grading**: the suggested score (9/4 → 74 %, 7/4 → 66 %), per‑question reasoning, gaps and a red flag. |
| 11 | Teacher | **Proceed to Teacher Confirmation**. Change one question’s points. | **Step 3**: the final grade updates live and a required *reason* field appears. |
| 12 | Teacher | Confirm/Dismiss every learning gap, recurring mistake and the red flag, edit the feedback, then **Confirm Grade & Feedback**. | Confirming is blocked until every decision is made, then **Step 4**. |
| 13 | Teacher | **Step 4**: check the student preview, optionally attach a practice and a session → **Publish**. | Confirmation dialog, then a “published” summary. |
| 14 | Student | Log in as Salma → **Notifications**. | A *New feedback* notification. Clicking it opens the **Results** page with the confirmed grade, feedback, things to practise and the kindly‑worded red flag. |
| 15 | Student | **Progress** → change the subject (Math / Science / English / All). | The chart, statistics and *Skill Garden* update. |
| 16 | Student | **Practice** → *Start Practice* → watch the video, open the worksheet, finish the 5‑question quiz. | Score screen, stars earned, practice marked **Done**. |
| 17 | Student | **Support Sessions** → **Yes, I’ll come!** | Registration confirmed and the seat map updates. |
| 18 | Teacher | Log in as the teacher → **Practice**, **Support Sessions**, **Notifications → Inbox**. | Salma’s practice completion, session registration and upload are all shown. |

### 4.2 Other features to try

- **Teacher → Learning Gaps:** click *Group N students* on a gap cluster → create a group. Check the *Recurring Mistakes* table. In **Language vs Concept Analysis**, choose a student, pick a decision and press **Save decision**.
- **Teacher → Practice:** assign practice to a student or group, with an optional uploaded worksheet. *View Results*, *Send Reminder*.
- **Teacher → Support Sessions:** recommend a session to a group (the capacity must fit the group), remind or cancel it.
- **Teacher → Insights:** concept mastery, weekly weakness trend, remediation impact, practice completion, OCR quality, red‑flag patterns. *Export Class Report* opens the print dialog.
- **Teacher → Notifications:** send an announcement to the class, a group or one student (quick tags help). See *Recent activity*, *Inbox* and *Sent*.
- **Both portals:** open the **profile** (avatar at the bottom of the sidebar or top‑right) and edit it. Press **`?`** or the help icon for page help. Press **`Esc`** to close dialogs. Try a phone‑sized window: the sidebar becomes a menu button.
- **Access check:** while logged out, open `teacher.html` or `student.html` directly. You are sent back to the login page.

### 4.3 Automated test (optional)

`tests/e2e.py` is a Playwright script that clicks through all the flows above (81 checks) and reports any failure or browser console error.

```bash
# 1) start a local server in the project folder (keep it running)
python -m http.server 8000

# 2) in a second terminal, one-time setup
pip install playwright
python -m playwright install chromium

# 3) run the test
python tests/e2e.py
```

It ends with `TOTAL 81 FAILED 0` and `CONSOLE/PAGE ERRORS: none` when everything passes.

- If your server uses another address, set it first: `PAPERMIND_URL=http://127.0.0.1:5500/ python tests/e2e.py`. In Windows PowerShell: `$env:PAPERMIND_URL="http://127.0.0.1:5500/"; python tests/e2e.py`.
- To watch the browser while the test runs, set `HEADED=1`.
- The test clears the site’s saved data at the start.

---

## 5. Project structure

```text
papermind/
├── index.html                     Login page
├── teacher.html                   Teacher portal
├── student.html                   Student portal
├── css/
│   ├── styles.css                 Shared design system (colours, buttons, cards, forms, popups, toasts, sidebar, login)
│   ├── teacher.css                Teacher-specific layouts
│   └── student.css                Student-specific layouts (larger, child-friendly)
├── js/
│   ├── data.js                    Demo data, localStorage store, simulated OCR / AI grading
│   ├── app.js                     Shared UI helpers (icons, toasts, popups) and page router
│   ├── auth.js                    Login, session and logout
│   ├── teacher.js                 Teacher screens and actions
│   └── student.js                 Student screens and actions
├── assets/                        Logo, favicon, sample exam illustration
├── tests/e2e.py                   Automated end-to-end browser test
├── REQUIREMENTS_CHECKLIST.md      Each requirement → where it is implemented
├── UI_UX_HEURISTICS_CHECKLIST.md  Nielsen’s 10 heuristics → where they are applied
└── README.md
```

Each screen has its own URL (for example `teacher.html#/grading`), so the browser **Back** button and bookmarks work.

---

## 6. Limitations

This is a **frontend‑only** prototype; there is no backend server.

- **Login is simulated.** Accounts are stored in the browser for demonstration only and are not secure.
- **OCR and AI grading are simulated.** Each sample exam has predefined OCR readings with confidence values. A rule‑based engine produces the suggested grades, reasoning, learning gaps and red flags, and it reacts to the teacher’s OCR corrections. A newly uploaded photo is stored and viewable by the teacher, but its answers come from a sample answer set for that subject.
- **Data is stored per browser** (`localStorage`). The two portals stay in sync in the same browser but not across different devices. Clearing the browser data or using *Restore the sample class* resets everything.
- Large PDF uploads (over ~1.5 MB) are stored by file name only because browser storage is limited.
