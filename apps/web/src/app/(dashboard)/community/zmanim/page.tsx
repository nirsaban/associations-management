'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Sunrise, Sun, Sunset, Moon, Star, Flame, BookOpen, Loader2, RefreshCw, MapPin } from 'lucide-react';

// Hebcal city geonameids — popular Israeli cities
const CITIES: { id: number; name: string }[] = [
  { id: 281184, name: 'ירושלים' },
  { id: 293397, name: 'תל אביב' },
  { id: 295721, name: 'יפו' },
  { id: 294071, name: 'חיפה' },
  { id: 295530, name: 'באר שבע' },
  { id: 293703, name: 'נתניה' },
  { id: 294421, name: 'אשדוד' },
  { id: 295629, name: 'בני ברק' },
  { id: 294801, name: 'אילת' },
  { id: 294117, name: 'הרצליה' },
  { id: 293222, name: 'צפת' },
  { id: 293918, name: 'טבריה' },
];

interface ZmanimResponse {
  date: string;
  location: { title: string };
  times: {
    chatzotNight?: string;
    alotHaShachar?: string;
    misheyakir?: string;
    misheyakirMachmir?: string;
    dawn?: string;
    sunrise?: string;
    sofZmanShmaMGA?: string;
    sofZmanShma?: string;
    sofZmanTfillaMGA?: string;
    sofZmanTfilla?: string;
    chatzot?: string;
    minchaGedola?: string;
    minchaKetana?: string;
    plagHaMincha?: string;
    sunset?: string;
    beinHaShmashos?: string;
    tzeit7083deg?: string;
    tzeit85deg?: string;
    tzeit42min?: string;
    tzeit50min?: string;
    tzeit72min?: string;
  };
}

interface ShabbatItem {
  title: string;
  date: string;
  category: string;
  hebrew?: string;
  leyning?: { torah?: string; haftarah?: string };
}

interface ShabbatResponse {
  title: string;
  location: { title: string };
  items: ShabbatItem[];
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
}

function formatHebrewDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' });
}

interface TimeRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  time?: string;
  highlight?: boolean;
}

function TimeRow({ icon: Icon, label, time, highlight }: TimeRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg ${highlight ? 'bg-primary/5' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-4 w-4 flex-shrink-0 ${highlight ? 'text-primary' : 'text-on-surface-variant'}`} />
        <span className={`text-body-sm ${highlight ? 'font-medium text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
      </div>
      <span className={`text-body-sm tabular-nums ${highlight ? 'font-bold text-primary' : 'text-on-surface'}`} dir="ltr">
        {formatTime(time)}
      </span>
    </div>
  );
}

export default function ZmanimPage() {
  const [cityId, setCityId] = useState<number>(() => {
    if (typeof window === 'undefined') return CITIES[0].id;
    const saved = localStorage.getItem('zmanim_city');
    return saved ? parseInt(saved, 10) : CITIES[0].id;
  });
  const [zmanim, setZmanim] = useState<ZmanimResponse | null>(null);
  const [shabbat, setShabbat] = useState<ShabbatResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (geo: number) => {
    setLoading(true);
    setError(null);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const [zRes, sRes] = await Promise.all([
        fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${geo}&date=${todayIso}`),
        fetch(`https://www.hebcal.com/shabbat?cfg=json&geonameid=${geo}&M=on&lg=h`),
      ]);
      if (!zRes.ok || !sRes.ok) throw new Error('שגיאה בטעינת הזמנים');
      const zData: ZmanimResponse = await zRes.json();
      const sData: ShabbatResponse = await sRes.json();
      setZmanim(zData);
      setShabbat(sData);
    } catch (err) {
      setError((err as Error).message || 'לא הצלחנו לטעון את הזמנים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(cityId);
    if (typeof window !== 'undefined') localStorage.setItem('zmanim_city', String(cityId));
  }, [cityId, load]);

  const candleLighting = shabbat?.items.find(i => i.category === 'candles');
  const havdalah = shabbat?.items.find(i => i.category === 'havdalah');
  const parsha = shabbat?.items.find(i => i.category === 'parashat');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* Header + city selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-sm font-headline">זמני היום</h2>
            <p className="text-label-md text-on-surface-variant">
              {zmanim ? formatHebrewDate(zmanim.date) : 'טוען...'} · מקור: Hebcal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-on-surface-variant" />
          <select
            value={cityId}
            onChange={e => setCityId(parseInt(e.target.value, 10))}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
          >
            {CITIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-body-md text-on-surface-variant">טוען זמנים מ-Hebcal...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-body-md text-error mb-4">{error}</p>
          <button
            onClick={() => load(cityId)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-on-surface text-body-sm hover:bg-surface-container-high"
          >
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </button>
        </div>
      )}

      {!loading && !error && zmanim && (
        <>
          {/* Shabbat card — highlighted */}
          {(candleLighting || havdalah || parsha) && (
            <div className="rounded-2xl bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-primary" />
                <h3 className="text-title-md font-headline text-primary">שבת קרובה</h3>
              </div>
              {parsha && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-primary/15">
                  <BookOpen className="h-4 w-4 text-on-surface-variant" />
                  <span className="text-body-md font-medium text-on-surface">
                    {parsha.hebrew || parsha.title}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {candleLighting && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-body-sm text-on-surface">
                        הדלקת נרות · {formatHebrewDate(candleLighting.date)}
                      </span>
                    </div>
                    <span className="text-body-md font-bold text-on-surface tabular-nums" dir="ltr">
                      {formatTime(candleLighting.date)}
                    </span>
                  </div>
                )}
                {havdalah && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-500" />
                      <span className="text-body-sm text-on-surface">
                        צאת השבת · {formatHebrewDate(havdalah.date)}
                      </span>
                    </div>
                    <span className="text-body-md font-bold text-on-surface tabular-nums" dir="ltr">
                      {formatTime(havdalah.date)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zmanim card */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline/20 p-5 shadow-sm">
            <h3 className="text-title-md font-headline mb-3 flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              זמני היום · {zmanim.location.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
              <TimeRow icon={Sunrise} label="עלות השחר" time={zmanim.times.alotHaShachar} />
              <TimeRow icon={Sunrise} label="משיכיר" time={zmanim.times.misheyakir} />
              <TimeRow icon={Sun} label="הנץ החמה" time={zmanim.times.sunrise} highlight />
              <TimeRow icon={Sun} label="סוף זמן ק״ש (גר״א)" time={zmanim.times.sofZmanShma} />
              <TimeRow icon={Sun} label="סוף זמן תפילה (גר״א)" time={zmanim.times.sofZmanTfilla} />
              <TimeRow icon={Sun} label="חצות היום" time={zmanim.times.chatzot} highlight />
              <TimeRow icon={Sun} label="מנחה גדולה" time={zmanim.times.minchaGedola} />
              <TimeRow icon={Sun} label="מנחה קטנה" time={zmanim.times.minchaKetana} />
              <TimeRow icon={Sunset} label="פלג המנחה" time={zmanim.times.plagHaMincha} />
              <TimeRow icon={Sunset} label="שקיעת החמה" time={zmanim.times.sunset} highlight />
              <TimeRow icon={Moon} label="צאת הכוכבים (8.5°)" time={zmanim.times.tzeit85deg} />
              <TimeRow icon={Moon} label="צאת הכוכבים (72 דק׳)" time={zmanim.times.tzeit72min} />
            </div>
          </div>
        </>
      )}

      <p className="text-center text-label-md text-on-surface-variant pt-2">
        זמני התפילה מחושבים לפי שיטת הגר״א · נתונים מ-Hebcal.com
      </p>
    </div>
  );
}
