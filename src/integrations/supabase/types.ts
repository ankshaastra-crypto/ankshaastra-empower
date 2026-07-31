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
      invoice_sequences: {
        Row: {
          financial_year: string
          last_sequence: number
        }
        Insert: {
          financial_year: string
          last_sequence?: number
        }
        Update: {
          financial_year?: string
          last_sequence?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          cgst_amount: number
          cgst_rate: number
          created_at: string
          customer_city: string | null
          customer_email: string
          customer_mobile: string
          customer_name: string
          customer_pincode: string | null
          customer_state: string | null
          financial_year: string
          hsn_sac_code: string
          id: string
          igst_amount: number
          igst_rate: number
          invoice_number: string
          invoice_sequence: number
          is_intra_state: boolean
          order_id: string
          package_type: string
          sgst_amount: number
          sgst_rate: number
          storage_url: string | null
          subtotal: number
          total_amount: number
          transaction_id: string | null
        }
        Insert: {
          cgst_amount?: number
          cgst_rate?: number
          created_at?: string
          customer_city?: string | null
          customer_email?: string
          customer_mobile?: string
          customer_name?: string
          customer_pincode?: string | null
          customer_state?: string | null
          financial_year: string
          hsn_sac_code?: string
          id?: string
          igst_amount?: number
          igst_rate?: number
          invoice_number: string
          invoice_sequence: number
          is_intra_state?: boolean
          order_id: string
          package_type?: string
          sgst_amount?: number
          sgst_rate?: number
          storage_url?: string | null
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
        }
        Update: {
          cgst_amount?: number
          cgst_rate?: number
          created_at?: string
          customer_city?: string | null
          customer_email?: string
          customer_mobile?: string
          customer_name?: string
          customer_pincode?: string | null
          customer_state?: string | null
          financial_year?: string
          hsn_sac_code?: string
          id?: string
          igst_amount?: number
          igst_rate?: number
          invoice_number?: string
          invoice_sequence?: number
          is_intra_state?: boolean
          order_id?: string
          package_type?: string
          sgst_amount?: number
          sgst_rate?: number
          storage_url?: string | null
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          child_dob: string | null
          child_gender: string | null
          child_pincode: string | null
          child_pob: string | null
          child_tob: string | null
          created_at: string
          customer_city: string | null
          customer_email: string
          customer_mobile: string
          customer_name: string
          father_first_name: string | null
          father_last_name: string | null
          father_middle_name: string | null
          id: string
          order_id: string
          package_type: string
          person1_dob: string | null
          person1_first_name: string | null
          person1_full_name: string | null
          person1_gender: string | null
          person1_middle_name: string | null
          person1_middle_name_type: string | null
          person2_dob: string | null
          person2_first_name: string | null
          person2_full_name: string | null
          person2_gender: string | null
          person2_middle_name: string | null
          person2_middle_name_type: string | null
          person3_dob: string | null
          person3_first_name: string | null
          person3_full_name: string | null
          person3_gender: string | null
          person3_middle_name: string | null
          person3_middle_name_type: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          child_dob?: string | null
          child_gender?: string | null
          child_pincode?: string | null
          child_pob?: string | null
          child_tob?: string | null
          created_at?: string
          customer_city?: string | null
          customer_email?: string
          customer_mobile?: string
          customer_name?: string
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          id?: string
          order_id: string
          package_type?: string
          person1_dob?: string | null
          person1_first_name?: string | null
          person1_full_name?: string | null
          person1_gender?: string | null
          person1_middle_name?: string | null
          person1_middle_name_type?: string | null
          person2_dob?: string | null
          person2_first_name?: string | null
          person2_full_name?: string | null
          person2_gender?: string | null
          person2_middle_name?: string | null
          person2_middle_name_type?: string | null
          person3_dob?: string | null
          person3_first_name?: string | null
          person3_full_name?: string | null
          person3_gender?: string | null
          person3_middle_name?: string | null
          person3_middle_name_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          child_dob?: string | null
          child_gender?: string | null
          child_pincode?: string | null
          child_pob?: string | null
          child_tob?: string | null
          created_at?: string
          customer_city?: string | null
          customer_email?: string
          customer_mobile?: string
          customer_name?: string
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          id?: string
          order_id?: string
          package_type?: string
          person1_dob?: string | null
          person1_first_name?: string | null
          person1_full_name?: string | null
          person1_gender?: string | null
          person1_middle_name?: string | null
          person1_middle_name_type?: string | null
          person2_dob?: string | null
          person2_first_name?: string | null
          person2_full_name?: string | null
          person2_gender?: string | null
          person2_middle_name?: string | null
          person2_middle_name_type?: string | null
          person3_dob?: string | null
          person3_first_name?: string | null
          person3_full_name?: string | null
          person3_gender?: string | null
          person3_middle_name?: string | null
          person3_middle_name_type?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_invoice_number: {
        Args: { p_financial_year: string }
        Returns: {
          invoice_number: string
          sequence_num: number
        }[]
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
