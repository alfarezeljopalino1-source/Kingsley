import React from 'react'
import { APP_LOGO_BASE64 } from '../../assets/logoBase64'

export type AppIconId =
  | 'fermin-barca'
  | 'neon-cybertech'
  | 'cyber-bolt'
  | 'matrix-core'
  | 'velvet-gold'
  | 'nordic-frost'
  | 'synthwave'
  | 'pure-carbon'

export interface AppIconOption {
  id: AppIconId
  name: string
  subtitle: string
  bg: string
  accent: string
  isOfficial?: boolean
}

export const APP_ICONS: Record<AppIconId, AppIconOption> = {
  'fermin-barca': {
    id: 'fermin-barca',
    name: 'Fermín Barça Anime',
    subtitle: 'FC Barcelona Edition • Cel-Shaded',
    bg: '#070a16',
    accent: '#00d2d3',
    isOfficial: true,
  },
  'neon-cybertech': {
    id: 'neon-cybertech',
    name: 'Neon Cybertech',
    subtitle: 'Monolith Quantum • Cyan Glow',
    bg: '#070b19',
    accent: '#00d2d3',
  },
  'cyber-bolt': {
    id: 'cyber-bolt',
    name: 'Cyber Bolt',
    subtitle: 'Stealth Obsidian & Cyan',
    bg: '#0c0e12',
    accent: '#00d2d3',
  },
  'matrix-core': {
    id: 'matrix-core',
    name: 'Matrix Core',
    subtitle: 'Phosphor Hacker Green',
    bg: '#040a05',
    accent: '#00ff41',
  },
  'velvet-gold': {
    id: 'velvet-gold',
    name: 'Velvet Gold',
    subtitle: 'Midnight Navy & Warm Gold',
    bg: '#070b19',
    accent: '#edbb00',
  },
  'nordic-frost': {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    subtitle: 'Glacier Blue & Arctic Ice',
    bg: '#1a222d',
    accent: '#88c0d0',
  },
  synthwave: {
    id: 'synthwave',
    name: "Synthwave '84",
    subtitle: 'Neon Magenta & Sunset Glow',
    bg: '#20152d',
    accent: '#ff7edb',
  },
  'pure-carbon': {
    id: 'pure-carbon',
    name: 'Pure Carbon',
    subtitle: 'Minimalist Monochrome Mono',
    bg: '#080808',
    accent: '#ffffff',
  },
}

interface AppIconBadgeProps {
  id: AppIconId
  size?: number // width/height in px, default 48
  className?: string
}

export const AppIconBadge: React.FC<AppIconBadgeProps> = ({ id, size = 48, className = '' }) => {
  const icon = APP_ICONS[id] || APP_ICONS['neon-cybertech']

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-xl shrink-0 flex items-center justify-center select-none transition-transform duration-200 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: icon.bg,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `0 4px 14px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)`,
      }}
    >
      {/* 1. Official Fermin Barça Anime Edition */}
      {(id === 'fermin-barca' || id === 'neon-cybertech') && (
        <img
          src={APP_LOGO_BASE64}
          alt="FerminTerm Official Icon"
          className="w-full h-full object-cover rounded-xl"
        />
      )}

      {/* 2. Cyber Bolt */}
      {id === 'cyber-bolt' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <circle cx="24" cy="24" r="16" fill="url(#bolt-glow)" opacity="0.3" />
          <path
            d="M26 8L14 26H24L20 40L34 22H24L26 8Z"
            fill="url(#bolt-grad)"
            stroke="#00d2d3"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <defs>
            <radialGradient id="bolt-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d2d3" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="bolt-grad" x1="14" y1="8" x2="34" y2="40">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#00d2d3" />
              <stop offset="100%" stopColor="#0984e3" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 3. Matrix Core */}
      {id === 'matrix-core' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <path
            d="M12 14L22 24L12 34"
            stroke="#00ff41"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="25" y="27" width="11" height="6" rx="1.5" fill="#00ff41" />
          <circle cx="36" cy="14" r="2.5" fill="#00ff41" opacity="0.8" />
        </svg>
      )}

      {/* 4. Velvet Gold */}
      {id === 'velvet-gold' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <path
            d="M27 6L13 25H25L21 42L35 23H23L27 6Z"
            fill="url(#gold-grad)"
            stroke="#ffd043"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gold-grad" x1="13" y1="6" x2="35" y2="42">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="45%" stopColor="#edbb00" />
              <stop offset="100%" stopColor="#b38600" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 5. Nordic Frost */}
      {id === 'nordic-frost' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <path
            d="M14 16L22 24L14 32"
            stroke="#88c0d0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 16L32 24L24 32"
            stroke="#eceff4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <line x1="28" y1="36" x2="36" y2="36" stroke="#88c0d0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {/* 6. Synthwave '84 */}
      {id === 'synthwave' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <path
            d="M27 7L13 26H25L21 41L35 22H23L27 7Z"
            fill="url(#synth-grad)"
            stroke="#ff7edb"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="synth-grad" x1="13" y1="7" x2="35" y2="41">
              <stop offset="0%" stopColor="#03edf9" />
              <stop offset="50%" stopColor="#ff7edb" />
              <stop offset="100%" stopColor="#fe4450" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 7. Pure Carbon */}
      {id === 'pure-carbon' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-2.5"
        >
          <path
            d="M13 15L23 24L13 33"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="26"
            y1="33"
            x2="35"
            y2="33"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
}
