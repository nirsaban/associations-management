'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Eye, UserPlus, Power, PowerOff } from 'lucide-react';
import { CreateAdminModal } from './CreateAdminModal';
import { usePlatform } from '@/hooks/usePlatform';

type Organization = {
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

type OrganizationsListProps = {
  organizations: Organization[];
  isLoading: boolean;
  onRefresh: () => void;
};

export function OrganizationsList({ organizations, isLoading, onRefresh }: OrganizationsListProps) {
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const { toggleOrganizationStatus } = usePlatform();

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleOrganizationStatus.mutateAsync({ id, isActive: !currentStatus });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleAdminCreated = () => {
    setSelectedOrganization(null);
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-body-md text-on-surface-variant">טוען עמותות...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <p className="text-title-lg mb-2">אין עמותות במערכת</p>
        <p className="text-body-md text-on-surface-variant">צור עמותה חדשה כדי להתחיל</p>
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
              {organizations.map((organization) => (
                <tr key={organization.id} className="hover:bg-surface-container/50">
                  <td className="px-6 py-4 text-body-md font-medium">{organization.name}</td>
                  <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">
                    {organization.slug}
                  </td>
                  <td className="px-6 py-4 text-body-md">
                    {organization.firstAdmin?.fullName || (
                      <span className="text-on-surface-variant italic">אין מנהל</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-body-sm font-mono">
                    {organization.firstAdmin?.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm ${
                        organization.isActive
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {organization.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm ${
                        organization.setupCompleted
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {organization.setupCompleted ? 'הושלם' : 'בהמתנה'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                    {formatDistanceToNow(new Date(organization.createdAt), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!organization.firstAdmin && (
                        <button
                          onClick={() => setSelectedOrganization(organization.id)}
                          className="p-2 hover:bg-primary/10 rounded-md transition-colors"
                          title="צור מנהל ראשון"
                        >
                          <UserPlus className="h-4 w-4 text-primary" />
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleStatus(organization.id, organization.isActive)}
                        className="p-2 hover:bg-surface-container rounded-md transition-colors"
                        title={organization.isActive ? 'השבת' : 'הפעל'}
                        disabled={toggleOrganizationStatus.isPending}
                      >
                        {organization.isActive ? (
                          <PowerOff className="h-4 w-4 text-error" />
                        ) : (
                          <Power className="h-4 w-4 text-success" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          /* TODO: Navigate to details */
                        }}
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
      {selectedOrganization && (
        <CreateAdminModal
          organizationId={selectedOrganization}
          onClose={() => setSelectedOrganization(null)}
          onSuccess={handleAdminCreated}
        />
      )}
    </>
  );
}
