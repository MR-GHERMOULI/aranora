'use client';

import type { GeneratedTask } from '@/types/nexus';
import { cn } from '@/lib/utils';
import {
  X, Check, ArrowRight, Clock, Flag, Sparkles,
  ChevronDown, ChevronUp, ListTodo, Send
} from 'lucide-react';
import { useState } from 'react';

interface TaskPanelProps {
  tasks: GeneratedTask[];
  onClose: () => void;
  onPushToTasks: (tasks: GeneratedTask[], projectId: string | null) => void;
  projects: { id: string; title: string }[];
  isPushing: boolean;
}

const priorityConfig = {
  High: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  Low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
};

export function TaskPanel({ tasks, onClose, onPushToTasks, projects, isPushing }: TaskPanelProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set(tasks.map((_, i) => i)));

  const toggleTask = (idx: number) => {
    const next = new Set(checkedTasks);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedTasks(next);
  };

  const selectedTasks = tasks.filter((_, i) => checkedTasks.has(i));

  const stats = {
    total: tasks.length,
    high: tasks.filter(t => t.priority === 'High').length,
    medium: tasks.filter(t => t.priority === 'Medium').length,
    low: tasks.filter(t => t.priority === 'Low').length,
    totalHours: tasks.reduce((s, t) => s + t.estimatedHours, 0),
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[420px] z-50 bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Generated Tasks</h2>
              <p className="text-zinc-500 text-xs">{stats.total} tasks from your canvas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3">
          <div className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
            <div className="text-xs text-zinc-500">Total</div>
            <div className="text-lg font-bold text-white">{stats.total}</div>
          </div>
          <div className="flex-1 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
            <div className="text-xs text-red-400">High</div>
            <div className="text-lg font-bold text-red-400">{stats.high}</div>
          </div>
          <div className="flex-1 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
            <div className="text-xs text-amber-400">Med</div>
            <div className="text-lg font-bold text-amber-400">{stats.medium}</div>
          </div>
          <div className="flex-1 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
            <div className="text-xs text-emerald-400">Low</div>
            <div className="text-lg font-bold text-emerald-400">{stats.low}</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {tasks.map((task, idx) => {
          const pc = priorityConfig[task.priority];
          const isExpanded = expandedTask === idx;
          const isChecked = checkedTasks.has(idx);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-xl border transition-all duration-200',
                isChecked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-50',
              )}
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  onClick={() => toggleTask(idx)}
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                    isChecked ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 hover:border-zinc-400'
                  )}
                >
                  {isChecked && <Check className="h-3 w-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-600 font-mono">#{task.order}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', pc.bg, pc.color, `border ${pc.border}`)}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1 text-zinc-500 text-[10px] ml-auto">
                      <Clock className="h-3 w-3" />
                      {task.estimatedHours}h
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                  {task.dependencies.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                      <ArrowRight className="h-3 w-3" />
                      depends on: {task.dependencies.slice(0, 2).join(', ')}
                      {task.dependencies.length > 2 && ` +${task.dependencies.length - 2}`}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedTask(isExpanded ? null : idx)}
                  className="p-1 rounded text-zinc-500 hover:text-white transition shrink-0"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-white/5 mt-1">
                  <p className="text-xs text-zinc-400 whitespace-pre-wrap mt-2">{task.description}</p>
                  {task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.labels.map(l => (
                        <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition"
          >
            <option value="">No project (personal tasks)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onPushToTasks(selectedTasks, selectedProject || null)}
          disabled={selectedTasks.length === 0 || isPushing}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            selectedTasks.length > 0 && !isPushing
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          <Send className="h-4 w-4" />
          {isPushing ? 'Pushing tasks...' : `Push ${selectedTasks.length} Task${selectedTasks.length !== 1 ? 's' : ''} to Workspace`}
        </button>

        <p className="text-center text-[10px] text-zinc-600">
          Estimated total: {selectedTasks.reduce((s, t) => s + t.estimatedHours, 0)}h of work
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
