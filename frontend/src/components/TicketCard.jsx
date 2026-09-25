import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badge';
import { MessageSquare, Calendar, User, ShieldCheck } from 'lucide-react';

export const TicketCard = ({ ticket, showCustomer = false }) => {
  const formattedDate = new Date(ticket.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            #{ticket.id}
          </span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
        {ticket.subject}
      </h3>

      <p className="text-sm text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
        {ticket.description}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {showCustomer && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{ticket.customer_name || 'Customer'}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {ticket.assigned_agent_name ? (
                <span className="text-slate-700 font-medium">Assigned: {ticket.assigned_agent_name}</span>
              ) : (
                <span className="text-amber-600 italic">Unassigned</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>{ticket.total_comments || 0} comments</span>
        </div>
      </div>
    </Link>
  );
};
