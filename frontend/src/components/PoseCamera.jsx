import { useRef, useEffect, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

function PoseCamera() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stream
    let poseLandmarker
    let animationFrameId
    let lastVideoTime = -1

    async function setup() {
      // STEP 1: Load the MediaPipe pose detection model
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      // STEP 2: Start the webcam
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
          for (const landmarks of result.landmarks) {
            drawSkeleton(ctx, landmarks, canvas.width, canvas.height)
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
  }, [])

  return (
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
  )
}

// Connections between landmark points that form the skeleton (MediaPipe's standard 33-point pose model)
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // arms + shoulders
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], // left leg
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32], // right leg
]

function drawSkeleton(ctx, landmarks, width, height) {
  // Draw connecting lines
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

  // Draw landmark dots
  ctx.fillStyle = '#FF0000'
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI)
    ctx.fill()
  }
}

export default PoseCamera