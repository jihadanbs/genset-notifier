import type { LogEntry } from '../types';
import Avatar from './Avatar';
import { Calendar } from 'lucide-react';

export default function DashboardStats({ logs }: { logs: LogEntry[] }) {
  const isCurrentlyRunning = logs.length > 0 && logs[0].status.toLowerCase() === 'menyala';
  
  const uniqueOperatorsMap = new Map<string, string>();
  logs.forEach(log => {
    if (log.name && log.name !== '-') {
      uniqueOperatorsMap.set(log.name, log.userId);
    }
  });
  const uniqueOperators = Array.from(uniqueOperatorsMap.entries()).map(([name, userId]) => ({ name, userId }));
  const totalOperators = uniqueOperators.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Status Card */}
      <div className="bg-[#121214] p-6 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Current Status</span>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative">
            <div className={`absolute inset-0 blur-md rounded-full ${isCurrentlyRunning ? 'bg-green-500/40 animate-pulse' : 'bg-red-500/40'}`}></div>
            <div className={`relative h-4 w-4 rounded-full border-[1.5px] ${isCurrentlyRunning ? 'bg-green-500 border-green-300' : 'bg-red-500 border-red-300'}`}></div>
          </div>
          <span className={`text-3xl font-extrabold tracking-tight ${isCurrentlyRunning ? 'text-green-400' : 'text-red-400 text-shadow-sm'}`}>
            {isCurrentlyRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        <div className="mt-4 text-xs font-medium text-zinc-500">
          Last updated: {logs.length > 0 ? logs[0].time : '-'}
        </div>
      </div>
      
      {/* Total Logs Card */}
      <div className="bg-[#121214] p-6 rounded-2xl shadow-lg flex flex-col justify-between relative">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Operation Logs</span>
          <div className="flex items-center gap-1.5 bg-zinc-800/40 border border-zinc-700/50 px-2 py-1 rounded-md">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              Mon • Wed • Fri
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <span className="text-4xl font-bold text-zinc-100">{logs.length} <span className="text-sm font-medium text-zinc-600">Total</span></span>
          <div className="flex gap-1.5 h-8 items-end opacity-70">
            {[4, 7, 5, 8, 3, 6, 9].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-500/40 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Operators Card */}
      <div className="bg-[#121214] p-5 rounded-2xl shadow-lg flex flex-col">
        <div className="flex justify-between items-start pb-1">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Active Personnel</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-zinc-100 leading-none">{totalOperators}</span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase">Staff</span>
          </div>
        </div>
        
        <div className="mt-4 flex flex-col gap-2.5">
          {uniqueOperators.slice(0, 2).map((op, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <Avatar name={op.name} userId={op.userId} className="w-9 h-9" />
              <span className="text-[13.5px] font-semibold text-zinc-300 truncate tracking-wide">{op.name}</span>
            </div>
          ))}
          
          {totalOperators > 2 && (
            <div className="flex items-center gap-3.5 mt-0.5">
              <div className="w-9 flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0 tracking-widest pl-1">
                +{totalOperators - 2}
              </div>
              <span className="text-xs font-medium text-zinc-600">more active staff</span>
            </div>
          )}

          {totalOperators === 0 && (
            <span className="text-sm font-medium text-zinc-600 mt-2">No active personnel</span>
          )}
        </div>
      </div>
    </div>
  );
}