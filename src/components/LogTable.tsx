import { useState } from 'react';
import type { LogEntry } from '../types';
import Avatar from './Avatar';
import { ArrowRight, Image as ImageIcon, X, ClipboardCheck, User, Power, Clock, MapPin, ShieldCheck } from 'lucide-react';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LogEntry | null>(null);
  const [detailAddress, setDetailAddress] = useState<string>('');

  const handleNameClick = async (log: LogEntry) => {
    setSelectedDetail(log);
    setDetailAddress('Looking up address...');

    if (log.lat && log.lng) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${log.lat}&lon=${log.lng}&format=json&accept-language=id`,
          { headers: { 'User-Agent': 'GensetReportApp/1.0' } }
        );
        const data = await res.json();
        const addr = data.address;
        const parts = [
          addr.road || addr.pedestrian || addr.footway,
          addr.neighbourhood || addr.suburb || addr.village,
          addr.city || addr.town || addr.county,
        ].filter(Boolean);
        setDetailAddress(parts.join(', ') || data.display_name || `${log.lat}, ${log.lng}`);
      } catch {
        setDetailAddress(`${log.lat}, ${log.lng}`);
      }
    } else {
      setDetailAddress('Coordinates not available');
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f0f11] border-b border-zinc-800/80 text-zinc-500 uppercase text-[10px] tracking-[0.2em]">
                <th className="px-6 py-4 font-semibold w-[25%] min-w-[180px] whitespace-nowrap">Timestamp (WIB)</th>
                <th className="px-6 py-4 font-semibold">Operator</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Report</th>
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
                    <td className="px-6 py-4 text-zinc-400 text-sm font-medium whitespace-nowrap min-w-[180px]">{log.time}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleNameClick(log)}
                        className="flex items-center gap-3 text-left hover:bg-zinc-800/50 p-1.5 -ml-1.5 rounded-lg transition-all active:scale-95 cursor-pointer w-full"
                      >
                        <Avatar name={log.name} userId={log.userId} className="w-7 h-7" />
                        <span className="font-semibold text-zinc-300 group-hover:text-purple-400 transition-colors border-b border-transparent group-hover:border-purple-400/30 pb-0.5">
                          {log.name}
                        </span>
                      </button>
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
                    <td className="px-6 py-4">
                      {log.photoUrl ? (
                        <button 
                          onClick={() => setSelectedImage(log.photoUrl ?? null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/40 hover:bg-purple-600/20 border border-zinc-700/50 hover:border-purple-500/50 text-zinc-400 hover:text-purple-400 rounded-lg text-[11px] font-bold tracking-wide transition-all active:scale-95 whitespace-nowrap w-fit"
                        >
                          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>View Image</span>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">None</span>
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

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 p-2 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Genset Proof" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-zinc-800 bg-zinc-950"
            />
          </div>
        </div>
      )}

      {selectedDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedDetail(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#121214] border border-zinc-800/80 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedDetail(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 p-1.5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg text-sm uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> 
                Generator Report Received
              </span>
            </h3>

            <div className="flex flex-col gap-4 text-[13px]">
              <div className="flex items-start gap-2">
                <span className="text-zinc-400 w-24 shrink-0 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Operator
                </span>
                <span className="text-zinc-100 font-bold">: {selectedDetail.name}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-zinc-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Power className="w-4 h-4" /> Status
                </span>
                <span className="text-zinc-400">:</span>
                <span
                  className={`font-bold ${
                    selectedDetail.status.toLowerCase() === 'menyala'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {selectedDetail.status.toLowerCase() === 'menyala'
                    ? 'RUNNING'
                    : 'STOPPED'}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-zinc-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Time
                </span>
                <span className="text-zinc-100 font-medium">: {selectedDetail.time}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-zinc-400 w-24 shrink-0 flex items-start gap-1.5 pt-0.5">
                  <MapPin className="w-4 h-4 shrink-0" /> Location
                </span>
                <span className="text-zinc-100 font-medium leading-relaxed pt-0.5">: {detailAddress}</span>
              </div>
            </div>
            
            <p className="mt-6 text-[11px] text-zinc-500 italic border-t border-zinc-800/80 pt-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-600" />
              Report verified through GPS & Camera system
            </p>
          </div>
        </div>
      )}
    </>
  );
}