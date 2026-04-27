'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, Trash2, Plus, Minus, Upload, Loader2 } from 'lucide-react';
import { SECTION_DEFINITIONS } from './SectionLibrary';
import api from '@/lib/api';

interface Section {
  id: string;
  type: string;
  data: Record<string, unknown>;
  visible: boolean;
  position: number;
}

interface SectionPropertiesProps {
  section: Section;
  onUpdate: (data: Record<string, unknown>) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function SectionProperties({ section, onUpdate, onToggleVisibility, onDelete, onClose }: SectionPropertiesProps) {
  const def = SECTION_DEFINITIONS.find(d => d.type === section.type);

  // Local state so typing is instant; debounce saves to server
  const [localData, setLocalData] = useState<Record<string, unknown>>(section.data);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Sync from server when switching sections
  useEffect(() => {
    setLocalData(section.data);
  }, [section.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = useCallback((key: string, value: unknown) => {
    setLocalData(prev => {
      const next = { ...prev, [key]: value };
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdateRef.current(next), 500);
      return next;
    });
  }, []);

  // Flush on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline/20">
        <h3 className="text-title-sm font-headline">{def?.label || section.type}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-container"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common actions */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleVisibility} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-body-sm ${section.visible ? 'bg-surface-container text-on-surface' : 'bg-error/10 text-error'}`}>
            {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {section.visible ? 'מוצג' : 'מוסתר'}
          </button>
          <button onClick={onDelete} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-body-sm text-error hover:bg-error/10">
            <Trash2 className="h-3.5 w-3.5" /> מחק
          </button>
        </div>

        {/* Every section gets an eyebrow field (except hero, marquee, footer which have their own layout) */}
        {section.type !== 'hero' && section.type !== 'marquee' && section.type !== 'footer' && (
          <Field label="כותרת עליונה (eyebrow)" value={(localData.eyebrow as string) || ''} onChange={v => updateField('eyebrow', v)} placeholder="עמותה רשומה · נוסדה 1994" />
        )}

        {/* Type-specific fields */}
        {section.type === 'hero' && <HeroFields data={localData} onChange={updateField} />}
        {section.type === 'marquee' && <MarqueeFields data={localData} onChange={updateField} />}
        {section.type === 'video' && <VideoFields data={localData} onChange={updateField} />}
        {section.type === 'about' && <AboutFields data={localData} onChange={updateField} />}
        {section.type === 'activities' && <ActivitiesFields data={localData} onChange={updateField} />}
        {section.type === 'gallery' && <GalleryFields data={localData} onChange={updateField} />}
        {section.type === 'reviews' && <ReviewsFields data={localData} onChange={updateField} />}
        {section.type === 'stats' && <StatsFields data={localData} onChange={updateField} />}
        {section.type === 'cta_payment' && <CtaPaymentFields data={localData} onChange={updateField} />}
        {section.type === 'join_us' && <JoinUsFields data={localData} onChange={updateField} />}
        {section.type === 'faq' && <FaqFields data={localData} onChange={updateField} />}
        {section.type === 'footer' && <FooterFields data={localData} onChange={updateField} />}
      </div>
    </div>
  );
}

/* ── Shared field components ── */

function Field({ label, value, onChange, placeholder, type = 'text', rows, maxLength, dir }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number; maxLength?: number; dir?: string;
}) {
  const cls = "w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none";
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} maxLength={maxLength} className={`${cls} resize-y`} dir={dir || 'auto'} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={cls} dir={dir || 'auto'} />
      )}
      {maxLength && <p className="text-[10px] text-on-surface-variant mt-0.5">{value.length}/{maxLength}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-outline/30" />
      <span className="text-body-sm">{label}</span>
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return <div className="pt-2 pb-1 text-label-sm text-on-surface-variant font-medium border-t border-outline/10 mt-2">{label}</div>;
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/landing/assets', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.data.url);
    } catch {
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      {value && (
        <div className="relative mb-2 rounded-lg overflow-hidden border border-outline/20">
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <button onClick={() => onChange('')} className="absolute top-1 left-1 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">X</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline/30 text-body-sm hover:bg-surface-container disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'מעלה...' : 'העלה תמונה'}
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleUpload} className="hidden" />
      </div>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="או הדביקו URL..." className="w-full mt-2 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="ltr" />
    </div>
  );
}

