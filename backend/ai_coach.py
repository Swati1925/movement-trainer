import os
from dotenv import load_dotenv
from google import genai
from database import get_recent_sessions, format_sessions_for_prompt

# Load environment variables from .env
load_dotenv()

# Create the Gemini client once, reused across calls
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# gemini-2.0-flash (original plan) was shut down June 1, 2026.
# Using 3.5-flash — no announced shutdown date yet.
MODEL_NAME = "gemini-3.5-flash"


def ask_gemini(prompt: str) -> str:
    """
    Sends a plain prompt to Gemini and returns the text response.
    Used internally by all the higher-level functions below.
    """
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    return response.text


def get_session_summary(user_id: str, today_session: dict) -> str:
    """
    RAG pipeline for the on-demand post-session summary.

    Step 1: Fetch user's recent sessions for this exercise from Supabase
    Step 2: Format that history into readable text
    Step 3: Build a prompt that includes real history + today's data
    Step 4: Send to Gemini, return the personalised summary

    today_session should be a dict like:
    {
        "exercise": "squat",
        "reps": 10,
        "avg_accuracy": 84,
        "rep_accuracies": [82, 88, 79, 91, 80]
    }
    """
    # STEP 1 & 2: Fetch and format past sessions (the RAG part)
    past_sessions = get_recent_sessions(
        user_id,
        exercise=today_session["exercise"],
        limit=5
    )
    history_text = format_sessions_for_prompt(past_sessions)

    # STEP 3: Build the prompt with real user data injected
    prompt = f"""
You are a personal fitness coach reviewing a user's exercise session.

Here is the user's recent history for {today_session["exercise"]}:
{history_text}

Today's session:
- Exercise: {today_session["exercise"]}
- Reps completed: {today_session["reps"]}
- Average accuracy: {today_session["avg_accuracy"]}%
- Per-rep accuracies: {today_session["rep_accuracies"]}

Write a short (3-5 sentences), encouraging, personalised summary.
Point out specific improvements or recurring issues based on the history above.
If this is their first session, welcome them and give general tips.
Be direct and specific — mention actual numbers from their data.
"""

    # STEP 4: Send to Gemini
    return ask_gemini(prompt)


def get_exercise_recommendations(user_id: str, goal: str) -> str:
    """
    RAG pipeline for exercise recommendations.
    Fetches the user's recent sessions across all exercises,
    then asks Gemini to recommend exercises based on their goal
    and what they've been doing recently.
    """
    # Fetch recent history across all exercises (no exercise filter)
    past_sessions = get_recent_sessions(user_id, exercise=None, limit=10)
    history_text = format_sessions_for_prompt(past_sessions)

    prompt = f"""
You are a personal fitness coach.

The user's recent exercise history:
{history_text}

The user's goal: {goal}

Recommend 3 specific exercises from this list only:
Squats, Lunges, Push-ups, Burpees, Jumping Jacks, Mountain Climbers,
Downward Dog, Warrior I, Warrior II, Child's Pose, Tree Pose, Cobra Pose,
Pull-up form, Dips, Pike Push-up, L-sit, Hollow Body Hold

For each recommendation:
- Name the exercise
- One sentence on why it fits their goal
- One sentence on what to focus on based on their history

Keep the total response under 150 words.
"""
    return ask_gemini(prompt)


def chat_with_coach(user_id: str, message: str, chat_history: list) -> str:
    """
    RAG pipeline for the AI chat coach.
    Fetches recent sessions, then responds to the user's message
    with context about their actual training history.

    chat_history is a list of dicts like:
    [{"role": "user", "text": "..."}, {"role": "coach", "text": "..."}]
    """
    past_sessions = get_recent_sessions(user_id, exercise=None, limit=5)
    history_text = format_sessions_for_prompt(past_sessions)

    # Format previous chat turns into the prompt
    chat_turns = ""
    for turn in chat_history[-6:]:  # last 6 turns max, to keep prompt short
        role = "User" if turn["role"] == "user" else "Coach"
        chat_turns += f"{role}: {turn['text']}\n"

    prompt = f"""
You are a friendly, encouraging personal fitness coach.

The user's recent training history:
{history_text}

Recent conversation:
{chat_turns}
User: {message}

Respond as the Coach in 2-4 sentences. Be specific — reference their
actual data where relevant. If you don't have enough history to be
specific, give generally useful advice.
"""
    return ask_gemini(prompt)


# Quick manual test — run this file directly:
# python ai_coach.py
if __name__ == "__main__":
    # Test the summary with fake data (no real user needed)
    fake_user_id = "00000000-0000-0000-0000-000000000000"
    fake_session = {
        "exercise": "squat",
        "reps": 10,
        "avg_accuracy": 84,
        "rep_accuracies": [82, 88, 79, 91, 80, 85, 77, 90, 83, 86],
    }

    print("=== SESSION SUMMARY TEST ===")
    summary = get_session_summary(fake_user_id, fake_session)
    print(summary)

    print("\n=== RECOMMENDATIONS TEST ===")
    recs = get_exercise_recommendations(fake_user_id, "build leg strength")
    print(recs)