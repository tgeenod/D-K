const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "webinfo",
    alias: ["siteinfo", "web"],
    desc: "Get website info using GTech API",
    category: "tools",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const url = args[0];
        if (!url) return reply('⚠️ Please provide a website URL.\n\nExample: *.webinfo https://example.com*');

        const apiKey = 'APIKEY'; // Replace with your actual API key
        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/web/info?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

        const { data } = await axios.get(apiUrl);

        if (!data || data.status !== "success" || !data.data) {
            return reply('❌ Website info failed.');
        }

        const info = data.data;

        const caption = `╭─❰ 🌐 𝗪𝗲𝗯𝘀𝗶𝘁𝗲 𝗜𝗻𝗳𝗼 ❱──➤
┃ 🏷️ *Title:* ${info.title || 'N/A'}
┃ 📃 *Description:* ${info.description || 'N/A'}
┃ 🏢 *Publisher:* ${info.publisher || 'N/A'}
┃ 🗓️ *Date:* ${info.date || 'N/A'}
┃ 🖼️ *Image Size:* ${info.image?.size_pretty || 'N/A'}
┃ 🌍 *URL:* ${info.url || url}
╰──────────────➤`;

        // Fixed image thumbnail
        const fixedImageUrl = 'https://files.catbox.moe/a757v6.jpg';
        const response = await axios.get(fixedImageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption
        }, { quoted: m });

    } catch (e) {
        console.error("Error in webinfo command:", e);
        reply(`🚨 *An error occurred:* ${e.message}`);
    }
});
