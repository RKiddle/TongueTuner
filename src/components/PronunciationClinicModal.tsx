import React, { useState } from 'react';
import { SupportedLanguage, PronunciationDrill } from '../types';
import { PRONUNCIATION_DRILLS, LANGUAGES } from '../data/languages';
import { audioController, VoiceRecorder } from '../utils/audio';
import { Volume2, Mic, Square, CheckCircle, AlertTriangle, Play, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface PronunciationClinicModalProps {
  language: SupportedLanguage;
  voice: string;
  playbackSpeed: number;
}

export const PronunciationClinicModal: React.FC<PronunciationClinicModalProps> = ({
  language,
  voice,
  playbackSpeed,
}) => {
  const drills = PRONUNCIATION_DRILLS.filter((d) => d.language === language);
  const [selectedDrill, setSelectedDrill] = useState<PronunciationDrill>(drills[0] || PRONUNCIATION_DRILLS[0]);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderInstance, setRecorderInstance] = useState<VoiceRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{ base64: string; mimeType: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    overallScore: number;
    accuracyGrade: string;
    syllableBreakdown: { syllable: string; targetTone: string; feedback: string; status: string }[];
    coachingTip: string;
    encouragement: string;
  } | null>(null);

  // Switch drill when language changes if needed
  React.useEffect(() => {
    const currentLangDrills = PRONUNCIATION_DRILLS.filter((d) => d.language === language);
    if (currentLangDrills.length > 0 && selectedDrill.language !== language) {
      setSelectedDrill(currentLangDrills[0]);
      setEvaluationResult(null);
      setRecordedAudio(null);
    }
  }, [language, selectedDrill]);

  // Play Native Reference Demo with Gemini 3.8 TTS
  const handlePlayReference = async (speed: 'normal' | 'slow' = 'normal') => {
    try {
      setIsPlayingRef(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedDrill.nativeText,
          language,
          voice,
          speed,
          style: speed === 'slow'
            ? `Slow, hyper-articulated tonal pronunciation drill demonstration for ${language} students`
            : `Clean, natural, beautiful native ${language} pronunciation demonstration`,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64, speed === 'slow' ? 0.8 : 1.0, () => {
          setIsPlayingRef(false);
        });
      } else {
        setIsPlayingRef(false);
      }
    } catch (err) {
      console.error('Play reference error:', err);
      setIsPlayingRef(false);
    }
  };

  // Start Mic Recording
  const handleStartRecording = async () => {
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      setRecorderInstance(recorder);
      setIsRecording(true);
      setEvaluationResult(null);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Microphone access was denied or is unavailable. Please grant microphone permissions.');
    }
  };

  // Stop Mic Recording & Evaluate
  const handleStopRecording = async () => {
    if (!recorderInstance) return;
    try {
      setIsRecording(false);
      const { base64, mimeType } = await recorderInstance.stop();
      setRecordedAudio({ base64, mimeType });
      setRecorderInstance(null);

      // Transcribe user audio and run evaluation
      setAnalyzing(true);
      let transcribedText = '';
      try {
        const transRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType, language }),
        });
        const transData = await transRes.json();
        transcribedText = transData.transcription || '';
      } catch (tErr) {
        console.warn('Transcription error:', tErr);
      }

      // Clinic evaluation
      const clinicRes = await fetch('/api/pronunciation-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drillId: selectedDrill.id,
          targetNative: selectedDrill.nativeText,
          targetRomanized: selectedDrill.romanized,
          userText: transcribedText,
          language,
        }),
      });

      const clinicData = await clinicRes.json();
      setEvaluationResult(clinicData);
      setAnalyzing(false);
    } catch (err) {
      console.error('Recording evaluation error:', err);
      setAnalyzing(false);
    }
  };

  const currentLangInfo = LANGUAGES[language];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Phonology & Tonal Studio</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            {currentLangInfo.name} Pitch & Pronunciation Clinic
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {currentLangInfo.tonalSystemDescription} Master challenging tongue-twisters and tonal shifts with instant Gemini 3.8 feedback.
          </p>
        </div>

        {/* Drill Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {drills.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDrill(d);
                setEvaluationResult(null);
                setRecordedAudio(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedDrill.id === d.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm'
                  : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Drill Card & Practice Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm space-y-5">
            {/* Drill Metadata */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Focus: <strong className="text-slate-200">{selectedDrill.focus}</strong>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-amber-300 font-medium">
                {selectedDrill.difficulty}
              </span>
            </div>

            {/* Target Big Text */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-center space-y-2">
              <div className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-white">
                {selectedDrill.nativeText}
              </div>
              <div className="text-sm font-medium text-amber-400/90 font-mono tracking-wide">
                {selectedDrill.romanized}
              </div>
              <div className="text-xs text-slate-400 italic">
                "{selectedDrill.english}"
              </div>
            </div>

            {/* Tonal Tips */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 space-y-1">
              <span className="font-semibold text-amber-400 block">Tonal Mechanics & Key Advice:</span>
              <p className="leading-relaxed">{selectedDrill.tonalTips}</p>
            </div>

            {/* Audio & Recording Controls */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              {/* Reference Audio Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayReference('normal')}
                  disabled={isPlayingRef}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
                >
                  <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Native Demo (1.0x)</span>
                </button>
                <button
                  onClick={() => handlePlayReference('slow')}
                  disabled={isPlayingRef}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Slow Breakout (0.8x)</span>
                </button>
              </div>

              {/* Record Attempt Button */}
              <div>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Record Your Attempt</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm animate-pulse transition-all"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>Stop & Evaluate Tones</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recording status note */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening carefully to your pitch curve and tone accuracy... Click stop when done.</span>
              </div>
            )}

            {analyzing && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Evaluating phonetics & tonal contours with Gemini 3.8...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Syllable-by-Syllable Rubric Feedback */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Tonal Evaluation Rubric</h3>
              {evaluationResult && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <span className="text-sm font-bold text-amber-400">{evaluationResult.overallScore}%</span>
                </div>
              )}
            </div>

            {!evaluationResult && !analyzing ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                  <Mic className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-xs">
                  Record yourself pronouncing the phrase on the left to receive syllable-by-syllable tonal grades.
                </p>
              </div>
            ) : null}

            {evaluationResult && (
              <div className="space-y-4 animate-in fade-in">
                {/* Accuracy grade banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-850 border border-slate-800">
                  <div className="text-xs text-slate-400">Accuracy Assessment:</div>
                  <span className="text-xs font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    {evaluationResult.accuracyGrade}
                  </span>
                </div>

                {/* Syllable Breakdown Matrix */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Syllable Contours
                  </div>
                  <div className="space-y-1.5">
                    {evaluationResult.syllableBreakdown.map((item, idx) => {
                      const isCorrect = item.status === 'correct';
                      const isClose = item.status === 'close';
                      return (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-2.5 rounded-lg bg-slate-850 border border-slate-800/80 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono">{item.syllable}</span>
                              <span className="text-[11px] text-slate-400">({item.targetTone})</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.feedback}</p>
                          </div>
                          <span
                            className={`shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isCorrect
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : isClose
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isCorrect ? 'Accurate' : isClose ? 'Close' : 'Adjust Tone'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coaching Tip */}
                <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1 text-xs">
                  <span className="font-semibold text-amber-400 block">Personalized Coaching Note:</span>
                  <p className="text-slate-300 leading-relaxed">{evaluationResult.coachingTip}</p>
                </div>

                {/* Encouragement */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300/90">
                  {evaluationResult.encouragement}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
