import { useState, useEffect, useCallback } from 'react';
import { MapPin, Camera, Send, Loader2, CheckCircle2, Navigation, X, AlertTriangle, ShieldX, Info } from 'lucide-react';
import { supabase } from './supabase';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: { id: number; first_name: string };
        };
      };
    };
  }
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

let toastIdCounter = 0;

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <ShieldX size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const TOAST_COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { bg: 'rgba(20,45,30,0.97)', border: 'rgba(74,222,128,0.25)', icon: '#4ade80' },
  error:   { bg: 'rgba(45,15,15,0.97)', border: 'rgba(248,113,113,0.25)', icon: '#f87171' },
  warning: { bg: 'rgba(45,35,10,0.97)', border: 'rgba(251,191,36,0.25)',  icon: '#fbbf24' },
  info:    { bg: 'rgba(15,25,50,0.97)', border: 'rgba(96,165,250,0.25)',  icon: '#60a5fa' },
};

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '360px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const c = TOAST_COLORS[t.type];
        return (
          <div
            key={t.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              pointerEvents: 'all',
              animation: 'toastIn 0.22s ease',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px', display: 'flex' }}>
              {TOAST_ICONS[t.type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#f0f0f0', lineHeight: 1.4 }}>
                {t.title}
              </p>
              {t.message && (
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888', lineHeight: 1.4 }}>
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'none', border: 'none', padding: '0', cursor: 'pointer',
                color: '#555', flexShrink: 0, display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
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

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`,
      { headers: { 'User-Agent': 'GensetReportApp/1.0' } }
    );
    const data = await res.json();
    const addr = data.address;
    const parts = [
      addr.road || addr.pedestrian || addr.footway,
      addr.neighbourhood || addr.suburb || addr.village,
      addr.city || addr.town || addr.county,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

const MAX_DIMENSION = 1024;
const WEBP_QUALITY  = 0.60;
const MAX_SIZE_KB = 300;

async function compressToWebP(file: File): Promise<{ blob: Blob; originalKB: number; compressedKB: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(img, 0, 0, width, height);

      const toBlob = (q: number): Promise<Blob> =>
        new Promise((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error('Gagal mengkonversi gambar ke WebP'))),
            'image/webp',
            q
          )
        );

      try {
        let quality = WEBP_QUALITY;
        let blob = await toBlob(quality);

        while (blob.size / 1024 > MAX_SIZE_KB && quality > 0.30) {
          quality = parseFloat((quality - 0.10).toFixed(2));
          blob = await toBlob(quality);
        }

        resolve({
          blob,
          originalKB: Math.round(file.size / 1024),
          compressedKB: Math.round(blob.size / 1024),
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar!'));
    };

    img.src = objectUrl;
  });
}

export default function TelegramMenu() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const currentStatus = new URLSearchParams(window.location.search).get('status') || 'Menyala';
  const msgId = new URLSearchParams(window.location.search).get('msg_id') || '';
  const [checking, setChecking] = useState(!!msgId);

  useEffect(() => {
    if (window.Telegram?.WebApp) window.Telegram.WebApp.expand();
  }, []);

  useEffect(() => {
    if (!msgId) return;
    supabase
      .from('genset_logs')
      .select('id')
      .eq('telegram_message_id', msgId)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setSubmitted(true);
        setChecking(false);
      });
  }, [msgId]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'GPS tidak didukung', 'Perangkat ini tidak mendukung geolokasi!');
      return;
    }
    setLocLoading(true);
    setAddress(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        const addr = await reverseGeocode(coords.lat, coords.lng);
        setAddress(addr);
        setLocLoading(false);
        showToast('success', 'Lokasi ditemukan', addr);
      },
      (err) => {
        console.error(err);
        showToast('error', 'Gagal mendapatkan GPS', 'Pastikan izin lokasi sudah diaktifkan!');
        setLocLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { blob, originalKB, compressedKB } = await compressToWebP(file);
        const compressed = new File([blob], `photo-${Date.now()}.webp`, { type: 'image/webp' });
        setPhoto(compressed);
        setPhotoUrl(URL.createObjectURL(blob));
        showToast('success', 'Foto tersimpan', `${originalKB} KB → ${compressedKB} KB (WebP)`);
      } catch {
        setPhoto(file);
        setPhotoUrl(URL.createObjectURL(file));
        showToast('warning', 'Foto tersimpan', 'Kompresi gagal, menggunakan foto asli!');
      }
    }
  };

  const handleSubmit = async () => {
    if (!location || !photo) {
      showToast('warning', 'Belum lengkap', 'Lengkapi lokasi GPS dan foto terlebih dahulu!');
      return;
    }
    setLoading(true);
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('genset_settings')
        .select('latitude, longitude, allowed_radius_meters')
        .eq('name', 'Genset Klabat')
        .single();

      if (settingsError || !settings) throw new Error('Gagal mengambil aturan lokasi dari database!');

      const distance = calculateDistance(location.lat, location.lng, settings.latitude, settings.longitude);

      if (distance > settings.allowed_radius_meters) {
        showToast(
          'error',
          'Akses Ditolak',
          `Jarak Anda ${Math.round(distance)}m dari genset. Maks. ${settings.allowed_radius_meters}m.`,
          6000
        );
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams(window.location.search);
      const staffName = queryParams.get('operator') || 'Operator';
      const msgId = queryParams.get('msg_id') || '';
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const userId = tgUser?.id ? String(tgUser.id) : '000';

      const fileName = `${Date.now()}-${userId}.webp`;

      const { error: uploadError } = await supabase.storage.from('genset-proofs').upload(fileName, photo, {
        contentType: 'image/webp',
      });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('genset-proofs').getPublicUrl(fileName);

      const { error: logError } = await supabase.from('genset_logs').insert([{
        operator_name: staffName,
        telegram_user_id: userId,
        telegram_message_id: msgId,
        status: currentStatus,
        latitude: location.lat,
        longitude: location.lng,
        distance_meters: parseFloat(distance.toFixed(2)),
        photo_url: publicUrl,
        is_verified: true,
      }]);
      if (logError) throw logError;

      await fetch('/api/send-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName, status: currentStatus, address: address, photoUrl: publicUrl, msgId }),
      });

      showToast('success', 'Laporan terkirim!', `Jarak terverifikasi: ${Math.round(distance)}m`, 3000);
      setSubmitted(true);
      setLocation(null);
      setAddress(null);
      setPhoto(null);
      setPhotoUrl(null);
      setTimeout(() => window.Telegram?.WebApp?.close(), 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(error);
      showToast('error', 'Terjadi kesalahan', msg, 6000);
    } finally {
      setLoading(false);
    }
  };

  const gpsReady = !!location;
  const photoReady = !!photo;
  const allReady = gpsReady && photoReady;
  const isLocked = submitted || loading;

  if (checking) {
    return (
      <div style={{
        minHeight: '100svh', background: '#0a0a0a', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <Loader2 size={24} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rowStyle = (active: boolean, enabled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: active
      ? '1px solid rgba(74,222,128,0.25)'
      : enabled
        ? '1px solid rgba(255,255,255,0.08)'
        : '1px solid rgba(255,255,255,0.04)',
    background: active
      ? 'rgba(74,222,128,0.07)'
      : enabled
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.02)',
    color: active ? '#86efac' : enabled ? '#ccc' : '#444',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    userSelect: 'none' as const,
  });

  return (
    <div style={{
      minHeight: '100svh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      boxSizing: 'border-box',
    }}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Laporan Aktivitas
        </p>
        <img
          src="/logo-klabat.svg"
          alt="Genset Klabat Logo"
          style={{ height: '64px', objectFit: 'contain', mixBlendMode: 'lighten', filter: 'contrast(1.25) brightness(0.9) drop-shadow(0 2px 4px rgba(0,0,0,0.3))', margin: '0 0 10px', paddingLeft: '12px' }}
        />
        <span style={{
          display: 'inline-block', fontSize: '12px', fontWeight: '500',
          color: '#c4b5fd', background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: '999px',
          padding: '3px 12px', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {currentStatus}
        </span>
      </div>

      {/* Steps */}
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <button onClick={getLocation} disabled={locLoading || isLocked} style={rowStyle(gpsReady, !locLoading && !isLocked)}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {locLoading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : gpsReady ? <CheckCircle2 size={18} /> : <Navigation size={18} />
            }
          </span>
          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
            {locLoading ? 'Mengambil lokasi…' : gpsReady ? 'Lokasi ditemukan' : 'Dapatkan lokasi GPS'}
          </span>
          {!gpsReady && !locLoading && <span style={{ fontSize: '11px', color: '#555' }}>Langkah 1</span>}
        </button>

        {gpsReady && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <MapPin size={14} style={{ color: '#86efac', marginTop: '2px', flexShrink: 0 }} />
            <div>
              {address
                ? <p style={{ margin: 0, fontSize: '12px', color: '#86efac', lineHeight: 1.5 }}>{address}</p>
                : <p style={{ margin: 0, fontSize: '12px', color: '#555', fontStyle: 'italic' }}>Memuat alamat…</p>
              }
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#444' }}>
                {location!.lat.toFixed(6)}, {location!.lng.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        <label htmlFor="kamera" style={rowStyle(photoReady, gpsReady && !isLocked)}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {photoReady ? <CheckCircle2 size={18} /> : <Camera size={18} />}
          </span>
          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
            {photoReady ? 'Foto tersimpan' : 'Ambil foto genset'}
          </span>
          {!gpsReady && <span style={{ fontSize: '11px', color: '#3a3a3a' }}>GPS dulu</span>}
          {gpsReady && !photoReady && <span style={{ fontSize: '11px', color: '#555' }}>Langkah 2</span>}
        </label>
        <input
          id="kamera" type="file" accept="image/*" capture="environment"
          disabled={!gpsReady || isLocked} style={{ display: 'none' }} onChange={handlePhoto}
        />

        {photoUrl && (
          <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
            <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allReady || isLocked}
          style={{
            width: '100%', padding: '15px 18px', borderRadius: '12px', border: 'none',
            background: allReady && !isLocked ? '#7c3aed' : 'rgba(124,58,237,0.18)',
            color: allReady && !isLocked ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: '14px', fontWeight: '600',
            cursor: allReady && !isLocked ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', transition: 'all 0.2s', fontFamily: 'inherit', letterSpacing: '0.01em',
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim data…</>
            : submitted
              ? <><CheckCircle2 size={15} /> Laporan Terkirim</>
              : <><Send size={15} /> Kirim Laporan — {currentStatus}</>
          }
        </button>

        {!gpsReady && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#383838', margin: '4px 0 0', lineHeight: 1.5 }}>
            Ambil lokasi GPS terlebih dahulu untuk melanjutkan
          </p>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginTop: '8px', lineHeight: 1.5 }}>
          Kamera error? Klik <b>titik tiga (⋮)</b> di kanan atas,<br/>lalu pilih <b>Open in Browser</b>.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}