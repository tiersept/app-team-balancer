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
      players: {
        Row: {
          id: string;
          name: string;
          skill: number;
          created_at: string;
          room_id: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          skill?: number;
          created_at?: string;
          room_id: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          skill?: number;
          created_at?: string;
          room_id?: string;
          is_active?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          player_name: string;
          room_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          player_name: string;
          room_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          player_name?: string;
          room_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
