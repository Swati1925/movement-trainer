// Voice feedback using the Web Speech API — built into every modern browser,
// completely free, no external library needed.
// Speaks only on meaningful moments: seriously bad form or a great rep.
// Never speaks constantly — that would be annoying during a real workout.

let lastSpokenAt = 0
const COOLDOWN_MS = 4000 // minimum 4 seconds between any two voice messages

function speak(text) {
  const now = Date.now()
  if (now - lastSpokenAt < COOLDOWN_MS) return // respect cooldown
  if (!window.speechSynthesis) return // browser doesn't support it

  // Cancel any currently speaking message before starting a new one
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.0   // normal speed
  utterance.pitch = 1.0  // normal pitch
  utterance.volume = 1.0 // full volume

  window.speechSynthesis.speak(utterance)
  lastSpokenAt = now
}

// Called every frame during a session.
// Speaks only when accuracy is very low (bad form) or perfect (great form).
// repJustCompleted: true only on the exact frame a rep finishes.
export function handleVoiceFeedback(accuracy, repJustCompleted) {
  if (repJustCompleted) {
    if (accuracy >= 90) {
      speak('Great rep! Keep it up.')
    } else if (accuracy < 50) {
      speak('Watch your form on that rep.')
    }
    return // only one message per rep completion
  }

  // Mid-rep: warn if form is seriously wrong (very low accuracy while going down)
  if (accuracy > 0 && accuracy < 40) {
    speak('Fix your form.')
  }
}