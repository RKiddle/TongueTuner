import React, { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, ChatMessage, SentimentAnalysis, PracticeScenario } from './types';
import { LANGUAGES, PRACTICE_SCENARIOS } from './data/languages';
import { TopNav } from './components/TopNav';
import { VoiceChat } from './components/VoiceChat';
import { SentimentFeedbackPanel } from './components/SentimentFeedbackPanel';
import { PronunciationClinicModal } from './components/PronunciationClinicModal';
import { ScenarioSelector } from './components/ScenarioSelector';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { FlashCards } from './components/FlashCards';
import { audioController } from './utils/audio';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('thai');
  const [activeTab, setActiveTab] = useState<'chat' | 'flashcards' | 'sentiment' | 'clinic' | 'scenarios'>('chat');
  const [activeScenario, setActiveScenario] = useState<PracticeScenario | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('Puck');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showRomanization, setShowRomanization] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<SentimentAnalysis | null>(null);

  // Initialize tutor greeting when language changes
  const initGreeting = useCallback(async (lang: SupportedLanguage, scenario?: PracticeScenario) => {
    const langInfo = LANGUAGES[lang];
    const voiceToUse = langInfo.defaultVoice;
    setSelectedVoice(voiceToUse);

    const greetingText = scenario
      ? `Welcome to ${scenario.title}! I am your ${scenario.tutorRole}. Let's begin!`
      : langInfo.greetingNative;

    const romanized = scenario ? '' : langInfo.greetingRomanized;
    const english = scenario ? scenario.description : langInfo.greetingEnglish;

    // Create initial message
    const greetingMsg: ChatMessage = {
      id: `init-${Date.now()}`,
      role: 'assistant',
      timestamp: Date.now(),
      text: greetingText,
      romanized,
      english,
      language: lang,
    };

    setMessages([greetingMsg]);
    setLatestAnalysis(null);

    // Synthesize Gemini 3.8 audio for the greeting
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: greetingText,
          language: lang,
          voice: voiceToUse,
          speed: 'normal',
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        setMessages((prev) =>
          prev.map((m) => (m.id === greetingMsg.id ? { ...m, audioBase64: data.audioBase64 } : m))
        );
        if (autoPlayAudio) {
          audioController.playBase64Wav(data.audioBase64, playbackSpeed);
        }
      } else if (autoPlayAudio) {
        audioController.speakWithBrowser(greetingText, lang, playbackSpeed);
      }
    } catch (err) {
      console.warn('Greeting TTS error, using browser speech fallback:', err);
      if (autoPlayAudio) {
        audioController.speakWithBrowser(greetingText, lang, playbackSpeed);
      }
    }
  }, [autoPlayAudio, playbackSpeed]);

  // Initial load
  useEffect(() => {
    initGreeting('thai');
  }, []);

  // Handle switching language
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (lang === currentLanguage) return;
    setCurrentLanguage(lang);
    setActiveScenario(null);
    initGreeting(lang);
  };

  // Handle Send Message
  const handleSendMessage = async (text: string, inputMode: 'voice' | 'text') => {
    if (!text.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      timestamp: Date.now(),
      text,
      language: currentLanguage,
      inputMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          userMessage: text,
          messages: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
          scenario: activeScenario ? `${activeScenario.title}: ${activeScenario.description}` : '',
          voice: selectedVoice,
          speed: playbackSpeed < 1 ? 'slow' : 'normal',
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update user message with sentiment analysis tag
      if (data.analysis) {
        setLatestAnalysis(data.analysis);
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, analysis: data.analysis } : m))
        );
      }

      // Tutor response message
      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'assistant',
        timestamp: Date.now(),
        text: data.replyNative,
        romanized: data.replyRomanized,
        english: data.replyEnglish,
        audioBase64: data.audioBase64 || undefined,
        language: currentLanguage,
      };

      setMessages((prev) => [...prev, tutorMsg]);

      // Auto-play audio if enabled
      if (autoPlayAudio) {
        if (data.audioBase64) {
          audioController.playBase64Wav(data.audioBase64, playbackSpeed);
        } else if (data.replyNative) {
          audioController.speakWithBrowser(data.replyNative, currentLanguage, playbackSpeed);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        timestamp: Date.now(),
        text: 'Sorry, I had trouble processing that. Please try again!',
        english: err.message,
        language: currentLanguage,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Scenario Select
  const handleSelectScenario = (scenario: PracticeScenario) => {
    setActiveScenario(scenario);
    setActiveTab('chat');
    initGreeting(scenario.language, scenario);
  };

  // Play standalone phrase helper
  const handlePlayPhrase = async (phrase: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phrase,
          language: currentLanguage,
          voice: selectedVoice,
          speed: playbackSpeed < 1 ? 'slow' : 'normal',
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64, playbackSpeed);
      } else {
        audioController.speakWithBrowser(phrase, currentLanguage, playbackSpeed);
      }
    } catch (e) {
      audioController.speakWithBrowser(phrase, currentLanguage, playbackSpeed);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#07090f] text-slate-100 selection:bg-[#ff2d87]/30 selection:text-[#ff2d87]'
          : 'bg-[#FFFDF9] text-slate-800 selection:bg-rose-200 selection:text-rose-900'
      }`}
    >
      {/* 3-Zone Top Navigation with Dark Neon Toggle */}
      <TopNav
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Voice Chat Canvas */}
            <div className="lg:col-span-8">
              <VoiceChat
                language={currentLanguage}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeScenario={activeScenario}
                onClearChat={() => initGreeting(currentLanguage, activeScenario || undefined)}
                voice={selectedVoice}
                playbackSpeed={playbackSpeed}
                autoPlayAudio={autoPlayAudio}
                showRomanization={showRomanization}
                onSelectPhrasePrompt={(p) => handleSendMessage(p, 'text')}
                onOpenClinic={() => setActiveTab('clinic')}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Right 4 Columns: Real-Time Sentiment Radar & Feedback Panel */}
            <div className="lg:col-span-4 sticky top-24">
              <SentimentFeedbackPanel
                analysis={latestAnalysis}
                language={currentLanguage}
                scenarioTitle={activeScenario?.title}
                onPlayPhrase={handlePlayPhrase}
                voice={selectedVoice}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <FlashCards
            language={currentLanguage}
            voice={selectedVoice}
            playbackSpeed={playbackSpeed}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'sentiment' && (
          <div className="max-w-2xl mx-auto py-2">
            <SentimentFeedbackPanel
              analysis={latestAnalysis}
              language={currentLanguage}
              scenarioTitle={activeScenario?.title}
              onPlayPhrase={handlePlayPhrase}
              voice={selectedVoice}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {activeTab === 'clinic' && (
          <PronunciationClinicModal
            language={currentLanguage}
            voice={selectedVoice}
            playbackSpeed={playbackSpeed}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioSelector
            language={currentLanguage}
            currentScenarioId={activeScenario?.id || null}
            onSelectScenario={handleSelectScenario}
            voice={selectedVoice}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Footer & Dr Richard Kiddle Copyright Notice */}
      <footer
        className={`w-full py-6 px-4 border-t mt-auto text-center transition-colors ${
          isDarkMode
            ? 'bg-[#0a0c14] border-[#ff2d87]/20 text-slate-400'
            : 'bg-white border-rose-100 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={isDarkMode ? 'text-neon-pink font-bold' : 'text-slate-800 font-bold'}>
              TongueTuner AI™
            </span>
            <span className="hidden sm:inline text-slate-400">· Real-time Gemini 3.8 Voice & Tonal Lab</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={isDarkMode ? 'text-neon-green font-semibold' : 'text-slate-700 font-semibold'}>
              Copyright © {new Date().getFullYear()} Dr Richard Kiddle. All rights reserved.
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${
              isDarkMode
                ? 'bg-[#00e5ff]/10 text-neon-blue border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            Conceived & Authored by Dr Richard Kiddle
          </div>
        </div>
      </footer>

      {/* Voice Settings Engine Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={currentLanguage}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        playbackSpeed={playbackSpeed}
        onSelectSpeed={setPlaybackSpeed}
        autoPlayAudio={autoPlayAudio}
        onToggleAutoPlay={setAutoPlayAudio}
        showRomanization={showRomanization}
        onToggleRomanization={setShowRomanization}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
