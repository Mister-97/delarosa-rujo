import { GoogleGenerativeAI } from '@google/generative-ai'
import { SUMMARY_PROMPT } from './ai-prompts'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

type MessageRow = {
  direction: 'inbound' | 'outbound'
  body: string
}

type SummaryResult = {
  summary: string
  lead_type: string
  urgency: number
  extracted_data: Record<string, unknown>
}

export async function generateReply(
  history: MessageRow[],
  systemPrompt: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    // Map message history to Gemini roles
    const contents = history.map((msg) => ({
      role: msg.direction === 'inbound' ? 'user' : 'model',
      parts: [{ text: msg.body }],
    }))

    // Gemini requires conversation to end on a user turn
    // Pass all but the last message as history, send last as new message
    const chatHistory = contents.slice(0, -1)
    const lastMessage = contents[contents.length - 1].parts[0].text

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(lastMessage)
    return result.response.text().trim()
  } catch (err) {
    console.error('Gemini generateReply error:', err)
    // Fallback so the conversation doesn't go silent
    return "Thanks for reaching out! One of our team members will be in touch with you shortly."
  }
}

export async function generateSummary(
  history: MessageRow[],
  businessName: string
): Promise<SummaryResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const transcript = history
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
    .join('\n')

  const prompt = SUMMARY_PROMPT(transcript, businessName)

  const tryParse = async (promptText: string): Promise<SummaryResult | null> => {
    try {
      const result = await model.generateContent(promptText)
      const text = result.response.text().trim()
      // Strip markdown code fences if present
      const clean = text.replace(/^```json\n?|\n?```$/g, '').trim()
      return JSON.parse(clean)
    } catch {
      return null
    }
  }

  // First attempt
  let summary = await tryParse(prompt)

  // Retry with stricter instruction
  if (!summary) {
    const strictPrompt = prompt + '\n\nIMPORTANT: Your response must be valid JSON only. No other text.'
    summary = await tryParse(strictPrompt)
  }

  // Final fallback
  if (!summary) {
    return {
      summary: 'Unable to generate summary. Please review the conversation manually.',
      lead_type: 'general',
      urgency: 3,
      extracted_data: {},
    }
  }

  return summary
}
