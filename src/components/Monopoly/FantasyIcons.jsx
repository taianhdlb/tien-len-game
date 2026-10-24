import { useId } from 'react';

// Fantasy vector icons. Gradient ids are namespaced per instance so multiple
// copies on the board never resolve to a hidden/duplicated <defs>.
export function FantasyIcon({ name, className = 'w-4 h-4', glow = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const goldGrad = `${uid}-gold`;
  const gateGrad = `${uid}-gate`;
  const beerGrad = `${uid}-beer`;
  const sackGrad = `${uid}-sack`;
  const portalGrad = `${uid}-portal`;
  const glowFilter = glow ? 'drop-shadow(0 0 5px rgba(245,158,11,0.85))' : undefined;

  switch (name) {
    case 'go':
    case 'castle':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={goldGrad} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id={gateGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M16 3 L28 11 L28 29 L4 29 L4 11 Z" fill="#0f172a" stroke={`url(#${goldGrad})`} strokeWidth="1.5" />
          <path d="M10 29 L10 18 Q16 13 22 18 L22 29 Z" fill={`url(#${gateGrad})`} stroke={`url(#${goldGrad})`} strokeWidth="1" />
          <circle cx="16" cy="10" r="3" fill="#f59e0b" />
          <path d="M14 22 L18 22 M16 20 L16 29" stroke="#fef08a" strokeWidth="1" />
          <path d="M4 11 L7 8 L10 11 L13 8 L16 11 L19 8 L22 11 L25 8 L28 11" stroke={`url(#${goldGrad})`} strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'tavern':
    case 'inn':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={beerGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          <rect x="8" y="11" width="13" height="17" rx="3" fill={`url(#${beerGrad})`} stroke="#fef08a" strokeWidth="1.5" />
          <path d="M21 14 C27 14 27 24 21 24" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M6 11 Q10 6 15 11 Q20 7 23 11" fill="#fff" stroke="#fef08a" strokeWidth="1.2" />
          <circle cx="11" cy="7" r="2.5" fill="#fff" />
          <circle cx="16" cy="6" r="3" fill="#fff" />
          <circle cx="20" cy="8" r="2" fill="#fff" />
        </svg>
      );

    case 'mine':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <path d="M7 25 L21 11 M11 25 L25 11" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M19 7 Q25 9 27 15 L24 16 L22 12 L18 10 Z" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1" />
          <path d="M13 7 Q7 9 5 15 L8 16 L10 12 L14 10 Z" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1" />
          <circle cx="16" cy="20" r="2" fill="#fde047" />
          <circle cx="19" cy="24" r="1.5" fill="#38bdf8" />
        </svg>
      );

    case 'tax':
    case 'gold':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={sackGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
          </defs>
          <path d="M10 13 C6 20 6 28 16 28 C26 28 26 20 22 13 Z" fill={`url(#${sackGrad})`} stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M10 13 Q16 11 22 13 L23 8 Q16 10 9 8 Z" fill="#991b1b" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="16" cy="13" r="2" fill="#fbbf24" />
          <circle cx="16" cy="21" r="4.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
          <path d="M16 18.5 L16 23.5 M14.5 19.5 L17.5 19.5" stroke="#78350f" strokeWidth="1" />
        </svg>
      );

    case 'teleport':
    case 'portal':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={portalGrad} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="13" fill={`url(#${portalGrad})`} stroke="#67e8f9" strokeWidth="1.5" />
          <path d="M16 4 A12 12 0 0 1 28 16 A8 8 0 0 1 20 24 A4 4 0 0 1 16 20" stroke="#f0fdf4" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 28 A12 12 0 0 1 4 16 A8 8 0 0 1 12 8 A4 4 0 0 1 16 12" stroke="#f0fdf4" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'event':
    case 'scroll':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 0 5px #a855f7)' }} fill="none" aria-hidden="true">
          <path d="M7 6 Q16 9 25 6 L23 26 Q16 23 5 26 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="1.2" />
          <path d="M6 6 C4 6 4 9 7 9 L25 9" stroke="#b45309" strokeWidth="1.5" fill="none" />
          <path d="M5 26 C3 26 3 23 6 23 L23 23" stroke="#b45309" strokeWidth="1.5" fill="none" />
          <line x1="9" y1="12" x2="21" y2="12" stroke="#78350f" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="9" y1="15" x2="19" y2="15" stroke="#78350f" strokeWidth="1" strokeDasharray="3,1" />
          <line x1="9" y1="18" x2="20" y2="18" stroke="#78350f" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx="19" cy="20" r="3.8" fill="#9333ea" stroke="#f3e8ff" strokeWidth="1" />
          <polygon points="19,17.5 21,21 17,21" fill="#f3e8ff" />
        </svg>
      );

    case 'blessing':
    case 'god':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 0 6px #eab308)' }} fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
          <polygon points="16,2 18,12 16,10 14,12" fill="#facc15" />
          <polygon points="16,30 18,20 16,22 14,20" fill="#facc15" />
          <polygon points="2,16 12,18 10,16 12,14" fill="#facc15" />
          <polygon points="30,16 20,18 22,16 20,14" fill="#facc15" />
          <polygon points="6,6 14,13 12,12 13,14" fill="#eab308" />
          <polygon points="26,6 18,13 20,12 19,14" fill="#eab308" />
          <polygon points="6,26 14,19 12,20 13,18" fill="#eab308" />
          <polygon points="26,26 18,19 20,20 19,18" fill="#eab308" />
        </svg>
      );

    case 'jail':
    case 'chains':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <rect x="5" y="5" width="22" height="22" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <line x1="10" y1="5" x2="10" y2="27" stroke="#94a3b8" strokeWidth="2" />
          <line x1="16" y1="5" x2="16" y2="27" stroke="#94a3b8" strokeWidth="2" />
          <line x1="22" y1="5" x2="22" y2="27" stroke="#94a3b8" strokeWidth="2" />
          <line x1="5" y1="16" x2="27" y2="16" stroke="#475569" strokeWidth="2" />
          <rect x="13" y="15" width="6" height="6" rx="1" fill="#d97706" stroke="#fef08a" strokeWidth="1" />
          <path d="M14 15 L14 13 Q16 10 18 13 L18 15" stroke="#fef08a" strokeWidth="1" fill="none" />
        </svg>
      );

    case 'relic':
    case 'crown':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 0 7px #f59e0b)' }} fill="none" aria-hidden="true">
          <path d="M5 24 L27 24 L29 11 L22 17 L16 7 L10 17 L3 11 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
          <rect x="5" y="24" width="22" height="3" fill="#b45309" stroke="#fef08a" strokeWidth="1" />
          <circle cx="16" cy="18" r="3.2" fill="#ef4444" stroke="#fef08a" strokeWidth="1" />
          <circle cx="9" cy="20" r="1.8" fill="#38bdf8" />
          <circle cx="23" cy="20" r="1.8" fill="#38bdf8" />
          <circle cx="16" cy="7" r="1.5" fill="#fef08a" />
          <circle cx="3" cy="11" r="1.5" fill="#fef08a" />
          <circle cx="29" cy="11" r="1.5" fill="#fef08a" />
        </svg>
      );

    case 'city':
    case 'waterdeep':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <path d="M12 9 L20 9 L20 28 L12 28 Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
          <path d="M4 14 L11 14 L11 28 L4 28 Z" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
          <path d="M21 14 L28 14 L28 28 L21 28 Z" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
          <polygon points="16,3 12,9 20,9" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="7.5,9 4,14 11,14" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="24.5,9 21,14 28,14" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
          <rect x="15" y="13" width="2" height="3" fill="#fde047" />
          <rect x="15" y="19" width="2" height="3" fill="#fde047" />
        </svg>
      );

    case 'dragon':
    case 'tiamat':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: 'drop-shadow(0 0 6px #dc2626)' }} fill="none" aria-hidden="true">
          <path d="M6 10 C10 4 20 4 24 10 C27 15 28 23 20 27 C16 29 11 27 7 24 C4 20 3 15 6 10 Z" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
          <path d="M22 8 L29 4 L26 11 Z" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
          <path d="M10 8 L3 4 L6 11 Z" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
          <circle cx="11" cy="15" r="2" fill="#fef08a" />
          <circle cx="19" cy="15" r="2" fill="#fef08a" />
          <polygon points="13,24 14,20 12,20" fill="#fff" />
          <polygon points="17,24 18,20 16,20" fill="#fff" />
        </svg>
      );

    case 'camp':
    case 'parking':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <polygon points="16,7 6,25 26,25" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
          <polygon points="16,7 13,25 19,25" fill="#064e3b" />
          <path d="M22 25 L28 25 M23 27 L27 23 M23 23 L27 27" stroke="#78350f" strokeWidth="1.5" />
          <path d="M25 25 Q24 21 25 19 Q26 21 25 25" fill="#f97316" />
        </svg>
      );

    case 'forest':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <rect x="14" y="22" width="4" height="7" fill="#78350f" />
          <polygon points="16,4 7,16 25,16" fill="#15803d" stroke="#4ade80" strokeWidth="1.2" />
          <polygon points="16,11 6,23 26,23" fill="#166534" stroke="#4ade80" strokeWidth="1.2" />
        </svg>
      );

    case 'skull':
    case 'dungeon':
      return (
        <svg viewBox="0 0 32 32" className={className} style={{ filter: glowFilter }} fill="none" aria-hidden="true">
          <path d="M8 15 C8 9 11 6 16 6 C21 6 24 9 24 15 C24 19 22 21 21 24 L11 24 C10 21 8 19 8 15 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
          <circle cx="12.5" cy="14" r="2.2" fill="#0f172a" />
          <circle cx="19.5" cy="14" r="2.2" fill="#0f172a" />
          <polygon points="16,17 15,19 17,19" fill="#0f172a" />
          <line x1="13" y1="23" x2="13" y2="25" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="16" y1="23" x2="16" y2="25" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="19" y1="23" x2="19" y2="25" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="12" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="4" fill="#f59e0b" />
        </svg>
      );
  }
}
