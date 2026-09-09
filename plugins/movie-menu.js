const { cmd, commands } = require("../command");
const axios = require("axios");

// ----- Multi-Reply Smart Waiter (Anime plugin logic) -----
function waitForReply(conn, from, sender, targetId) {
    return new Promise((resolve) => {
        const handler = (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message) return;

            const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || "";
            const context = msg.message?.extendedTextMessage?.contextInfo;
            const msgSender = msg.key.participant || msg.key.remoteJid;
            
            const isTargetReply = context?.stanzaId === targetId;
            const isCorrectUser = msgSender.includes(sender.split('@')[0]) || msgSender.includes("@lid");

            if (msg.key.remoteJid === from && isCorrectUser && isTargetReply && !isNaN(text)) {
                resolve({ msg, text: text.trim() });
            }
        };
        conn.ev.on("messages.upsert", handler);
        setTimeout(() => { conn.ev.off("messages.upsert", handler); }, 600000); 
    });
}

cmd({
    pattern: "movie",
    alias: ["mv"],
    desc: "Ultimate Multi-reply movie engine with fixed UI",
    category: "downloader",
    react: "🎬",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("❗ කරුණාකර සෙවිය යුතු ෆිල්ම් එකේ නම ලබා දෙන්න.");

        const posterUrl = "https://files.catbox.moe/ajfxoo.jpg";

        // --- Premium UI Design ---
        let menu = `
 🎬 𝐀𝐋𝐋 𝐂𝐈𝐍𝐄𝐌𝐀 𝐒𝐄𝐀𝐑𝐂𝐇 🎬
 ━━━━━━━━━━━━━━━━
 
 🔍 𝐘𝐎𝐔𝐑 𝐒𝐄𝐀𝐑𝐂𝐇 : ${q.toUpperCase()}
  
 🔢 𝑹𝒆𝒑𝒍𝒚 𝑩𝒆𝒍𝒐𝒘 𝑵𝒖𝒎𝒃𝒆𝒓

 1️⃣ 𝑪𝑰𝑵𝑬𝑺𝑼𝑩𝒁 𝑆𝐸𝐴𝐑𝐶𝐻
 2️⃣ 𝑺𝑰𝑵𝑯𝑨𝑳𝑨𝑺𝑼𝑩 𝑆𝐸𝐴𝐑𝐶𝐻    
 3️⃣ 𝑩𝑨𝑰𝑺𝑬𝑪𝑶𝑷𝑬𝑺 𝑆𝐸𝐴𝐑𝐶𝐻 
 4️⃣ 𝑪𝑯𝑰𝑻𝑯𝑹𝑨𝑷𝑨𝑻𝑨 𝑺𝑬𝑨𝑹𝑪𝑯         
 5️⃣ 𝑺𝑼𝑩𝒁𝑳𝑲 𝑆𝐸𝐴𝐑𝐶𝐻
 6️⃣ 𝐏𝐔𝐏𝐈𝐋𝐕𝐈𝐃𝐄𝐎 𝑆𝐸𝐴𝐑𝐶𝐻

 7️⃣ 𝑪𝑰𝑵𝑬𝑺𝑼𝑩𝒁 𝐓𝐕 𝑆𝐸𝐴𝐑𝐶𝐻
 
 © Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
 `;

        const listMsg = await conn.sendMessage(from, { 
            image: { url: posterUrl }, 
            caption: menu 
        }, { quoted: m });

        // --- Multi-Reply Flow Control ---
        const startFlow = async () => {
            while (true) {
            const selection = await waitForReply(conn, from, sender, listMsg.key.id);
              if (!selection) break;

                (async () => {
                    let targetPattern = "";
                    const selText = selection.text;

                    if (selText === '1') targetPattern = "cinesubz";
                    else if (selText === '2') targetPattern = "sinhalasub";
                    else if (selText === '3') targetPattern = "baiscopes";
                    else if (selText === '4') targetPattern = "chithrapata";
                    else if (selText === '5') targetPattern = "subzlk";
                    else if (selText === '6') targetPattern = "pupilvideo";
                    else if (selText === '7') targetPattern = "cinesubztv";
                     
                    if (targetPattern) {
                        await conn.sendMessage(from, { react: { text: "🔍", key: selection.msg.key } });
                        
                        const selectedCmd = commands.find((c) => c.pattern === targetPattern);
                        if (selectedCmd) {
                            // මෙතනදී q: q ලබා දීමෙන් මුල් සෙවුම් නමම පාවිච්චි වේ.
                            await selectedCmd.function(conn, selection.msg, selection.msg, { 
                                from, 
                                q: q, 
                                reply, 
                                isGroup: m.isGroup, 
                                sender: m.sender, 
                                pushname: m.pushname 
                            });
                        }
                    }
                })();
            }
        };

        startFlow();

    } catch (e) {
        console.error("Movie Engine Error:", e);
    }
});
