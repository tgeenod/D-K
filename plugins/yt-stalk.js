const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require("axios");

cmd({
  pattern: "ytstalk",
  alias: ["youtubestalk", "ytsearch"],
  desc: "Get information about a YouTube channel, including their profile picture, stats, and latest videos.",
  category: "other",
  use: ".ytstalk <username>",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const username = args.join(" ");
    if (!username) {
      return reply("❌ Please provide a YouTube username. Example: `.ytstalk tech`");
    }

    // Fetch YouTube channel information from the API
    const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`);
    const { status, data } = response.data;

    if (!status || !data) {
      return reply("❌ No information found for the specified YouTube channel. Please try again.");
    }

    const {
      channel: {
        username: ytUsername,
        subscriberCount,
        videoCount,
        avatarUrl,
        channelUrl,
        description,
      },
      latest_videos,
    } = data;

    // Format the YouTube channel information message
    const ytMessage = `
📺 *YouTube Channel*: ${ytUsername}
👥 *Subscribers*: ${subscriberCount}
🎥 *Total Videos*: ${videoCount}
📝 *Description*: ${description || "N/A"}
🔗 *Channel URL*: ${channelUrl}

🎬 *Latest Videos*:
${latest_videos.slice(0, 3).map((video, index) => `
${index + 1}. *${video.title}*
   ▶️ *Views*: ${video.viewCount}
   ⏱️ *Duration*: ${video.duration}
   📅 *Published*: ${video.publishedTime}
   🔗 *Video URL*: ${video.videoUrl}
`).join("\n")}
    `;

    // Send the YouTube channel information message with the profile picture as an image attachment
    await conn.sendMessage(from, {
      image: { url: avatarUrl }, // Attach the profile picture
      caption: ytMessage, // Add the formatted message as caption
    });
  } catch (error) {
    console.error("Error fetching YouTube channel information:", error);
    reply("❌ Unable to fetch YouTube channel information. Please try again later.");
  }
});


cmd({
  pattern: "ytstalk2",
  alias: ["ytinfo2"],
  desc: "Get details about a YouTube channel.",
  react: "🔍",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid YouTube channel username or ID.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://delirius-apiofc.vercel.app/tools/ytstalk?channel=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.data) {
      return reply("⚠️ Failed to fetch YouTube channel details. Ensure the username or ID is correct.");
    }

    const yt = data.data;
    const caption = `╭━━━〔 *YOUTUBE STALKER* 〕━━━⊷\n`
      + `┃👤 *Username:* ${yt.username}\n`
      + `┃📊 *Subscribers:* ${yt.subscriber_count}\n`
      + `┃🎥 *Videos:* ${yt.video_count}\n`
      + `┃🔗 *Channel Link:* (${yt.channel})\n`
      + `╰━━━⪼\n\n`
      + `🔹 *Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

    await conn.sendMessage(from, {
      image: { url: yt.avatar },
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});
