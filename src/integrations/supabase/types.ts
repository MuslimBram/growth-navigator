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
      addon_services: {
        Row: {
          active: boolean
          admin_notes: string | null
          category: Database["public"]["Enums"]["addon_category"]
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          included_features: Json
          name: string
          price_1_month: number
          price_1_year: number
          price_3_months: number
          price_6_months: number
          supported_platforms: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          admin_notes?: string | null
          category: Database["public"]["Enums"]["addon_category"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          included_features?: Json
          name: string
          price_1_month?: number
          price_1_year?: number
          price_3_months?: number
          price_6_months?: number
          supported_platforms?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["addon_category"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          included_features?: Json
          name?: string
          price_1_month?: number
          price_1_year?: number
          price_3_months?: number
          price_6_months?: number
          supported_platforms?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      admin_recommendations: {
        Row: {
          addons_total: number
          admin_notes: string | null
          ai_source: string
          analysis_id: string | null
          boost_eligibility_reason: string | null
          boost_eligible: boolean
          business_name: string | null
          business_type: string | null
          city: string | null
          client_proposal_text: string | null
          created_at: string
          currency: string
          digital_score: number | null
          id: string
          key_problems: Json
          lead_id: string | null
          micro_services_total: number
          normal_price_total: number
          offer_price_total: number
          priority: Database["public"]["Enums"]["recommendation_priority"]
          reasoning: string | null
          recommended_addons: Json
          recommended_micro_services: Json
          recommended_package_ids: Json
          savings_total: number
          session_id: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          updated_at: string
        }
        Insert: {
          addons_total?: number
          admin_notes?: string | null
          ai_source?: string
          analysis_id?: string | null
          boost_eligibility_reason?: string | null
          boost_eligible?: boolean
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          client_proposal_text?: string | null
          created_at?: string
          currency?: string
          digital_score?: number | null
          id?: string
          key_problems?: Json
          lead_id?: string | null
          micro_services_total?: number
          normal_price_total?: number
          offer_price_total?: number
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          reasoning?: string | null
          recommended_addons?: Json
          recommended_micro_services?: Json
          recommended_package_ids?: Json
          savings_total?: number
          session_id?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          updated_at?: string
        }
        Update: {
          addons_total?: number
          admin_notes?: string | null
          ai_source?: string
          analysis_id?: string | null
          boost_eligibility_reason?: string | null
          boost_eligible?: boolean
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          client_proposal_text?: string | null
          created_at?: string
          currency?: string
          digital_score?: number | null
          id?: string
          key_problems?: Json
          lead_id?: string | null
          micro_services_total?: number
          normal_price_total?: number
          offer_price_total?: number
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          reasoning?: string | null
          recommended_addons?: Json
          recommended_micro_services?: Json
          recommended_package_ids?: Json
          savings_total?: number
          session_id?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_recommendations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "business_report_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_recommendations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          session_id: string | null
          step: number | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step?: number | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_report_analyses: {
        Row: {
          ai_analysis: Json
          ai_source: string
          created_at: string
          extracted_metrics: Json
          id: string
          main_bottleneck: string | null
          recommended_service: string | null
          session_id: string | null
          uploaded_images: Json
          user_text: string | null
          visitor_id: string | null
        }
        Insert: {
          ai_analysis?: Json
          ai_source?: string
          created_at?: string
          extracted_metrics?: Json
          id?: string
          main_bottleneck?: string | null
          recommended_service?: string | null
          session_id?: string | null
          uploaded_images?: Json
          user_text?: string | null
          visitor_id?: string | null
        }
        Update: {
          ai_analysis?: Json
          ai_source?: string
          created_at?: string
          extracted_metrics?: Json
          id?: string
          main_bottleneck?: string | null
          recommended_service?: string | null
          session_id?: string | null
          uploaded_images?: Json
          user_text?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_report_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          client_name: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          industry: string | null
          metrics: Json | null
          problem: string
          published: boolean
          result_summary: string
          services: Json
          slug: string
          testimonial: string | null
          testimonial_author: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          industry?: string | null
          metrics?: Json | null
          problem: string
          published?: boolean
          result_summary: string
          services?: Json
          slug: string
          testimonial?: string | null
          testimonial_author?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          industry?: string | null
          metrics?: Json | null
          problem?: string
          published?: boolean
          result_summary?: string
          services?: Json
          slug?: string
          testimonial?: string | null
          testimonial_author?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostic_leads: {
        Row: {
          business_name: string | null
          contacted: boolean
          created_at: string
          diagnosis_notes: string | null
          email: string | null
          id: string
          session_id: string | null
          whatsapp: string | null
        }
        Insert: {
          business_name?: string | null
          contacted?: boolean
          created_at?: string
          diagnosis_notes?: string | null
          email?: string | null
          id?: string
          session_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          business_name?: string | null
          contacted?: boolean
          created_at?: string
          diagnosis_notes?: string | null
          email?: string | null
          id?: string
          session_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_sessions: {
        Row: {
          ai_diagnosis: string | null
          ai_source: string | null
          answers: Json
          business_name: string | null
          created_at: string
          deep_analysis: Json | null
          estimated_lost_clients: number | null
          estimated_lost_eur: number | null
          extra_context: string | null
          id: string
          primary_service: string | null
          screenshots: Json
          secondary_services: Json | null
          updated_at: string
          visitor_id: string | null
        }
        Insert: {
          ai_diagnosis?: string | null
          ai_source?: string | null
          answers?: Json
          business_name?: string | null
          created_at?: string
          deep_analysis?: Json | null
          estimated_lost_clients?: number | null
          estimated_lost_eur?: number | null
          extra_context?: string | null
          id?: string
          primary_service?: string | null
          screenshots?: Json
          secondary_services?: Json | null
          updated_at?: string
          visitor_id?: string | null
        }
        Update: {
          ai_diagnosis?: string | null
          ai_source?: string | null
          answers?: Json
          business_name?: string | null
          created_at?: string
          deep_analysis?: Json | null
          estimated_lost_clients?: number | null
          estimated_lost_eur?: number | null
          extra_context?: string | null
          id?: string
          primary_service?: string | null
          screenshots?: Json
          secondary_services?: Json | null
          updated_at?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      exit_surveys: {
        Row: {
          created_at: string
          details: string | null
          email: string | null
          id: string
          reason: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          reason: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          reason?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      micro_service_usage: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          quantity: number
          recommendation_id: string
          service_id: string
          status: Database["public"]["Enums"]["micro_usage_status"]
          total_price: number
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          quantity?: number
          recommendation_id: string
          service_id: string
          status?: Database["public"]["Enums"]["micro_usage_status"]
          total_price?: number
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          quantity?: number
          recommendation_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["micro_usage_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "micro_service_usage_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "admin_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_service_usage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "micro_services"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_services: {
        Row: {
          active: boolean
          admin_notes: string | null
          category: Database["public"]["Enums"]["micro_category"]
          created_at: string
          currency: string
          delivery_time: string | null
          description: string | null
          difference: number | null
          discount_percentage: number | null
          display_order: number
          group_name: string
          id: string
          offer_price: number
          platform: Database["public"]["Enums"]["micro_platform"]
          recommended_use_case: string | null
          risk_level: Database["public"]["Enums"]["micro_risk_level"]
          service_name: string
          standard_price: number
          unit: string
          updated_at: string
          variant: Database["public"]["Enums"]["micro_variant"]
        }
        Insert: {
          active?: boolean
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["micro_category"]
          created_at?: string
          currency?: string
          delivery_time?: string | null
          description?: string | null
          difference?: number | null
          discount_percentage?: number | null
          display_order?: number
          group_name?: string
          id?: string
          offer_price?: number
          platform: Database["public"]["Enums"]["micro_platform"]
          recommended_use_case?: string | null
          risk_level?: Database["public"]["Enums"]["micro_risk_level"]
          service_name: string
          standard_price?: number
          unit?: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["micro_variant"]
        }
        Update: {
          active?: boolean
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["micro_category"]
          created_at?: string
          currency?: string
          delivery_time?: string | null
          description?: string | null
          difference?: number | null
          discount_percentage?: number | null
          display_order?: number
          group_name?: string
          id?: string
          offer_price?: number
          platform?: Database["public"]["Enums"]["micro_platform"]
          recommended_use_case?: string | null
          risk_level?: Database["public"]["Enums"]["micro_risk_level"]
          service_name?: string
          standard_price?: number
          unit?: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["micro_variant"]
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          admin_notes: string | null
          category: Database["public"]["Enums"]["package_category"]
          created_at: string
          currency: string
          description: string | null
          display_order: number
          duration: Database["public"]["Enums"]["package_duration"]
          id: string
          includes: Json
          is_quote_only: boolean
          level: Database["public"]["Enums"]["package_level"]
          name: string
          normal_price: number
          offer_price: number
          status: Database["public"]["Enums"]["package_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: Database["public"]["Enums"]["package_category"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration: Database["public"]["Enums"]["package_duration"]
          id?: string
          includes?: Json
          is_quote_only?: boolean
          level: Database["public"]["Enums"]["package_level"]
          name: string
          normal_price?: number
          offer_price?: number
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["package_category"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          duration?: Database["public"]["Enums"]["package_duration"]
          id?: string
          includes?: Json
          is_quote_only?: boolean
          level?: Database["public"]["Enums"]["package_level"]
          name?: string
          normal_price?: number
          offer_price?: number
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_funnel_summary: { Args: { _days?: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      addon_category:
        | "optimization"
        | "strategy"
        | "analytics"
        | "planning"
        | "ads_management"
      app_role: "admin" | "user"
      micro_category:
        | "growth"
        | "engagement"
        | "engagement_high"
        | "visibility_boost"
        | "advanced"
      micro_platform:
        | "facebook"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "twitter"
        | "linkedin"
      micro_risk_level: "low" | "medium" | "high"
      micro_usage_status: "pending" | "approved" | "rejected" | "delivered"
      micro_variant: "S" | "M" | "L" | "XL" | "none"
      package_category: "instagram" | "website"
      package_duration:
        | "1_month"
        | "3_months"
        | "6_months"
        | "1_year"
        | "2_years"
        | "5_years"
        | "custom"
      package_level:
        | "basic"
        | "advanced"
        | "premium"
        | "full_basic"
        | "full_advanced"
        | "full_premium"
      package_status: "active" | "inactive"
      recommendation_priority: "low" | "medium" | "high"
      recommendation_status:
        | "new"
        | "reviewed"
        | "contacted"
        | "converted"
        | "rejected"
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
      addon_category: [
        "optimization",
        "strategy",
        "analytics",
        "planning",
        "ads_management",
      ],
      app_role: ["admin", "user"],
      micro_category: [
        "growth",
        "engagement",
        "engagement_high",
        "visibility_boost",
        "advanced",
      ],
      micro_platform: [
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "twitter",
        "linkedin",
      ],
      micro_risk_level: ["low", "medium", "high"],
      micro_usage_status: ["pending", "approved", "rejected", "delivered"],
      micro_variant: ["S", "M", "L", "XL", "none"],
      package_category: ["instagram", "website"],
      package_duration: [
        "1_month",
        "3_months",
        "6_months",
        "1_year",
        "2_years",
        "5_years",
        "custom",
      ],
      package_level: [
        "basic",
        "advanced",
        "premium",
        "full_basic",
        "full_advanced",
        "full_premium",
      ],
      package_status: ["active", "inactive"],
      recommendation_priority: ["low", "medium", "high"],
      recommendation_status: [
        "new",
        "reviewed",
        "contacted",
        "converted",
        "rejected",
      ],
    },
  },
} as const
