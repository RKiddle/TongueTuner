import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { audioController } from '../utils/audio';
import { X, Play, Check } from 'lucide-react';

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
  isDarkMode?: boolean;
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
  isDarkMode = true,
}) => {
  const [testingVoice, setTestingVoice] = useState(false);
  const langInfo = LANGUAGES[language];

  if (!isOpen) return null;

  const handleTestVoice = async (voiceName: string) => {
    const testPhrases: Record<SupportedLanguage, string> = {
      thai: 'สวัสดีครับผม! น้องช้างน้อยยินดีที่ได้คุยด้วยจังเลย',
      mandarin: '你好呀！我是包包大熊猫，超高兴认识你！',
      japanese: 'こんにちはワン！柴犬のモモだよ。一緒に楽しくおしゃべりしようね！',
    };

    try {
      setTestingVoice(true);
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
        audioController.speakWithBrowser(testPhrases[language], language, playbackSpeed, () => {
          setTestingVoice(false);
        });
      }
    } catch (err) {
      console.warn('Test voice error, using browser speech fallback:', err);
      audioController.speakWithBrowser(testPhrases[language], language, playbackSpeed, () => {
        setTestingVoice(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 shadow-2xl transition-colors border ${
          isDarkMode
            ? 'bg-[#101322] border-[#ff2d87]/40 shadow-[0_0_35px_rgba(255,45,135,0.2)]'
            : 'bg-white border-rose-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-rose-100'}`}>
          <div className="flex items-center gap-3">
            <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" />
            <div>
              <h2 className={`text-base font-bold ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
                Voice & Speech Settings
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
                Personalize Gemini 3.8 vocal synthesis for {langInfo.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-rose-50'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Voice Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-neon-blue' : 'text-slate-600'}`}>
                Select Gemini Voice Character
              </label>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-[#ff2d87]/20 text-neon-pink border border-[#ff2d87]/40' : 'bg-rose-50 text-rose-500'
                }`}
              >
                Gemini 3.8 TTS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {langInfo.recommendedVoices.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVoice(v.id)}
                    className={`cursor-pointer rounded-2xl p-3 border-2 text-left transition-all ${
                      isSelected
                        ? isDarkMode
                          ? 'border-[#ff2d87] bg-[#ff2d87]/20 shadow-[0_0_15px_rgba(255,45,135,0.4)]'
                          : 'border-rose-400 bg-rose-50/70 shadow-xs'
                        : isDarkMode
                        ? 'border-slate-800 bg-[#161a2c] hover:border-[#00e5ff]/50'
                        : 'border-slate-200/80 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{v.name}</span>
                        <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-neon-green' : 'text-rose-600'}`}>
                          ({v.gender})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(v.id);
                          }}
                          disabled={testingVoice}
                          className={`p-1 rounded-md ${
                            isDarkMode
                              ? 'text-slate-400 hover:text-neon-green hover:bg-[#00ff88]/20'
                              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-100'
                          }`}
                          title="Preview voice"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>
                        {isSelected && <Check className={`h-4 w-4 ${isDarkMode ? 'text-neon-green' : 'text-rose-500'}`} />}
                      </div>
                    </div>
                    <p className={`mt-1 text-xs line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {v.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speed Selection */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-neon-green' : 'text-slate-600'}`}>
              Speaking Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { speed: 0.75, label: '0.75x Slow', note: 'Tone practice' },
                { speed: 1.0, label: '1.0x Normal', note: 'Standard flow' },
                { speed: 1.25, label: '1.25x Fast', note: 'Fluent chat' },
              ].map((s) => (
                <button
                  key={s.speed}
                  onClick={() => onSelectSpeed(s.speed)}
                  className={`rounded-2xl p-2.5 text-center border-2 transition-all ${
                    playbackSpeed === s.speed
                      ? isDarkMode
                        ? 'border-[#00ff88] bg-[#00ff88]/20 text-neon-green font-bold shadow-[0_0_12px_rgba(0,255,136,0.3)]'
                        : 'border-rose-400 bg-rose-50/70 text-rose-700 font-bold'
                      : isDarkMode
                      ? 'border-slate-800 bg-[#161a2c] text-slate-300 hover:border-[#00e5ff]/50'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{s.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className={`space-y-3 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-rose-100'}`}>
            {/* Auto Play */}
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Auto-play Animal Coach Audio
                </div>
                <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Automatically hear tutor response aloud
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleAutoPlay(!autoPlayAudio)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPlayAudio
                    ? isDarkMode ? 'bg-[#ff2d87] shadow-[0_0_10px_rgba(255,45,135,0.6)]' : 'bg-rose-500'
                    : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
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
                <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Display Pronunciation Guides
                </div>
                <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Show Pinyin / Romaji / Thai RTGS above characters
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleRomanization(!showRomanization)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showRomanization
                    ? isDarkMode ? 'bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.6)]' : 'bg-rose-500'
                    : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
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
        <div className={`mt-6 pt-4 border-t flex justify-end ${isDarkMode ? 'border-slate-800' : 'border-rose-100'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
              isDarkMode
                ? 'bg-[#00ff88] text-slate-950 shadow-[0_0_15px_rgba(0,255,136,0.5)]'
                : 'text-white bg-rose-500 hover:bg-rose-600'
            }`}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
