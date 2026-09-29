import React, { useState } from 'react';
import { FlashCard, SupportedLanguage } from '../types';
import { CHARACTER_FLASHCARDS, LANGUAGES } from '../data/languages';
import { AnimalAvatar } from './AnimalAvatar';
import { audioController } from '../utils/audio';
import {
  Volume2,
  RotateCw,
  CheckCircle2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Layers,
  Heart,
} from 'lucide-react';

interface FlashCardsProps {
  language: SupportedLanguage;
  voice: string;
  playbackSpeed: number;
  isDarkMode?: boolean;
}

export const FlashCards: React.FC<FlashCardsProps> = ({
  language,
  voice,
  playbackSpeed,
  isDarkMode = true,
}) => {
  const allCards = CHARACTER_FLASHCARDS.filter((c) => c.language === language);
  const langInfo = LANGUAGES[language];

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredCards = allCards.filter(
    (card) => categoryFilter === 'all' || card.category === categoryFilter
  );

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handlePlayAudio = async (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingId(id);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice,
          speed: playbackSpeed < 1 ? 'slow' : 'normal',
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        audioController.playBase64Wav(data.audioBase64, playbackSpeed, () => {
          setPlayingId(null);
        });
      } else {
        audioController.speakWithBrowser(text, language, playbackSpeed, () => {
          setPlayingId(null);
        });
      }
    } catch (err) {
      console.warn('Audio playback error, using speech fallback:', err);
      audioController.speakWithBrowser(text, language, playbackSpeed, () => {
        setPlayingId(null);
      });
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const toggleMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(Math.floor(Math.random() * filteredCards.length));
  };

  const categories = [
    { id: 'all', label: 'All Cards' },
    { id: 'consonants', label: 'Consonants / Kana' },
    { id: 'vowels', label: 'Vowels' },
    { id: 'basic_words', label: 'Everyday Words' },
    { id: 'kanji_hanzi', label: 'Hanzi & Kanji' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Animal Tutor Header Banner */}
      <div
        className={`rounded-3xl border p-5 shadow-sm transition-colors ${
          isDarkMode
            ? 'border-[#ff2d87]/30 bg-gradient-to-r from-[#141726] via-[#1b1429] to-[#101e28] shadow-[0_0_30px_rgba(255,45,135,0.1)]'
            : 'border-amber-200/60 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <AnimalAvatar animal={langInfo.tutorAnimal} size="lg" className="animate-bounce-subtle" />
          <div className="flex-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs mb-1 ${
                isDarkMode
                  ? 'bg-[#ff2d87]/15 border-[#ff2d87]/40 text-neon-pink'
                  : 'bg-white/90 border-amber-200 text-amber-700'
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#ff2d87]' : 'text-amber-500'}`} />
              <span>{langInfo.tutorName}'s Neon Character Deck</span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-display font-bold ${
                isDarkMode ? 'text-neon-pink' : 'text-slate-800'
              }`}
            >
              {langInfo.name} Character & Sound Flash Cards
            </h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-neon-blue' : 'text-slate-600'}`}>
              Tap a card to flip and hear native Gemini 3.8 speech! Master letters, radicals, and tones with sweet mnemonics.
            </p>
          </div>

          {/* Mastered Progress Badge */}
          <div
            className={`rounded-2xl border p-3 text-center shadow-xs shrink-0 ${
              isDarkMode
                ? 'bg-[#0f111a] border-[#00ff88]/40 shadow-[0_0_15px_rgba(0,255,136,0.15)]'
                : 'bg-white/95 border-amber-200'
            }`}
          >
            <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Mastered
            </div>
            <div
              className={`text-xl font-bold font-display mt-0.5 ${
                isDarkMode ? 'text-neon-green' : 'text-rose-500'
              }`}
            >
              {masteredIds.size} / {allCards.length}
            </div>
            <div className={`w-20 rounded-full h-1.5 mt-1.5 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-rose-100'}`}>
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDarkMode ? 'bg-[#00ff88]' : 'bg-rose-500'
                }`}
                style={{
                  width: `${(masteredIds.size / (allCards.length || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Categories & View Mode Toggle */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl border transition-colors ${
          isDarkMode
            ? 'bg-[#101320] border-[#00e5ff]/25 shadow-[0_0_20px_rgba(0,229,255,0.06)]'
            : 'bg-white/80 border-slate-200/80 shadow-2xs'
        }`}
      >
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                categoryFilter === cat.id
                  ? isDarkMode
                    ? 'bg-[#00ff88] text-slate-950 font-bold shadow-[0_0_12px_rgba(0,255,136,0.5)]'
                    : 'bg-amber-400 text-slate-900 font-semibold shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-neon-blue hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className={`flex items-center gap-1 p-1 rounded-xl ${isDarkMode ? 'bg-[#0b0d14]' : 'bg-slate-100/80'}`}>
          <button
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'card'
                ? isDarkMode
                  ? 'bg-[#ff2d87] text-white shadow-[0_0_10px_rgba(255,45,135,0.5)]'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-neon-pink'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Single Card Study Mode"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? isDarkMode
                  ? 'bg-[#00e5ff] text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.5)]'
                  : 'bg-white text-slate-900 shadow-xs'
                : isDarkMode
                ? 'text-slate-400 hover:text-neon-blue'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Overview Grid Mode"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Flip Card Study Deck */}
      {viewMode === 'card' && currentCard && (
        <div className="flex flex-col items-center space-y-5">
          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative w-full max-w-md h-88 cursor-pointer [perspective:1000px]"
          >
            <div
              className={`relative h-full w-full rounded-3xl border-2 transition-all duration-500 [transform-style:preserve-3d] shadow-lg ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              } ${
                isDarkMode
                  ? masteredIds.has(currentCard.id)
                    ? 'border-[#00ff88] bg-[#0c141a] shadow-[0_0_25px_rgba(0,255,136,0.3)]'
                    : 'border-[#ff2d87]/60 bg-[#121524] shadow-[0_0_30px_rgba(255,45,135,0.2)]'
                  : masteredIds.has(currentCard.id)
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-amber-200 bg-white'
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 flex flex-col justify-between p-6 [backface-visibility:hidden]">
                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isDarkMode
                        ? 'bg-[#00ff88]/15 text-neon-green border-[#00ff88]/40'
                        : 'bg-amber-100/80 text-amber-800 border-amber-200'
                    }`}
                  >
                    {currentCard.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleMastered(currentCard.id, e)}
                      className={`p-1.5 rounded-full transition-colors ${
                        masteredIds.has(currentCard.id)
                          ? isDarkMode ? 'text-neon-green bg-[#00ff88]/20' : 'text-emerald-500 bg-emerald-100/80'
                          : isDarkMode ? 'text-slate-500 hover:text-neon-pink' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                      title={masteredIds.has(currentCard.id) ? 'Mastered!' : 'Mark as mastered'}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          masteredIds.has(currentCard.id) ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => handlePlayAudio(currentCard.character, currentCard.id, e)}
                      className={`p-2 rounded-full transition-all shadow-2xs ${
                        isDarkMode
                          ? 'bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-neon-blue border border-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      }`}
                      title="Listen to native character pronunciation"
                    >
                      <Volume2
                        className={`h-4 w-4 ${
                          playingId === currentCard.id ? 'animate-bounce text-[#ff2d87]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Big Center Character (Neon Pink font in dark mode) */}
                <div className="text-center my-auto">
                  <div
                    className={`font-display text-7xl sm:text-8xl font-bold tracking-wide select-none group-hover:scale-105 transition-transform duration-200 ${
                      isDarkMode ? 'text-neon-pink' : 'text-slate-800'
                    }`}
                  >
                    {currentCard.character}
                  </div>
                  <div
                    className={`text-base font-bold mt-2 ${
                      isDarkMode ? 'text-neon-green' : 'text-amber-600'
                    }`}
                  >
                    {currentCard.name}
                  </div>
                  <div
                    className={`text-xs font-mono mt-0.5 ${
                      isDarkMode ? 'text-neon-blue' : 'text-slate-500'
                    }`}
                  >
                    Reading: [{currentCard.reading}]
                  </div>
                </div>

                {/* Card Bottom Hint */}
                <div
                  className={`flex items-center justify-between pt-3 border-t text-xs ${
                    isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isDarkMode ? 'text-neon-blue' : 'text-amber-600/90'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> {currentCard.toneOrPitch}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      isDarkMode ? 'text-neon-green hover:brightness-125' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <RotateCw className="h-3 w-3" /> Tap to flip
                  </span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div
                className={`absolute inset-0 flex flex-col justify-between p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-3xl ${
                  isDarkMode
                    ? 'bg-gradient-to-b from-[#181226] to-[#0f111e]'
                    : 'bg-gradient-to-b from-amber-50/50 to-white'
                }`}
              >
                {/* Back Top Row */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-neon-pink' : 'text-slate-700'}`}>
                    Meaning & Mnemonics
                  </span>
                  <button
                    onClick={(e) => handlePlayAudio(currentCard.exampleWord, `${currentCard.id}-ex`, e)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDarkMode
                        ? 'bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-neon-green border border-[#00ff88]/40'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    }`}
                    title="Hear example word"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Back Center Details */}
                <div className="space-y-3.5 my-auto text-center">
                  <div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                      Meaning
                    </span>
                    <div
                      className={`text-xl font-bold mt-0.5 ${
                        isDarkMode ? 'text-neon-green' : 'text-slate-800'
                      }`}
                    >
                      {currentCard.meaning}
                    </div>
                  </div>

                  {/* Cute Mnemonic */}
                  <div
                    className={`rounded-2xl p-3 text-xs leading-relaxed text-left border ${
                      isDarkMode
                        ? 'bg-[#00ff88]/10 text-neon-green border-[#00ff88]/30 shadow-[0_0_12px_rgba(0,255,136,0.1)]'
                        : 'bg-amber-100/60 text-amber-900 border-amber-200/80'
                    }`}
                  >
                    <span className={`font-bold block mb-0.5 ${isDarkMode ? 'text-neon-pink' : 'text-amber-800'}`}>
                      💡 Cute Memory Trick:
                    </span>
                    {currentCard.mnemonic}
                  </div>

                  {/* Example Word */}
                  <div
                    className={`rounded-xl p-2.5 border text-xs flex items-center justify-between ${
                      isDarkMode
                        ? 'bg-[#151928] border-[#00e5ff]/30 text-white'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="text-left">
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-neon-blue' : 'text-slate-800'}`}>
                        {currentCard.exampleWord}
                      </span>
                      <span className={`font-mono text-[11px] ml-1.5 ${isDarkMode ? 'text-neon-green' : 'text-slate-500'}`}>
                        ({currentCard.exampleReading})
                      </span>
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-neon-pink' : 'text-slate-600'}`}>
                      {currentCard.exampleMeaning}
                    </span>
                  </div>
                </div>

                {/* Back Bottom */}
                <div
                  className={`flex items-center justify-between pt-2 border-t text-xs ${
                    isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className={isDarkMode ? 'text-neon-blue' : ''}>
                    Card {currentIndex + 1} of {filteredCards.length}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${isDarkMode ? 'text-neon-pink' : 'text-slate-500'}`}>
                    <RotateCw className="h-3 w-3" /> Tap to flip back
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Study Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePrev}
              className={`flex items-center justify-center h-10 w-10 rounded-full border shadow-2xs transition-transform active:scale-95 ${
                isDarkMode
                  ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-blue border-[#00e5ff]/30'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
              title="Previous Card"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={handleShuffle}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold shadow-2xs transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-green border-[#00ff88]/40 shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
            >
              <Shuffle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-neon-green' : 'text-amber-500'}`} />
              <span>Shuffle</span>
            </button>

            <button
              onClick={(e) => toggleMastered(currentCard.id, e)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-2xs transition-all active:scale-95 ${
                masteredIds.has(currentCard.id)
                  ? isDarkMode
                    ? 'bg-[#00ff88] text-slate-950 shadow-[0_0_15px_rgba(0,255,136,0.6)]'
                    : 'bg-emerald-500 text-white shadow-emerald-200'
                  : isDarkMode
                  ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-pink border border-[#ff2d87]/40 shadow-[0_0_10px_rgba(255,45,135,0.2)]'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{masteredIds.has(currentCard.id) ? 'Mastered!' : 'Mark Mastered'}</span>
            </button>

            <button
              onClick={handleNext}
              className={`flex items-center justify-center h-10 w-10 rounded-full border shadow-2xs transition-transform active:scale-95 ${
                isDarkMode
                  ? 'bg-[#151928] hover:bg-[#1f243a] text-neon-blue border-[#00e5ff]/30'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
              title="Next Card"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Grid Overview Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredCards.map((card, idx) => {
            const isMastered = masteredIds.has(card.id);
            return (
              <div
                key={card.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setViewMode('card');
                  setIsFlipped(false);
                }}
                className={`group cursor-pointer rounded-2xl border-2 p-4 text-center transition-all hover:-translate-y-1 shadow-xs ${
                  isDarkMode
                    ? isMastered
                      ? 'border-[#00ff88] bg-[#0c141a] shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                      : 'border-[#00e5ff]/30 bg-[#131625] hover:border-[#ff2d87]'
                    : isMastered
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200/90 bg-white hover:border-amber-300'
                }`}
              >
                <div className={`flex items-center justify-between text-[11px] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  <span className={isDarkMode ? 'text-neon-blue' : ''}>{card.category}</span>
                  {isMastered && <CheckCircle2 className={`h-3.5 w-3.5 ${isDarkMode ? 'text-neon-green' : 'text-emerald-500'}`} />}
                </div>

                <div
                  className={`text-4xl font-display font-bold my-2 group-hover:scale-110 transition-transform ${
                    isDarkMode ? 'text-neon-pink' : 'text-slate-800'
                  }`}
                >
                  {card.character}
                </div>

                <div className={`text-xs font-bold truncate ${isDarkMode ? 'text-neon-green' : 'text-slate-700'}`}>
                  {card.name}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 ${isDarkMode ? 'text-neon-blue' : 'text-slate-500'}`}>
                  [{card.reading}]
                </div>
                <div className={`text-[11px] font-medium truncate mt-1 ${isDarkMode ? 'text-neon-pink' : 'text-amber-700'}`}>
                  {card.meaning}
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    onClick={(e) => handlePlayAudio(card.character, card.id, e)}
                    className={`p-1 rounded-md ${isDarkMode ? 'text-slate-400 hover:text-neon-green hover:bg-[#00ff88]/10' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                  <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-neon-blue group-hover:text-neon-green' : 'text-slate-400 group-hover:text-amber-600'}`}>
                    Study Card →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
