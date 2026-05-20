import type { LogEntry } from '../types';
import Avatar from './Avatar';
import { ArrowRight } from 'lucide-react';

interface LogTableProps {
  loading: boolean; 
  logs: LogEntry[]; 
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (num: number) => void;
  totalFiltered: number;
}

export default function LogTable({ loading, logs, currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, totalFiltered }: LogTableProps) {
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto min-h-[420px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f0f11] border-b border-zinc-800/80 text-zinc-500 uppercase text-[10px] tracking-[0.2em]">
              <th className="px-6 py-4 font-semibold w-1/3">Timestamp (WIB)</th>
              <th className="px-6 py-4 font-semibold w-1/3">Operator</th>
              <th className="px-6 py-4 font-semibold w-1/3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr><td colSpan={3} className="p-16 text-center text-zinc-500">Syncing data...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-16 text-center">
                  <div className="text-zinc-600 mb-2">No operations found</div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#18181b] transition-colors group">
                  <td className="px-6 py-4 text-zinc-400 text-sm font-medium">{log.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={log.name} userId={log.userId} className="w-7 h-7" />
                      <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors">{log.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.status.toLowerCase() === 'menyala' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800/30 border border-zinc-800/50 px-2 py-1 rounded-md">
                          STOPPED
                        </span>
                        
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        
                        <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          RUNNING
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800/30 border border-zinc-800/50 px-2 py-1 rounded-md">
                          RUNNING
                        </span>
                        
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          STOPPED
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f0f11]">
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 px-2.5 py-1 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rows:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-zinc-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value={10} className="bg-[#121214] text-zinc-300">10</option>
              <option value={20} className="bg-[#121214] text-zinc-300">20</option>
              <option value={50} className="bg-[#121214] text-zinc-300">50</option>
            </select>
          </div>

          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Showing <span className="text-zinc-300">{totalFiltered > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-zinc-300">{Math.min(currentPage * itemsPerPage, totalFiltered)}</span> of <span className="text-zinc-300">{totalFiltered}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-transparent text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-zinc-400 px-3 py-1.5 bg-zinc-800/50 rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages || totalFiltered === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-transparent text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}