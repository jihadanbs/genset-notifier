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

  // Komponen toast standar (bawaan) agar UI seragam
  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-logs');
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        showToast('Data berhasil diperbarui');
      } else {
        showToast('Gagal memuat data dari server');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchLogs();
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Notifikasi Jenset</h1>
          <button 
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Notifikasi Toast Biasa */}
        {toast.show && (
          <div className="fixed top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded shadow-lg z-50 transition-all">
            {toast.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 w-1/3">Waktu (WIB)</th>
                <th className="p-4 font-semibold text-gray-600 w-1/3">Staf yang Menyalakan</th>
                <th className="p-4 font-semibold text-gray-600 w-1/3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Belum ada riwayat jenset yang menyala.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{log.time}</td>
                    <td className="p-4 text-gray-800 font-medium">{log.name}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {log.status === '-' ? 'Menyala' : log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}