'use client';

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  DEEP_LINK_OPTIONS,
  isValidDeepLink,
  isValidExternalLink,
  isExternalLink,
} from '@/lib/deep-links';

interface DeepLinkPickerProps {
  value: string;
  onChange: (v: string) => void;
}

const CUSTOM_SENTINEL = '__custom__';
const EXTERNAL_SENTINEL = '__external__';

type Mode = 'preset' | 'custom' | 'external';

// Build sorted unique group list preserving order of first appearance
const GROUPS = Array.from(new Set(DEEP_LINK_OPTIONS.map((o) => o.group)));

function initialMode(value: string): Mode {
  if (value === '' || DEEP_LINK_OPTIONS.some((o) => o.value === value)) return 'preset';
  return isExternalLink(value) ? 'external' : 'custom';
}

export default function DeepLinkPicker({ value, onChange }: DeepLinkPickerProps) {
  const [mode, setMode] = useState<Mode>(() => initialMode(value));
  const [customInput, setCustomInput] = useState(initialMode(value) === 'custom' ? value : '');
  const [externalInput, setExternalInput] = useState(
    initialMode(value) === 'external' ? value : '',
  );

  const selectValue =
    mode === 'custom' ? CUSTOM_SENTINEL : mode === 'external' ? EXTERNAL_SENTINEL : value;

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === CUSTOM_SENTINEL) {
      setMode('custom');
      onChange(customInput); // keep whatever was typed before (may be empty)
    } else if (v === EXTERNAL_SENTINEL) {
      setMode('external');
      onChange(externalInput);
    } else {
      setMode('preset');
      setCustomInput('');
      setExternalInput('');
      onChange(v);
    }
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setCustomInput(v);
    onChange(v);
  }

  function handleExternalInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setExternalInput(v);
    onChange(v);
  }

  const customInvalid = mode === 'custom' && !!customInput && !isValidDeepLink(customInput);
  const externalInvalid =
    mode === 'external' && !!externalInput && !isValidExternalLink(externalInput);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
        <Link2 className="h-3.5 w-3.5 shrink-0" />
        קישור בפתיחת ההתראה
      </label>

      <select
        dir="rtl"
        value={selectValue}
        onChange={handleSelectChange}
        className="w-full rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">דף הבית (ברירת מחדל)</option>
        {GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {DEEP_LINK_OPTIONS.filter((o) => o.group === group).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM_SENTINEL}>נתיב פנימי מותאם אישית…</option>
        <option value={EXTERNAL_SENTINEL}>קישור לאתר חיצוני…</option>
      </select>

      {mode === 'custom' && (
        <input
          type="text"
          dir="ltr"
          placeholder="/community/my-page"
          value={customInput}
          onChange={handleCustomInput}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            customInvalid ? 'border-error' : 'border-outline'
          }`}
        />
      )}

      {customInvalid && (
        <p className="text-xs text-error">נתיב לא תקין — חייב להתחיל ב-/ ולא לכלול כתובת חיצונית</p>
      )}

      {mode === 'external' && (
        <input
          type="url"
          dir="ltr"
          inputMode="url"
          placeholder="https://example.com/page"
          value={externalInput}
          onChange={handleExternalInput}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            externalInvalid ? 'border-error' : 'border-outline'
          }`}
        />
      )}

      {externalInvalid && (
        <p className="text-xs text-error">כתובת לא תקינה — חייבת להתחיל ב-http:// או https://</p>
      )}

      <p className="text-xs text-on-surface-variant">
        {mode === 'external'
          ? 'אתר חיצוני שייפתח בלשונית חדשה כאשר המשתמש ילחץ על ההתראה'
          : 'המסך שייפתח כאשר המשתמש ילחץ על ההתראה'}
      </p>
    </div>
  );
}
