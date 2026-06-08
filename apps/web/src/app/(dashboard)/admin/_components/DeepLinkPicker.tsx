'use client';

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { DEEP_LINK_OPTIONS, isValidDeepLink } from '@/lib/deep-links';

interface DeepLinkPickerProps {
  value: string;
  onChange: (v: string) => void;
}

const CUSTOM_SENTINEL = '__custom__';

// Build sorted unique group list preserving order of first appearance
const GROUPS = Array.from(new Set(DEEP_LINK_OPTIONS.map((o) => o.group)));

export default function DeepLinkPicker({ value, onChange }: DeepLinkPickerProps) {
  // Determine whether the current value is a known catalog entry or custom
  const isKnownOption = value === '' || DEEP_LINK_OPTIONS.some((o) => o.value === value);
  const [showCustom, setShowCustom] = useState(!isKnownOption);
  const [customInput, setCustomInput] = useState(!isKnownOption ? value : '');

  const selectValue = showCustom ? CUSTOM_SENTINEL : value;

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === CUSTOM_SENTINEL) {
      setShowCustom(true);
      // Don't clear parent value yet — wait for the user to type
    } else {
      setShowCustom(false);
      setCustomInput('');
      onChange(v);
    }
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setCustomInput(v);
    onChange(v);
  }

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
        <option value={CUSTOM_SENTINEL}>מותאם אישית…</option>
      </select>

      {showCustom && (
        <input
          type="text"
          dir="ltr"
          placeholder="/community/my-page"
          value={customInput}
          onChange={handleCustomInput}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            customInput && !isValidDeepLink(customInput) ? 'border-error' : 'border-outline'
          }`}
        />
      )}

      {showCustom && customInput && !isValidDeepLink(customInput) && (
        <p className="text-xs text-error">נתיב לא תקין — חייב להתחיל ב-/ ולא לכלול כתובת חיצונית</p>
      )}

      <p className="text-xs text-on-surface-variant">
        המסך שייפתח כאשר המשתמש ילחץ על ההתראה
      </p>
    </div>
  );
}
