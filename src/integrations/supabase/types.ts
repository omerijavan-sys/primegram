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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bounties: {
        Row: {
          active: boolean
          created_at: string
          creator_id: string
          deposit: number
          followers_paid: number
          id: string
          per_follow: number
          remaining: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          creator_id: string
          deposit: number
          followers_paid?: number
          id?: string
          per_follow?: number
          remaining: number
        }
        Update: {
          active?: boolean
          created_at?: string
          creator_id?: string
          deposit?: number
          followers_paid?: number
          id?: string
          per_follow?: number
          remaining?: number
        }
        Relationships: []
      }
      call_invitations: {
        Row: {
          audio: boolean
          caller_id: string
          created_at: string
          id: string
          receiver_id: string
          status: string
        }
        Insert: {
          audio?: boolean
          caller_id: string
          created_at?: string
          id?: string
          receiver_id: string
          status?: string
        }
        Update: {
          audio?: boolean
          caller_id?: string
          created_at?: string
          id?: string
          receiver_id?: string
          status?: string
        }
        Relationships: []
      }
      crushes: {
        Row: {
          created_at: string
          id: string
          revealed: boolean
          sender_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          revealed?: boolean
          sender_id?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          revealed?: boolean
          sender_id?: string
          target_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      market_listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price: number
          seller_id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          seller_id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          seller_id?: string
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      mpesa_topups: {
        Row: {
          amount: number
          checkout_request_id: string
          created_at: string
          id: string
          merchant_request_id: string | null
          mpesa_receipt: string | null
          paid_at: string | null
          phone: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_request_id: string
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          paid_at?: string | null
          phone: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          paid_at?: string | null
          phone?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      post_boosts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          placement: string
          post_id: string
          price: number
          target_views: number
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          placement: string
          post_id: string
          price: number
          target_views: number
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          placement?: string
          post_id?: string
          price?: number
          target_views?: number
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_boosts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_adult: boolean
          likes_count: number
          media_type: string | null
          media_url: string | null
          music_art_url: string | null
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          music_youtube_id: string | null
          user_id: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_adult?: boolean
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          music_art_url?: string | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          music_youtube_id?: string | null
          user_id: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_adult?: boolean
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          music_art_url?: string | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          music_youtube_id?: string | null
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      prime_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          price: number
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          price: number
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          price?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adult_verified_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_official: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          adult_verified_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_official?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          adult_verified_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_official?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reel_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          likes_count: number
          music_title: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          music_title?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          music_title?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          category: string
          created_at: string
          details: Json
          event: string
          id: string
          target: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json
          event: string
          id?: string
          target?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json
          event?: string
          id?: string
          target?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          counterparty: string | null
          created_at: string
          id: string
          note: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          counterparty?: string | null
          created_at?: string
          id?: string
          note?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          counterparty?: string | null
          created_at?: string
          id?: string
          note?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _wallet_spend: {
        Args: { _amt: number; _note: string; _uid: string }
        Returns: undefined
      }
      bounty_create: { Args: { _deposit: number }; Returns: string }
      crush_reveal: { Args: { _crush_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          _category: string
          _details?: Json
          _event: string
          _target?: string
        }
        Returns: undefined
      }
      my_crushes: {
        Args: never
        Returns: {
          created_at: string
          id: string
          revealed: boolean
          sender_avatar: string
          sender_username: string
        }[]
      }
      prime_boost: {
        Args: { _post_id: string; _tier: string }
        Returns: string
      }
      prime_subscribe: { Args: { _tier: string }; Returns: string }
      prime_tier: { Args: { _user_id: string }; Returns: string }
      prime_tip: {
        Args: { _amount: number; _recipient: string }
        Returns: number
      }
      register_post_view: { Args: { _post_id: string }; Returns: number }
      verify_adult: { Args: { _dob: string }; Returns: boolean }
      wallet_balance: { Args: { _user_id: string }; Returns: number }
      wallet_my_balance: { Args: never; Returns: number }
      wallet_send: {
        Args: { _amount: number; _recipient: string }
        Returns: {
          new_balance: number
          transfer_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
