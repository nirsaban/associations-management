'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

type CommonProps = {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  maxSelections?: number;
};

type SingleProps = CommonProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = CommonProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type SearchableSelectProps = SingleProps | MultiProps;

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    options,
    placeholder = 'בחר...',
    searchPlaceholder = 'חפש...',
    emptyText = 'אין תוצאות',
    disabled,
    className = '',
    clearable,
  } = props;

  const multiple = props.multiple === true;
  const value = props.value;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selectedValues = useMemo<string[]>(
    () => (multiple ? (value as string[]) : value ? [value as string] : []),
    [multiple, value],
  );

  const valueToOption = useMemo(() => {
    const m = new Map<string, SearchableSelectOption>();
    for (const o of options) m.set(o.value, o);
    return m;
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter(
      (o) =>
        normalize(o.label).includes(q) ||
        (o.sublabel ? normalize(o.sublabel).includes(q) : false),
    );
  }, [options, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const atMax =
    multiple &&
    typeof props.maxSelections === 'number' &&
    selectedValues.length >= props.maxSelections;

  const toggleOption = useCallback(
    (opt: SearchableSelectOption) => {
      if (opt.disabled) return;
      if (multiple) {
        const set = new Set(selectedValues);
        if (set.has(opt.value)) {
          set.delete(opt.value);
        } else {
          if (
            typeof props.maxSelections === 'number' &&
            set.size >= props.maxSelections
          ) {
            return;
          }
          set.add(opt.value);
        }
        (props as MultiProps).onChange(Array.from(set));
      } else {
        (props as SingleProps).onChange(opt.value);
        setOpen(false);
        setQuery('');
      }
    },
    [multiple, props, selectedValues],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setQuery('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(filteredOptions.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIdx(filteredOptions.length - 1);
        break;
      case 'Enter': {
        e.preventDefault();
        const opt = filteredOptions[activeIdx];
        if (opt) toggleOption(opt);
        break;
      }
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) (props as MultiProps).onChange([]);
    else (props as SingleProps).onChange('');
  };

  const triggerContent = (() => {
    if (multiple) {
      if (selectedValues.length === 0) {
        return <span className="text-on-surface-variant">{placeholder}</span>;
      }
      if (selectedValues.length <= 2) {
        return (
          <span className="truncate">
            {selectedValues
              .map((v) => valueToOption.get(v)?.label ?? v)
              .join('، ')}
          </span>
        );
      }
      return (
        <span>
          {selectedValues.length} נבחרו
        </span>
      );
    }
    if (!value) return <span className="text-on-surface-variant">{placeholder}</span>;
    return <span className="truncate">{valueToOption.get(value as string)?.label ?? (value as string)}</span>;
  })();

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-outline bg-surface-container text-body-sm text-start focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex-1 truncate">{triggerContent}</span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selectedValues.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="נקה בחירה"
              onClick={clearAll}
              className="p-0.5 rounded hover:bg-surface-container-low text-on-surface-variant"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute top-full inset-x-0 mt-1 z-30 bg-surface rounded-lg shadow-lg border border-outline/30 overflow-hidden">
          <div className="relative border-b border-outline/20">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full pr-8 pl-3 py-2 bg-transparent text-body-sm focus:outline-none"
            />
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-body-sm text-on-surface-variant text-center">
                {emptyText}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const selected = selectedValues.includes(opt.value);
                const isActive = idx === activeIdx;
                const blockedByMax = multiple && !selected && atMax;
                return (
                  <li
                    key={opt.value}
                    data-idx={idx}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={opt.disabled || blockedByMax || undefined}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => !blockedByMax && toggleOption(opt)}
                    className={[
                      'flex items-center justify-between gap-2 px-3 py-2 text-body-sm cursor-pointer',
                      isActive ? 'bg-surface-container-low' : '',
                      selected ? 'text-primary' : '',
                      opt.disabled || blockedByMax ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="truncate text-label-sm text-on-surface-variant" dir="ltr">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {multiple ? (
                      <span
                        className={[
                          'flex items-center justify-center h-4 w-4 rounded border',
                          selected
                            ? 'bg-primary border-primary text-on-primary'
                            : 'border-outline',
                        ].join(' ')}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    ) : (
                      selected && <Check className="h-4 w-4 text-primary" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
