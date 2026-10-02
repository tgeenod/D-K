const axios = require('axios');
const { cmd, commands } = require('../command');
const fetch = require('node-fetch');
const { File } = require('megajs');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const NodeCache = require('node-cache');
const { fetchJson } = require('../lib/functions');
const yts = require('yt-search');

cmd({
  pattern: "pixeldrain",
  alias: ["pix"],
  react: "🌐",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a PixelDrain link.");

    await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

    const apiUrl = `https://api-dark-shan-yt.koyeb.app/download/pixeldrain?url=${encodeURIComponent(q)}&apikey=65d6c884d8624c72`;

    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.data || !data.data.success) {
      return reply("⚠️ Invalid PixelDrain link or API error.");
    }

    const file = data.data;

    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    await conn.sendMessage(from, {
      document: { url: file.download },
      fileName: file.filename || "pixeldrain_file.mp4",
      mimetype: "application/octet-stream",
      caption:
        `📁 *File:* ${file.filename}\n` +
        `📦 *Size:* ${file.size}\n\n` +
        `*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("PixelDrain Error:", e);
    reply("❌ Failed to download PixelDrain file.");
  }
});

cmd({
    pattern: "searchsti",
    alias: ["stickers"],
    react: "🦋",
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

        stickers = stickers.map(url => url.split(".webp")[0] + ".webp");

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

cmd({
  pattern: 'gitclone',
  alias: ["git"],
  react: '📦',
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  args,
  reply
}) => {
  if (!args[0]) {
    return reply("❌ Where is the GitHub link?\n\nExample:\n.gitclone https://github.com/username/repository");
  }

  if (!/^(https:\/\/)?github\.com\/.+/.test(args[0])) {
    return reply("⚠️ Invalid GitHub link. Please provide a valid GitHub repository URL.");
  }

  try {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
    const match = args[0].match(regex);

    if (!match) {
      throw new Error("Invalid GitHub URL.");
    }

    const [, username, repo] = match;
    const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

    const response = await fetch(zipUrl, { method: "HEAD" });
    if (!response.ok) {
      throw new Error("Repository not found.");
    }

    const contentDisposition = response.headers.get("content-disposition");
    const fileName = contentDisposition ? contentDisposition.match(/filename=(.*)/)[1] : `${repo}.zip`;

    reply(`📥 *Downloading repository...*\n\n*Repository:* ${username}/${repo}\n*Filename:* ${fileName}\n\n> *Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`);

    await conn.sendMessage(from, {
      document: { url: zipUrl },
      fileName: fileName,
      mimetype: 'application/zip',
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400240662312@newsletter',
          newsletterName: '𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳',
          serverMessageId: 143
        }
      }
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ Failed to download the repository. Please try again later.");
  }
});

cmd({
    pattern: "ringtone",
    react: "🎵",
    category: "download",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("Please provide a search query! Example: .ringtone Suna");
        }

        const { data } = await axios.get(`https://www.movanest.xyz/v2/ringtone?title=${encodeURIComponent(query)}`);

        if (!data.status || !data.results || data.results.length === 0) {
            return reply("No ringtones found for your query. Please try a different keyword.");
        }

        const randomRingtone = data.results[Math.floor(Math.random() * data.results.length)];

        await conn.sendMessage(
            from,
            {
                audio: { url: randomRingtone.audio },
                mimetype: "audio/mpeg",
                fileName: `${randomRingtone.title}.mp3`,
            },
            { quoted: m }
        );
    } catch (error) {
        console.error("Error in ringtone command:", error);
        reply("Sorry, something went wrong while fetching the ringtone. Please try again later.");
    }
});

cmd({
    pattern: "ring2",
    react: "🎧",
    category: "download",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("Please provide a search term!\nExample: *.ringtone Boy*");
        }

        const { data } = await axios.get(`https://lance-frank-asta.onrender.com/api/ringtone?title=${encodeURIComponent(query)}`);

        if (!data.status || !data.results || data.results.length === 0) {
            return reply("❌ No ringtones found. Try a different keyword!");
        }

        const randomTone = data.results[Math.floor(Math.random() * data.results.length)];

        await conn.sendMessage(
            from,
            {
                audio: { url: randomTone.audio },
                mimetype: "audio/mpeg",
                fileName: `${randomTone.title || "ringtone"}.mp3`,
                caption: `🎶 *Title:* ${randomTone.title}\n🔗 [Source](${randomTone.source})`
            },
            { quoted: m }
        );

    } catch (error) {
        console.error("Error in ringtone command:", error);
        reply("⚠️ Oops! Something went wrong while fetching the ringtone. Try again later.");
    }
});

cmd({
  pattern: "pastpaper",
  alias: ["pastp"],
  category: "download",
  react: "🗂️",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return conn.sendMessage(from, {
      text: "❗ Use: .papers <paper name>"
    }, { quoted: mek });
  }

  try {

    const searchUrl = `https://api-pass.vercel.app/api/search?query=${encodeURIComponent(q)}`;
    const res = await axios.get(searchUrl);
    const data = res.data;

    if (!data.results || data.results.length === 0) {
      return conn.sendMessage(from, { text: "❌ No papers found." }, { quoted: mek });
    }

    const list = data.results.map((v, i) => ({
      id: i + 1,
      title: v.title,
      url: v.url,
      thumb: v.thumbnail,
    }));

    let text = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜𝑤 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━\n\n";
    list.forEach(p => {
      text += `📘 *${p.id}. ${p.title}*\n\n`;
    });

    const listMsg = await conn.sendMessage(from, {
      text: `🔍 𝐏𝐀𝐒𝐓 𝐏𝐀𝐏𝐄𝐑𝐒 𝐒𝐄𝐀𝐑𝐂𝐇 🗂️\n\n${text}`
    }, { quoted: mek });

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const reply = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (repliedId !== listMsg.key.id) return;

      const num = parseInt(reply);
      const selected = list.find(x => x.id === num);
      if (!selected) {
        return conn.sendMessage(from, { text: "❌ Invalid number." }, { quoted: msg });
      }

      await conn.sendMessage(from, { react: { text: "📃", key: msg.key } });

      const dUrl = `https://api-pass.vercel.app/api/download?url=${encodeURIComponent(selected.url)}`;
      const dRes = await axios.get(dUrl);
      const d = dRes.data;

      const info =
        `📑 *${d.download_info.file_title}*\n\n` +
        `📝 *Examination:* ${d.paper_details.examination}\n` +
        `📖 *Medium:* ${d.paper_details.medium}\n` +
        `📚 *Description:* ${selected.desc}\n\n` +
        `⬇️ *Reply with* 1 *to download*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

      const detailMsg = await conn.sendMessage(from, {
        image: { url: selected.thumb },
        caption: info
      }, { quoted: msg });

      const downloadListener = async (up) => {
        const m2 = up.messages?.[0];
        if (!m2?.message?.extendedTextMessage) return;

        const r = m2.message.extendedTextMessage.text.trim();
        const rId = m2.message.extendedTextMessage.contextInfo?.stanzaId;

        if (rId !== detailMsg.key.id) return;

        if (r !== "1") {
          return conn.sendMessage(from, { text: "❌ Invalid option." }, { quoted: m2 });
        }

        await conn.sendMessage(from, { react: { text: "🗃️", key: m2.key } });

        await conn.sendMessage(from, {
          document: { url: d.download_info.download_url },
          mimetype: "application/pdf",
          fileName: d.download_info.file_name,
          caption: `📚 ${d.download_info.file_title}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: m2 });

        conn.ev.off("messages.upsert", downloadListener);
      };

      conn.ev.on("messages.upsert", downloadListener);
      conn.ev.off("messages.upsert", listener);
    };

    conn.ev.on("messages.upsert", listener);

  } catch (e) {
    console.error(e);
    conn.sendMessage(from, {
      text: "⚠️ Error occurred while fetching paper."
    }, { quoted: mek });
  }
});

