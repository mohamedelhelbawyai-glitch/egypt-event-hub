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
      admin_users: {
        Row: {
          created_at: string
          created_by_id: string | null
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string
          password_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name: string
          password_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_restrictions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label_ar: string
          label_en: string
          requires_field: string
          updated_at: string
          validation_rule: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_ar: string
          label_en: string
          requires_field: string
          updated_at?: string
          validation_rule: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          requires_field?: string
          updated_at?: string
          validation_rule?: Json
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          governorate_id: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          governorate_id: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          governorate_id?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_fee_rules: {
        Row: {
          commission_pct: number
          created_at: string
          effective_from: string
          id: string
          is_current: boolean
          service_fee_egp: number
          trust_tier: number
          updated_at: string
        }
        Insert: {
          commission_pct: number
          created_at?: string
          effective_from?: string
          id?: string
          is_current?: boolean
          service_fee_egp: number
          trust_tier: number
          updated_at?: string
        }
        Update: {
          commission_pct?: number
          created_at?: string
          effective_from?: string
          id?: string
          is_current?: boolean
          service_fee_egp?: number
          trust_tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          color_hex: string | null
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_tags: {
        Row: {
          event_id: string
          id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          id?: string
          tag_id: string
        }
        Update: {
          event_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approved_by_admin_id: string | null
          audience_restriction_id: string | null
          cancellation_reason: string | null
          category_id: string
          cover_image_url: string
          created_at: string
          custom_refund_policy: Json | null
          description_ar: string
          description_en: string
          doors_open_at: string | null
          ends_at: string
          format: Database["public"]["Enums"]["event_format"]
          gallery_urls: string[] | null
          id: string
          organizer_id: string
          private_invite_token: string | null
          refund_policy_id: string | null
          seatsio_event_key: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          stream_url: string | null
          title_ar: string
          title_en: string
          updated_at: string
          venue_id: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          approved_by_admin_id?: string | null
          audience_restriction_id?: string | null
          cancellation_reason?: string | null
          category_id: string
          cover_image_url: string
          created_at?: string
          custom_refund_policy?: Json | null
          description_ar: string
          description_en: string
          doors_open_at?: string | null
          ends_at: string
          format: Database["public"]["Enums"]["event_format"]
          gallery_urls?: string[] | null
          id?: string
          organizer_id: string
          private_invite_token?: string | null
          refund_policy_id?: string | null
          seatsio_event_key?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          stream_url?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
          venue_id?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          approved_by_admin_id?: string | null
          audience_restriction_id?: string | null
          cancellation_reason?: string | null
          category_id?: string
          cover_image_url?: string
          created_at?: string
          custom_refund_policy?: Json | null
          description_ar?: string
          description_en?: string
          doors_open_at?: string | null
          ends_at?: string
          format?: Database["public"]["Enums"]["event_format"]
          gallery_urls?: string[] | null
          id?: string
          organizer_id?: string
          private_invite_token?: string | null
          refund_policy_id?: string | null
          seatsio_event_key?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          stream_url?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          venue_id?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_audience_restriction_id_fkey"
            columns: ["audience_restriction_id"]
            isOneToOne: false
            referencedRelation: "audience_restrictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_refund_policy_id_fkey"
            columns: ["refund_policy_id"]
            isOneToOne: false
            referencedRelation: "refund_policy_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by_admin_id: string | null
          value: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by_admin_id?: string | null
          value?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by_admin_id?: string | null
          value?: boolean
        }
        Relationships: []
      }
      governorates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_target: string | null
          link_type: string | null
          sort_order: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_target?: string | null
          link_type?: string | null
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_target?: string | null
          link_type?: string | null
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_banners_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          created_at: string
          earn_rate: number
          expiry_days: number | null
          id: string
          is_current: boolean
          max_redeem_pct_per_order: number
          min_redeem_points: number
          redeem_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          earn_rate: number
          expiry_days?: number | null
          id?: string
          is_current?: boolean
          max_redeem_pct_per_order?: number
          min_redeem_points?: number
          redeem_rate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          earn_rate?: number
          expiry_days?: number | null
          id?: string
          is_current?: boolean
          max_redeem_pct_per_order?: number
          min_redeem_points?: number
          redeem_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string
          description: string
          expires_at: string | null
          id: string
          order_id: string | null
          points: number
          type: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          quantity: number
          seat_labels: string[] | null
          ticket_type_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          quantity: number
          seat_labels?: string[] | null
          ticket_type_id: string
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          quantity?: number
          seat_labels?: string[] | null
          ticket_type_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: number
          event_id: string
          expires_at: string | null
          id: string
          loyalty_discount: number
          loyalty_points_used: number
          order_number: string
          paid_at: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_provider_ref: string | null
          promo_code_id: string | null
          refund_reason: string | null
          refunded_by_admin_id: string | null
          seatsio_hold_token: string | null
          service_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          event_id: string
          expires_at?: string | null
          id?: string
          loyalty_discount?: number
          loyalty_points_used?: number
          order_number: string
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_provider_ref?: string | null
          promo_code_id?: string | null
          refund_reason?: string | null
          refunded_by_admin_id?: string | null
          seatsio_hold_token?: string | null
          service_fee: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          event_id?: string
          expires_at?: string | null
          id?: string
          loyalty_discount?: number
          loyalty_points_used?: number
          order_number?: string
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_provider_ref?: string | null
          promo_code_id?: string | null
          refund_reason?: string | null
          refunded_by_admin_id?: string | null
          seatsio_hold_token?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_fk"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_refunded_by_admin_id_fkey"
            columns: ["refunded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_payouts: {
        Row: {
          commission_amount: number
          commission_pct: number
          created_at: string
          event_id: string
          gross_revenue: number
          id: string
          net_amount: number
          organizer_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          triggered_by_admin_id: string | null
          updated_at: string
        }
        Insert: {
          commission_amount: number
          commission_pct: number
          created_at?: string
          event_id: string
          gross_revenue: number
          id?: string
          net_amount: number
          organizer_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          triggered_by_admin_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          event_id?: string
          gross_revenue?: number
          id?: string
          net_amount?: number
          organizer_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          triggered_by_admin_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_payouts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_payouts_triggered_by_admin_id_fkey"
            columns: ["triggered_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_staff: {
        Row: {
          assigned_by_admin_id: string | null
          created_at: string
          id: string
          is_active: boolean
          organizer_id: string
          user_id: string
        }
        Insert: {
          assigned_by_admin_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organizer_id: string
          user_id: string
        }
        Update: {
          assigned_by_admin_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_staff_assigned_by_admin_id_fkey"
            columns: ["assigned_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_staff_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          approved_by_id: string | null
          bank_account_enc: string | null
          banner_url: string | null
          bio_ar: string | null
          bio_en: string | null
          commercial_reg_no: string | null
          created_at: string
          display_name_ar: string
          display_name_en: string
          id: string
          logo_url: string | null
          social_links: Json | null
          status: Database["public"]["Enums"]["organizer_status"]
          tax_id: string | null
          trust_tier: number
          type: Database["public"]["Enums"]["organizer_type"]
          updated_at: string
          user_id: string
          verified_badge: boolean
        }
        Insert: {
          approved_by_id?: string | null
          bank_account_enc?: string | null
          banner_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          commercial_reg_no?: string | null
          created_at?: string
          display_name_ar: string
          display_name_en: string
          id?: string
          logo_url?: string | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["organizer_status"]
          tax_id?: string | null
          trust_tier?: number
          type: Database["public"]["Enums"]["organizer_type"]
          updated_at?: string
          user_id: string
          verified_badge?: boolean
        }
        Update: {
          approved_by_id?: string | null
          bank_account_enc?: string | null
          banner_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          commercial_reg_no?: string | null
          created_at?: string
          display_name_ar?: string
          display_name_en?: string
          id?: string
          logo_url?: string | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["organizer_status"]
          tax_id?: string | null
          trust_tier?: number
          type?: Database["public"]["Enums"]["organizer_type"]
          updated_at?: string
          user_id?: string
          verified_badge?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organizers_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods_config: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          label_ar: string
          label_en: string
          min_amount_egp: number
          provider: Database["public"]["Enums"]["payment_provider_enum"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          label_ar: string
          label_en: string
          min_amount_egp?: number
          provider: Database["public"]["Enums"]["payment_provider_enum"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          min_amount_egp?: number
          provider?: Database["public"]["Enums"]["payment_provider_enum"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gateway_response: Json | null
          id: string
          order_id: string
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          paymob_order_id: string | null
          paymob_txn_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          paymob_order_id?: string | null
          paymob_txn_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          paymob_order_id?: string | null
          paymob_txn_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_uses: {
        Row: {
          created_at: string
          discount_applied: number
          id: string
          order_id: string
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_applied: number
          id?: string
          order_id: string
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number
          id?: string
          order_id?: string
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_to: Database["public"]["Enums"]["promo_applicable_to"]
          code: string
          created_at: string
          created_by: Database["public"]["Enums"]["created_by_role"]
          created_by_organizer_id: string | null
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          event_id: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_user: number
          ticket_type_id: string | null
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_to?: Database["public"]["Enums"]["promo_applicable_to"]
          code: string
          created_at?: string
          created_by: Database["public"]["Enums"]["created_by_role"]
          created_by_organizer_id?: string | null
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number
          ticket_type_id?: string | null
          updated_at?: string
          uses_count?: number
          valid_from: string
          valid_until: string
        }
        Update: {
          applicable_to?: Database["public"]["Enums"]["promo_applicable_to"]
          code?: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["created_by_role"]
          created_by_organizer_id?: string | null
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value?: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number
          ticket_type_id?: string | null
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_organizer_id_fkey"
            columns: ["created_by_organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          qualifying_order_id: string | null
          referee_discount_egp: number
          referee_user_id: string
          referrer_reward_type: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_value: number
          referrer_user_id: string
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualifying_order_id?: string | null
          referee_discount_egp?: number
          referee_user_id: string
          referrer_reward_type: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_value: number
          referrer_user_id: string
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualifying_order_id?: string | null
          referee_discount_egp?: number
          referee_user_id?: string
          referrer_reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_value?: number
          referrer_user_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_qualifying_order_id_fkey"
            columns: ["qualifying_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referee_user_id_fkey"
            columns: ["referee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_policy_templates: {
        Row: {
          created_at: string
          deadline_days_before: number | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          refund_percentage: number | null
          type: Database["public"]["Enums"]["refund_policy_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_days_before?: number | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          refund_percentage?: number | null
          type: Database["public"]["Enums"]["refund_policy_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_days_before?: number | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          refund_percentage?: number | null
          type?: Database["public"]["Enums"]["refund_policy_type"]
          updated_at?: string
        }
        Relationships: []
      }
      seat_holds: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          seat_labels: string[]
          seatsio_hold_token: string
          status: Database["public"]["Enums"]["seat_hold_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          seat_labels: string[]
          seatsio_hold_token: string
          status?: Database["public"]["Enums"]["seat_hold_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          seat_labels?: string[]
          seatsio_hold_token?: string
          status?: Database["public"]["Enums"]["seat_hold_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_holds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_holds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          name_ar: string
          name_en: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name_ar: string
          name_en: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      ticket_scan_logs: {
        Row: {
          device_info: Json | null
          event_id: string
          failure_reason: string | null
          id: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Insert: {
          device_info?: Json | null
          event_id: string
          failure_reason?: string | null
          id?: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Update: {
          device_info?: Json | null
          event_id?: string
          failure_reason?: string | null
          id?: string
          result?: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scan_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scan_logs_scanned_by_user_id_fkey"
            columns: ["scanned_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scan_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_type_templates: {
        Row: {
          created_at: string
          default_price: number
          icon_url: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          updated_at: string
          visual_type: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value: string
        }
        Insert: {
          created_at?: string
          default_price?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          updated_at?: string
          visual_type: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value: string
        }
        Update: {
          created_at?: string
          default_price?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string
          visual_type?: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          created_by: Database["public"]["Enums"]["created_by_role"]
          event_id: string
          id: string
          is_seated: boolean
          max_per_order: number
          name_ar: string
          name_en: string
          people_per_ticket: number
          perks: string[] | null
          price: number
          quantity_reserved: number
          quantity_sold: number
          quantity_total: number
          sale_ends_at: string
          sale_starts_at: string
          seatsio_category_key: string | null
          template_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["ticket_visibility"]
          visual_type: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value: string
        }
        Insert: {
          created_at?: string
          created_by: Database["public"]["Enums"]["created_by_role"]
          event_id: string
          id?: string
          is_seated?: boolean
          max_per_order?: number
          name_ar: string
          name_en: string
          people_per_ticket?: number
          perks?: string[] | null
          price?: number
          quantity_reserved?: number
          quantity_sold?: number
          quantity_total: number
          sale_ends_at: string
          sale_starts_at: string
          seatsio_category_key?: string | null
          template_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["ticket_visibility"]
          visual_type: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value: string
        }
        Update: {
          created_at?: string
          created_by?: Database["public"]["Enums"]["created_by_role"]
          event_id?: string
          id?: string
          is_seated?: boolean
          max_per_order?: number
          name_ar?: string
          name_en?: string
          people_per_ticket?: number
          perks?: string[] | null
          price?: number
          quantity_reserved?: number
          quantity_sold?: number
          quantity_total?: number
          sale_ends_at?: string
          sale_starts_at?: string
          seatsio_category_key?: string | null
          template_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["ticket_visibility"]
          visual_type?: Database["public"]["Enums"]["ticket_visual_type"]
          visual_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticket_type_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          event_id: string
          id: string
          order_item_id: string
          qr_code: string
          scanned_at: string | null
          scanned_by_staff_id: string | null
          seat_label: string | null
          seat_row: string | null
          seat_section: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          stream_access_token: string | null
          ticket_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          order_item_id: string
          qr_code: string
          scanned_at?: string | null
          scanned_by_staff_id?: string | null
          seat_label?: string | null
          seat_row?: string | null
          seat_section?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          stream_access_token?: string | null
          ticket_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          order_item_id?: string
          qr_code?: string
          scanned_at?: string | null
          scanned_by_staff_id?: string | null
          seat_label?: string | null
          seat_row?: string | null
          seat_section?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          stream_access_token?: string | null
          ticket_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_scanned_by_staff_id_fkey"
            columns: ["scanned_by_staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_followed_organizers: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_followed_organizers_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_followed_organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          gender: Database["public"]["Enums"]["user_gender"] | null
          id: string
          locale: Database["public"]["Enums"]["user_locale"]
          loyalty_points: number
          name_ar: string | null
          name_en: string | null
          phone: string
          phone_verified_at: string | null
          referral_code: string
          referred_by_user_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          id?: string
          locale?: Database["public"]["Enums"]["user_locale"]
          loyalty_points?: number
          name_ar?: string | null
          name_en?: string | null
          phone: string
          phone_verified_at?: string | null
          referral_code: string
          referred_by_user_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          id?: string
          locale?: Database["public"]["Enums"]["user_locale"]
          loyalty_points?: number
          name_ar?: string | null
          name_en?: string | null
          phone?: string
          phone_verified_at?: string | null
          referral_code?: string
          referred_by_user_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_facilities: {
        Row: {
          facility_id: string
          id: string
          venue_id: string
        }
        Insert: {
          facility_id: string
          id?: string
          venue_id: string
        }
        Update: {
          facility_id?: string
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "venue_facilities_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_facilities_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_facilities_list: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address_ar: string
          address_en: string
          approved_by_admin_id: string | null
          city_id: string | null
          created_at: string
          google_maps_url: string | null
          governorate_id: string
          id: string
          lat: number
          lng: number
          name_ar: string
          name_en: string
          photos: string[] | null
          seatsio_chart_key: string | null
          sections: Json | null
          status: Database["public"]["Enums"]["venue_status"]
          submitted_by_org_id: string | null
          total_capacity: number
          type: Database["public"]["Enums"]["venue_type"]
          updated_at: string
        }
        Insert: {
          address_ar: string
          address_en: string
          approved_by_admin_id?: string | null
          city_id?: string | null
          created_at?: string
          google_maps_url?: string | null
          governorate_id: string
          id?: string
          lat: number
          lng: number
          name_ar: string
          name_en: string
          photos?: string[] | null
          seatsio_chart_key?: string | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["venue_status"]
          submitted_by_org_id?: string | null
          total_capacity: number
          type: Database["public"]["Enums"]["venue_type"]
          updated_at?: string
        }
        Update: {
          address_ar?: string
          address_en?: string
          approved_by_admin_id?: string | null
          city_id?: string | null
          created_at?: string
          google_maps_url?: string | null
          governorate_id?: string
          id?: string
          lat?: number
          lng?: number
          name_ar?: string
          name_en?: string
          photos?: string[] | null
          seatsio_chart_key?: string | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["venue_status"]
          submitted_by_org_id?: string | null
          total_capacity?: number
          type?: Database["public"]["Enums"]["venue_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_submitted_by_org_id_fkey"
            columns: ["submitted_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "FINANCE"
        | "SUPPORT"
        | "CONTENT_MANAGER"
      created_by_role: "ADMIN" | "ORGANIZER"
      event_format: "GA" | "SEATED" | "ONLINE" | "HYBRID" | "FREE"
      event_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "PUBLISHED"
        | "ON_SALE"
        | "SOLD_OUT"
        | "LIVE"
        | "COMPLETED"
        | "CANCELLED"
      event_visibility: "PUBLIC" | "PRIVATE"
      loyalty_txn_type: "EARN" | "REDEEM" | "EXPIRE" | "ADJUSTMENT"
      order_status:
        | "PENDING"
        | "PAID"
        | "FAILED"
        | "REFUNDED"
        | "PARTIALLY_REFUNDED"
        | "CANCELLED"
      organizer_status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED"
      organizer_type: "COMPANY" | "INDIVIDUAL"
      payment_method_enum: "CARD" | "VODAFONE_CASH" | "FAWRY" | "INSTAPAY"
      payment_provider_enum:
        | "PAYMOB_CARD"
        | "PAYMOB_VODAFONE"
        | "PAYMOB_FAWRY"
        | "PAYMOB_INSTAPAY"
      payment_status: "PENDING" | "SUCCESS" | "FAILED"
      payment_type: "CHARGE" | "REFUND"
      payout_status: "PENDING" | "PROCESSING" | "PAID" | "FAILED"
      promo_applicable_to: "ALL" | "EVENT" | "TICKET_TYPE"
      promo_discount_type: "PERCENTAGE" | "FIXED_EGP"
      referral_reward_type: "EARN" | "DISCOUNT"
      referral_status: "PENDING" | "CREDITED" | "EXPIRED"
      refund_policy_type: "FULL" | "PARTIAL" | "NO_REFUND"
      scan_result:
        | "SUCCESS"
        | "ALREADY_SCANNED"
        | "INVALID"
        | "WRONG_EVENT"
        | "RESTRICTION_FAILED"
        | "TICKET_CANCELLED"
      seat_hold_status: "ACTIVE" | "CONVERTED" | "EXPIRED" | "RELEASED"
      ticket_status: "ACTIVE" | "SCANNED" | "CANCELLED" | "REFUNDED"
      ticket_visibility: "PUBLIC" | "HIDDEN"
      ticket_visual_type: "IMAGE" | "COLOR"
      user_gender: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY"
      user_locale: "AR" | "EN"
      user_status: "ACTIVE" | "SUSPENDED" | "BANNED"
      venue_status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED"
      venue_type: "STADIUM" | "THEATER" | "HALL" | "ARENA" | "OUTDOOR" | "OTHER"
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
      admin_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "FINANCE",
        "SUPPORT",
        "CONTENT_MANAGER",
      ],
      created_by_role: ["ADMIN", "ORGANIZER"],
      event_format: ["GA", "SEATED", "ONLINE", "HYBRID", "FREE"],
      event_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "PUBLISHED",
        "ON_SALE",
        "SOLD_OUT",
        "LIVE",
        "COMPLETED",
        "CANCELLED",
      ],
      event_visibility: ["PUBLIC", "PRIVATE"],
      loyalty_txn_type: ["EARN", "REDEEM", "EXPIRE", "ADJUSTMENT"],
      order_status: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
        "CANCELLED",
      ],
      organizer_status: ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"],
      organizer_type: ["COMPANY", "INDIVIDUAL"],
      payment_method_enum: ["CARD", "VODAFONE_CASH", "FAWRY", "INSTAPAY"],
      payment_provider_enum: [
        "PAYMOB_CARD",
        "PAYMOB_VODAFONE",
        "PAYMOB_FAWRY",
        "PAYMOB_INSTAPAY",
      ],
      payment_status: ["PENDING", "SUCCESS", "FAILED"],
      payment_type: ["CHARGE", "REFUND"],
      payout_status: ["PENDING", "PROCESSING", "PAID", "FAILED"],
      promo_applicable_to: ["ALL", "EVENT", "TICKET_TYPE"],
      promo_discount_type: ["PERCENTAGE", "FIXED_EGP"],
      referral_reward_type: ["EARN", "DISCOUNT"],
      referral_status: ["PENDING", "CREDITED", "EXPIRED"],
      refund_policy_type: ["FULL", "PARTIAL", "NO_REFUND"],
      scan_result: [
        "SUCCESS",
        "ALREADY_SCANNED",
        "INVALID",
        "WRONG_EVENT",
        "RESTRICTION_FAILED",
        "TICKET_CANCELLED",
      ],
      seat_hold_status: ["ACTIVE", "CONVERTED", "EXPIRED", "RELEASED"],
      ticket_status: ["ACTIVE", "SCANNED", "CANCELLED", "REFUNDED"],
      ticket_visibility: ["PUBLIC", "HIDDEN"],
      ticket_visual_type: ["IMAGE", "COLOR"],
      user_gender: ["MALE", "FEMALE", "PREFER_NOT_TO_SAY"],
      user_locale: ["AR", "EN"],
      user_status: ["ACTIVE", "SUSPENDED", "BANNED"],
      venue_status: ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"],
      venue_type: ["STADIUM", "THEATER", "HALL", "ARENA", "OUTDOOR", "OTHER"],
    },
  },
} as const
