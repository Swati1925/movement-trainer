import { useState } from 'react'
import { chatWithCoach } from '../lib/api'

function AICoachChat({ userId }) {
  const [messages, setMessages] = useState([
    {
      role: 'coach',
      text: "Hi! I'm your AI fitness coach. Ask me anything about your workouts, form, or goals.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    // Add user message to chat immediately
    const userMessage = { role: 'user', text: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Send to backend — pass full chat history for context
      const data = await chatWithCoach(
        userId || '00000000-0000-0000-0000-000000000000',
        trimmed,
        updatedMessages
      )
      setMessages((prev) => [...prev, { role: 'coach', text: data.response }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'coach', text: 'Sorry, I had trouble connecting. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    // Send on Enter, allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ marginBottom: '16px' }}>AI Coach Chat</h2>

      {/* Message history */}
      <div style={{
        height: '400px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
              color: msg.role === 'user' ? 'white' : '#111827',
              fontSize: '15px',
              lineHeight: '1.5',
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '15px',
          }}>
            Coach is thinking...
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach anything... (Enter to send)"
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            backgroundColor: loading || !input.trim() ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-end',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default AICoachChat