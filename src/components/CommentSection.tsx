import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Comment } from '../types/blog';

const CommentSection: React.FC<{ comments: Comment[]; onAddComment: (comment: string, replyToId?: string) => void; onLikeComment: (commentId: string) => void }> = ({ comments, onAddComment, onLikeComment }) => {
  const { t, i18n } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const getLocale = () => {
    switch (i18n.language) {
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'zh': return 'zh-CN';
      default: return 'en-US';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    await onAddComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyComment.trim() || !replyToId) return;

    setIsSubmittingReply(true);
    await onAddComment(replyComment, replyToId);
    setReplyComment('');
    setReplyToId(null);
    setIsSubmittingReply(false);
  };

  const handleReplyClick = (commentId: string) => {
    setReplyToId(commentId);
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyComment('');
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6">{t('blog.comments')} ({comments.length})</h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('blog.writeComment')}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={4}
          />
        </div>
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('blog.submitting') : t('blog.postComment')}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 pb-6">
            <div className="flex items-start gap-4">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-medium text-gray-900">{comment.author.name}</h4>
                  <span className="ml-auto text-sm text-gray-500">{new Date(comment.date).toLocaleDateString(getLocale())}</span>
                </div>
                <p className="text-gray-700 mb-3">{comment.content}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onLikeComment(comment.id)}
                    className={`flex items-center gap-1 text-sm ${comment.isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={comment.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {comment.likes}
                  </button>
                  <button
                    onClick={() => handleReplyClick(comment.id)}
                    className="text-sm text-gray-500 hover:text-teal-600 transition-colors"
                  >
                    {t('blog.reply')}
                  </button>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <form onSubmit={handleReplySubmit} className="mt-4 ml-8">
                    <div className="mb-3">
                      <textarea
                        value={replyComment}
                        onChange={(e) => setReplyComment(e.target.value)}
                        placeholder={t('blog.writeReply')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!replyComment.trim() || isSubmittingReply}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReply ? t('blog.submitting') : t('blog.postReply')}
                      </button>
                      <button
                        type="button"
                        onClick={cancelReply}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        {t('blog.cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-8 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <img
                          src={reply.author.avatar}
                          alt={reply.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h5 className="font-medium text-sm text-gray-900">{reply.author.name}</h5>
                            <span className="ml-auto text-xs text-gray-500">{new Date(reply.date).toLocaleDateString(getLocale())}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => onLikeComment(reply.id)}
                              className={`flex items-center gap-1 text-xs ${reply.isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill={reply.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {reply.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;