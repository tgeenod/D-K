const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "ping",
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const startTime = Date.now();

        const emojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹', '💎', '🏆', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // React instantly with a random emoji
        await conn.sendMessage(from, {
            react: { text: randomEmoji, key: mek.key }
        });

        const ping = Date.now() - startTime;

        // Speed categorization
        let badge = '🐢 Slow', color = '🔴';
        if (ping <= 150) {
            badge = '🚀 Super Fast';
            color = '🟢';
        } else if (ping <= 300) {
            badge = '⚡ Fast';
            color = '🟡';
        } else if (ping <= 600) {
            badge = '⚠️ Medium';
            color = '🟠';
        }

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
        
        // Final response
        await conn.sendMessage(from, {
            text: `> *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ʀᴇsᴘᴏɴsᴇ: ${ping} ms ${randomEmoji}*\n> *sᴛᴀᴛᴜs: ${color} ${badge}*\n> *ᴠᴇʀsɪᴏɴ: 2.0.0*`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
                    serverMessageId: 143
                }
            }
        }, { quoted: FakeVCard });

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});


cmd({
    pattern: "ping2",
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "🍂",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply }) => {
    try {
        const start = new Date().getTime();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        // Ensure reaction and text emojis are different
        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction using conn.sendMessage()
        await conn.sendMessage(from, {
            react: { text: textEmoji, key: mek.key }
        });

        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;

        const text = `> *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

        // Fake VCard
        const FakeVCard = {
      key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: "status@broadcast"
      },
      message: {
        contactMessage: {
          displayName: "© 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃",
          vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃\nORG:dark;\nTEL;type=CELL;type=VOICE;waid=254700000000:+254 700 000000\nEND:VCARD",
          jpegThumbnail: Buffer.from([])
        }
      }
    };
        
        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
                    serverMessageId: 143
                }
            }
        }, { quoted: FakeVCard });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
