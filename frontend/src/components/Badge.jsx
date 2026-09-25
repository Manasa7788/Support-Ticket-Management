import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  const styles = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/20',
  };

  const labels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${
        styles[normalized] || 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {labels[normalized] || status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const normalized = (priority || '').toUpperCase();

  const styles = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  const labels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
        styles[normalized] || 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
    >
      {labels[normalized] || priority}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const normalized = (role || '').toLowerCase();

  const styles = {
    customer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    agent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
        styles[normalized] || 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
    >
      {role}
    </span>
  );
};
