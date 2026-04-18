'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle } from 'lucide-react';

type Organization = {
  id: string;
  name: string;
  userRole: string;
};

type OrganizationSelectionProps = {
  phone: string;
  organizations: Organization[];
  onSelect: (organizationId: string) => void;
  onBack: () => void;
};

export function OrganizationSelection({
  phone,
  organizations,
  onSelect,
  onBack,
}: OrganizationSelectionProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedOrgId) {
      onSelect(selectedOrgId);
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'מנהל פלטפורמה';
      case 'ADMIN':
        return 'מנהל';
      case 'USER':
        return 'משתמש';
      default:
        return role;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-title-lg font-medium">בחר עמותה</h2>
        <p className="text-body-sm text-on-surface-variant">
          מספר הטלפון {phone} קיים במספר עמותות. אנא בחר לאיזו עמותה ברצונך להתחבר.
        </p>
      </div>

      {/* Organizations List */}
      <div className="space-y-3">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => setSelectedOrgId(org.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-start ${
              selectedOrgId === org.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-surface-container/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  selectedOrgId === org.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <Building2 className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h3 className="text-body-lg font-medium">{org.name}</h3>
                <p className="text-body-sm text-on-surface-variant">{getRoleLabel(org.userRole)}</p>
              </div>

              {selectedOrgId === org.id && <CheckCircle className="h-6 w-6 text-primary" />}
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleContinue}
          disabled={!selectedOrgId}
          className="btn-primary flex-1 py-3 text-title-md"
        >
          המשך
        </button>
        <button onClick={onBack} className="btn-ghost flex-1 py-3 text-title-md">
          חזור
        </button>
      </div>
    </div>
  );
}
