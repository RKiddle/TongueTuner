import React from 'react';
import { SupportedLanguage, PracticeScenario } from '../types';
import { PRACTICE_SCENARIOS, LANGUAGES } from '../data/languages';
import { audioController } from '../utils/audio';
import { MapPin, User, Volume2, ArrowRight, Compass, Sparkles } from 'lucide-react';

interface ScenarioSelectorProps {
  language: SupportedLanguage;
  currentScenarioId: string | null;
  onSelectScenario: (scenario: PracticeScenario) => void;
  voice: string;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  language,
  currentScenarioId,
  onSelectScenario,
  voice,
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
      }
    } catch (err) {
      console.error('Play phrase error:', err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <Compass className="h-4 w-4" />
          <span>Cultural Immersion Scenarios</span>
        </div>
        <h2 className="text-xl font-display font-bold text-white">
          Real-World Role-Play for {langInfo.name}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Choose a cultural context. Each scenario tests both your vocabulary and emotional/politeness posture in authentic conversational flow.
        </p>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((scenario) => {
          const isSelected = currentScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="space-y-4">
                {/* Location & Title */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{scenario.location}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                {/* Roles & Sentiment Goal */}
                <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400">Tutor:</span>
                    <span className="font-medium text-slate-200 truncate">{scenario.tutorRole}</span>
                  </div>
                  <div className="text-[11px] text-amber-300/80 pt-1 border-t border-slate-800/80">
                    <span className="font-semibold text-amber-400">Tone Goal:</span> {scenario.sentimentTarget}
                  </div>
                </div>

                {/* Essential Target Phrases */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Key Expressions (Click to hear):
                  </div>
                  <div className="space-y-1">
                    {scenario.targetPhrases.slice(0, 2).map((tp, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => handlePlayPhrase(tp.native, e)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition-colors text-left"
                      >
                        <div className="truncate mr-2">
                          <div className="text-xs font-medium text-white truncate">{tp.native}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{tp.romanized}</div>
                        </div>
                        <Volume2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className={`font-medium ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Active Scenario' : 'Select Scenario'}
                </span>
                <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
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
