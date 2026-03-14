import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'
import { createReadStream } from 'node:fs'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface TokenUsage {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

interface RawSession {
  sessionId: string
  projectDirName: string
  projectName: string
  startTime: number
  endTime: number
  messageCount: number
  model: string
  gitBranch: string | null
  tokens: TokenUsage
  firstPrompt: string | null
}

interface Project {
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

interface HistoryEntry {
  display: string
  timestamp: number
  project: string
}

interface BacklogItem {
  text: string
  done: boolean
}

interface BacklogSection {
  projectId: string
  section: string
  sectionStatus: string | null
  items: BacklogItem[]
}

// ──────────────────────────────────────────────
// Cost Calculation
// ──────────────────────────────────────────────

interface TokenPricing {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

const MODEL_PRICING: Record<string, TokenPricing> = {
  'claude-opus-4-6': { input: 15, output: 75, cacheCreation: 18.75, cacheRead: 1.875 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheCreation: 3.75, cacheRead: 0.375 },
  'claude-haiku-4-5': { input: 0.80, output: 4, cacheCreation: 1, cacheRead: 0.08 },
}

function getPricing(model: string): TokenPricing {
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing
  }
  return MODEL_PRICING['claude-opus-4-6']
}

function calculateCost(tokens: TokenUsage, model: string): number {
  const pricing = getPricing(model)
  const costDollars =
    (tokens.input * pricing.input +
      tokens.output * pricing.output +
      tokens.cacheCreation * pricing.cacheCreation +
      tokens.cacheRead * pricing.cacheRead) /
    1_000_000
  return Math.round(costDollars * 100)
}

// ──────────────────────────────────────────────
// Diagnostics
// ──────────────────────────────────────────────

const diagnostics: { skippedFiles: string[]; parseErrors: number; unknownModels: Set<string> } = {
  skippedFiles: [],
  parseErrors: 0,
  unknownModels: new Set(),
}

function logWarning(msg: string) {
  console.warn(`  ⚠ ${msg}`)
}

// ──────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────

const HOME = process.env.HOME!
const CLAUDE_DIR = path.join(HOME, '.claude')
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects')
const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')
const GLOBAL_CLAUDE_MD = path.join(CLAUDE_DIR, 'CLAUDE.md')

const ICLOUD_PROJECTS = path.join(
  HOME,
  'Library/Mobile Documents/com~apple~CloudDocs/Projects/All-Claude-Code-Projects/Coding-Projects'
)

const OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  '../src/data'
)

const SKIP_TYPES = new Set(['progress', 'file-history-snapshot', 'queue-operation'])

// ──────────────────────────────────────────────
// Phase 1: Scan per-project JSONL dirs
// ──────────────────────────────────────────────

function extractProjectName(dirName: string): string {
  // Dir name is like: -Users-dnorthington-...-life-os
  // We want: life-os
  const parts = dirName.split('-')
  const lastParts: string[] = []
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].length === 0) continue
    if (parts[i] === parts[i].toLowerCase() && !/^\d+$/.test(parts[i])) {
      lastParts.unshift(parts[i])
    } else {
      break
    }
  }
  return lastParts.join('-') || dirName
}


