import React, { useState, useEffect, useRef } from 'react'
import {
  OperatorCard,
  PRESET_AVATARS,
  type OperatorProfile
} from './OperatorCard'
import {
  Upload,
  Link,
  Sparkles,
  Smile,
  Terminal,
  Check,
  RefreshCw,
  FolderOpen,
  UserCheck,
  Globe
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

export const PROFILE_STORAGE_KEY = 'ferminterm_operator_profile'

export const DEFAULT_PROFILE: OperatorProfile = {
  name: 'Developer',
  handle: 'dev_operator',
  role: 'Systems Architect',
  avatarType: 'preset',
  avatarValue: 'terminal',
  statusText: 'Compiling reality with zero bloat',
  statusEmoji: '⚡',
  shell: 'powershell',
  joinedDate: 'Nov 2026',
}

export function getStoredProfile(): OperatorProfile {
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (saved) {
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(saved) }
    } catch {}
  }
  return DEFAULT_PROFILE
}

export interface ProfileSettingsProps {
  profile?: OperatorProfile
  onChange?: React.Dispatch<React.SetStateAction<OperatorProfile>>
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile: controlledProfile,
  onChange: setControlledProfile,
}) => {
  const { theme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile State (Controlled by parent or fallback internal)
  const [internalProfile, setInternalProfile] = useState<OperatorProfile>(getStoredProfile)
  const profile = controlledProfile ?? internalProfile
  const setProfile = setControlledProfile ?? setInternalProfile
  // Preset emojis for quick status selection
  const statusEmojiPresets = ['⚡', '☕', '🔥', '🛡️', '💻', '🚀', '👾', '🧠', '🌌', '⚙️']

  // Handle local image upload via FileReader (base64)
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        setProfile((prev) => ({
          ...prev,
          avatarType: 'local-image',
          avatarValue: base64,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  // Pre-set roles for quick selection
  const roleSuggestions = [
    'Systems Architect',
    'Fullstack Engineer',
    'Data Scientist',
    'Kernel Hacker',
    'Open Source Maintainer',
    'DevOps Engineer',
  ]

  return (
    <div className="space-y-8 max-w-3xl pb-6 font-mono text-xs">
      {/* 1. TOP LIVE HOLOGRAPHIC ID BADGE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Live Operator ID Badge
          </span>
          <span className="text-[10px] text-neutral-500">
            Realtime Interactive Preview
          </span>
        </div>

        <OperatorCard profile={profile} />
      </div>

      {/* 2. AVATAR ARSENAL (PRESET, LOCAL UPLOAD, OR URL) */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <span>🎭</span>
            <span>Avatar Customization</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Select an avatar preset, upload a local image file, or provide an image URL.
          </span>
        </div>

        {/* Preset Cyber/Tech Icons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {Object.keys(PRESET_AVATARS).map((key) => {
            const item = PRESET_AVATARS[key]
            const isSelected = profile.avatarType === 'preset' && profile.avatarValue === key

            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setProfile((prev) => ({
                    ...prev,
                    avatarType: 'preset',
                    avatarValue: key,
                  }))
                }
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer ${
                  isSelected
                    ? 'ring-2 scale-105 shadow-lg'
                    : 'hover:bg-white/[0.04] opacity-75 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isSelected ? item.bg : 'transparent',
                  borderColor: isSelected ? item.color : 'rgba(255,255,255,0.08)',
                  color: item.color,
                }}
              >
                <div className="group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-neutral-300 truncate max-w-full">
                  {item.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Local Image Upload & URL input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Local Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLocalImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-2.5 rounded-xl border border-dashed border-white/20 hover:border-amber-400 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-center gap-2 transition-all cursor-pointer text-neutral-300 hover:text-white"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Local Image File...</span>
            </button>
          </div>

          {/* Image URL Input */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus-within:border-cyan-400">
            <Link className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Or enter external image URL..."
              value={profile.avatarType === 'custom-url' ? profile.avatarValue : ''}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  avatarType: 'custom-url',
                  avatarValue: e.target.value,
                }))
              }
              className="w-full bg-transparent text-xs font-mono focus:outline-none placeholder:text-neutral-500 text-neutral-200"
            />
          </div>
        </div>
      </div>

      {/* 3. CREDENTIALS & IDENTITY */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <span className="text-xs font-bold text-white flex items-center gap-2">
          <span>🆔</span>
          <span>Operator Credentials</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1.5">
              Handle Tag
            </label>
            <input
              type="text"
              value={profile.handle}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, handle: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-xs text-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Role with Quick Suggestions */}
        <div>
          <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1.5">
            Role / Specialization
          </label>
          <input
            type="text"
            value={profile.role}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, role: e.target.value }))
            }
            className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-xs text-white focus:outline-none transition-colors mb-2"
          />

          <div className="flex flex-wrap gap-1.5">
            {roleSuggestions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setProfile((prev) => ({ ...prev, role: r }))}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                  profile.role === r
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LANGUAGE SELECTION (PILIHAN BAHASA) */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{t.profile.languagePreference}</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            {t.profile.languageDesc}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* English Option */}
          <div
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              language === 'en'
                ? 'border-cyan-400 bg-cyan-500/10 shadow-lg'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-white">{t.profile.english}</span>
                <span className="text-[10px] text-neutral-400">Default International</span>
              </div>
            </div>
            {language === 'en' && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
          </div>

          {/* Indonesian Option */}
          <div
            onClick={() => setLanguage('id')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              language === 'id'
                ? 'border-amber-400 bg-amber-500/10 shadow-lg'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇩</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-white">{t.profile.indonesian}</span>
                <span className="text-[10px] text-neutral-400">Bahasa Resmi Indonesia</span>
              </div>
            </div>
            {language === 'id' && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
          </div>
        </div>
      </div>
    </div>
  )
}
