import { useEffect, useState } from 'react';
import type { LogEntry } from './types';
import Header from './components/Header';
import DashboardStats from './components/DashboardStats';
import FilterBar from './components/FilterBar';
import LogTable from './components/LogTable';

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  useEffect(() => {
    const loadInitialLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/get-logs');
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-logs');
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        showToast('Data synchronized successfully');
      } else {
        showToast('Failed to load server data');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateString: string) => {
    try {
      const [datePart] = dateString.split(',');
      const [day, month, year] = datePart.trim().split('/');
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } catch {
      return null;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const searchTarget = searchTerm.toLowerCase();
    const engStatus = log.status.toLowerCase() === 'menyala' ? 'running' : 'stopped';
    
    const matchSearch = 
      log.name.toLowerCase().includes(searchTarget) ||
      engStatus.includes(searchTarget) ||
      log.status.toLowerCase().includes(searchTarget);

    let matchDate = true;
    if (startDate || endDate) {
      const logDate = parseDate(log.time);
      if (logDate) {
        if (startDate) matchDate = matchDate && logDate >= new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchDate = matchDate && logDate <= end;
        }
      }
    }
    return matchSearch && matchDate;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setCurrentPage(1);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (val: number) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans w-full p-4 sm:p-8 md:p-10 selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto">
        
        {toast.show && (
          <div className="fixed top-6 right-6 bg-[#18181b] text-zinc-200 px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.15)] z-50 flex items-center gap-3 animate-bounce border border-purple-500/20">
            {toast.message}
          </div>
        )}

        <Header 
          loading={loading} 
          onRefresh={() => fetchLogs()}
          filteredLogs={filteredLogs} 
        />

        <DashboardStats logs={logs} />

        <div className="bg-[#121214] rounded-2xl border border-zinc-800/60 shadow-2xl overflow-hidden mt-8">
          <FilterBar 
            searchTerm={searchTerm} setSearchTerm={handleSearchChange}
            startDate={startDate} setStartDate={handleStartDateChange}
            endDate={endDate} setEndDate={handleEndDateChange}
          />
          <LogTable 
            loading={loading}
            logs={paginatedLogs}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={handleItemsPerPageChange}
            totalFiltered={filteredLogs.length}
          />
        </div>

      </div>
    </div>
  );
}