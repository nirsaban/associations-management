'use client';

import React, { useState } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { AssociationsList } from './_components/AssociationsList';
import { CreateAssociationModal } from './_components/CreateAssociationModal';
import { Plus } from 'lucide-react';

export default function PlatformAdminsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { getAssociations } = usePlatform();

  const { data, isLoading, refetch } = getAssociations({
    page: 1,
    limit: 20,
  });

  const handleAssociationCreated = () => {
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

        {/* Associations List */}
        <AssociationsList
          associations={data?.data || []}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* Create Association Modal */}
        {isCreateModalOpen && (
          <CreateAssociationModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleAssociationCreated}
          />
        )}
      </div>
    </div>
  );
}
