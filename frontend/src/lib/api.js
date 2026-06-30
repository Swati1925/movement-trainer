// All backend API calls live here — never put raw fetch() calls in components.
// If the backend URL changes (e.g. when deploying to Render), only this file needs updating.

const BASE_URL = 'http://localhost:8000'

// Saves a completed session to Supabase via the backend
export async function saveSession(sessionData) {
  const res = await fetch(`${BASE_URL}/save-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  })
  if (!res.ok) throw new Error(`Save session failed: ${res.status}`)
  return res.json()
}

// Gets an AI-generated summary for a completed session (RAG pipeline)
export async function getAISummary(userId, session) {
  const res = await fetch(`${BASE_URL}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, session }),
  })
  if (!res.ok) throw new Error(`Summary failed: ${res.status}`)
  return res.json()
}

// Sends a chat message to the AI coach (RAG pipeline)
export async function chatWithCoach(userId, message, chatHistory = []) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      message,
      chat_history: chatHistory,
    }),
  })
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  return res.json()
}

// Gets exercise recommendations based on a goal (RAG pipeline)
export async function getRecommendations(userId, goal) {
  const res = await fetch(`${BASE_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, goal }),
  })
  if (!res.ok) throw new Error(`Recommendations failed: ${res.status}`)
  return res.json()
}