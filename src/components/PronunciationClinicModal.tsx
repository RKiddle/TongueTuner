import React, { useState } from 'react';
import { SupportedLanguage, PronunciationDrill } from '../types';
import { PRONUNCIATION_DRILLS, LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { audioController, VoiceRecorder } from '../utils/audio';
import { Volume2, Mic, Square, Sparkles, RefreshCw } from 'lucide-react';

interface PronunciationClinicModalProps {
  language: SupportedLanguage;
  voice: string;
  playbackSpeed: number;
  isDarkMode?: boolean;
}

export const PronunciationClinicModal: React.FC<PronunciationClinicModalProps> = ({
  language,
  voice,
  playbackSpeed,
  isDarkMode = true,
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

  React.useEffect(() => {
    const currentLangDrills = PRONUNCIATION_DRILLS.filter((d) => d.language === language);
    if (currentLangDrills.length > 0 && selectedDrill.language !== language) {
      setSelectedDrill(currentLangDrills[0]);
      setEvaluationResult(null);
      setRecordedAudio(null);
    }
  }, [language, selectedDrill]);

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
        audioController.speakWithBrowser(
          selectedDrill.nativeText,
          language,
          speed === 'slow' ? 0.8 : 1.0,
          () => {
            setIsPlayingRef(false);
          }
        );
      }
    } catch (err) {
      console.warn('Play reference error, using speech fallback:', err);
      audioController.speakWithBrowser(
        selectedDrill.nativeText,
        language,
        speed === 'slow' ? 0.8 : 1.0,
        () => {
          setIsPlayingRef(false);
        }
      );
    }
  };

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

  const handleStopRecording = async () => {
    if (!recorderInstance) return;
    try {
      setIsRecording(false);
      const { base64, mimeType } = await recorderInstance.stop();
      setRecordedAudio({ base64, mimeType });
      setRecorderInstance(null);

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
      {/* Header Banner */}
      <div
        className={`rounded-3xl border p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 transition-colors ${
          isDarkMode
            ? 'border-[#ff2d87]/30 bg-gradient-to-r from-[#141726] via-[#1b1429] to-[#101e28] shadow-[0_0_30px_rgba(255,45,135,0.1)]'
            : 'border-rose-100 bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50'
        }`}
      >
        <AnimalAvatar animal={currentLangInfo.tutorAnimal} size="lg" />
        <div className="flex-1">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs mb-1 ${
              isDarkMode
                ? 'bg-[#ff2d87]/15 border-[#ff2d87]/40 text-neon-pink'
                : 'bg-white/90 border-rose-200 text-rose-700'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#ff2d87]' : 'text-rose-400'}`} />
            <span>Tone & Phonetics Studio with {currentLangInfo.tutorName}</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-display font-bold ${
              isDarkMode ? 'text-neon-pink' : 'text-slate-800'
            }`}
          >
            {currentLangInfo.name} Pitch & Pronunciation Clinic
          </h2>
          <p className={`text-xs mt-0.5 max-w-2xl ${isDarkMode ? 'text-neon-blue' : 'text-slate-600'}`}>
            {currentLangInfo.tonalSystemDescription} Master challenging tongue-twisters and tonal curves with instant feedback.
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-2xl border transition-all ${
                selectedDrill.id === d.id
                  ? isDarkMode
                    ? 'border-[#ff2d87] bg-[#ff2d87] text-white shadow-[0_0_15px_rgba(255,45,135,0.5)] font-bold'
                    : 'border-rose-400 bg-rose-500 text-white shadow-xs'
                  : isDarkMode
                  ? 'border-[#00e5ff]/30 bg-[#121524] text-slate-300 hover:text-neon-green hover:border-[#00ff88]'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-rose-50'
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
          <div
            className={`rounded-3xl border p-6 shadow-sm space-y-5 transition-colors ${
              isDarkMode
                ? 'border-[#00e5ff]/30 bg-[#101322] shadow-[0_0_25px_rgba(0,229,255,0.08)]'
                : 'border-rose-100 bg-white'
            }`}
          >
            {/* Drill Metadata */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Focus: <strong className={isDarkMode ? 'text-neon-green' : 'text-slate-800'}>{selectedDrill.focus}</strong>
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${
                  isDarkMode
                    ? 'border-[#00ff88]/40 bg-[#00ff88]/15 text-neon-green'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {selectedDrill.difficulty}
              </span>
            </div>

            {/* Target Big Text */}
            <div
              className={`rounded-2xl border p-6 text-center space-y-2 ${
                isDarkMode
                  ? 'border-[#ff2d87]/30 bg-[#171424] shadow-[0_0_20px_rgba(255,45,135,0.1)]'
                  : 'border-rose-100 bg-rose-50/40'
              }`}
            >
              <div
                className={`font-display text-3xl sm:text-4xl font-bold tracking-wide ${
                  isDarkMode ? 'text-neon-pink' : 'text-slate-800'
                }`}
              >
                {selectedDrill.nativeText}
              </div>
              <div
                className={`text-sm font-semibold font-mono tracking-wide ${
                  isDarkMode ? 'text-neon-green' : 'text-rose-600'
                }`}
              >
                {selectedDrill.romanized}
              </div>
              <div className={`text-xs italic ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
                "{selectedDrill.english}"
              </div>
            </div>

            {/* Tonal Tips */}
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1 ${
                isDarkMode
                  ? 'border-[#00ff88]/30 bg-[#00ff88]/10 text-neon-green'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900'
              }`}
            >
              <span className={`font-bold block ${isDarkMode ? 'text-neon-pink' : 'text-amber-800'}`}>
                💡 Tonal Mechanics & Tips:
              </span>
              <p className="leading-relaxed">{selectedDrill.tonalTips}</p>
            </div>

            {/* Audio & Recording Controls */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              {/* Reference Audio Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayReference('normal')}
                  disabled={isPlayingRef}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border shadow-2xs ${
                    isDarkMode
                      ? 'bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-neon-blue border-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                      : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Volume2 className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#00e5ff]' : 'text-rose-500'}`} />
                  <span>Native Demo (1.0x)</span>
                </button>
                <button
                  onClick={() => handlePlayReference('slow')}
                  disabled={isPlayingRef}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border ${
                    isDarkMode
                      ? 'bg-[#00ff88]/15 hover:bg-[#00ff88]/25 text-neon-green border-[#00ff88]/40'
                      : 'bg-slate-50 hover:bg-amber-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#00ff88]' : 'text-amber-500'}`} />
                  <span>Slow Breakout (0.8x)</span>
                </button>
              </div>

              {/* Record Attempt Button */}
              <div>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={analyzing}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 ${
                      isDarkMode
                        ? 'bg-[#ff2d87] hover:bg-[#ff0077] text-white shadow-[0_0_18px_rgba(255,45,135,0.5)]'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                    <span>Record Attempt</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl animate-pulse transition-all ${
                      isDarkMode
                        ? 'bg-[#ff0066] shadow-[0_0_25px_rgba(255,0,102,0.8)]'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-md'
                    }`}
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>Stop & Evaluate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recording status note */}
            {isRecording && (
              <div
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs animate-in fade-in ${
                  isDarkMode
                    ? 'bg-[#ff2d87]/20 border-[#ff2d87] text-neon-pink'
                    : 'bg-rose-100 border-rose-200 text-rose-900'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff2d87] animate-ping" />
                <span>Listening carefully to your pitch curve and pronunciation...</span>
              </div>
            )}

            {analyzing && (
              <div
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs ${
                  isDarkMode
                    ? 'bg-[#00e5ff]/15 border-[#00e5ff]/40 text-neon-blue'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <RefreshCw className="h-4 w-4 animate-spin text-[#00e5ff]" />
                <span>Evaluating tones and vowel clarity with your cute coach...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Syllable-by-Syllable Rubric Feedback */}
        <div className="lg:col-span-5 space-y-5">
          <div
            className={`rounded-3xl border p-6 shadow-sm space-y-4 transition-colors ${
              isDarkMode
                ? 'border-[#ff2d87]/30 bg-[#101322] shadow-[0_0_25px_rgba(255,45,135,0.08)]'
                : 'border-rose-100 bg-white'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-rose-100'}`}>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
                Tonal Rubric
              </h3>
              {evaluationResult && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Score:</span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-neon-green' : 'text-rose-600'}`}>
                    {evaluationResult.overallScore}%
                  </span>
                </div>
              )}
            </div>

            {!evaluationResult && !analyzing ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    isDarkMode ? 'bg-[#151928] border-[#00e5ff]/30 text-neon-blue' : 'bg-rose-50 border-rose-100 text-rose-400'
                  }`}
                >
                  <AnimalAvatar animal={currentLangInfo.tutorAnimal} size="sm" />
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Record yourself pronouncing the phrase on the left to receive syllable-by-syllable tonal grades!
                </p>
              </div>
            ) : null}

            {evaluationResult && (
              <div className="space-y-4 animate-in fade-in">
                {/* Accuracy grade banner */}
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border ${
                    isDarkMode
                      ? 'bg-[#00ff88]/15 border-[#00ff88]/40 text-neon-green'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="text-xs font-semibold">Accuracy Assessment:</div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isDarkMode
                        ? 'bg-black/60 text-neon-green border-[#00ff88]'
                        : 'bg-white text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {evaluationResult.accuracyGrade}
                  </span>
                </div>

                {/* Syllable Breakdown Matrix */}
                <div className="space-y-2">
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-neon-blue' : 'text-slate-400'}`}>
                    Syllable Contours
                  </div>
                  <div className="space-y-1.5">
                    {evaluationResult.syllableBreakdown.map((item, idx) => {
                      const isCorrect = item.status === 'correct';
                      const isClose = item.status === 'close';
                      return (
                        <div
                          key={idx}
                          className={`flex items-start justify-between p-2.5 rounded-xl border text-xs ${
                            isDarkMode
                              ? 'bg-[#151928] border-slate-800'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold font-mono ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
                                {item.syllable}
                              </span>
                              <span className={`text-[11px] ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
                                ({item.targetTone})
                              </span>
                            </div>
                            <p className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.feedback}</p>
                          </div>
                          <span
                            className={`shrink-0 ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCorrect
                                ? isDarkMode ? 'bg-[#00ff88]/20 text-neon-green border border-[#00ff88]/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isClose
                                ? isDarkMode ? 'bg-[#00e5ff]/20 text-neon-blue border border-[#00e5ff]/40' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                : isDarkMode ? 'bg-[#ff2d87]/20 text-neon-pink border border-[#ff2d87]/40' : 'bg-rose-100 text-rose-800 border border-rose-200'
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
                <div
                  className={`rounded-2xl border p-3.5 space-y-1 text-xs ${
                    isDarkMode
                      ? 'border-[#00e5ff]/30 bg-[#00e5ff]/10 text-slate-200'
                      : 'border-amber-200 bg-amber-50/70 text-slate-700'
                  }`}
                >
                  <span className={`font-bold block ${isDarkMode ? 'text-neon-blue' : 'text-amber-800'}`}>
                    Personalized Coaching Note:
                  </span>
                  <p className="leading-relaxed">{evaluationResult.coachingTip}</p>
                </div>

                {/* Encouragement */}
                <div
                  className={`rounded-2xl border p-3 text-xs font-medium ${
                    isDarkMode
                      ? 'border-[#ff2d87]/40 bg-[#ff2d87]/15 text-neon-pink'
                      : 'border-rose-200 bg-rose-50/80 text-rose-900'
                  }`}
                >
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
