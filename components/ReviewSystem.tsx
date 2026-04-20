import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { Review, User as SIJMUser } from '../types.ts';

interface ReviewSystemProps {
  bookId: string;
  reviews: Review[];
  currentUser: SIJMUser | null;
  addReview: (r: Partial<Review>) => Promise<void>;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ bookId, reviews, currentUser, addReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const bookReviews = useMemo(() => 
    reviews.filter(r => r.bookId === bookId),
    [reviews, bookId]
  );

  const averageRating = useMemo(() => {
    if (bookReviews.length === 0) return 0;
    const sum = bookReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / bookReviews.length).toFixed(1);
  }, [bookReviews]);

  const hasReviewed = useMemo(() => 
    currentUser && bookReviews.some(r => r.userId === currentUser.id),
    [bookReviews, currentUser]
  );

  const handleSubmit = async () => {
    if (!currentUser || rating === 0 || !comment.trim()) return;
    setIsSubmitting(true);
    try {
      await addReview({
        bookId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        rating,
        comment: comment.trim()
      });
      setRating(0);
      setComment('');
    } catch (e) {
      console.error('Failed to submit review', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={20} /> Reader Feedback
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Real reviews from the SIJM community</p>
        </div>
        
        <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100/50">
          <div className="text-center border-r border-indigo-200 pr-4">
            <p className="text-2xl font-black text-indigo-900 leading-none">{averageRating}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1">Average</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star 
                  key={s} 
                  size={12} 
                  className={Number(averageRating) >= s ? 'fill-amber-400 text-amber-400' : 'text-indigo-200'}
                />
              ))}
            </div>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{bookReviews.length} Reviews</p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {currentUser && !hasReviewed && (
        <div className="p-8 bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/20 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Write a Review</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star 
                      size={20} 
                      className={`${(hoverRating || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this book? Your feedback helps others..."
              className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all min-h-[120px]"
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="absolute bottom-4 right-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {isSubmitting ? 'Posting...' : <><Send size={14} /> Post Review</>}
            </button>
          </div>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
        {bookReviews.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-400 italic">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          bookReviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 bg-white rounded-3xl border border-gray-100 flex gap-4 hover:shadow-lg transition-all"
            >
              <div className="shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-inner">
                  {r.userName.charAt(0)}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-indigo-950 uppercase tracking-tight">{r.userName}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          size={10} 
                          className={r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{r.comment}"</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSystem;
