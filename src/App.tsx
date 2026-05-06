import { useEffect, useState } from 'react';

interface LogEntry {
  id: number;
  time: string;
  name: string;
  status: string;
}

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // State untuk Fitur Baru
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-logs');
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        showToast('Data berhasil diperbarui ✨');
      } else {
        showToast('Gagal memuat data dari server ❌');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Terjadi kesalahan jaringan 🌐');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/get-logs');
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
        }
      } catch (error) {
        console.error('Error fetching initial logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

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
    const matchSearch = 
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.status.toLowerCase().includes(searchTerm.toLowerCase());

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

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = ['Waktu', 'Staf Eksekutor', 'Status'];
    const rows = filteredLogs.map(log => `"${log.time}","${log.name}","${log.status}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_jenset.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'menyala') {
      return (
        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 shadow-sm flex items-center gap-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Menyala
        </span>
      );
    } else if (s === 'mati') {
      return (
        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200 shadow-sm flex items-center gap-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Mati
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 w-full">
      <div className="bg-gradient-to-r from-indigo-700 to-blue-600 pb-32 pt-12 px-4 sm:px-8 shadow-inner w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
              ⚡ Dashboard Notifikasi Jenset
            </h1>
            <p className="text-indigo-100 mt-2 font-medium">Manajemen riwayat operasional jenset.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all active:scale-95"
            >
              📥 Export CSV
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg shadow-md hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <span className="animate-spin">⏳</span> : <span>🔄 Refresh</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-24 pb-12">
        {toast.show && (
          <div className="fixed top-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-bounce">
            {toast.message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3">
              <input 
                type="text" 
                placeholder="🔍 Cari nama staf atau status..." 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <span className="text-sm font-medium text-slate-500">Dari:</span>
              <input 
                type="date" 
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="text-sm font-medium text-slate-500">Sampai:</span>
              <input 
                type="date" 
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="p-5 font-bold w-1/3">Waktu (WIB)</th>
                  <th className="p-5 font-bold w-1/3">Staf Eksekutor</th>
                  <th className="p-5 font-bold w-1/3">Status Jenset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400">Memuat data terbaru...</td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400 font-medium">
                      📭 Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5 text-slate-600 font-medium">{log.time}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {log.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{log.name}</span>
                        </div>
                      </td>
                      <td className="p-5">{getStatusBadge(log.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-bold text-slate-700">{filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> hingga <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari total <span className="font-bold text-slate-700">{filteredLogs.length}</span> data.
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}