cmd({
    pattern: "mega",
    alias: ["meganz"],
    react: "🌐",
    category: "download",
    filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Mega.nz link.");

        await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

        const apiUrl = `https://m-api-five.vercel.app/downloader/megadl-v2?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result || !data.result.dllink) {
            return reply("⚠️ Invalid Mega link or API error.");
        }

        const file = data.result;
        const downloadUrl = file.dllink;
        const fileName = file.title || "mega_file.mp4";
        const fileSizeMB = file.filesize || ((file.size / 1024 / 1024).toFixed(2) + " MB");

        let determinedMime = mime.lookup(fileName);
        if (!determinedMime) {
            try {
                const headRes = await axios.head(downloadUrl);
                determinedMime = headRes.headers['content-type'];
            } catch (e) {
                determinedMime = "application/octet-stream";
            }
        }

        await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            fileName: fileName,
            mimetype: determinedMime || "application/octet-stream",
            caption: `📁 *File:* ${fileName}\n📦 *Size:* ${fileSizeMB}\n\n*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Mega API download failed.");
    }
});

cmd({
    pattern: "megadl",
    alias: ["mega2", "meganz2"],
    react: "📦",
    category: "download",
    use: '.megadl <mega file link>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("📦 Please provide a Mega.nz file link.\n\nExample: `.megadl https://mega.nz/file/xxxx#key`");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const file = File.fromURL(q);

        await file.loadAttributes();
        const fileName = file.name || "mega_file.bin";

        const mimeType = mime.lookup(fileName) || 'application/octet-stream';

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const savePath = path.join(os.tmpdir(), fileName);

        fs.writeFileSync(savePath, data);

        await conn.sendMessage(from, {
            document: fs.readFileSync(savePath),
            fileName: fileName,
            mimetype: mimeType,
            caption: `📦 *File Name:* ${fileName}\n\n*Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
        }, { quoted: mek });

        fs.unlinkSync(savePath);

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("❌ MEGA Downloader Error:", error);
        reply("❌ Failed to download file from Mega.nz. Make sure the link is valid and file is accessible.");
    }
});

cmd({
    pattern: "img",
    react: "🖼️",
    category: "download",
    use: ".image <keywords>",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("🖼️ Please provide a search term!\nExample: *.image cute cats*");
        }

        await reply(`🔍 Searching Images for *"${query}"*...`);

        const apiUrl = `https://www.movanest.xyz/v2/googleimage?query=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl);

        if (
            !response.data?.status ||
            !response.data?.results?.images ||
            response.data.results.images.length === 0
        ) {
            return reply("❌ No Images found. Try a different keyword.");
        }

        const images = response.data.results.images.map(img => img.url);

        await reply(`✅ Found *${images.length}* Images for *"${query}"*\n📤 Sending top 5...`);

        const selectedImages = images
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);

        for (const imageUrl of selectedImages) {
            try {
                await conn.sendMessage(
                    from,
                    {
                        image: { url: imageUrl },
                        caption: `🖼️ Image for: *${query}*\n\nRequested by: @${m.sender.split('@')[0]}\n> © Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
                        contextInfo: {
                            mentionedJid: [m.sender]
                        }
                    },
                    { quoted: mek }
                );
            } catch (err) {
                console.log("⚠️ Failed to send image:", err.message);
            }

            await new Promise(res => setTimeout(res, 1000));
        }

    } catch (error) {
        console.error("Image Search Error:", error);
        reply(`❌ Error: ${error.message || "Failed to fetch images"}`);
    }
});

cmd({
    pattern: "image",
    react: "🦋",
    category: "download",
    use: ".img <keywords>",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("🖼️ Please provide a search query\nExample: .img cute cats");
        }

        await reply(`🔍 Searching images for *"${query}"*...`);

        const api = `https://api.deline.web.id/search/pinterest?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(api);

        if (!data?.status || !Array.isArray(data.data) || data.data.length === 0) {
            return reply("❌ No images found. Try different keywords.");
        }

        const images = data.data.map(img => img.image);

        await reply(`✅ Found *${images.length}* results for *"${query}"*\n📤 Sending top 5...`);

        const selectedImages = images
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        for (const imageUrl of selectedImages) {
            try {
                await conn.sendMessage(
                    from,
                    {
                        image: { url: imageUrl },
                        caption: `📷 Result for: *${query}*\n\nRequested by: @${m.sender.split('@')[0]}\n> © Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
                        contextInfo: { mentionedJid: [m.sender] }
                    },
                    { quoted: mek }
                );
            } catch (err) {
                console.warn(`⚠️ Failed to send image: ${imageUrl}`);
            }

            await new Promise(res => setTimeout(res, 1000));
        }

    } catch (error) {
        console.error("Image Search Error:", error);
        reply(`❌ Error: ${error.message || "Failed to fetch images"}`);
    }
});

cmd({
  pattern: "mediafire2",
  alias: ["mfire2"],
  react: '📂',
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

cmd({
  pattern: "tiktok",
  alias: ["tt"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid TikTok URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${q}`);
    const data = response.data;

    if (!data || !data.status) {
      return reply("⚠️ Failed to retrieve TikTok media. Please check the link and try again.");
    }

    const dat = data.data;

    const caption = `
📺 Tiktok Downloader. 📥

📑 *Title:* ${dat.title || "No title"}
⏱️ *Duration:* ${dat.duration || "N/A"}
👍 *Likes:* ${dat.view || "0"}
💬 *Comments:* ${dat.comment || "0"}
🔁 *Shares:* ${dat.share || "0"}
📥 *Downloads:* ${dat.download || "0"}

🔢 *Reply Below Number*

1️⃣  *HD Quality*🔋
2️⃣  *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: dat.thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: dat.video },
              caption: "📥 *Downloaded Original Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              audio: { url: dat.audio },
              mimetype: "audio/mp3",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1 or 2.");
        }
      }
    });

  } catch (error) {
    console.error("TikTok Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "tiktok2",
  alias: ["tt2"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid TikTok URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve TikTok media. Please check the link and try again.");
    }

    const result = data.result;
    const { title, url, thumbnail, duration, metrics } = result;

    const caption = `
📺 Tiktok Downloader. 📥

📑 *Title:* ${title || "No title"}
⏱️ *Duration:* ${duration || "N/A"}s
👍 *Likes:* ${metrics?.digg_count?.toLocaleString() || "0"}
💬 *Comments:* ${metrics?.comment_count?.toLocaleString() || "0"}
🔁 *Shares:* ${metrics?.share_count?.toLocaleString() || "0"}
📥 *Downloads:* ${metrics?.download_count?.toLocaleString() || "0"}

🔢 *Reply Below Number*

1️⃣  *HD Quality*🔋
2️⃣  *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url },
              caption: "📥 *Downloaded Original Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              audio: { url },
              mimetype: "audio/mp4",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1 or 2.");
        }
      }
    });

  } catch (error) {
    console.error("TikTok Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "twitter",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Twitter URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://ty-opal-eta.vercel.app/download/twitter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve Twitter media. Please check the link and try again.");
    }

    const { desc, thumb, video_sd, video_hd, audio } = data.result;

    const caption = `
📺 Twitter Downloader. 📥

📑 *Description:* ${desc || "No description"}
🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣ *SD Quality*🪫
2️⃣ *HD Quality*🔋
3️⃣ *Audio (MP3)*🎶
4️⃣ *Audio*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: video_sd },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: video_hd },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd || video_hd },
              mimetype: "audio/mp4",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          case "4":
            await conn.sendMessage(senderID, {
              audio: { url: audio },
              mimetype: "audio/mp4",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, 3, or 4.");
        }
      }
    });

  } catch (error) {
    console.error("Twitter Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "twitter2",
  alias: ["twitt2"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Twitter URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/twiter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.data) {
      return reply("⚠️ Failed to retrieve Twitter video. Please check the link and try again.");
    }

    const { thumbnail, SD, HD } = data.data;

    const caption = `
📺 Twitter Downloader. 📥

🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣ *SD Quality*🪫
2️⃣ *HD Quality*🔋
3️⃣ *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: SD },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: HD },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: HD || SD },
              mimetype: "audio/mp4",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }
      }
    });

  } catch (error) {
    console.error("Twitter Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "gdrive2",
  react: '📥',
  category: "download",
  use: ".gdrive <Google Drive URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {

    const gdriveUrl = args[0];
    if (!gdriveUrl || !gdriveUrl.includes("drive.google.com")) {
      return reply('Please provide a valid Google Drive URL. Example: `.gdrive https://drive.google.com/...`');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api.nexoracle.com/downloader/gdrive`;
    const params = {
      apikey: 'free_key@maher_apis',
      url: gdriveUrl,
    };

    const response = await axios.get(apiUrl, { params });

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ Unable to fetch the file. Please check the URL and try again.');
    }

    const { downloadUrl, fileName, fileSize, mimetype } = response.data.result;

    await reply(`📥 *Downloading:* ${fileName}\n*Size:* ${fileSize}\n*Please wait...*`);

    const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    if (!fileResponse.data) {
      return reply('❌ Failed to download the file. Please try again later.');
    }

    const fileBuffer = Buffer.from(fileResponse.data, 'binary');

    if (mimetype.startsWith('image')) {

      await conn.sendMessage(from, {
        image: fileBuffer,
        caption: `📥 *ғɪʟᴇ ᴅᴇᴛᴀɪʟs* 📥\n\n` +
          `🔖 *Nᴀᴍᴇ*: ${fileName}\n` +
          `📏 *Sɪᴢᴇ*: ${fileSize}\n\n` +
          `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363400240662312@newsletter',
            newsletterName: '『 ✦𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳✦ 』',
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    } else if (mimetype.startsWith('video')) {

      await conn.sendMessage(from, {
        video: fileBuffer,
        caption: `📥 *ғɪʟᴇ ᴅᴇᴛᴀɪʟs* 📥\n\n` +
          `🔖 *Nᴀᴍᴇ*: ${fileName}\n` +
          `📏 *Sɪᴢᴇ*: ${fileSize}\n\n` +
          `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
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
    } else {

      await conn.sendMessage(from, {
        document: fileBuffer,
        mimetype: mimetype,
        fileName: fileName,
        caption: `📥 *ғɪʟᴇ ᴅᴇᴛᴀɪʟs* 📥\n\n` +
          `🔖 *Nᴀᴍᴇ*: ${fileName}\n` +
          `📏 *Sɪᴢᴇ*: ${fileSize}\n\n` +
          `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
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
    }

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error downloading file:', error);
    reply('❌ Unable to download the file. Please try again later.');

    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});

cmd({
  pattern: "gdrive",
  react: "🌐",
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
      return reply("❌ Please provide a valid Google Drive link.");
    }

    await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

    const apiUrl = `https://dark-knight-reset-apis.vercel.app/api/gdrive?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);

    if (response.data.status && response.data.result) {
      const { downloadUrl, mimeType, fileName } = response.data.result;

      await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

      await conn.sendMessage(from, {
        document: { url: downloadUrl },
        mimetype: mimeType,
        fileName: fileName,
        caption: `${fileName}\n*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
      }, { quoted: m });

      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    } else {
      return reply("⚠️ No download URL found. Please check the link and try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the Google Drive file. Please try again.");
  }
});

