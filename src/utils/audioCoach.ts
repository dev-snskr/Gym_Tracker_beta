/**
 * Hands-free Voice Coaching via Web Speech API and Web Audio API tone cues.
 * Throttled with a strict cooldown timer to avoid cognitive audio overload.
 */

class AudioCoach {
  private isMuted: boolean = false;
  private lastSpokenTime: number = 0;
  private cooldownMs: number = 2800; // minimum gap between verbal cues
  private audioCtx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoice();
    }
  }

  private initVoice() {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer natural sounding English voices
        this.voice =
          voices.find(
            (v) =>
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) &&
              v.lang.startsWith('en')
          ) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null;
      };

      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * High-pitch chime for a successful repetition
   */
  public playRepChime(repNumber: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pleasant harmonic double-beep
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Low warning alert chime for form deviation
   */
  public playWarningBuzz() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(164.81, ctx.currentTime + 0.2); // E3

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignore audio error
    }
  }

  /**
   * Verbal cue with strict cooldown throttling
   */
  public speak(text: string, force: boolean = false) {
    if (this.isMuted || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!force && now - this.lastSpokenTime < this.cooldownMs) {
      return; // Throttled to avoid overwhelming the athlete
    }

    try {
      window.speechSynthesis.cancel(); // Don't queue endless messages
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.rate = 1.08; // slightly brisk coaching tempo
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error fallback
    }
  }

  public coachRepCount(repNumber: number) {
    this.playRepChime(repNumber);
    // Announce count
    this.speak(`${repNumber}`, true);
  }

  public coachFormError(correction: string) {
    this.playWarningBuzz();
    this.speak(correction, false);
  }

  public coachIncompleteRep() {
    this.playWarningBuzz();
    this.speak('Hit full depth before coming up', true);
  }
}

export const audioCoach = new AudioCoach();
