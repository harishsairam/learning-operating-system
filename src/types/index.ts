export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MemoryMode = 'REFERENCE' | 'LEARN_ONCE' | 'MEMORIZE' | 'MASTER';

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          project_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          category_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          created_at?: string
        }
      }
      learning_activities: {
        Row: {
          id: string
          project_id: string
          category_id: string
          topic_id: string
          activity_type: string
          memory_mode: string
          study_date: string
          start_time: string
          duration_minutes: number
          source: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          category_id: string
          topic_id: string
          activity_type?: string
          memory_mode?: string
          study_date: string
          start_time: string
          duration_minutes: number
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          category_id?: string
          topic_id?: string
          activity_type?: string
          memory_mode?: string
          study_date?: string
          start_time?: string
          duration_minutes?: number
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      revision_schedule: {
        Row: {
          id: string
          activity_id: string
          revision_number: number
          revision_date: string
          completed: boolean
          completed_at: string | null
          completion_status: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          id?: string
          activity_id: string
          revision_number: number
          revision_date: string
          completed?: boolean
          completed_at?: string | null
          completion_status?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          id?: string
          activity_id?: string
          revision_number?: number
          revision_date?: string
          completed?: boolean
          completed_at?: string | null
          completion_status?: string | null
          time_spent_minutes?: number | null
        }
      }
      learning_sessions: {
        Row: {
          id: string
          project_id: string
          category_id: string
          topic_id: string
          memory_mode: string
          activity_type: string
          planned_duration_minutes: number
          focused_duration_minutes: number
          paused_duration_minutes: number
          started_at: string
          ended_at: string | null
          paused_at: string | null
          resumed_at: string | null
          status: SessionStatus
          reflection: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          category_id: string
          topic_id: string
          memory_mode?: string
          activity_type?: string
          planned_duration_minutes: number
          focused_duration_minutes?: number
          paused_duration_minutes?: number
          started_at: string
          ended_at?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          status?: SessionStatus
          reflection?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          category_id?: string
          topic_id?: string
          memory_mode?: string
          activity_type?: string
          planned_duration_minutes?: number
          focused_duration_minutes?: number
          paused_duration_minutes?: number
          started_at?: string
          ended_at?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          status?: SessionStatus
          reflection?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type LearningActivity = Database['public']['Tables']['learning_activities']['Row'];
export type RevisionSchedule = Database['public']['Tables']['revision_schedule']['Row'];
export type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

/**
 * LearningSession with optional related data (used when fetching with joins)
 */
export interface LearningSessionWithRelations extends LearningSession {
  topics?: { name: string } | null;
  categories?: { name: string } | null;
  projects?: { name: string } | null;
}
