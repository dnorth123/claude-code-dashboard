export interface TokenUsage {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

export interface Session {
  sessionId: string
  projectId: string
  startTime: string
  endTime: string
  durationMinutes: number
  messageCount: number
  model: string
  gitBranch: string | null
  tokens: TokenUsage
  estimatedCostCents: number
  firstPrompt: string | null
}

export interface Project {
  id: string
  name: string
  status: string
  stack: string | null
  productionUrl: string | null
  whereILeftOff: string | null
  currentStateSummary: string | null
  openQuestions: string | null
  lastSessionDate: string | null
  sessionCount: number
  totalTokens: number
  estimatedCostCents: number
}

export interface DayActivity {
  date: string
  sessionCount: number
  totalMinutes: number
  projects: string[]
  promptCount: number
}

export interface BacklogItem {
  text: string
  done: boolean
}

export interface BacklogSection {
  projectId: string
  section: string
  sectionStatus: string | null
  items: BacklogItem[]
}

export interface DashboardMeta {
  refreshedAt: string
  dataSpanDays: number
  firstSessionDate: string
  lastSessionDate: string
  totalSessions: number
  totalProjects: number
  warnings: {
    skippedFiles: string[]
    parseErrors: number
    historyMatchRate: string
  }
}

export type TabId = 'activity' | 'projects' | 'backlogs' | 'usage'
