import React from 'react';
import { Clock3, ChevronRight } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const safeFormat = (dateVal: any, formatStr: string, fallback: string | null = null) => {
  if (!dateVal) return fallback;
  const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
  return isValid(d) ? format(d, formatStr) : fallback;
};

export function LearningLogRow({ activity }: { activity: any; key?: React.Key }) {
  const projectName = activity.projects?.name;
  const categoryName = activity.categories?.name;
  const topicName = activity.topics?.name || activity.topic_id || 'Unknown Topic';
  
  const breadcrumbParts = [projectName, categoryName, topicName].filter(Boolean);
  
  // Subject Badge: Prefer Category, then Project, then fallback.
  const subjectName = categoryName || projectName || 'General';

  // Time display
  let timeDisplay = 'No study time';
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const processDate = (dateVal: any) => {
    const formattedTime = safeFormat(dateVal, 'h:mm a');
    if (formattedTime) {
      const isToday = safeFormat(dateVal, 'yyyy-MM-dd') === todayStr;
      const durationStr = activity.duration_minutes ? ` • ${activity.duration_minutes}m` : '';
      timeDisplay = (isToday ? `Today • ${formattedTime}` : formattedTime) + durationStr;
      return true;
    }
    return false;
  };

  if (activity.start_time) {
    processDate(activity.start_time);
  } else if (activity.created_at && timeDisplay === 'No study time') {
    processDate(activity.created_at);
  }
  
  // If we couldn't parse a time but we have a duration, show it
  if (timeDisplay === 'No study time' && activity.duration_minutes) {
    timeDisplay = `${activity.duration_minutes}m`;
  }

  // Generate a pseudo-random but consistent color based on subjectName length/chars
  const colors = [
    'bg-indigo-50 text-indigo-700 border-indigo-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100'
  ];
  const colorIndex = subjectName.length % colors.length;
  const badgeColor = colors[colorIndex];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h4 className="font-bold text-base text-on-surface leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
            📘 {topicName}
          </h4>
          {breadcrumbParts.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary/80 flex-wrap">
              {breadcrumbParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  <span>{part}</span>
                  {idx < breadcrumbParts.length - 1 && <span className="text-outline-variant">→</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-dashed border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
            <Clock3 className="w-3.5 h-3.5" />
            <span>{timeDisplay}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
            {subjectName}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -mr-1" />
      </div>
    </div>
  );
}
