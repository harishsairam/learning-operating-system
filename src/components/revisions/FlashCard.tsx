import React from 'react';
import { ChevronDown, CheckCircle2, Bookmark, Folder } from 'lucide-react';
import type { KnowledgeUnit } from '../../types';

interface FlashCardProps {
  unit: any; // Using any because of the joined relation structure (topics, categories)
  onShowAnswer: () => void;
  isAnswerVisible: boolean;
}

export function FlashCard({ unit, onShowAnswer, isAnswerVisible }: FlashCardProps) {
  
  const getImportanceColor = (imp: string | null) => {
    if (imp === 'High') return 'bg-error-container text-on-error-container';
    if (imp === 'Medium') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    return 'bg-primary-container text-on-primary-container';
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-100">
      <div className="p-8 flex-1 flex flex-col items-center justify-center text-center relative">
        
        {/* Categories & Importance */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant">
            <Folder className="w-3 h-3" />
            {unit.topics?.categories?.name || 'Category'}
          </div>
          {unit.importance && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border border-current ${getImportanceColor(unit.importance)}`}>
              {unit.importance} Importance
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-display font-bold text-on-surface mb-8">
            {unit.title || unit.topics?.name || 'Untitled Concept'}
          </h2>
          
          {unit.active_recall_questions && unit.active_recall_questions.length > 0 ? (
            <div className="text-left w-full max-w-lg mx-auto bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Recall Questions
              </h4>
              <ul className="space-y-3">
                {unit.active_recall_questions.map((q: string, i: number) => (
                  <li key={i} className="flex gap-3 text-on-surface">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span className="text-lg font-medium">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-secondary italic">
              Try to recall everything you can about this topic.
            </div>
          )}
        </div>
      </div>

      {!isAnswerVisible ? (
        <div className="p-6 bg-surface-container-low border-t border-outline-variant mt-auto">
          <button
            onClick={onShowAnswer}
            className="w-full py-4 bg-primary-container text-on-primary-container rounded-xl font-bold text-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            Show Notes <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="p-8 bg-surface-container-low border-t border-outline-variant mt-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
          <h4 className="text-sm font-bold text-secondary mb-4 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" /> What I Learned
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none text-on-surface text-left bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-inner">
            {unit.what_i_learned ? (
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{unit.what_i_learned}</p>
            ) : (
              <p className="text-secondary italic">No notes provided for this unit. You might want to update it later.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
