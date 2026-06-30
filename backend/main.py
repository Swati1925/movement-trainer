from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from ai_coach import get_session_summary, get_exercise_recommendations, chat_with_coach
from database import save_session

load_dotenv()

app = FastAPI()

# Allow requests from the React frontend running on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ──────────────────────────────────────────────────────────
# These define exactly what JSON shape each endpoint expects from the frontend.

class SessionData(BaseModel):
    user_id: str
    exercise: str
    reps: int
    avg_accuracy: int
    rep_accuracies: list
    duration_seconds: int
    notes: Optional[str] = None


class SummaryRequest(BaseModel):
    user_id: str
    session: dict


class ChatMessage(BaseModel):
    user_id: str
    message: str
    chat_history: list = []


class RecommendRequest(BaseModel):
    user_id: str
    goal: str


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Movement Trainer backend is running"}


@app.post("/save-session")
def save_session_route(data: SessionData):
    """
    Saves a completed exercise session to Supabase.
    Called by the frontend at the end of every session.
    """
    try:
        result = save_session(
            user_id=data.user_id,
            exercise=data.exercise,
            reps=data.reps,
            avg_accuracy=data.avg_accuracy,
            rep_accuracies=data.rep_accuracies,
            duration_seconds=data.duration_seconds,
            notes=data.notes,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summary")
def get_summary(request: SummaryRequest):
    """
    RAG pipeline: fetches user's past sessions from Supabase,
    injects them into a Gemini prompt, returns personalised summary.
    Called when user clicks 'View AI Summary' after a session.
    """
    try:
        summary = get_session_summary(
            user_id=request.user_id,
            today_session=request.session,
        )
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(request: ChatMessage):
    """
    AI coach chat. Fetches user history from Supabase,
    responds to the user's message with personalised advice.
    """
    try:
        response = chat_with_coach(
            user_id=request.user_id,
            message=request.message,
            chat_history=request.chat_history,
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend")
def recommend(request: RecommendRequest):
    """
    Exercise recommendations based on the user's goal and training history.
    """
    try:
        recommendations = get_exercise_recommendations(
            user_id=request.user_id,
            goal=request.goal,
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))