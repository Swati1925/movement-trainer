import { useRef, useEffect, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { processExercise } from '../utils/poseUtils'
import { EXERCISE_CONFIG } from '../config/exerciseConfig'

function PoseCamera({ exerciseKey = 'squat' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)

  // Per-frame tracking state — refs only, NEVER useState (would re-render 30x/sec)
  const stageRef = useRef('up')
  const repCountRef = useRef(0)
  const lastUIUpdateRef = useRef(0)

  // What's actually shown on screen — updated only a few times per second, not every frame
  const [displayStats, setDisplayStats] = useState({
    reps: 0,
    accuracy: 0,
    angle: 0,
    stage: 'up',
    feedback: null,
    visible: false,
  })

  useEffect(() => {
    let stream
    let poseLandmarker
    let animationFrameId
    let lastVideoTime = -1

    async function setup() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.addEventListener('loadeddata', () => {
          setLoading(false)
          predictLoop()
        })
      }
    }

    function predictLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !poseLandmarker) return

      const ctx = canvas.getContext('2d')

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        const result = poseLandmarker.detectForVideo(video, performance.now())

        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0]
          drawSkeleton(ctx, landmarks, canvas.width, canvas.height)

          // Run the generic exercise engine on this frame
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
              setDisplayStats({ ...exerciseResult, visible: true })
            } else {
              setDisplayStats((prev) => ({ ...prev, visible: false }))
            }
          }
        }
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(predictLoop)
    }

    setup()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (stream) stream.getTracks().forEach((track) => track.stop())
      if (poseLandmarker) poseLandmarker.close()
    }
  }, [exerciseKey])

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