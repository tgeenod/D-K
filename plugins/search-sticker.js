const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "searchsti",
    alias: ["stickers"],
    react: "🦋",
    desc: "Search and download stickers using Vajira API",
    category: "download",
    use: ".searchsti <keywords>",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("🦋 Please provide a search query\nExample: .searchsti cat");
        }

        await reply(`🔍 Searching Stickers for *"${query}"*...`);

        const api = `https://vajira-api.vercel.app/search/sticker?q=${encodeURIComponent(query)}`;
        const response = await axios.get(api);

        if (!response.data?.status || !response.data.result?.sticker_url?.length) {
            return reply("❌ No stickers found. Try different keywords.");
        }

        let stickers = response.data.result.sticker_url;

        // ⭐ Remove query parameters & keep only ".webp" part
        stickers = stickers.map(url => url.split(".webp")[0] + ".webp");

        // ⭐ Only .webp stickers
        const webpOnly = stickers.filter(url => url.endsWith(".webp"));

        if (!webpOnly.length) {
            return reply("❌ No valid .webp stickers found.");
        }

        await reply(
            `📦 Valid Webp Stickers: *${webpOnly.length}*\n` +
            `🧚 Sending top 10...`
        );

        const selected = webpOnly
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);

        for (const url of selected) {
            try {
                await conn.sendMessage(
                    from,
                    {
                        sticker: { url }
                    },
                    { quoted: mek }
                );
            } catch (err) {
                console.warn("⚠️ Failed to send sticker:", url);
            }

            await new Promise(res => setTimeout(res, 800));
        }

    } catch (error) {
        console.error("Sticker Error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