/* ── 1. HERO — matches Live Prototype structure ── */
function HeroFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const stats = (data.stats as Array<Record<string, string>>) || [];
  const addStat = () => onChange('stats', [...stats, { value: '', label: '' }]);
  const updateStat = (i: number, field: string, value: string) => {
    const updated = [...stats]; updated[i] = { ...updated[i], [field]: value }; onChange('stats', updated);
  };
  const removeStat = (i: number) => onChange('stats', stats.filter((_, idx) => idx !== i));

  return (
    <>
      <Divider label="פס מטה (meta)" />
      <Field label="טקסט פיל" value={(data.pill_text as string) || ''} onChange={v => onChange('pill_text', v)} placeholder="פעיל · קמפיין פתוח" />
      <Field label="טקסט מאז" value={(data.since_text as string) || ''} onChange={v => onChange('since_text', v)} placeholder="עמותה רשומה · נוסדה 1994" />

      <Divider label="כותרת" />
      <Field label="כותרת ראשית" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} maxLength={80} placeholder="דרך שקטה לתת כתף" />
      <Field label="אינדקס מילה מודגשת (זהב)" value={String(data.accent_word_index ?? '')} onChange={v => onChange('accent_word_index', v === '' ? undefined : Number(v))} type="number" placeholder="2" />
      <Field label="תת-כותרת" value={(data.subheadline as string) || ''} onChange={v => onChange('subheadline', v)} rows={2} maxLength={200} />

      <Divider label="כפתור ראשי" />
      <Field label="טקסט כפתור" value={(data.cta_label as string) || ''} onChange={v => onChange('cta_label', v)} maxLength={24} placeholder="תרמו עכשיו →" />
      <Select label="פעולת כפתור" value={(data.cta_action as string) || 'payment'} onChange={v => onChange('cta_action', v)}
        options={[{ value: 'payment', label: 'תרומה (קישור תשלום)' }, { value: 'link', label: 'קישור חיצוני' }, { value: 'scroll', label: 'גלילה למטה' }]} />
      {data.cta_action === 'link' && <Field label="כתובת קישור" value={(data.cta_target as string) || ''} onChange={v => onChange('cta_target', v)} placeholder="https://..." dir="ltr" />}

      <Divider label="כפתור משני (אופציונלי)" />
      <Field label="טקסט כפתור משני" value={(data.secondary_cta_label as string) || ''} onChange={v => onChange('secondary_cta_label', v)} maxLength={24} placeholder="צפו בסיפור שלנו" />
      <Field label="יעד כפתור משני" value={(data.secondary_cta_target as string) || ''} onChange={v => onChange('secondary_cta_target', v)} placeholder="#story" dir="ltr" />

      <Divider label="נתונים (hero stats)" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant font-medium">נתונים ({stats.length})</span>
          <button onClick={addStat} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף</button>
        </div>
        {stats.map((s, i) => (
          <div key={i} className="border border-outline/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant">נתון {i + 1}</span>
              <button onClick={() => removeStat(i)} className="text-error hover:text-error/80"><Minus className="h-3 w-3" /></button>
            </div>
            <Field label="ערך" value={s.value || ''} onChange={v => updateStat(i, 'value', v)} placeholder="140" />
            <Field label="תיאור" value={s.label || ''} onChange={v => updateStat(i, 'label', v)} placeholder="משפחות בשבוע" />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── MARQUEE ── */
function MarqueeFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as string[]) || [];
  const addItem = () => onChange('items', [...items, '']);
  const updateItem = (i: number, value: string) => {
    const updated = [...items]; updated[i] = value; onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant font-medium">מילות מפתח ({items.length})</span>
          <button onClick={addItem} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={item} onChange={e => updateItem(i, e.target.value)} placeholder={`מילה ${i + 1}`}
              className="flex-1 px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm" />
            <button onClick={() => removeItem(i)} className="text-error hover:text-error/80 p-1"><Minus className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 2. VIDEO ── */
function VideoFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} maxLength={80} />
      <Field label="תיאור" value={(data.description as string) || ''} onChange={v => onChange('description', v)} rows={2} maxLength={240} />
      <Field label="כתובת סרטון (YouTube / Vimeo / MP4)" value={(data.source as string) || ''} onChange={v => onChange('source', v)} placeholder="https://youtube.com/watch?v=..." dir="ltr" />
    </>
  );
}

/* ── 3. ABOUT — color-block layout with badge ── */
function AboutFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} maxLength={80} />
      <Field label="תוכן (HTML/Markdown)" value={(data.body_rich_text as string) || ''} onChange={v => onChange('body_rich_text', v)} rows={6} />
      <Divider label="תמונה צדדית" />
      <ImageUpload label="תמונה צדדית" value={(data.side_image as string) || ''} onChange={v => onChange('side_image', v)} />
      <Field label="טקסט חלופי" value={(data.side_image_alt as string) || ''} onChange={v => onChange('side_image_alt', v)} />
      <Field label="טקסט תג (badge)" value={(data.badge_text as string) || ''} onChange={v => onChange('badge_text', v)} placeholder="מאז 1994" />
    </>
  );
}

