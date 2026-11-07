import type { ShellType } from '@shared/types'

export interface PaneData {
  id: string
  title: string
  shell: ShellType
  cwd?: string
  pid?: number
  workspaceId?: string
}

export type SplitDirection = 'horizontal' | 'vertical'

export interface LeafNode {
  type: 'leaf'
  paneId: string
}

export interface SplitNode {
  id?: string
  type: 'split'
  direction: SplitDirection
  children: [LayoutNode, LayoutNode]
  ratio: number // 0.1 to 0.9 (percentage size of first child, default 0.5)
}

export type LayoutNode = LeafNode | SplitNode

export interface TabData {
  id: string
  title: string
  type?: 'terminal' | 'editor'
  filePath?: string
  rootNode: LayoutNode
  activePaneId: string
  workspaceId?: string
  workspaceName?: string
  workspaceColor?: string
  workspacePath?: string
}

export function collectPaneIds(node: LayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.children[0]), ...collectPaneIds(node.children[1])]
}
