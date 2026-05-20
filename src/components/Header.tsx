import type { LogEntry } from '../types';
import { Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
  filteredLogs: LogEntry[];
}

export default function Header({ loading, onRefresh, filteredLogs }: HeaderProps) {
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Operator', 'Status'];

    const rows = filteredLogs.map((log) => {
      const engStatus = log.status.toLowerCase() === 'menyala' ? 'RUNNING' : 'STOPPED';
      return `"${log.time}","${log.name}","${engStatus}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'genset_operations_log.csv');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
      
      <div>
        <div className="flex items-center -ml-1">
          <img 
            src="/logo-klabat.svg" 
            alt="Genset Klabat Logo" 
            className="h-16 md:h-20 object-contain mix-blend-lighten contrast-125 brightness-90 drop-shadow-md" 
          />
        </div>
        
        <p className="text-zinc-400 mt-0 font-medium text-sm pl-1">
          Monitoring generator operations and up-time statistics
        </p>
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={exportToCSV}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#18181b] border border-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600/10 border border-purple-500/30 text-purple-400 font-medium rounded-xl hover:bg-purple-600/20 hover:text-purple-300 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing...' : 'Sync Logs'}</span>
        </button>
      </div>
    </div>
  );
}