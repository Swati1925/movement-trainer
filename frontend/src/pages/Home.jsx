import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import PoseCamera from '../components/PoseCamera'

function Home() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)

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
      <h1>Movement Trainer — Home</h1>
      <p>You are logged in. This is the home screen.</p>
      <button onClick={handleLogout} style={{ padding: '8px 16px', marginBottom: '20px' }}>
        Log Out
      </button>
      <button
        onClick={() => navigate('/chat')}
        style={{ padding: '8px 16px', marginBottom: '20px', marginLeft: '12px' }}
      >
        💬 AI Coach Chat
      </button>
      <PoseCamera userId={userId} />
    </div>
  )
}

export default Home