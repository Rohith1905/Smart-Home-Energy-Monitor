const axios = require('axios');

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.0-flash"; // Use the correct model name
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 500 },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Extract AI response
    let aiResponse =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Could not generate a response.';

    aiResponse = aiResponse.replace(/\*\*/g, "").replace(/\*/g, "• ");
    
    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    res.status(500).json({
      response: 'Failed to get AI response. Please try again later.',
    });
  }
};
