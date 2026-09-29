import React from 'react';
import { SupportedLanguage, PracticeScenario } from '../types';
import { PRACTICE_SCENARIOS, LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { audioController } from '../utils/audio';
import { MapPin, Volume2, ArrowRight, Sparkles } from 'lucide-react';

interface ScenarioSelectorProps {
  language: SupportedLanguage;
  currentScenarioId: string | null;
  onSelectScenario: (scenario: PracticeScenario) => void;
  voice: string;
  isDarkMode?: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  language,
  currentScenarioId,
  onSelectScenario,
  voice,
  isDarkMode = true,
}) => {
  const scenarios = PRACTICE_SCENARIOS.filter((s) => s.language === language);
  const langInfo = LANGUAGES[language];

  const handlePlayPhrase = async (phrase: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase,
          language,
          voice,
          speed: 'normal',
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64);
      } else {
        audioController.speakWithBrowser(phrase, language);
      }
    } catch (err) {
      console.warn('Play phrase error, using speech fallback:', err);
      audioController.speakWithBrowser(phrase, language);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Banner */}
      <div
        className={`rounded-3xl border p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 transition-colors ${
          isDarkMode
            ? 'border-[#ff2d87]/30 bg-gradient-to-r from-[#141726] via-[#1b1429] to-[#101e28] shadow-[0_0_30px_rgba(255,45,135,0.1)]'
            : 'border-rose-100 bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50'
        }`}
      >
        <AnimalAvatar animal={langInfo.tutorAnimal} size="lg" />
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs mb-1 ${
              isDarkMode
                ? 'bg-[#ff2d87]/15 border-[#ff2d87]/40 text-neon-pink'
                : 'bg-white/90 border-rose-200 text-rose-700'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#ff2d87]' : 'text-rose-400'}`} />
            <span>Role-Play with {langInfo.tutorName}</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-display font-bold ${
              isDarkMode ? 'text-neon-pink' : 'text-slate-800'
            }`}
          >
            Adventures in {langInfo.name}
          </h2>
          <p className={`text-xs mt-0.5 max-w-2xl ${isDarkMode ? 'text-neon-blue' : 'text-slate-600'}`}>
            Join your cute animal buddy in authentic everyday situations! Practice ordering food, navigating streets, and casual small talk.
          </p>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((scenario) => {
          const isSelected = currentScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`group cursor-pointer rounded-3xl border-2 p-5 transition-all duration-200 flex flex-col justify-between shadow-xs ${
                isSelected
                  ? isDarkMode
                    ? 'border-[#ff2d87] bg-[#ff2d87]/15 shadow-[0_0_25px_rgba(255,45,135,0.3)] ring-1 ring-[#ff2d87]'
                    : 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-200'
                  : isDarkMode
                  ? 'border-[#00e5ff]/25 bg-[#121524] hover:border-[#00ff88] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]'
                  : 'border-slate-200/80 bg-white hover:border-amber-300'
              }`}
            >
              <div className="space-y-3.5">
                {/* Location & Title */}
                <div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${
                      isDarkMode ? 'text-neon-green' : 'text-rose-500'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{scenario.location}</span>
                  </div>
                  <h3
                    className={`text-base font-bold transition-colors ${
                      isDarkMode
                        ? 'text-white group-hover:text-neon-pink'
                        : 'text-slate-800 group-hover:text-rose-600'
                    }`}
                  >
                    {scenario.title}
                  </h3>
                  <p
                    className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {scenario.description}
                  </p>
                </div>

                {/* Roles & Sentiment Goal */}
                <div
                  className={`rounded-2xl border p-3 space-y-1.5 text-xs ${
                    isDarkMode
                      ? 'bg-[#181d2e] border-[#00e5ff]/30 text-slate-200'
                      : 'bg-amber-50/60 border-amber-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" />
                    <span className={`font-semibold truncate ${isDarkMode ? 'text-neon-blue' : 'text-slate-800'}`}>
                      {scenario.tutorRole}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] pt-1 border-t ${
                      isDarkMode ? 'border-slate-800 text-neon-green' : 'border-amber-200/50 text-amber-800'
                    }`}
                  >
                    <span className="font-bold">Goal:</span> {scenario.sentimentTarget}
                  </div>
                </div>

                {/* Essential Target Phrases */}
                <div className="space-y-1.5">
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-neon-blue' : 'text-slate-400'}`}>
                    Key Expressions (Tap to listen):
                  </div>
                  <div className="space-y-1">
                    {scenario.targetPhrases.slice(0, 2).map((tp, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => handlePlayPhrase(tp.native, e)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-colors text-left ${
                          isDarkMode
                            ? 'bg-[#0f111c] hover:bg-[#15192c] border-[#00e5ff]/20'
                            : 'bg-slate-50 hover:bg-rose-50 border-slate-100'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
                            {tp.native}
                          </div>
                          <div className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-neon-green' : 'text-slate-400'}`}>
                            {tp.romanized}
                          </div>
                        </div>
                        <Volume2 className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? 'text-[#00e5ff]' : 'text-slate-400 group-hover:text-rose-500'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-100'
                }`}
              >
                <span
                  className={`font-bold ${
                    isSelected
                      ? isDarkMode ? 'text-neon-pink' : 'text-rose-600'
                      : isDarkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {isSelected ? 'Active Adventure' : 'Choose Adventure'}
                </span>
                <div
                  className={`flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform ${
                    isDarkMode ? 'text-neon-green' : 'text-rose-600'
                  }`}
                >
                  <span>Start Roleplay</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
