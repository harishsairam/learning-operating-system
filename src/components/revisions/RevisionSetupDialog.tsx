import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, CheckSquare, Square, ClipboardPaste, BookOpen } from 'lucide-react';
import { useActivityKnowledgeUnits, useUpdateKnowledgeUnit } from '../../hooks/useKnowledgeUnits';
import type { KnowledgeUnit } from '../../types';
import { format } from 'date-fns';
import { calculateNextReviewDate } from '../../lib/revisions';

interface RevisionSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string | null;
}

const UPSC_TEMPLATES = [
  "What is _____?",
  "Objectives?",
  "Key Features?",
  "Importance?",
  "Challenges?",
  "Government Initiatives?",
  "Current Affairs Linkage?",
  "PYQ Relevance?"
];

export function RevisionSetupDialog({ isOpen, onClose, activityId }: RevisionSetupDialogProps) {
  const { data: knowledgeUnits, isLoading } = useActivityKnowledgeUnits(activityId || '');
  const updateKnowledgeUnit = useUpdateKnowledgeUnit();
  
  // Local state for KUs to manage unsaved changes like questions
  const [localKUs, setLocalKUs] = useState<Record<string, KnowledgeUnit>>({});
  
  // Selection state
  const [selectedKUs, setSelectedKUs] = useState<Set<string>>(new Set());
  
  // Paste multiple mode tracking
  const [pasteMode, setPasteMode] = useState<Record<string, boolean>>({});
  const [pasteContent, setPasteContent] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !activityId) return;

    // Load from local storage draft if available
    const draftKey = `learning-os-revision-draft-${activityId}`;
    const draft = localStorage.getItem(draftKey);
    
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setLocalKUs(parsedDraft);
        // By default select all if restoring
        setSelectedKUs(new Set(Object.keys(parsedDraft)));
        return;
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }

    if (knowledgeUnits) {
      const initialLocalState: Record<string, KnowledgeUnit> = {};
      const allIds = new Set<string>();
      knowledgeUnits.forEach(ku => {
        initialLocalState[ku.id] = { ...ku };
        allIds.add(ku.id);
      });
      setLocalKUs(initialLocalState);
      setSelectedKUs(allIds);
    }
  }, [knowledgeUnits, isOpen, activityId]);

  // Autosave to localStorage on changes
  useEffect(() => {
    if (isOpen && activityId && Object.keys(localKUs).length > 0) {
      const draftKey = `learning-os-revision-draft-${activityId}`;
      localStorage.setItem(draftKey, JSON.stringify(localKUs));
    }
  }, [localKUs, isOpen, activityId]);

  if (!isOpen || !activityId) return null;

  const toggleSelection = (id: string) => {
    const next = new Set(selectedKUs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedKUs(next);
  };

  const selectAll = () => setSelectedKUs(new Set(Object.keys(localKUs)));
  const clearSelection = () => setSelectedKUs(new Set());
  const invertSelection = () => {
    const next = new Set<string>();
    Object.keys(localKUs).forEach(id => {
      if (!selectedKUs.has(id)) next.add(id);
    });
    setSelectedKUs(next);
  };

  const applyBulkImportance = (importance: string) => {
    const nextReviewDate = format(calculateNextReviewDate(importance === 'High' ? 0 : importance === 'Medium' ? 1 : 2, new Date()), 'yyyy-MM-dd');

    setLocalKUs(prev => {
      const next = { ...prev };
      selectedKUs.forEach(id => {
        next[id] = { ...next[id], importance, next_review_date: nextReviewDate };
      });
      return next;
    });
  };

  const handleImportanceChange = (kuId: string, importance: string) => {
    const nextReviewDate = format(calculateNextReviewDate(importance === 'High' ? 0 : importance === 'Medium' ? 1 : 2, new Date()), 'yyyy-MM-dd');

    setLocalKUs(prev => ({
      ...prev,
      [kuId]: { ...prev[kuId], importance, next_review_date: nextReviewDate }
    }));
  };

  const addQuestion = (kuId: string) => {
    setLocalKUs(prev => {
      const ku = prev[kuId];
      const questions = [...(ku.active_recall_questions || []), ''];
      return { ...prev, [kuId]: { ...ku, active_recall_questions: questions } };
    });
  };

  const updateQuestion = (kuId: string, index: number, value: string) => {
    setLocalKUs(prev => {
      const ku = prev[kuId];
      const questions = [...(ku.active_recall_questions || [])];
      questions[index] = value;
      return { ...prev, [kuId]: { ...ku, active_recall_questions: questions } };
    });
  };

  const removeQuestion = (kuId: string, index: number) => {
    setLocalKUs(prev => {
      const ku = prev[kuId];
      const questions = [...(ku.active_recall_questions || [])];
      questions.splice(index, 1);
      return { ...prev, [kuId]: { ...ku, active_recall_questions: questions } };
    });
  };

  const generateBulkQuestions = (kuId: string) => {
    const text = pasteContent[kuId] || '';
    if (!text.trim()) return;
    
    const newQuestions = text.split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);
      
    if (newQuestions.length > 0) {
      setLocalKUs(prev => {
        const ku = prev[kuId];
        const existing = ku.active_recall_questions || [];
        // Optional: filter out completely empty existing questions before appending
        const cleanedExisting = existing.filter(q => q.trim().length > 0);
        return { ...prev, [kuId]: { ...ku, active_recall_questions: [...cleanedExisting, ...newQuestions] } };
      });
    }
    
    // Close paste mode
    setPasteMode(prev => ({ ...prev, [kuId]: false }));
    setPasteContent(prev => ({ ...prev, [kuId]: '' }));
  };

  const insertTemplates = (kuId: string) => {
    setLocalKUs(prev => {
      const ku = prev[kuId];
      const existing = ku.active_recall_questions || [];
      const cleanedExisting = existing.filter(q => q.trim().length > 0);
      return { ...prev, [kuId]: { ...ku, active_recall_questions: [...cleanedExisting, ...UPSC_TEMPLATES] } };
    });
  };

  const handleSave = async () => {
    try {
      const promises = Object.values(localKUs).map((ku: any) => {
        const cleanedQuestions = (ku.active_recall_questions || []).filter((q: string) => q.trim() !== '');
        return updateKnowledgeUnit.mutateAsync({
          id: ku.id,
          updates: {
            importance: ku.importance,
            next_review_date: ku.next_review_date,
            active_recall_questions: cleanedQuestions.length > 0 ? cleanedQuestions : null
          }
        });
      });
      await Promise.all(promises);
      
      // Clear draft on successful save
      localStorage.removeItem(`learning-os-revision-draft-${activityId}`);
      onClose();
    } catch (e) {
      console.error('Failed to save revision set', e);
    }
  };

  const handleClose = () => {
    // We just close, draft stays in localStorage
    onClose();
  };

  // Stats for live summary
  const selectedCount = selectedKUs.size;
  let high = 0, medium = 0, low = 0, totalQuestions = 0;
  
  selectedKUs.forEach(id => {
    const ku = localKUs[id];
    if (ku) {
      if (ku.importance === 'High') high++;
      else if (ku.importance === 'Medium') medium++;
      else if (ku.importance === 'Low') low++;
      
      totalQuestions += (ku.active_recall_questions || []).filter(q => q.trim().length > 0).length;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-outline-variant">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-outline-variant/50 gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-on-surface">Batch Revision Setup</h2>
            <p className="text-sm text-secondary">Set review timing and recall questions for the selected knowledge units.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-surface-container border border-outline-variant rounded-xl flex overflow-hidden">
              <button onClick={() => applyBulkImportance('High')} disabled={selectedCount === 0} className="px-3 py-1.5 text-xs font-bold hover:bg-error-container hover:text-on-error-container transition-colors disabled:opacity-50">Set High</button>
              <button onClick={() => applyBulkImportance('Medium')} disabled={selectedCount === 0} className="px-3 py-1.5 text-xs font-bold border-l border-r border-outline-variant hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900/30 dark:hover:text-orange-200 transition-colors disabled:opacity-50">Set Medium</button>
              <button onClick={() => applyBulkImportance('Low')} disabled={selectedCount === 0} className="px-3 py-1.5 text-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">Set Low</button>
            </div>
            <button onClick={handleClose} className="p-2 ml-2 text-secondary hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low px-6 py-2 border-b border-outline-variant/50 flex items-center gap-4 text-sm text-secondary">
           <button onClick={selectAll} className="hover:text-primary font-semibold transition-colors">Select All</button>
           <span>•</span>
           <button onClick={clearSelection} className="hover:text-primary font-semibold transition-colors">Clear</button>
           <span>•</span>
           <button onClick={invertSelection} className="hover:text-primary font-semibold transition-colors">Invert</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-lowest/50">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-surface-container-high rounded-xl"></div>
              <div className="h-32 bg-surface-container-high rounded-xl"></div>
            </div>
          ) : (
            Object.values(localKUs).map((ku: any) => {
              const isSelected = selectedKUs.has(ku.id);
              const isPasteMode = pasteMode[ku.id] || false;

              return (
              <div key={ku.id} className={`border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-primary shadow-sm' : 'border-outline-variant bg-surface-container-high/30 opacity-70'}`}>
                {/* Header Row */}
                <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/50 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4">
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button onClick={() => toggleSelection(ku.id)} className="text-primary hover:opacity-80">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-secondary" />}
                    </button>
                    <div className="flex-1 min-w-0">
                       <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">
                        {ku.topics?.categories?.name || 'Category'}
                      </div>
                      <h3 className="text-base font-bold text-on-surface truncate">{ku.title || ku.topics?.name || 'Untitled'}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-xs text-secondary font-semibold">
                      {ku.active_recall_questions?.length || 0} Questions
                    </div>
                    
                    <select 
                      value={ku.importance || 'Medium'} 
                      onChange={(e) => handleImportanceChange(ku.id, e.target.value)}
                      className={`appearance-none text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer ${
                        ku.importance === 'High' ? 'bg-error-container text-on-error-container border-error-container'
                        : ku.importance === 'Medium' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800'
                        : 'bg-primary-container text-on-primary-container border-primary-container'
                      }`}
                    >
                      <option value="High">High ▼</option>
                      <option value="Medium">Medium ▼</option>
                      <option value="Low">Low ▼</option>
                    </select>

                    <div className="text-xs text-secondary w-28 text-right">
                       {ku.next_review_date ? format(new Date(ku.next_review_date), 'MMM d, yyyy') : 'Not scheduled'}
                    </div>
                  </div>
                </div>

                {/* Body Row (Questions) */}
                {isSelected && (
                  <div className="p-4 bg-surface-container-lowest">
                    
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <button
                        onClick={() => addQuestion(ku.id)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-surface-container-high hover:bg-surface-container px-3 py-1.5 rounded-lg text-on-surface transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </button>
                      <button
                        onClick={() => setPasteMode(prev => ({...prev, [ku.id]: !prev[ku.id]}))}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isPasteMode ? 'bg-primary text-on-primary' : 'bg-surface-container-high hover:bg-surface-container text-on-surface'}`}
                      >
                        <ClipboardPaste className="w-4 h-4" /> Paste Multiple
                      </button>
                      <button
                        onClick={() => insertTemplates(ku.id)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-surface-container-high hover:bg-surface-container px-3 py-1.5 rounded-lg text-on-surface transition-colors"
                      >
                        <BookOpen className="w-4 h-4" /> Insert UPSC Template
                      </button>
                    </div>

                    {/* Paste Mode Area */}
                    {isPasteMode && (
                      <div className="mb-4 p-4 border border-primary/30 bg-primary-container/5 rounded-xl">
                        <textarea
                          rows={4}
                          placeholder="Paste a list of questions here (one per line)...&#10;What is the Genome India Project?&#10;Objectives?&#10;Applications?"
                          value={pasteContent[ku.id] || ''}
                          onChange={(e) => setPasteContent(prev => ({...prev, [ku.id]: e.target.value}))}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                        />
                        <button
                           onClick={() => generateBulkQuestions(ku.id)}
                           className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-fixed-dim transition-colors"
                        >
                          Generate Question List
                        </button>
                      </div>
                    )}

                    {/* Normal Mode List */}
                    <div className="space-y-2">
                      {(ku.active_recall_questions || []).map((q: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 group">
                          <GripVertical className="w-4 h-4 text-secondary/30 group-hover:text-secondary cursor-grab shrink-0 transition-colors" />
                          <span className="text-xs font-bold text-secondary w-4 shrink-0 text-right">{i+1}.</span>
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => updateQuestion(ku.id, i, e.target.value)}
                            placeholder="Type a question..."
                            className="flex-1 bg-surface-container-lowest border-b border-transparent hover:border-outline-variant focus:border-primary px-2 py-1 text-sm text-on-surface focus:outline-none transition-colors"
                          />
                          <button
                            onClick={() => removeQuestion(ku.id, i)}
                            className="p-1.5 text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-all shrink-0 rounded hover:bg-error-container/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>

        {/* Live Summary Footer */}
        <div className="bg-surface-container px-6 py-4 border-t border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm">
            <div><span className="font-bold text-on-surface">{selectedCount}</span> <span className="text-secondary">Selected</span></div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-error"></div> {high}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {medium}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> {low}</span>
            </div>
            <div><span className="font-bold text-on-surface">{totalQuestions}</span> <span className="text-secondary">Total Questions</span></div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold text-secondary hover:bg-surface-container-high border border-transparent transition-colors"
            >
              Close Draft
            </button>
            <button
              onClick={handleSave}
              disabled={updateKnowledgeUnit.isPending || selectedCount === 0}
              className="flex-1 md:flex-none px-8 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:translate-y-px"
            >
              {updateKnowledgeUnit.isPending ? 'Saving...' : <><Save className="w-5 h-5" /> Save Revision Set</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
