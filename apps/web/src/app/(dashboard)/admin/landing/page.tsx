'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Eye, Globe, Copy, X, GripVertical, Settings2, Check,
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import SectionLibrary, { SECTION_DEFINITIONS } from './_components/SectionLibrary';
import SectionProperties from './_components/SectionProperties';

interface Section {
  id: string;
  type: string;
  data: Record<string, unknown>;
  visible: boolean;
  position: number;
}

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  seoDescription?: string;
  theme: string;
  published: boolean;
  publishedAt?: string;
  viewCount: number;
  sections: Section[];
  organization: {
    name: string;
    slug: string;
    primaryColor: string;
    accentColor: string;
    paymentLink?: string;
  };
}

/* ── Default data per section type (matching Live Prototype) ── */
function getDefaultData(type: string): Record<string, unknown> {
  switch (type) {
    case 'hero': return {
      pill_text: 'פעיל · קמפיין פתוח',
      since_text: 'עמותה רשומה · נוסדה 1994',
      headline: 'דרך שקטה לתת כתף',
      accent_word_index: 2,
      subheadline: 'חונכות, תכניות אחר־צהריים וביטחון תזונתי למשפחות בקהילה שלנו. ממומן על־ידי שכנים, למען שכנים.',
      cta_label: 'תרמו עכשיו →',
      cta_action: 'payment',
      secondary_cta_label: 'צפו בסיפור שלנו',
      secondary_cta_target: '#story',
      stats: [
        { value: '140', label: 'משפחות בשבוע' },
        { value: '32', label: 'שנות פעילות' },
        { value: '68%', label: 'מימון מקומי' },
        { value: '1,240', label: 'שעות התנדבות' },
      ],
    };
    case 'marquee': return {
      items: ['חונכות', 'מזון', 'חינוך', 'קהילה', 'תקווה'],
    };
    case 'video': return {
      eyebrow: 'הסיפור שלנו',
      title: 'העבודה, במילותיהן של המשפחות שחיו אותה.',
      description: '',
      source: '',
    };
    case 'about': return {
      eyebrow: 'אודות',
      title: 'התחלנו סביב שולחן מטבח ב־1994. וכך אנחנו ממשיכים.',
      body_rich_text: '<p>התחלנו עם ארבע משפחות, ארוחה משותפת אחת בשבוע, ואמונה ששכנים יודעים הכי טוב מה שכנים צריכים.</p><p>שלושה עשורים לאחר מכן אנחנו מפעילים חונכות אחר־צהריים, תכנית מזון שבועית, וקייטנת נוער קיצית — אבל צורת העבודה לא השתנתה הרבה.</p>',
      badge_text: 'מאז 1994',
    };
    case 'activities': return {
      eyebrow: 'מה אנחנו עושים',
      title: 'שש תכניות, בכל שבוע של השנה.',
      items: [
        { title: 'חונכות נוער', description: 'התאמה אישית בין תלמידי תיכון למתנדבים סטודנטים, מדי שבוע לאורך שנת לימודים.' },
        { title: 'תכנית אחר־צהריים', description: 'חדר חם ובטוח בין 14:00 ל־18:00, עם תגבור, עזרה בשיעורים וארוחה חמה.' },
        { title: 'סל מזון שבועי', description: 'ירקות ומצרכי יסוד נמסרים ל־140 משפחות בכל יום חמישי, בלי טפסים ובלי שאלות.' },
        { title: 'קייטנת קיץ', description: 'עשרה ימים של טיולים, מוסיקה וחברות לילדים שמשפחותיהם לא יכולות לשלוח אותם בדרך אחרת.' },
        { title: 'מטבח קהילתי', description: 'מתנדבים, סטודנטים וסבתות מבשלים יחד עבור שכנים שזקוקים לארוחה.' },
        { title: 'פעילות חגים', description: 'מבצעי מתנות ומצרכים לפני כל חג, המופעלים על־ידי מועצת המתנדבים הצעירים.' },
      ],
    };
    case 'gallery': return {
      eyebrow: 'בתוך הרגע',
      title: 'רגעים, שנשמרו על־ידי האנשים שהיו בהם.',
      images: [],
    };
    case 'reviews': return {
      eyebrow: 'במילים שלהם',
      title: 'הקהילה, על הקהילה.',
      cta_text: 'השאירו ביקורת שלכם',
      empty_text: 'היו הראשונים להשאיר הודעה.',
    };
    case 'stats': return {
      eyebrow: 'במספרים',
      items: [
        { value: '140', label: 'משפחות בשבוע' },
        { value: '32', label: 'שנים בשכונה' },
        { value: '68%', label: 'מהמימון מתורמים מקומיים' },
        { value: '1,240', label: 'שעות התנדבות אשתקד' },
      ],
    };
    case 'cta_payment': return {
      eyebrow: 'תרמו עכשיו',
      headline: 'כל שקל, *ישר לעבודה.*',
      subheadline: 'עיבוד באמצעות שותף הסליקה המאובטח שלנו. עד 12 תשלומים חודשיים ללא ריבית.',
      amounts: [100, 250, 500, 1000],
      default_amount_index: 2,
      allow_custom: true,
      installments_hint: true,
      receipt_hint: true,
      cta_label: 'תרמו',
      secure_label: 'סליקה מאובטחת',
      installments_label: 'עד 12 תשלומים',
      receipt_label: 'קבלה לפי סעיף 46',
    };
    case 'join_us': return {
      eyebrow: 'הצטרפו אלינו',
      headline: 'מקום ליד השולחן תמיד פתוח.',
      body: 'מתנדבים, שכנים, סטודנטים, סבתות — אם תרצו לעזור, השאירו לנו הודעה ונחזור אליכם תוך שבוע.',
      submit_label: 'שלחו →',
      success_title: 'קיבלנו. תודה רבה.',
      success_message: 'נחזור אליכם תוך מספר ימים.',
    };
    case 'faq': return {
      eyebrow: 'שאלות',
      title: 'הנפוצות ביותר.',
      items: [
        { question: 'האם התרומה מוכרת לזיכוי מס?', answer: 'כן. אנחנו עמותה רשומה בעלת אישור סעיף 46; קבלה לצורכי מס מונפקת אוטומטית לאחר כל תרומה.' },
        { question: 'האם ניתן לתרום בעילום שם?', answer: 'כן. תרומות בעילום שם מתקבלות בברכה ומופיעות בדוח השנתי ללא שם.' },
        { question: 'איך הכסף מנוצל?', answer: 'כ־82% הולך ישירות לתכניות; השאר מכסה שכר דירה, הוצאות שוטפות, ורכזת.' },
        { question: 'איך אפשר להתנדב?', answer: 'מלאו את הטופס למעלה או כתבו לנו. אנחנו מקיימים יום הכוונה קצר בתחילת כל חודש.' },
        { question: 'האם אתם מקבלים תרומות בעין?', answer: 'אנחנו מקבלים מזון, ספרים, וביגוד עונתי. אנא צרו איתנו קשר לפני הבאת פריטים.' },
      ],
    };
    case 'footer': return {
      big_text: 'לבנות קהילה.',
      big_accent: 'ביחד.',
      about: 'עמותה קהילתית המשרתת את משפחות השכונה שלנו מאז 1994.',
      visit_label: 'ביקור',
      contact_label: 'יצירת קשר',
      follow_label: 'עקבו',
      hours: 'א׳–ה׳, 9:00–17:00',
      registration_number: '',
      section_46: false,
    };
    default: return {};
  }
}

