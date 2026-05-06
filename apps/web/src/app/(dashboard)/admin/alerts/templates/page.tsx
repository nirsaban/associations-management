'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

type AlertAudience = 'ALL_USERS' | 'GROUP_MANAGERS' | 'UNPAID_THIS_MONTH' | 'CURRENT_DISTRIBUTORS';

interface AlertTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  audience: AlertAudience;
}

const TEMPLATES_KEY = 'amutot-alert-templates';

const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  ALL_USERS: 'כל המשתמשים ומנהלי קבוצות',
  GROUP_MANAGERS: 'מנהלי קבוצות בלבד',
  UNPAID_THIS_MONTH: 'משתמשים שלא שילמו החודש',
  CURRENT_DISTRIBUTORS: 'מחלקים שבועיים נוכחיים בלבד',
};

const AUDIENCE_OPTIONS: AlertAudience[] = ['ALL_USERS', 'UNPAID_THIS_MONTH', 'CURRENT_DISTRIBUTORS', 'GROUP_MANAGERS'];

function getTemplates(): AlertTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'); }
  catch { return []; }
}

function saveTemplates(templates: AlertTemplate[]): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export default function AlertTemplatesPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<AlertTemplate, 'id'>>({
    name: '',
    title: '',
    body: '',
    audience: 'ALL_USERS',
  });

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  function resetForm() {
    setForm({ name: '', title: '', body: '', audience: 'ALL_USERS' });
    setEditingId(null);
    setShowForm(false);
  }

  function handleSave() {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      showToast('נא למלא את כל השדות', 'error');
      return;
    }

    let updated: AlertTemplate[];
    if (editingId) {
      updated = templates.map((t) =>
        t.id === editingId ? { ...t, ...form } : t,
      );
      showToast('התבנית עודכנה', 'success');
    } else {
      const newTemplate: AlertTemplate = { id: Date.now().toString(), ...form };
      updated = [...templates, newTemplate];
      showToast('התבנית נוצרה', 'success');
    }

    saveTemplates(updated);
    setTemplates(updated);
    resetForm();
  }

  function handleEdit(template: AlertTemplate) {
    setForm({ name: template.name, title: template.title, body: template.body, audience: template.audience });
    setEditingId(template.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (!window.confirm('האם למחוק תבנית זו?')) return;
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
    showToast('התבנית נמחקה', 'success');
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-3xl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/alerts" className="btn-ghost p-2 rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">תבניות הודעות</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">צרו ונהלו תבניות לשליחת הודעות מהירה</p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary mt-3 sm:mt-0 self-start sm:self-auto flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            תבנית חדשה
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-medium">
              {editingId ? 'עריכת תבנית' : 'תבנית חדשה'}
            </h2>
            <button type="button" onClick={resetForm} className="btn-ghost p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">שם התבנית</label>
            <input
              type="text"
              placeholder="לדוגמה: תזכורת תשלום חודשי"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">כותרת ההודעה</label>
            <input
              type="text"
              placeholder="כותרת ההודעה שתוצג למשתמשים"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">תוכן ההודעה</label>
            <textarea
              rows={4}
              placeholder="תוכן ההודעה..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">קהל יעד ברירת מחדל</label>
            <select
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AlertAudience }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              dir="rtl"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{AUDIENCE_LABELS[opt]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleSave} className="btn-primary flex items-center gap-1">
              <Save className="h-4 w-4" />
              {editingId ? 'עדכן תבנית' : 'שמור תבנית'}
            </button>
            <button type="button" onClick={resetForm} className="btn-outline">ביטול</button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 && !showForm ? (
        <div className="card-elevated flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
          <BookOpen className="w-12 h-12 opacity-30" />
          <p className="text-body-md">אין תבניות עדיין</p>
          <p className="text-body-sm">צרו תבנית ראשונה לשליחת הודעות מהירה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="card-elevated p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-title-sm font-medium truncate">{template.name}</p>
                  </div>
                  <p className="text-body-md font-medium text-on-surface mb-0.5">{template.title}</p>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2">{template.body}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${
                    template.audience === 'ALL_USERS' ? 'bg-primary/10 text-primary'
                      : template.audience === 'UNPAID_THIS_MONTH' ? 'bg-warning/10 text-warning'
                      : template.audience === 'CURRENT_DISTRIBUTORS' ? 'bg-secondary/10 text-secondary'
                      : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    {AUDIENCE_LABELS[template.audience]}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(template)}
                    className="btn-ghost p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    aria-label="ערוך"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    className="btn-ghost p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                    aria-label="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
