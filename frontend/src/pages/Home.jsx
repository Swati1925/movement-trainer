import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import PoseCamera from '../components/PoseCamera'

function Home() {
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()
  const { exerciseKey } = useParams()

  // Get the logged-in user's ID when the page loads
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '700px', margin: '50px auto', padding: '20px' }}>
      <h1>Movement Trainer</h1>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>
          Log Out
        </button>
        <button
          onClick={() => navigate('/chat')}
          style={{ padding: '8px 16px' }}
        >
          💬 AI Coach Chat
        </button>
        <button
          onClick={() => navigate('/exercises')}
          style={{ padding: '8px 16px' }}
        >
          📋 Exercise Library
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '8px 16px' }}
        >
          📊 Dashboard
        </button>
      </div>
      <PoseCamera
        userId={userId}
        exerciseKey={exerciseKey || 'squat'}
      />
    </div>
  )
}

export default Home