export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
  try {
    const { messages = [] } = req.body || {};
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', messages:[
        {role:'system',content:"You are PREM'S JARVIS, a helpful futuristic personal AI assistant. Call the user Boss naturally. Be concise, practical and friendly. Never claim to control a device or access private data unless a tool actually provides it."}, ...messages.slice(-12)
      ], temperature:0.7})
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({error:data?.error?.message || 'AI request failed'});
    res.json({ reply:data.choices?.[0]?.message?.content || 'I did not get a response.' });
  } catch (e) { res.status(500).json({error:e.message || 'Server error'}); }
}
