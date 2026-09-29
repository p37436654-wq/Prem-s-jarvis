export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured in Vercel."
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

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",

          messages: [
            {
              role: "system",

              content: `
You are CHIKKY, Boss's intelligent personal AI assistant.

Call the user "Boss" naturally.

Be:
- intelligent
- helpful
- practical
- friendly
- concise when possible
- clear when explaining difficult topics

You can help with:
- studying
- coding
- mathematics
- planning
- brainstorming
- AI projects
- general questions
- productivity

Never claim that you can control a device,
access private information, or perform an action
unless an actual tool provides that capability.

If you do not have access to current information,
say that you cannot verify it live.
`
            },

            ...safeMessages
          ],

          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "AI request failed"
      });
    }

    return res.status(200).json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "I did not receive a response."
    });

  } catch (error) {

    return res.status(500).json({
      error: error?.message || "Server error"
    });

  }
            }
