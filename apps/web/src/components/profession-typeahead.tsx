'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfessionOption {
  id: string;
  nameHe: string;
  category: { id: string; nameHe: string };
}

interface CatalogCategory {
  id: string;
  nameHe: string;
  professions: ProfessionOption[];
}

interface Props {
  mode: 'single' | 'multi';
  value: ProfessionOption | ProfessionOption[] | null;
  onChange: (value: ProfessionOption | ProfessionOption[] | null) => void;
  placeholder?: string;
  excludeIds?: string[];
  maxItems?: number;
}

// ---------------------------------------------------------------------------
// Module-level catalog cache shared between all instances
// ---------------------------------------------------------------------------

let cachedCatalog: ProfessionOption[] | null = null;
let catalogLoading = false;
const catalogListeners: Array<(catalog: ProfessionOption[]) => void> = [];

async function loadCatalog(): Promise<ProfessionOption[]> {
  if (cachedCatalog) return cachedCatalog;

  if (catalogLoading) {
    return new Promise((resolve) => {
      catalogListeners.push(resolve);
    });
  }

  catalogLoading = true;
  try {
    const res = await api.get<{ data: CatalogCategory[] }>('/professions');
    const categories: CatalogCategory[] = res.data.data ?? [];
    const flat: ProfessionOption[] = categories.flatMap((cat) =>
      (cat.professions ?? []).map((p) => ({
        id: p.id,
        nameHe: p.nameHe,
        category: { id: cat.id, nameHe: cat.nameHe },
      })),
    );
    cachedCatalog = flat;
    catalogListeners.forEach((cb) => cb(flat));
    catalogListeners.length = 0;
    return flat;
  } catch {
    catalogLoading = false;
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function filterCatalog(
  catalog: ProfessionOption[],
  query: string,
  excludeIds: string[],
): ProfessionOption[] {
  const q = normalizeQuery(query);
  return catalog.filter((p) => {
    if (excludeIds.includes(p.id)) return false;
    if (!q) return true;
    return (
      p.nameHe.toLowerCase().includes(q) ||
      p.category.nameHe.toLowerCase().includes(q)
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfessionTypeahead({
  mode,
  value,
  onChange,
  placeholder = 'חפש מקצוע...',
  excludeIds = [],
  maxItems = 3,
}: Props) {
  const inputId = useId();
  const listboxId = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<ProfessionOption[]>(cachedCatalog ?? []);
  const [options, setOptions] = useState<ProfessionOption[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // Derive current selection as array for easier handling
  const selected: ProfessionOption[] =
    mode === 'single'
      ? value && !Array.isArray(value)
        ? [value]
        : []
      : Array.isArray(value)
        ? value
        : [];

  // All IDs to exclude from the dropdown
  const excludedAll = [...excludeIds, ...selected.map((p) => p.id)];

  // Load catalog on mount (idle callback or immediate)
  useEffect(() => {
    if (cachedCatalog) {
      setCatalog(cachedCatalog);
      return;
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as unknown as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
        loadCatalog().then(setCatalog);
      });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as unknown as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
        }
      };
    } else {
      loadCatalog().then(setCatalog);
    }
  }, []);

  // Recompute options when query, catalog or exclusions change.
  // We render ALL matching options — the dropdown is scrollable, so showing
  // every profession the user typed against is preferable to silently
  // truncating to a small cap.
  useEffect(() => {
    const filtered = filterCatalog(catalog, query, excludedAll);
    setOptions(filtered);
    setActiveIdx(-1);

    // If we have no local matches and there is a query, try remote search
    if (filtered.length === 0 && query.trim().length >= 2) {
      setLoadingRemote(true);
      api
        .get<{ data: ProfessionOption[] }>(`/professions/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          const remote = (res.data.data ?? []).filter(
            (p) => !excludedAll.includes(p.id),
          );
          setOptions(remote);
        })
        .catch(() => {})
        .finally(() => setLoadingRemote(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, catalog, excludeIds.join(','), selected.map((p) => p.id).join(',')]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = useCallback(() => {
    if (!open) {
      setOpen(true);
      // Load catalog on first focus if not yet loaded
      if (!cachedCatalog) loadCatalog().then(setCatalog);
    }
  }, [open]);

  const selectOption = useCallback(
    (opt: ProfessionOption) => {
      if (mode === 'single') {
        onChange(opt);
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      } else {
        if (selected.length >= maxItems) return;
        const next = [...selected, opt];
        onChange(next);
        setQuery('');
        inputRef.current?.focus();
      }
    },
    [mode, onChange, selected, maxItems],
  );

  const removePill = useCallback(
    (id: string) => {
      const next = selected.filter((p) => p.id !== id);
      onChange(next.length === 0 ? null : next);
    },
    [onChange, selected],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, options.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0 && options[activeIdx]) {
          selectOption(options[activeIdx]);
        }
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        setOpen(false);
        setQuery('');
      } else if (
        e.key === 'Backspace' &&
        query === '' &&
        mode === 'multi' &&
        selected.length > 0
      ) {
        removePill(selected[selected.length - 1].id);
      }
    },
    [activeIdx, options, query, mode, selected, selectOption, removePill],
  );

  const canAddMore = mode === 'single' ? selected.length === 0 : selected.length < maxItems;
  const displayValue =
    mode === 'single' && selected.length === 1 && !open
      ? selected[0].nameHe
      : query;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Multi mode: pills row */}
      {mode === 'multi' && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((pill) => (
            <span
              key={pill.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm"
            >
              {pill.nameHe}
              <button
                type="button"
                aria-label={`הסר ${pill.nameHe}`}
                onClick={() => removePill(pill.id)}
                className="text-primary/70 hover:text-primary leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined
        }
        type="text"
        className={`w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
          !canAddMore ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        placeholder={
          mode === 'single' && selected.length === 1 ? selected[0].nameHe : placeholder
        }
        disabled={!canAddMore}
        value={displayValue}
        onFocus={openDropdown}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        dir="rtl"
      />

      {/* Dropdown */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-outline bg-surface shadow-lg max-h-64 overflow-y-auto animate-fade-in text-right"
          dir="rtl"
        >
          {loadingRemote && (
            <li className="px-3 py-2 text-body-sm text-on-surface-variant">
              מחפש...
            </li>
          )}
          {!loadingRemote && options.length === 0 && (
            <li className="px-3 py-2 text-body-sm text-on-surface-variant">
              לא נמצאו תוצאות
            </li>
          )}
          {options.map((opt, idx) => (
            <li
              key={opt.id}
              id={`${listboxId}-opt-${idx}`}
              role="option"
              aria-selected={selected.some((s) => s.id === opt.id)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click
                selectOption(opt);
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-body-md transition-colors ${
                idx === activeIdx
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-surface-container'
              }`}
            >
              <span className="text-on-surface-variant/60 text-label-sm me-2 shrink-0">
                {opt.category.nameHe}
              </span>
              <span className="font-medium truncate">{opt.nameHe}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
