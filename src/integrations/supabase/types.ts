export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      call_sessions: {
        Row: {
          action_items: Json
          call_type: Database["public"]["Enums"]["call_type"]
          created_at: string
          critical_weakness: string | null
          duration_seconds: number
          ended_at: string | null
          feedback: string | null
          filler_word_count: number
          id: string
          objections_handled: number
          objections_raised: number
          persona_id: string
          score_confidence: number | null
          score_discovery_questions: number | null
          score_filler_words: number | null
          score_next_step: number | null
          score_objection_handling: number | null
          score_opening: number | null
          score_overall: number | null
          score_talk_ratio: number | null
          score_value_framing: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          talk_ratio_user: number | null
          target_duration_minutes: number
          top_strength: string | null
          transcript: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json
          call_type: Database["public"]["Enums"]["call_type"]
          created_at?: string
          critical_weakness?: string | null
          duration_seconds?: number
          ended_at?: string | null
          feedback?: string | null
          filler_word_count?: number
          id?: string
          objections_handled?: number
          objections_raised?: number
          persona_id: string
          score_confidence?: number | null
          score_discovery_questions?: number | null
          score_filler_words?: number | null
          score_next_step?: number | null
          score_objection_handling?: number | null
          score_opening?: number | null
          score_overall?: number | null
          score_talk_ratio?: number | null
          score_value_framing?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          talk_ratio_user?: number | null
          target_duration_minutes?: number
          top_strength?: string | null
          transcript?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json
          call_type?: Database["public"]["Enums"]["call_type"]
          created_at?: string
          critical_weakness?: string | null
          duration_seconds?: number
          ended_at?: string | null
          feedback?: string | null
          filler_word_count?: number
          id?: string
          objections_handled?: number
          objections_raised?: number
          persona_id?: string
          score_confidence?: number | null
          score_discovery_questions?: number | null
          score_filler_words?: number | null
          score_next_step?: number | null
          score_objection_handling?: number | null
          score_opening?: number | null
          score_overall?: number | null
          score_talk_ratio?: number | null
          score_value_framing?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          talk_ratio_user?: number | null
          target_duration_minutes?: number
          top_strength?: string | null
          transcript?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      call_turns: {
        Row: {
          ai_coaching_note: string | null
          created_at: string
          duration_ms: number
          filler_word_count: number
          filler_words: Json
          id: string
          session_id: string
          speaker: string
          text: string
          turn_order: number
          turn_score: number | null
          user_id: string
        }
        Insert: {
          ai_coaching_note?: string | null
          created_at?: string
          duration_ms?: number
          filler_word_count?: number
          filler_words?: Json
          id?: string
          session_id: string
          speaker: string
          text: string
          turn_order: number
          turn_score?: number | null
          user_id: string
        }
        Update: {
          ai_coaching_note?: string | null
          created_at?: string
          duration_ms?: number
          filler_word_count?: number
          filler_words?: Json
          id?: string
          session_id?: string
          speaker?: string
          text?: string
          turn_order?: number
          turn_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          accent: string
          created_at: string
          created_by: string | null
          description: string
          difficulty: number
          id: string
          is_active: boolean
          is_custom: boolean
          is_free: boolean
          name: string
          objection_patterns: string[]
          opening_line: string
          persona_type: string
          slug: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          accent?: string
          created_at?: string
          created_by?: string | null
          description: string
          difficulty: number
          id?: string
          is_active?: boolean
          is_custom?: boolean
          is_free?: boolean
          name: string
          objection_patterns?: string[]
          opening_line: string
          persona_type: string
          slug: string
          system_prompt: string
          updated_at?: string
        }
        Update: {
          accent?: string
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: number
          id?: string
          is_active?: boolean
          is_custom?: boolean
          is_free?: boolean
          name?: string
          objection_patterns?: string[]
          opening_line?: string
          persona_type?: string
          slug?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deal_size_range: string
          email: string
          icp_title: string
          id: string
          leaderboard_visible: boolean
          name: string
          onboarding_completed: boolean
          product_description: string
          role: Database["public"]["Enums"]["sales_role"]
          streak_goal: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_size_range?: string
          email: string
          icp_title?: string
          id: string
          leaderboard_visible?: boolean
          name?: string
          onboarding_completed?: boolean
          product_description?: string
          role?: Database["public"]["Enums"]["sales_role"]
          streak_goal?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_size_range?: string
          email?: string
          icp_title?: string
          id?: string
          leaderboard_visible?: boolean
          name?: string
          onboarding_completed?: boolean
          product_description?: string
          role?: Database["public"]["Enums"]["sales_role"]
          streak_goal?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          avg_score_overall: number
          best_score: number
          current_streak: number
          id: string
          last_call_at: string | null
          leaderboard_score: number
          longest_streak: number
          scores_by_dimension: Json
          total_calls: number
          total_duration_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_score_overall?: number
          best_score?: number
          current_streak?: number
          id?: string
          last_call_at?: string | null
          leaderboard_score?: number
          longest_streak?: number
          scores_by_dimension?: Json
          total_calls?: number
          total_duration_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_score_overall?: number
          best_score?: number
          current_streak?: number
          id?: string
          last_call_at?: string | null
          leaderboard_score?: number
          longest_streak?: number
          scores_by_dimension?: Json
          total_calls?: number
          total_duration_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      call_status:
        | "pending"
        | "active"
        | "ended"
        | "scoring"
        | "complete"
        | "failed"
      call_type: "cold_call" | "discovery" | "investor" | "objection" | "custom"
      sales_role: "sdr" | "ae" | "founder" | "manager" | "other"
      subscription_tier: "free" | "pro" | "team"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      call_status: [
        "pending",
        "active",
        "ended",
        "scoring",
        "complete",
        "failed",
      ],
      call_type: ["cold_call", "discovery", "investor", "objection", "custom"],
      sales_role: ["sdr", "ae", "founder", "manager", "other"],
      subscription_tier: ["free", "pro", "team"],
    },
  },
} as const