/* ── Example page sections for quick start ── */
const EXAMPLE_SECTIONS = [
  'hero', 'marquee', 'video', 'about', 'activities', 'gallery',
  'reviews', 'stats', 'cta_payment', 'join_us', 'faq', 'footer',
];

export default function LandingBuilderPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Local state for settings panel inputs
  const [settingsForm, setSettingsForm] = useState({ title: '', slug: '', theme: 'MODERN', seoDescription: '' });
  const settingsInitialized = React.useRef(false);

  const { data: landing, isLoading } = useQuery<LandingPage>({
    queryKey: ['landing'],
    queryFn: async () => {
      const res = await api.get('/landing');
      return res.data.data;
    },
  });

  // Sync settings form when landing data loads
  React.useEffect(() => {
    if (landing && !settingsInitialized.current) {
      setSettingsForm({
        title: landing.title || '',
        slug: landing.slug || '',
        theme: landing.theme || 'MODERN',
        seoDescription: landing.seoDescription || '',
      });
      settingsInitialized.current = true;
    }
  }, [landing]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await api.patch('/landing', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      showToast('הגדרות עודכנו', 'success');
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: async (type: string) => {
      const defaults = getDefaultData(type);
      await api.post('/landing/sections', { type, data: defaults });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      showToast('סקשן נוסף', 'success');
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (payload: { id: string; data?: Record<string, unknown>; visible?: boolean }) => {
      const { id, ...body } = payload;
      await api.patch(`/landing/sections/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/landing/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      setSelectedSectionId(null);
      showToast('סקשן נמחק', 'success');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      await api.post('/landing/sections/reorder', { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post('/landing/publish');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      showToast('דף הנחיתה פורסם!', 'success');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      await api.post('/landing/unpublish');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      showToast('דף הנחיתה הוסר מפרסום', 'success');
    },
  });

  // Seed example page — adds all 11 sections with default Hebrew content
  const seedExampleMutation = useMutation({
    mutationFn: async () => {
      for (const type of EXAMPLE_SECTIONS) {
        await api.post('/landing/sections', { type, data: getDefaultData(type) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      showToast('דף לדוגמה נוצר!', 'success');
    },
    onError: () => {
      showToast('שגיאה ביצירת דף לדוגמה', 'error');
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !landing) return;

    const oldIndex = landing.sections.findIndex(s => s.id === active.id);
    const newIndex = landing.sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(landing.sections, oldIndex, newIndex);
    const items = reordered.map((s, i) => ({ id: s.id, position: i }));
    reorderMutation.mutate(items);
  }, [landing, reorderMutation]);

  const handleCopyLink = useCallback(() => {
    if (!landing) return;
    const url = `${window.location.origin}/l/${landing.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [landing]);

  const selectedSection = landing?.sections.find(s => s.id === selectedSectionId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!landing) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      {/* Left: Section Library (desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 border-e border-outline/20 bg-surface-container-lowest overflow-y-auto p-3">
        <SectionLibrary onAdd={type => addSectionMutation.mutate(type)} />
      </aside>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline/20 bg-surface-container-lowest flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-title-md font-headline">דף נחיתה</h1>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              landing.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {landing.published ? 'מפורסם' : 'טיוטה'}
            </span>
            {landing.viewCount > 0 && (
              <span className="text-body-sm text-on-surface-variant">{landing.viewCount} צפיות</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-surface-container transition-colors"
              title="הגדרות"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.open(`/l/${landing.slug}?preview=1`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm hover:bg-surface-container transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">תצוגה מקדימה</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm hover:bg-surface-container transition-colors"
            >
              {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{linkCopied ? 'הועתק!' : 'העתק קישור'}</span>
            </button>
            {landing.published ? (
              <button
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-body-sm bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <X className="h-4 w-4" />
                ביטול פרסום
              </button>
            ) : (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-body-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors"
              >
                <Globe className="h-4 w-4" />
                פרסם
              </button>
            )}
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="px-4 py-4 border-b border-outline/20 bg-surface-container-lowest space-y-3 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">כותרת</label>
                <input
                  value={settingsForm.title}
                  onChange={e => setSettingsForm(f => ({ ...f, title: e.target.value }))}
                  onBlur={() => updateMutation.mutate({ title: settingsForm.title })}
                  className="w-full px-3 py-1.5 rounded-lg border border-outline/30 text-body-sm"
                  dir="auto"
                />
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">Slug</label>
                <input
                  value={settingsForm.slug}
                  onChange={e => setSettingsForm(f => ({ ...f, slug: e.target.value }))}
                  onBlur={() => updateMutation.mutate({ slug: settingsForm.slug })}
                  className="w-full px-3 py-1.5 rounded-lg border border-outline/30 text-body-sm font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">ערכת עיצוב</label>
                <select
                  value={settingsForm.theme}
                  onChange={e => { setSettingsForm(f => ({ ...f, theme: e.target.value })); updateMutation.mutate({ theme: e.target.value }); }}
                  className="w-full px-3 py-1.5 rounded-lg border border-outline/30 text-body-sm"
                >
                  <option value="MODERN">מודרני</option>
                  <option value="WARM">חם</option>
                  <option value="MINIMAL">מינימלי</option>
                  <option value="BOLD">נועז</option>
                </select>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">תיאור SEO</label>
                <input
                  value={settingsForm.seoDescription}
                  onChange={e => setSettingsForm(f => ({ ...f, seoDescription: e.target.value }))}
                  onBlur={() => updateMutation.mutate({ seoDescription: settingsForm.seoDescription })}
                  className="w-full px-3 py-1.5 rounded-lg border border-outline/30 text-body-sm"
                  dir="auto"
                />
              </div>
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
          {landing.sections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-body-lg text-on-surface-variant mb-4">הדף ריק. הוסיפו סקשנים מהספרייה.</p>
              <button
                onClick={() => seedExampleMutation.mutate()}
                disabled={seedExampleMutation.isPending}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl text-body-md font-medium shadow-md hover:bg-primary/90 transition-colors mb-8"
              >
                {seedExampleMutation.isPending ? 'יוצר דף לדוגמה...' : '✨ צור דף נחיתה לדוגמה'}
              </button>
              <p className="text-body-sm text-on-surface-variant mb-6">או הוסיפו סקשנים ידנית:</p>
              {/* Mobile: show section library inline */}
              <div className="lg:hidden max-w-sm mx-auto mt-4">
                <SectionLibrary onAdd={type => addSectionMutation.mutate(type)} />
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={landing.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="max-w-2xl mx-auto space-y-3">
                  {landing.sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      isSelected={section.id === selectedSectionId}
                      onClick={() => setSelectedSectionId(section.id === selectedSectionId ? null : section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Mobile: add section button */}
          <div className="lg:hidden fixed bottom-20 left-4 right-4 z-20">
            <MobileAddSection onAdd={type => addSectionMutation.mutate(type)} />
          </div>
        </div>
      </div>

      {/* Right: Properties Panel */}
      {selectedSection && (
        <aside className="w-80 border-s border-outline/20 bg-surface-container-lowest overflow-y-auto flex-shrink-0">
          <SectionProperties
            section={selectedSection}
            onUpdate={data => updateSectionMutation.mutate({ id: selectedSection.id, data })}
            onToggleVisibility={() => updateSectionMutation.mutate({ id: selectedSection.id, visible: !selectedSection.visible })}
            onDelete={() => deleteSectionMutation.mutate(selectedSection.id)}
            onClose={() => setSelectedSectionId(null)}
          />
        </aside>
      )}
    </div>
  );
}

// ─── Sortable Section Card ──────────────────────────────────────

function SortableSection({ section, isSelected, onClick }: {
  section: Section;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const def = SECTION_DEFINITIONS.find(d => d.type === section.type);
  const Icon = def?.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : section.visible
            ? 'border-outline/20 bg-surface-container-lowest hover:border-outline/40'
            : 'border-outline/10 bg-surface-container-lowest/50 opacity-60'
      }`}
      onClick={onClick}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 -m-1 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-on-surface-variant" />
      </button>
      {Icon && <Icon className="h-5 w-5 text-primary flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-on-surface">{def?.label || section.type}</p>
        <SectionPreviewText section={section} />
      </div>
      {!section.visible && (
        <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">מוסתר</span>
      )}
    </div>
  );
}

function SectionPreviewText({ section }: { section: Section }) {
  const data = section.data;
  let preview = '';

  switch (section.type) {
    case 'hero': preview = (data.headline as string) || ''; break;
    case 'video': preview = (data.title as string) || ''; break;
    case 'about': preview = (data.title as string) || ''; break;
    case 'activities': {
      const items = (data.items as unknown[]) || [];
      preview = `${items.length} פעילויות`;
      break;
    }
    case 'stats': {
      const items = (data.items as unknown[]) || [];
      preview = `${items.length} נתונים`;
      break;
    }
    case 'cta_payment': preview = (data.headline as string) || ''; break;
    case 'join_us': preview = (data.headline as string) || ''; break;
    case 'faq': {
      const items = (data.items as unknown[]) || [];
      preview = `${items.length} שאלות`;
      break;
    }
    case 'reviews': preview = (data.title as string) || 'המלצות'; break;
    case 'gallery': preview = (data.title as string) || 'גלריה'; break;
    case 'footer': preview = 'תחתית העמוד'; break;
  }

  if (!preview) return null;
  return <p className="text-[11px] text-on-surface-variant truncate">{preview}</p>;
}

// ─── Mobile Add Section ─────────────────────────────────────────

function MobileAddSection({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-primary text-on-primary rounded-xl text-body-md font-medium shadow-lg"
      >
        + הוסף סקשן
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-outline/30 rounded-full mx-auto mb-4" />
            <SectionLibrary onAdd={(type) => { onAdd(type); setOpen(false); }} />
          </div>
        </>
      )}
    </>
  );
}
