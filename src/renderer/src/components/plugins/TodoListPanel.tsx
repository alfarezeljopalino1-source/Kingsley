import React, { useState, useEffect } from 'react'
import {
  ListTodo,
  Plus,
  Check,
  Trash2,
  X,
  Sparkles,
  Tag,
  CheckCircle2,
  Circle,
  Filter
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

export interface TodoTask {
  id: string
  text: string
  completed: boolean
  tag?: string
  createdAt: number
}

const TODO_STORAGE_KEY = 'ferminterm_todo_tasks'

const DEFAULT_TODOS: TodoTask[] = [
  {
    id: 'todo-1',
    text: 'Cek latensi ConPTY dan buffer scrollback terminal',
    completed: true,
    tag: 'Engine',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'todo-2',
    text: 'Eksplorasi tema baru dan kustomisasi tipografi di Kingsley',
    completed: false,
    tag: 'Theme',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'todo-3',
    text: 'Setup workspace project baru dengan agent AI',
    completed: false,
    tag: 'Agent',
    createdAt: Date.now() - 900000,
  },
]

interface TodoListPanelProps {
  onClose: () => void
  width?: number
  isResizing?: boolean
}

export const TodoListPanel: React.FC<TodoListPanelProps> = ({ onClose, width, isResizing = false }) => {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [tasks, setTasks] = useState<TodoTask[]>(() => {
    try {
      const saved = localStorage.getItem(TODO_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_TODOS
  })
  const [inputText, setInputText] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('General')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = inputText.trim()
    if (!text) return

    const newTask: TodoTask = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
      tag: selectedTag,
      createdAt: Date.now(),
    }

    setTasks((prev) => [newTask, ...prev])
    setInputText('')
  }

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed))
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  const tagColors: Record<string, string> = {
    Engine: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Media: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    Agent: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Fix: 'bg-red-500/20 text-red-300 border-red-500/30',
    General: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  }

  return (
    <div
      className="h-full flex flex-col font-mono text-xs border-l z-20 shrink-0 select-none"
      style={{
        width: width ? `${width}px` : '360px',
        transition: isResizing ? 'none' : 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.ui.surface,
        borderColor: theme.ui.border,
      }}
    >
      {/* Header */}
      <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <span>{language === 'id' ? 'Todo & Catatan Tugas' : 'Todo List & Tasks'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-neutral-300">
                {completedCount}/{totalCount}
              </span>
            </h3>
            <span className="text-[10px] text-neutral-400">
              {language === 'id' ? 'Plugin Sidebar Bawaan' : 'Bundled Dock Plugin'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddTask} className="p-3 border-b space-y-2" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-400 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === 'id' ? 'Tulis tugas baru lalu Enter...' : 'Add a new task & press Enter...'}
            className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-neutral-500 font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black font-bold transition-all cursor-pointer"
            title="Tambah Tugas"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
          <span className="text-neutral-500 text-[10px] mr-1 flex items-center gap-0.5">
            <Tag className="w-2.5 h-2.5" />
            Tag:
          </span>
          {['General', 'Engine', 'Agent', 'Media', 'Fix'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(t)}
              className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                selectedTag === t
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'border-white/5 bg-white/[0.02] text-neutral-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </form>

      {/* Filters Bar */}
      <div className="px-3 py-2 border-b flex items-center justify-between text-[11px]" style={{ borderColor: theme.ui.border }}>
        <div className="flex items-center gap-1">
          {(['all', 'active', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                filter === mode
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mode === 'all'
                ? language === 'id' ? 'Semua' : 'All'
                : mode === 'active'
                ? language === 'id' ? 'Aktif' : 'Active'
                : language === 'id' ? 'Selesai' : 'Done'}
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            {language === 'id' ? 'Bersihkan Selesai' : 'Clear Done'}
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 opacity-30 text-emerald-400" />
            <p className="text-xs">
              {filter === 'completed'
                ? language === 'id' ? 'Belum ada tugas selesai.' : 'No completed tasks yet.'
                : language === 'id' ? 'Semua tugas beres! Kerja bagus.' : 'All tasks cleared! Take a break.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all group ${
                task.completed
                  ? 'bg-white/[0.01] border-white/5 opacity-60'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  task.completed
                    ? 'border-emerald-500 bg-emerald-500 text-black'
                    : 'border-white/20 hover:border-cyan-400 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs break-words leading-relaxed transition-all ${
                    task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                  }`}
                >
                  {task.text}
                </p>
                {task.tag && (
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold border mt-1.5 ${
                      tagColors[task.tag] || tagColors.General
                    }`}
                  >
                    {task.tag}
                  </span>
                )}
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded transition-opacity cursor-pointer"
                title="Hapus tugas"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
