export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics: {
        Row: {
          country: string | null
          created_at: string | null
          date: string
          id: string
          platform: string
          plays: number | null
          revenue: number | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          date: string
          id?: string
          platform: string
          plays?: number | null
          revenue?: number | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          date?: string
          id?: string
          platform?: string
          plays?: number | null
          revenue?: number | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_collaborations: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          permissions: string[] | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_collaborations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          apple_music_url: string | null
          avatar_url: string | null
          bandcamp_url: string | null
          bio: string | null
          booking_agent: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          facebook_url: string | null
          genre: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          management_company: string | null
          name: string
          phone: string | null
          record_label: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          sub_genre: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          apple_music_url?: string | null
          avatar_url?: string | null
          bandcamp_url?: string | null
          bio?: string | null
          booking_agent?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          management_company?: string | null
          name: string
          phone?: string | null
          record_label?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          sub_genre?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          apple_music_url?: string | null
          avatar_url?: string | null
          bandcamp_url?: string | null
          bio?: string | null
          booking_agent?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          management_company?: string | null
          name?: string
          phone?: string | null
          record_label?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          sub_genre?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          platform: string
          reference: string
          status: string | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          platform: string
          reference: string
          status?: string | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          platform?: string
          reference?: string
          status?: string | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          allow_preorder_itunes: boolean | null
          artist_id: string | null
          artwork_name: string | null
          artwork_url: string | null
          cat_number: string | null
          copyrights: string | null
          countries: string[] | null
          created_at: string | null
          description: string | null
          display_artist: string | null
          exclusive_for: string | null
          featured_artist: string | null
          id: string
          is_worldwide: boolean | null
          label: string | null
          main_genre: string
          original_release_date: string | null
          platforms: string[] | null
          primary_artist: string
          release_date: string
          release_notes: string | null
          release_type: string
          retailers: string[] | null
          status: string | null
          sub_genre: string | null
          title: string
          total_plays: number | null
          total_revenue: number | null
          track_count: number | null
          upc: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_preorder_itunes?: boolean | null
          artist_id?: string | null
          artwork_name?: string | null
          artwork_url?: string | null
          cat_number?: string | null
          copyrights?: string | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          display_artist?: string | null
          exclusive_for?: string | null
          featured_artist?: string | null
          id?: string
          is_worldwide?: boolean | null
          label?: string | null
          main_genre: string
          original_release_date?: string | null
          platforms?: string[] | null
          primary_artist: string
          release_date: string
          release_notes?: string | null
          release_type?: string
          retailers?: string[] | null
          status?: string | null
          sub_genre?: string | null
          title: string
          total_plays?: number | null
          total_revenue?: number | null
          track_count?: number | null
          upc?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_preorder_itunes?: boolean | null
          artist_id?: string | null
          artwork_name?: string | null
          artwork_url?: string | null
          cat_number?: string | null
          copyrights?: string | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          display_artist?: string | null
          exclusive_for?: string | null
          featured_artist?: string | null
          id?: string
          is_worldwide?: boolean | null
          label?: string | null
          main_genre?: string
          original_release_date?: string | null
          platforms?: string[] | null
          primary_artist?: string
          release_date?: string
          release_notes?: string | null
          release_type?: string
          retailers?: string[] | null
          status?: string | null
          sub_genre?: string | null
          title?: string
          total_plays?: number | null
          total_revenue?: number | null
          track_count?: number | null
          upc?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          album_only: boolean | null
          allow_preorder_itunes: boolean | null
          artist: string
          artist_id: string | null
          artwork_name: string | null
          artwork_url: string | null
          audio_file_url: string | null
          audio_file_urls: string[] | null
          cat_number: string | null
          composer: string | null
          contributors: string[] | null
          copyrights: string | null
          countries: string[] | null
          country: string | null
          created_at: string | null
          description: string | null
          display_artist: string | null
          duration: string | null
          exclusive_for: string | null
          exclusive_on_shop: boolean | null
          featured_artist: string | null
          genre: string
          id: string
          is_explicit: boolean | null
          is_worldwide: boolean | null
          isrc: string | null
          label: string | null
          lyricist: string | null
          main_genre: string | null
          mix_version: string | null
          original_release_date: string | null
          platforms: string[] | null
          plays: number | null
          price_tiers: string | null
          primary_artist: string | null
          publisher: string | null
          release_date: string
          release_id: string | null
          release_notes: string | null
          release_title: string | null
          release_type: string | null
          remixer: string | null
          retailers: string[] | null
          revenue: number | null
          status: string | null
          sub_genre: string | null
          title: string
          track_display_artist: string | null
          track_featured_artist: string | null
          track_main_genre: string | null
          track_number: number | null
          track_price_tiers: string | null
          track_sub_genre: string | null
          upc: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          album_only?: boolean | null
          allow_preorder_itunes?: boolean | null
          artist: string
          artist_id?: string | null
          artwork_name?: string | null
          artwork_url?: string | null
          audio_file_url?: string | null
          audio_file_urls?: string[] | null
          cat_number?: string | null
          composer?: string | null
          contributors?: string[] | null
          copyrights?: string | null
          countries?: string[] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_artist?: string | null
          duration?: string | null
          exclusive_for?: string | null
          exclusive_on_shop?: boolean | null
          featured_artist?: string | null
          genre: string
          id?: string
          is_explicit?: boolean | null
          is_worldwide?: boolean | null
          isrc?: string | null
          label?: string | null
          lyricist?: string | null
          main_genre?: string | null
          mix_version?: string | null
          original_release_date?: string | null
          platforms?: string[] | null
          plays?: number | null
          price_tiers?: string | null
          primary_artist?: string | null
          publisher?: string | null
          release_date: string
          release_id?: string | null
          release_notes?: string | null
          release_title?: string | null
          release_type?: string | null
          remixer?: string | null
          retailers?: string[] | null
          revenue?: number | null
          status?: string | null
          sub_genre?: string | null
          title: string
          track_display_artist?: string | null
          track_featured_artist?: string | null
          track_main_genre?: string | null
          track_number?: number | null
          track_price_tiers?: string | null
          track_sub_genre?: string | null
          upc?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          album_only?: boolean | null
          allow_preorder_itunes?: boolean | null
          artist?: string
          artist_id?: string | null
          artwork_name?: string | null
          artwork_url?: string | null
          audio_file_url?: string | null
          audio_file_urls?: string[] | null
          cat_number?: string | null
          composer?: string | null
          contributors?: string[] | null
          copyrights?: string | null
          countries?: string[] | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          display_artist?: string | null
          duration?: string | null
          exclusive_for?: string | null
          exclusive_on_shop?: boolean | null
          featured_artist?: string | null
          genre?: string
          id?: string
          is_explicit?: boolean | null
          is_worldwide?: boolean | null
          isrc?: string | null
          label?: string | null
          lyricist?: string | null
          main_genre?: string | null
          mix_version?: string | null
          original_release_date?: string | null
          platforms?: string[] | null
          plays?: number | null
          price_tiers?: string | null
          primary_artist?: string | null
          publisher?: string | null
          release_date?: string
          release_id?: string | null
          release_notes?: string | null
          release_title?: string | null
          release_type?: string | null
          remixer?: string | null
          retailers?: string[] | null
          revenue?: number | null
          status?: string | null
          sub_genre?: string | null
          title?: string
          track_display_artist?: string | null
          track_featured_artist?: string | null
          track_main_genre?: string | null
          track_number?: number | null
          track_price_tiers?: string | null
          track_sub_genre?: string | null
          upc?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          artist_name: string | null
          available_balance: number | null
          avatar_url: string | null
          bio: string | null
          collaboration_interests: string[] | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          email: string
          experience_level: string | null
          genre_preferences: string[] | null
          goals: string[] | null
          has_existing_catalog: boolean | null
          id: string
          marketing_budget_range: string | null
          monthly_release_goal: number | null
          name: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          pending_payments: number | null
          preferred_platforms: string[] | null
          primary_market: string | null
          role: string | null
          social_links: Json | null
          spotify_connected: boolean | null
          spotify_connected_at: string | null
          team_size: number | null
          total_earnings: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          artist_name?: string | null
          available_balance?: number | null
          avatar_url?: string | null
          bio?: string | null
          collaboration_interests?: string[] | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email: string
          experience_level?: string | null
          genre_preferences?: string[] | null
          goals?: string[] | null
          has_existing_catalog?: boolean | null
          id: string
          marketing_budget_range?: string | null
          monthly_release_goal?: number | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          pending_payments?: number | null
          preferred_platforms?: string[] | null
          primary_market?: string | null
          role?: string | null
          social_links?: Json | null
          spotify_connected?: boolean | null
          spotify_connected_at?: string | null
          team_size?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          artist_name?: string | null
          available_balance?: number | null
          avatar_url?: string | null
          bio?: string | null
          collaboration_interests?: string[] | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string
          experience_level?: string | null
          genre_preferences?: string[] | null
          goals?: string[] | null
          has_existing_catalog?: boolean | null
          id?: string
          marketing_budget_range?: string | null
          monthly_release_goal?: number | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          pending_payments?: number | null
          preferred_platforms?: string[] | null
          primary_market?: string | null
          role?: string | null
          social_links?: Json | null
          spotify_connected?: boolean | null
          spotify_connected_at?: string | null
          team_size?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_details: string
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          status: string | null
          trolley_payout_id: string | null
          trolley_recipient_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_details: string
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          status?: string | null
          trolley_payout_id?: string | null
          trolley_recipient_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_details?: string
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          status?: string | null
          trolley_payout_id?: string | null
          trolley_recipient_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      release_details: {
        Row: {
          allow_preorder_itunes: boolean | null
          artist_id: string | null
          artwork_name: string | null
          artwork_url: string | null
          cat_number: string | null
          copyrights: string | null
          countries: string[] | null
          created_at: string | null
          description: string | null
          display_artist: string | null
          exclusive_for: string | null
          featured_artist: string | null
          id: string | null
          is_worldwide: boolean | null
          label: string | null
          main_genre: string | null
          original_release_date: string | null
          platforms: string[] | null
          plays: number | null
          primary_artist: string | null
          release_date: string | null
          release_notes: string | null
          release_type: string | null
          retailers: string[] | null
          revenue: number | null
          status: string | null
          sub_genre: string | null
          title: string | null
          total_plays: number | null
          total_revenue: number | null
          track_count: number | null
          track_list: Json[] | null
          tracks: number | null
          upc: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_catalog_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_release_catalog_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
