'use client';

import React, { useState } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { OrganizationsList } from './_components/OrganizationsList';
import { CreateOrganizationModal } from './_components/CreateOrganizationModal';
import { Plus } from 'lucide-react';

export default function PlatformAdminsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { getOrganizations } = usePlatform();

  const { data, isLoading, refetch } = getOrganizations({
    page: 1,
    limit: 20,
  });

  const handleOrganizationCreated = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-headline-lg font-headline mb-2">
              ניהול פלטפורמה
            </h1>
            <p className="text-body-md text-on-surface-variant">
              ניהול עמותות ומנהלים בפלטפורמה
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            עמותה חדשה
          </button>
        </div>

        {/* Organizations List */}
        <OrganizationsList
          organizations={data?.data || []}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* Create Organization Modal */}
        {isCreateModalOpen && (
          <CreateOrganizationModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleOrganizationCreated}
          />
        )}
      </div>
    </div>
  );
}
