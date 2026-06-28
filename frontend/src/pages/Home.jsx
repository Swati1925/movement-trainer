import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import PoseCamera from '../components/PoseCamera'

function Home() {
  const navigate = useNavigate()

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
      <PoseCamera />
    </div>
  )
}

export default Home