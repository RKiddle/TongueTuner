import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { audioController } from '../utils/audio';
import { X, Volume2, Play, Check, Sparkles } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  playbackSpeed: number;
  onSelectSpeed: (speed: number) => void;
  autoPlayAudio: boolean;
  onToggleAutoPlay: (val: boolean) => void;
  showRomanization: boolean;
  onToggleRomanization: (val: boolean) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  selectedVoice,
  onSelectVoice,
  playbackSpeed,
  onSelectSpeed,
  autoPlayAudio,
  onToggleAutoPlay,
  showRomanization,
  onToggleRomanization,
}) => {
  const [testingVoice, setTestingVoice] = useState(false);
  const langInfo = LANGUAGES[language];

  if (!isOpen) return null;

  const handleTestVoice = async (voiceName: string) => {
    try {
      setTestingVoice(true);
      const testPhrases: Record<SupportedLanguage, string> = {
        thai: 'สวัสดีค่ะ ยินดีต้อนรับสู่การฝึกออกเสียงภาษาไทยนะคะ',
        mandarin: '你好！欢迎使用智能普通话语音练习系统。',
        japanese: 'こんにちは！日本語の発音と感情の練習へようこそ。',
      };

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testPhrases[language],
          language,
          voice: voiceName,
          speed: playbackSpeed < 1 ? 'slow' : 'normal',
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64, playbackSpeed, () => {
          setTestingVoice(false);
        });
      } else {
        setTestingVoice(false);
      }
    } catch (err) {
      console.error('Test voice error:', err);
      setTestingVoice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Gemini 3.8 TTS Engine Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize speech synthesis, cadence, and learning overlays for {langInfo.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-6">
          {/* Voice Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Prebuilt Gemini Voice
              </label>
              <span className="text-xs text-amber-400 font-medium">Model: gemini-3.8-flash-lite-tts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {langInfo.recommendedVoices.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVoice(v.id)}
                    className={`cursor-pointer rounded-xl p-3 border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{v.name}</span>
                        <span className="text-xs text-slate-400">({v.gender})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(v.id);
                          }}
                          disabled={testingVoice}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                          title="Preview voice"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>
                        {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-1">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speed Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Playback Cadence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { speed: 0.75, label: '0.75x Slow (Learner)', note: 'Clear syllable articulation' },
                { speed: 1.0, label: '1.0x Normal', note: 'Standard conversational speed' },
                { speed: 1.25, label: '1.25x Fast', note: 'Native fluent pacing' },
              ].map((s) => (
                <button
                  key={s.speed}
                  onClick={() => onSelectSpeed(s.speed)}
                  className={`rounded-lg p-2.5 text-center border transition-all ${
                    playbackSpeed === s.speed
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Auto Play */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Auto-play Tutor Speech</div>
                <div className="text-xs text-slate-400">Automatically stream Gemini 3.8 audio upon receiving response</div>
              </div>
              <button
                type="button"
                onClick={() => onToggleAutoPlay(!autoPlayAudio)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPlayAudio ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPlayAudio ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Phonetic romanization toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Display Phonetic Guides</div>
                <div className="text-xs text-slate-400">Show Pinyin / Romaji / Thai RTGS above native script</div>
              </div>
              <button
                type="button"
                onClick={() => onToggleRomanization(!showRomanization)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showRomanization ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showRomanization ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
