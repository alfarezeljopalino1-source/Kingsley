import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { LayoutNode, LeafNode, SplitNode, PaneData, SplitDirection } from '../../types/layout'
import { TerminalPane } from '../terminal/TerminalPane'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { useTheme } from '../../context/ThemeContext'
import { ResizeHandle } from './ResizeHandle'
import type { ShellType } from '@shared/types'
interface SplitLayoutProps {
  node: LayoutNode
  panes: Map<string, PaneData>
  activePaneId: string
  totalPanesCount: number
  onFocus: (paneId: string) => void
  onSplit: (targetPaneId: string, direction: SplitDirection) => void
  onClose: (paneId: string) => void
  onChangeShell: (paneId: string, shell: ShellType) => void
  onUpdateRatio: (splitNode: LayoutNode | string, newRatio: number) => void
}

interface SplitLeafProps extends Omit<SplitLayoutProps, 'node'> {
  node: LeafNode
}

interface SplitBranchProps extends Omit<SplitLayoutProps, 'node'> {
  node: SplitNode
}

// 1. Leaf Node Component: renders single terminal pane with boundary
const SplitLeaf: React.FC<SplitLeafProps> = ({
  node,
  panes,
  activePaneId,
  totalPanesCount,
  onFocus,
  onSplit,
  onClose,
  onChangeShell,
}) => {
  const paneData = panes.get(node.paneId)
  if (!paneData) return null

  const folderName = paneData.cwd
    ? paneData.cwd.replace(/\\/g, '/').split('/').filter(Boolean).pop()
    : undefined
  const displayTitle = folderName || paneData.title || 'terminal'

  return (
    <div className="h-full w-full overflow-hidden">
      <ErrorBoundary fallbackTitle={`Terminal [${paneData.shell.toUpperCase()}]`}>
        <TerminalPane
          key={node.paneId}
          paneId={node.paneId}
          shell={paneData.shell}
          title={displayTitle}
          cwd={paneData.cwd}
          isFocused={node.paneId === activePaneId}
          canClose={totalPanesCount > 1}
          onFocus={() => onFocus(node.paneId)}
          onSplit={(direction) => onSplit(node.paneId, direction)}
          onClose={() => onClose(node.paneId)}
          onChangeShell={(shell) => onChangeShell(node.paneId, shell)}
        />
      </ErrorBoundary>
    </div>
  )
}

// 2. Branch Node Component: handles binary split layout and drag resize
const SplitBranch: React.FC<SplitBranchProps> = ({
  node,
  panes,
  activePaneId,
  totalPanesCount,
  onFocus,
  onSplit,
  onClose,
  onChangeShell,
  onUpdateRatio,
}) => {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRef = useRef(node)
  nodeRef.current = node
  const [isDragging, setIsDragging] = useState(false)
  const [dragRatio, setDragRatio] = useState<number | null>(null)

  const isHorizontal = node.direction === 'horizontal' // top / bottom
  const baseRatio = Math.max(0.15, Math.min(0.85, node.ratio || 0.5))
  const currentRatio = dragRatio !== null ? dragRatio : baseRatio

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    const startRatio = baseRatio
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const totalSize = isHorizontal ? rect.height : rect.width
    if (totalSize <= 0) return

    let latestRatio = startRatio

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = isHorizontal
        ? moveEvent.clientY - startY
        : moveEvent.clientX - startX

      const deltaRatio = delta / totalSize
      latestRatio = Math.max(0.15, Math.min(0.85, startRatio + deltaRatio))
      setDragRatio(latestRatio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragRatio(null)
      onUpdateRatio(nodeRef.current, latestRatio)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [baseRatio, isHorizontal, onUpdateRatio])
  return (
    <div
      ref={containerRef}
      className={`h-full w-full flex overflow-hidden ${
        isHorizontal ? 'flex-col' : 'flex-row'
      } ${isDragging ? 'select-none cursor-' + (isHorizontal ? 'row-resize' : 'col-resize') : ''}`}
    >
      {/* First Child */}
      <div
        style={{
          flex: `${currentRatio} ${currentRatio} 0px`,
          overflow: 'hidden',
        }}
      >
        <SplitLayout
          node={node.children[0]}
          panes={panes}
          activePaneId={activePaneId}
          totalPanesCount={totalPanesCount}
          onFocus={onFocus}
          onSplit={onSplit}
          onClose={onClose}
          onChangeShell={onChangeShell}
          onUpdateRatio={onUpdateRatio}
        />
      </div>

      {/* Draggable Divider Handle */}
      <ResizeHandle
        direction={isHorizontal ? 'horizontal' : 'vertical'}
        isDragging={isDragging}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          setDragRatio(null)
          onUpdateRatio(nodeRef.current, 0.5)
        }}
        title={
          isHorizontal
            ? 'Tarik atas / bawah untuk ubah ukuran terminal (Klik 2x reset 50:50)'
            : 'Tarik kiri / kanan untuk ubah ukuran terminal (Klik 2x reset 50:50)'
        }
      />
      {/* Second Child */}
      <div
        style={{
          flex: `${1 - currentRatio} ${1 - currentRatio} 0px`,
          overflow: 'hidden',
        }}
      >
        <SplitLayout
          node={node.children[1]}
          panes={panes}
          activePaneId={activePaneId}
          totalPanesCount={totalPanesCount}
          onFocus={onFocus}
          onSplit={onSplit}
          onClose={onClose}
          onChangeShell={onChangeShell}
          onUpdateRatio={onUpdateRatio}
        />
      </div>
    </div>
  )
}

// 3. Main Root Router: strictly separates Leaf and Branch to preserve Hook order
export const SplitLayout: React.FC<SplitLayoutProps> = (props) => {
  if (props.node.type === 'leaf') {
    return <SplitLeaf {...props} node={props.node} />
  }
  return <SplitBranch {...props} node={props.node} />
}