/* ── 4. ACTIVITIES ── */
function ActivitiesFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];

  const addItem = () => onChange('items', [...items, { title: '', description: '', image: '', image_alt: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: value }; onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant font-medium">פעילויות ({items.length})</span>
          <button onClick={addItem} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-surface-container space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-label-sm font-medium">פעילות {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-error text-[11px] flex items-center gap-1"><Minus className="h-3 w-3" /> הסר</button>
            </div>
            <Field label="שם" value={item.title || ''} onChange={v => updateItem(i, 'title', v)} maxLength={60} />
            <Field label="תיאור" value={item.description || ''} onChange={v => updateItem(i, 'description', v)} rows={2} maxLength={200} />
            <ImageUpload label="תמונה" value={item.image || ''} onChange={v => updateItem(i, 'image', v)} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 5. GALLERY ── */
function GalleryFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const images = (data.images as Array<Record<string, string>>) || [];
  const addImage = () => onChange('images', [...images, { url: '', alt: '' }]);
  const updateImage = (i: number, field: string, value: string) => {
    const updated = [...images]; updated[i] = { ...updated[i], [field]: value }; onChange('images', updated);
  };
  const removeImage = (i: number) => onChange('images', images.filter((_, idx) => idx !== i));

  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant font-medium">תמונות ({images.length})</span>
          <button onClick={addImage} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף תמונה</button>
        </div>
        {images.map((img, i) => (
          <div key={i} className="p-3 rounded-lg bg-surface-container space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-label-sm font-medium">תמונה {i + 1}</span>
              <button onClick={() => removeImage(i)} className="text-error text-[11px] flex items-center gap-1"><Minus className="h-3 w-3" /> הסר</button>
            </div>
            <ImageUpload label="" value={img.url || ''} onChange={v => updateImage(i, 'url', v)} />
            <Field label="תיאור תמונה" value={img.alt || ''} onChange={v => updateImage(i, 'alt', v)} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 6. REVIEWS ── */
function ReviewsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} placeholder="הקהילה, על הקהילה." />
      <Field label="טקסט מצב ריק" value={(data.empty_text as string) || ''} onChange={v => onChange('empty_text', v)} placeholder="היו הראשונים להשאיר הודעה." />
      <Field label="טקסט כפתור ביקורת" value={(data.cta_text as string) || ''} onChange={v => onChange('cta_text', v)} placeholder="השאירו ביקורת שלכם" />
      <p className="text-[11px] text-on-surface-variant">ביקורות נשלפות אוטומטית מטבלת reviews (מאושרות בלבד)</p>
    </>
  );
}

/* ── 7. STATS ── */
function StatsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const addItem = () => onChange('items', [...items, { value: '', label: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: value }; onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-on-surface-variant font-medium">נתונים ({items.length}/5)</span>
        {items.length < 5 && <button onClick={addItem} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף</button>}
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item.value || ''} onChange={e => updateItem(i, 'value', e.target.value)} placeholder="140" className="w-24 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="ltr" />
          <input value={item.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="משפחות כל שבוע" className="flex-1 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="auto" />
          <button onClick={() => removeItem(i)} className="text-error text-xs">X</button>
        </div>
      ))}
      <p className="text-[10px] text-on-surface-variant">ערכים מספריים יספרו למעלה באנימציה (140, 68%, ₪1,200)</p>
    </div>
  );
}

