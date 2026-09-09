const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');

const tharuzz_footer = "> Powerd by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳";

cmd(
    {
        pattern: "xvideo",
        use: ".xnxx <xnxx video name>",
        react: "🔞",
        desc: "Search and download xnxx.com 18+ videos.",
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
        desc: "Search and download xvideos.com videos.",
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
                    return; // Ignore invalid numbers to avoid spamming
                }

                await react(msg.key, '⏳');

                const chosen = xnxxSearchapi.result[index];

                // Download API Call using chosen.link
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
