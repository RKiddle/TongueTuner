import React from 'react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { Volume2, Sliders, Sparkles } from 'lucide-react';

interface TopNavProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  activeTab: 'chat' | 'sentiment' | 'clinic' | 'scenarios';
  onChangeTab: (tab: 'chat' | 'sentiment' | 'clinic' | 'scenarios') => void;
  onOpenSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentLanguage,
  onSelectLanguage,
  activeTab,
  onChangeTab,
  onOpenSettings,
}) => {
  const currentLangInfo = LANGUAGES[currentLanguage];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand text element */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChangeTab('chat')}
            className="text-left font-display text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors"
          >
            TongueTuner
          </button>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
            · Gemini 3.8 Voice Lab
          </span>
        </div>

        {/* Zone 2: 4 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onChangeTab('chat')}
            className={`transition-colors hover:text-white ${
              activeTab === 'chat' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Voice Chat
          </button>
          <button
            onClick={() => onChangeTab('sentiment')}
            className={`transition-colors hover:text-white ${
              activeTab === 'sentiment' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Sentiment Radar
          </button>
          <button
            onClick={() => onChangeTab('clinic')}
            className={`transition-colors hover:text-white ${
              activeTab === 'clinic' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Tone Clinic
          </button>
          <button
            onClick={() => onChangeTab('scenarios')}
            className={`transition-colors hover:text-white ${
              activeTab === 'scenarios' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Scenarios
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions (Language switcher & Voice Settings) */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-1 border border-slate-700/60">
            {(['thai', 'mandarin', 'japanese'] as SupportedLanguage[]).map((lang) => {
              const info = LANGUAGES[lang];
              const isSelected = currentLanguage === lang;
              return (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title={`Switch to ${info.name} (${info.nativeName})`}
                >
                  <span>{info.flag}</span>
                  <span className="hidden sm:inline">{info.name}</span>
                </button>
              );
            })}
          </div>

          {/* Voice Engine Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Configure Gemini 3.8 TTS voice & speed"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Voice Engine</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden border-t border-slate-800/80 px-4 py-2 justify-around text-xs font-medium bg-slate-900/95">
        <button
          onClick={() => onChangeTab('chat')}
          className={`py-1 ${activeTab === 'chat' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Voice Chat
        </button>
        <button
          onClick={() => onChangeTab('sentiment')}
          className={`py-1 ${activeTab === 'sentiment' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Sentiment Radar
        </button>
        <button
          onClick={() => onChangeTab('clinic')}
          className={`py-1 ${activeTab === 'clinic' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Tone Clinic
        </button>
        <button
          onClick={() => onChangeTab('scenarios')}
          className={`py-1 ${activeTab === 'scenarios' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Scenarios
        </button>
      </div>
    </header>
  );
};
