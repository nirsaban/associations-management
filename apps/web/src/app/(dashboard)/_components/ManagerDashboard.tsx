'use client';

import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { Users, Home, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function ManagerDashboard() {
  const { managerDashboard } = useDashboard();
  const { data, isLoading, error } = managerDashboard;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הדשבורד</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline mb-2">{data?.groupName || 'הקבוצה שלי'}</h1>
        <p className="text-body-md text-on-surface-variant">ברוך בואך למערכת ניהול הקבוצה</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">חברים</p>
              <p className="text-headline-md font-bold text-primary">{data?.memberCount || 0}</p>
            </div>
            <Users className="h-8 w-8 text-primary/20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">משפחות</p>
              <p className="text-headline-md font-bold text-secondary">{data?.familyCount || 0}</p>
            </div>
            <Home className="h-8 w-8 text-secondary/20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">משימות ממתינות</p>
              <p className="text-headline-md font-bold text-warning">{data?.pendingTasks || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-warning/20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">הזמנות השבוע</p>
              <p className="text-headline-md font-bold text-tertiary">
                {data?.thisWeekOrders || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-tertiary/20" />
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div>
        <h2 className="text-headline-md font-headline mb-4">סקירת השבוע</h2>
        <div className="space-y-3">
          {data?.weeklyOverview?.map((day, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-title-md font-medium text-primary">{day.day}</span>
                  </div>
                  <div>
                    <p className="text-title-md font-medium">{day.familiesServed} משפחות</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {day.status === 'completed' ? 'הושלם' : 'ממתין'}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-label-sm font-medium ${
                    day.status === 'completed'
                      ? 'bg-success-container text-on-success-container'
                      : 'bg-warning-container text-on-warning-container'
                  }`}
                >
                  {day.status === 'completed' ? '✓' : 'ממתין'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <h2 className="text-headline-md font-headline mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/weekly" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-title-md font-medium mb-2">קח הזמנות השבוע</h3>
            <p className="text-body-sm text-on-surface-variant">הוסף משימות לחלוקה שבועית</p>
          </Link>

          <Link href="/families" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-title-md font-medium mb-2">ניהול משפחות</h3>
            <p className="text-body-sm text-on-surface-variant">צפה בנתוני משפחות וצור קשר</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