cmd({
  pattern: "facebook",
  alias: ["fb"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Facebook video URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data?.status || !data?.data) {
      return reply("⚠️ Failed to retrieve Facebook media. Please check the link and try again.");
    }

    const { title, thumbnail, low, high } = data.data;

    const caption = `
📺 *Facebook Downloader.* 📥

📑 *Title:* ${title || "No title"}
🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣ *SD Quality*🪫
2️⃣ *HD Quality*🔋
3️⃣ *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: low },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: high },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: low || high },
              mimetype: "audio/mp4",
              ptt: false
          }, { quoted: receivedMsg });
          break;

           default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }
      }
    });

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "facebook2",
  alias: ["fb2"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Facebook video URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://apis.davidcyril.name.ng/facebook2?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data?.status || !data?.video) {
      return reply("⚠️ Failed to retrieve Facebook media. Please check the link and try again.");
    }

    const { title, thumbnail, downloads } = data.video;

    const sd = downloads.find(d => d.quality === "SD")?.downloadUrl;
    const hd = downloads.find(d => d.quality === "HD")?.downloadUrl;

    const caption = `
📺 *Facebook Downloader.* 📥

📑 *Title:* ${title || "No title"}
🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣ *SD Quality*🪫
2️⃣ *HD Quality*🔋
3️⃣ *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: sd },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: hd },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: sd || hd},
              mimetype: "audio/mp4",
              ptt: false
          }, { quoted: receivedMsg });
          break;

           default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }
      }
    });

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "instagram",
  alias: ["insta"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Instagram URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.status || !data.data || data.data.length === 0) {
      return reply("⚠️ Failed to retrieve Instagram media. Please check the link and try again.");
    }

    const media = data.data[0];
    const caption = `
📺 Instagram Downloader. 📥

🗂️ *Type:* ${media.type.toUpperCase()}
🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣  *HD Quality*🔋
2️⃣  *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: media.thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            if (media.type === "video") {
              await conn.sendMessage(senderID, {
                video: { url: media.url },
                caption: "📥 *Video Downloaded Successfully!*"
              }, { quoted: receivedMsg });
            } else {
              reply("⚠️ No video found for this post.");
            }
            break;

          case "2":
              await conn.sendMessage(senderID, {
                audio: { url: media.url },
                mimetype: "audio/mp4",
                ptt: false
              }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1 or 2.");
        }
      }
    });

  } catch (error) {
    console.error("Instagram Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "igvid",
  alias: ["ig"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return reply("❌ Please provide a valid Instagram URL.");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const api = `https://www.movanest.xyz/v2/instagram?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(api);

    if (!data.status || !data.results) {
      return reply("⚠️ Failed to retrieve Instagram media.");
    }

    const videoUrl = data.results.downloadUrl;
    const thumbUrl = data.results.posterUrl;

    const caption = `
📺 Instagram Downloader. 📥

🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣  *HD Quality*🔋
2️⃣  *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbUrl },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
              await conn.sendMessage(senderID, {
                video: { url: videoUrl },
                caption: "📥 *Video Downloaded Successfully!*"
              }, { quoted: receivedMsg });
            break;

          case "2":
              await conn.sendMessage(senderID, {
                audio: { url: videoUrl },
                mimetype: "audio/mp4",
                ptt: false
              }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1 or 2.");
        }
      }
    });

  } catch (error) {
    console.error("Instagram Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
  pattern: "igdl",
  alias: ["ig2"],
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Instagram URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const response = await axios.get(`https://apis.davidcyril.name.ng/instagram?url=${q}`);
    const data = response.data;

    if (!data || !data.success || !data.result) {
      return reply("⚠️ Failed to retrieve Instagram media. Please check the link and try again.");
    }

    const { video, mp3, thumbnail } = data.result;

    const caption = `
📺 Instagram Downloader. 📥

🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣  *HD Quality*🔋
2️⃣  *Audio (MP3)*🎶

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: video },
              caption: "📥 *Video Downloaded Successfully!*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              audio: { url: mp3 },
              mimetype: "audio/mp3",
              ptt: false
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1 or 2.");
        }
      }
    });

  } catch (error) {
    console.error("Instagram Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

const movieCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

cmd({
    pattern: "spotify",
    alias: ["spot"],
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, q }) => {

    if (!q) return await conn.sendMessage(from, { text: "Use: .spotify <song name>" }, { quoted: mek });

    try {
        const cacheKey = `spotify_${q.toLowerCase()}`;
        let data = movieCache.get(cacheKey);

        if (!data) {

            const url = `https://api.nexray.eu.cc/search/spotify?q=${encodeURIComponent(q)}`;
            const res = await axios.get(url);

            data = res.data;
            if (data.status !== true || !data.result?.length) throw new Error("No results found.");
            movieCache.set(cacheKey, data);
        }

        const songList = data.result.map((s, i) => ({
            number: i + 1,
            title: s.title,
            artist: s.artist,
            duration: s.duration,
            image: s.thumbnail,
            url: s.url,
            popularity: s.popularity,
            album: s.album,
            release_date: s.release_date
        }));

        let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜𝑤 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
        songList.forEach(s => {
            textList += `🔸 *${s.number}. ${s.title}*\n`;
        });

        const sentMsg = await conn.sendMessage(from, {
            text: `*🔍 𝐒𝐏𝐎𝐓𝐈𝐅𝐘 𝐌𝐔𝐒𝐈𝐂 𝐒𝐄𝐀𝐑𝐂𝐇 🎧*\n\n${textList}\n💬 Reply with song number to view details.\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
        }, { quoted: mek });

        const spotifyMap = new Map();

        const listener = async (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message?.extendedTextMessage) return;

            const replyText = msg.message.extendedTextMessage.text.trim();
            const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

            if (replyText.toLowerCase() === "done") {
                conn.ev.off("messages.upsert", listener);
                return conn.sendMessage(from, { text: "✅ Cancelled." }, { quoted: msg });
            }

            if (repliedId === sentMsg.key.id) {
                const num = parseInt(replyText);
                const selected = songList.find(s => s.number === num);
                if (!selected) return;

                await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

                let info =
                    `🎧 *Spotify Downloader* 📥\n\n` +
                    `🎵 *Track:* ${selected.title}\n` +
                    `👤 *Artist:* ${selected.artist}\n` +
                    `⏱️ *Duration:* ${selected.duration}\n` +
                    `🌟 *Popularity:* ${selected.popularity}\n` +
                    `💿 *Album:* ${selected.album}\n` +
                    `📅 *Release Date:* ${selected.release_date}\n` +
                    `🔗 *URL:* ${selected.url}\n\n` +
                    `🎥 *𝑺𝒆𝒍𝒆𝒄𝒕 𝑭𝒐𝒓𝒎𝒂𝒕:* 📥\n\n` +
                    `♦️ 1. *Audio* — MP3 Format\n` +
                    `♦️ 2. *Document* — File Format\n` +
                    `♦️ 3. *Voice* — PTT Format\n\n` +
                    `> 🔢 Reply with number to download.`;

                const downloadMsg = await conn.sendMessage(from, {
                    image: { url: selected.image },
                    caption: info
                }, { quoted: msg });

                spotifyMap.set(downloadMsg.key.id, { selected });
            }

            else if (spotifyMap.has(repliedId)) {
                const { selected } = spotifyMap.get(repliedId);
                const num = replyText;

                await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

                const dlUrl = `https://api.nexray.eu.cc/downloader/spotify?url=${encodeURIComponent(selected.url)}`;
                const dlRes = await axios.get(dlUrl);
                const downloadLink = dlRes.data.result.url;

                if (!downloadLink) return;

                if (num === "1") {
                    await conn.sendMessage(from, {
                        audio: { url: downloadLink },
                        mimetype: "audio/mpeg",
                        ptt: false
                    }, { quoted: msg });
                }
                else if (num === "2") {
                    await conn.sendMessage(from, {
                        document: { url: downloadLink },
                        mimetype: "audio/mpeg",
                        fileName: `${selected.title}.mp3`,
                        caption: `\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
                    }, { quoted: msg });
                }
                else if (num === "3") {
                    await conn.sendMessage(from, {
                        audio: { url: downloadLink },
                        mimetype: "audio/mpeg",
                        ptt: true
                    }, { quoted: msg });
                }
            }
        };

        conn.ev.on("messages.upsert", listener);

    } catch (err) {
        await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
    }
});

cmd({
    pattern: "spotify2",
    alias: ["spot2"],
    react: "🎵",
    category: "download",
    use: ".spotify2 <spotify link>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ Please provide a Spotify track link!");

        if (!q.includes("spotify.com/track")) {
            return reply("❌ Invalid Spotify link! Please send a valid Spotify track URL.");
        }

        const api = `https://api-aswin-sparky.koyeb.app/api/downloader/spotify?url=${encodeURIComponent(q)}`;
        const { data: apiRes } = await axios.get(api);

        if (!apiRes?.status || !apiRes.data?.download) {
            return reply("❌ Unable to download this Spotify track. Please try another link!");
        }

        const result = apiRes.data;

        const minutes = Math.floor(result.durasi / 60000);
        const seconds = Math.floor((result.durasi % 60000) / 1000);
        const duration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

        const caption = `
🎧 *Spotify Downloader* 📥

📑 *Title:* ${result.title}
👤 *Artist:* ${result.artis}
⏱️ *Duration:* ${duration}
🎶 *Type:* ${result.type}
🔗 *Link:* ${q}

🔢 *Reply Below Number*

1️⃣ *Audio Type*
2️⃣ *Document Type*
3️⃣ *Voice Note*

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙄𝙶𝙷𝚃-𝚇𝙼𝙳
`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: result.cover },
            caption
        }, { quoted: m });

        const messageID = sentMsg.key.id;

        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToBot) {
                await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

                switch (receivedText.trim()) {
                    case "1":
                        await conn.sendMessage(senderID, {
                            audio: { url: result.download },
                            mimetype: "audio/mpeg",
                            ptt: false,
                        }, { quoted: receivedMsg });
                        break;

                    case "2":
                        await conn.sendMessage(senderID, {
                            document: { url: result.download },
                            mimetype: "audio/mpeg",
                            fileName: `${result.title}.mp3`
                        }, { quoted: receivedMsg });
                        break;

                    case "3":
                        await conn.sendMessage(senderID, {
                            audio: { url: result.download },
                            mimetype: "audio/mpeg",
                            ptt: true,
                        }, { quoted: receivedMsg });
                        break;

                    default:
                        reply("❌ Invalid option! Please reply with 1, 2, or 3.");
                }
            }
        });

    } catch (error) {
        console.error("Spotify Command Error:", error);
        reply("❌ An error occurred while processing your request. Please try again later.");
    }
});

