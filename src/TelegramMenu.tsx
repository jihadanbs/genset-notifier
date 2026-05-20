import { useState, useEffect } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export default function TelegramMenu() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS is not supported on this phone!");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
          setLocation({
           lat: pos.coords.latitude,
           lng: pos.coords.longitude,
          }),
      (err) => {
          console.error(err);
          alert("Failed to get GPS location! Please allow location access!");
      }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!location || !photo) {
      alert("⚠️ Lengkapi foto dan lokasi dulu bos!");
      return;
    }
    setLoading(true);
    
    alert(`MANTAP! Kordinat: ${location.lat}, ${location.lng}. Foto siap diupload!`);
    
    setTimeout(() => {
      window.Telegram?.WebApp?.close();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-5 flex flex-col items-center justify-center gap-6">
      <h1 className="text-xl font-bold text-center">Laporan Genset</h1>

      <button 
        onClick={getLocation}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${location ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-300'}`}
      >
        <MapPin />
        {location ? '✅ Lokasi Tersimpan' : '1. Dapatkan Lokasi GPS'}
      </button>

      <div className="w-full">
        <label htmlFor="kamera" className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${photo ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-300'}`}>
          <Camera />
          {photo ? '✅ Foto Tersimpan' : '2. Ambil Foto Genset'}
        </label>
        <input 
          id="kamera" type="file" accept="image/*" capture="environment" 
          className="hidden" onChange={handlePhoto} 
        />
      </div>

      {photoUrl && (
        <img src={photoUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-zinc-700" />
      )}

      <button 
        onClick={handleSubmit} disabled={!location || !photo || loading}
        className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send />
        {loading ? 'Mengirim Data...' : 'Kirim Laporan'}
      </button>
    </div>
  );
}