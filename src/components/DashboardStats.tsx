import { useState } from 'react';
import type { LogEntry } from '../types';
import Avatar from './Avatar';
import Tooltip from './Tooltip';
import { Calendar, Bell, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function DashboardStats({ logs }: { logs: LogEntry[] }) {
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [successSent, setSuccessSent] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: string; name: string }>({
    isOpen: false,
    userId: '',
    name: ''
  });

  const isCurrentlyRunning = logs.length > 0 && logs[0].status.toLowerCase() === 'menyala';
  
  const uniqueOperatorsMap = new Map<string, string>();
  logs.forEach(log => {
    if (log.name && log.name !== '-') {
      uniqueOperatorsMap.set(log.name, log.userId);
    }
  });
  const uniqueOperators = Array.from(uniqueOperatorsMap.entries()).map(([name, userId]) => ({ name, userId }));
  const totalOperators = uniqueOperators.length;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenConfirm = (userId: string, name: string) => {
    setConfirmModal({ isOpen: true, userId, name });
  };

  const handleSendReminder = async () => {
    const { userId, name } = confirmModal;
    
    setConfirmModal({ isOpen: false, userId: '', name: '' }); 
    setSendingTo(userId);
    setToast(null);
    
    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setSuccessSent(userId);
      showToast(`Reminder successfully sent to ${name}!`, 'success');
      setTimeout(() => setSuccessSent(null), 2000);
      
    } catch (error: unknown) {
      showToast(`Failed to send reminder: ${(error as Error).message}`, 'error');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <>
    {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-6 fade-in duration-300">
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border backdrop-blur-md max-w-sm w-max ${
            toast.type === 'success'
              ? 'bg-[#142d1e]/95 border-green-500/30 text-green-400'
              : 'bg-[#2d0f0f]/95 border-red-500/30 text-red-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-zinc-100 leading-snug">
                {toast.type === 'success' ? 'Request Sent' : 'Operation Failed'}
              </span>
              <span className="text-[11.5px] opacity-80 leading-snug max-w-[250px] truncate whitespace-normal">
                {toast.message}
              </span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="ml-2 -mr-1 p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setConfirmModal({ isOpen: false, userId: '', name: '' })}
          ></div>
          
          <div className="relative bg-[#121214] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100 leading-tight">Send Reminder</h3>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Telegram Group Notification</p>
              </div>
            </div>
            
            <p className="text-[14px] text-zinc-300 mb-7 leading-relaxed">
              Are you sure you want to ping <strong className="text-white font-bold">{confirmModal.name}</strong> to check the generator right now?
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, userId: '', name: '' })}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center gap-2"
              >
                Yes, Send It
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3.5">
                  <Avatar name={op.name} userId={op.userId} className="w-9 h-9" />
                  <span className="text-[13.5px] font-semibold text-zinc-300 truncate tracking-wide">{op.name}</span>
                </div>

                <Tooltip content="Send Reminder">
                  <button
                    onClick={() => handleOpenConfirm(op.userId, op.name)}
                    disabled={sendingTo === op.userId || successSent === op.userId}
                    className={`p-1.5 rounded-md transition-all ${
                      successSent === op.userId 
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {sendingTo === op.userId ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    ) : successSent === op.userId ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
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
    </>
  );
}