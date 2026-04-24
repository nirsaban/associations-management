'use client';

import React from 'react';
import { X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { SECTION_DEFINITIONS } from './SectionLibrary';

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

  const updateField = (key: string, value: unknown) => {
    onUpdate({ ...section.data, [key]: value });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline/20">
        <h3 className="text-title-sm font-headline">{def?.label || section.type}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-container">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVisibility}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-body-sm ${
              section.visible ? 'bg-surface-container text-on-surface' : 'bg-error/10 text-error'
            }`}
          >
            {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {section.visible ? 'מוצג' : 'מוסתר'}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-body-sm text-error hover:bg-error/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            מחק
          </button>
        </div>

        {/* Type-specific fields */}
        {section.type === 'hero' && (
          <HeroFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'video' && (
          <VideoFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'about' && (
          <AboutFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'activities' && (
          <ActivitiesFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'stats' && (
          <StatsFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'cta_payment' && (
          <CtaPaymentFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'join_us' && (
          <JoinUsFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'faq' && (
          <FaqFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'footer' && (
          <FooterFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'reviews' && (
          <ReviewsFields data={section.data} onChange={updateField} />
        )}
        {section.type === 'gallery' && (
          <GalleryFields data={section.data} onChange={updateField} />
        )}
      </div>
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────

function PropField({ label, value, onChange, type = 'text', rows, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30 resize-y"
          dir="auto"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30"
          dir="auto"
        />
      )}
    </div>
  );
}

function PropSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PropCheck({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      <span className="text-body-sm">{label}</span>
    </label>
  );
}

// ─── Section-specific field groups ─────────────────────────────

function HeroFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} />
      <PropField label="תת-כותרת" value={(data.subheadline as string) || ''} onChange={v => onChange('subheadline', v)} rows={2} />
      <PropField label="טקסט כפתור" value={(data.cta_label as string) || ''} onChange={v => onChange('cta_label', v)} />
      <PropSelect
        label="פעולת כפתור"
        value={(data.cta_action as string) || 'payment'}
        onChange={v => onChange('cta_action', v)}
        options={[
          { value: 'payment', label: 'תרומה' },
          { value: 'scroll', label: 'גלילה למטה' },
          { value: 'external', label: 'קישור חיצוני' },
        ]}
      />
      {(data.cta_action === 'external') && (
        <PropField label="כתובת קישור" value={(data.cta_target as string) || ''} onChange={v => onChange('cta_target', v)} placeholder="https://..." />
      )}
    </>
  );
}

function VideoFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <PropField label="תיאור" value={(data.description as string) || ''} onChange={v => onChange('description', v)} rows={2} />
      <PropSelect
        label="מקור"
        value={(data.source as string) || 'youtube'}
        onChange={v => onChange('source', v)}
        options={[
          { value: 'youtube', label: 'YouTube' },
          { value: 'vimeo', label: 'Vimeo' },
        ]}
      />
      <PropField label="כתובת הסרטון" value={(data.url_or_asset_id as string) || ''} onChange={v => onChange('url_or_asset_id', v)} placeholder="https://youtube.com/watch?v=..." />
      <PropCheck label="הפעלה אוטומטית" checked={!!data.autoplay} onChange={v => onChange('autoplay', v)} />
      <PropCheck label="ללא קול" checked={!!data.muted} onChange={v => onChange('muted', v)} />
    </>
  );
}

function AboutFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <PropField label="תוכן" value={(data.body_rich_text as string) || ''} onChange={v => onChange('body_rich_text', v)} rows={5} />
    </>
  );
}

function ActivitiesFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];

  const addItem = () => {
    onChange('items', [...items, { title: '', description: '', icon: '' }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange('items', updated);
  };

  const removeItem = (index: number) => {
    onChange('items', items.filter((_, i) => i !== index));
  };

  return (
    <>
      <PropField label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <PropField label="הקדמה" value={(data.intro as string) || ''} onChange={v => onChange('intro', v)} rows={2} />
      <div className="space-y-3">
        <p className="text-label-sm text-on-surface-variant">פעילויות</p>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-surface-container space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-label-sm">פעילות {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-error text-[11px]">הסר</button>
            </div>
            <PropField label="כותרת" value={item.title || ''} onChange={v => updateItem(i, 'title', v)} />
            <PropField label="תיאור" value={item.description || ''} onChange={v => updateItem(i, 'description', v)} rows={2} />
          </div>
        ))}
        <button onClick={addItem} className="text-body-sm text-primary hover:underline">+ הוסף פעילות</button>
      </div>
    </>
  );
}

function StatsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];

  const addItem = () => onChange('items', [...items, { number: '', label: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <p className="text-label-sm text-on-surface-variant">נתונים</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item.number || ''} onChange={e => updateItem(i, 'number', e.target.value)} placeholder="1,200" className="w-24 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="ltr" />
          <input value={item.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="חברים" className="flex-1 px-2 py-1.5 rounded border border-outline/30 text-body-sm" dir="auto" />
          <button onClick={() => removeItem(i)} className="text-error text-xs">X</button>
        </div>
      ))}
      <button onClick={addItem} className="text-body-sm text-primary hover:underline">+ הוסף נתון</button>
    </div>
  );
}

function CtaPaymentFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} />
      <PropField label="תת-כותרת" value={(data.subheadline as string) || ''} onChange={v => onChange('subheadline', v)} />
      <PropField label="טקסט כפתור" value={(data.button_label as string) || ''} onChange={v => onChange('button_label', v)} />
      <PropCheck label="הצג רמז לתשלומים" checked={!!data.installments_hint} onChange={v => onChange('installments_hint', v)} />
    </>
  );
}

function JoinUsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.headline as string) || ''} onChange={v => onChange('headline', v)} />
      <PropField label="תוכן" value={(data.body as string) || ''} onChange={v => onChange('body', v)} rows={3} />
      <PropField label="הודעת הצלחה" value={(data.success_message as string) || ''} onChange={v => onChange('success_message', v)} />
    </>
  );
}

function FaqFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const items = (data.items as Array<Record<string, string>>) || [];

  const addItem = () => onChange('items', [...items, { q: '', a: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    onChange('items', updated);
  };
  const removeItem = (i: number) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <p className="text-label-sm text-on-surface-variant">שאלות ותשובות</p>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-lg bg-surface-container space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-label-sm">שאלה {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-error text-[11px]">הסר</button>
          </div>
          <PropField label="שאלה" value={item.q || ''} onChange={v => updateItem(i, 'q', v)} />
          <PropField label="תשובה" value={item.a || ''} onChange={v => updateItem(i, 'a', v)} rows={3} />
        </div>
      ))}
      <button onClick={addItem} className="text-body-sm text-primary hover:underline">+ הוסף שאלה</button>
    </div>
  );
}

function FooterFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropCheck label="הצג פרטי קשר" checked={data.show_contact !== false} onChange={v => onChange('show_contact', v)} />
      <PropCheck label="הצג רשתות חברתיות" checked={data.show_social !== false} onChange={v => onChange('show_social', v)} />
      <PropField label="טקסט מותאם" value={(data.custom_text as string) || ''} onChange={v => onChange('custom_text', v)} rows={2} />
    </>
  );
}

function ReviewsFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <>
      <PropField label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
      <PropCheck label="הצג טופס שליחת המלצה" checked={!!data.show_submit_cta} onChange={v => onChange('show_submit_cta', v)} />
    </>
  );
}

function GalleryFields({ data, onChange }: { data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  return (
    <PropField label="כותרת" value={(data.title as string) || ''} onChange={v => onChange('title', v)} />
  );
}
