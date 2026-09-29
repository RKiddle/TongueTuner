/**
 * Audio helper utility for Gemini 3.8 TTS audio playback and browser microphone recording
 */

class AudioController {
  private currentAudio: HTMLAudioElement | null = null;
  private onEndedCallback: (() => void) | null = null;
  private isBrowserSpeaking = false;

  public playBase64Wav(base64Data: string, speed = 1.0, onEnded?: () => void): HTMLAudioElement {
    this.stop();

    const audioUrl = base64Data.startsWith('data:')
      ? base64Data
      : `data:audio/wav;base64,${base64Data}`;

    const audio = new Audio(audioUrl);
    audio.playbackRate = speed;
    this.currentAudio = audio;
    this.onEndedCallback = onEnded || null;

    audio.onended = () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
      this.currentAudio = null;
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
      this.currentAudio = null;
    };

    audio.play().catch((err) => {
      console.warn('Auto-play blocked or audio playback error:', err);
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    return audio;
  }

  public speakWithBrowser(
    text: string,
    language: 'thai' | 'mandarin' | 'japanese',
    speed = 1.0,
    onEnded?: () => void
  ): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnded) onEnded();
      return;
    }

    this.stop();

    const langCodes: Record<'thai' | 'mandarin' | 'japanese', string> = {
      thai: 'th-TH',
      mandarin: 'zh-CN',
      japanese: 'ja-JP',
    };

    const targetLang = langCodes[language] || 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = Math.max(0.6, Math.min(1.5, speed));

    try {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) =>
        v.lang === targetLang ||
        v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase())
      );
      if (matched) {
        utterance.voice = matched;
      }
    } catch (e) {
      // voice selection fallback
    }

    this.isBrowserSpeaking = true;
    this.onEndedCallback = onEnded || null;

    utterance.onend = () => {
      this.isBrowserSpeaking = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    utterance.onerror = (err) => {
      console.warn('Browser speech synthesis error:', err);
      this.isBrowserSpeaking = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  public playOrSynthesize(
    audioBase64: string | null | undefined,
    fallbackText: string,
    language: 'thai' | 'mandarin' | 'japanese',
    speed = 1.0,
    onEnded?: () => void
  ): void {
    if (audioBase64) {
      this.playBase64Wav(audioBase64, speed, onEnded);
    } else if (fallbackText) {
      this.speakWithBrowser(fallbackText, language, speed, onEnded);
    } else {
      if (onEnded) onEnded();
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isBrowserSpeaking = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
      this.currentAudio = null;
    }
  }

  public isPlaying(): boolean {
    return (
      (this.currentAudio !== null && !this.currentAudio.paused) ||
      this.isBrowserSpeaking ||
      (typeof window !== 'undefined' && Boolean(window.speechSynthesis?.speaking))
    );
  }
}

export const audioController = new AudioController();

// Voice Recorder helper
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  public async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Determine supported mime type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      mimeType = 'audio/wav';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
  }

  public async stop(): Promise<{ blob: Blob; base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder not initialized'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Clean up stream tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve({ blob: audioBlob, base64, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  public isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
