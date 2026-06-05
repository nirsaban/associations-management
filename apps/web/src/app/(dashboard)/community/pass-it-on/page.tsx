'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Plus, Search, Upload, Loader2, X, MapPin, Phone, Tag, Trash2, Check,
  Sofa, Refrigerator, UtensilsCrossed, Shirt, Baby, BookOpen, Package, Image as ImageIcon,
} from 'lucide-react';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect';

type Status = 'AVAILABLE' | 'RESERVED' | 'TAKEN';
type Category = 'FURNITURE' | 'APPLIANCE' | 'KITCHEN' | 'CLOTHING' | 'BABY' | 'BOOKS' | 'OTHER';

interface User {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  images: string[];
  location?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  postedBy: User;
  claimedBy?: User | null;
  postedById: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  FURNITURE: 'ריהוט',
  APPLIANCE: 'מוצרי חשמל',
  KITCHEN: 'מטבח וכלי בית',
  CLOTHING: 'ביגוד והנעלה',
  BABY: 'תינוקות וילדים',
  BOOKS: 'ספרים וצעצועים',
  OTHER: 'אחר',
};

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  FURNITURE: Sofa,
  APPLIANCE: Refrigerator,
  KITCHEN: UtensilsCrossed,
  CLOTHING: Shirt,
  BABY: Baby,
  BOOKS: BookOpen,
  OTHER: Package,
};

const STATUS_LABELS: Record<Status, string> = {
  AVAILABLE: 'זמין',
  RESERVED: 'שמור למישהו',
  TAKEN: 'נמסר',
};

const STATUS_COLORS: Record<Status, string> = {
  AVAILABLE: 'bg-success/15 text-success-strong',
  RESERVED: 'bg-warning/15 text-warning-strong',
  TAKEN: 'bg-surface-container text-on-surface-variant',
};

