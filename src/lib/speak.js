export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(text))
    u.rate = 0.92
    u.pitch = 1.2
    const voices = window.speechSynthesis.getVoices?.() || []
    const voice =
      voices.find((v) => /female|samantha|karen|zira|google uk english female/i.test(v.name)) ||
      voices.find((v) => v.lang && v.lang.startsWith('en'))
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}
