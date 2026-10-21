/**
 * Types for the tables in supabase/migrations. Hand-written to match the migration;
 * regenerate with `supabase gen types typescript` if the schema grows.
 */
import type { Json } from './json';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          avatar?: string | null;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          mode: string;
          feed_style: string;
          sq: number;
          label: string;
          coins_left: number;
          good_calls: number;
          total_posts: number;
          ledger: Json;
          decisions: Json;
          reflection: Json | null;
        };
        Insert: {
          id: string;
          user_id?: string;
          created_at?: string;
          mode: string;
          feed_style: string;
          sq: number;
          label: string;
          coins_left: number;
          good_calls: number;
          total_posts: number;
          ledger: Json;
          decisions: Json;
          reflection?: Json | null;
        };
        Update: {
          reflection?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      delete_my_account: { Args: Record<never, never>; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