/* ── 8. CTA PAYMENT ── */
function CtaPaymentFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const amounts = (data.amounts as number[]) || [100, 250, 500, 1000];

  const updateAmount = (i: number, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const updated = [...amounts]; updated[i] = num; onChange('amounts', updated);
  };
  const addAmount = () => onChange('amounts', [...amounts, 0]);
  const removeAmount = (i: number) => onChange('amounts', amounts.filter((_, idx) => idx !== i));

  return (
    <>
      <Field label="כותרת" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} maxLength={80} placeholder="כל שקל — ישר לעבודה." />
      <Field label="תת-כותרת" value={(data.subheadline as string) || ''} onChange={v => onChange('subheadline', v)} rows={2} maxLength={200} />
      <Field label="טקסט כפתור" value={(data.cta_label as string) || ''} onChange={v => onChange('cta_label', v)} placeholder="תרמו" maxLength={24} />

      <Divider label="סכומי תרומה" />
      <div className="space-y-2">
        {amounts.map((amt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">₪</span>
            <input value={amt || ''} onChange={e => updateAmount(i, e.target.value)} type="number" className="w-24 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="ltr" />
            <button onClick={() => removeAmount(i)} className="text-error text-xs">X</button>
          </div>
        ))}
        {amounts.length < 6 && <button onClick={addAmount} className="text-body-sm text-primary hover:underline">+ הוסף סכום</button>}
      </div>
      <Select label="סכום ברירת מחדל" value={String(data.default_amount_index ?? 2)} onChange={v => onChange('default_amount_index', parseInt(v, 10))}
        options={amounts.map((a, i) => ({ value: String(i), label: `₪${a.toLocaleString()}` }))} />
      <Check label='אפשר סכום מותאם (כפתור "אחר")' checked={!!data.allow_custom} onChange={v => onChange('allow_custom', v)} />

      <Divider label="שורת אמון" />
      <Check label="הצג תשלומים (עד 12 תשלומים)" checked={data.installments_hint !== false} onChange={v => onChange('installments_hint', v)} />
      <Check label="הצג קבלה (סעיף 46)" checked={data.receipt_hint !== false} onChange={v => onChange('receipt_hint', v)} />
      <Field label="טקסט סליקה מאובטחת" value={(data.secure_label as string) || ''} onChange={v => onChange('secure_label', v)} placeholder="סליקה מאובטחת" />
    </>
  );
}

/* ── 9. JOIN US ── */
function JoinUsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <Field label="כותרת" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} placeholder="מקום ליד השולחן תמיד פתוח." />
      <Field label="תוכן" value={(data.body as string) || ''} onChange={v => onChange('body', v)} rows={3} />
      <Field label="טקסט כפתור שליחה" value={(data.submit_label as string) || ''} onChange={v => onChange('submit_label', v)} placeholder="שלחו →" />
      <Divider label="מסך הצלחה" />
      <Field label="כותרת הצלחה" value={(data.success_title as string) || ''} onChange={v => onChange('success_title', v)} placeholder="קיבלנו. תודה רבה." />
      <Field label="הודעת הצלחה" value={(data.success_message as string) || ''} onChange={v => onChange('success_message', v)} placeholder="נחזור אליכם תוך מספר ימים." />
    </>
  );
}

/* ── 10. FAQ ── */
function FaqFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const addItem = () => onChange('items', [...items, { question: '', answer: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: value }; onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <>
      <Field label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} placeholder="הנפוצות ביותר." />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant font-medium">שאלות ({items.length})</span>
          <button onClick={addItem} className="flex items-center gap-1 text-body-sm text-primary hover:underline"><Plus className="h-3 w-3" /> הוסף</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-surface-container space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-label-sm font-medium">שאלה {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-error text-[11px] flex items-center gap-1"><Minus className="h-3 w-3" /> הסר</button>
            </div>
            <Field label="שאלה" value={item.question || ''} onChange={v => updateItem(i, 'question', v)} />
            <Field label="תשובה" value={item.answer || ''} onChange={v => updateItem(i, 'answer', v)} rows={3} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 11. FOOTER ── */
function FooterFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <Divider label="כותרת גדולה (footer headline)" />
      <Field label="טקסט ראשי" value={(data.big_text as string) || ''} onChange={v => onChange('big_text', v)} placeholder="לבנות קהילה." />
      <Field label="טקסט מודגש (זהב)" value={(data.big_accent as string) || ''} onChange={v => onChange('big_accent', v)} placeholder="ביחד." />
      <Divider label="תיאור" />
      <Field label="תיאור קצר" value={(data.about as string) || ''} onChange={v => onChange('about', v)} rows={2} placeholder="עמותה קהילתית המשרתת את משפחות השכונה..." />
      <Divider label="כתובת וביקור" />
      <Field label="כותרת עמודת ביקור" value={(data.visit_label as string) || ''} onChange={v => onChange('visit_label', v)} placeholder="ביקור" />
      <Field label="שעות פעילות" value={(data.hours as string) || ''} onChange={v => onChange('hours', v)} placeholder="א׳–ה׳, 9:00–17:00" />
      <Divider label="כותרות עמודות" />
      <Field label="כותרת עמודת קשר" value={(data.contact_label as string) || ''} onChange={v => onChange('contact_label', v)} placeholder="יצירת קשר" />
      <Field label="כותרת עמודת מעקב" value={(data.follow_label as string) || ''} onChange={v => onChange('follow_label', v)} placeholder="עקבו" />
      <Divider label="מידע משפטי" />
      <Field label="מספר עמותה" value={(data.registration_number as string) || ''} onChange={v => onChange('registration_number', v)} placeholder="58-000-000-0" dir="ltr" />
      <Check label="אישור סעיף 46" checked={!!data.section_46} onChange={v => onChange('section_46', v)} />
    </>
  );
}
