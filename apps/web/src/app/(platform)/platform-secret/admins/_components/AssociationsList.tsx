'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Eye, UserPlus, Power, PowerOff } from 'lucide-react';
import { CreateAdminModal } from './CreateAdminModal';
import { usePlatform } from '@/hooks/usePlatform';

type Association = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  setupCompleted: boolean;
  createdAt: string;
  firstAdmin?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
};

type AssociationsListProps = {
  associations: Association[];
  isLoading: boolean;
  onRefresh: () => void;
};

export function AssociationsList({ associations, isLoading, onRefresh }: AssociationsListProps) {
  const [selectedAssociation, setSelectedAssociation] = useState<string | null>(null);
  const { toggleAssociationStatus } = usePlatform();

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAssociationStatus.mutateAsync({ id, isActive: !currentStatus });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleAdminCreated = () => {
    setSelectedAssociation(null);
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-body-md text-on-surface-variant">טוען עמותות...</p>
      </div>
    );
  }

  if (associations.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <p className="text-title-lg mb-2">אין עמותות במערכת</p>
        <p className="text-body-md text-on-surface-variant">
          צור עמותה חדשה כדי להתחיל
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-border">
              <tr>
                <th className="px-6 py-4 text-start text-label-md">שם העמותה</th>
                <th className="px-6 py-4 text-start text-label-md">Slug</th>
                <th className="px-6 py-4 text-start text-label-md">מנהל ראשון</th>
                <th className="px-6 py-4 text-start text-label-md">טלפון</th>
                <th className="px-6 py-4 text-start text-label-md">סטטוס</th>
                <th className="px-6 py-4 text-start text-label-md">הקמה</th>
                <th className="px-6 py-4 text-start text-label-md">נוצר</th>
                <th className="px-6 py-4 text-start text-label-md">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {associations.map((association) => (
                <tr key={association.id} className="hover:bg-surface-container/50">
                  <td className="px-6 py-4 text-body-md font-medium">
                    {association.name}
                  </td>
                  <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">
                    {association.slug}
                  </td>
                  <td className="px-6 py-4 text-body-md">
                    {association.firstAdmin?.fullName || (
                      <span className="text-on-surface-variant italic">אין מנהל</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-body-sm font-mono">
                    {association.firstAdmin?.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm ${
                        association.isActive
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {association.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm ${
                        association.setupCompleted
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {association.setupCompleted ? 'הושלם' : 'בהמתנה'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                    {formatDistanceToNow(new Date(association.createdAt), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!association.firstAdmin && (
                        <button
                          onClick={() => setSelectedAssociation(association.id)}
                          className="p-2 hover:bg-primary/10 rounded-md transition-colors"
                          title="צור מנהל ראשון"
                        >
                          <UserPlus className="h-4 w-4 text-primary" />
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleStatus(association.id, association.isActive)}
                        className="p-2 hover:bg-surface-container rounded-md transition-colors"
                        title={association.isActive ? 'השבת' : 'הפעל'}
                        disabled={toggleAssociationStatus.isPending}
                      >
                        {association.isActive ? (
                          <PowerOff className="h-4 w-4 text-error" />
                        ) : (
                          <Power className="h-4 w-4 text-success" />
                        )}
                      </button>

                      <button
                        onClick={() => {/* TODO: Navigate to details */}}
                        className="p-2 hover:bg-surface-container rounded-md transition-colors"
                        title="צפייה בפרטים"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {selectedAssociation && (
        <CreateAdminModal
          associationId={selectedAssociation}
          onClose={() => setSelectedAssociation(null)}
          onSuccess={handleAdminCreated}
        />
      )}
    </>
  );
}
