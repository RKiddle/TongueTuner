import React from 'react';
import { SentimentAnalysis, SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { Sparkles, Volume2, TrendingUp } from 'lucide-react';

interface SentimentFeedbackPanelProps {
  analysis: SentimentAnalysis | null;
  language: SupportedLanguage;
  scenarioTitle?: string;
  onPlayPhrase: (phrase: string) => void;
  voice: string;
  isDarkMode?: boolean;
}

export const SentimentFeedbackPanel: React.FC<SentimentFeedbackPanelProps> = ({
  analysis,
  language,
  scenarioTitle,
  onPlayPhrase,
  voice,
  isDarkMode = true,
}) => {
  const langInfo = LANGUAGES[language];

  if (!analysis) {
    return (
      <div
        className={`rounded-3xl border p-5 shadow-sm space-y-4 transition-colors ${
          isDarkMode
            ? 'border-[#00e5ff]/30 bg-[#0f111a]/95 shadow-[0_0_25px_rgba(0,229,255,0.08)]'
            : 'border-rose-100 bg-white/95'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3.5 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-rose-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💖</span>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
              Tone & Emotion Radar
            </h3>
          </div>
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-neon-green' : 'text-rose-500'}`}>
            {langInfo.name}
          </span>
        </div>

        <div className="py-8 text-center space-y-2">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border mb-2 ${
              isDarkMode ? 'bg-[#151928] border-[#00e5ff]/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'bg-rose-50 border-rose-100'
            }`}
          >
            <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" />
          </div>
          <h4 className={`text-sm font-bold ${isDarkMode ? 'text-neon-blue' : 'text-slate-800'}`}>
            {langInfo.tutorName} is Ready!
          </h4>
          <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Send a message or voice clip. Your cute animal coach will analyze your mood, politeness, and tone curve!
          </p>
        </div>

        <div className={`pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-rose-100'}`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-neon-green' : 'text-slate-500'}`}>
            ✨ Key Polite Words ({langInfo.name})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {langInfo.keyPoliteParticles.map((particle, idx) => (
              <button
                key={idx}
                onClick={() => onPlayPhrase(particle.split(' ')[0])}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors border text-left ${
                  isDarkMode
                    ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-blue hover:text-neon-green border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-slate-700 hover:text-slate-900 border-amber-200/60'
                }`}
              >
                <span className="font-semibold truncate">{particle}</span>
                <Volume2 className={`h-3 w-3 shrink-0 ml-1 ${isDarkMode ? 'text-[#00e5ff]' : 'text-amber-600'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get cute color tags for emotional tone
  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'confident':
        return isDarkMode
          ? 'text-neon-green border-[#00ff88]/50 bg-[#00ff88]/20 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
          : 'text-emerald-700 border-emerald-300 bg-emerald-100/70';
      case 'hesitant':
      case 'nervous':
        return isDarkMode
          ? 'text-neon-pink border-[#ff2d87]/50 bg-[#ff2d87]/20 shadow-[0_0_10px_rgba(255,45,135,0.3)]'
          : 'text-amber-700 border-amber-300 bg-amber-100/70';
      case 'warm':
      case 'polite':
        return isDarkMode
          ? 'text-neon-blue border-[#00e5ff]/50 bg-[#00e5ff]/20 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
          : 'text-rose-700 border-rose-300 bg-rose-100/70';
      default:
        return isDarkMode
          ? 'text-neon-green border-[#00ff88]/40 bg-[#00ff88]/15'
          : 'text-sky-700 border-sky-300 bg-sky-100/70';
    }
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm space-y-4 transition-colors ${
        isDarkMode
          ? 'border-[#00e5ff]/30 bg-[#0f111a]/95 shadow-[0_0_25px_rgba(0,229,255,0.08)]'
          : 'border-rose-100 bg-white/95'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-rose-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💖</span>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
            Tone & Emotion Radar
          </h3>
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
          {scenarioTitle ? `${scenarioTitle}` : langInfo.name}
        </div>
      </div>

      {/* Primary Emotional Posture & Adaptive Reaction */}
      <div
        className={`rounded-2xl border p-4 space-y-3 ${
          isDarkMode
            ? 'border-[#ff2d87]/30 bg-[#141724]'
            : 'border-rose-100 bg-rose-50/40'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Your Vocal Posture
            </div>
            <div className={`text-sm font-bold mt-0.5 ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
              {analysis.sentiment}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getEmotionColor(analysis.emotionalTone)}`}>
            {analysis.emotionalTone}
          </span>
        </div>
        <p
          className={`text-xs leading-relaxed rounded-xl p-2.5 border shadow-2xs ${
            isDarkMode
              ? 'bg-[#0d0f17] border-slate-800 text-slate-200'
              : 'bg-white border-rose-100 text-slate-600'
          }`}
        >
          "{analysis.sentimentSummary}"
        </p>

        {/* Adaptive Tutor Reaction with cute animal avatar */}
        <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-rose-100/80'}`}>
          <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-neon-green' : 'text-rose-600'}`}>
            <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" />
            <span>{langInfo.tutorName}'s Sweet Reaction:</span>
          </div>
          <p className={`text-xs mt-1 pl-7 ${isDarkMode ? 'text-neon-blue' : 'text-slate-600'}`}>
            {analysis.tutorReactionEmotion || 'Sending warm smiles and cheering your pronunciation on!'}
          </p>
        </div>
      </div>

      {/* Dual Scores: Politeness & Confidence */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Politeness */}
        <div
          className={`rounded-2xl border p-3 ${
            isDarkMode
              ? 'border-[#00e5ff]/30 bg-[#121624]'
              : 'border-amber-100 bg-amber-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Politeness</span>
            <span className={`font-bold ${isDarkMode ? 'text-neon-blue' : 'text-amber-700'}`}>
              {analysis.politenessScore}%
            </span>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden mb-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-amber-100'}`}>
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isDarkMode ? 'bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, analysis.politenessScore))}%` }}
            />
          </div>
          <div className="text-[10px]">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Level: </span>
            <span className={`font-semibold ${isDarkMode ? 'text-neon-blue' : 'text-slate-800'}`}>
              {analysis.politenessLevel}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div
          className={`rounded-2xl border p-3 ${
            isDarkMode
              ? 'border-[#00ff88]/30 bg-[#121624]'
              : 'border-emerald-100 bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Confidence</span>
            <span className={`font-bold ${isDarkMode ? 'text-neon-green' : 'text-emerald-700'}`}>
              {analysis.confidenceScore}%
            </span>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden mb-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-emerald-100'}`}>
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isDarkMode ? 'bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.8)]' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, analysis.confidenceScore))}%` }}
            />
          </div>
          <div className="text-[10px]">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Tone: </span>
            <span className={`font-semibold ${isDarkMode ? 'text-neon-green' : 'text-slate-800'}`}>
              {analysis.emotionalTone}
            </span>
          </div>
        </div>
      </div>

      {/* Language-Specific Tonal Notes */}
      <div
        className={`rounded-2xl border p-3.5 space-y-1.5 ${
          isDarkMode
            ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-slate-200'
            : 'border-sky-100 bg-sky-50/40'
        }`}
      >
        <div className={`flex items-center gap-1.5 text-xs font-bold ${isDarkMode ? 'text-neon-green' : 'text-sky-800'}`}>
          <TrendingUp className="h-3.5 w-3.5 text-[#00ff88]" />
          <span>Tonal & Pitch Advice</span>
        </div>
        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-neon-green/90' : 'text-slate-600'}`}>
          {analysis.tonalPitchNotes}
        </p>
      </div>

      {/* Grammar & Phrasing Pointers if any */}
      {analysis.grammarPointers && (
        <div
          className={`rounded-2xl border p-3.5 space-y-1 ${
            isDarkMode
              ? 'border-[#00e5ff]/30 bg-[#00e5ff]/10 text-slate-200'
              : 'border-purple-100 bg-purple-50/40'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isDarkMode ? 'text-neon-blue' : 'text-purple-800'}`}>
            <Sparkles className="h-3.5 w-3.5 text-[#00e5ff]" />
            <span>Nuance & Vocabulary Polish</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-neon-blue/90' : 'text-slate-600'}`}>
            {analysis.grammarPointers}
          </p>
        </div>
      )}

      {/* Motivational Encouragement */}
      <div
        className={`rounded-2xl border p-3 text-xs leading-relaxed ${
          isDarkMode
            ? 'border-[#ff2d87]/40 bg-[#ff2d87]/15 text-neon-pink shadow-[0_0_15px_rgba(255,45,135,0.15)]'
            : 'border-rose-200/80 bg-rose-50/80 text-rose-900'
        }`}
      >
        <span className={`font-bold block mb-0.5 ${isDarkMode ? 'text-white' : 'text-rose-700'}`}>
          💌 {langInfo.tutorName}'s Encouragement:
        </span>
        {analysis.encouragement}
      </div>

      {/* Quick Particles */}
      <div className="pt-2">
        <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
          Essential {langInfo.name} Particles
        </div>
        <div className="grid grid-cols-2 gap-2">
          {langInfo.keyPoliteParticles.map((particle, idx) => (
            <button
              key={idx}
              onClick={() => onPlayPhrase(particle.split(' ')[0])}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors border text-left ${
                isDarkMode
                  ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-blue hover:text-neon-pink border-[#00e5ff]/30 shadow-[0_0_8px_rgba(0,229,255,0.1)]'
                  : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200/80'
              }`}
            >
              <span className="font-semibold truncate">{particle}</span>
              <Volume2 className={`h-3 w-3 shrink-0 ml-1 ${isDarkMode ? 'text-[#00e5ff]' : 'text-slate-400'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
