import React from 'react'
import {
  Terminal,
  Shield,
  Cpu,
  Sparkles,
  Flame,
  Bot,
  Ghost,
  Radio,
  Hash,
  Laptop
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface OperatorProfile {
  name: string
  handle: string
  role: string
  avatarType: 'preset' | 'custom-url' | 'local-image'
  avatarValue: string
  statusText: string
  statusEmoji: string
  shell: string
  joinedDate: string
}

export const PRESET_AVATARS: Record<
  string,
  { name: string; icon: React.ReactNode; bg: string; border: string; color: string }
> = {
  terminal: {
    name: 'Terminal Core',
    icon: <Terminal className="w-8 h-8" />,
    bg: 'rgba(0, 210, 211, 0.15)',
    border: 'rgba(0, 210, 211, 0.4)',
    color: '#00d2d3',
  },
  cyber: {
    name: 'Cyber Daemon',
    icon: <Cpu className="w-8 h-8" />,
    bg: 'rgba(237, 187, 0, 0.15)',
    border: 'rgba(237, 187, 0, 0.4)',
    color: '#edbb00',
  },
  bot: {
    name: 'Autonomous Agent',
    icon: <Bot className="w-8 h-8" />,
    bg: 'rgba(189, 147, 249, 0.15)',
    border: 'rgba(189, 147, 249, 0.4)',
    color: '#bd93f9',
  },
  ghost: {
    name: 'Phantom Node',
    icon: <Ghost className="w-8 h-8" />,
    bg: 'rgba(243, 139, 168, 0.15)',
    border: 'rgba(243, 139, 168, 0.4)',
    color: '#f38ba8',
  },
  shield: {
    name: 'Kernel Guard',
    icon: <Shield className="w-8 h-8" />,
    bg: 'rgba(80, 250, 123, 0.15)',
    border: 'rgba(80, 250, 123, 0.4)',
    color: '#50fa7b',
  },
  flame: {
    name: 'Velocity Core',
    icon: <Flame className="w-8 h-8" />,
    bg: 'rgba(255, 107, 107, 0.15)',
    border: 'rgba(255, 107, 107, 0.4)',
    color: '#ff6b6b',
  },
}

interface OperatorCardProps {
  profile: OperatorProfile
}

export const OperatorCard: React.FC<OperatorCardProps> = ({ profile }) => {
  const { theme } = useTheme()

  const preset = PRESET_AVATARS[profile.avatarValue] || PRESET_AVATARS.terminal

  return (
    <div
      className="relative rounded-2xl p-6 border overflow-hidden select-none transition-all duration-300 shadow-2xl font-mono"
      style={{
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.borderActive,
        boxShadow: `0 0 30px ${theme.ui.borderActive}25`,
      }}
    >
      {/* Background Decorative Tech Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, #ffffff 1px, transparent 1px), radial-gradient(circle at 90% 80%, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Holographic Strip */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-neutral-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse-subtle" />
            <span className="font-bold tracking-wider">OPERATOR ID</span>
          </div>
          <span className="text-[10px] text-neutral-500">SEC-NODE // 01</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
          <Hash className="w-3 h-3" />
          <span>{profile.handle}</span>
        </div>
      </div>

      {/* Main Avatar & Identity Info */}
      <div className="flex items-center gap-5 relative z-10">
        {/* Glowing Avatar Frame */}
        <div className="relative group shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border shadow-xl transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor:
                profile.avatarType === 'preset'
                  ? preset.bg
                  : '#070b19',
              borderColor:
                profile.avatarType === 'preset'
                  ? preset.border
                  : theme.ui.borderActive,
              color:
                profile.avatarType === 'preset'
                  ? preset.color
                  : theme.ui.accent,
            }}
          >
            {profile.avatarType === 'preset' && preset.icon}

            {(profile.avatarType === 'custom-url' || profile.avatarType === 'local-image') &&
              profile.avatarValue && (
                <img
                  src={profile.avatarValue}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to preset if image fails to load
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              )}
          </div>

          {/* Active status pulse pill on avatar corner */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#070b19] border border-white/20">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse-subtle" />
          </div>
        </div>

        {/* Name, Handle, Role */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black tracking-tight text-white truncate">
              {profile.name}
            </h3>
            <span
              className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border shrink-0"
              style={{
                backgroundColor: `${theme.ui.accent}20`,
                borderColor: `${theme.ui.accent}40`,
                color: theme.ui.accent,
              }}
            >
              ACTIVE
            </span>
          </div>

          <span className="text-xs text-neutral-400 font-medium truncate mt-0.5">
            {profile.role}
          </span>

          {/* Custom Status Tagline */}
          <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[11px] text-neutral-300 w-fit">
            <span>{profile.statusEmoji}</span>
            <span className="truncate max-w-[260px] italic opacity-90">
              "{profile.statusText}"
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Technical Spec Badges */}
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-[11px] relative z-10">
        <div className="flex flex-col p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] text-neutral-500 uppercase">Shell Node</span>
          <span className="font-bold text-neutral-200 uppercase truncate">
            {profile.shell}
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] text-neutral-500 uppercase">Environment</span>
          <span className="font-bold text-neutral-200 truncate">
            Win11 ConPTY
          </span>
        </div>

        <div className="flex flex-col p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] text-neutral-500 uppercase">Status</span>
          <span className="font-bold text-emerald-400 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            OPERATIONAL
          </span>
        </div>
      </div>
    </div>
  )
}
