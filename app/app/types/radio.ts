export interface Radio {
  id: string;
  name: string;
  stream_url: string;
  region: string;
  description?: string;
  genre?: string;
  country?: string;
  language?: string;
  website?: string;
  logo?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RadioFilters {
  region?: string;
  genre?: string;
  country?: string;
  search?: string;
}