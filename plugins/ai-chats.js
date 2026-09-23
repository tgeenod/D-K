const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

async function getAIResponse(userInput) {
    try {
        const prompt = `Strictly respond in 100% Sinhala language only. User message: ${userInput}`;
        const apiUrl = `https://api-abztech.zone.id/ai/gemini?message=${encodeURIComponent(prompt)}`;
        
        const response = await axios.get(apiUrl);

        if (response.data && response.data.status && response.data.data && response.data.data.answer) {
            return response.data.data.answer;
        }
        return null;
    } catch (e) {
        console.error("AI API Error:", e);
        return null;
    }
}

cmd({
    pattern: "gemini",
    react: "🤖",
    desc: "Talk to AI in Sinhala",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const text = args.join(" ");
        if (!text) return reply("කරුණාකර ප්‍රශ්නයක් අසන්න.");

        const result = await getAIResponse(text);

        if (result) {
            await reply(result);
        } else {
            await reply("❌ සමාවන්න, පිළිතුරක් ලබා ගැනීමට නොහැකි විය.");
        }
    } catch (e) {
        console.error(e);
        reply("❌ දෝෂයක් සිදු විය.");
    }
});

cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  isCmd,
  reply
}) => {
  try {
    if (m.fromMe || !body || isCmd) return;

    if (config.CHAT_BOT === "true") {
      const aiResult = await getAIResponse(body);

      if (aiResult) {
        await conn.sendMessage(from, { react: { text: "🤖", key: m.key } });
        await conn.sendMessage(from, { text: aiResult }, { quoted: m });
      }
    }
  } catch (error) {
    console.error("Chatbot Error:", error);
  }
});
