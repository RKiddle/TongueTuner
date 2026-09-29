import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SentimentAnalysis, SupportedLanguage, PracticeScenario } from '../types';
import { LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { audioController, VoiceRecorder } from '../utils/audio';
import {
  Mic,
  Send,
  Volume2,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Square,
} from 'lucide-react';

interface VoiceChatProps {
  language: SupportedLanguage;
  messages: ChatMessage[];
  onSendMessage: (text: string, inputMode: 'voice' | 'text') => Promise<void>;
  isLoading: boolean;
  activeScenario: PracticeScenario | null;
  onClearChat: () => void;
  voice: string;
  playbackSpeed: number;
  autoPlayAudio: boolean;
  showRomanization: boolean;
  onSelectPhrasePrompt: (phrase: string) => void;
  onOpenClinic: () => void;
  isDarkMode?: boolean;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  language,
  messages,
  onSendMessage,
  isLoading,
  activeScenario,
  onClearChat,
  voice,
  playbackSpeed,
  autoPlayAudio,
  showRomanization,
  onSelectPhrasePrompt,
  onOpenClinic,
  isDarkMode = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const langInfo = LANGUAGES[language];

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Audio playback listener supporting both Gemini 3.8 audio and browser speech synthesis
  const handlePlayMessageAudio = (message: ChatMessage, speed = playbackSpeed) => {
    if (playingMessageId === message.id) {
      audioController.stop();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(message.id);
    audioController.playOrSynthesize(
      message.audioBase64,
      message.text,
      language,
      speed,
      () => {
        setPlayingMessageId(null);
      }
    );
  };

  // Play individual phrase or word with Gemini 3.8 TTS or browser speech
  const handlePlayCustomWord = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice,
          speed: 'slow',
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64, 0.85);
      } else {
        audioController.speakWithBrowser(text, language, 0.85);
      }
    } catch (err) {
      console.warn('TTS error on word, using speech fallback:', err);
      audioController.speakWithBrowser(text, language, 0.85);
    }
  };

  // Setup Web Speech API for live transcription if available
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langCodes: Record<SupportedLanguage, string> = {
        thai: 'th-TH',
        mandarin: 'zh-CN',
        japanese: 'ja-JP',
      };
      recognition.lang = langCodes[language];

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e);
      };

      recognition.start();
      return recognition;
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      return null;
    }
  };

  // Handle Start Recording
  const handleStartVoice = async () => {
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recognitionRef.current = startSpeechRecognition();
    } catch (err) {
      console.error('Failed to start microphone:', err);
      alert('Microphone permission is required for voice interaction. Please grant access.');
    }
  };

  // Handle Stop Recording
  const handleStopVoice = async () => {
    if (!recorderRef.current) return;

    setIsRecording(false);
    clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const { base64, mimeType } = await recorderRef.current.stop();
      recorderRef.current = null;

      let finalText = inputText.trim();

      if (!finalText) {
        setIsTranscribing(true);
        const transRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType, language }),
        });
        const transData = await transRes.json();
        finalText = transData.transcription?.trim() || '';
        setIsTranscribing(false);
      }

      if (finalText) {
        setInputText('');
        await onSendMessage(finalText, 'voice');
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsTranscribing(false);
    }
  };

  // Submit Text Message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text, 'text');
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-7.5rem)] rounded-3xl border transition-colors overflow-hidden ${
        isDarkMode
          ? 'border-[#ff2d87]/30 bg-[#0f111a]/95 shadow-[0_0_35px_rgba(255,45,135,0.12)]'
          : 'border-rose-100 bg-white/95 shadow-md'
      }`}
    >
      {/* Sub-Header: Animal Persona & Scenario Status */}
      <div
        className={`flex items-center justify-between px-5 py-3 border-b transition-colors ${
          isDarkMode
            ? 'border-[#ff2d87]/20 bg-[#141724]'
            : 'border-rose-100/80 bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-orange-50/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <AnimalAvatar
            animal={langInfo.tutorAnimal}
            size="md"
            speaking={Boolean(playingMessageId)}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isDarkMode ? 'text-neon-pink' : 'text-slate-800'}`}>
                {langInfo.tutorName}
              </span>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-neon-green' : 'text-rose-500'}`}>
                · {langInfo.flag}
              </span>
            </div>
            <p className={`text-xs line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeScenario ? `Scenario: ${activeScenario.title}` : langInfo.tutorRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <span
              className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                isDarkMode
                  ? 'text-neon-green bg-[#00ff88]/15 border-[#00ff88]/40'
                  : 'text-rose-700 bg-rose-100/80 border-rose-200'
              }`}
            >
              Role: {activeScenario.userRole}
            </span>
          )}
          <button
            onClick={onClearChat}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-neon-blue border-transparent hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/10'
                : 'text-slate-400 hover:text-slate-700 border-transparent hover:border-slate-200 hover:bg-white/80'
            }`}
            title="Start fresh conversation"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Message List */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 transition-colors ${
          isDarkMode ? 'bg-[#08090f]' : 'bg-[#FCFAF6]/60'
        }`}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isPlaying = playingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse ml-auto' : 'mr-auto'} max-w-2xl`}
            >
              {/* Cute Avatar beside message */}
              {!isUser ? (
                <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" className="mt-1" />
              ) : (
                <div
                  className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-2xs ${
                    isDarkMode
                      ? 'bg-[#ff2d87]/20 border-[#ff2d87] text-neon-pink shadow-[0_0_10px_rgba(255,45,135,0.4)]'
                      : 'bg-rose-100 border-rose-300 text-rose-700'
                  }`}
                >
                  You
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`relative rounded-3xl p-4 sm:p-5 transition-all shadow-xs ${
                  isUser
                    ? isDarkMode
                      ? 'bg-[#ff2d87]/20 border-2 border-[#ff2d87] text-white rounded-tr-xs shadow-[0_0_20px_rgba(255,45,135,0.25)]'
                      : 'bg-rose-500 text-white rounded-tr-xs'
                    : isDarkMode
                    ? 'bg-[#121522] border-2 border-[#00e5ff]/35 text-slate-100 rounded-tl-xs shadow-[0_0_20px_rgba(0,229,255,0.1)]'
                    : 'bg-white border border-rose-100/90 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* Header inside Bubble */}
                <div className="flex items-center justify-between text-xs mb-2 gap-4">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span
                      className={
                        isUser
                          ? isDarkMode ? 'text-neon-pink' : 'text-rose-100'
                          : isDarkMode ? 'text-neon-blue' : 'text-slate-500'
                      }
                    >
                      {isUser ? 'You' : langInfo.tutorName.split(' ')[0]}
                    </span>
                    {isUser && message.inputMode === 'voice' && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                          isDarkMode
                            ? 'text-neon-green bg-[#00ff88]/20 border border-[#00ff88]/40'
                            : 'text-rose-200 bg-rose-600/60'
                        }`}
                      >
                        <Mic className="h-2.5 w-2.5" /> Voice
                      </span>
                    )}
                  </div>

                  {/* Audio Controls for Tutor */}
                  {!isUser && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePlayMessageAudio(message)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                          isPlaying
                            ? isDarkMode
                              ? 'bg-[#00ff88] text-slate-950 shadow-[0_0_15px_rgba(0,255,136,0.6)]'
                              : 'bg-rose-500 text-white shadow-rose-200'
                            : isDarkMode
                            ? 'bg-[#00ff88]/15 text-neon-green hover:bg-[#00ff88]/25 border border-[#00ff88]/50 shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                        }`}
                        title="Listen to native voice pronunciation"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-3 w-3" />
                            <span>Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* Slow playback option */}
                      <button
                        onClick={() => handlePlayMessageAudio(message, 0.75)}
                        className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
                          isDarkMode
                            ? 'text-neon-blue bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border-[#00e5ff]/40'
                            : 'text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                        }`}
                        title="Listen at 0.75x slow speed for tone clarity"
                      >
                        0.75x
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Content: Native Script (Neon Blue / Pink in dark mode) */}
                <div
                  className={`text-base sm:text-lg font-semibold leading-relaxed tracking-wide ${
                    isUser
                      ? isDarkMode ? 'text-white' : 'text-white'
                      : isDarkMode ? 'text-neon-blue' : 'text-slate-800'
                  }`}
                >
                  {message.text}
                </div>

                {/* Romanized Phonetic Guide: Neon Green in dark mode */}
                {!isUser && message.romanized && showRomanization && (
                  <div
                    className={`mt-2 text-xs font-mono tracking-wide rounded-xl px-3 py-1.5 border ${
                      isDarkMode
                        ? 'text-neon-green bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                        : 'text-amber-800 bg-amber-50/80 border-amber-200/80'
                    }`}
                  >
                    {message.romanized}
                  </div>
                )}

                {/* English Translation: Neon Pink in dark mode */}
                {!isUser && message.english && (
                  <div
                    className={`mt-1.5 text-xs italic ${
                      isDarkMode ? 'text-[#ff7eb6]' : 'text-slate-500'
                    }`}
                  >
                    "{message.english}"
                  </div>
                )}

                {/* Audio Wave Playing Indicator */}
                {isPlaying && (
                  <div
                    className={`mt-3 flex items-center gap-2 p-2 rounded-xl border text-xs ${
                      isDarkMode
                        ? 'bg-[#00ff88]/15 border-[#00ff88]/40 text-neon-green shadow-[0_0_12px_rgba(0,255,136,0.3)]'
                        : 'bg-rose-50 border-rose-200/80 text-rose-700'
                    }`}
                  >
                    <Volume2 className={`h-4 w-4 animate-bounce ${isDarkMode ? 'text-[#00ff88]' : 'text-rose-500'}`} />
                    <span className="font-semibold">{langInfo.tutorName} is speaking with Gemini 3.8 TTS...</span>
                    <div className="flex items-center gap-0.5 ml-2">
                      <span className={`h-2 w-1 rounded-full animate-bounce ${isDarkMode ? 'bg-[#00ff88]' : 'bg-rose-400'}`} />
                      <span className={`h-3 w-1 rounded-full animate-bounce delay-75 ${isDarkMode ? 'bg-[#00e5ff]' : 'bg-rose-500'}`} />
                      <span className={`h-2 w-1 rounded-full animate-bounce delay-150 ${isDarkMode ? 'bg-[#ff2d87]' : 'bg-rose-400'}`} />
                    </div>
                  </div>
                )}

                {/* Real-time Sentiment Tag for Learner Voice Input */}
                {isUser && message.analysis && (
                  <div
                    className={`mt-2.5 pt-2 border-t text-[11px] flex flex-wrap items-center gap-2 ${
                      isDarkMode
                        ? 'border-[#ff2d87]/40 text-neon-green'
                        : 'border-rose-400/40 text-rose-100'
                    }`}
                  >
                    <span className={`font-bold ${isDarkMode ? 'text-neon-pink' : 'text-white'}`}>🐾 Tone:</span>
                    <span>{message.analysis.sentiment}</span>
                    <span aria-hidden="true">·</span>
                    <span className={isDarkMode ? 'text-neon-blue' : ''}>Politeness: {message.analysis.politenessScore}%</span>
                    <span aria-hidden="true">·</span>
                    <span className={isDarkMode ? 'text-neon-green' : ''}>Confidence: {message.analysis.confidenceScore}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-2.5 mr-auto max-w-xl">
            <AnimalAvatar animal={langInfo.tutorAnimal} size="sm" className="mt-1 animate-pulse" />
            <div
              className={`rounded-3xl p-4 border text-xs shadow-2xs space-y-1 ${
                isDarkMode
                  ? 'bg-[#121522] border-[#ff2d87]/30 text-slate-300'
                  : 'bg-white border-rose-100 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className={`h-3.5 w-3.5 animate-spin ${isDarkMode ? 'text-neon-pink' : 'text-rose-400'}`} />
                <span className={isDarkMode ? 'text-neon-pink' : 'text-slate-700'}>
                  {langInfo.tutorName} is listening with sweet ears...
                </span>
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-neon-blue' : 'text-slate-400'}`}>
                Analyzing vocal tone & preparing encouraging voice coaching!
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Phrases for Current Scenario */}
      {activeScenario && activeScenario.targetPhrases.length > 0 && (
        <div
          className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto text-xs no-scrollbar ${
            isDarkMode
              ? 'bg-[#0f111a] border-[#ff2d87]/20'
              : 'bg-[#FFFDF9] border-rose-100'
          }`}
        >
          <span className={`shrink-0 text-[11px] font-semibold ${isDarkMode ? 'text-neon-pink' : 'text-slate-400'}`}>
            ✨ Try Saying:
          </span>
          {activeScenario.targetPhrases.map((tp, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPhrasePrompt(tp.native)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all whitespace-nowrap shadow-2xs ${
                isDarkMode
                  ? 'bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-neon-blue border-[#00e5ff]/40 hover:shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border-rose-200/80'
              }`}
            >
              <span className="font-bold">{tp.native}</span>
              <span className={`text-[10px] ${isDarkMode ? 'text-neon-green' : 'text-rose-600/70'}`}>
                ({tp.english})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input & Voice Recording Bar */}
      <div
        className={`p-3.5 border-t space-y-2.5 ${
          isDarkMode
            ? 'bg-[#0e1019] border-[#ff2d87]/20'
            : 'bg-[#FFFDF9] border-rose-100'
        }`}
      >
        {/* Active Recording State Banner */}
        {isRecording && (
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border text-xs animate-in fade-in shadow-xs ${
              isDarkMode
                ? 'bg-[#ff2d87]/20 border-[#ff2d87] text-white shadow-[0_0_20px_rgba(255,45,135,0.3)]'
                : 'bg-rose-100/80 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2d87] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#ff2d87]" />
              </span>
              <div>
                <div className={`font-bold ${isDarkMode ? 'text-neon-pink' : 'text-rose-900'}`}>
                  {langInfo.tutorName} is listening to your sweet voice!
                </div>
                <div className={`text-[11px] ${isDarkMode ? 'text-neon-green' : 'text-rose-700'}`}>
                  {inputText ? `"${inputText}"` : 'Speak clearly with tones and polite particles...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                  isDarkMode
                    ? 'text-neon-green bg-black/60 border border-[#00ff88]/40'
                    : 'text-rose-700 bg-white/80'
                }`}
              >
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
              <button
                onClick={handleStopVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#ff2d87] hover:bg-[#ff0066] text-white rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,135,0.5)]"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Finish</span>
              </button>
            </div>
          </div>
        )}

        {isTranscribing && (
          <div
            className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs ${
              isDarkMode
                ? 'bg-[#00e5ff]/15 border-[#00e5ff]/40 text-neon-blue'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Transcribing your cute voice with Gemini...</span>
          </div>
        )}

        {/* Input Form & Buttons */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          {/* Push-to-Talk Mic Button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartVoice}
              disabled={isLoading || isTranscribing}
              className={`flex items-center justify-center h-12 w-12 rounded-2xl font-bold transition-all active:scale-95 shrink-0 ${
                isDarkMode
                  ? 'bg-[#ff2d87] hover:bg-[#ff0077] text-white shadow-[0_0_20px_rgba(255,45,135,0.5)]'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow-md'
              }`}
              title="Speak with your microphone"
            >
              <Mic className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopVoice}
              className="flex items-center justify-center h-12 w-12 rounded-2xl bg-[#ff0066] text-white font-bold transition-transform active:scale-95 shadow-[0_0_25px_rgba(255,0,102,0.7)] shrink-0 animate-pulse"
              title="Stop recording"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}

          {/* Text Input with fallback */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Say something or chat in ${langInfo.name}...`}
              disabled={isLoading || isRecording}
              className={`w-full h-12 rounded-2xl px-4 text-sm focus:outline-none transition-all ${
                isDarkMode
                  ? 'bg-[#151824] border border-[#00e5ff]/35 text-white placeholder-slate-500 focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.08)]'
                  : 'bg-white border border-rose-200 text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 shadow-2xs'
              }`}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`flex items-center justify-center h-12 px-5 rounded-2xl disabled:opacity-40 font-bold text-xs transition-all active:scale-95 shrink-0 ${
              isDarkMode
                ? 'bg-[#00ff88] hover:bg-[#00e676] text-slate-950 shadow-[0_0_20px_rgba(0,255,136,0.5)]'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-2xs'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
