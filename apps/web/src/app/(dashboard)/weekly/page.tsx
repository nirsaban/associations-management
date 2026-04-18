'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { DAY_NAMES } from '@/lib/constants';
import { addDays, startOfWeek } from 'date-fns';
import Link from 'next/link';

interface WeeklyTask {
  id: string;
  familyId: string;
  familyName: string;
  dayOfWeek: number;
  assigned: boolean;
  distributorId?: string;
  distributorName?: string;
  completed: boolean;
}

export default function WeeklyPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const {
    data: weeklyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['weekly', 'current', weekOffset],
    queryFn: async () => {
      const response = await api.get('/weekly/current', {
        params: { weekOffset },
      });
      return response.data.data as WeeklyTask[];
    },
  });

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDay = weeklyData
    ? weeklyData.reduce(
        (acc, task) => {
          if (!acc[task.dayOfWeek]) acc[task.dayOfWeek] = [];
          acc[task.dayOfWeek].push(task);
          return acc;
        },
        {} as Record<number, WeeklyTask[]>,
      )
    : {};

  const isManager = false; // Legacy role removed
  const isDistributor = false; // Legacy role removed

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת משימות השבוע</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-md font-headline mb-2">
          {isDistributor ? 'משימות החלוקה שלי' : 'תכנון שבועי'}
        </h1>
        <p className="text-body-md text-on-surface-variant">
          {isDistributor ? 'צפה במשימות החלוקה שלך עבור השבוע' : 'תכנן ותהל משימות שבועיות'}
        </p>
      </div>

      {/* Week Navigation */}
      <div className="mb-8 flex items-center justify-between card">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 hover:bg-surface-container rounded-md transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-title-md font-medium">
            שבוע {weekStart.getDate()}.{weekStart.getMonth() + 1} -{weekDays[6].getDate()}.
            {weekDays[6].getMonth() + 1}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 hover:bg-surface-container rounded-md transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {weekDays.map((day, idx) => {
            const dayTasks = tasksByDay[idx] || [];
            const completed = dayTasks.filter((t) => t.completed).length;
            const total = dayTasks.length;

            return (
              <div key={idx} className="card">
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-label-md text-on-surface-variant mb-1">{DAY_NAMES[idx]}</p>
                  <p className="text-title-md font-medium">
                    {day.getDate()}.{day.getMonth() + 1}
                  </p>
                  {total > 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-2">
                      {completed}/{total} הושלמו
                    </p>
                  )}
                </div>

                {dayTasks.length === 0 ? (
                  <p className="text-label-sm text-on-surface-variant text-center py-4">
                    אין משימות
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/families/${task.familyId}`}
                        className={`p-3 rounded-lg text-label-md font-medium transition-colors ${
                          task.completed
                            ? 'bg-success-container/20 text-on-success'
                            : 'bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {task.completed && (
                            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="line-clamp-2">{task.familyName}</span>
                        </div>
                        {task.distributorName && (
                          <p className="text-label-sm text-on-surface-variant mt-1">
                            {task.distributorName}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manager Actions */}
      {isManager && (
        <div className="mt-8 card text-center">
          <h3 className="text-title-md font-medium mb-2">הוסף משימות לשבוע זה</h3>
          <p className="text-body-sm text-on-surface-variant mb-4">בחר משפחות וקבע מחלקים לתרומה</p>
          <button className="btn-primary">צור משימות חדשות</button>
        </div>
      )}
    </div>
  );
}
