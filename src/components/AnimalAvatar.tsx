import React from 'react';
import { AnimalType } from '../types';

interface AnimalAvatarProps {
  animal: AnimalType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
  className?: string;
}

export const AnimalAvatar: React.FC<AnimalAvatarProps> = ({
  animal,
  size = 'md',
  speaking = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const containerSize = sizeMap[size];

  // Chang Noi - Cute Baby Elephant (Thai)
  if (animal === 'elephant') {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${containerSize} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md select-none">
          {/* Big floppy ears */}
          <ellipse cx="25" cy="45" rx="20" ry="24" fill="#93C5FD" stroke="#60A5FA" strokeWidth="2.5" />
          <ellipse cx="25" cy="45" rx="13" ry="16" fill="#F472B6" opacity="0.4" />
          <ellipse cx="75" cy="45" rx="20" ry="24" fill="#93C5FD" stroke="#60A5FA" strokeWidth="2.5" />
          <ellipse cx="75" cy="45" rx="13" ry="16" fill="#F472B6" opacity="0.4" />

          {/* Head */}
          <circle cx="50" cy="50" r="32" fill="#BAE6FD" stroke="#60A5FA" strokeWidth="2.5" />

          {/* Tropical flower / lotus behind ear */}
          <circle cx="72" cy="28" r="7" fill="#F43F5E" />
          <circle cx="72" cy="28" r="3" fill="#FDE047" />

          {/* Sparkly cute eyes */}
          <ellipse cx="40" cy="46" rx="4.5" ry="5.5" fill="#1E293B" />
          <circle cx="38" cy="44" r="2" fill="#FFFFFF" />
          <circle cx="42" cy="48" r="0.8" fill="#FFFFFF" />

          <ellipse cx="60" cy="46" rx="4.5" ry="5.5" fill="#1E293B" />
          <circle cx="58" cy="44" r="2" fill="#FFFFFF" />
          <circle cx="62" cy="48" r="0.8" fill="#FFFFFF" />

          {/* Rosy blush cheeks */}
          <ellipse cx="33" cy="56" rx="5" ry="3" fill="#FB7185" opacity="0.5" />
          <ellipse cx="67" cy="56" rx="5" ry="3" fill="#FB7185" opacity="0.5" />

          {/* Cute curled trunk */}
          <path
            d={speaking ? "M 48 54 Q 50 68 56 68 Q 63 68 62 60" : "M 48 54 Q 50 66 54 66 Q 60 66 59 58"}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Happy mouth peek */}
          <path d="M 44 60 Q 48 64 52 60" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {speaking && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
          </span>
        )}
      </div>
    );
  }

  // Bao Bao - Cute Chubby Panda (Mandarin)
  if (animal === 'panda') {
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${containerSize} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md select-none">
          {/* Round black ears */}
          <circle cx="26" cy="28" r="14" fill="#1E293B" />
          <circle cx="26" cy="28" r="8" fill="#334155" />
          <circle cx="74" cy="28" r="14" fill="#1E293B" />
          <circle cx="74" cy="28" r="8" fill="#334155" />

          {/* Bamboo leaf accessory */}
          <path d="M 72 16 Q 85 14 84 25 Q 76 22 72 16 Z" fill="#22C55E" />

          {/* Round face */}
          <circle cx="50" cy="53" r="34" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />

          {/* Eye patches */}
          <ellipse cx="36" cy="48" rx="9" ry="11" fill="#1E293B" transform="rotate(-15 36 48)" />
          <ellipse cx="64" cy="48" rx="9" ry="11" fill="#1E293B" transform="rotate(15 64 48)" />

          {/* Bright cute eyes */}
          <ellipse cx="37" cy="47" rx="3.5" ry="4.5" fill="#FFFFFF" />
          <circle cx="37" cy="46" r="2.5" fill="#0F172A" />
          <circle cx="36" cy="45" r="1" fill="#FFFFFF" />

          <ellipse cx="63" cy="47" rx="3.5" ry="4.5" fill="#FFFFFF" />
          <circle cx="63" cy="46" r="2.5" fill="#0F172A" />
          <circle cx="62" cy="45" r="1" fill="#FFFFFF" />

          {/* Pink blushing cheeks */}
          <circle cx="28" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />
          <circle cx="72" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />

          {/* Nose */}
          <ellipse cx="50" cy="58" rx="4" ry="2.5" fill="#0F172A" />

          {/* Cute open smile */}
          <path
            d={speaking ? "M 44 64 Q 50 74 56 64 Z" : "M 45 63 Q 50 68 55 63"}
            fill={speaking ? "#E11D48" : "none"}
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {speaking && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        )}
      </div>
    );
  }

  // Shiba Momo - Cute Japanese Shiba Inu Puppy
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${containerSize} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md select-none">
        {/* Pointy triangular ears */}
        <polygon points="22,40 32,15 48,34" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
        <polygon points="27,37 34,22 44,34" fill="#FEF3C7" />

        <polygon points="78,40 68,15 52,34" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
        <polygon points="73,37 66,22 56,34" fill="#FEF3C7" />

        {/* Head */}
        <ellipse cx="50" cy="52" rx="33" ry="30" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />

        {/* White muzzle cheeks */}
        <ellipse cx="50" cy="62" rx="24" ry="18" fill="#FFFBEB" />

        {/* Eye white brows (Tan marks) */}
        <circle cx="38" cy="38" r="4" fill="#FEF3C7" />
        <circle cx="62" cy="38" r="4" fill="#FEF3C7" />

        {/* Cute happy eyes */}
        <ellipse cx="37" cy="46" rx="4" ry="5" fill="#1E293B" />
        <circle cx="35" cy="44" r="1.8" fill="#FFFFFF" />
        <circle cx="39" cy="48" r="0.7" fill="#FFFFFF" />

        <ellipse cx="63" cy="46" rx="4" ry="5" fill="#1E293B" />
        <circle cx="61" cy="44" r="1.8" fill="#FFFFFF" />
        <circle cx="65" cy="48" r="0.7" fill="#FFFFFF" />

        {/* Peachy blush */}
        <circle cx="28" cy="58" r="5" fill="#FB7185" opacity="0.5" />
        <circle cx="72" cy="58" r="5" fill="#FB7185" opacity="0.5" />

        {/* Black nose */}
        <polygon points="50,55 45,51 55,51" fill="#1E293B" />

        {/* Doggy smile */}
        <path
          d={
            speaking
              ? "M 44 60 Q 50 72 56 60 Z"
              : "M 44 59 Q 47 64 50 60 Q 53 64 56 59"
          }
          fill={speaking ? "#E11D48" : "none"}
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Red Japanese ribbon/bell collar */}
        <path d="M 32 78 Q 50 86 68 78" stroke="#DC2626" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="83" r="3.5" fill="#FBBF24" />
      </svg>

      {speaking && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
      )}
    </div>
  );
};
