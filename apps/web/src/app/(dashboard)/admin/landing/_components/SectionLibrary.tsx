'use client';

import { Image, Video, Info, Grid3X3, GalleryHorizontalEnd, Star, BarChart3, CreditCard, UserPlus, HelpCircle, Footprints, Megaphone } from 'lucide-react';

export const SECTION_DEFINITIONS = [
  { type: 'hero', label: 'כותרת ראשית', icon: Image, description: 'באנר עם כותרת, נתונים וקריאה לפעולה' },
  { type: 'marquee', label: 'מרקיז', icon: Megaphone, description: 'פס טקסט רץ עם מילות מפתח' },
  { type: 'video', label: 'וידאו', icon: Video, description: 'סרטון מ-YouTube, Vimeo או העלאה' },
  { type: 'about', label: 'אודות', icon: Info, description: 'טקסט ותמונה עם אפקט שכבות' },
  { type: 'activities', label: 'פעילויות', icon: Grid3X3, description: 'רשת פעילויות עם אייקונים' },
  { type: 'gallery', label: 'גלריה', icon: GalleryHorizontalEnd, description: 'גלריית תמונות' },
  { type: 'reviews', label: 'המלצות', icon: Star, description: 'חוות דעת מאושרות' },
  { type: 'stats', label: 'נתונים', icon: BarChart3, description: 'מספרים ונתונים מרשימים' },
  { type: 'cta_payment', label: 'קריאה לתרומה', icon: CreditCard, description: 'כפתור תרומה בולט' },
  { type: 'join_us', label: 'הצטרפות', icon: UserPlus, description: 'טופס הרשמה / יצירת קשר' },
  { type: 'faq', label: 'שאלות ותשובות', icon: HelpCircle, description: 'שאלות נפוצות' },
  { type: 'footer', label: 'פוטר', icon: Footprints, description: 'תחתית העמוד עם כותרת גדולה ופרטי קשר' },
] as const;

interface SectionLibraryProps {
  onAdd: (type: string) => void;
}

export default function SectionLibrary({ onAdd }: SectionLibraryProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-label-md text-on-surface-variant px-2 mb-2">הוסף סקשן</h3>
      {SECTION_DEFINITIONS.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.type}
            onClick={() => onAdd(section.type)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start hover:bg-surface-container transition-colors group"
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-on-surface">{section.label}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{section.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
