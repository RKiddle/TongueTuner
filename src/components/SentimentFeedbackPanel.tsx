import React from 'react';
import { SentimentAnalysis, SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { audioController } from '../utils/audio';
import { Sparkles, HeartHandshake, Mic, Volume2, ShieldCheck, Activity, TrendingUp, AlertCircle, Compass } from 'lucide-react';

interface SentimentFeedbackPanelProps {
  analysis: SentimentAnalysis | null;
  language: SupportedLanguage;
  scenarioTitle?: string;
  onPlayPhrase: (phrase: string) => void;
  voice: string;
}

export const SentimentFeedbackPanel: React.FC<SentimentFeedbackPanelProps> = ({
  analysis,
  language,
  scenarioTitle,
  onPlayPhrase,
  voice,
}) => {
  const langInfo = LANGUAGES[language];

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <Activity className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Sentiment & Tonal Radar</h3>
        </div>

        <div className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500 mb-3">
            <Mic className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-medium text-slate-300">Ready for Live Analysis</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Speak or send a message in {langInfo.name}. Gemini 3.8 will evaluate your vocal posture, politeness, and tonal accuracy.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Key Polite Indicators ({langInfo.name})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {langInfo.keyPoliteParticles.map((particle, idx) => (
              <button
                key={idx}
                onClick={() => onPlayPhrase(particle.split(' ')[0])}
                className="flex items-center justify-between rounded-lg bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700/50 text-left"
              >
                <span className="font-medium truncate">{particle}</span>
                <Volume2 className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get color tags for emotional tone
  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'confident':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'hesitant':
      case 'nervous':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'warm':
      case 'polite':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'frustrated':
      case 'apologetic':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Sentiment & Tonal Radar</h3>
        </div>
        <div className="text-xs text-slate-400">
          {scenarioTitle ? `${scenarioTitle}` : langInfo.name}
        </div>
      </div>

      {/* Primary Emotional Posture & Adaptive Reaction */}
      <div className="rounded-xl border border-slate-800 bg-slate-850 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Learner Vocal Posture</div>
            <div className="text-sm font-semibold text-white mt-0.5">{analysis.sentiment}</div>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getEmotionColor(analysis.emotionalTone)}`}>
            {analysis.emotionalTone}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
          "{analysis.sentimentSummary}"
        </p>

        {/* Adaptive Tutor Reaction */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Tutor's Sentiment-Aware Adaptation:</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-5">
            {analysis.tutorReactionEmotion || 'Adapting tone warmly to encourage your progress'}
          </p>
        </div>
      </div>

      {/* Dual Scores: Politeness & Confidence */}
      <div className="grid grid-cols-2 gap-3">
        {/* Politeness */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/60 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Formality / Politeness</span>
            <span className="font-bold text-slate-200">{analysis.politenessScore}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, analysis.politenessScore))}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Level: <span className="text-white font-medium">{analysis.politenessLevel}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="rounded-xl border border-slate-800 bg-slate-850/60 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Vocal Confidence</span>
            <span className="font-bold text-slate-200">{analysis.confidenceScore}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, analysis.confidenceScore))}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Tone: <span className="text-white font-medium">{analysis.emotionalTone}</span>
          </div>
        </div>
      </div>

      {/* Language-Specific Tonal Notes */}
      <div className="rounded-xl border border-slate-800 bg-slate-850/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <span>Tonal & Pitch Accent Guidance</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {analysis.tonalPitchNotes}
        </p>
      </div>

      {/* Grammar & Phrasing Pointers if any */}
      {analysis.grammarPointers && (
        <div className="rounded-xl border border-slate-800 bg-slate-850/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nuance & Vocabulary Polish</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.grammarPointers}
          </p>
        </div>
      )}

      {/* Motivational Encouragement */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-300/90 leading-relaxed">
        <span className="font-semibold text-amber-400 block mb-0.5">Coach's Words:</span>
        {analysis.encouragement}
      </div>

      {/* Quick Particles */}
      <div className="pt-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Essential {langInfo.name} Particles
        </div>
        <div className="grid grid-cols-2 gap-2">
          {langInfo.keyPoliteParticles.map((particle, idx) => (
            <button
              key={idx}
              onClick={() => onPlayPhrase(particle.split(' ')[0])}
              className="flex items-center justify-between rounded-lg bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700/60 text-left"
            >
              <span className="font-medium truncate">{particle}</span>
              <Volume2 className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
