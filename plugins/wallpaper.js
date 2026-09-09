const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "rw2",
  alias: ["randomwall2", "wallpaper2"],
  react: "🌌",
  desc: "Download random wallpapers based on keywords.",
  category: "wallpapers",
  use: ".rw2 <keyword>",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const query = args.join(" ") || "random";
    const apiUrl = `https://lance-frank-asta.onrender.com/api/wallpaperV2?text=${encodeURIComponent(query)}`;

    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result || data.result.length === 0) {
      return reply(`❌ No wallpapers found for *"${query}"*.`);
    }

    // Pick a random wallpaper from the array
    const randomWall = data.result[Math.floor(Math.random() * data.result.length)];

    const caption = `🌌 *Wallpaper for:* ${query}\n🖼️ *Type:* ${randomWall.type || "Unknown"}\n\n> *© Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

    await conn.sendMessage(
      from,
      {
        image: { url: randomWall.image },
        caption
      },
      { quoted: m }
    );

  } catch (error) {
    console.error("Wallpaper Error:", error);
    reply("❌ An error occurred while fetching the wallpaper. Please try again later.");
  }
});
