import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  MessageCircle, 
  User as UserIcon, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDocs,
  updateDoc, 
  doc, 
  deleteDoc, 
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { SermonQuestion, SermonAnswer, User } from '../types.ts';
import { formatDistanceToNow } from 'date-fns';

interface SermonQandAProps {
  sermonId: string;
  sermonTitle: string;
  currentUser: User | null;
}

const SermonQandA: React.FC<SermonQandAProps> = ({ sermonId, sermonTitle, currentUser }) => {
  const [questions, setQuestions] = useState<SermonQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, SermonAnswer[]>>({});
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleDeepLink = () => {
      const params = new URLSearchParams(window.location.search);
      const questionId = params.get('questionId');
      if (questionId) {
        setExpandedQuestionId(questionId);
        // Scroll to the question after a short delay to allow rendering
        setTimeout(() => {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1000);
      }
    };

    handleDeepLink();
    window.addEventListener('popstate', handleDeepLink);
    return () => window.removeEventListener('popstate', handleDeepLink);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'sermon_questions'),
      where('sermonId', '==', sermonId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SermonQuestion[];
      setQuestions(qData);
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.error('Questions listener error:', err);
      }
    });

    return () => unsubscribe();
  }, [sermonId, currentUser]);

  useEffect(() => {
    if (expandedQuestionId && currentUser) {
      const q = query(
        collection(db, `sermon_questions/${expandedQuestionId}/answers`),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const aData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SermonAnswer[];
        setAnswers(prev => ({ ...prev, [expandedQuestionId]: aData }));
      }, (err) => {
        if (err.code !== 'permission-denied') {
          console.error('Answers listener error:', err);
        }
      });

      return () => unsubscribe();
    }
  }, [expandedQuestionId, currentUser]);

  const sendNotification = async (targetUserId: string, title: string, message: string, type: 'question' | 'answer' | 'like', metadata: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata,
        link: `?page=sermons&sermonId=${sermonId}&questionId=${metadata.questionId || ''}`
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const questionRef = await addDoc(collection(db, 'sermon_questions'), {
        sermonId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userPhoto: '',
        content: newQuestion.trim(),
        createdAt: new Date().toISOString(),
        answerCount: 0
      });
      
      // Notify pastors and leaders about new question
      try {
        const leadershipQuery = query(
          collection(db, 'profiles'),
          where('identityRole', 'in', ['Pastor', 'Leader', 'Apostle', 'Prophet', 'Teacher', 'Evangelist'])
        );
        const leadershipSnapshot = await getDocs(leadershipQuery);
        
        const notificationPromises = leadershipSnapshot.docs
          .filter(doc => doc.id !== currentUser.id) // Don't notify self
          .map(doc => sendNotification(
            doc.id,
            'New Sermon Question',
            `${currentUser.fullName} asked a question on "${sermonTitle}"`,
            'question',
            { sermonId, questionId: questionRef.id, senderId: currentUser.id, senderName: currentUser.fullName }
          ));
        
        await Promise.all(notificationPromises);
      } catch (notifyError) {
        console.error('Error broadcasting question notification:', notifyError);
      }

      setNewQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnswer = async (questionId: string, questionAuthorId: string) => {
    if (!currentUser || !newAnswer[questionId]?.trim()) return;

    try {
      const answerRef = await addDoc(collection(db, `sermon_questions/${questionId}/answers`), {
        questionId,
        sermonId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userPhoto: '',
        content: newAnswer[questionId].trim(),
        createdAt: new Date().toISOString(),
        likes: []
      });
      
      // Update answer count on question
      await updateDoc(doc(db, 'sermon_questions', questionId), {
        answerCount: increment(1)
      });

      // Notify question author
      if (questionAuthorId !== currentUser.id) {
        await sendNotification(
          questionAuthorId,
          'New Answer to your Question',
          `${currentUser.fullName} just answered your question on "${sermonTitle}".`,
          'answer',
          { sermonId, questionId, answerId: answerRef.id, senderId: currentUser.id, senderName: currentUser.fullName }
        );
      }

      setNewAnswer(prev => ({ ...prev, [questionId]: '' }));
    } catch (error) {
      console.error('Error posting answer:', error);
    }
  };

  const handleLikeAnswer = async (questionId: string, answer: SermonAnswer, hasLiked: boolean) => {
    if (!currentUser) return;

    try {
      const answerRef = doc(db, `sermon_questions/${questionId}/answers`, answer.id);
      await updateDoc(answerRef, {
        likes: hasLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });

      // Notify answer author if liked
      if (!hasLiked && answer.userId !== currentUser.id) {
        await sendNotification(
          answer.userId,
          'Your answer was liked!',
          `${currentUser.fullName} liked your answer on "${sermonTitle}".`,
          'like',
          { sermonId, questionId, answerId: answer.id, senderId: currentUser.id, senderName: currentUser.fullName }
        );
      }
    } catch (error) {
      console.error('Error liking answer:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'sermon_questions', questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Sermon Q&A</h3>
          <p className="text-slate-500 text-sm font-medium">Deepen your understanding through community discussion.</p>
        </div>
      </div>

      {/* Ask Question Form */}
      {currentUser ? (
        <form onSubmit={handleAskQuestion} className="relative group">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this sermon..."
            className="w-full bg-white border border-slate-200 rounded-3xl py-6 pl-8 pr-20 text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600/50 focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-xl shadow-slate-200/20 min-h-[120px] resize-none"
          />
          <button
            type="submit"
            disabled={!newQuestion.trim() || isSubmitting}
            className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      ) : (
        <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
          <p className="text-slate-500 font-medium">Please sign in to ask questions or participate in the discussion.</p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {questions.map((q) => (
            <motion.div
              key={q.id}
              id={`question-${q.id}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                      {q.userPhoto ? (
                        <img src={q.userPhoto} alt={q.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-950">{q.userName}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  {currentUser?.id === q.userId && (
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <p className="text-slate-700 text-lg font-medium leading-relaxed mb-8">
                  {q.content}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <button
                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:text-indigo-950 transition-all"
                  >
                    <MessageCircle size={18} />
                    {q.answerCount || 0} {q.answerCount === 1 ? 'Answer' : 'Answers'}
                    {expandedQuestionId === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Answers Section */}
                <AnimatePresence>
                  {expandedQuestionId === q.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 space-y-6">
                        {/* Answer Input */}
                        {currentUser && (
                          <div className="flex gap-4">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={newAnswer[q.id] || ''}
                                onChange={(e) => setNewAnswer(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Write an answer..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-16 text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600/50 transition-all"
                              />
                              <button
                                onClick={() => handlePostAnswer(q.id, q.userId)}
                                disabled={!newAnswer[q.id]?.trim()}
                                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Answers List */}
                        <div className="space-y-4">
                          {answers[q.id]?.map((a) => {
                            const hasLiked = currentUser ? a.likes?.includes(currentUser.id) : false;
                            return (
                              <div key={a.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                                      {a.userPhoto ? (
                                        <img src={a.userPhoto} alt={a.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <UserIcon size={16} />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-indigo-950">{a.userName}</h5>
                                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleLikeAnswer(q.id, a, hasLiked)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                      hasLiked 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                        : 'bg-white text-slate-400 hover:text-indigo-600 border border-slate-100'
                                    }`}
                                  >
                                    <ThumbsUp size={12} fill={hasLiked ? 'currentColor' : 'none'} />
                                    {a.likes?.length || 0}
                                  </button>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                  {a.content}
                                </p>
                              </div>
                            );
                          })}
                          {answers[q.id]?.length === 0 && (
                            <p className="text-center py-8 text-slate-400 text-sm font-medium italic">
                              No answers yet. Be the first to respond!
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-xl font-bold text-indigo-950 mb-2">No Questions Yet</h4>
            <p className="text-slate-500 font-medium">Be the first to ask a question about this sermon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SermonQandA;