export default function PassItOnPage() {
  const { user: me } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | ''>('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (search.trim()) params.q = search.trim();
      const res = await api.get<{ data: Item[] }>('/community/pass-it-on', { params });
      setItems(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h2 className="text-headline-sm font-headline">למסירה</h2>
          <p className="text-label-md text-on-surface-variant">חפצים וריהוט שאפשר למסור — בקהילה</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          פרסם פריט
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי תיאור / מיקום"
            className="w-full ps-3 pe-9 py-2 rounded-lg border border-outline/30 bg-surface text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
        </div>
        <div className="min-w-[180px]">
          <SearchableSelect
            value={category}
            onChange={v => setCategory(v as Category | '')}
            clearable
            placeholder="כל הקטגוריות"
            searchPlaceholder="חפש קטגוריה..."
            options={(Object.keys(CATEGORY_LABELS) as Category[]).map<SearchableSelectOption>(c => ({
              value: c,
              label: CATEGORY_LABELS[c],
            }))}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-on-surface-variant mx-auto mb-3 opacity-50" />
          <p className="text-body-md text-on-surface-variant mb-3">אין פריטים כרגע</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-body-sm text-primary hover:underline"
          >
            היה הראשון לפרסם פריט →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && me && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {/* Details modal */}
      {selectedItem && me && (
        <DetailsModal
          item={selectedItem}
          isOwner={selectedItem.postedById === me.id}
          isAdmin={me.systemRole === 'ADMIN'}
          onClose={() => setSelectedItem(null)}
          onUpdated={() => { setSelectedItem(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Item Card ──────────────────────────────────────────────────

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const Icon = CATEGORY_ICONS[item.category];
  const isTaken = item.status === 'TAKEN';

  return (
    <button
      onClick={onClick}
      className={`text-start rounded-2xl border border-outline/20 bg-surface-container-lowest overflow-hidden hover:shadow-md transition-all ${isTaken ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-surface-container relative">
        {item.images[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-12 w-12 text-on-surface-variant opacity-40" />
          </div>
        )}
        <span className={`absolute top-2 start-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant mb-1">
          <Icon className="h-3.5 w-3.5" />
          <span>{CATEGORY_LABELS[item.category]}</span>
          {item.location && (
            <>
              <span className="opacity-40">·</span>
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </>
          )}
        </div>
        <h3 className="text-body-md font-medium text-on-surface line-clamp-1 mb-1">{item.title}</h3>
        <p className="text-label-md text-on-surface-variant line-clamp-2">{item.description}</p>
      </div>
    </button>
  );
}

// ─── Create Modal ──────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'FURNITURE' as Category,
    location: '',
    contactPhone: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 6) {
      setError('עד 6 תמונות לפריט');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<{ data: { url: string } }>('/community/pass-it-on/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages(prev => [...prev, res.data.data.url]);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    setError(null);
    if (form.title.trim().length < 2) { setError('כותרת חייבת לפחות 2 תווים'); return; }
    if (form.description.trim().length < 5) { setError('תיאור חייב לפחות 5 תווים'); return; }
    setSubmitting(true);
    try {
      await api.post('/community/pass-it-on', {
        ...form,
        images,
        location: form.location || undefined,
        contactPhone: form.contactPhone || undefined,
      });
      onCreated();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה בפרסום הפריט');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="פרסום פריט חדש" onClose={onClose}>
      <div className="space-y-3">
        {error && <div className="p-2 rounded-lg bg-error/10 text-error text-body-sm">{error}</div>}

        <FormField label="כותרת" required>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="לדוגמה: מקרר במצב מעולה"
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
        </FormField>

        <FormField label="תיאור" required>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="גודל, מצב, פרטים חשובים, האם צריך הובלה..."
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none resize-y"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="קטגוריה" required>
            <SearchableSelect
              value={form.category}
              onChange={v => setForm(f => ({ ...f, category: v as Category }))}
              placeholder="בחר קטגוריה..."
              searchPlaceholder="חפש קטגוריה..."
              options={(Object.keys(CATEGORY_LABELS) as Category[]).map<SearchableSelectOption>(c => ({
                value: c,
                label: CATEGORY_LABELS[c],
              }))}
            />
          </FormField>
          <FormField label="עיר/שכונה">
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="בני ברק"
              className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </FormField>
        </div>

        <FormField label="טלפון לקשר (אם שונה מהטלפון שלך)">
          <input
            value={form.contactPhone}
            onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
            placeholder="0501234567"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
        </FormField>

        <FormField label={`תמונות (${images.length}/6)`}>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline/20">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0.5 start-0.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {images.length < 6 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline/30 text-body-sm hover:bg-surface-container disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'מעלה...' : 'העלה תמונה'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} className="hidden" />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-outline/10">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-body-sm hover:bg-surface-container"
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || uploading}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'מפרסם...' : 'פרסם פריט'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Details Modal ──────────────────────────────────────────────

function DetailsModal({
  item,
  isOwner,
  isAdmin,
  onClose,
  onUpdated,
}: {
  item: Item;
  isOwner: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [imageIdx, setImageIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const Icon = CATEGORY_ICONS[item.category];

  const action = async (path: string, method: 'post' | 'patch' | 'delete') => {
    setBusy(true);
    try {
      if (method === 'post') await api.post(`/community/pass-it-on/${item.id}/${path}`);
      else if (method === 'patch') await api.patch(`/community/pass-it-on/${item.id}/${path}`);
      else await api.delete(`/community/pass-it-on/${item.id}`);
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const contactPhone = item.contactPhone || item.postedBy.phone;

  return (
    <ModalShell title={item.title} onClose={onClose} wide>
      {/* Image gallery */}
      <div className="aspect-[4/3] bg-surface-container rounded-xl overflow-hidden mb-4 relative">
        {item.images.length > 0 ? (
          <>
            <img src={item.images[imageIdx]} alt={item.title} className="w-full h-full object-contain" />
            {item.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {item.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === imageIdx ? 'bg-white w-6' : 'bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-on-surface-variant opacity-30" />
          </div>
        )}
      </div>

      {/* Status + category */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-label-md font-medium ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-label-md text-on-surface-variant">
          <Icon className="h-3.5 w-3.5" />
          {CATEGORY_LABELS[item.category]}
        </span>
        {item.location && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-label-md text-on-surface-variant">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
        )}
      </div>

      <p className="text-body-md whitespace-pre-wrap mb-4">{item.description}</p>

      {/* Poster info + contact */}
      <div className="rounded-xl bg-surface-container p-3 mb-4">
        <p className="text-label-sm text-on-surface-variant mb-1">פרסם:</p>
        <p className="text-body-md font-medium">{item.postedBy.fullName}</p>
        {contactPhone && (
          <a
            href={`https://wa.me/972${contactPhone.replace(/^\+972|^0/, '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-success/10 text-success-strong text-body-sm hover:bg-success/20"
          >
            <Phone className="h-3.5 w-3.5" />
            <span dir="ltr">{contactPhone}</span>
          </a>
        )}
      </div>

      {/* Claimed by */}
      {item.claimedBy && (
        <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 mb-4">
          <p className="text-label-sm text-on-surface-variant mb-1">שמור עבור:</p>
          <p className="text-body-md font-medium">{item.claimedBy.fullName}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 mt-2 border-t border-outline/10">
        {!isOwner && item.status === 'AVAILABLE' && (
          <button
            disabled={busy}
            onClick={() => action('claim', 'post')}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Tag className="h-4 w-4" />
            שמור לי
          </button>
        )}
        {!isOwner && item.status === 'RESERVED' && item.claimedBy && (
          <button
            disabled={busy}
            onClick={() => action('release', 'post')}
            className="flex-1 px-4 py-2 rounded-lg bg-surface-container text-on-surface text-body-sm hover:bg-surface-container-high disabled:opacity-50"
          >
            שחרר את השמירה
          </button>
        )}
        {isOwner && item.status !== 'TAKEN' && (
          <>
            <button
              disabled={busy}
              onClick={() => action('taken', 'patch')}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              סמן כנמסר
            </button>
            {item.status === 'RESERVED' && (
              <button
                disabled={busy}
                onClick={() => action('release', 'post')}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-body-sm hover:bg-surface-container-high disabled:opacity-50"
              >
                בטל שמירה
              </button>
            )}
          </>
        )}
        {(isOwner || isAdmin) && (
          <button
            disabled={busy}
            onClick={() => {
              if (confirm('למחוק את הפריט?')) action('', 'delete');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error/10 text-error text-body-sm hover:bg-error/20 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            מחק
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Shared modal shell + form field ───────────────────────────

function ModalShell({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
          <h3 className="text-title-md font-headline truncate">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-container">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  );
}
