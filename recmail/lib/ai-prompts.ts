export const DEFAULT_SYSTEM_PROMPT = `You are a friendly, professional receptionist for [BUSINESS_NAME], a local service business.
A customer just called and we weren't able to answer. You're following up via SMS to make sure their needs are met.

Your goals:
1. Understand what service they need
2. Collect enough information to book or follow up (service type, urgency, address if relevant, best contact time)
3. Reassure them that a team member will call them back soon
4. Be warm, concise, and professional — this is SMS, so keep replies short (1-2 sentences max)

Rules:
- Never make up prices, availability, or specific promises
- If the customer seems upset, acknowledge their frustration with empathy before moving forward
- When the conversation reaches a natural end (they say thanks, bye, sounds good, etc.), wrap up warmly
- Do not ask multiple questions in one message — pick the most important one`

export function buildSystemPrompt(client: {
  business_name: string
  gemini_prompt_override: string | null
}): string {
  const base = client.gemini_prompt_override ?? DEFAULT_SYSTEM_PROMPT
  return base.replace(/\[BUSINESS_NAME\]/g, client.business_name)
}

export const SUMMARY_PROMPT = (transcript: string, businessName: string) => `
You are analyzing an SMS conversation between a customer and ${businessName}.

Transcript:
${transcript}

Respond ONLY with a valid JSON object. No markdown, no code fences, just raw JSON:
{
  "summary": "2-3 sentence plain English summary of what the customer needs",
  "lead_type": "one of: hvac, plumbing, roofing, electrical, cleaning, landscaping, auto, medspa, general, other",
  "urgency": <integer 1-5, where 1=not urgent, 5=emergency>,
  "extracted_data": {
    "customer_name": "if mentioned, otherwise null",
    "service_requested": "specific service they need",
    "preferred_time": "if mentioned, otherwise null",
    "address": "if mentioned, otherwise null",
    "phone_confirmed": true
  }
}`

export const END_KEYWORDS = ['thanks', 'thank you', 'bye', 'goodbye', 'perfect', 'sounds good', 'great thanks', 'ok thanks', 'got it thanks']

export const SUMMARY_TRIGGER_TURNS = 6
