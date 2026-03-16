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
  sms_opted_out: boolean
  photo_paths: string[]
  notes: string | null
  portal_token: string  // UUID — credential for the public customer portal URL
  is_overdue?: boolean  // computed column: estimated_completion_date < CURRENT_DATE (not stored in DB)
  created_at: string
  updated_at: string
}

export interface JobPhoto {
  id: string
  shop_id: string
  job_id: string
  stage_id: string | null  // null = uploaded before stage tracking, or stage deleted
  path: string
  uploaded_at: string
}

export interface JobNumberSeq {
  shop_id: string
  last_number: number
}

export interface Payment {
  id: string
  shop_id: string
  job_id: string
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount_cents: number
  paid_at: string  // ISO timestamp string
}

export interface Notification {
  id: string
  shop_id: string
  job_id: string | null    // null for waitlist_confirm type
  channel: 'sms' | 'email'
  type: 'stage_update' | 'payment_request' | 'waitlist_confirm'
  stage_name: string | null
  sent_at: string
}

export interface WaitlistEntry {
  id: string
  shop_id: string
  name: string
  phone: string
  animal_type: string
  created_at: string
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
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'job_number' | 'is_overdue' | 'portal_token'> & {
          id?: string
          job_number?: number
          portal_token?: string
        }
        Update: Partial<Omit<Job, 'id' | 'shop_id' | 'created_at' | 'is_overdue'>>
        Relationships: []
      }
      job_photos: {
        Row: JobPhoto
        Insert: Omit<JobPhoto, 'id' | 'uploaded_at'> & { id?: string; uploaded_at?: string }
        Update: Partial<Omit<JobPhoto, 'id' | 'shop_id' | 'job_id'>>
        Relationships: []
      }
      job_number_seq: {
        Row: JobNumberSeq
        Insert: JobNumberSeq
        Update: Partial<JobNumberSeq>
        Relationships: []
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'paid_at'> & { id?: string; paid_at?: string }
        Update: Partial<Omit<Payment, 'id' | 'shop_id' | 'job_id'>>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'sent_at'> & { id?: string; sent_at?: string }
        Update: Partial<Omit<Notification, 'id' | 'shop_id'>>
        Relationships: []
      }
      waitlist: {
        Row: WaitlistEntry
        Insert: Omit<WaitlistEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<WaitlistEntry, 'id' | 'shop_id'>>
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
