import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()

# Create Supabase client once, reused across calls
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY"),
)


def save_session(user_id: str, exercise: str, reps: int, avg_accuracy: int,
                 rep_accuracies: list, duration_seconds: int, notes: str = None):
    """
    Saves a completed exercise session to Supabase.
    Called at the end of a session when the user finishes exercising.
    """
    data = {
        "user_id": user_id,
        "exercise": exercise,
        "reps": reps,
        "avg_accuracy": avg_accuracy,
        "rep_accuracies": rep_accuracies,
        "duration_seconds": duration_seconds,
        "notes": notes,
    }
    result = supabase.table("sessions").insert(data).execute()
    return result.data


def get_recent_sessions(user_id: str, exercise: str = None, limit: int = 5):
    """
    Fetches the user's most recent sessions from Supabase.
    Used by the RAG pipeline to inject real history into Gemini prompts.
    If exercise is provided, filters to just that exercise type.
    If not, returns the most recent sessions across all exercises.
    """
    query = (
        supabase.table("sessions")
        .select("exercise, reps, avg_accuracy, rep_accuracies, duration_seconds, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    # Only filter by exercise if one was specified
    if exercise:
        query = query.eq("exercise", exercise)

    result = query.execute()
    return result.data


def format_sessions_for_prompt(sessions: list) -> str:
    """
    Converts raw session data into a readable text block for Gemini prompts.
    This is what gets injected into the RAG pipeline before each AI call.
    Example output:
        - squat session on 2026-06-29: 10 reps, avg accuracy 84%, rep accuracies [82, 88, 79]
        - squat session on 2026-06-27: 8 reps, avg accuracy 71%, rep accuracies [68, 74, 71]
    """
    if not sessions:
        return "No previous sessions found."

    lines = []
    for s in sessions:
        date = s["created_at"][:10]  # just the date part, e.g. "2026-06-29"
        line = (
            f"- {s['exercise']} session on {date}: "
            f"{s['reps']} reps, avg accuracy {s['avg_accuracy']}%, "
            f"rep accuracies {s['rep_accuracies']}"
        )
        lines.append(line)

    return "\n".join(lines)


# Quick manual test — run this file directly to check the connection works:
# python database.py
if __name__ == "__main__":
    # Test with a fake user_id just to verify the query runs without errors
    # (will return empty list since no real sessions exist yet, that's expected)
    test_user_id = "00000000-0000-0000-0000-000000000000"
    sessions = get_recent_sessions(test_user_id, exercise="squat")
    print("Fetched sessions:")
    print(sessions)
    print()
    print("Formatted for prompt:")
    print(format_sessions_for_prompt(sessions))