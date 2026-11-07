import React from 'react'
import { useTheme } from '../../context/ThemeContext'

export interface ResizeHandleProps {
  direction?: 'vertical' | 'horizontal'
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick?: () => void
  title?: string
  className?: string
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction = 'vertical',
  isDragging,
  onMouseDown,
  onDoubleClick,
  title,
  className = '',
}) => {
  const { theme } = useTheme()
  const isVertical = direction === 'vertical'
  const activeColor = theme.ui.borderActive || '#00d2d3'

  return (
    <>
      <div
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        title={title}
        role="separator"
        aria-orientation={isVertical ? 'vertical' : 'horizontal'}
        className={`relative z-40 group flex items-center justify-center select-none shrink-0 transition-all ${
          isVertical
            ? 'w-3 h-full cursor-col-resize -mx-1.5'
            : 'h-3 w-full cursor-row-resize -my-1.5'
        } ${isDragging ? 'z-50' : ''} ${className}`}
      >
        {/* Hairline 1px border track */}
        <div
          className={`transition-all duration-150 relative flex items-center justify-center ${
            isVertical ? 'w-[1px] h-full' : 'h-[1px] w-full'
          } ${
            isDragging
              ? 'opacity-100 shadow-[0_0_10px_rgba(0,210,211,0.85)]'
              : 'opacity-35 group-hover:opacity-100 group-hover:shadow-[0_0_8px_rgba(0,210,211,0.6)]'
          }`}
          style={{
            backgroundColor: activeColor,
          }}
        >
          {/* Subtle micro grip pill for visual affordance */}
          <div
            className={`absolute rounded-full transition-all duration-150 ${
              isVertical ? 'w-1.5 h-8' : 'h-1.5 w-8'
            } ${
              isDragging
                ? 'opacity-100 scale-100 shadow-[0_0_12px_rgba(0,210,211,1)]'
                : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75'
            }`}
            style={{
              backgroundColor: activeColor,
            }}
          />
        </div>
      </div>

      {/* Global transparent drag shield to block xterm & iframes from capturing mouse events */}
      {isDragging && (
        <div
          className={`fixed inset-0 z-[99999] select-none ${
            isVertical ? 'cursor-col-resize' : 'cursor-row-resize'
          }`}
          style={{ cursor: isVertical ? 'col-resize' : 'row-resize' }}
        />
      )}
    </>
  )
}
