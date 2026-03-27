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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          category: string
          community_code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          category: string
          community_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          category?: string
          community_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          content: string
          created_at: string | null
          id: string
          is_flagged: boolean | null
          masked_content: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          masked_content?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_flagged?: boolean | null
          masked_content?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          flagged_terms: string[] | null
          id: string
          is_deleted: boolean | null
          is_flagged: boolean | null
          masked_content: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          moderation_reason: string | null
          sender_id: string
          severity_level: number | null
          toxicity_score: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          flagged_terms?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          masked_content?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          moderation_reason?: string | null
          sender_id: string
          severity_level?: number | null
          toxicity_score?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          flagged_terms?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          masked_content?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          moderation_reason?: string | null
          sender_id?: string
          severity_level?: number | null
          toxicity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action_taken: string
          created_at: string | null
          id: string
          message_id: string | null
          rating_penalty: number | null
          severity_level: number
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          rating_penalty?: number | null
          severity_level: number
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          rating_penalty?: number | null
          severity_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          account_visibility: string | null
          avatar_url: string | null
          country: string | null
          created_at: string | null
          district: string | null
          email: string
          full_name: string
          id: string
          is_banned: boolean | null
          is_restricted: boolean | null
          phone: string | null
          profile_rating: number | null
          restriction_until: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          username: string
          violation_count: number | null
        }
        Insert: {
          about_me?: string | null
          account_visibility?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          email?: string
          full_name?: string
          id?: string
          is_banned?: boolean | null
          is_restricted?: boolean | null
          phone?: string | null
          profile_rating?: number | null
          restriction_until?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          username?: string
          violation_count?: number | null
        }
        Update: {
          about_me?: string | null
          account_visibility?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          email?: string
          full_name?: string
          id?: string
          is_banned?: boolean | null
          is_restricted?: boolean | null
          phone?: string | null
          profile_rating?: number | null
          restriction_until?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          violation_count?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          app_lock: boolean
          chat_lock: boolean
          created_at: string | null
          enter_to_send: boolean
          font_size: string
          id: string
          language: string
          notifications_enabled: boolean
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          theme: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_lock?: boolean
          chat_lock?: boolean
          created_at?: string | null
          enter_to_send?: boolean
          font_size?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          theme?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_lock?: boolean
          chat_lock?: boolean
          created_at?: string | null
          enter_to_send?: boolean
          font_size?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          theme?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
