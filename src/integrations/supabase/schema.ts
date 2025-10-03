/**
 * Extended Supabase Database Schema Types
 * Extends the existing types.ts with the media table and fixes
 */

import type { Database as BaseDatabase } from "./types";

export type Database = BaseDatabase & {
  public: BaseDatabase["public"] & {
    Tables: BaseDatabase["public"]["Tables"] & {
      media: {
        Row: {
          id: string;
          property_id: string;
          type?: string;
          mime_type?: string;
          url?: string;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number;
          title?: string;
          caption?: string;
          room_type?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          type?: string;
          mime_type?: string;
          url?: string;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number;
          title?: string;
          caption?: string;
          room_type?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          type?: string;
          mime_type?: string;
          url?: string;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number;
          title?: string;
          caption?: string;
          room_type?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
  };
};
