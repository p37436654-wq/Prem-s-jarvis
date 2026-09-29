export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in Vercel."
    });
  }

  try {
    const { messages = [] } = req.body || {};

    const safeMessages = Array.isArray(messages)
      ? messages
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-16)
      : [];

    const input = safeMessages.map((m) => ({
      type: m.role === "assistant"
        ? "model_output"
        : "user_input",
      content: [
        {
          type: "text",
          text: m.content
        }
      ]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          model: "gemini-3.8-flash",

          system_instruction:
            "You are CHIKKY, Boss's personal AI assistant. " +
            "Call the user Boss naturally. " +
            "Be intelligent, friendly, practical and clear. " +
            "Help with studying, mathematics, coding, AI projects, " +
            "planning, brainstorming and general questions. " +
            "Never claim to perform actions you cannot actually perform.",

          input: input,

          generation_config: {
            max_output_tokens: 1000,
            thinking_level: "low"
          },

          store: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed."
      });
    }

    const steps = data?.steps || [];

    const modelStep = [...steps]
      .reverse()
      .find(
        (step) =>
          step.type === "model_output"
      );

    const reply =
      modelStep?.content
        ?.filter((part) => part.type === "text")
        ?.map((part) => part.text || "")
        ?.join("")
        ?.trim();

    if (!reply) {
      return res.status(500).json({
        error: "Gemini returned no text."
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
