import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDueRevisions, useSubmitRevisionSession } from '../hooks/useRevisions';
import { FlashCard } from '../components/revisions/FlashCard';
import { SRSControls } from '../components/revisions/SRSControls';
import { CheckCircle2, ArrowLeft, Trophy, Clock, Brain, CalendarCheck, Target } from 'lucide-react';
import type { KnowledgeUnit } from '../types';

export default function RevisionSession() {
  const navigate = useNavigate();
  const { data: dueRevisions, isLoading } = useDueRevisions();
  const submitSession = useSubmitRevisionSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  
  // Track the reviews we've completed in this session
  const [reviews, setReviews] = useState<Array<{
    knowledge_unit_id: string;
    project_id: string;
    category_id: string;
    topic_id: string;
    status: 'Easy' | 'Good' | 'Hard' | 'Again';
    timeSpentSeconds: number;
    previousEase: number;
    previousInterval: number;
    previousRepetitions: number;
    questionsCount: number;
  }>>([]);

  const isComplete = dueRevisions && currentIndex >= dueRevisions.length;

  useEffect(() => {
    // Reset start time when card changes
    setCardStartTime(Date.now());
    setIsAnswerVisible(false);
  }, [currentIndex]);

  const handleRate = (status: 'Easy' | 'Good' | 'Hard' | 'Again') => {
    if (!dueRevisions || !dueRevisions[currentIndex]) return;
    
    const unit = dueRevisions[currentIndex] as KnowledgeUnit;
    const timeSpentSeconds = Math.floor((Date.now() - cardStartTime) / 1000);
    const questionsCount = unit.active_recall_questions?.length || 0;

    const newReview = {
      knowledge_unit_id: unit.id,
      project_id: unit.project_id,
      category_id: unit.category_id,
      topic_id: unit.topic_id,
      status,
      timeSpentSeconds,
      previousEase: unit.srs_ease_factor,
      previousInterval: unit.srs_interval,
      previousRepetitions: unit.srs_repetitions,
      questionsCount
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);

    if (currentIndex + 1 >= dueRevisions.length) {
      // Finished all cards, submit session
      submitSession.mutate({
        session_id: null,
        reviews: updatedReviews
      });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 animate-pulse text-secondary">Loading your revision session...</div>;
  }

  if (dueRevisions?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-8 text-primary shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="font-display text-4xl font-bold text-on-surface mb-4">All caught up!</h2>
        <p className="text-secondary text-lg mb-8 max-w-md">You've completed all your scheduled revisions for today. Take a break or learn something new.</p>
        <button onClick={() => navigate('/activities')} className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors shadow-lg hover:-translate-y-0.5">
          Go to Learning Log
        </button>
      </div>
    );
  }

  if (isComplete) {
    const totalTimeSeconds = reviews.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = totalTimeSeconds % 60;
    const formattedTime = `${minutes}m ${seconds}s`;
    
    const totalQuestions = reviews.reduce((acc, r) => acc + r.questionsCount, 0);

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-3xl p-10 md:p-14 text-center shadow-xl">
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-8">Session Complete!</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center">
              <Brain className="w-5 h-5 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-on-surface mb-1">{reviews.length}</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Topics</div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center">
              <Target className="w-5 h-5 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-on-surface mb-1">{totalQuestions}</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Questions</div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center">
              <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-on-surface mb-1">{formattedTime}</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Time Spent</div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center">
              <CalendarCheck className="w-5 h-5 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-on-surface mb-1">{reviews.length}</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Scheduled</div>
            </div>
          </div>
          
          <div className="mb-10 text-left">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-secondary uppercase tracking-wider">Completion</span>
               <span className="text-sm font-bold text-primary">100%</span>
             </div>
             <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
               <div className="h-full bg-primary rounded-full w-full"></div>
             </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')} 
            disabled={submitSession.isPending}
            className="w-full px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitSession.isPending ? 'Saving...' : 'Finish Session'}
          </button>
        </div>
      </div>
    );
  }

  const currentUnit = dueRevisions[currentIndex] as KnowledgeUnit;
  const progressPercent = ((currentIndex) / dueRevisions.length) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 shrink-0 gap-4">
        <button 
          onClick={() => navigate('/revisions')} 
          className="text-secondary hover:text-on-surface transition-colors flex items-center gap-2 font-semibold self-start md:self-auto"
        >
          <ArrowLeft className="w-5 h-5" /> Leave Session
        </button>
        
        {/* Progress Bar */}
        <div className="w-full md:max-w-md flex items-center gap-4">
          <div className="h-2 flex-1 bg-surface-container-high rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary rounded-full transition-all duration-300"
               style={{ width: `${progressPercent}%` }}
             ></div>
          </div>
          <div className="text-sm font-bold text-secondary bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap">
            {currentIndex + 1} / {dueRevisions.length}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto pb-12 z-10">
        <FlashCard 
          unit={currentUnit} 
          isAnswerVisible={isAnswerVisible} 
          onShowAnswer={() => setIsAnswerVisible(true)} 
        />
        
        {isAnswerVisible && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SRSControls onRate={handleRate} />
          </div>
        )}
      </div>
    </div>
  );
}

