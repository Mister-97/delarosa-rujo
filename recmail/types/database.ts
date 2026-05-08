export type Client = {
  id: string
  business_name: string
  twilio_number: string
  twilio_account_sid: string | null
  gemini_prompt_override: string | null
  plan: 'starter' | 'growth' | 'pro'
  owner_id: string | null
  created_at: string
}

export type User = {
  id: string
  client_id: string | null
  email: string
  role: 'owner' | 'admin' | 'staff'
  full_name: string | null
  created_at: string
}

export type Conversation = {
  id: string
  client_id: string
  customer_phone: string
  customer_name: string | null
  status: 'open' | 'closed' | 'qualified'
  turn_count: number
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string
  twilio_sid: string | null
  created_at: string
}

export type Summary = {
  id: string
  conversation_id: string
  summary_text: string
  lead_type: string | null
  urgency: number | null
  extracted_data: Record<string, unknown>
  created_at: string
}

export type ConversationWithLastMessage = Conversation & {
  last_message?: string
  last_message_at?: string
}
