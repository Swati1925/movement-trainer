import { useRef, useEffect, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { processExercise } from '../utils/poseUtils'
import { EXERCISE_CONFIG } from '../config/exerciseConfig'
import { getAISummary, saveSession } from '../lib/api'
import { handleVoiceFeedback } from '../utils/voiceUtils'
function PoseCamera({ exerciseKey = 'squat', userId }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)

  // Per-frame tracking state — refs only, NEVER useState (would re-render 30x/sec)
  const stageRef = useRef('up')
  const repCountRef = useRef(0)
  const lastUIUpdateRef = useRef(0)
  const accuracyHistoryRef = useRef([]) // tracks every accuracy reading for avg calculation
  const sessionStartTimeRef = useRef(Date.now())

  // What's shown on screen during a live session
  const [displayStats, setDisplayStats] = useState({
    reps: 0,
    accuracy: 0,
    angle: 0,
    stage: 'up',
    feedback: null,
    visible: false,
  })

  // Post-session state
  const [sessionEnded, setSessionEnded] = useState(false)
  const [finalStats, setFinalStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(null)

  // Refs for cleanup
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const poseLandmarkerRef = useRef(null)

  useEffect(() => {
    let lastVideoTime = -1

    async function setup() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.addEventListener('loadeddata', () => {
          setLoading(false)
          predictLoop()
        })
      }
    }

    function predictLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !poseLandmarkerRef.current) return

      const ctx = canvas.getContext('2d')

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        const result = poseLandmarkerRef.current.detectForVideo(video, performance.now())

        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0]
          drawSkeleton(ctx, landmarks, canvas.width, canvas.height)

          const config = EXERCISE_CONFIG[exerciseKey]
          const exerciseResult = processExercise(
            landmarks,
            config,
            stageRef,
            repCountRef
          )

          const now = performance.now()
          if (now - lastUIUpdateRef.current > 200) {
            lastUIUpdateRef.current = now
            if (exerciseResult) {
              // Track accuracy readings for final average
              if (exerciseResult.accuracy > 0) {
                accuracyHistoryRef.current.push(exerciseResult.accuracy)
              }

              // Voice feedback — check if a rep just completed
              const repJustCompleted = exerciseResult.reps > repCountRef.current - 1 &&
                exerciseResult.stage === 'up' &&
                exerciseResult.reps > 0
              handleVoiceFeedback(exerciseResult.accuracy, repJustCompleted)

              setDisplayStats({ ...exerciseResult, visible: true })
            } else {
              setDisplayStats((prev) => ({ ...prev, visible: false }))
            }
          }
        }
        ctx.restore()
      }

      animationFrameRef.current = requestAnimationFrame(predictLoop)
    }

    setup()

    return () => {
      stopCamera()
    }
  }, [exerciseKey])

  function stopCamera() {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (poseLandmarkerRef.current) poseLandmarkerRef.current.close()
  }

  function handleEndSession() {
    stopCamera()

    const accuracies = accuracyHistoryRef.current
    const avgAccuracy = accuracies.length > 0
      ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
      : 0
    const durationSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000)

    const stats = {
      exercise: exerciseKey,
      reps: repCountRef.current,
      avg_accuracy: avgAccuracy,
      rep_accuracies: accuracies,
      duration_seconds: durationSeconds,
    }

    setFinalStats(stats)
    setSessionEnded(true)

    // Save to Supabase in the background — don't block the UI on this
    if (userId) {
      saveSession({ user_id: userId, ...stats }).catch((err) =>
        console.error('Failed to save session:', err)
      )
    }
  }

  async function handleViewSummary() {
    if (!finalStats) return
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const data = await getAISummary(userId || '00000000-0000-0000-0000-000000000000', finalStats)
      setSummary(data.summary)
    } catch (err) {
      setSummaryError('Could not load summary. Please try again.')
    } finally {
      setSummaryLoading(false)
    }
  }

  function handleStartAgain() {
    // Reset all state for a new session
    stageRef.current = 'up'
    repCountRef.current = 0
    accuracyHistoryRef.current = []
    sessionStartTimeRef.current = Date.now()
    setDisplayStats({ reps: 0, accuracy: 0, angle: 0, stage: 'up', feedback: null, visible: false })
    setSessionEnded(false)
    setFinalStats(null)
    setSummary(null)
    setSummaryError(null)
    // Reload the page to restart the camera cleanly
    window.location.reload()
  }

  // ── Post-session screen ──────────────────────────────────────────────────
  if (sessionEnded && finalStats) {
    return (
      <div style={{ maxWidth: '640px', fontSize: '18px' }}>
        <h2>Session Complete! 🎉</h2>
        <p>Exercise: {EXERCISE_CONFIG[exerciseKey].label}</p>
        <p>Reps: {finalStats.reps}</p>
        <p>Avg Accuracy: {finalStats.avg_accuracy}%</p>
        <p>Duration: {Math.floor(finalStats.duration_seconds / 60)}m {finalStats.duration_seconds % 60}s</p>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          {!summary && (
            <button
              onClick={handleViewSummary}
              disabled={summaryLoading}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: summaryLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {summaryLoading ? 'Loading summary...' : 'View AI Summary'}
            </button>
          )}
          <button
            onClick={handleStartAgain}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Start Again
          </button>
        </div>

        {summaryError && (
          <p style={{ color: 'red', marginTop: '12px' }}>{summaryError}</p>
        )}

        {summary && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            borderLeft: '4px solid #2563eb',
            lineHeight: '1.6',
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>AI Coach Summary</p>
            <p>{summary}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Live session screen ──────────────────────────────────────────────────
  return (
    <div>
      <div style={{ position: 'relative', width: '640px', height: '480px' }}>
        {loading && <p>Loading pose detection model...</p>}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            width: '640px',
            height: '480px',
            transform: 'scaleX(-1)',
          }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            position: 'absolute',
            width: '640px',
            height: '480px',
            transform: 'scaleX(-1)',
          }}
        />
      </div>

      <div style={{ marginTop: '10px', fontSize: '18px' }}>
        <p>Exercise: {EXERCISE_CONFIG[exerciseKey].label}</p>
        {!displayStats.visible && (
          <p style={{ color: 'orange' }}>⚠️ Move into frame — full body needed</p>
        )}
        <p>Reps: {displayStats.reps}</p>
        <p>Accuracy: {displayStats.accuracy}%</p>
        <p>Angle: {displayStats.angle}°</p>
        <p>Stage: {displayStats.stage}</p>
        {displayStats.feedback && (
          <p style={{ fontWeight: 'bold', color: '#2563eb' }}>
            {displayStats.feedback}
          </p>
        )}

        <button
          onClick={handleEndSession}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          End Session
        </button>
      </div>
    </div>
  )
}

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
]

function drawSkeleton(ctx, landmarks, width, height) {
  ctx.strokeStyle = '#00FF00'
  ctx.lineWidth = 3
  for (const [start, end] of POSE_CONNECTIONS) {
    const p1 = landmarks[start]
    const p2 = landmarks[end]
    if (p1 && p2) {
      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    }
  }

  ctx.fillStyle = '#FF0000'
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI)
    ctx.fill()
  }
}

export default PoseCamera