cmd({
    pattern: "pindl",
    alias: ["pinterest"],
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
    try {
        if (args.length < 1) {
            return reply('❎ Please provide a Pinterest URL or keyword to download from.');
        }

        const pinterestUrl = args.join(" ");
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const response = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(pinterestUrl)}`);

        if (!response.data.status || !response.data.data || response.data.data.length === 0) {
            return reply('❎ No results found for that Pinterest URL or keyword.');
        }

        const pins = response.data.data.slice(0, 5);

        for (const pin of pins) {
            const title = pin.grid_title || 'No title available';
            const description = pin.description?.trim() || 'No description available';
            const username = pin.pinner?.full_name || pin.pinner?.username || 'Unknown';
            const board = pin.board?.name || 'No board info';
            const likes = pin.reaction_counts?.["1"] || 0;

            const mediaUrl = pin.video_url || pin.gif_url || pin.image_url;
            const isVideo = Boolean(pin.video_url);

            const caption = `
╭━━━〔 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳* 〕━┈⊷
┃▸╭───────────
┃▸┊๏ *ᴘɪɴᴛᴇʀᴇsᴛ ᴅʟ*
┃▸╰───────────···๏
╰────────────────┈⊷
╭━━┈┈┈┈┈┈┈┈┈━⪼
┇๏ *ᴛɪᴛʟᴇ* - ${title}
┇๏ *ᴍᴇᴅɪᴀ ᴛʏᴘᴇ* - ${mediaUrl}
┇๏ *ᴘɪɴɴᴇʀ* - ${username}
┇๏ *ʙᴏᴀʀᴅ* - ${board}
┇๏ *ʟɪᴋᴇs* - ${likes}
╰━━┈┈┈┈┈┈┈┈┈━⪼
> *© Pᴏᴡᴇʀᴇᴅ Bʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ♡*`;

            if (isVideo) {
                await conn.sendMessage(from, { video: { url: mediaUrl }, caption }, { quoted: mek });
            } else {
                await conn.sendMessage(from, { image: { url: mediaUrl }, caption }, { quoted: mek });
            }

            await new Promise(res => setTimeout(res, 1500));
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ An error occurred while processing your request.');
    }
});

cmd({
    pattern: "pindl1",
    alias: ["pinterest1", "pins"],
    category: "download",
    react: "📌",
    filename: __filename
}, async (conn, mek, m, { args, quoted, from, reply }) => {
    try {

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        if (args.length < 1) {
            await conn.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
            return reply('❎ Please provide the Pinterest URL to download from.');
        }

        const pinterestUrl = args[0];
        const encodedUrl = encodeURIComponent(pinterestUrl);

        const apis = [
            `https://api.gifted.co.ke/api/download/pinterestdl?apikey=gifted&url=${encodedUrl}`,
            `https://api.gifted.co.ke/api/download/pinterestdl?apikey=gifted&url=${encodedUrl}`
        ];

        let response;
        for (const api of apis) {
            try {
                response = await axios.get(api);
                if (response.data && response.data.success) {
                    break;
                }
            } catch (err) {
                console.log(`⚠️ API failed: ${api}`);
            }
        }

        if (!response || !response.data.success) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❎ Failed to fetch data from both Pinterest APIs.');
        }

        const media = response.data.result.media;
        const description = response.data.result.description || 'No description available';
        const title = response.data.result.title || 'No title available';
        const videoUrl = media.find(item => item.type.includes('720p'))?.download_url || media[0].download_url;

        const desc = `╭━━━〔 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *PINS DOWNLOADER*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━❐━⪼
┇๏ *Title* - ${title}
┇๏ *Media Type* - ${media[0].type}
╰━━❑━⪼
> *© Pᴏᴡᴇʀᴇᴅ bʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ♡*`;

        if (videoUrl) {
            await conn.sendMessage(from, { video: { url: videoUrl }, caption: desc }, { quoted: mek });
        } else {
            const imageUrl = media.find(item => item.type === 'Thumbnail')?.download_url;
            await conn.sendMessage(from, { image: { url: imageUrl }, caption: desc }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply('❎ An error occurred while processing your request.');
    }
});

