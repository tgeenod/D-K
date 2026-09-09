const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "system",
    desc: "Check bot is alive or not",
    category: "main",
    react: "🧬",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const status = `
╭──〔 🤖 *SYSTEM INFO* 〕──◉
│
│ ✨ _Bot System Information_
│
│ 👑 *Owner:* ${config.OWNER_NAME}
│ ⚡ *Version:* 2.0.0
│ 📝 *Prefix:* [${config.PREFIX}]
│ 📳 *Mode:* [${config.MODE}]
│ 💾 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB
│ ⌛ *Uptime:* ${runtime(process.uptime())}
│ 🖥️ *Host:* ${os.hostname()}
╰───────────────◉
> ${config.DESCRIPTION}`;

       // Fake VCard
        const FakeVCard = {
      key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
      },
      message: {
        contactMessage: {
          displayName: "© 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃",
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Meta\nORG:META AI;\nTEL;type=CELL;type=VOICE;waid=13135550002:+13135550002\nEND:VCARD`
        }
      }
    };      
        
        await conn.sendMessage(from, {
            text: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: '𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳',
                    serverMessageId: 143
                }
            }
        }, { quoted: FakeVCard });

    } catch (e) {
        console.error("System Error:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
