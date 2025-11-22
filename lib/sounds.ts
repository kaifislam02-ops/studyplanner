// lib/sounds.ts

export type SoundType = 
  | 'notification'
  | 'alarm'
  | 'pomodoro-start'
  | 'pomodoro-break'
  | 'pomodoro-complete'
  | 'task-complete'
  | 'success'
  | 'error';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.loadPreference();
    }
  }

  private loadPreference() {
    const saved = localStorage.getItem('sound-preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      this.enabled = prefs.enabled ?? true;
      this.volume = prefs.volume ?? 0.5;
    }
  }

  savePreference() {
    localStorage.setItem('sound-preferences', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume,
    }));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.savePreference();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.savePreference();
  }

  getVolume() {
    return this.volume;
  }

  isEnabled() {
    return this.enabled;
  }

  // Generate tones using Web Audio API
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play different sound patterns
  play(type: SoundType) {
    if (!this.enabled) return;

    switch (type) {
      case 'notification':
        this.playNotification();
        break;
      case 'alarm':
        this.playAlarm();
        break;
      case 'pomodoro-start':
        this.playPomodoroStart();
        break;
      case 'pomodoro-break':
        this.playPomodoroBreak();
        break;
      case 'pomodoro-complete':
        this.playPomodoroComplete();
        break;
      case 'task-complete':
        this.playTaskComplete();
        break;
      case 'success':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
    }
  }

  private playNotification() {
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.1), 100);
  }

  private playAlarm() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(880, 0.3);
        setTimeout(() => this.playTone(440, 0.3), 300);
      }, i * 600);
    }
  }

  private playPomodoroStart() {
    this.playTone(523, 0.15); // C
    setTimeout(() => this.playTone(659, 0.15), 150); // E
    setTimeout(() => this.playTone(784, 0.3), 300); // G
  }

  private playPomodoroBreak() {
    this.playTone(784, 0.2); // G
    setTimeout(() => this.playTone(659, 0.2), 200); // E
    setTimeout(() => this.playTone(523, 0.4), 400); // C
  }

  private playPomodoroComplete() {
    const notes = [523, 587, 659, 784]; // C, D, E, G
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2), i * 150);
    });
  }

  private playTaskComplete() {
    this.playTone(659, 0.1);
    setTimeout(() => this.playTone(784, 0.2), 100);
  }

  private playSuccess() {
    this.playTone(523, 0.1);
    setTimeout(() => this.playTone(659, 0.1), 100);
    setTimeout(() => this.playTone(784, 0.2), 200);
  }

  private playError() {
    this.playTone(300, 0.3, 'square');
  }

  // Browser notification with sound
  async notify(title: string, body: string, sound: SoundType = 'notification') {
    this.play(sound);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

// Export singleton instance
export const soundManager = new SoundManager();