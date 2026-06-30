import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// All exercises across all categories.
// 'key' must match a key in EXERCISE_CONFIG if the exercise is configured.
// 'configured: false' means no angle engine yet — shown as Coming Soon.
const EXERCISE_LIBRARY = {
  'Bodyweight / Cardio': [
    { name: 'Squat', key: 'squat', configured: true },
    { name: 'Lunge', key: 'lunge', configured: true },
    { name: 'Push-up', key: 'pushup', configured: true },
    { name: 'Burpees', key: 'burpees', configured: false },
    { name: 'Jumping Jacks', key: 'jumping_jacks', configured: false },
    { name: 'Mountain Climbers', key: 'mountain_climbers', configured: false },
  ],
  'Yoga': [
    { name: 'Downward Dog', key: 'downward_dog', configured: false },
    { name: 'Warrior I', key: 'warrior_i', configured: false },
    { name: 'Warrior II', key: 'warrior_ii', configured: false },
    { name: 'Child\'s Pose', key: 'childs_pose', configured: false },
    { name: 'Tree Pose', key: 'tree_pose', configured: false },
    { name: 'Cobra Pose', key: 'cobra_pose', configured: false },
  ],
  'Calisthenics': [
    { name: 'Pull-up Form', key: 'pullup', configured: false },
    { name: 'Dips', key: 'dips', configured: false },
    { name: 'Pike Push-up', key: 'pike_pushup', configured: false },
    { name: 'L-sit', key: 'lsit', configured: false },
    { name: 'Hollow Body Hold', key: 'hollow_body', configured: false },
  ],
}

const CATEGORIES = Object.keys(EXERCISE_LIBRARY)

function Exercises() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])

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

      <h1 style={{ marginBottom: '8px' }}>Exercise Library</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Pick an exercise to start a session with real-time form feedback.
      </p>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              backgroundColor: activeCategory === cat ? '#2563eb' : 'white',
              color: activeCategory === cat ? 'white' : '#374151',
              fontWeight: activeCategory === cat ? 'bold' : 'normal',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {EXERCISE_LIBRARY[activeCategory].map((exercise) => (
          <div
            key={exercise.key}
            style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              backgroundColor: exercise.configured ? 'white' : '#f9fafb',
              opacity: exercise.configured ? 1 : 0.7,
            }}
          >
            <p style={{
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '8px',
              color: '#111827',
            }}>
              {exercise.name}
            </p>

            {exercise.configured ? (
              <button
                onClick={() => navigate(`/exercise/${exercise.key}`)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Start →
              </button>
            ) : (
              <span style={{
                fontSize: '13px',
                color: '#9ca3af',
                fontStyle: 'italic',
              }}>
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Exercises