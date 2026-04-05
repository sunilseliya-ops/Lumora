'use client';

interface PlantStreakProps {
  streak: number;
}

export default function PlantStreak({ streak }: PlantStreakProps) {
  const stage = streak >= 30 ? 5 : streak >= 15 ? 4 : streak >= 7 ? 3 : streak >= 3 ? 2 : streak >= 1 ? 1 : 0;

  const labels = ['Plant your seed', 'Sprouting...', 'Growing strong', 'Thriving!', 'Flourishing!', 'In full bloom! 🌸'];
  const colors = ['#8892A4', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#E8A020'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {stage === 0 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            {/* Soil */}
            <ellipse cx="40" cy="68" rx="28" ry="8" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="64" rx="22" ry="6" fill="#4A3728"/>
            {/* Seed */}
            <ellipse cx="40" cy="60" rx="5" ry="4" fill="#8B6914" opacity="0.9"/>
          </svg>
        )}
        {stage === 1 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            <ellipse cx="40" cy="68" rx="28" ry="8" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="64" rx="22" ry="6" fill="#4A3728"/>
            {/* Stem */}
            <line x1="40" y1="60" x2="40" y2="42" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Tiny leaf */}
            <path d="M40 50 Q50 44 48 36 Q38 42 40 50" fill="#4ADE80" opacity="0.9"/>
          </svg>
        )}
        {stage === 2 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            <ellipse cx="40" cy="68" rx="28" ry="8" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="64" rx="22" ry="6" fill="#4A3728"/>
            {/* Stem */}
            <line x1="40" y1="62" x2="40" y2="34" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round"/>
            {/* Left leaf */}
            <path d="M40 52 Q26 46 28 34 Q40 40 40 52" fill="#4ADE80"/>
            {/* Right leaf */}
            <path d="M40 48 Q54 42 52 30 Q40 36 40 48" fill="#22C55E"/>
          </svg>
        )}
        {stage === 3 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            <ellipse cx="40" cy="70" rx="28" ry="7" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="66" rx="22" ry="5" fill="#4A3728"/>
            {/* Main stem */}
            <line x1="40" y1="64" x2="40" y2="24" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round"/>
            {/* Branch left */}
            <line x1="40" y1="44" x2="26" y2="34" stroke="#86EFAC" strokeWidth="2"/>
            {/* Branch right */}
            <line x1="40" y1="38" x2="54" y2="28" stroke="#86EFAC" strokeWidth="2"/>
            {/* Leaves */}
            <path d="M40 56 Q24 50 26 36 Q40 44 40 56" fill="#4ADE80"/>
            <path d="M40 50 Q56 44 54 30 Q40 38 40 50" fill="#22C55E"/>
            <path d="M26 34 Q16 24 20 14 Q30 22 26 34" fill="#86EFAC"/>
            <path d="M54 28 Q64 18 60 8 Q50 16 54 28" fill="#4ADE80"/>
            {/* Top bud */}
            <circle cx="40" cy="22" r="5" fill="#86EFAC"/>
          </svg>
        )}
        {stage === 4 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            <ellipse cx="40" cy="72" rx="28" ry="6" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="68" rx="22" ry="5" fill="#4A3728"/>
            {/* Trunk */}
            <line x1="40" y1="66" x2="40" y2="20" stroke="#8B6914" strokeWidth="4" strokeLinecap="round"/>
            {/* Branches */}
            <line x1="40" y1="46" x2="22" y2="32" stroke="#8B6914" strokeWidth="2.5"/>
            <line x1="40" y1="40" x2="58" y2="26" stroke="#8B6914" strokeWidth="2.5"/>
            <line x1="40" y1="34" x2="24" y2="18" stroke="#8B6914" strokeWidth="2"/>
            {/* Foliage */}
            <circle cx="40" cy="18" r="14" fill="#22C55E" opacity="0.9"/>
            <circle cx="24" cy="26" r="10" fill="#4ADE80" opacity="0.85"/>
            <circle cx="56" cy="22" r="10" fill="#16A34A" opacity="0.85"/>
            <circle cx="30" cy="14" r="8" fill="#86EFAC" opacity="0.8"/>
          </svg>
        )}
        {stage === 5 && (
          <svg viewBox="0 0 80 80" width="80" height="80">
            <ellipse cx="40" cy="72" rx="28" ry="6" fill="#3D2B1F" opacity="0.8"/>
            <ellipse cx="40" cy="68" rx="22" ry="5" fill="#4A3728"/>
            {/* Trunk */}
            <rect x="36" y="38" width="8" height="32" rx="4" fill="#92400E"/>
            {/* Big foliage */}
            <circle cx="40" cy="30" r="20" fill="#16A34A"/>
            <circle cx="22" cy="36" r="14" fill="#22C55E"/>
            <circle cx="58" cy="34" r="14" fill="#15803D"/>
            <circle cx="30" cy="18" r="12" fill="#4ADE80"/>
            <circle cx="52" cy="20" r="11" fill="#22C55E"/>
            {/* Flowers */}
            <circle cx="40" cy="14" r="5" fill="#E8A020"/>
            <circle cx="24" cy="26" r="4" fill="#F472B6"/>
            <circle cx="56" cy="24" r="4" fill="#E8A020"/>
          </svg>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: colors[stage] }}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </div>
        <div style={{ fontSize: 11, color: '#8892A4', marginTop: 2 }}>{labels[stage]}</div>
      </div>
    </div>
  );
}