async function scanJsonlFile(filePath: string, projectDirName: string): Promise<RawSession[]> {
  const sessions = new Map<string, RawSession>()
  const projectName = extractProjectName(projectDirName)

  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  })

  let lineNum = 0
  for await (const line of rl) {
    lineNum++
    if (!line.trim()) continue

    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      diagnostics.parseErrors++
      if (diagnostics.parseErrors <= 5) {
        logWarning(`Malformed JSON at ${path.basename(filePath)}:${lineNum}`)
      }
      continue
    }

    const entryType = entry.type as string | undefined
    if (entryType && SKIP_TYPES.has(entryType)) continue

    const sessionId = entry.sessionId as string | undefined
    if (!sessionId) continue

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        sessionId,
        projectDirName,
        projectName,
        startTime: Infinity,
        endTime: 0,
        messageCount: 0,
        model: 'unknown',
        gitBranch: (entry.gitBranch as string) || null,
        tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
        firstPrompt: null,
      })
    }

    const session = sessions.get(sessionId)!

    const rawTs = entry.timestamp
    let timestamp: number | undefined
    if (typeof rawTs === 'number') {
      timestamp = rawTs
    } else if (typeof rawTs === 'string') {
      const parsed = new Date(rawTs).getTime()
      if (!isNaN(parsed)) timestamp = parsed
    }
    if (timestamp) {
      session.startTime = Math.min(session.startTime, timestamp)
      session.endTime = Math.max(session.endTime, timestamp)
    }

    const msg = entry.message as Record<string, unknown> | undefined
    if (!msg) continue

    const role = msg.role as string | undefined
    if (role === 'user') {
      session.messageCount++
    }

    if (role === 'assistant' || (!role && msg.model)) {
      const usage = msg.usage as Record<string, unknown> | undefined
      if (usage) {
        session.tokens.input += (usage.input_tokens as number) || 0
        session.tokens.output += (usage.output_tokens as number) || 0
        session.tokens.cacheCreation += (usage.cache_creation_input_tokens as number) || 0
        session.tokens.cacheRead += (usage.cache_read_input_tokens as number) || 0
      }
      const model = msg.model as string | undefined
      if (model && session.model === 'unknown') {
        session.model = model
        if (!Object.keys(MODEL_PRICING).some((k) => model.startsWith(k))) {
          diagnostics.unknownModels.add(model)
        }
      }
    }
  }

  const result: RawSession[] = []
  for (const session of sessions.values()) {
    if (session.startTime === Infinity) continue
    if (session.endTime === 0) session.endTime = session.startTime
    result.push(session)
  }

  return result
}

async function scanAllProjects(): Promise<RawSession[]> {
  console.log('Phase 1: Scanning per-project JSONL files...')
  const allSessions: RawSession[] = []

  let projectDirs: string[]
  try {
    projectDirs = fs.readdirSync(PROJECTS_DIR)
  } catch {
    logWarning(`Cannot read ${PROJECTS_DIR}`)
    return []
  }

  const promises = projectDirs.map(async (dirName) => {
    const dirPath = path.join(PROJECTS_DIR, dirName)
    let stat: fs.Stats
    try {
      stat = fs.statSync(dirPath)
    } catch {
      return []
    }
    if (!stat.isDirectory()) return []

    let files: string[]
    try {
      files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.jsonl'))
    } catch {
      diagnostics.skippedFiles.push(`${dirName}/ (unreadable)`)
      return []
    }

    const sessionPromises = files.map(async (file) => {
      const filePath = path.join(dirPath, file)
      try {
        return await scanJsonlFile(filePath, dirName)
      } catch (err) {
        diagnostics.skippedFiles.push(`${dirName}/${file} (${(err as Error).message})`)
        return []
      }
    })

    const results = await Promise.all(sessionPromises)
    return results.flat()
  })

  const results = await Promise.all(promises)
  allSessions.push(...results.flat())

  console.log(`  Found ${allSessions.length} sessions across ${projectDirs.length} project dirs`)
  return allSessions
}

// ──────────────────────────────────────────────
// Phase 2: Enrich from history.jsonl
// ──────────────────────────────────────────────

function pathToEncodedDirName(projectPath: string): string {
  // /Users/dnorthington/.../life-os → -Users-dnorthington-...-life-os
  // Claude Code encodes paths by replacing /, spaces, and ~ with -
  return projectPath.replace(/[/\s~]/g, '-')
}

async function enrichFromHistory(sessions: RawSession[]): Promise<void> {
  console.log('Phase 2: Enriching from history.jsonl...')

  if (!fs.existsSync(HISTORY_FILE)) {
    logWarning('history.jsonl not found, skipping enrichment')
    return
  }

  // Build lookup: encoded dir name → sessions sorted by start time
  const sessionsByDirName = new Map<string, RawSession[]>()
  for (const session of sessions) {
    const key = session.projectDirName
    if (!sessionsByDirName.has(key)) sessionsByDirName.set(key, [])
    sessionsByDirName.get(key)!.push(session)
  }
  for (const arr of sessionsByDirName.values()) {
    arr.sort((a, b) => a.startTime - b.startTime)
  }

  const rl = readline.createInterface({
    input: createReadStream(HISTORY_FILE),
    crlfDelay: Infinity,
  })

  let totalEntries = 0
  let matchedEntries = 0
  const matchedSessions = new Set<string>()

  for await (const line of rl) {
    if (!line.trim()) continue
    totalEntries++

    let entry: HistoryEntry
    try {
      entry = JSON.parse(line) as HistoryEntry
    } catch {
      continue
    }

    if (!entry.project || !entry.timestamp || !entry.display) continue

    // Convert history project path to encoded dir name format
    const encodedPath = pathToEncodedDirName(entry.project.replace(/\/$/, ''))
    const projectSessions = sessionsByDirName.get(encodedPath)
    if (!projectSessions) continue

    const FIVE_MINUTES = 5 * 60 * 1000

    for (const session of projectSessions) {
      if (matchedSessions.has(session.sessionId)) continue
      if (
        entry.timestamp >= session.startTime - FIVE_MINUTES &&
        entry.timestamp <= session.endTime + FIVE_MINUTES
      ) {
        if (!session.firstPrompt) {
          session.firstPrompt = entry.display
          matchedSessions.add(session.sessionId)
          matchedEntries++
        }
        break
      }
    }
  }

  console.log(`  Matched ${matchedEntries}/${totalEntries} history entries to sessions. ${totalEntries - matchedEntries} unmatched.`)
}

