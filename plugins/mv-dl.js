const { cmd } = require("../command");
const axios = require("axios");
const config = require('../config');
const NodeCache = require("node-cache");

const movieCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

cmd({
  pattern: "cinesubztv",
  alias: ["cinetv"],
  desc: "🎥 Search Sinhala subbed TV shows from CineSubz",
  category: "media",
  react: "📺",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "*Use:* .cinesubztv <tvshow name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `cinesubz_tv_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/cinesubz/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.tvShows?.length) {
        return await conn.sendMessage(from, { 
          text: "*No TV Shows found for your query.*" 
        }, { quoted: mek });
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.result.tvShows.map((item, index) => ({
      number: index + 1,
      title: item.title,
      link: item.link,
      image: item.image,
      imdb: item.imdb,
      type: item.type,
      quality: item.quality || "N/A"
    }));

    let textList = "🔢 *Reply Below Number*\n━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((item) => {
      textList += `🔸 *${item.number}. ${item.title}*\n`;
    });
    textList += "\n💬 *Reply with TV show number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝐂𝐈𝐍𝐄𝐒𝐔𝐁𝐙 𝑻𝑽 𝑺𝑬𝑨𝑹𝑪𝑯 📺*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Process Cancelled*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid TV show number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const tvUrl = `https://m-api-five.vercel.app/tvshows/cinesubz/details?url=${encodeURIComponent(selected.link)}`;
        const tvRes = await axios.get(tvUrl);
        const tvData = tvRes.data?.result;

        const seasons = tvData?.seasons || [];
        if (!seasons.length) {
          return conn.sendMessage(from, { text: "*No seasons available for this TV show.*" }, { quoted: msg });
        }

        let tvInfo = 
          `🎬 *Title:* *${tvData.title || tvData.maintitle || selected.title}*\n\n` +
          `📅 *Date:* ${tvData.date || "N/A"}\n` +
          `📂 *Type:* ${selected.type}\n` +
          `🎥 *Quality:* WEBRip\n` +
          `⭐ *Rating:* ${selected.imdb}\n\n` +
          `📁 *Seasons:* 🔻\n\n`;

        seasons.forEach((s, index) => {
          tvInfo += `🔷 ${index + 1}. *${s.seasontitle}* (${s.episodes.length} Episodes)\n`;
        });
        tvInfo += "\n🔢 *Reply with season number.*";

        const cleanImage = (tvData.image || (tvData.images && tvData.images[0]) || selected.image || "").trim();

        const seasonMsg = await conn.sendMessage(from, {
          image: cleanImage ? { url: cleanImage } : undefined,
          caption: tvInfo
        }, { quoted: msg });

        movieMap.set(seasonMsg.key.id, { step: "SEASON", selected, tvData, seasons });
      }

      else if (movieMap.has(repliedId)) {
        const sessionData = movieMap.get(repliedId);
        const num = parseInt(replyText);

        if (sessionData.step === "SEASON") {
          const chosenSeason = sessionData.seasons[num - 1];
          if (!chosenSeason) {
            return conn.sendMessage(from, { text: "*Invalid season number.*" }, { quoted: msg });
          }

          const tvData = sessionData.tvData;

          let epInfo = 
            `🎬 *Title:* *${tvData?.title || tvData?.maintitle || sessionData.selected.title}*\n\n` +
            `📅 *Date:* ${tvData?.date}\n\n` +
            `📺 *${chosenSeason.seasontitle} Episodes:* 🔻\n\n`;

          chosenSeason.episodes.forEach((ep) => {
            epInfo += `🔹 *${ep.epinum}. ${ep.title}* (${ep.date})\n`;
          });
          epInfo += "\n🔢 *Reply with episode number.*";

          const cleanImage = (tvData?.image || "").trim();

          const epMsg = await conn.sendMessage(from, {
            image: cleanImage ? { url: cleanImage } : undefined,
            caption: epInfo
          }, { quoted: msg });

          movieMap.set(epMsg.key.id, { step: "EPISODE", selected: sessionData.selected, tvData: sessionData.tvData, episodes: chosenSeason.episodes });
        }

        else if (sessionData.step === "EPISODE") {
          const chosenEp = sessionData.episodes.find(e => parseInt(e.epinum) === num);
          if (!chosenEp) {
            return conn.sendMessage(from, { text: "*Invalid episode number.*" }, { quoted: msg });
          }

          await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

          const epUrl = `https://m-api-five.vercel.app/episodes/cinesubz/details?url=${encodeURIComponent(chosenEp.link)}`;
          const epRes = await axios.get(epUrl);
          const epData = epRes.data?.result;

          const dllinks = epData?.dllinks || [];
          if (!dllinks.length) {
            return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
          }

          const mainTitle = epData.maintitle || sessionData.tvData?.title || sessionData.selected.title;

          let dlInfo = 
            `🎬 *Main Title:* *${mainTitle}*\n\n` +
            `📌 *Episode:* ${chosenEp.title} (EpiNum ${chosenEp.epinum})\n` +
            `📅 *Date:* ${epData.date || chosenEp.date || "N/A"}\n\n` +
            `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

          dllinks.forEach((d, index) => {
            dlInfo += `♦️ ${index + 1}. *${d.quality}* — ${d.size} (${d.language || "N/A"})\n`;
          });
          dlInfo += "\n🔢 *Reply with quality number to download.*";

          const cleanImage = (epData.image || sessionData.tvData?.image || "").trim();

          const downloadMsg = await conn.sendMessage(from, {
            image: cleanImage ? { url: cleanImage } : undefined,
            caption: dlInfo
          }, { quoted: msg });

          movieMap.set(downloadMsg.key.id, { step: "DOWNLOAD", downloads: dllinks, mainTitle: mainTitle, episodeTitle: chosenEp.title });
        }

        else if (sessionData.step === "DOWNLOAD") {
          const { downloads, mainTitle, episodeTitle } = sessionData;
          const chosen = downloads[num - 1];
          if (!chosen) {
            return conn.sendMessage(from, { text: "*Invalid quality number.*" }, { quoted: msg });
          }

          await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

          const downloadApiUrl = `https://m-api-five.vercel.app/movie/cinesubz/download?url=${encodeURIComponent(chosen.dllink)}`;
          const downloadRes = await axios.get(downloadApiUrl);
          const downloadData = downloadRes.data?.result;

          if (!downloadData || !downloadData.downloadUrls?.length) {
            return conn.sendMessage(from, { text: "*Failed to fetch download links.*" }, { quoted: msg });
          }

          const validUrls = downloadData.downloadUrls
            .map(d => d.url)
            .filter(u => u && !u.includes("telegram.me") && !u.includes("t.me"));

          if (!validUrls.length) {
            return conn.sendMessage(from, { text: "*No valid direct download links available.*" }, { quoted: msg });
          }

          let finalDownloadUrl = validUrls[0];

          const size = chosen.size.toLowerCase();
          const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

          if (sizeGB > 2) {
            return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
          }

          await conn.sendMessage(from, {
            document: { url: finalDownloadUrl },
            mimetype: "video/mp4",
            fileName: `${mainTitle} - ${episodeTitle} - ${chosen.quality}.mp4`,
            caption: `🎬 *${mainTitle}*\n📺 *${episodeTitle}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
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
  pattern: "pupilvideo",
  alias: ["pupil"],
  desc: "🎥 Search Sinhala subbed movies from Pupilvideo",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .pupilvideo <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `pupilvideo_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/pupilvideo/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.map((m, i) => ({
      number: i + 1,
      title: m.title,
      link: m.link,
      image: m.highimage || m.image,
      date: m.date,
      author: m.author,
      tag: m.labels ? m.labels.join(", ") : "N/A"
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝐏𝐔𝐏𝐈𝐋𝐕𝐈𝐃𝐄𝐎 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/pupilvideo/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.result;
        
        if (!movie || !movie.dllinks?.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.title}*\n\n` +
          `📅 *Date:* ${selected.date}\n` +
          `✍️ *Author:* ${selected.author}\n` +
          `⭐ *Labels:* ${selected.tag}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        movie.dllinks.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.quality}* — ${d.size} (${d.host})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const movieImage = movie.ogimage || movie.image || selected.image;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: movieImage },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: movie.dllinks });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "subzlk",
  alias: ["subz"],
  desc: "🎥 Search Sinhala subbed movies from Subzlk",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .subzlk <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `subzlk_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/subzlk/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.map((item, i) => ({
      number: i + 1,
      title: item.title,
      link: item.link,
      image: item.image,
      type: item.type,
      rating: item.rating,
      year: item.year
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((item) => {
      textList += `🔸 *${item.number}. ${item.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝐒𝐔𝐁𝐙𝐋𝐊 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(item => item.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/subzlk/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data?.result;
        
        const downloads = movie?.downloads || [];

        if (!downloads.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.title}*\n\n` +
          `📅 *Date:* ${movie.date || selected.year}\n` +
          `📂 *Type:* ${selected.type}\n` +
          `⭐ *Rating:* ${selected.rating}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        downloads.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.quality}* — ${d.size} (${d.language})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const defaultImage = "https://files.catbox.moe/ajfxoo.jpg";
        const movieImage = movie.poster || defaultImage;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: movieImage },
          caption: info
        }, { quoted: msg }).catch(() => conn.sendMessage(from, {
          image: { url: defaultImage },
          caption: info
        }, { quoted: msg }));
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: downloads });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size}) - Bot can only send files under 2GB.*` }, { quoted: msg });
        }
        
        let finalDownloadUrl = chosen.dllink;

        if (chosen.dllink.includes("drive.google.com") || chosen.dllink.includes("usercontent.google.com")) {
          try {
            const gdriveRes = await axios.get(`https://m-api-five.vercel.app/downloader/gdrive?url=${encodeURIComponent(chosen.dllink)}`);
            if (gdriveRes.data?.status && gdriveRes.data?.result?.downloadUrl) {
              finalDownloadUrl = gdriveRes.data.result.downloadUrl;
            }
          } catch (err) {
            console.log("GDrive fetch error:", err.message);
          }
        }

        await conn.sendMessage(from, {
          document: { url: finalDownloadUrl },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "chithrapata",
  alias: ["chithra"],
  desc: "🎥 Search Sinhala subbed movies from Chithrapata",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .chithrapata <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `chithrapata_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/chithrapata/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.map((m, i) => ({
      number: i + 1,
      title: m.title,
      link: m.link,
      image: m.image,
      type: m.type,
      quality: m.quality
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝑪𝑯𝑰𝑻𝑯𝑹𝑨𝑷𝑨𝑻𝑨 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/chithrapata/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.result;

        const dllinks = movie?.dllinks?.filter(d => d.dllink && !d.dllink.includes("t.me")) || [];
        
        if (!dllinks.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.maintitle || movie.title}*\n\n` +
          `📅 *Date:* ${movie.date}\n` +
          `📂 *Type:* ${selected.type}\n` +
          `⭐ *Quality:* ${selected.quality}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        dllinks.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.quality}* — ${d.size} (${d.option})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const movieImage = movie.image || selected.image;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: movieImage },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: dllinks });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.dllink },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "baiscopes",
  alias: ["bais"],
  desc: "🎥 Search Sinhala subbed movies from Baiscopes",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .baiscopes <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `baiscopes_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/baiscopes/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.map((m, i) => ({
      number: i + 1,
      title: m.title,
      link: m.link,
      image: m.image,
      type: m.type,
      rating: m.rating,
      year: m.year
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝐁𝐀𝐈𝐒𝐂𝐎𝐏𝐄𝐒 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/baiscopes/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.result;
        
        const dllinks = movie?.dllinks?.filter(d => d.dllink && !d.dllink.includes("t.me")) || [];

        if (!dllinks.length) {
          return conn.sendMessage(from, { text: "*No direct download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.maintitle || movie.title}*\n\n` +
          `📂 *Type:* ${selected.type}\n` +
          `📅 *Date:* ${movie.date || selected.year}\n` +
          `⭐ *Rating:* ${selected.rating}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        dllinks.forEach((d, i) => {
          info += `♦️ ${i + 1}. *FHD 1080p* — ${d.size} (Clicks: ${d.clicks || "0"})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const movieImage = movie.mainimage || selected.image;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: movieImage },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: dllinks });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.dllink },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.option}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.option}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "sinhalasub",
  alias: ["ssub"],
  desc: "🎥 Search Sinhala subbed movies from SinhalaSub",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .sinhalasub <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `sinhalasub_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.map((m, i) => ({
      number: i + 1,
      title: m.title,
      link: m.link,
      image: m.image,
      type: m.type,
      quality: m.quality,
      qty: m.qty
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝑺𝑰𝑵𝑯𝑨𝑳𝑨𝑺𝑼𝑩 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/sinhalasub/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.result;
        
        const dllinks = movie?.dllinks || [];

        if (!dllinks.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.maintitle || movie.title}*\n\n` +
          `📅 *Date:* ${movie.date}\n` +
          `📂 *Type:* ${selected.type}\n` +
          `⭐ *Quality:* ${selected.quality}\n` +
          `📦 *Resolution:* ${selected.qty}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        dllinks.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.quality}* — ${d.size} (${d.server})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const movieImage = movie.image || selected.image;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: movieImage },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: dllinks });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        let finalDownloadUrl = chosen.dllink;

        if (finalDownloadUrl.includes("pixeldrain.com/u/")) {
          const fileId = finalDownloadUrl.split("/u/")[1];
          if (fileId) {
            finalDownloadUrl = `https://pixeldrain.com/api/file/${fileId}?download`;
          }
        }

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: finalDownloadUrl },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});

