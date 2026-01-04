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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      donations: {
        Row: {
          amount: number
          contact_telegram: string | null
          contact_whatsapp: string | null
          created_at: string | null
          currency: string | null
          donated_at: string
          donation_public_id: string
          donation_status: string | null
          donor_email: string
          donor_message: string | null
          donor_name: string
          id: number
          locale: string | null
          order_reference: string | null
          payment_method: string | null
          project_id: number
          updated_at: string
        }
        Insert: {
          amount: number
          contact_telegram?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          donated_at?: string
          donation_public_id: string
          donation_status?: string | null
          donor_email: string
          donor_message?: string | null
          donor_name: string
          id?: number
          locale?: string | null
          order_reference?: string | null
          payment_method?: string | null
          project_id: number
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_telegram?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          donated_at?: string
          donation_public_id?: string
          donation_status?: string | null
          donor_email?: string
          donor_message?: string | null
          donor_name?: string
          id?: number
          locale?: string | null
          order_reference?: string | null
          payment_method?: string | null
          project_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "order_donations_secure"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscriptions: {
        Row: {
          email: string
          id: number
          is_subscribed: boolean
          locale: string
          updated_at: string
        }
        Insert: {
          email: string
          id?: number
          is_subscribed?: boolean
          locale: string
          updated_at?: string
        }
        Update: {
          email?: string
          id?: number
          is_subscribed?: boolean
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          aggregate_donations: boolean
          created_at: string | null
          current_units: number
          description_i18n: Json | null
          end_date: string | null
          id: number
          is_long_term: boolean | null
          location: string
          location_i18n: Json | null
          project_name: string
          project_name_i18n: Json | null
          start_date: string
          status: string | null
          target_units: number | null
          unit_name: string | null
          unit_name_i18n: Json | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          aggregate_donations?: boolean
          created_at?: string | null
          current_units?: number
          description_i18n?: Json | null
          end_date?: string | null
          id?: number
          is_long_term?: boolean | null
          location: string
          location_i18n?: Json | null
          project_name: string
          project_name_i18n?: Json | null
          start_date: string
          status?: string | null
          target_units?: number | null
          unit_name?: string | null
          unit_name_i18n?: Json | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          aggregate_donations?: boolean
          created_at?: string | null
          current_units?: number
          description_i18n?: Json | null
          end_date?: string | null
          id?: number
          is_long_term?: boolean | null
          location?: string
          location_i18n?: Json | null
          project_name?: string
          project_name_i18n?: Json | null
          start_date?: string
          status?: string | null
          target_units?: number | null
          unit_name?: string | null
          unit_name_i18n?: Json | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      order_donations_secure: {
        Row: {
          amount: number | null
          donation_public_id: string | null
          donation_status: string | null
          donor_email_obfuscated: string | null
          id: number | null
          location: string | null
          location_i18n: Json | null
          order_reference: string | null
          project_id: number | null
          project_name: string | null
          project_name_i18n: Json | null
          unit_name: string | null
          unit_name_i18n: Json | null
        }
        Relationships: []
      }
      project_stats: {
        Row: {
          aggregate_donations: boolean | null
          current_units: number | null
          description_i18n: Json | null
          donation_count: number | null
          end_date: string | null
          id: number | null
          is_long_term: boolean | null
          location: string | null
          location_i18n: Json | null
          progress_percentage: number | null
          project_name: string | null
          project_name_i18n: Json | null
          start_date: string | null
          status: string | null
          target_units: number | null
          total_raised: number | null
          unit_name: string | null
          unit_name_i18n: Json | null
          unit_price: number | null
        }
        Relationships: []
      }
      public_project_donations: {
        Row: {
          amount: number | null
          currency: string | null
          donated_at: string | null
          donation_public_id: string | null
          donation_status: string | null
          donor_email_obfuscated: string | null
          id: number | null
          order_id: string | null
          project_id: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          donated_at?: string | null
          donation_public_id?: string | null
          donation_status?: string | null
          donor_email_obfuscated?: never
          id?: number | null
          order_id?: never
          project_id?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          currency?: string | null
          donated_at?: string | null
          donation_public_id?: string | null
          donation_status?: string | null
          donor_email_obfuscated?: never
          id?: number | null
          order_id?: never
          project_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "order_donations_secure"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_donation_public_id: {
        Args: { project_id_input: number }
        Returns: string
      }
      get_donations_by_email_verified: {
        Args: { p_donation_id: string; p_email: string }
        Returns: {
          amount: number
          currency: string
          donated_at: string
          donation_public_id: string
          donation_status: string
          donor_email: string
          id: number
          location: string
          location_i18n: Json
          order_reference: string
          project_id: number
          project_name: string
          project_name_i18n: Json
          unit_name: string
          unit_name_i18n: Json
          updated_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      unsubscribe_email: { Args: { p_email: string }; Returns: boolean }
      upsert_email_subscription: {
        Args: { p_email: string; p_locale: string }
        Returns: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
