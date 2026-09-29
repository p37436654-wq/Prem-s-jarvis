export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured."
    });
  }

  try {
    const { messages = [] } = req.body || {};

    const safeMessages = Array.isArray(messages)
      ? messages
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-16)
      : [];

    const contents = safeMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: m.content
        }
      ]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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

Be intelligent, helpful, practical, friendly,
and clear when explaining difficult topics.

You can help with:
- studying
- coding
- mathematics
- planning
- brainstorming
- AI projects
- productivity
- general questions

Never claim you can control a device,
access private information, or perform an action
unless an actual tool provides that capability.
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

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    return res.status(200).json({
      reply: reply || "I did not receive a response."
    });

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
