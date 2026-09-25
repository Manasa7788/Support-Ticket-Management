import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/client';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { TicketCard } from '../components/TicketCard';
import { TicketFilter } from '../components/TicketFilter';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (sort) params.sort = sort;

      const response = await ticketsApi.getAll(params);
      if (response.data.success) {
        setTickets(response.data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch your support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, status, priority, sort]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setSort('newest');
  };

  // Metrics for customer dashboard
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Customer Support Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Track and manage your raised issues.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              title="Refresh tickets list"
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-indigo-600 shadow-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Raise New Ticket
            </Link>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Raised"
            value={totalCount}
            icon={Ticket}
            color="indigo"
            subtitle="Lifetime tickets"
          />
          <StatCard
            title="Open"
            value={openCount}
            icon={AlertCircle}
            color="blue"
            subtitle="Awaiting response"
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            color="amber"
            subtitle="Being reviewed"
          />
          <StatCard
            title="Resolved / Closed"
            value={resolvedCount}
            icon={CheckCircle}
            color="emerald"
            subtitle="Completed"
          />
        </div>

        {/* Filter Bar */}
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

        {/* Tickets List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No tickets found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {search || status || priority
                ? 'No tickets match the selected filters. Try changing or clearing your filter criteria.'
                : "You haven't submitted any support requests yet. If you are experiencing any issue, let us know!"}
            </p>
            {search || status || priority ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                to="/tickets/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Submit Your First Ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} showCustomer={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
