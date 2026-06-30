import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import AICoachChat from '../components/AICoachChat'

function Chat() {
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        navigate('/login')
      } else {
        setUserId(data.user.id)
      }
    })
  }, [])

  return (
    <div style={{ maxWidth: '700px', margin: '50px auto', padding: '20px' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'white',
        }}
      >
        ← Back to Home
      </button>
      <AICoachChat userId={userId} />
    </div>
  )
}

export default Chat