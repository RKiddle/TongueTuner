import React from 'react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { Sliders, Sparkles, Moon, Sun } from 'lucide-react';

interface TopNavProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  activeTab: 'chat' | 'flashcards' | 'sentiment' | 'clinic' | 'scenarios';
  onChangeTab: (tab: 'chat' | 'flashcards' | 'sentiment' | 'clinic' | 'scenarios') => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentLanguage,
  onSelectLanguage,
  activeTab,
  onChangeTab,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const currentLangInfo = LANGUAGES[currentLanguage];

  const animalEmoji: Record<SupportedLanguage, string> = {
    thai: '🐘',
    mandarin: '🐼',
    japanese: '🐕',
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        isDarkMode
          ? 'border-b border-[#ff2d87]/30 bg-[#0b0d14]/90 backdrop-blur-md shadow-[0_4px_25px_rgba(255,45,135,0.08)]'
          : 'border-b border-rose-100 bg-[#FFFDF9]/90 backdrop-blur-md shadow-2xs'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand text element & Dr Richard Kiddle author badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChangeTab('chat')}
            className={`flex items-center gap-2 text-left font-display text-xl font-bold tracking-tight transition-all ${
              isDarkMode
                ? 'text-neon-pink hover:brightness-125'
                : 'text-slate-800 hover:text-rose-500'
            }`}
          >
            <span className="text-2xl animate-bounce-subtle">✨</span>
            <span>TongueTuner</span>
          </button>

          {/* Dr Richard Kiddle Author Attribution */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
              isDarkMode
                ? 'bg-[#00e5ff]/10 text-neon-blue border-[#00e5ff]/40'
                : 'bg-amber-100/70 text-slate-700 border-amber-200/80'
            }`}
          >
            <span>by Dr Richard Kiddle</span>
          </div>
        </div>

        {/* Zone 2: 5 Clean Nav Links with Neon fonts in dark mode */}
        <nav
          className={`hidden md:flex items-center gap-6 text-sm font-semibold ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <button
            onClick={() => onChangeTab('chat')}
            className={`transition-all hover:brightness-125 flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? isDarkMode
                  ? 'text-neon-pink border-b-2 border-[#ff2d87] pb-0.5'
                  : 'text-rose-600 font-bold border-b-2 border-rose-500 pb-0.5'
                : isDarkMode
                ? 'text-slate-300 hover:text-neon-pink'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            <span>Voice Chat</span>
          </button>

          <button
            onClick={() => onChangeTab('flashcards')}
            className={`transition-all hover:brightness-125 flex items-center gap-1.5 ${
              activeTab === 'flashcards'
                ? isDarkMode
                  ? 'text-neon-green border-b-2 border-[#00ff88] pb-0.5'
                  : 'text-rose-600 font-bold border-b-2 border-rose-500 pb-0.5'
                : isDarkMode
                ? 'text-slate-300 hover:text-neon-green'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            <span>Flash Cards</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isDarkMode
                  ? 'bg-[#00ff88]/20 text-neon-green border border-[#00ff88]/40'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              Cards
            </span>
          </button>

          <button
            onClick={() => onChangeTab('sentiment')}
            className={`transition-all hover:brightness-125 ${
              activeTab === 'sentiment'
                ? isDarkMode
                  ? 'text-neon-blue border-b-2 border-[#00e5ff] pb-0.5'
                  : 'text-rose-600 font-bold border-b-2 border-rose-500 pb-0.5'
                : isDarkMode
                ? 'text-slate-300 hover:text-neon-blue'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            Sentiment Radar
          </button>

          <button
            onClick={() => onChangeTab('clinic')}
            className={`transition-all hover:brightness-125 ${
              activeTab === 'clinic'
                ? isDarkMode
                  ? 'text-neon-green border-b-2 border-[#00ff88] pb-0.5'
                  : 'text-rose-600 font-bold border-b-2 border-rose-500 pb-0.5'
                : isDarkMode
                ? 'text-slate-300 hover:text-neon-green'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            Tone Clinic
          </button>

          <button
            onClick={() => onChangeTab('scenarios')}
            className={`transition-all hover:brightness-125 ${
              activeTab === 'scenarios'
                ? isDarkMode
                  ? 'text-neon-pink border-b-2 border-[#ff2d87] pb-0.5'
                  : 'text-rose-600 font-bold border-b-2 border-rose-500 pb-0.5'
                : isDarkMode
                ? 'text-slate-300 hover:text-neon-pink'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          >
            Scenarios
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Language switcher, Theme Switcher & Voice Settings) */}
        <div className="flex items-center gap-2.5">
          {/* Cute Language Selector with Animals */}
          <div
            className={`flex items-center rounded-2xl p-1 border transition-colors ${
              isDarkMode
                ? 'bg-[#151824] border-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                : 'bg-amber-50 border-amber-200/80 shadow-2xs'
            }`}
          >
            {(['thai', 'mandarin', 'japanese'] as SupportedLanguage[]).map((lang) => {
              const info = LANGUAGES[lang];
              const isSelected = currentLanguage === lang;
              return (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl transition-all ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-[#ff2d87] text-white font-bold shadow-[0_0_12px_rgba(255,45,135,0.6)] scale-102'
                        : 'bg-rose-500 text-white font-bold shadow-xs scale-102'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-neon-blue hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                  title={`Practice ${info.name} with ${info.tutorName}`}
                >
                  <span className="text-sm">{animalEmoji[lang]}</span>
                  <span className="hidden sm:inline font-bold">{info.name}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Toggle Button: Neon Dark Mode / Pastel Light */}
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#151824] border-[#00ff88]/50 text-neon-green hover:shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                : 'bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 shadow-2xs'
            }`}
            title={isDarkMode ? 'Switch to Light Pastel Mode' : 'Switch to Neon Dark Mode'}
          >
            {isDarkMode ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#00ff88] animate-spin-slow" />
                <span className="hidden lg:inline text-neon-green">Neon Dark</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden lg:inline">Pastel Light</span>
              </>
            )}
          </button>

          {/* Voice Engine Settings */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-2xl border transition-colors ${
              isDarkMode
                ? 'bg-[#151824] border-[#ff2d87]/40 text-neon-pink hover:shadow-[0_0_15px_rgba(255,45,135,0.3)]'
                : 'bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 shadow-2xs'
            }`}
            title="Configure Gemini 3.8 TTS voice & speed"
          >
            <Sliders className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#ff2d87]' : 'text-rose-500'}`} />
            <span className="hidden sm:inline">Voices</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div
        className={`flex md:hidden border-t px-3 py-2 justify-around text-xs font-semibold ${
          isDarkMode
            ? 'bg-[#0b0d14] border-[#ff2d87]/20 text-slate-400'
            : 'bg-[#FFFDF9] border-rose-100 text-slate-500'
        }`}
      >
        <button
          onClick={() => onChangeTab('chat')}
          className={`py-1 ${
            activeTab === 'chat'
              ? isDarkMode ? 'text-neon-pink font-bold' : 'text-rose-600 font-bold'
              : ''
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => onChangeTab('flashcards')}
          className={`py-1 ${
            activeTab === 'flashcards'
              ? isDarkMode ? 'text-neon-green font-bold' : 'text-rose-600 font-bold'
              : ''
          }`}
        >
          Cards 🎴
        </button>
        <button
          onClick={() => onChangeTab('sentiment')}
          className={`py-1 ${
            activeTab === 'sentiment'
              ? isDarkMode ? 'text-neon-blue font-bold' : 'text-rose-600 font-bold'
              : ''
          }`}
        >
          Radar
        </button>
        <button
          onClick={() => onChangeTab('clinic')}
          className={`py-1 ${
            activeTab === 'clinic'
              ? isDarkMode ? 'text-neon-green font-bold' : 'text-rose-600 font-bold'
              : ''
          }`}
        >
          Clinic
        </button>
        <button
          onClick={() => onChangeTab('scenarios')}
          className={`py-1 ${
            activeTab === 'scenarios'
              ? isDarkMode ? 'text-neon-pink font-bold' : 'text-rose-600 font-bold'
              : ''
          }`}
        >
          Scenarios
        </button>
      </div>
    </header>
  );
};
