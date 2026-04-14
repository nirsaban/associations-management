'use client';

import React from 'react';
import { WizardData } from '../../page';

type SettingsStepProps = {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
};

export function SettingsStep({ data, onUpdate }: SettingsStepProps) {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-title-lg font-medium mb-2">הגדרות תשלומים</h2>
        <p className="text-body-sm text-on-surface-variant">
          הגדר את סכומי התשלום והוראות למשפחות (אופציונלי)
        </p>
      </div>

      {/* Monthly Payment Amount */}
      <div className="space-y-2">
        <label htmlFor="monthlyPaymentAmount" className="block text-label-lg font-medium">
          סכום תשלום חודשי (₪)
        </label>
        <input
          id="monthlyPaymentAmount"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={data.monthlyPaymentAmount || ''}
          onChange={(e) =>
            onUpdate({
              ...data,
              monthlyPaymentAmount: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="150"
        />
        <p className="text-body-sm text-on-surface-variant">
          הסכום החודשי הסטנדרטי שמשפחות ישלמו
        </p>
      </div>

      {/* Payment Instructions */}
      <div className="space-y-2">
        <label htmlFor="paymentInstructions" className="block text-label-lg font-medium">
          הוראות תשלום
        </label>
        <textarea
          id="paymentInstructions"
          value={data.paymentInstructions || ''}
          onChange={(e) => onUpdate({ ...data, paymentInstructions: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="לדוגמה: העברה בנקאית לחשבון מספר 12345, בנק לאומי סניף 678"
          rows={5}
        />
        <p className="text-body-sm text-on-surface-variant">
          הוראות אלו יוצגו למשפחות כאשר הן צריכות לשלם
        </p>
      </div>

      <div className="bg-primary-container/30 rounded-lg p-4">
        <p className="text-body-sm text-on-surface-variant">
          💡 <strong>טיפ:</strong> ניתן לשנות הגדרות אלו בכל עת מהגדרות המערכת
        </p>
      </div>
    </div>
  );
}
