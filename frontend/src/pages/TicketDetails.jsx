import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi, usersApi } from '../api/client';
import { Navbar } from '../components/Navbar';
import { StatusBadge, PriorityBadge, RoleBadge } from '../components/Badge';
import { CommentSection } from '../components/CommentSection';
import {
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';

export const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAgent } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Edit ticket state for customer
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchTicketDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        ticketsApi.getById(id),
        ticketsApi.getComments(id),
      ]);

      if (ticketRes.data.success) {
        setTicket(ticketRes.data.ticket);
        setEditSubject(ticketRes.data.ticket.subject);
        setEditDescription(ticketRes.data.ticket.description);
      }

      if (commentsRes.data.success) {
        setComments(commentsRes.data.comments || []);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access forbidden: You do not have permission to view this ticket.');
      } else if (err.response?.status === 404) {
        setError(`Ticket #${id} does not exist or has been removed.`);
      } else {
        setError(err.response?.data?.error || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsList = async () => {
    if (isAgent) {
      try {
        const res = await usersApi.getAgents();
        if (res.data.success) {
          setAgents(res.data.users || []);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchAgentsList();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await ticketsApi.update(id, { status: newStatus });
      if (res.data.success) {
        setTicket(res.data.ticket);
        setActionSuccess(`Ticket status updated to ${newStatus}.`);
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await ticketsApi.update(id, { priority: newPriority });
      if (res.data.success) {
        setTicket(res.data.ticket);
        setActionSuccess(`Ticket priority updated to ${newPriority}.`);
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority.');
    }
  };

  const handleAssignAgent = async (agentId) => {
    try {
      const res = await ticketsApi.update(id, {
        assigned_to: agentId ? Number(agentId) : null,
      });
      if (res.data.success) {
        setTicket(res.data.ticket);
        setActionSuccess('Agent assignment updated successfully.');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update agent assignment.');
    }
  };

  const handleSaveCustomerEdit = async (e) => {
    e.preventDefault();
    if (!editSubject.trim() || !editDescription.trim()) {
      alert('Subject and description cannot be empty.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await ticketsApi.update(id, {
        subject: editSubject.trim(),
        description: editDescription.trim(),
      });
      if (res.data.success) {
        setTicket(res.data.ticket);
        setIsEditing(false);
        setActionSuccess('Ticket updated successfully.');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update ticket.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTicket = async () => {
    const confirm = window.confirm(
      `Are you sure you want to delete ticket #${id}? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      await ticketsApi.delete(id);
      alert('Ticket deleted successfully.');
      navigate(isAgent ? '/agent/dashboard' : '/customer/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete ticket.');
    }
  };

  const handleAddComment = async (commentText) => {
    setIsSubmittingComment(true);
    try {
      const res = await ticketsApi.addComment(id, { comment: commentText });
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        return true;
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment.');
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load ticket</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Ticket could not be found.'}</p>
          <Link
            to={isAgent ? '/agent/dashboard' : '/customer/dashboard'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm transition hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isCustomerOwner = user?.id === ticket.user_id;
  const canCustomerEdit = isCustomerOwner && ticket.status === 'OPEN';
  const formattedDate = new Date(ticket.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const updatedDate = new Date(ticket.updated_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to={isAgent ? '/agent/dashboard' : '/customer/dashboard'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {isAgent ? 'Support Queue' : 'My Tickets'}
          </Link>

          {/* Delete Ticket action */}
          {(isAgent || canCustomerEdit) && (
            <button
              onClick={handleDeleteTicket}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Ticket
            </button>
          )}
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Ticket Info & Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header & Description Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    #{ticket.id}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formattedDate}</span>
                </div>
              </div>

              {isEditing ? (
                /* Customer Edit Form */
                <form onSubmit={handleSaveCustomerEdit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows="5"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-900 leading-snug">
                      {ticket.subject}
                    </h2>
                    {canCustomerEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Description & Details
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Last updated: {updatedDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Comment Section Thread */}
            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
              isSubmitting={isSubmittingComment}
            />
          </div>

          {/* Sidebar Column: Customer Info & Management Controls */}
          <div className="space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                Requester Information
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {ticket.customer_name ? ticket.customer_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ticket.customer_name}</p>
                  <p className="text-xs text-slate-500">{ticket.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Agent Management Console */}
            {isAgent && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agent Controls
                </h3>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Priority
                  </label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Assigned Agent Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Agent
                  </label>
                  <select
                    value={ticket.assigned_to || ''}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Ticket Assignment Summary (Visible to Customer) */}
            {!isAgent && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                  Assigned Support Agent
                </h3>
                {ticket.assigned_agent_name ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {ticket.assigned_agent_name}
                      </p>
                      <p className="text-xs text-slate-500">{ticket.assigned_agent_email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Your ticket is in the queue awaiting agent assignment.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
