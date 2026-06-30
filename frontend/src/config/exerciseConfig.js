// Maps landmark names to MediaPipe's 33-point index numbers.
// Only the points we actually need for angle calculations.
export const LANDMARK_INDEX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

// Each exercise is pure data: which 3 GENERIC joint types form the angle,
// what angle counts as "down" vs "up", what range counts as good form,
// and what text to show the user at each angle range.
// Points are side-agnostic (HIP, not LEFT_HIP) — processExercise() picks
// whichever side (left or right) is more visible to the camera each frame.
export const EXERCISE_CONFIG = {
  squat: {
    label: 'Squat',
    angleDefinition: {
      points: ['HIP', 'KNEE', 'ANKLE'],
    },
    downThreshold: 100,   // angle drops below this → counted as "down"
    upThreshold: 160,      // angle rises above this → counted as "up" (completes rep)
    idealRange: [80, 100], // best form at the bottom of the squat
    feedbackMessages: {
      tooShallow: 'Go lower for a deeper squat',
      tooDeep: "You're going too low, ease up slightly",
      good: 'Great form! Keep it up',
    },
  },

  pushup: {
    label: 'Push-up',
    angleDefinition: {
      points: ['SHOULDER', 'ELBOW', 'WRIST'],
    },
    downThreshold: 95,
    upThreshold: 160,
    idealRange: [70, 95],
    feedbackMessages: {
      tooShallow: 'Lower your chest more',
      tooDeep: "You're going too low, watch your shoulders",
      good: 'Great push-up form!',
    },
  },

  lunge: {
    label: 'Lunge',
    angleDefinition: {
      points: ['HIP', 'KNEE', 'ANKLE'],
    },
    downThreshold: 100,
    upThreshold: 160,
    idealRange: [80, 100],
    feedbackMessages: {
      tooShallow: 'Step lower into the lunge',
      tooDeep: 'Ease up slightly, knee is going too low',
      good: 'Great lunge form!',
    },
  },
}