cmd({
    pattern: "pindl2",
    alias: ["pinterest2"],
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
    try {
        if (!args[0]) return reply('❎ Please provide a Pinterest URL.');

        const pinterestUrl = args[0];
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/pin?url=${encodeURIComponent(pinterestUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data) {
            return reply('❎ Failed to fetch data from Pinterest API.');
        }

        const result = data.data;
        const title = result.title?.trim() || "Pinterest Post";
        const description = result.description?.trim() || "No description";
        const mediaArray = result.media_urls;

        if (!mediaArray || mediaArray.length === 0) {
            return reply('❎ No media found in this Pinterest post.');
        }

        const videoMedia = mediaArray.find(m => m.type.toLowerCase() === 'video');
        const imageMedia = mediaArray.find(m => m.type.toLowerCase() === 'image' && m.quality === 'original')
                            || mediaArray.find(m => m.type.toLowerCase() === 'image' && m.quality === 'large')
                            || mediaArray[0];

        let mediaUrl, mediaType, quality;

        if (videoMedia) {
            mediaUrl = videoMedia.url;
            mediaType = 'video';
            quality = videoMedia.quality || 'HD';
        } else if (imageMedia) {
            mediaUrl = imageMedia.url;
            mediaType = 'image';
            quality = imageMedia.quality || 'original';
        } else {
            return reply('❎ Unable to find downloadable media.');
        }

        const caption = `╭━━━〔 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *PINS DOWNLOADER*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━❐━⪼
┇๏ *Title* - ${title}
┇๏ *Type* - ${mediaType}
┇๏ *Quality* - ${quality}
┇๏ *Description* - ${description}
╰━━❑━⪼
> *© Pᴏᴡᴇʀᴇᴅ Bʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ♡*`;

        if (mediaType === 'video') {
            await conn.sendMessage(from, { video: { url: mediaUrl }, caption }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: { url: mediaUrl }, caption }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ An error occurred while downloading the Pinterest media.');
    }
});

const tharuzz_footer = "> Powerd by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳";

cmd(
    {
        pattern: "xvideo",
        use: ".xnxx <xnxx video name>",
        react: "🔞",
        category: "download",
        filename: __filename
    }, async (conn, mek, m, {q, from, reply}) => {

        const react = async (msgKey, emoji) => {
    try {
      await conn.sendMessage(from, {
        react: {
          text: emoji,
          key: msgKey
        }
      });
    } catch (e) {
      console.error("Reaction error:", e.message);
    }
  };
        try {

            if (!q) {
                await reply("Please enter xnxx.com video name.")
            }

            const xnxxSearchapi = await fetchJson(`https://tharuzz-ofc-api-v2.vercel.app/api/search/xvsearch?query=${q}`);

            if (!xnxxSearchapi.result.xvideos) {
                await reply("No result found you enter xnxx video name.")
            }

            let list = "🔍 Xvideo Search Results.🔞\n\n🔢 *Reply Below Number.*\n\n";

            xnxxSearchapi.result.xvideos.forEach((xnxx, i) => {
            list += `*\`${i + 1}\` | | ${xnxx.title || "No title"}*\n`;
          });

          const listMsg = await conn.sendMessage(from, { text: list + "\n🔢 *reply with the number to Choose a video*\n\n" + tharuzz_footer }, { quoted: mek });
          const listMsgId = listMsg.key.id;

          conn.ev.on("messages.upsert", async (update) => {

              const msg = update?.messages?.[0];
              if (!msg?.message) return;

              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
              const isReplyToList = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === listMsgId;
              if (!isReplyToList) return;

              const index = parseInt(text.trim()) - 1;
              if (isNaN(index) || index < 0 || index >= xnxxSearchapi.result.xvideos.length) return reply("❌ *`ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ ᴘʟᴇᴀꜱᴇ ᴇɴᴛᴇʀ ᴠᴀʟɪᴅ  ɴᴜᴍʙᴇʀ.`*");
              await react(msg.key, '⏳');

              const chosen = xnxxSearchapi.result.xvideos[index];

              const xnxxDownloadapi = await fetchJson(`https://tharuzz-ofc-api-v2.vercel.app/api/download/xvdl?url=${chosen.link}`);

              const infoMap = xnxxDownloadapi?.result;
              const downloadUrllow = xnxxDownloadapi?.result?.dl_Links?.lowquality;
              const downloadUrlhigh = xnxxDownloadapi?.result?.dl_Links?.highquality;

              const askType = await conn.sendMessage(
            from,{
                image: {url: infoMap.thumbnail },
                caption: `🔍 *Xnxx Video Info.* 🔞\n\n` +
                `📑 *Title:* ${infoMap.title}\n` +
                `📝 *Description:* ${infoMap.description}\n` +
                `⏰ *Duration:* ${infoMap.duration}\n\n` +
                `🔢 *Reply Below Number:*\n\n` +
                `1️⃣ *Video High Quality*\n` +
                `2️⃣ *Video Low Quality*\n\n` + tharuzz_footer
            }, { quoted:msg }
        );

            const typeMsgId = askType.key.id;

            conn.ev.on("messages.upsert", async (tUpdate) => {

                const tMsg = tUpdate?.messages?.[0];
            if (!tMsg?.message) return;

            const tText = tMsg.message?.conversation || tMsg.message?.extendedTextMessage?.text;
            const isReplyToType = tMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === typeMsgId;
            if (!isReplyToType) return;

            await react(tMsg.key, tText.trim() === "1" ? '🎥' : tText.trim() === "2" ? '🎥' : '❓');

            if (tText.trim() === "1") {
                await conn.sendMessage(
                    from,
                    {
                      video: {url: downloadUrlhigh },
                      caption: `*🔞 High Quality Video.*\n\n> ${infoMap.title}`
                    }, {quoted: tMsg}
                )
            } else if (tText.trim() === "2") {
                await conn.sendMessage(
                    from, {
                        video: {url: downloadUrllow },
                        caption: `*🔞 Low Quality Video.*\n\n> ${infoMap.title}`

                    }, {quoted: tMsg}
                )
            } else {
                await conn.sendMessage(from, { text: "❌ *`ɪɴᴠᴀʟɪᴅᴇ ɪɴᴘᴜᴛ. 1 ꜰᴏʀ ᴠɪᴅᴇᴏ high quality ᴛʏᴘᴇ / 2 ꜰᴏʀ video low quality ᴛʏᴘᴇ`*" }, { quoted: tMsg });
            }
            });
          });
        } catch (e) {
            console.log(e);
            await reply("*❌ Error: " + e + "*")
        }
    }
);

cmd({
        pattern: "xnxx",
        use: ".xvideo <search query>",
        react: "🔞",
        category: "download",
        filename: __filename
    }, async (conn, mek, m, { q, from, reply }) => {

        const react = async (msgKey, emoji) => {
            try {
                await conn.sendMessage(from, {
                    react: {
                        text: emoji,
                        key: msgKey
                    }
                });
            } catch (e) {
                console.error("Reaction error:", e.message);
            }
        };

        try {
            if (!q) return await reply("Please enter a video name to search.");

            const xnxxSearchapi = await fetchJson(`https://supun-x-apis.vercel.app/search/xnxx?q=${q}`);

            if (!xnxxSearchapi.status || !xnxxSearchapi.result || xnxxSearchapi.result.length === 0) {
                return await reply("No results found for your search.");
            }

            let list = "🔍 *Xnxx Search Results* 🔞\n\n🔢 *Reply Below Number.*\n\n";
            xnxxSearchapi.result.forEach((xnxx, i) => {
                list += `*\`${i + 1}\` | | ${xnxx.title || "No title"}*\n`;
            });

            const listMsg = await conn.sendMessage(from, {
                text: list + "\n🔢 *Reply with the number to choose a video.*\n\n" + tharuzz_footer
            }, { quoted: mek });

            const listMsgId = listMsg.key.id;

            conn.ev.on("messages.upsert", async (update) => {
                const msg = update?.messages?.[0];
                if (!msg?.message) return;

                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
                const isReplyToList = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === listMsgId;

                if (!isReplyToList) return;

                const index = parseInt(text.trim()) - 1;
                if (isNaN(index) || index < 0 || index >= xnxxSearchapi.result.length) {
                    return;
                }

                await react(msg.key, '⏳');

                const chosen = xnxxSearchapi.result[index];

                const xnxxDownloadapi = await fetchJson(`https://supun-x-apis.vercel.app/download/xnxx?url=${chosen.link}`);

                if (!xnxxDownloadapi.status || !xnxxDownloadapi.result) {
                    return await reply("Error fetching download links.");
                }

                const infoMap = xnxxDownloadapi.result;
                const downloadUrllow = infoMap.files.low;
                const downloadUrlhigh = infoMap.files.high;

                const askType = await conn.sendMessage(
                    from, {
                        image: { url: infoMap.image },
                        caption: `🔍 *Xnxx Video Info* 🔞\n\n` +
                            `📑 *Title:* ${infoMap.title}\n` +
                            `⏰ *Duration:* ${infoMap.duration} seconds\n` +
                            `ℹ️ *Info:* ${infoMap.info.trim()}\n\n` +
                            `🔢 *Reply Below Number:*\n\n` +
                            `1️⃣ *Video High Quality*\n` +
                            `2️⃣ *Video Low Quality*\n\n` + tharuzz_footer
                    }, { quoted: msg }
                );

                const typeMsgId = askType.key.id;

                conn.ev.on("messages.upsert", async (tUpdate) => {
                    const tMsg = tUpdate?.messages?.[0];
                    if (!tMsg?.message) return;

                    const tText = tMsg.message?.conversation || tMsg.message?.extendedTextMessage?.text;
                    const isReplyToType = tMsg?.message?.extendedTextMessage?.contextInfo?.stanzaId === typeMsgId;

                    if (!isReplyToType) return;

                    if (tText.trim() === "1") {
                        await react(tMsg.key, '🎥');
                        await conn.sendMessage(from, {
                            video: { url: downloadUrlhigh },
                            caption: `*🔞 High Quality Video*\n\n> ${infoMap.title}`
                        }, { quoted: tMsg });
                    } else if (tText.trim() === "2") {
                        await react(tMsg.key, '🎥');
                        await conn.sendMessage(from, {
                            video: { url: downloadUrllow },
                            caption: `*🔞 Low Quality Video*\n\n> ${infoMap.title}`
                        }, { quoted: tMsg });
                    }
                });
            });

        } catch (e) {
            console.error(e);
            await reply("*❌ Error:* " + e.message);
        }
    }
);

cmd({
  pattern: "aptoide",
  alias: ["apk"],
  category: "download",
  react: "📲",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .apk <app name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `aptoide_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {

      const url = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.datalist || !data.datalist.list || !data.datalist.list.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.datalist.list.map((m, i) => ({
      number: i + 1,
      title: m.name,
      link: m.file ? m.file.path : null,
      package: m.package,
      icon: m.icon,
      size: (m.size / (1024 * 1024)).toFixed(2) + " MB",
      developer: m.developer ? m.developer.name : 'N/A',
      added: m.added || 'N/A',
      modified: m.modified || 'N/A',
      updated: m.updated || 'N/A',
      description: m.store && m.store.appearance ? m.store.appearance.description : 'N/A',
      vername: m.file ? m.file.vername : 'N/A',
      downloads: m.stats ? m.stats.downloads.toLocaleString() : '0',
      rating: m.stats && m.stats.prating ? m.stats.prating.avg : 'N/A'
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜𝑤 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with app number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝐀𝐏𝐓𝐎𝐈𝐃𝐄 𝐀𝐏𝐏 𝐒𝐄𝐀𝐑𝐂𝐇 📥*\n\n${textList}\n\n> > Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid app number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        if (!selected.link) {
          return conn.sendMessage(from, { text: "*No download links available.*"}, { quoted: msg });
        }

        const download_links = [
          {
            text: "Direct APK",
            size: selected.size,
            url: selected.link
          }
        ];

        let info =
          `📦 *App Name:* ${selected.title}\n` +
          `🆔 *Package:* ${selected.package}\n` +
          `👨‍💻 *Developer:* ${selected.developer}\n` +
          `ℹ️ *Version:* ${selected.vername}\n` +
          `📥 *Downloads:* ${selected.downloads}\n` +
          `⭐ *Rating:* ${selected.rating}\n` +
          `📅 *Added:* ${selected.added}\n` +
          `🔄 *Modified:* ${selected.modified}\n` +
          `🆙 *Updated:* ${selected.updated}\n` +
          `📝 *Description:* ${selected.description}\n\n` +
          `📥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝓼:* 🚀\n\n`;

        download_links.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.text}* — ${d.size}\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: selected.icon },
          caption: info
        }, { quoted: msg });

        movieMap.set(downloadMsg.key.id, { selected, downloads: download_links });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid quality number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        const direct = chosen.url;

        if (!direct) {
            return conn.sendMessage(from, { text: "*download link not found.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: direct },
          mimetype: "application/vnd.android.package-archive",
          fileName: `${selected.title}.apk`,
          caption: `📦 *${selected.title}*\n📥 *Size:* ${chosen.size}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });

      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "apk2",
  react: '📦',
  category: "download",
  use: ".apk <app name>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {

    const appName = args.join(" ");
    if (!appName) {
      return reply('Please provide an app name. Example: `.apk whatsapp `');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api.nexoracle.com/downloader/apk`;
    const params = {
      apikey: 'free_key@maher_apis',
      q: appName,
    };

    const response = await axios.get(apiUrl, { params });

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ Unable to find the APK. Please try again later.');
    }

    const { name, lastup, package, size, icon, dllink } = response.data.result;

    await conn.sendMessage(from, {
      image: { url: icon },
      caption: `📦 *Downloading ${name}... Please wait.*`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400240662312@newsletter',
          newsletterName: '『『 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 』』',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    const apkResponse = await axios.get(dllink, { responseType: 'arraybuffer' });
    if (!apkResponse.data) {
      return reply('❌ Failed to download the APK. Please try again later.');
    }

    const apkBuffer = Buffer.from(apkResponse.data, 'binary');

    const message = `📦 *ᴀᴘᴋ ᴅᴇᴛᴀɪʟs*📦:\n\n` +
      `🔖 *Nᴀᴍᴇ*: ${name}\n` +
      `📅 *Lᴀsᴛ ᴜᴘᴅᴀᴛᴇ*: ${lastup}\n` +
      `📦 *Pᴀᴄᴋᴀɢᴇ*: ${package}\n` +
      `📏 *Sɪᴢᴇ*: ${size}\n\n` +
      `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 `;

    await conn.sendMessage(from, {
      document: apkBuffer,
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${name}.apk`,
      caption: message,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400240662312@newsletter',
          newsletterName: '『 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 』 ',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error fetching APK details:', error);
    reply('❌ Unable to fetch APK details. Please try again later.');

    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});

cmd({
    pattern: "song",
    react: "🎵",
    category: "download",
    use: ".song <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ What song do you want to download?");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found for your query.");

        const data = search.videos[0];
        const ytUrl = data.url;

        const api = `https://dark-knight-yt-dl-api.vercel.app/download/ytmp3?url=${encodeURIComponent(ytUrl)}`;
        const { data: apiRes } = await axios.get(api);

        if (!apiRes?.status || !apiRes.download?.url) {
            return reply("❌ Unable to download the song. Please try another one!");
        }

        const result = apiRes.download;

        const caption = `
🎵 *Song Downloader.* 📥

📑 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📆 *Uploaded:* ${data.ago}
📊 *Views:* ${data.views}
🔗 *Link:* ${data.url}

🔢 *Reply Below Number*

1️⃣ *Audio Type*
2️⃣ *Document Type*
3️⃣ *Voice Note*

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: data.thumbnail },
            caption
        }, { quoted: m });

        const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
                case "1":
                    await conn.sendMessage(senderID, {
                        audio: { url: result.url },
                        mimetype: "audio/mpeg",
                        ptt: false,
                    }, { quoted: receivedMsg });
                    break;

                case "2":
                    await conn.sendMessage(senderID, {
                        document: { url: result.url },
                        mimetype: "audio/mpeg",
                        fileName: `${data.title}.mp3`
                    }, { quoted: receivedMsg });
                    break;

                case "3":
                    await conn.sendMessage(senderID, {
                        audio: { url: result.url },
                        mimetype: "audio/mpeg",
                        ptt: true,
                    }, { quoted: receivedMsg });
                    break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }
      }
    });

  } catch (error) {
    console.error("Song Command Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
    pattern: "song2",
    react: "🎵",
    category: "download",
    use: ".song <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ What song do you want to download?");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found for your query.");

        const data = search.videos[0];
        const ytUrl = data.url;

        const api = `https://sai-green.vercel.app/manump3?url=${encodeURIComponent(ytUrl)}`;
        const { data: apiRes } = await axios.get(api);

        if (!apiRes?.status || !apiRes.download?.url) {
            return reply("❌ Unable to download the song. Please try another one!");
        }

        const result = apiRes.download;

        const caption = `
🎵 *Song Downloader.* 📥

📑 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📆 *Uploaded:* ${data.ago}
📊 *Views:* ${data.views}
🔗 *Link:* ${data.url}

🔢 *Reply Below Number*

1️⃣ *Audio Type*
2️⃣ *Document Type*
3️⃣ *Voice Note*

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: data.thumbnail },
            caption
        }, { quoted: m });

        const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        switch (receivedText.trim()) {
                case "1":
                    await conn.sendMessage(senderID, {
                        audio: { url: result.url },
                        mimetype: "audio/mpeg",
                        ptt: false,
                    }, { quoted: receivedMsg });
                    break;

                case "2":
                    await conn.sendMessage(senderID, {
                        document: { url: result.url },
                        mimetype: "audio/mpeg",
                        fileName: `${data.title}.mp3`
                    }, { quoted: receivedMsg });
                    break;

                case "3":
                    await conn.sendMessage(senderID, {
                        audio: { url: result.url },
                        mimetype: "audio/mpeg",
                        ptt: true,
                    }, { quoted: receivedMsg });
                    break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }
      }
    });

  } catch (error) {
    console.error("Song Command Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});

cmd({
    pattern: "video",
    react: "🎬",
    category: "download",
    use: ".video <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ What video do you want to download?");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found for your query.");

        const data = search.videos[0];
        const ytUrl = data.url;

        const formats = {
            "144p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=144p`,
            "240p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=240p`,
            "360p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=360p`,
            "480p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=480p`,
            "720p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=720p`,
            "1080p": `https://api-ytdlwsmd-mini.vercel.app/api/download?url=${encodeURIComponent(ytUrl)}&quality=1080p`
        };

        const caption = `
🎥 *Video Downloader.* 📥

📑 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📆 *Uploaded:* ${data.ago}
📊 *Views:* ${data.views}
🔗 *Link:* ${data.url}

🔢 *Reply Below Number*

🎥 *Video Types*
🔹 1.1 144p (Video)
🔹 1.2 240p (Video)
🔹 1.3 360p (Video)
🔹 1.4 480p (Video)
🔹 1.5 720p (Video)
🔹 1.6 1080p (Video)

📁 *Document Types:*
🔹 2.1 144p (Document)
🔹 2.2 240p (Document)
🔹 2.3 360p (Document)
🔹 2.4 480p (Document)
🔹 2.5 720p (Document)
🔹 2.6 1080p (Document)

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
        `;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: data.thumbnail },
            caption
        }, { quoted: m });

        const messageID = sentMsg.key.id;

        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToBot) {
                await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

                let selectedFormat, isDocument = false;

                switch (receivedText.trim().toUpperCase()) {
                    case "1.1": selectedFormat = "144p"; break;
                    case "1.2": selectedFormat = "240p"; break;
                    case "1.3": selectedFormat = "360p"; break;
                    case "1.4": selectedFormat = "480p"; break;
                    case "1.5": selectedFormat = "720p"; break;
                    case "1.6": selectedFormat = "1080p"; break;

                    case "2.1": selectedFormat = "144p"; isDocument = true; break;
                    case "2.2": selectedFormat = "240p"; isDocument = true; break;
                    case "2.3": selectedFormat = "360p"; isDocument = true; break;
                    case "2.4": selectedFormat = "480p"; isDocument = true; break;
                    case "2.5": selectedFormat = "720p"; isDocument = true; break;
                    case "2.6": selectedFormat = "1080p"; isDocument = true; break;

                    default:
                        return reply("❌ Invalid option! Please reply with 1.1-1.6 or 2.1-2.6.");
                }

                const { data: apiRes } = await axios.get(formats[selectedFormat]);

                if (!apiRes?.status || !apiRes.result?.download) {
                    return reply(`❌ Unable to download the ${selectedFormat} version. Try another one!`);
                }

                const downloadUrl = apiRes.result.download;

                if (isDocument) {
                    await conn.sendMessage(senderID, {
                        document: { url: downloadUrl },
                        mimetype: "video/mp4",
                        fileName: `${data.title}.mp4`
                    }, { quoted: receivedMsg });
                } else {
                    await conn.sendMessage(senderID, {
                        video: { url: downloadUrl },
                        mimetype: "video/mp4",
                        ptt: false,
                    }, { quoted: receivedMsg });
                }
            }
        });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply("❌ An error occurred while processing your request. Please try again later.");
    }
});

