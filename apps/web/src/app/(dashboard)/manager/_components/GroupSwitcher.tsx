'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Users } from 'lucide-react';

/**
 * GroupSwitcher — appears only when the logged-in user manages 2+ groups.
 * Renders a native <select> styled to match the manager UI.
 * On change it updates activeManagedGroupId in the auth store, which triggers
 * refetches in all manager pages that depend on that value.
 */
export function GroupSwitcher() {
  const { user, activeManagedGroupId, setActiveManagedGroupId } = useAuthStore();

  const groups = user?.managedGroups ?? [];

  // Only render for true multi-group managers
  if (groups.length < 2) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setActiveManagedGroupId(e.target.value);
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
      <Users className="h-4 w-4 text-primary flex-shrink-0" />
      <label
        htmlFor="group-switcher-select"
        className="text-label-sm text-on-surface-variant whitespace-nowrap"
      >
        קבוצה:
      </label>
      <select
        id="group-switcher-select"
        value={activeManagedGroupId ?? ''}
        onChange={handleChange}
        className="flex-1 bg-transparent text-body-md text-on-surface font-medium focus:outline-none cursor-pointer min-w-0 truncate"
        dir="rtl"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
}
