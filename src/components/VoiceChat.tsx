import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SentimentAnalysis, SupportedLanguage, PracticeScenario } from '../types';
import { LANGUAGES } from '../data/languages';
import { audioController, VoiceRecorder } from '../utils/audio';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Square,
  MessageSquare,
  Info,
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

  // Audio playback end listener
  const handlePlayMessageAudio = (messageId: string, audioBase64: string, speed = playbackSpeed) => {
    if (playingMessageId === messageId) {
      audioController.stop();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);
    audioController.playBase64Wav(audioBase64, speed, () => {
      setPlayingMessageId(null);
    });
  };

  // Play individual phrase or word with Gemini 3.8 TTS
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
      }
    } catch (err) {
      console.error('TTS error on word:', err);
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

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Try browser speech recognition for live visual feedback
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

      // If Web Speech already populated inputText, we can use that,
      // or transcribe with Gemini 3.5 Transcribe for high accuracy on tones
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
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* Chat Sub-Header: Persona & Scenario Status */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-300 font-display font-bold text-base shadow-sm">
            {language === 'thai' ? 'พ' : language === 'mandarin' ? '李' : '由'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">{langInfo.tutorName}</span>
              <span className="text-xs text-amber-400 font-medium">· {langInfo.flag}</span>
            </div>
            <p className="text-xs text-slate-400">
              {activeScenario ? `Scenario: ${activeScenario.title}` : langInfo.tutorRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
              Role: {activeScenario.userRole}
            </span>
          )}
          <button
            onClick={onClearChat}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            title="Start fresh conversation"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isPlaying = playingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`group relative rounded-2xl p-4 sm:p-5 transition-all ${
                  isUser
                    ? 'bg-amber-500/15 border border-amber-500/30 text-slate-100'
                    : 'bg-slate-850/90 border border-slate-750 text-slate-100 shadow-sm'
                }`}
              >
                {/* User Message Header or Tutor Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 gap-4">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{isUser ? 'You' : langInfo.tutorName}</span>
                    {isUser && message.inputMode === 'voice' && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Mic className="h-3 w-3" /> Voice
                      </span>
                    )}
                  </div>

                  {/* Audio Controls for Tutor */}
                  {!isUser && message.audioBase64 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlayMessageAudio(message.id, message.audioBase64!)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Play Gemini 3.8 TTS voice response"
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
                        onClick={() => handlePlayMessageAudio(message.id, message.audioBase64!, 0.75)}
                        className="px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60"
                        title="Listen at 0.75x slow speed for tone clarity"
                      >
                        0.75x
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Content: Native Script */}
                <div className="text-base sm:text-lg font-medium leading-relaxed tracking-wide text-white">
                  {message.text}
                </div>

                {/* Romanized Phonetic Guide (Pinyin / Romaji / Thai RTGS) */}
                {!isUser && message.romanized && showRomanization && (
                  <div className="mt-2 text-xs font-mono text-amber-400/90 tracking-wide bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-800">
                    {message.romanized}
                  </div>
                )}

                {/* English Translation */}
                {!isUser && message.english && (
                  <div className="mt-1.5 text-xs text-slate-400 italic">
                    "{message.english}"
                  </div>
                )}

                {/* Audio Wave Playing Indicator */}
                {isPlaying && (
                  <div className="mt-3 flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <Volume2 className="h-4 w-4 animate-pulse text-amber-400" />
                    <span className="font-medium">Streaming Gemini 3.8 TTS audio...</span>
                    <div className="flex items-center gap-0.5 ml-2">
                      <span className="h-2 w-0.5 bg-amber-400 animate-bounce" />
                      <span className="h-3 w-0.5 bg-amber-400 animate-bounce delay-75" />
                      <span className="h-1.5 w-0.5 bg-amber-400 animate-bounce delay-150" />
                    </div>
                  </div>
                )}

                {/* Real-time Sentiment Tag for Learner Voice Input */}
                {isUser && message.analysis && (
                  <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-xs flex flex-wrap items-center gap-2 text-slate-300">
                    <span className="font-semibold text-amber-400">Tone Posture:</span>
                    <span>{message.analysis.sentiment}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">Politeness: {message.analysis.politenessScore}%</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">Confidence: {message.analysis.confidenceScore}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-3 mr-auto max-w-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl bg-slate-850 p-4 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <span>{langInfo.tutorName} is analyzing tone & preparing voice response...</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Generating sentiment analysis and Gemini 3.8 TTS audio synthesis.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Phrases for Current Scenario */}
      {activeScenario && activeScenario.targetPhrases.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-slate-500 shrink-0 text-[11px] font-medium">Quick Phrases:</span>
          {activeScenario.targetPhrases.map((tp, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPhrasePrompt(tp.native)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors whitespace-nowrap"
            >
              <span>{tp.native}</span>
              <span className="text-slate-500 text-[10px]">({tp.english})</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input & Voice Recording Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
        {/* Active Recording State Banner */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <div>
                <div className="text-xs font-semibold text-white">Recording Voice in {langInfo.name}...</div>
                <div className="text-[11px] text-rose-300">
                  {inputText ? `"${inputText}"` : 'Listening for your pitch, tones, and politeness particles...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-rose-400">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
              <button
                onClick={handleStopVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Finish & Send</span>
              </button>
            </div>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Transcribing spoken audio with Gemini Transcribe...</span>
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
              className="flex items-center justify-center h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-transform active:scale-95 shadow-md shrink-0"
              title="Speak with your microphone"
            >
              <Mic className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopVoice}
              className="flex items-center justify-center h-11 w-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-transform active:scale-95 shadow-md shrink-0 animate-pulse"
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
              placeholder={`Say something or type in ${langInfo.name}...`}
              disabled={isLoading || isRecording}
              className="w-full h-11 rounded-xl bg-slate-800/90 border border-slate-700/80 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="flex items-center justify-center h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 font-medium text-xs border border-slate-700 transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
