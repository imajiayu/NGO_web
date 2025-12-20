export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus = 'planned' | 'active' | 'completed' | 'paused'
export type DonationStatus = 'pending' | 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded' | 'failed'

export type I18nText = {
  en?: string
  zh?: string
  ua?: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: number
          project_name: string
          project_name_i18n: I18nText
          location: string
          location_i18n: I18nText
          start_date: string
          end_date: string | null
          is_long_term: boolean
          target_units: number
          current_units: number
          unit_name: string
          unit_name_i18n: I18nText
          unit_price: number
          status: ProjectStatus
          description_i18n: I18nText
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          project_name: string
          project_name_i18n?: I18nText
          location: string
          location_i18n?: I18nText
          start_date: string
          end_date?: string | null
          is_long_term?: boolean
          target_units?: number
          current_units?: number
          unit_name?: string
          unit_name_i18n?: I18nText
          unit_price?: number
          status?: ProjectStatus
          description_i18n?: I18nText
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          project_name?: string
          project_name_i18n?: I18nText
          location?: string
          location_i18n?: I18nText
          start_date?: string
          end_date?: string | null
          is_long_term?: boolean
          target_units?: number
          current_units?: number
          unit_name?: string
          unit_name_i18n?: I18nText
          unit_price?: number
          status?: ProjectStatus
          description_i18n?: I18nText
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          id: number
          donation_public_id: string
          project_id: number
          donor_name: string
          donor_email: string
          donor_phone: string | null
          donor_message: string | null
          contact_telegram: string | null
          contact_whatsapp: string | null
          amount: number
          currency: string
          payment_method: string | null
          donation_status: DonationStatus
          order_reference: string | null
          locale: string
          donated_at: string
          created_at: string
        }
        Insert: {
          id?: number
          donation_public_id: string
          project_id: number
          donor_name: string
          donor_email: string
          donor_phone?: string | null
          donor_message?: string | null
          contact_telegram?: string | null
          contact_whatsapp?: string | null
          amount: number
          currency?: string
          payment_method?: string | null
          donation_status?: DonationStatus
          order_reference?: string | null
          locale?: string
          donated_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          donation_public_id?: string
          project_id?: number
          donor_name?: string
          donor_email?: string
          donor_phone?: string | null
          donor_message?: string | null
          contact_telegram?: string | null
          contact_whatsapp?: string | null
          amount?: number
          currency?: string
          payment_method?: string | null
          donation_status?: DonationStatus
          order_reference?: string | null
          locale?: string
          donated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      project_stats: {
        Row: {
          id: number | null
          project_name: string | null
          project_name_i18n: I18nText | null
          location: string | null
          location_i18n: I18nText | null
          start_date: string | null
          end_date: string | null
          is_long_term: boolean | null
          status: ProjectStatus | null
          target_units: number | null
          current_units: number | null
          unit_name: string | null
          unit_name_i18n: I18nText | null
          unit_price: number | null
          description_i18n: I18nText | null
          total_raised: number | null
          donation_count: number | null
          progress_percentage: number | null
          target_amount: number | null
        }
        Relationships: []
      }
      public_donation_feed: {
        Row: {
          donation_public_id: string | null
          project_name: string | null
          project_id: number | null
          donor_display_name: string | null
          amount: number | null
          currency: string | null
          donated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_donation_public_id: {
        Args: {
          project_id_input: number
        }
        Returns: string
      }
      get_project_progress: {
        Args: {
          project_id_input: number
        }
        Returns: {
          project_id: number
          project_name: string
          target_units: number
          current_units: number
          progress_percentage: number
          total_donations: number
          total_amount: number
        }[]
      }
      get_recent_donations: {
        Args: {
          project_id_input: number
          limit_count?: number
        }
        Returns: {
          donation_public_id: string
          donor_name: string
          amount: number
          currency: string
          donated_at: string
        }[]
      }
      is_project_goal_reached: {
        Args: {
          project_id_input: number
        }
        Returns: boolean
      }
    }
    Enums: {
      project_status: ProjectStatus
      donation_status: DonationStatus
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns']
