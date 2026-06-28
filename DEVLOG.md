# Dev Log
## Day 2 (continued) — Webcam + MediaPipe

- Installed @mediapipe/tasks-vision
- Built PoseCamera.jsx: webcam feed + canvas overlay
- Loaded MediaPipe PoseLandmarker model (lite version, GPU delegate)
- Implemented real-time detection loop using requestAnimationFrame
- Drew skeleton (33 landmarks + connections) live on canvas, mirrored to match webcam
- Confirmed: skeleton tracks body movement in real time, no lag

**WEEK 1 GOAL COMPLETE:** Log in → open app → see body tracked with dots and lines. 
All of Week 1 (auth + camera + pose detection) finished in Day 2.

**Next (Week 2):** Joint angle calculations for squat/push-up/lunge, rep counter, accuracy scoring, real-time text + voice feedback.

## Day 2 — 28 June 2026

- Created Supabase project (movement-trainer), region: Mumbai (ap-south-1)
- Set up frontend/.env and backend/.env with Supabase URL + anon key (excluded from Git)
- Installed @supabase/supabase-js and react-router-dom
- Created src/lib/supabase.js — shared Supabase client setup
- Built Signup.jsx, Login.jsx, Home.jsx pages
- Wired up routing in App.jsx (/, /login, /signup)
- Tested full flow: signed up a real user, confirmed in Supabase Auth dashboard, logged in, logged out — all working
- Disabled "Confirm email" temporarily for faster local testing (will re-enable before deployment)
- Fixed a CSS bug from Vite's starter template causing heading text overlap on Home page

**Status:** Auth flow fully functional end-to-end. Next: webcam feed + MediaPipe pose detection (final Week 1 goal).

## Day 1 — 28 June 2026

- Initialized Git repo and project folder structure (frontend/, backend/)
- Scaffolded React frontend with Vite (JavaScript template, ESLint)
- Confirmed frontend runs locally (npm run dev → localhost:5173)
- Set up Python virtual environment in backend/
- Installed FastAPI + Uvicorn
- Created minimal main.py with a test route, confirmed server runs (localhost:8000)
- Created placeholder files: pose_analysis.py, video_processor.py, ai_coach.py, database.py, requirements.txt
- Set up .gitignore (venv, node_modules, .env files excluded)
- First commit made

**Status:** Project skeleton fully working. Both frontend and backend run independently. Ready for Week 1 goal: Supabase auth + webcam + MediaPipe skeleton tracking.