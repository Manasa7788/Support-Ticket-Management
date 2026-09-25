import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/client';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';

export const CreateTicket = () => {
  const navigate = useNavigate();
  const { isAgent } = useAuth();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required.';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters.';
    } else if (formData.subject.trim().length > 255) {
      newErrors.subject = 'Subject cannot exceed 255 characters.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Please provide a clear description (at least 5 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await ticketsApi.create({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      });

      if (res.data.success) {
        navigate(`/tickets/${res.data.ticket.id}`);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.error ||
          (err.response?.data?.details && err.response.data.details.join(', ')) ||
          'Failed to create ticket. Please check input.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to={isAgent ? '/agent/dashboard' : '/customer/dashboard'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create New Support Ticket
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Please describe your issue or inquiry with as much detail as possible so our support team can assist you promptly.
            </p>
          </div>

          {serverError && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ticket Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value });
                  if (errors.subject) setErrors({ ...errors, subject: '' });
                }}
                placeholder="e.g. Cannot download monthly invoice PDF"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.subject
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="LOW">Low - General question or minor request</option>
                <option value="MEDIUM">Medium - Normal operational inquiry (Default)</option>
                <option value="HIGH">High - Significant business impairment</option>
                <option value="URGENT">Urgent - Critical outage or production failure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="6"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                placeholder="Explain the problem in detail: steps to reproduce, error codes, expected behavior, affected users..."
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition ${
                  errors.description
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to={isAgent ? '/agent/dashboard' : '/customer/dashboard'}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Ticket...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