// ──────────────────────────────────────────────
// Phase 3: Parse CLAUDE.md files
// ──────────────────────────────────────────────

interface ClaudeProjectMeta {
  name: string
  status: string
  stack: string | null
  productionUrl: string | null
  whereILeftOff: string | null
}

function parseGlobalClaudeMd(): Map<string, ClaudeProjectMeta> {
  console.log('Phase 3: Parsing CLAUDE.md files...')
  const projects = new Map<string, ClaudeProjectMeta>()

  let content: string
  try {
    content = fs.readFileSync(GLOBAL_CLAUDE_MD, 'utf-8')
  } catch {
    logWarning('Global CLAUDE.md not found')
    return projects
  }

  const tableRegex = /\|[^|]*Project[^|]*\|[^|]*Status[^|]*\|[^|]*Stack[^|]*\|[^|]*Production URL[^|]*\|[^|]*Where I Left Off[^|]*\|/i
  const lines = content.split('\n')
  let tableStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (tableRegex.test(lines[i])) {
      tableStart = i
      break
    }
  }

  if (tableStart === -1) {
    logWarning('Could not find Active Projects table in global CLAUDE.md')
    return projects
  }

  for (let i = tableStart + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break

    const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length < 5) continue

    const name = cells[0]
    const status = cells[1]
    const stack = cells[2] || null
    const url = cells[3] && cells[3] !== '—' ? cells[3] : null
    const whereILeftOff = cells[4] || null

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    projects.set(id, { name, status, stack, productionUrl: url, whereILeftOff })
  }

  console.log(`  Found ${projects.size} projects in global CLAUDE.md`)
  return projects
}

interface PerProjectMeta {
  currentStateSummary: string | null
  openQuestions: string | null
}

