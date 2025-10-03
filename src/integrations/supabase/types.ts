export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      documents: {
        Row: {
          ai_summary: string | null;
          created_at: string;
          description: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          file_name: string;
          file_size_bytes: number | null;
          file_url: string;
          id: string;
          metadata: Json | null;
          mime_type: string | null;
          property_id: string;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          ai_summary?: string | null;
          created_at?: string;
          description?: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          file_name: string;
          file_size_bytes?: number | null;
          file_url: string;
          id?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          property_id: string;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          ai_summary?: string | null;
          created_at?: string;
          description?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_name?: string;
          file_size_bytes?: number | null;
          file_url?: string;
          id?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          property_id?: string;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          bathrooms: number | null;
          bedrooms: number | null;
          city: string;
          claimed_by: string | null;
          completion_percentage: number | null;
          council_tax_band: string | null;
          created_at: string;
          epc_expiry_date: string | null;
          epc_rating: string | null;
          epc_score: number | null;
          flood_risk_level: string | null;
          front_photo_url: string | null;
          ground_rent_annual: number | null;
          id: string;
          is_public: boolean | null;
          lease_years_remaining: number | null;
          postcode: string;
          ppuk_reference: string | null;
          property_style: Database["public"]["Enums"]["property_style"] | null;
          property_type: Database["public"]["Enums"]["property_type"];
          service_charge_annual: number | null;
          tenure: Database["public"]["Enums"]["tenure_type"];
          title_number: string | null;
          total_floor_area_sqm: number | null;
          updated_at: string;
          year_built: number | null;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city: string;
          claimed_by?: string | null;
          completion_percentage?: number | null;
          council_tax_band?: string | null;
          created_at?: string;
          epc_expiry_date?: string | null;
          epc_rating?: string | null;
          epc_score?: number | null;
          flood_risk_level?: string | null;
          front_photo_url?: string | null;
          ground_rent_annual?: number | null;
          id?: string;
          is_public?: boolean | null;
          lease_years_remaining?: number | null;
          postcode: string;
          ppuk_reference?: string | null;
          property_style?: Database["public"]["Enums"]["property_style"] | null;
          property_type: Database["public"]["Enums"]["property_type"];
          service_charge_annual?: number | null;
          tenure?: Database["public"]["Enums"]["tenure_type"];
          title_number?: string | null;
          total_floor_area_sqm?: number | null;
          updated_at?: string;
          year_built?: number | null;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city?: string;
          claimed_by?: string | null;
          completion_percentage?: number | null;
          council_tax_band?: string | null;
          created_at?: string;
          epc_expiry_date?: string | null;
          epc_rating?: string | null;
          epc_score?: number | null;
          flood_risk_level?: string | null;
          front_photo_url?: string | null;
          ground_rent_annual?: number | null;
          id?: string;
          is_public?: boolean | null;
          lease_years_remaining?: number | null;
          postcode?: string;
          ppuk_reference?: string | null;
          property_style?: Database["public"]["Enums"]["property_style"] | null;
          property_type?: Database["public"]["Enums"]["property_type"];
          service_charge_annual?: number | null;
          tenure?: Database["public"]["Enums"]["tenure_type"];
          title_number?: string | null;
          total_floor_area_sqm?: number | null;
          updated_at?: string;
          year_built?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_claimed_by_fkey";
            columns: ["claimed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      property_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          file_name: string;
          file_url: string;
          id: string;
          is_featured: boolean | null;
          property_id: string;
          room_type: string | null;
          uploaded_by: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          file_name: string;
          file_url: string;
          id?: string;
          is_featured?: boolean | null;
          property_id: string;
          room_type?: string | null;
          uploaded_by: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          file_name?: string;
          file_url?: string;
          id?: string;
          is_featured?: boolean | null;
          property_id?: string;
          room_type?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_properties: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          property_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          property_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          property_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_properties_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_ppuk_reference: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      document_type:
        | "epc"
        | "floorplan"
        | "title_deed"
        | "survey"
        | "planning"
        | "lease"
        | "guarantee"
        | "building_control"
        | "gas_safety"
        | "electrical_safety"
        | "other";
      property_style:
        | "victorian"
        | "edwardian"
        | "georgian"
        | "modern"
        | "new_build"
        | "period"
        | "contemporary"
        | "other";
      property_type:
        | "detached"
        | "semi_detached"
        | "terraced"
        | "flat"
        | "bungalow"
        | "cottage"
        | "other";
      tenure_type: "freehold" | "leasehold" | "shared_ownership";
      user_role: "owner" | "buyer" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      document_type: [
        "epc",
        "floorplan",
        "title_deed",
        "survey",
        "planning",
        "lease",
        "guarantee",
        "building_control",
        "gas_safety",
        "electrical_safety",
        "other",
      ],
      property_style: [
        "victorian",
        "edwardian",
        "georgian",
        "modern",
        "new_build",
        "period",
        "contemporary",
        "other",
      ],
      property_type: [
        "detached",
        "semi_detached",
        "terraced",
        "flat",
        "bungalow",
        "cottage",
        "other",
      ],
      tenure_type: ["freehold", "leasehold", "shared_ownership"],
      user_role: ["owner", "buyer", "other"],
    },
  },
} as const;
