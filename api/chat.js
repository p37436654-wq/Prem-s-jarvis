export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Check Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  try {
    const { messages = [] } = req.body || {};

    // Keep only safe user/assistant messages
    const safeMessages = Array.isArray(messages)
      ? messages
          .filter(
            (message) =>
              message &&
              (message.role === "user" ||
                message.role === "assistant") &&
              typeof message.content === "string"
          )
          .slice(-16)
      : [];

    // Convert OpenAI-style messages to Gemini format
    const contents = safeMessages.map((message) => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: message.content
        }
      ]
    }));

    // Gemini API request
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `
You are CHIKKY, Boss's intelligent personal AI assistant.

Call the user "Boss" naturally.

Your personality:
- intelligent
- friendly
- practical
- helpful
- clear
- concise when possible

You can help with:
- studying
- mathematics
- coding
- programming
- AI projects
- planning
- brainstorming
- productivity
- general questions
- explaining difficult topics

When explaining something difficult,
break it into simple steps.

Never claim that you can:
- control a device
- access private information
- access someone's accounts
- perform an action in the real world

unless an actual tool provides that capability.

If you don't have access to current information,
say that you cannot verify it live.

Always try to give the user a useful answer.
`
              }
            ]
          },

          contents: contents,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const data = await response.json();

    // Gemini API error
    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.
