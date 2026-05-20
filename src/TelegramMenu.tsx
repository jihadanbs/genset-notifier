import { useState, useEffect } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';
import { supabase } from './supabase';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
          };
        };
      };
    };
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TelegramMenu() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentStatus = new URLSearchParams(window.location.search).get('status') || 'Menyala';

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
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error(err);
        alert("Failed to get GPS location! Please allow location access!");
      },
      { enableHighAccuracy: true }
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
      alert("⚠️ Please complete the photo and location verification first!");
      return;
    }
    
    setLoading(true);

    try {
      const { data: settings, error: settingsError } = await supabase
        .from('genset_settings')
        .select('latitude, longitude, allowed_radius_meters')
        .eq('name', 'Genset Utama')
        .single();

      if (settingsError || !settings) {
        throw new Error("Failed to fetch generator location rules from database");
      }

      const distance = calculateDistance(
        location.lat,
        location.lng,
        settings.latitude,
        settings.longitude
      );

      const isWithinRadius = distance <= settings.allowed_radius_meters;

      if (!isWithinRadius) {
        alert(`🚨 ACCESS DENIED: CHEATING DETECTED!\n\nYour current distance is ${Math.round(distance)} meters away from the generator. You are allowed to submit reports ONLY within a maximum radius of ${settings.allowed_radius_meters} meters!`);
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams(window.location.search);
      const staffName = queryParams.get('operator') || 'Operator';
      const msgId = queryParams.get('msg_id') || '';
      const userId = '000';

      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${userId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('genset-proofs')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('genset-proofs')
        .getPublicUrl(fileName);

      const { error: logError } = await supabase
        .from('genset_logs')
        .insert([
          {
            operator_name: staffName,
            telegram_user_id: userId,
            status: currentStatus,
            latitude: location.lat,
            longitude: location.lng,
            distance_meters: parseFloat(distance.toFixed(2)),
            photo_url: publicUrl,
            is_verified: true
          }
        ]);

      if (logError) throw logError;

      await fetch('/api/send-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: staffName,
          status: currentStatus,
          distance: Math.round(distance),
          photoUrl: publicUrl,
          msgId: msgId
        })
      });

      alert(`✅ SUCCESS!\n\nReport verified and submitted successfully. Distance: ${Math.round(distance)}m to the target location`);
      
      setTimeout(() => {
        window.Telegram?.WebApp?.close();
      }, 1500);

    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(error);
      alert(`❌ ERROR: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-5 flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Laporan Aktivitas</h1>
        <p className="text-zinc-500 text-sm mt-1">Status Laporan: <span className="text-purple-400 font-bold uppercase">{currentStatus}</span></p>
      </div>

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
        {loading ? 'Mengirim Data...' : `Kirim Laporan (${currentStatus})`}
      </button>
    </div>
  );
}