cmd({
    pattern: "video2",
    react: "🎬",
    category: "download",
    use: ".video <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❓ What video do you want to download?");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ No results found for your query.");

        const data = search.videos[0];
        const ytUrl = data.url;

        const formats = {
            "144p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=144`,
            "240p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=240`,
            "360p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=360`,
            "480p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=480`,
            "720p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=720`,
            "1080p": `https://m-api-five.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}&format=1080`
        };

        const caption = `
🎥 *Video Downloader.* 📥

📑 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📆 *Uploaded:* ${data.ago}
📊 *Views:* ${data.views}
🔗 *Link:* ${data.url}

🔢 *Reply Below Number*

🎥 *Video Types*
🔹 1.1 144p (Video)
🔹 1.2 240p (Video)
🔹 1.3 360p (Video)
🔹 1.4 480p (Video)
🔹 1.5 720p (Video)
🔹 1.6 1080p (Video)

📁 *Document Types:*
🔹 2.1 144p (Document)
🔹 2.2 240p (Document)
🔹 2.3 360p (Document)
🔹 2.4 480p (Document)
🔹 2.5 720p (Document)
🔹 2.6 1080p (Document)

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
        `;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: data.thumbnail },
            caption
        }, { quoted: m });

        const messageID = sentMsg.key.id;

        conn.ev.on("messages.upsert", async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToBot) {
                await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

                let selectedFormat, isDocument = false;

                switch (receivedText.trim().toUpperCase()) {
                    case "1.1": selectedFormat = "144p"; break;
                    case "1.2": selectedFormat = "240p"; break;
                    case "1.3": selectedFormat = "360p"; break;
                    case "1.4": selectedFormat = "480p"; break;
                    case "1.5": selectedFormat = "720p"; break;
                    case "1.6": selectedFormat = "1080p"; break;

                    case "2.1": selectedFormat = "144p"; isDocument = true; break;
                    case "2.2": selectedFormat = "240p"; isDocument = true; break;
                    case "2.3": selectedFormat = "360p"; isDocument = true; break;
                    case "2.4": selectedFormat = "480p"; isDocument = true.break;
                    case "2.5": selectedFormat = "720p"; isDocument = true; break;
                    case "2.6": selectedFormat = "1080p"; isDocument = true; break;

                    default:
                        return reply("❌ Invalid option! Please reply with 1.1-1.6 or 2.1-2.6.");
                }

                const { data: apiRes } = await axios.get(formats[selectedFormat]);

                if (!apiRes?.status || !apiRes.result?.download?.url) {
                    return reply(`❌ Unable to download the ${selectedFormat} version. Try another one!`);
                }

                const downloadData = apiRes.result.download;
                const downloadUrl = downloadData.url;

                if (isDocument) {
                    await conn.sendMessage(senderID, {
                        document: { url: downloadUrl },
                        mimetype: "video/mp4",
                        fileName: `${data.title}.mp4`
                    }, { quoted: receivedMsg });
                } else {
                    await conn.sendMessage(senderID, {
                        video: { url: downloadUrl },
                        mimetype: "video/mp4",
                        ptt: false,
                    }, { quoted: receivedMsg });
                }
            }
        });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply("❌ An error occurred while processing your request. Please try again later.");
    }
});
