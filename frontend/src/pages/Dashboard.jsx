import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts'

function Dashboard() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        navigate('/login')
        return
      }
      setUserId(data.user.id)
      fetchSessions(data.user.id)
    })
  }, [])

  async function fetchSessions(uid) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })

    if (!error) setSessions(data || [])
    setLoading(false)
  }

  // ── Derived data for charts ──────────────────────────────────────────────

  // Accuracy trend: one point per session, x = date, y = avg_accuracy
  const accuracyData = sessions.map((s) => ({
    date: s.created_at.slice(0, 10),
    accuracy: s.avg_accuracy,
    exercise: s.exercise,
  }))

  // Sessions per week: group by ISO week
  const weekMap = {}
  sessions.forEach((s) => {
    const date = new Date(s.created_at)
    const week = getWeekLabel(date)
    weekMap[week] = (weekMap[week] || 0) + 1
  })
  const weeklyData = Object.entries(weekMap).map(([week, count]) => ({
    week,
    sessions: count,
  }))

  // Summary stats
  const totalSessions = sessions.length
  const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0)
  const bestAccuracy = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.avg_accuracy))
    : 0

  if (loading) {
    return (
      <div style={{ maxWidth: '700px', margin: '50px auto', padding: '20px' }}>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

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

      <h1 style={{ marginBottom: '24px' }}>Progress Dashboard</h1>

      {sessions.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          border: '1px dashed #e5e7eb',
          borderRadius: '12px',
          color: '#6b7280',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No sessions yet!</p>
          <p>Complete your first exercise session to see your progress here.</p>
          <button
            onClick={() => navigate('/exercises')}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go to Exercise Library
          </button>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Total Sessions', value: totalSessions },
              { label: 'Total Reps', value: totalReps },
              { label: 'Best Accuracy', value: `${bestAccuracy}%` },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Accuracy trend chart */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px' }}>Accuracy Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sessions per week chart */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px' }}>Sessions Per Week</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#2563eb" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent sessions list */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>Recent Sessions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...sessions].reverse().slice(0, 5).map((s) => (
                <div key={s.id} style={{
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {s.exercise}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '8px' }}>
                      {s.created_at.slice(0, 10)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                    <span>{s.reps} reps</span>
                    <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                      {s.avg_accuracy}% accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Returns a readable week label like "Jun 23 - Jun 29"
function getWeekLabel(date) {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} - ${fmt(end)}`
}

export default Dashboard