'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/auth.store';

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface GroupConfirmStepProps {
  onComplete: () => void;
}

export function GroupConfirmStep({ onComplete }: GroupConfirmStepProps) {
  const { user, setUser } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'done' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await api.get(API_ROUTES.ACTIVATION.GROUPS);
        const data = res.data.data;
        setGroups(data.groups);
        setCurrentGroupId(data.currentGroupId);
        setSelectedGroupId(data.currentGroupId);

        if (data.groups.length === 0) {
          // No groups in org — skip this step
          setStatus('done');
        } else {
          setStatus('ready');
        }
      } catch {
        setError('שגיאה בטעינת הקבוצות');
        setStatus('error');
      }
    }
    fetchGroups();
  }, []);

  // Auto-advance if no groups exist
  useEffect(() => {
    if (status === 'done') {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);

  const handleConfirm = async () => {
    if (!selectedGroupId) return;

    setStatus('saving');
    setError(null);
    try {
      await api.post(API_ROUTES.ACTIVATION.GROUP_SELECT(selectedGroupId));

      // Update auth store with the new group
      if (user) {
        setUser({ ...user, groupMembershipGroupId: selectedGroupId });
      }

      setStatus('done');
      setTimeout(onComplete, 800);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'שגיאה בשמירת הקבוצה');
      setStatus('ready');
    }
  };

  const currentGroup = groups.find((g) => g.id === currentGroupId);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">
          {selectedGroup ? `שויכת לקבוצה: ${selectedGroup.name}` : 'ממשיכים הלאה...'}
        </h3>
      </div>
    );
  }

  // Show confirm view (current group) or edit view (group list)
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">הקבוצה שלך</h3>
        <p className="text-body-md text-on-surface-variant mt-2">
          {currentGroup
            ? 'אנא אשר/י שהקבוצה הבאה נכונה, או בחר/י קבוצה אחרת.'
            : 'בחר/י את הקבוצה שאליה את/ה שייכ/ת.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Current group confirm mode */}
      {currentGroup && !isEditing && (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-container/30 border-2 border-primary p-4 text-center">
            <p className="text-title-md font-medium text-on-surface">{currentGroup.name}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {currentGroup.memberCount} חברים
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={status === 'saving'}
            className="btn-primary w-full py-3 text-title-md"
          >
            {status === 'saving' ? 'שומר...' : 'אישור — זו הקבוצה שלי'}
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 text-body-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
          >
            לא נכון? בחר קבוצה אחרת
          </button>
        </div>
      )}

      {/* Group selection mode */}
      {(!currentGroup || isEditing) && (
        <div className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full rounded-xl p-4 text-right transition-all ${
                  selectedGroupId === group.id
                    ? 'bg-primary-container/30 border-2 border-primary'
                    : 'bg-surface-container border-2 border-transparent hover:border-outline-variant'
                }`}
              >
                <p className="text-title-sm font-medium text-on-surface">{group.name}</p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  {group.memberCount} חברים
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedGroupId || status === 'saving'}
            className="btn-primary w-full py-3 text-title-md disabled:opacity-50"
          >
            {status === 'saving' ? 'שומר...' : 'אישור בחירת קבוצה'}
          </button>

          {isEditing && currentGroup && (
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedGroupId(currentGroupId);
              }}
              className="w-full py-2.5 text-body-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
            >
              חזרה
            </button>
          )}
        </div>
      )}

      {/* Skip option if no group assigned and user wants to continue */}
      {!currentGroup && (
        <button
          onClick={onComplete}
          className="w-full py-2.5 text-body-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
        >
          דלג — אבחר מאוחר יותר
        </button>
      )}
    </div>
  );
}
