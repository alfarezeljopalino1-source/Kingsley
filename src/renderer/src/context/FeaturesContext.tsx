import React, { createContext, useContext, useEffect, useState } from 'react'

export interface FeatureFlags {
  browser: boolean
  graphify: boolean
  mcpSkills: boolean
  playwrightBrowser: boolean
  agentOrchestration: boolean
  gsdSync: boolean
  aiMemory: boolean
  openPrs: boolean
  browserPreview: boolean
  gitDiff: boolean
  workspaceManager: boolean
  commandPalette: boolean
  autoFit: boolean
  statusPulse: boolean
  onboardingTour: boolean
}

export interface FeatureItem {
  id: keyof FeatureFlags
  title: string
  description: string
  icon: string
  category: 'Workspace' | 'Terminal' | 'System'
}

export const FEATURE_DEFINITIONS: FeatureItem[] = [
  {
    id: 'browser',
    title: 'Browser',
    description: 'Open websites inside the workspace as browser panes.',
    icon: 'browser',
    category: 'Workspace',
  },
  {
    id: 'graphify',
    title: 'Graphify',
    description: 'Visualize the code graph inside the workspace.',
    icon: 'graphify',
    category: 'Workspace',
  },
  {
    id: 'mcpSkills',
    title: 'MCP & Skills',
    description: 'Inspect and manage the MCP servers and skills of every coding agent from one panel.',
    icon: 'mcp',
    category: 'System',
  },
  {
    id: 'playwrightBrowser',
    title: 'Playwright browser',
    description: 'Points the Playwright MCP server at a browser — shared with Alethe or a dedicated one of its own, picked below.',
    icon: 'playwright',
    category: 'Workspace',
  },
  {
    id: 'agentOrchestration',
    title: 'Agent orchestration',
    description: 'Gives Claude Code a set of Alethe tools for handing work to Codex workers that run in parallel. Alethe owns the sandbox, the concurrency limit and the workers themselves, and can steer or cancel one mid-run.',
    icon: 'orchestration',
    category: 'System',
  },
  {
    id: 'gsdSync',
    title: 'GSD Sync',
    description: 'Tracks the isolated child sessions OpenCode runs while planning, and shows their activity live. Only appears in projects with an OpenCode terminal.',
    icon: 'gsd',
    category: 'Terminal',
  },
  {
    id: 'aiMemory',
    title: 'AI Memory',
    description: 'Long-term memory shared across Claude Code, Codex and OpenCode. Requires the ai-memory server installed.',
    icon: 'memory',
    category: 'System',
  },
  {
    id: 'openPrs',
    title: 'Open PRs',
    description: 'Shows GitHub pull requests you are involved in as author or reviewer, across every repo, with a one-click way to send one to your TODO list.',
    icon: 'prs',
    category: 'Workspace',
  },
]

interface FeaturesContextType {
  features: FeatureFlags
  toggleFeature: (key: keyof FeatureFlags) => void
  setFeature: (key: keyof FeatureFlags, enabled: boolean) => void
  resetDefaults: () => void
  setAllFeatures: (features: FeatureFlags) => void
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined)

const FEATURES_STORAGE_KEY = 'ferminterm_features'

const DEFAULT_FEATURES: FeatureFlags = {
  browser: true,
  graphify: true,
  mcpSkills: true,
  playwrightBrowser: false,
  agentOrchestration: true,
  gsdSync: false,
  aiMemory: true,
  openPrs: true,
  browserPreview: true,
  gitDiff: true,
  workspaceManager: true,
  commandPalette: true,
  autoFit: true,
  statusPulse: true,
  onboardingTour: true,
}

export const FeaturesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(() => {
    const saved = localStorage.getItem(FEATURES_STORAGE_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_FEATURES, ...JSON.parse(saved) }
      } catch {}
    }
    return DEFAULT_FEATURES
  })

  useEffect(() => {
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features))
  }, [features])

  const toggleFeature = (key: keyof FeatureFlags) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const setFeature = (key: keyof FeatureFlags, enabled: boolean) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: enabled,
    }))
  }

  const resetDefaults = () => {
    setFeatures(DEFAULT_FEATURES)
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(DEFAULT_FEATURES))
  }

  const setAllFeatures = (newFeatures: FeatureFlags) => {
    setFeatures(newFeatures)
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(newFeatures))
  }

  return (
    <FeaturesContext.Provider value={{ features, toggleFeature, setFeature, resetDefaults, setAllFeatures }}>
      {children}
    </FeaturesContext.Provider>
  )
}

export const useFeatures = (): FeaturesContextType => {
  const context = useContext(FeaturesContext)
  if (!context) {
    throw new Error('useFeatures must be used within a FeaturesProvider')
  }
  return context
}
