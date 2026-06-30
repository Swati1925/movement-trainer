console.log('POSEUTILS FILE LOADED - TEST 12345')
import { LANDMARK_INDEX } from '../config/exerciseConfig'

// Calculates the angle (in degrees) at point b, formed by points a-b-c.
// b is the vertex — the actual joint we're measuring.
export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)
  if (angle > 180.0) {
    angle = 360 - angle
  }
  return angle
}

// Scores how close the current angle is to the ideal range, 0-100.
// Only meaningful at the "down" position — at the top of a rep, form isn't being tested.
export function scoreAccuracy(angle, idealRange) {
  const [min, max] = idealRange

  // Inside the ideal range = perfect score
  if (angle >= min && angle <= max) {
    return 100
  }

  // Outside the range — score drops the further away you are.
  // 30 degrees off ideal = score of 0 (tune this later based on testing).
  const distance = angle < min ? min - angle : angle - max
  const maxPenaltyDistance = 30
  const score = 100 - (distance / maxPenaltyDistance) * 100

  return Math.max(0, Math.round(score))
}

// Picks the right feedback text for the current angle, using the same
// "above/below/inside ideal range" logic as scoreAccuracy — just turned
// into words instead of a number. Pure lookup, no AI call: this needs to
// run every frame in real time, which only a local rule can do fast enough.
export function getFeedbackMessage(angle, idealRange, feedbackMessages) {
  const [min, max] = idealRange

  if (angle < min) {
    return feedbackMessages.tooDeep
  }
  if (angle > max) {
    return feedbackMessages.tooShallow
  }
  return feedbackMessages.good
}

// Decides ONE side (LEFT or RIGHT) for this entire frame, based on hip
// visibility only. Hip is the largest, most stable landmark — far less
// noisy than knee/ankle — so it's the right joint to use as the deciding
// vote. We then use that SAME side for every joint in the chain, so we
// never mix e.g. a LEFT hip with a RIGHT knee, which would produce a
// geometrically meaningless angle.
function pickSideForFrame(landmarks) {
  const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP]
  const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP]

  const leftHipVisibility = leftHip?.visibility ?? 0
  const rightHipVisibility = rightHip?.visibility ?? 0

  return leftHipVisibility >= rightHipVisibility ? 'LEFT' : 'RIGHT'
}

// Generic processor — works for ANY exercise defined in exerciseConfig.js.
// No exercise-specific branching here, ever.
// Side (left vs right) is decided once per frame via pickSideForFrame(),
// then every joint in this exercise's chain uses that same side.
export function processExercise(landmarks, config, stageRef, repCountRef) {
  const { points } = config.angleDefinition
  const [aType, bType, cType] = points

  const side = pickSideForFrame(landmarks)

  const aIndex = LANDMARK_INDEX[`${side}_${aType}`]
  const bIndex = LANDMARK_INDEX[`${side}_${bType}`]
  const cIndex = LANDMARK_INDEX[`${side}_${cType}`]

  const a = landmarks[aIndex]
  const b = landmarks[bIndex]
  const c = landmarks[cIndex]

  const VISIBILITY_THRESHOLD = 0.3
  if (
    !a || !b || !c ||
    a.visibility < VISIBILITY_THRESHOLD ||
    b.visibility < VISIBILITY_THRESHOLD ||
    c.visibility < VISIBILITY_THRESHOLD
  ) {
    return null
  }

  const angle = calculateAngle(a, b, c)

  // TEMPORARY DEBUG — checking why reps increment without movement
  console.log('Frame:', JSON.stringify({
    side,
    angle: Math.round(angle),
    stage: stageRef.current,
  }))

  if (angle < config.downThreshold && stageRef.current === 'up') {
    stageRef.current = 'down'
  }
  if (angle > config.upThreshold && stageRef.current === 'down') {
    stageRef.current = 'up'
    repCountRef.current += 1
  }

  const accuracy = scoreAccuracy(angle, config.idealRange)

  // Only show depth feedback while actually at the bottom of a rep —
  // at the top, there's nothing meaningful to say about depth yet.
  const feedback =
    stageRef.current === 'down'
      ? getFeedbackMessage(angle, config.idealRange, config.feedbackMessages)
      : null

  return {
    angle: Math.round(angle),
    accuracy,
    reps: repCountRef.current,
    stage: stageRef.current,
    feedback,
  }
}