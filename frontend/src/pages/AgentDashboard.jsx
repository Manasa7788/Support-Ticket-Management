import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi, usersApi } from '../api/client';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { TicketCard } from '../components/TicketCard';
import { TicketFilter } from '../components/TicketFilter';
import { Modal } from '../components/Modal';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Flame,
  UserCheck,
  RefreshCw,
  FolderOpen,
  Filter,
  User,
  ShieldCheck
} from 'lucide-react';

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    unassigned: 0,
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest');
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'me', 'unassigned'

  // Quick Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState(null);
  const [targetAgentId, setTargetAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await ticketsApi.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await usersApi.getAgents();
      if (res.data.success) {
        setAgents(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (sort) params.sort = sort;

      if (assignmentFilter === 'me') {
        params.assigned_to = 'me';
      } else if (assignmentFilter === 'unassigned') {
        params.assigned_to = 'unassigned';
      }

      const res = await ticketsApi.getAll(params);
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [search, status, priority, sort, assignmentFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setSort('newest');
    setAssignmentFilter('all');
  };

  const openAssignModal = (ticket) => {
    setSelectedTicketForAssign(ticket);
    setTargetAgentId(ticket.assigned_to ? String(ticket.assigned_to) : '');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketForAssign) return;

    setAssigning(true);
    try {
      await ticketsApi.update(selectedTicketForAssign.id, {
        assigned_to: targetAgentId ? Number(targetAgentId) : null,
      });
      setAssignModalOpen(false);
      fetchTickets();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update agent assignment.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Support Agent Center
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Staff Console
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Welcome, <span className="font-semibold text-slate-700">{user?.name}</span>. Monitor tickets, allocate requests, and coordinate customer resolutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchTickets();
                fetchStats();
              }}
              title="Refresh tickets and stats"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 text-sm font-semibold shadow-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Agent Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
          <StatCard
            title="Total"
            value={stats.total}
            icon={Ticket}
            color="slate"
            onClick={() => handleResetFilters()}
          />
          <StatCard
            title="Open"
            value={stats.open}
            icon={AlertCircle}
            color="blue"
            onClick={() => setStatus('OPEN')}
            active={status === 'OPEN'}
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon={Clock}
            color="amber"
            onClick={() => setStatus('IN_PROGRESS')}
            active={status === 'IN_PROGRESS'}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle}
            color="emerald"
            onClick={() => setStatus('RESOLVED')}
            active={status === 'RESOLVED'}
          />
          <StatCard
            title="Urgent"
            value={stats.urgent}
            icon={Flame}
            color="rose"
            onClick={() => setPriority('URGENT')}
            active={priority === 'URGENT'}
          />
          <StatCard
            title="Unassigned"
            value={stats.unassigned}
            icon={UserCheck}
            color="indigo"
            onClick={() => setAssignmentFilter('unassigned')}
            active={assignmentFilter === 'unassigned'}
          />
        </div>

        {/* View Segment Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2 text-sm font-medium">
          <button
            onClick={() => setAssignmentFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              assignmentFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Tickets ({stats.total})
          </button>
          <button
            onClick={() => setAssignmentFilter('me')}
            className={`px-4 py-2 rounded-lg transition ${
              assignmentFilter === 'me'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setAssignmentFilter('unassigned')}
            className={`px-4 py-2 rounded-lg transition ${
              assignmentFilter === 'unassigned'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unassigned Pool ({stats.unassigned})
          </button>
        </div>

        {/* Search and Filters */}
        <TicketFilter
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          priority={priority}
          setPriority={setPriority}
          sort={sort}
          setSort={setSort}
          onReset={handleResetFilters}
        />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Ticket List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Loading support queue...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No tickets found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              No support tickets match the selected filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="relative group">
                <TicketCard ticket={ticket} showCustomer={true} />
                {/* Quick Assign action button for agents */}
                <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openAssignModal(ticket);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
                  >
                    Quick Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Assign Agent Modal */}
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title={`Assign Ticket #${selectedTicketForAssign?.id}`}
        >
          {selectedTicketForAssign && (
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Subject</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">
                  {selectedTicketForAssign.subject}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Assign to Agent
                </label>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Unassigned --</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {assigning ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </main>
    </div>
  );
};
