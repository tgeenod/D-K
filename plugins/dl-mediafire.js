const axios = require("axios");
const { cmd } = require("../command");
const mime = require("mime-types");

cmd({
  pattern: "mediafire2",
  alias: ["mfire2"],
  react: '📂',
  desc: "Download files from MediaFire using Sadiya-Tech API.",
  category: "download",
  use: ".mediafire <MediaFire URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args, q }) => {
  try {
    if (!q) {
      return reply('⚠️ Please provide a MediaFire URL.\n\nExample:\n`.mediafire https://www.mediafire.com/file/...`');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://www.ominisave.store/api/mfire?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result || !data.result.download) {
      return reply('❌ Unable to fetch the file. Please try again later or check the URL.');
    }

    const { fileName, uploaded, fileType, size, download } = data.result;

    // --- Mimetype සොයන ක්‍රමය (Name + Link Headers) ---
    let determinedMime = mime.lookup(fileName);
    if (!determinedMime) {
      try {
        const headRes = await axios.head(download);
        determinedMime = headRes.headers['content-type'];
      } catch (e) {
        determinedMime = fileType || "application/octet-stream";
      }
    }

    await reply(`📥 *Downloading:* ${fileName}\n*Size:* ${size}\nPlease wait...`);

    await conn.sendMessage(from, {
      document: { url: download },
      mimetype: determinedMime || "application/octet-stream",
      fileName: fileName,
      caption: `📂 *File Name:* ${fileName}\n📦 *Size:* ${size}\n📅 *Uploaded:* ${uploaded}\n\n*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400240662312@newsletter',
          newsletterName: '『 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 』',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error('Error downloading file:', error);
    reply('❌ Error downloading the file. Please check the link or try again later.');
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});


cmd({
  pattern: "mediafire",
  alias: ["mfire"],
  desc: "To download MediaFire files.",
  react: "📂",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid MediaFire link.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const response = await axios.get(`https://vajira-api.vercel.app/download/mfire?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result || !data.result.dl_link) {
      return reply("⚠️ Failed to fetch MediaFire download link. Ensure the link is valid and public.");
    }

    const { dl_link, fileName, fileType, size } = data.result;
    const file_name = fileName || "mediafire_download";
    
    // --- Mimetype සොයන ක්‍රමය (Name + Link Headers) ---
    let determinedMime = mime.lookup(file_name);
    if (!determinedMime) {
      try {
        const headRes = await axios.head(dl_link);
        determinedMime = headRes.headers['content-type'];
      } catch (e) {
        determinedMime = fileType || "application/octet-stream";
      }
    }

    await conn.sendMessage(from, {
      react: { text: "⬆️", key: m.key }
    });

    const caption = `*MEDIAFIRE DOWNLOADER*\n\n`
      + `┃▸ *File Name:* ${file_name}\n`
      + `┃▸ *File Type:* ${determinedMime}\n`
      + `┃▸ *File Size:* ${size || 'Unknown'}\n\n`
      + `*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

    await conn.sendMessage(from, {
      document: { url: dl_link },
      mimetype: determinedMime || "application/octet-stream",
      fileName: file_name,
      caption: caption
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});
