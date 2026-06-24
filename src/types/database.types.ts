export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          bio: string | null;
          flavor_summary: string | null;
          last_artwork_slug: string | null;
          last_artwork_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          bio?: string | null;
          flavor_summary?: string | null;
          last_artwork_slug?: string | null;
          last_artwork_title?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversations"]["Insert"]
        >;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      artworks: {
        Row: {
          id: string;
          user_id: string | null;
          slug: string;
          title: string;
          artist: string | null;
          year: number | null;
          medium: string | null;
          description: string | null;
          essay: string | null;
          image_url: string;
          image_alt: string | null;
          image_width: number | null;
          image_height: number | null;
          source_url: string | null;
          tags: string[];
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          slug: string;
          title: string;
          artist?: string | null;
          year?: number | null;
          medium?: string | null;
          description?: string | null;
          essay?: string | null;
          image_url: string;
          image_alt?: string | null;
          image_width?: number | null;
          image_height?: number | null;
          source_url?: string | null;
          tags?: string[];
          is_published?: boolean;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["artworks"]["Insert"]>;
        Relationships: [];
      };
      concepts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["concepts"]["Insert"]>;
        Relationships: [];
      };
      user_artwork_visits: {
        Row: {
          id: string;
          user_id: string;
          artwork_slug: string;
          artwork_title: string;
          last_visited_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          artwork_slug: string;
          artwork_title: string;
          last_visited_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_artwork_visits"]["Insert"]
        >;
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          usage_type: "chat" | "embedding" | "memory" | "tts";
          model: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          char_count: number;
          estimated_cost_usd: number;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          usage_type: "chat" | "embedding" | "memory" | "tts";
          model: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          char_count?: number;
          estimated_cost_usd?: number;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ai_usage_logs"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Artwork = Database["public"]["Tables"]["artworks"]["Row"];
export type Concept = Database["public"]["Tables"]["concepts"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type ArtworkWithConcepts = Artwork & {
  concepts: Concept[];
};
