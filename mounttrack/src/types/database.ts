export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export interface Shop {
  id: string  // = auth.uid()
  shop_name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  brand_color: string
  onboarding_step: number  // 0=new, 1=shop_done, 2=subscribed+complete
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  created_at: string
  updated_at: string
}

export interface Stage {
  id: string
  shop_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  shop_id: string
  job_number: number
  stage_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  animal_type: string
  mount_style: string
  quoted_price: number
  deposit_amount: number | null
  estimated_completion_date: string  // ISO date string 'YYYY-MM-DD'
  referral_source: string | null
  is_rush: boolean
  social_media_consent: boolean
  photo_paths: string[]
  notes: string | null
  is_overdue?: boolean  // computed column: estimated_completion_date < CURRENT_DATE (not stored in DB)
  created_at: string
  updated_at: string
}

export interface JobNumberSeq {
  shop_id: string
  last_number: number
}

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: Shop
        // brand_color, onboarding_step have DB defaults so optional on Insert
        Insert: Omit<Shop, 'created_at' | 'updated_at' | 'brand_color' | 'onboarding_step'> & {
          brand_color?: string
          onboarding_step?: number
        }
        Update: Partial<Omit<Shop, 'id' | 'created_at'>>
        Relationships: []
      }
      stages: {
        Row: Stage
        Insert: Omit<Stage, 'id' | 'created_at' | 'updated_at'> & { id?: string; position?: number }
        Update: Partial<Omit<Stage, 'id' | 'shop_id' | 'created_at'>>
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'job_number' | 'is_overdue'> & {
          id?: string
          job_number?: number
        }
        Update: Partial<Omit<Job, 'id' | 'shop_id' | 'created_at' | 'is_overdue'>>
        Relationships: []
      }
      job_number_seq: {
        Row: JobNumberSeq
        Insert: JobNumberSeq
        Update: Partial<JobNumberSeq>
        Relationships: []
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    Views: {}
    Functions: {
      get_next_job_number: {
        Args: { p_shop_id: string }
        Returns: number
      }
    }
  }
}
