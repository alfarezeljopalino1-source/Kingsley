import React from 'react'
import { Check } from 'lucide-react'
import {
  AppIconBadge,
  APP_ICONS,
  type AppIconId
} from '../icons/AppIconBadge'
import { useTheme } from '../../context/ThemeContext'

const APP_ICON_STORAGE_KEY = 'ferminterm_app_icon'

export const AppIconPicker: React.FC = () => {
  const { theme } = useTheme()
  const [selectedIcon, setSelectedIcon] = React.useState<AppIconId>(() => {
    const saved = localStorage.getItem(APP_ICON_STORAGE_KEY) as AppIconId | null
    if (saved && APP_ICONS[saved]) {
      return saved
    }
    return 'fermin-barca'
  })

  const handleSelectIcon = (id: AppIconId) => {
    setSelectedIcon(id)
    localStorage.setItem(APP_ICON_STORAGE_KEY, id)
    // Dispatch custom event so TitleBar / Header can react immediately
    window.dispatchEvent(new CustomEvent('ferminterm:icon-changed', { detail: id }))
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 font-mono text-xs">
      <div>
        <h3 className="text-sm font-bold text-white mb-0.5">App icon</h3>
        <p className="text-xs text-neutral-400">
          Icon shown in the taskbar, window titlebar, and identity cards, independent from the interface theme.
        </p>
      </div>

      {/* Grid of Icon Cards (Alethe Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {(Object.keys(APP_ICONS) as AppIconId[]).map((id) => {
          const item = APP_ICONS[id]
          const isSelected = selectedIcon === id

          return (
            <div
              key={id}
              onClick={() => handleSelectIcon(id)}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-between gap-3 cursor-pointer transition-all duration-150 relative ${
                isSelected
                  ? 'bg-white/10 ring-2 shadow-xl scale-[1.02]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 opacity-75 hover:opacity-100 hover:border-white/20'
              }`}
              style={{
                borderColor: isSelected ? theme.ui.borderActive : undefined,
                boxShadow: isSelected ? `0 0 16px ${theme.ui.borderActive}35` : undefined,
              }}
            >
              {/* Checkmark indicator at top-right */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-black shadow-sm"
                  style={{ backgroundColor: theme.ui.accent }}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Scalable Vector Icon Badge */}
              <AppIconBadge id={id} size={50} />

              {/* Label */}
              <div className="text-center w-full">
                <span
                  className="font-bold text-xs truncate block"
                  style={{ color: isSelected ? theme.ui.accent : 'white' }}
                >
                  {item.name}
                </span>
                <span className="text-[10px] text-neutral-400 truncate block opacity-70">
                  {item.subtitle.split('&')[0]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