cmd({
  pattern: "cinesubz",
  alias: ["cine"],
  desc: "🎥 Search Sinhala subbed movies from CineSubz",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: "Use: .cinesubz <movie name>"
    }, { quoted: mek });
  }

  try {
    const cacheKey = `cinesubz_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://m-api-five.vercel.app/movie/cinesubz/search?text=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;

      if (!data.status || !data.result?.movies?.length) {
        throw new Error("No results found for your query.");
      }

      movieCache.set(cacheKey, data);
    }
    
    const movieList = data.result.movies.map((m, i) => ({
      number: i + 1,
      title: m.title,
      type: m.type,
      link: m.link,
      image: m.image,
      quality: m.quality,
      imdb: m.imdb
    }));

    let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜ｗ 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
    movieList.forEach((m) => {
      textList += `🔸 *${m.number}. ${m.title}*\n`;
    });
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: `*🔍 𝑪𝑰𝑵𝑬𝑺𝑼𝐁𝐙 𝑪𝑰𝑵𝑬𝑴𝑨 𝑺𝑬𝑨𝑹𝑪𝑯 🎥*\n\n${textList}\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
    }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        return conn.sendMessage(from, { text: "✅ *Cancelled.*" }, { quoted: msg });
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);
        if (!selected) {
          return conn.sendMessage(from, { text: "*Invalid Movie Number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        const movieUrl = `https://m-api-five.vercel.app/movie/cinesubz/details?url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data.result;
        
        const dllinks = movie?.dllinks || [];

        if (!dllinks.length) {
          return conn.sendMessage(from, { text: "*No download links available.*" }, { quoted: msg });
        }

        let info =
          `🎬 *${movie.title || movie.maintitle}*\n\n` +
          `📂 *Type:* ${selected.type}\n` +
          `📅 *Date:* ${movie.date}\n` +
          `🎥 *Quality:* ${selected.quality}\n` +
          `⭐ *Rating:* ${selected.imdb}\n\n` +
          `🎥 *𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑳𝒊𝒏𝒌𝒔:* 📥\n\n`;

        dllinks.forEach((d, i) => {
          info += `♦️ ${i + 1}. *${d.quality}* — ${d.size} (${d.language})\n`;
        });
        info += "\n🔢 *Reply with number to download.*";

        const cleanImage = (movie.image || selected.image || "").trim();

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: cleanImage },
          caption: info
        }, { quoted: msg });
        
        movieMap.set(downloadMsg.key.id, { selected, downloads: dllinks });
      }

      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) {
          return conn.sendMessage(from, { text: "*Invalid number.*" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

        const downloadApiUrl = `https://m-api-five.vercel.app/movie/cinesubz/download?url=${encodeURIComponent(chosen.dllink)}`;
        const downloadRes = await axios.get(downloadApiUrl);
        const downloadData = downloadRes.data?.result;

        if (!downloadData || !downloadData.downloadUrls?.length) {
          return conn.sendMessage(from, { text: "*Failed to fetch download links.*" }, { quoted: msg });
        }

        const validUrls = downloadData.downloadUrls
          .map(d => d.url)
          .filter(u => u && !u.includes("telegram.me") && !u.includes("t.me"));

        if (!validUrls.length) {
          return conn.sendMessage(from, { text: "*No valid download links available.*" }, { quoted: msg });
        }

        let finalDownloadUrl = validUrls[0];

        const size = chosen.size.toLowerCase();
        const sizeGB = size.includes("gb") ? parseFloat(size) : parseFloat(size) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, { text: `⚠️ *Large File (${chosen.size})*` }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: finalDownloadUrl },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${selected.title}*\n🎥 *${chosen.quality}*\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
  }
});