function parsePerProjectClaudeMd(projectDir: string): PerProjectMeta {
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md')
  if (!fs.existsSync(claudeMdPath)) return { currentStateSummary: null, openQuestions: null }

  let content: string
  try {
    content = fs.readFileSync(claudeMdPath, 'utf-8')
  } catch {
    return { currentStateSummary: null, openQuestions: null }
  }

  const sections = content.split(/^## /m)
  let currentState: string | null = null
  let openQuestions: string | null = null

  for (const section of sections) {
    const headerEnd = section.indexOf('\n')
    if (headerEnd === -1) continue
    const header = section.slice(0, headerEnd).trim().toLowerCase()
    const body = section.slice(headerEnd + 1).trim()

    if (header.startsWith('current state')) {
      currentState = body.split('\n').slice(0, 5).join('\n').trim()
      if (currentState.length > 500) currentState = currentState.slice(0, 500) + '...'
    }
    if (header.startsWith('open questions')) {
      openQuestions = body.split('\n').slice(0, 10).join('\n').trim()
      if (openQuestions.length > 500) openQuestions = openQuestions.slice(0, 500) + '...'
    }
  }

  return { currentStateSummary: currentState, openQuestions }
}

function scanPerProjectMetadata(): Map<string, PerProjectMeta> {
  const results = new Map<string, PerProjectMeta>()

  if (!fs.existsSync(ICLOUD_PROJECTS)) return results

  let dirs: string[]
  try {
    dirs = fs.readdirSync(ICLOUD_PROJECTS)
  } catch {
    return results
  }

  for (const dir of dirs) {
    const fullPath = path.join(ICLOUD_PROJECTS, dir)
    try {
      if (!fs.statSync(fullPath).isDirectory()) continue
    } catch {
      continue
    }

    const id = dir.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const meta = parsePerProjectClaudeMd(fullPath)
    if (meta.currentStateSummary || meta.openQuestions) {
      results.set(id, meta)
    }
  }

  return results
}

// ──────────────────────────────────────────────
// Phase 4: Parse backlog.md files
// ──────────────────────────────────────────────

function parseBacklogFile(filePath: string, projectId: string): BacklogSection[] {
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const sections: BacklogSection[] = []
  const rawSections = content.split(/^## /m).filter((s) => s.trim())

  for (const raw of rawSections) {
    const headerEnd = raw.indexOf('\n')
    if (headerEnd === -1) continue
    const header = raw.slice(0, headerEnd).trim()
    const body = raw.slice(headerEnd + 1)

    let sectionStatus: string | null = null
    const statusMatch = header.match(/—\s*(.+?)$/i)
    if (statusMatch) {
      sectionStatus = statusMatch[1].trim()
    }

    const sectionName = header.replace(/\s*—\s*.+$/, '').trim()

    const items: BacklogItem[] = []
    const itemRegex = /^[-*]\s*\[([ xX])\]\s*(.+)/gm
    let match
    while ((match = itemRegex.exec(body)) !== null) {
      items.push({
        done: match[1].toLowerCase() === 'x',
        text: match[2].replace(/\*\*/g, '').trim(),
      })
    }

    if (items.length > 0) {
      sections.push({ projectId, section: sectionName, sectionStatus, items })
    }
  }

  return sections
}

function scanAllBacklogs(): BacklogSection[] {
  console.log('Phase 4: Scanning backlog files...')
  const allBacklogs: BacklogSection[] = []

  if (!fs.existsSync(ICLOUD_PROJECTS)) return allBacklogs

  let dirs: string[]
  try {
    dirs = fs.readdirSync(ICLOUD_PROJECTS)
  } catch {
    return allBacklogs
  }

  for (const dir of dirs) {
    const backlogPath = path.join(ICLOUD_PROJECTS, dir, '.claude', 'backlog.md')
    if (!fs.existsSync(backlogPath)) continue

    const id = dir.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const sections = parseBacklogFile(backlogPath, id)
    allBacklogs.push(...sections)
  }

  console.log(`  Found ${allBacklogs.length} backlog sections across projects`)
  return allBacklogs
}

// ──────────────────────────────────────────────
// Build Output
// ──────────────────────────────────────────────

function buildOutput(
  rawSessions: RawSession[],
  claudeProjects: Map<string, ClaudeProjectMeta>,
  perProjectMeta: Map<string, PerProjectMeta>,
  backlogs: BacklogSection[]
) {
  console.log('Building output files...')

  const sessions = rawSessions.map((s) => ({
    sessionId: s.sessionId,
    projectId: s.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    startTime: new Date(s.startTime).toISOString(),
    endTime: new Date(s.endTime).toISOString(),
    durationMinutes: Math.round((s.endTime - s.startTime) / 60000),
    messageCount: s.messageCount,
    model: s.model,
    gitBranch: s.gitBranch,
    tokens: s.tokens,
    estimatedCostCents: calculateCost(s.tokens, s.model),
    firstPrompt: s.firstPrompt,
  }))

  const projectStats = new Map<string, { sessionCount: number; totalTokens: number; costCents: number; lastDate: string }>()
  for (const s of sessions) {
    const key = s.projectId
    const prev = projectStats.get(key) || { sessionCount: 0, totalTokens: 0, costCents: 0, lastDate: '' }
    prev.sessionCount++
    prev.totalTokens += s.tokens.input + s.tokens.output + s.tokens.cacheCreation + s.tokens.cacheRead
    prev.costCents += s.estimatedCostCents
    if (s.startTime > prev.lastDate) prev.lastDate = s.startTime
    projectStats.set(key, prev)
  }

  const projectIds = new Set<string>()
  for (const id of claudeProjects.keys()) projectIds.add(id)
  for (const s of sessions) projectIds.add(s.projectId)

  const projects: Project[] = []
  for (const id of projectIds) {
    const claudeMeta = claudeProjects.get(id)
    const perProjMeta = perProjectMeta.get(id)
    const stats = projectStats.get(id) || { sessionCount: 0, totalTokens: 0, costCents: 0, lastDate: '' }

    projects.push({
      id,
      name: claudeMeta?.name || id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      status: claudeMeta?.status || 'Unknown',
      stack: claudeMeta?.stack || null,
      productionUrl: claudeMeta?.productionUrl || null,
      whereILeftOff: claudeMeta?.whereILeftOff || null,
      currentStateSummary: perProjMeta?.currentStateSummary || null,
      openQuestions: perProjMeta?.openQuestions || null,
      lastSessionDate: stats.lastDate || null,
      sessionCount: stats.sessionCount,
      totalTokens: stats.totalTokens,
      estimatedCostCents: stats.costCents,
    })
  }

  const statusOrder: Record<string, number> = { Active: 0, Maintenance: 1, Parked: 2, Unknown: 3 }
  projects.sort((a, b) => {
    const sa = statusOrder[a.status] ?? 3
    const sb = statusOrder[b.status] ?? 3
    if (sa !== sb) return sa - sb
    return (b.lastSessionDate || '').localeCompare(a.lastSessionDate || '')
  })

  const dayMap = new Map<string, { sessionCount: number; totalMinutes: number; projects: Set<string>; promptCount: number }>()
  for (const s of sessions) {
    const date = s.startTime.slice(0, 10)
    const prev = dayMap.get(date) || { sessionCount: 0, totalMinutes: 0, projects: new Set(), promptCount: 0 }
    prev.sessionCount++
    prev.totalMinutes += s.durationMinutes
    prev.projects.add(s.projectId)
    prev.promptCount += s.messageCount
    dayMap.set(date, prev)
  }

  const activity = Array.from(dayMap.entries())
    .map(([date, d]) => ({
      date,
      sessionCount: d.sessionCount,
      totalMinutes: d.totalMinutes,
      projects: Array.from(d.projects),
      promptCount: d.promptCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const sortedSessions = [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const firstDate = sortedSessions[0]?.startTime.slice(0, 10) || ''
  const lastDate = sortedSessions[sortedSessions.length - 1]?.startTime.slice(0, 10) || ''
  const dataSpanDays = firstDate && lastDate
    ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000) + 1
    : 0

  const meta = {
    refreshedAt: new Date().toISOString(),
    dataSpanDays,
    firstSessionDate: firstDate,
    lastSessionDate: lastDate,
    totalSessions: sessions.length,
    totalProjects: projects.length,
    warnings: {
      skippedFiles: diagnostics.skippedFiles.slice(0, 20),
      parseErrors: diagnostics.parseErrors,
      historyMatchRate: `${sessions.filter((s) => s.firstPrompt).length}/${sessions.length}`,
    },
  }

  const writes = [
    { name: 'projects.json', data: projects },
    { name: 'sessions.json', data: sessions },
    { name: 'activity.json', data: activity },
    { name: 'backlogs.json', data: backlogs },
    { name: 'meta.json', data: meta },
  ]

  for (const { name, data } of writes) {
    const filePath = path.join(OUTPUT_DIR, name)
    const json = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, json)
    const sizeKb = (Buffer.byteLength(json) / 1024).toFixed(1)
    console.log(`  Wrote ${name} (${sizeKb} KB)`)
  }

  return { sessions, projects, activity, meta }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.log('Claude Code Dashboard — Data Refresh')
  console.log('====================================\n')

  const startTime = Date.now()

  const rawSessions = await scanAllProjects()
  await enrichFromHistory(rawSessions)
  const claudeProjects = parseGlobalClaudeMd()
  const perProjectMeta = scanPerProjectMetadata()
  const backlogs = scanAllBacklogs()
  const { sessions, projects, meta } = buildOutput(rawSessions, claudeProjects, perProjectMeta, backlogs)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n====================================')
  console.log('Summary:')
  console.log(`  Sessions: ${sessions.length}`)
  console.log(`  Projects: ${projects.length}`)
  console.log(`  Date range: ${meta.firstSessionDate} → ${meta.lastSessionDate} (${meta.dataSpanDays} days)`)
  console.log(`  History match rate: ${meta.warnings.historyMatchRate}`)
  console.log(`  Skipped files: ${diagnostics.skippedFiles.length}`)
  console.log(`  Parse errors: ${diagnostics.parseErrors}`)
  if (diagnostics.unknownModels.size > 0) {
    console.log(`  Unknown models (charged as Opus): ${Array.from(diagnostics.unknownModels).join(', ')}`)
  }
  console.log(`  Elapsed: ${elapsed}s`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exitCode = 1
})
