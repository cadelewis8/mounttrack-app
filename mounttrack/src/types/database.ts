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
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    Views: {}
    // eslint-disable-next-line @typescript-eslint/ban-types
    Functions: {}
  }
}
