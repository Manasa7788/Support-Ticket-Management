import React, { useState } from 'react';
import { RoleBadge } from './Badge';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';

export const CommentSection = ({ comments = [], onAddComment, isSubmitting }) => {
  const [commentText, setCommentText] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setValidationError('Please enter a comment before submitting.');
      return;
    }

    setValidationError('');
    const success = await onAddComment(commentText.trim());
    if (success) {
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">
          Activity & Responses ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No responses yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Be the first to provide feedback or updates on this ticket.
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const isAgentComment = c.author_role === 'agent' || c.author_role === 'admin';
            const formattedTime = new Date(c.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition ${
                  isAgentComment
                    ? 'bg-indigo-50/50 border-indigo-100 ring-1 ring-indigo-500/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {c.author_name}
                    </span>
                    <RoleBadge role={c.author_role} />
                  </div>
                  <span className="text-xs text-slate-400">{formattedTime}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {c.comment}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-100">
        <label htmlFor="comment" className="block text-sm font-semibold text-slate-700 mb-2">
          Leave a Response
        </label>

        {validationError && (
          <div className="mb-3 flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="relative">
          <textarea
            id="comment"
            rows="3"
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="Type your reply, updates, or technical details here..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition shadow-indigo-200"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post Response</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
