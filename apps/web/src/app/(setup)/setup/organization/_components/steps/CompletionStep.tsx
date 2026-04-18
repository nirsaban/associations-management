'use client';

import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

type CompletionStepProps = {
  organizationName: string;
  onStartUsing: () => void;
};

export function CompletionStep({ organizationName, onStartUsing }: CompletionStepProps) {
  return (
    <div className="p-12 text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative p-6 rounded-full bg-success-container">
            <CheckCircle className="h-16 w-16 text-on-success-container" />
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-headline-md font-headline">ברוך הבא, {organizationName}!</h2>
        <p className="text-body-lg text-on-surface-variant">ההקמה הושלמה בהצלחה</p>
      </div>

      {/* Features List */}
      <div className="bg-surface-container-high rounded-lg p-6 text-start max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-title-md font-medium">מה הלאה?</h3>
        </div>
        <ul className="space-y-3 text-body-md">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <span>צור משתמשים נוספים למערכת</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <span>הגדר קבוצות ומשפחות</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <span>התחל לעקוב אחר תשלומים</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <span>שלח הודעות push למשתמשים</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <button onClick={onStartUsing} className="btn-primary text-title-md px-8 py-4">
        התחל להשתמש במערכת
      </button>

      {/* Footer Note */}
      <p className="text-body-sm text-on-surface-variant">
        המערכת מוכנה לשימוש! צוות התמיכה זמין בכל עת לעזור לך
      </p>
    </div>
  );
}
