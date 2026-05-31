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
  Eye, Globe, Copy, X, GripVertical, Settings2, Check, RotateCcw, AlertTriangle,
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
      pill_text: 'פעיל · 6 שנים ברציפות',
      since_text: 'נחלת דוד · מוסדות תורה וחסד לעילוי נשמת הרה״ג דוד עשור זצ״ל',
      headline: '40 משפחות. כל שבוע. בלי לפספס אף פעם.',
      accent_word_index: 0,
      subheadline: 'מוסדות תורה וחסד לעילוי נשמת הרה״ג דוד עשור זצ״ל. 40 משפחות מקבלות סל מזון מותאם בכל שבוע, 500 סלי חג פעמיים בשנה, שיפוץ ריהוט וליווי לאירועי שמחה. 252 חברים, 6 שנים ברצף. כל שקל ישר למשפחה.',
      cta_label: 'תרמו עכשיו →',
      cta_action: 'payment',
      secondary_cta_label: 'איך זה עובד?',
      secondary_cta_target: '#story',
      stats: [
        { value: '40', label: 'משפחות בכל שבוע' },
        { value: '500', label: 'סלי חג בפסח וראש השנה' },
        { value: '252', label: 'חברים פעילים' },
        { value: '6', label: 'שנים בלי לפספס שבוע' },
      ],
    };
    case 'marquee': return {
      items: [
        'חלוקה שבועית',
        'סלי חג',
        'שיפוץ ריהוט',
        'אירועי שמחה',
        'קשישים',
        'משפחות מרובות ילדים',
        'חסד בשקט',
        'שקיפות מלאה',
        'ממשיכים את הדרך',
      ],
    };
    case 'video': return {
      eyebrow: 'הסיפור שלנו',
      title: 'הרה״ג דוד עשור זצ״ל — והמשפחות שממשיכות את דרכו.',
      description: '6 שנים של חלוקה שבועית. 40 משפחות שמסתמכות עלינו. הסיפור שמאחורי כל סל.',
      source: '',
    };
    case 'about': return {
      eyebrow: 'מי אנחנו',
      title: 'מוסד תורה וחסד אחד. 252 חברים. אפס פספוסים.',
      body_rich_text: '<p><strong>נחלת דוד</strong> נוסד לעילוי נשמת הרה״ג דוד עשור זצ״ל — איש חסד שכל ימיו דאג לזולת, ושעצם דמותו היתה מורה דרך לאיך נראית אכפתיות אמיתית.</p><p>את הדרך שלו אנחנו ממשיכים. <strong>252 חברים פעילים</strong>, מחולקים לצוותי חלוקה קבועים, עם מטרה אחת: שאף משפחה שצריכה כתף לא תישאר לבד.</p><p>בכל שבוע, <strong>40 משפחות</strong> מקבלות חבילת מזון מותאמת אישית — לפי גודל המשפחה, צרכיה, ומה שמכבד את השולחן שלה. פעמיים בשנה, בפסח ובראש השנה, יוצאים לחלוקה מורחבת של <strong>500 סלי חג</strong>.</p><p>והחסד שלנו לא נעצר במזון — שיפוץ ריהוט, ליווי לאירועי שמחה של ילדים, וכתף לכל מה שצריך כדי שמשפחה תעמוד בכבוד.</p><p><strong>6 שנים. בלי לפספס שבוע אחד. מעל 18,000 חבילות שיצאו עד היום.</strong></p>',
      badge_text: '6 שנים ברצף',
    };
    case 'activities': return {
      eyebrow: 'מה אנחנו עושים',
      title: 'ארבעה תחומי פעילות. מטרה אחת — לעמוד בכבוד.',
      items: [
        {
          title: 'חבילת מזון שבועית',
          description: '40 משפחות מקבלות בכל שבוע סל מזון מלא, מותאם אישית לגודל המשפחה ולצרכיה. 6 שנים ברצף, בלי לפספס שבוע — חלוקה דיסקרטית, ישר לבית.',
        },
        {
          title: 'סלי חג — פסח וראש השנה',
          description: 'פעמיים בשנה יוצאים לחלוקה מורחבת — 500 סלי חג עשירים שמאפשרים למשפחה לשבת לשולחן החג בכבוד מלא, עם כל מה שצריך.',
        },
        {
          title: 'שיפוץ ריהוט וסיוע בבית',
          description: 'מקרר שהתקלקל, מיטה לילדים, שיפוץ קטן בבית, מטבח שצריך חידוש — אנחנו שם. כי משפחה זה לא רק אוכל, זה גם הבית שצריך לתפקד.',
        },
        {
          title: 'ליווי לאירועי שמחה',
          description: 'בר מצווה, בת מצווה, חתונה — שמחות שאמורות להישאר זיכרון של חיים. אנחנו מסייעים בכל מה שצריך כדי שילד יחווה את היום הגדול שלו בכבוד.',
        },
      ],
    };
    case 'gallery': return {
      eyebrow: 'מהשטח',
      title: 'רגעים מהחלוקה השבועית.',
      images: [],
    };
    case 'reviews': return {
      eyebrow: 'מילים מהשטח',
      title: 'מה אומרים תורמים, מתנדבים ומשפחות.',
      cta_text: 'השאירו עדות שלכם',
      empty_text: 'היו הראשונים להשאיר עדות.',
    };
    case 'stats': return {
      eyebrow: 'המספרים שמאחורי החסד',
      items: [
        { value: '40', label: 'משפחות מקבלות סל בכל שבוע' },
        { value: '500', label: 'סלי חג בפסח ובראש השנה' },
        { value: '252', label: 'חברים פעילים בעמותה' },
        { value: '6', label: 'שנים רצופות בלי לפספס' },
        { value: '18,000+', label: 'חבילות חולקו עד היום' },
      ],
    };
    case 'cta_payment': return {
      eyebrow: 'כל שקל. ישר למשפחה.',
      headline: 'תרומה חד פעמית או הוראת קבע — אתם בוחרים.',
      subheadline: '₪52 = סל מזון שבועי למשפחה. ₪180 = סל חג מלא. הוראת קבע = יציבות לעמותה ושקט נפשי לכם. סליקה מאובטחת, קבלה לפי סעיף 46 נשלחת ישר למייל.',
      amounts: [52, 120, 180, 360, 540, 1000],
      default_amount_index: 2,
      allow_custom: true,
      installments_hint: true,
      receipt_hint: true,
      cta_label: 'תרמו עכשיו →',
      secure_label: 'סליקה מאובטחת',
      installments_label: 'עד 12 תשלומים',
      receipt_label: 'קבלה לפי סעיף 46',
    };
    case 'join_us': return {
      eyebrow: 'רוצים להיות חלק?',
      headline: '252 חברים. ועוד מקום אחד מחכה לך.',
      body: 'תורם קבוע, מתנדב לחלוקה, או סתם רוצה לשמוע יותר על העבודה? השאירו פרטים — מאיר עשור או אחד מצוות העמותה יחזור אליכם תוך יום עסקים.',
      submit_label: 'אני בפנים →',
      success_title: 'קיבלנו את הפנייה שלכם.',
      success_message: 'מאיר או אחד מצוות העמותה יחזור אליכם תוך יום עסקים. תודה שאתם איתנו.',
    };
    case 'faq': return {
      eyebrow: 'שאלות שתורמים שואלים',
      title: 'תכל׳ס — מה ששואלים אותנו הכי הרבה.',
      items: [
        {
          question: 'איך אני יודע שהכסף באמת מגיע למשפחות?',
          answer: 'העמותה רשומה ברשם העמותות, עם אישור ניהול תקין וביקורת רואה חשבון שנתית. כל תרומה מתועדת, וכל סל יוצא עם רישום פנימי. שקיפות זו לא מילה אצלנו — זו תרבות עבודה. אפשר לבקש פרטים בכל עת.',
        },
        {
          question: 'אני מקבל קבלה לצורכי מס?',
          answer: 'בוודאי. העמותה מאושרת לפי סעיף 46 — קבלה רשמית נשלחת אוטומטית למייל תוך 24 שעות מהתרומה, ומזכה בהחזר של עד 35% ממס הכנסה.',
        },
        {
          question: 'אפשר להפסיק הוראת קבע מתי שרוצים?',
          answer: 'כן, בכל רגע, בלי שאלות. הודעת וואטסאפ למאיר עשור — 052-205-8629 — ואנחנו מטפלים תוך יום עסקים.',
        },
        {
          question: 'איך נבחרות המשפחות שמקבלות סל?',
          answer: 'פנייה מתועדת + המלצה מרבני קהילה, עובדים סוציאליים או שכנים. כל מקרה נבדק בדיסקרטיות מוחלטת — השמות סגורים לעיני הוועדה בלבד. אנחנו מקפידים שאף משפחה לא תרגיש שמסתכלים עליה.',
        },
        {
          question: 'אני רוצה להתנדב — איך זה עובד?',
          answer: '252 החברים שלנו מחולקים לצוותי חלוקה קבועים. אם אתם רוצים להצטרף כמתנדבים — אריזה, חלוקה, רכישה — מלאו את הטופס למעלה או צרו קשר ישירות עם מאיר. כל יד נוספת מתקבלת בברכה.',
        },
        {
          question: 'אפשר לתרום מזון, ריהוט או חפצים במקום כסף?',
          answer: 'בהחלט. ריהוט, מקררים, מכונות כביסה, מצרכי מזון יבשים — כל תרומה בעין מתקבלת בברכה ומגיעה ישירות למשפחות. תיאום מראש בטלפון 052-205-8629.',
        },
        {
          question: 'מה ההבדל בין סל שבועי לסל חג?',
          answer: 'סל שבועי הוא חבילה לחיי היומיום — לחם, מוצרי חלב, ירקות, מצרכי יסוד. סל חג (פסח, ראש השנה) הוא חבילה עשירה ומורחבת שכוללת מצרכי חג מלאים, כדי שמשפחה תוכל לקיים את החג בכבוד.',
        },
        {
          question: 'יש דרך לתרום לזכר יקיר?',
          answer: 'כן, ובהחלט. תרומה לעילוי נשמה היא דרך מכובדת להנציח יקיר ולעשות חסד בשמו — בדיוק כפי שהעמותה עצמה הוקמה לעילוי נשמת הרה״ג דוד עשור זצ״ל. ציינו זאת בעת התרומה או צרו קשר ישירות.',
        },
      ],
    };
    case 'footer': return {
      big_text: 'השולחן שלהם',
      big_accent: 'מחכה לך.',
      about: 'נחלת דוד — מוסדות תורה וחסד לעילוי נשמת הרה״ג דוד עשור זצ״ל. 40 משפחות, 500 סלי חג, 252 חברים פעילים, 6 שנים ברצף. כל שקל הופך לסל מזון, לריהוט מתחדש, לשמחה בבית של משפחה שצריכה את זה. "כל המקיים נפש אחת מישראל — מעלה עליו הכתוב כאילו קיים עולם מלא" (משנה סנהדרין ד׳:ה׳)',
      visit_label: 'ביקור',
      contact_label: 'יצירת קשר',
      follow_label: 'עקבו',
      hours: 'ניתן ליצור קשר 24/7 דרך וואטסאפ — 052-205-8629',
      registration_number: '',
      section_46: true,
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  // Reset to defaults — deletes all existing sections, then re-seeds with default content
  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      if (!landing) return;
      await Promise.all(
        landing.sections.map(s => api.delete(`/landing/sections/${s.id}`)),
      );
      for (const type of EXAMPLE_SECTIONS) {
        await api.post('/landing/sections', { type, data: getDefaultData(type) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing'] });
      setSelectedSectionId(null);
      setShowResetConfirm(false);
      showToast('הדף אופס לברירת המחדל', 'success');
    },
    onError: () => {
      setShowResetConfirm(false);
      showToast('שגיאה באיפוס הדף', 'error');
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
              landing.published ? 'bg-success/15 text-success-strong' : 'bg-warning/15 text-warning-strong'
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
              {linkCopied ? <Check className="h-4 w-4 text-success-strong" /> : <Copy className="h-4 w-4" />}
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

            {landing.sections.length > 0 && (
              <div className="pt-3 mt-1 border-t border-outline/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-warning-strong flex-shrink-0" />
                  <span>איפוס לברירת מחדל ימחק את כל הסקשנים הקיימים וייצור מחדש את הדף עם התוכן המקורי.</span>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={resetToDefaultsMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <RotateCcw className="h-4 w-4" />
                  {resetToDefaultsMutation.isPending ? 'מאפס...' : 'אפס לברירת מחדל'}
                </button>
              </div>
            )}
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

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !resetToDefaultsMutation.isPending && setShowResetConfirm(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-xl max-w-md w-full p-6 border border-outline/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div className="min-w-0">
                <h3 className="text-title-md font-headline text-on-surface mb-1">לאפס את הדף לברירת מחדל?</h3>
                <p className="text-body-sm text-on-surface-variant">
                  הפעולה תמחק את כל <strong>{landing.sections.length}</strong> הסקשנים הקיימים (כולל תוכן שערכת ותמונות שהעלית), ותיצור מחדש את הדף עם 12 הסקשנים והטקסטים המקוריים.
                </p>
                <p className="text-body-sm text-error mt-2 font-medium">לא ניתן לבטל את הפעולה.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetToDefaultsMutation.isPending}
                className="px-4 py-2 rounded-lg text-body-sm hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                onClick={() => resetToDefaultsMutation.mutate()}
                disabled={resetToDefaultsMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-sm bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {resetToDefaultsMutation.isPending ? 'מאפס...' : 'אפס עכשיו'}
              </button>
            </div>
          </div>
        </div>
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
