export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY is missing in Vercel."
    });
  }

  try {
    const { messages = [] } = req.body || {};

    const safeMessages = Array.isArray(messages)
      ? messages
          .filter(
            (m) =>
              m &&
              (m.role === "user" ||
                m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-16)
      : [];

    const groqMessages = [
      {
        role: "system",
        content: `
You are CHIKKY, Boss's intelligent personal AI assistant.

Call the user "Boss" naturally.

Be:
- intelligent
- friendly
- practical
- clear
- helpful
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

Explain difficult topics step by step.

Never claim that you can control devices,
access private information, or perform actions
unless an actual tool provides that capability.

If you cannot verify current information,
say so clearly.
`
      },
      ...safeMessages
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: groqMessages,
          temperature: 0.7,
          max_completion_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Groq API request failed."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({
        error: "Groq returned an empty response."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("CHIKKY ERROR:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Server error"
    });
  }
}
