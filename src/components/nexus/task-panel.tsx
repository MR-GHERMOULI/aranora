'use client';

import type { GeneratedTask } from '@/types/nexus';
import { cn } from '@/lib/utils';
import {
  X, Check, ArrowRight, Clock, Sparkles,
  ChevronDown, ChevronUp, Send
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
  High: { 
    color: 'text-red-700', 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    dot: 'bg-red-500',
    iconColor: 'text-red-500'
  },
  Medium: { 
    color: 'text-amber-700', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    dot: 'bg-amber-500',
    iconColor: 'text-amber-500'
  },
  Low: { 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    dot: 'bg-emerald-500',
    iconColor: 'text-emerald-500'
  },
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
    <div className="absolute right-0 top-0 bottom-0 w-[420px] z-50 bg-white/95 backdrop-blur-xl border-l border-gray-200 shadow-2xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-xl tracking-tight">Nexus Tasks</h2>
              <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">{stats.total} items identified</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center shadow-sm">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total</div>
            <div className="text-xl font-black text-gray-900">{stats.total}</div>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-center shadow-sm">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">High</div>
            <div className="text-xl font-black text-red-600">{stats.high}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center shadow-sm">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-tighter">Med</div>
            <div className="text-xl font-black text-amber-600">{stats.medium}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center shadow-sm">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Low</div>
            <div className="text-xl font-black text-emerald-600">{stats.low}</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 bg-gray-50/20">
        {tasks.map((task, idx) => {
          const pc = priorityConfig[task.priority];
          const isExpanded = expandedTask === idx;
          const isChecked = checkedTasks.has(idx);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-2xl border transition-all duration-300 shadow-sm group',
                isChecked 
                  ? 'border-gray-200 bg-white hover:shadow-md hover:border-blue-200' 
                  : 'border-gray-100 bg-gray-50/50 opacity-60'
              )}
            >
              <div className="flex items-start gap-4 p-4">
                <button
                  onClick={() => toggleTask(idx)}
                  className={cn(
                    'mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                    isChecked 
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  )}
                >
                  {isChecked && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-widest">#{task.order}</span>
                    <span className={cn('text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border', pc.bg, pc.color, pc.border)}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold ml-auto bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">
                      <Clock className="h-3 w-3" />
                      {task.estimatedHours}h
                    </div>
                  </div>
                  <h4 className={cn(
                    "text-sm font-bold truncate transition-colors",
                    isChecked ? "text-gray-900 group-hover:text-blue-600" : "text-gray-400"
                  )}>
                    {task.title}
                  </h4>
                  {task.dependencies.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-gray-400 bg-gray-50 w-fit px-2 py-1 rounded-md border border-gray-100/50">
                      <ArrowRight className="h-3 w-3 text-blue-400" />
                      {task.dependencies.slice(0, 2).join(', ')}
                      {task.dependencies.length > 2 && ` +${task.dependencies.length - 2}`}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedTask(isExpanded ? null : idx)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 mt-1 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-gray-50 mb-4" />
                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    {task.description}
                  </p>
                  {task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {task.labels.map(l => (
                        <span key={l} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-gray-500 border border-gray-200 shadow-sm">
                          #{l}
                        </span>
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
      <div className="p-6 border-t border-gray-100 shrink-0 space-y-4 bg-white">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Target Project</label>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none shadow-sm"
          >
            <option value="">Personal Workspace</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onPushToTasks(selectedTasks, selectedProject || null)}
          disabled={selectedTasks.length === 0 || isPushing}
          className={cn(
            'w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl',
            selectedTasks.length > 0 && !isPushing
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
          )}
        >
          <Send className={cn("h-4 w-4", isPushing && "animate-pulse")} />
          {isPushing ? 'Finalizing Sync...' : `Push ${selectedTasks.length} Task${selectedTasks.length !== 1 ? 's' : ''} to Workspace`}
        </button>

        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           {selectedTasks.reduce((s, t) => s + t.estimatedHours, 0)}h total duration
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
