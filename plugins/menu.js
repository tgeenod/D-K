const { cmd, commands } = require('../command');
const axios = require('axios');
const { fetchJson, getBuffer, runtime } = require('../lib/functions');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');
const path = require('path');
const os = require('os');
const fs = require('fs');

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
    react: "🎬",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("❗ කරුණාකර සෙවිය යුතු ෆිල්ම් එකේ නම ලබා දෙන්න.");

        const posterUrl = "https://files.catbox.moe/ajfxoo.jpg";

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
        6️⃣ 𝐌𝐎𝐕𝐈𝐄𝐏𝐑𝐎 𝑆𝐸𝐴𝐑𝐶𝐻
        7️⃣ 𝐏𝐔𝐏𝐈𝐋𝐕𝐈𝐃𝐄𝐎 𝑆𝐸𝐴𝐑𝐶𝐻

        8️⃣ 𝑪𝑰𝑵𝑬𝑺𝑼𝑩𝒁 𝐓𝐕 𝑆𝐸𝐴𝐑𝐶𝐻

        © Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
        `;

        const listMsg = await conn.sendMessage(from, {
            image: { url: posterUrl },
            caption: menu
        }, { quoted: m });

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
                    else if (selText === '6') targetPattern = "moviepro";
                    else if (selText === '7') targetPattern = "pupilvideo";
                    else if (selText === '8') targetPattern = "cinesubztv";

                    if (targetPattern) {
                        await conn.sendMessage(from, { react: { text: "🔍", key: selection.msg.key } });

                        const selectedCmd = commands.find((c) => c.pattern === targetPattern);
                        if (selectedCmd) {

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

cmd({
    pattern: "logo",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("❌ *Example:* .logo Dark");

        const data = await fetchJson('https://www.ominisave.com/api/logo-list');
        const types = data.types;

        if (!types || !Array.isArray(types)) return reply("❌ API ERROR.");

        let listMsg = `✨ *LOGO MAKER LIST* ✨\n\n`;
        listMsg += `📝 *Name:* ${q}\n\n`;
        listMsg += `🎨 *Patterns:*\n\n`;

        types.forEach((item, index) => {
            listMsg += `*${index + 1}.* ${item}\n`;
        });

        listMsg += `\n> *🔢 Please Reply Below Number.*`;

        await conn.sendMessage(m.chat, { text: listMsg }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + e.message);
    }
});

cmd({
    on: "body"
}, async (conn, mek, m, { body, reply }) => {
    try {
        if (!m.quoted) return;

        const quotedText = m.quoted.text || m.quoted.conversation || "";
        if (!quotedText) return;

        const selection = body.trim();
        if (isNaN(selection)) return;
        const num = parseInt(selection);

        if (quotedText.includes("LOGO MAKER LIST")) {
            if (!quotedText.includes("Name:* ")) return;
            const name = quotedText.split("Name:* ")[1].split("\n")[0].trim();

            const lines = quotedText.split("\n");
            const targetLine = lines.find(l => l.includes(`*${num}.*`));
            if (!targetLine) return;

            const type = targetLine.split(".* ")[1].trim();

            if (type) {

                await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });

                let formatMsg = `⚙️ *FORMAT SELECTION* ⚙️\n\n`;
                formatMsg += `📝 *Name:* ${name}\n`;
                formatMsg += `🎨 *Pattern:* ${type}\n\n`;
                formatMsg += `*1.* 🖼️ Image\n`;
                formatMsg += `*2.* 📄 Document\n`;
                formatMsg += `*3.* ✨ Sticker\n\n`;
                formatMsg += `> *🔢 Please Reply Below Number.*`;

                return await conn.sendMessage(m.chat, { text: formatMsg }, { quoted: mek });
            }
        }

        if (quotedText.includes("FORMAT SELECTION")) {
            if (![1, 2, 3].includes(num)) return;

            if (!quotedText.includes("Name:* ")) return;
            const name = quotedText.split("Name:* ")[1].split("\n")[0].trim();

            if (!quotedText.includes("Pattern:* ")) return;
            const type = quotedText.split("Pattern:* ")[1].split("\n")[0].trim();

            if (name && type) {

                await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

                const logoUrl = `https://www.ominisave.com/api/logo?name=${encodeURIComponent(name)}&type=${type}`;
                const buffer = await getBuffer(logoUrl);

                if (num === 1) {
                    await conn.sendMessage(m.chat, {
                        image: buffer,
                        caption: `✨ *Logo Generated*\n\n📌 *Type:* ${type}\n📝 *Name:* ${name}`
                    }, { quoted: mek });
                }
                else if (num === 2) {
                    await conn.sendMessage(m.chat, {
                        document: buffer,
                        mimetype: 'image/png',
                        fileName: `DARK-KNIGHT-${type}-logo.png`,
                        caption: `✨ *Logo Document*\n\n📌 *Type:* ${type}\n📝 *Name:* ${name}`
                    }, { quoted: mek });
                }
                else if (num === 3) {
                    let sticker = new Sticker(buffer, {
                        pack: `Logo-${type.toUpperCase()}`,
                        author: "DARK-KNIGHT",
                        type: StickerTypes.FULL,
                        categories: ['🤩', '🎉'],
                        quality: 80,
                        background: 'transparent'
                    });
                    const stickerBuffer = await sticker.build();
                    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: mek });
                }

                await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });
            }
        }

    } catch (e) {
        console.log("Listener Error:", e);
    }
});

cmd({
    pattern: "logo2",
    alias: ["logomenu"],
    react: "🎀",
    filename: __filename
},
async (conn, mek, m, { from }) => {
    try {
        let dec = `
        ╭━━〔 🎨 *Logo Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • 3dcomic
        ┃★│ • 3dpaper
        ┃★│ • america
        ┃★│ • angelwings
        ┃★│ • bear
        ┃★│ • bulb
        ┃★│ • boom
        ┃★│ • birthday
        ┃★│ • blackpink
        ┃★│ • cat
        ┃★│ • clouds
        ┃★│ • castle
        ┃★│ • deadpool
        ┃★│ • dragonball
        ┃★│ • devilwings
        ┃★│ • eraser
        ┃★│ • frozen
        ┃★│ • futuristic
        ┃★│ • galaxy
        ┃★│ • hacker
        ┃★│ • leaf
        ┃★│ • luxury
        ┃★│ • naruto
        ┃★│ • nigeria
        ┃★│ • neonlight
        ┃★│ • paint
        ┃★│ • pornhub
        ┃★│ • sans
        ┃★│ • sunset
        ┃★│ • sadgirl
        ┃★│ • thor
        ┃★│ • tatoo
        ┃★│ • typography
        ┃★│ • valorant
        ┃★│ • zodiac
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷‎`;

        const FakeVCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "© 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Meta\nORG:META AI;\nTEL;type=CELL;type=VOICE;waid=13135550002:+13135550002\nEND:VCARD`
                }
            }
        };

        await conn.sendMessage(
        from,
        {
            image: { url: config.ALIVE_IMG },
            caption: dec,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
                    serverMessageId: 143
                }
            }
        },
        { quoted: FakeVCard }
        );

    } catch (e) {
        console.log(e);
    }
});

cmd({
    pattern: "menu2",
    alias: ["allmenu"],
    use: '.menu2',
    react: "📜",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {

        let platformName = "Cloud/Vps";
        const hostName = os.hostname();
        const nameLength = hostName.length;

        if (process.env.HEROKU_APP_NAME || nameLength === 36) {
            platformName = "Heroku";
        } else if (process.env.KOYEB_APP_NAME || nameLength === 8) {
            platformName = "Koyeb";
        } else if (process.env.RAILWAY_STATIC_URL || nameLength === 12) {
            platformName = "Railway";
        } else if (process.env.RENDER_SERVICE_NAME || nameLength === 15) {
            platformName = "Render";
        } else if (process.env.PTERODACTYL || nameLength === 10) {
            platformName = "Panel";
        } else if (process.env.REPL_ID || nameLength === 12) {
            platformName = "Replit";
        } else if (process.env.SSH_TTY || nameLength === 6) {
            platformName = "VPS";
        }

        let dec = `
        ╭━〔 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳* 〕━··๏
        ┃★╭──────────────
        ┃★│ • 👑 Owner : *${config.OWNER_NAME}*
        ┃★│ • ⚙️ Prefix : *[${config.PREFIX}]*
        ┃★│ • 🌐 Platform : *${platformName}*
        ┃★│ • 📦 Version : *2.0.0*
        ┃★│ • ⏱️ Runtime : *${runtime(process.uptime())}*
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 *🤖 Ai Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • ai
        ┃★│ • gpt
        ┃★│ • gemini
        ┃★│ • venice
        ┃★│ • copilot
        ┃★│ • copilot2
        ┃★│ • openai
        ┃★│ • openai2
        ┃★│ • aiimg
        ┃★│ • aiimg1
        ┃★│ • aiimg2
        ┃★│ • aiimg3
        ┃★│ • aianime
        ┃★│ • imgedit
        ┃★│ • topromt
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 🔄 *Convert Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • attp
        ┃★│ • caption
        ┃★│ • brat
        ┃★│ • aivoice
        ┃★│ • binary
        ┃★│ • dbinary
        ┃★│ • base64
        ┃★│ • unbase64
        ┃★│ • fetch
        ┃★│ • recolor
        ┃★│ • readmore
        ┃★│ • sticker
        ┃★│ • stake
        ┃★│ • stoimg
        ┃★│ • gsticker
        ┃★│ • tiny
        ┃★│ • tourl
        ┃★│ • img2url
        ┃★│ • tts
        ┃★│ • tts2
        ┃★│ • tts3
        ┃★│ • toptt
        ┃★│ • tomp3
        ┃★│ • topdf
        ┃★│ • translate
        ┃★│ • urlencode
        ┃★│ • urldecode
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 📥 *Download Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • apk
        ┃★│ • apk2
        ┃★│ • facebook
        ┃★│ • fb2
        ┃★│ • gdrive
        ┃★│ • gdrive2
        ┃★│ • gitclone
        ┃★│ • image
        ┃★│ • img
        ┃★│ • instagram
        ┃★│ • igvid
        ┃★│ • ig2
        ┃★│ • mediafire
        ┃★│ • mfire2
        ┃★│ • mega
        ┃★│ • mega2
        ┃★│ • pinterest
        ┃★│ • pindl2
        ┃★│ • pins
        ┃★│ • pastpaper
        ┃★│ • pixeldrain
        ┃★│ • ringtone
        ┃★│ • ring2
        ┃★│ • spotify
        ┃★│ • spotify2
        ┃★│ • tiktok
        ┃★│ • tt2
        ┃★│ • tiks
        ┃★│ • twitter
        ┃★│ • twitt2
        ┃★│ • downurl
        ┃★│ • movie
        ┃★│ • xnxx
        ┃★│ • xvideo
        ┃★│ • song
        ┃★│ • song1
        ┃★│ • song2
        ┃★│ • video
        ┃★│ • video1
        ┃★│ • video2
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 😄 *Fun Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • emix
        ┃★│ • angry
        ┃★│ • confused
        ┃★│ • hot
        ┃★│ • happy
        ┃★│ • heart
        ┃★│ • moon
        ┃★│ • sad
        ┃★│ • shy
        ┃★│ • nikal
        ┃★│ • hack
        ┃★│ • msg
        ┃★│ • sends
        ┃★│ • repeat
        ┃★│ • aura
        ┃★│ • 8ball
        ┃★│ • boy
        ┃★│ • girl
        ┃★│ • coinflip
        ┃★│ • character
        ┃★│ • compliment
        ┃★│ • dare
        ┃★│ • emoji
        ┃★│ • fact
        ┃★│ • flip
        ┃★│ • flirt
        ┃★│ • friend
        ┃★│ • joke
        ┃★│ • lovetest
        ┃★│ • pick
        ┃★│ • pickup
        ┃★│ • quote
        ┃★│ • rate
        ┃★│ • roll
        ┃★│ • ship
        ┃★│ • shapar
        ┃★│ • turth
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 👥 *Group Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • requestlist
        ┃★│ • acceptall
        ┃★│ • rejectall
        ┃★│ • add
        ┃★│ • invite
        ┃★│ • admin
        ┃★│ • dismiss
        ┃★│ • promote
        ┃★│ • demote
        ┃★│ • ginfo
        ┃★│ • gstates
        ┃★│ • gcstatus
        ┃★│ • hidetag
        ┃★│ • tagall
        ┃★│ • join
        ┃★│ • kick
        ┃★│ • kickall
        ┃★│ • removeall
        ┃★│ • removemembers
        ┃★│ • removeadmins
        ┃★│ • leave
        ┃★│ • glink
        ┃★│ • lock
        ┃★│ • unlock
        ┃★│ • mute
        ┃★│ • unmute
        ┃★│ • newgc
        ┃★│ • out
        ┃★│ • poll
        ┃★│ • multipoll
        ┃★│ • getonline
        ┃★│ • opentime
        ┃★│ • closetime
        ┃★│ • resetglink
        ┃★│ • tagadmins
        ┃★│ • upgdp
        ┃★│ • upgdesc
        ┃★│ • upgname
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 🖼️ *Imagine Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • awoo
        ┃★│ • dog
        ┃★│ • imgloli
        ┃★│ • maid
        ┃★│ • megumin
        ┃★│ • waifu
        ┃★│ • neko
        ┃★│ • anime
        ┃★│ • anime1
        ┃★│ • anime2
        ┃★│ • anime3
        ┃★│ • anime4
        ┃★│ • anime5
        ┃★│ • animegirl
        ┃★│ • animegirl1
        ┃★│ • animegirl2
        ┃★│ • animegirl3
        ┃★│ • animegirl4
        ┃★│ • animegirl5
        ┃★│ • imagine
        ┃★│ • imagine2
        ┃★│ • imagine3
        ┃★│ • wallpaper
        ┃★│ • wallpaper2
        ┃★│ • randomwall
        ┃★│ • getimage
        ┃★│ • getvideo
        ┃★│ • imgscan
        ┃★│ • image
        ┃★│ • remini
        ┃★│ • topixel
        ┃★│ • adedit
        ┃★│ • bluredit
        ┃★│ • greyedit
        ┃★│ • invertedit
        ┃★│ • jailedit
        ┃★│ • jokeedit
        ┃★│ • nokiaedit
        ┃★│ • wantededit
        ┃★│ • removebg
        ┃★│ • couplepp
        ┃★│ • bonk
        ┃★│ • bully
        ┃★│ • blush
        ┃★│ • bite
        ┃★│ • cry
        ┃★│ • cuddle
        ┃★│ • cringe
        ┃★│ • dance
        ┃★│ • glomp
        ┃★│ • hug
        ┃★│ • happy
        ┃★│ • handhold
        ┃★│ • highfive
        ┃★│ • kill
        ┃★│ • kiss
        ┃★│ • lick
        ┃★│ • nom
        ┃★│ • pat
        ┃★│ • poke
        ┃★│ • smug
        ┃★│ • slay
        ┃★│ • smile
        ┃★│ • marige
        ┃★│ • wave
        ┃★│ • wink
        ┃★│ • yeet
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 🏠 *Main Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • alive
        ┃★│ • live
        ┃★│ • menu
        ┃★│ • menu2
        ┃★│ • ping
        ┃★│ • ping2
        ┃★│ • repo
        ┃★│ • system
        ┃★│ • version
        ┃★│ • uptime
        ┃★│ • restart
        ┃★│ • support
        ┃★│ • owner
        ┃★│ • pair
        ┃★│ • bible
        ┃★│ • biblelist
        ┃★│ • logomenu
        ┃★│ • logo
        ┃★│ • setting
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 📌 *Other Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • date
        ┃★│ • count
        ┃★│ • countx
        ┃★│ • calculate
        ┃★│ • createapi
        ┃★│ • get
        ┃★│ • gpass
        ┃★│ • sss
        ┃★│ • timenow
        ┃★│ • timezone
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 👑 *Owner Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • prefix
        ┃★│ • anticall
        ┃★│ • antilink
        ┃★│ • antidelete
        ┃★│ • block
        ┃★│ • unblock
        ┃★│ • broadcast
        ┃★│ • bug
        ┃★│ • spam
        ┃★│ • creact
        ┃★│ • ban
        ┃★│ • unban
        ┃★│ • listban
        ┃★│ • setsudo
        ┃★│ • delsudo
        ┃★│ • listsudo
        ┃★│ • vv
        ┃★│ • vv1
        ┃★│ • vv3
        ┃★│ • fullpp
        ┃★│ • setdp
        ┃★│ • setpp
        ┃★│ • getdp
        ┃★│ • getpp
        ┃★│ • update
        ┃★│ • shutdown
        ┃★│ • clearchats
        ┃★│ • delete
        ┃★│ • poststates
        ┃★│ • privacy
        ┃★│ • blocklist
        ┃★│ • getbio
        ┃★│ • setppall
        ┃★│ • setonline
        ┃★│ • setmyname
        ┃★│ • updatebio
        ┃★│ • groupsprivacy
        ┃★│ • getprivacy
        ┃★│ • savecontact
        ┃★│ • settings
        ┃★│ • jid
        ┃★│ • jid2
        ┃★│ • gjid
        ┃★│ • forward
        ┃★│ • fwd2
        ┃★│ • send
        ┃★│ • person
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷

        ╭━━〔 🔍 *Search Menu* 〕━━┈⊷
        ┃★╭──────────────
        ┃★│ • app
        ┃★│ • check
        ┃★│ • cid
        ┃★│ • cjid
        ┃★│ • country
        ┃★│ • chinfo
        ┃★│ • currency
        ┃★│ • define
        ┃★│ • fancy
        ┃★│ • getnumber
        ┃★│ • githubstalk
        ┃★│ • lyrics
        ┃★│ • npm
        ┃★│ • news
        ┃★│ • news1
        ┃★│ • news2
        ┃★│ • mvdetail
        ┃★│ • praytime
        ┃★│ • ssweb
        ┃★│ • srepo
        ┃★│ • stickers
        ┃★│ • ttstalk
        ┃★│ • twtstalk
        ┃★│ • tempnumber
        ┃★│ • tempmail
        ┃★│ • vcc
        ┃★│ • yts
        ┃★│ • ytpost
        ┃★│ • ytstalk
        ┃★│ • webinfo
        ┃★│ • weather
        ┃★│ • Wikipedia
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷
        > ${config.DESCRIPTION}`;

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

        await conn.sendMessage(
        from,
        {
            image: { url: config.ALIVE_IMG },
            caption: dec,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: config.BOT_NAME,
                    serverMessageId: 143
                }
            }
        },
        { quoted: FakeVCard });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e}`);
    }
});

cmd({
    pattern: "settings",
    alias: ["setting"],
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");

    try {
        let desc = `*` + "`「 🛡️ DARK-KNIGHT-XMD SETTINGS 🛡️ 」`" + `*

        *🔢 Reply with the number to change settings*

        *` + "`[01] MODE SETTINGS`" + `*
        *🔸 1.1* 》◦ *PUBLIC* 🧬
        *🔸 1.2* 》◦ *PRIVATE* 🧬
        *🔸 1.3* 》◦ *GROUPS* 🧬
        *🔸 1.4* 》◦ *INBOX* 🧬

        *` + "`[02] STATUS SETTINGS`" + `*
        *🔸 2.1* 》◦ *AUTO STATUS SEEN: TRUE* ✅
        *🔸 2.2* 》◦ *AUTO STATUS SEEN: FALSE* ❌
        *🔸 2.3* 》◦ *AUTO STATUS REPLY: TRUE* ✅
        *🔸 2.4* 》◦ *AUTO STATUS REPLY: FALSE* ❌
        *🔸 2.5* 》◦ *AUTO STATUS REACT: TRUE* ✅
        *🔸 2.6* 》◦ *AUTO STATUS REACT: FALSE* ❌

        *` + "`[03] PROTECTION (ANTI)`" + `*
        *🔸 3.1* 》◦ *ANTI LINK: TRUE* ✅
        *🔸 3.2* 》◦ *ANTI LINK: FALSE* ❌
        *🔸 3.3* 》◦ *ANTI LINK KICK: TRUE* ✅
        *🔸 3.4* 》◦ *ANTI LINK KICK: FALSE* ❌
        *🔸 3.5* 》◦ *DELETE LINKS: TRUE* ✅
        *🔸 3.6* 》◦ *DELETE LINKS: FALSE* ❌
        *🔸 3.7* 》◦ *ANTI BAD: TRUE* ✅
        *🔸 3.8* 》◦ *ANTI BAD: FALSE* ❌
        *🔸 3.9* 》◦ *ANTI VV: TRUE* ✅
        *🔸 3.10* 》◦ *ANTI VV: FALSE* ❌
        *🔸 3.11* 》◦ *ANTI DELETE: TRUE* ✅
        *🔸 3.12* 》◦ *ANTI DELETE: FALSE* ❌

        *` + "`[04] AUTO ACTIONS`" + `*
        *🔸 4.1* 》◦ *AUTO REACT: TRUE* ✅
        *🔸 4.2* 》◦ *AUTO REACT: FALSE* ❌
        *🔸 4.3* 》◦ *CUSTOM REACT: TRUE* ✅
        *🔸 4.4* 》◦ *CUSTOM REACT: FALSE* ❌
        *🔸 4.5* 》◦ *HEART REACT: TRUE* ✅
        *🔸 4.6* 》◦ *HEART REACT: FALSE* ❌

        *` + "`[05] AUTO MEDIA & REPLY`" + `*
        *🔸 5.1* 》◦ *AUTO VOICE: TRUE* ✅
        *🔸 5.2* 》◦ *AUTO VOICE: FALSE* ❌
        *🔸 5.3* 》◦ *AUTO STICKER: TRUE* ✅
        *🔸 5.4* 》◦ *AUTO STICKER: FALSE* ❌
        *🔸 5.5* 》◦ *AUTO REPLY: TRUE* ✅
        *🔸 5.6* 》◦ *AUTO REPLY: FALSE* ❌
        *🔸 5.7* 》◦ *MENTION REPLY: TRUE* ✅
        *🔸 5.8* 》◦ *MENTION REPLY: FALSE* ❌
        *🔸 5.9* 》◦ *CHAT BOT: TRUE* ✅
        *🔸 5.10* 》◦ *CHAT BOT: FALSE* ❌

        *` + "`[06] PRESENCE SETTINGS`" + `*
        *🔸 6.1* 》◦ *ALWAYS ONLINE: TRUE* ✅
        *🔸 6.2* 》◦ *ALWAYS ONLINE: FALSE* ❌
        *🔸 6.3* 》◦ *AUTO TYPING: TRUE* ✅
        *🔸 6.4* 》◦ *AUTO TYPING: FALSE* ❌
        *🔸 6.5* 》◦ *AUTO RECORDING: TRUE* ✅
        *🔸 6.6* 》◦ *AUTO RECORDING: FALSE* ❌

        *` + "`[07] SYSTEM SETTINGS`" + `*
        *🔸 7.1* 》◦ *WELCOME: TRUE* ✅
        *🔸 7.2* 》◦ *WELCOME: FALSE* ❌
        *🔸 7.3* 》◦ *ADMIN EVENTS: TRUE* ✅
        *🔸 7.4* 》◦ *ADMIN EVENTS: FALSE* ❌
        *🔸 7.5* 》◦ *READ MESSAGE: TRUE* ✅
        *🔸 7.6* 》◦ *READ MESSAGE: FALSE* ❌
        *🔸 7.7* 》◦ *READ CMD: TRUE* ✅
        *🔸 7.8* 》◦ *READ CMD: FALSE* ❌

        > *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        const vv = await conn.sendMessage(from, { image: { url: config.MENU_IMAGE_URL }, caption: desc }, { quoted: mek });

        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const selectedOption = msg.message.extendedTextMessage.text.trim();
            const isReplyToBot = msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id;

            if (isReplyToBot) {
                if (!isOwner) return reply("❌ You are not the owner!");

                let successMsg = "";
                switch (selectedOption) {
                    case '1.1': config.MODE = "public"; successMsg = "Mode: PUBLIC"; break;
                    case '1.2': config.MODE = "private"; successMsg = "Mode: PRIVATE"; break;
                    case '1.3': config.MODE = "group"; successMsg = "Mode: GROUPS"; break;
                    case '1.4': config.MODE = "inbox"; successMsg = "Mode: INBOX"; break;

                    case '2.1': config.AUTO_STATUS_SEEN = "true"; successMsg = "Auto Status Seen: ON"; break;
                    case '2.2': config.AUTO_STATUS_SEEN = "false"; successMsg = "Auto Status Seen: OFF"; break;
                    case '2.3': config.AUTO_STATUS_REPLY = "true"; successMsg = "Auto Status Reply: ON"; break;
                    case '2.4': config.AUTO_STATUS_REPLY = "false"; successMsg = "Auto Status Reply: OFF"; break;
                    case '2.5': config.AUTO_STATUS_REACT = "true"; successMsg = "Auto Status React: ON"; break;
                    case '2.6': config.AUTO_STATUS_REACT = "false"; successMsg = "Auto Status React: OFF"; break;

                    case '3.1': config.ANTI_LINK = "true"; successMsg = "Anti Link: ON"; break;
                    case '3.2': config.ANTI_LINK = "false"; successMsg = "Anti Link: OFF"; break;
                    case '3.3': config.ANTI_LINK_KICK = "true"; successMsg = "Anti Link Kick: ON"; break;
                    case '3.4': config.ANTI_LINK_KICK = "false"; successMsg = "Anti Link Kick: OFF"; break;
                    case '3.5': config.DELETE_LINKS = "true"; successMsg = "Delete Links: ON"; break;
                    case '3.6': config.DELETE_LINKS = "false"; successMsg = "Delete Links: OFF"; break;
                    case '3.7': config.ANTI_BAD = "true"; successMsg = "Anti Bad: ON"; break;
                    case '3.8': config.ANTI_BAD = "false"; successMsg = "Anti Bad: OFF"; break;
                    case '3.9': config.ANTI_VV = "true"; successMsg = "Anti Once View: ON"; break;
                    case '3.10': config.ANTI_VV = "false"; successMsg = "Anti Once View: OFF"; break;
                    case '3.11': config.ANTI_DELETE = "true"; successMsg = "Anti Delete: ON"; break;
                    case '3.12': config.ANTI_DELETE = "false"; successMsg = "Anti Delete: OFF"; break;

                    case '4.1': config.AUTO_REACT = "true"; successMsg = "Auto React: ON"; break;
                    case '4.2': config.AUTO_REACT = "false"; successMsg = "Auto React: OFF"; break;
                    case '4.3': config.CUSTOM_REACT = "true"; successMsg = "Custom React: ON"; break;
                    case '4.4': config.CUSTOM_REACT = "false"; successMsg = "Custom React: OFF"; break;
                    case '4.5': config.HEART_REACT = "true"; successMsg = "Heart React: ON"; break;
                    case '4.6': config.HEART_REACT = "false"; successMsg = "Heart React: OFF"; break;

                    case '5.1': config.AUTO_VOICE = "true"; successMsg = "Auto Voice: ON"; break;
                    case '5.2': config.AUTO_VOICE = "false"; successMsg = "Auto Voice: OFF"; break;
                    case '5.3': config.AUTO_STICKER = "true"; successMsg = "Auto Sticker: ON"; break;
                    case '5.4': config.AUTO_STICKER = "false"; successMsg = "Auto Sticker: OFF"; break;
                    case '5.5': config.AUTO_REPLY = "true"; successMsg = "Auto Reply: ON"; break;
                    case '5.6': config.AUTO_REPLY = "false"; successMsg = "Auto Reply: OFF"; break;
                    case '5.7': config.MENTION_REPLY = "true"; successMsg = "Mention Reply: ON"; break;
                    case '5.8': config.MENTION_REPLY = "false"; successMsg = "Mention Reply: OFF"; break;
                    case '5.9': config.CHAT_BOT = "true"; successMsg = "Chat Bot: ON"; break;
                    case '5.10': config.CHAT_BOT = "false"; successMsg = "Chat Bot: OFF"; break;

                    case '6.1': config.ALWAYS_ONLINE = "true"; successMsg = "Always Online: ON"; break;
                    case '6.2': config.ALWAYS_ONLINE = "false"; successMsg = "Always Online: OFF"; break;
                    case '6.3': config.AUTO_TYPING = "true"; successMsg = "Auto Typing: ON"; break;
                    case '6.4': config.AUTO_TYPING = "false"; successMsg = "Auto Typing: OFF"; break;
                    case '6.5': config.AUTO_RECORDING = "true"; successMsg = "Auto Recording: ON"; break;
                    case '6.6': config.AUTO_RECORDING = "false"; successMsg = "Auto Recording: OFF"; break;

                    case '7.1': config.WELCOME = "true"; successMsg = "Welcome: ON"; break;
                    case '7.2': config.WELCOME = "false"; successMsg = "Welcome: OFF"; break;
                    case '7.3': config.ADMIN_EVENTS = "true"; successMsg = "Admin Events: ON"; break;
                    case '7.4': config.ADMIN_EVENTS = "false"; successMsg = "Admin Events: OFF"; break;
                    case '7.5': config.READ_MESSAGE = "true"; successMsg = "Read Message: ON"; break;
                    case '7.6': config.READ_MESSAGE = "false"; successMsg = "Read Message: OFF"; break;
                    case '7.7': config.READ_CMD = "true"; successMsg = "Read Command: ON"; break;
                    case '7.8': config.READ_CMD = "false"; successMsg = "Read Command: OFF"; break;
                    default: return;
                }

                if (successMsg) {
                    await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
                    return reply(`✅ *SETTING UPDATED*\n\n${successMsg}`);
                }
            }
        });

    } catch (e) {
        console.error(e);
        reply('An error occurred.');
    }
});

cmd({
    pattern: "menu",
    react: "🚀",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {

        let platformName = "Cloud/Vps";
        const hostName = os.hostname();
        const nameLength = hostName.length;

        if (process.env.HEROKU_APP_NAME || nameLength === 36) {
            platformName = "Heroku";
        } else if (process.env.KOYEB_APP_NAME || nameLength === 8) {
            platformName = "Koyeb";
        } else if (process.env.RAILWAY_STATIC_URL || nameLength === 12) {
            platformName = "Railway";
        } else if (process.env.RENDER_SERVICE_NAME || nameLength === 15) {
            platformName = "Render";
        } else if (process.env.PTERODACTYL || nameLength === 10) {
            platformName = "Panel";
        } else if (process.env.REPL_ID || nameLength === 12) {
            platformName = "Replit";
        } else if (process.env.SSH_TTY || nameLength === 6) {
            platformName = "VPS";
        }

        const totalCommands = Object.keys(commands).length;

        const menuCaption = `
        ╭━〔 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳* 〕━··๏
        ┃★╭──────────────
        ┃★│ 👑 Owner : *${config.OWNER_NAME}*
        ┃★│ ⚙️ Mode : *[${config.MODE}]*
        ┃★│ 🔣 Prefix : *[${config.PREFIX}]*
        ┃★│ 🚀 Platform : *${platformName}*
        ┃★│ 🏷️ Version : *2.0.0 Bᴇᴛᴀ*
        ┃★│ 📚 Commands : *${totalCommands}*
        ┃★│ ⏱️ Uptime: *${runtime(process.uptime())}*
        ┃★╰──────────────
        ╰━━━━━━━━━━━━━━┈⊷
        ╭━━〔 *📜 MENU LIST* 〕━━┈⊷
        ┃◈╭─────────────·๏
        ┃◈│ ➊ 🤖 *Ai Menu*
        ┃◈│ ➋ 🔄 *Convert Menu*
        ┃◈│ ➌ 📥 *Download Menu*
        ┃◈│ ➍ 😄 *Fun Menu*
        ┃◈│ ➎ 👥 *Group Menu*
        ┃◈│ ➏ 🖼️ *Imagine Menu*
        ┃◈│ ➐ 🏠 *Main Menu*
        ┃◈│ ➑ 📌 *Other Menu*
        ┃◈│ ➒ 👑 *Owner Menu*
        ┃◈│ ➓ 🔍 *Search Menu*
        ┃◈╰───────────┈⊷
        ╰──────────────┈⊷
        > ${config.DESCRIPTION}`;

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

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363400240662312@newsletter',
                newsletterName: config.OWNER_NAME,
                serverMessageId: 143
            }
        };

        const sendMenuImage = async () => {
            try {
                return await conn.sendMessage(
                from,
                {
                    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/brlkte.jpg' },
                    caption: menuCaption,
                    contextInfo: contextInfo
                },
                { quoted: FakeVCard }
                );
            } catch (e) {
                console.log('Image send failed, falling back to text');
                return await conn.sendMessage(
                from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: FakeVCard }
                );
            }
        };

        let sentMsg;
        try {
            sentMsg = await Promise.race([
            sendMenuImage(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Image send timeout')), 10000))
            ]);
        } catch (e) {
            console.log('Menu send error:', e);
            sentMsg = await conn.sendMessage(
            from,
            { text: menuCaption, contextInfo: contextInfo },
            { quoted: FakeVCard }
            );
        }

        const messageID = sentMsg.key.id;

        const menuData = {
            '1': {
                title: "🤖 *AI Menu* 🤖",
                content: `╭━━━〔 *🤖 Ai Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • ai
                ┃★│ • gpt
                ┃★│ • gemini
                ┃★│ • venice
                ┃★│ • copilot
                ┃★│ • copilot2
                ┃★│ • openai
                ┃★│ • openai2
                ┃★│ • aiimg
                ┃★│ • aiimg1
                ┃★│ • aiimg2
                ┃★│ • aiimg3
                ┃★│ • aianime
                ┃★│ • imgedit
                ┃★│ • topromt
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '2': {
                title: "🔄 *Convert Menu* 🔄",
                content: `╭━━━〔 🔄 *Convert Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • attp
                ┃★│ • caption
                ┃★│ • brat
                ┃★│ • aivoice
                ┃★│ • binary
                ┃★│ • dbinary
                ┃★│ • base64
                ┃★│ • unbase64
                ┃★│ • fetch
                ┃★│ • recolor
                ┃★│ • readmore
                ┃★│ • sticker
                ┃★│ • stake
                ┃★│ • stoimg
                ┃★│ • gsticker
                ┃★│ • tiny
                ┃★│ • tourl
                ┃★│ • img2url
                ┃★│ • tts
                ┃★│ • tts2
                ┃★│ • tts3
                ┃★│ • toptt
                ┃★│ • tomp3
                ┃★│ • topdf
                ┃★│ • translate
                ┃★│ • urlencode
                ┃★│ • urldecode
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '3': {
                title: "📥 *Download Menu* 📥",
                content: `╭━━━〔 📥 *Download Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • apk
                ┃★│ • apk2
                ┃★│ • facebook
                ┃★│ • fb2
                ┃★│ • gdrive
                ┃★│ • gdrive2
                ┃★│ • gitclone
                ┃★│ • image
                ┃★│ • img
                ┃★│ • instagram
                ┃★│ • igvid
                ┃★│ • ig2
                ┃★│ • mediafire
                ┃★│ • mfire2
                ┃★│ • mega
                ┃★│ • mega2
                ┃★│ • pinterest
                ┃★│ • pindl2
                ┃★│ • pins
                ┃★│ • pastpaper
                ┃★│ • pixeldrain
                ┃★│ • ringtone
                ┃★│ • ring2
                ┃★│ • spotify
                ┃★│ • spotify2
                ┃★│ • tiktok
                ┃★│ • tt2
                ┃★│ • tiks
                ┃★│ • twitter
                ┃★│ • twitt2
                ┃★│ • downurl
                ┃★│ • movie
                ┃★│ • xnxx
                ┃★│ • xvideo
                ┃★│ • song
                ┃★│ • song1
                ┃★│ • song2
                ┃★│ • video
                ┃★│ • video1
                ┃★│ • video2
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '4': {
                title: "😄 *Fun Menu* 😄",
                content: `╭━━━〔 😄 *Fun Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • emix
                ┃★│ • angry
                ┃★│ • confused
                ┃★│ • hot
                ┃★│ • happy
                ┃★│ • heart
                ┃★│ • moon
                ┃★│ • sad
                ┃★│ • shy
                ┃★│ • nikal
                ┃★│ • hack
                ┃★│ • msg
                ┃★│ • sends
                ┃★│ • repeat
                ┃★│ • aura
                ┃★│ • 8ball
                ┃★│ • boy
                ┃★│ • girl
                ┃★│ • coinflip
                ┃★│ • character
                ┃★│ • compliment
                ┃★│ • dare
                ┃★│ • emoji
                ┃★│ • fact
                ┃★│ • flip
                ┃★│ • flirt
                ┃★│ • friend
                ┃★│ • joke
                ┃★│ • lovetest
                ┃★│ • pick
                ┃★│ • pickup
                ┃★│ • quote
                ┃★│ • rate
                ┃★│ • roll
                ┃★│ • ship
                ┃★│ • shapar
                ┃★│ • turth
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '5': {
                title: "👥 *Group Menu* 👥",
                content: `╭━━━〔 👥 *Group Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • requestlist
                ┃★│ • acceptall
                ┃★│ • rejectall
                ┃★│ • add
                ┃★│ • invite
                ┃★│ • admin
                ┃★│ • dismiss
                ┃★│ • promote
                ┃★│ • demote
                ┃★│ • ginfo
                ┃★│ • gstates
                ┃★│ • gcstatus
                ┃★│ • hidetag
                ┃★│ • tagall
                ┃★│ • join
                ┃★│ • kick
                ┃★│ • kickall
                ┃★│ • removeall
                ┃★│ • removemembers
                ┃★│ • removeadmins
                ┃★│ • leave
                ┃★│ • glink
                ┃★│ • lock
                ┃★│ • unlock
                ┃★│ • mute
                ┃★│ • unmute
                ┃★│ • newgc
                ┃★│ • out
                ┃★│ • multipoll
                ┃★│ • poll
                ┃★│ • getonline
                ┃★│ • opentime
                ┃★│ • closetime
                ┃★│ • resetglink
                ┃★│ • tagadmins
                ┃★│ • upgdp
                ┃★│ • upgdesc
                ┃★│ • upgname
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '6': {
                title: "🖼️ *Imagine Menu 🖼️*",
                content: `╭━━━〔 🖼️ *Imagine Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • awoo
                ┃★│ • dog
                ┃★│ • imgloli
                ┃★│ • maid
                ┃★│ • megumin
                ┃★│ • waifu
                ┃★│ • neko
                ┃★│ • anime
                ┃★│ • anime1
                ┃★│ • anime2
                ┃★│ • anime3
                ┃★│ • anime4
                ┃★│ • anime5
                ┃★│ • animegirl
                ┃★│ • animegirl1
                ┃★│ • animegirl2
                ┃★│ • animegirl3
                ┃★│ • animegirl4
                ┃★│ • animegirl5
                ┃★│ • imagine
                ┃★│ • imagine2
                ┃★│ • imagine3
                ┃★│ • wallpaper
                ┃★│ • wallpaper2
                ┃★│ • randomwall
                ┃★│ • getimage
                ┃★│ • getvideo
                ┃★│ • imgscan
                ┃★│ • image
                ┃★│ • remini
                ┃★│ • topixel
                ┃★│ • adedit
                ┃★│ • bluredit
                ┃★│ • greyedit
                ┃★│ • invertedit
                ┃★│ • jailedit
                ┃★│ • jokeedit
                ┃★│ • nokiaedit
                ┃★│ • wantededit
                ┃★│ • removebg
                ┃★│ • couplepp
                ┃★│ • bonk
                ┃★│ • bully
                ┃★│ • blush
                ┃★│ • bite
                ┃★│ • cry
                ┃★│ • cuddle
                ┃★│ • cringe
                ┃★│ • dance
                ┃★│ • glomp
                ┃★│ • hug
                ┃★│ • happy
                ┃★│ • handhold
                ┃★│ • highfive
                ┃★│ • kill
                ┃★│ • kiss
                ┃★│ • lick
                ┃★│ • nom
                ┃★│ • pat
                ┃★│ • poke
                ┃★│ • smug
                ┃★│ • slay
                ┃★│ • smile
                ┃★│ • marige
                ┃★│ • wave
                ┃★│ • wink
                ┃★│ • yeet
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '7': {
                title: "🏠 *Main Menu* 🏠",
                content: `╭━━━〔 🏠 *Main Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • alive
                ┃★│ • live
                ┃★│ • menu
                ┃★│ • menu2
                ┃★│ • ping
                ┃★│ • ping2
                ┃★│ • repo
                ┃★│ • system
                ┃★│ • version
                ┃★│ • uptime
                ┃★│ • restart
                ┃★│ • support
                ┃★│ • owner
                ┃★│ • pair
                ┃★│ • bible
                ┃★│ • biblelist
                ┃★│ • logomenu
                ┃★│ • logo
                ┃★│ • setting
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '8': {
                title: "📌 *Other Menu* 📌",
                content: `╭━━━〔 📌 *Other Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • date
                ┃★│ • count
                ┃★│ • countx
                ┃★│ • calculate
                ┃★│ • createapi
                ┃★│ • get
                ┃★│ • gpass
                ┃★│ • sss
                ┃★│ • timenow
                ┃★│ • timezone
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '9': {
                title: "👑 *Owner Menu* 👑",
                content: `╭━━━〔 👑 *Owner Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • prefix
                ┃★│ • anticall
                ┃★│ • antilink
                ┃★│ • antidelete
                ┃★│ • block
                ┃★│ • unblock
                ┃★│ • broadcast
                ┃★│ • bug
                ┃★│ • spam
                ┃★│ • creact
                ┃★│ • ban
                ┃★│ • unban
                ┃★│ • listban
                ┃★│ • setsudo
                ┃★│ • delsudo
                ┃★│ • listsudo
                ┃★│ • vv
                ┃★│ • vv1
                ┃★│ • vv3
                ┃★│ • fullpp
                ┃★│ • setdp
                ┃★│ • setpp
                ┃★│ • getdp
                ┃★│ • getpp
                ┃★│ • update
                ┃★│ • shutdown
                ┃★│ • clearchats
                ┃★│ • delete
                ┃★│ • poststates
                ┃★│ • privacy
                ┃★│ • blocklist
                ┃★│ • getbio
                ┃★│ • setppall
                ┃★│ • setonline
                ┃★│ • setmyname
                ┃★│ • updatebio
                ┃★│ • groupsprivacy
                ┃★│ • getprivacy
                ┃★│ • savecontact
                ┃★│ • settings
                ┃★│ • jid
                ┃★│ • jid2
                ┃★│ • gjid
                ┃★│ • forward
                ┃★│ • fwd2
                ┃★│ • send
                ┃★│ • person
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            },
            '10': {
                title: "🔍 *Search Menu* 🔍",
                content: `╭━━━〔 🔍 *Search Menu* 〕━━━┈⊷
                ┃★╭──────────────
                ┃★│ • app
                ┃★│ • check
                ┃★│ • cid
                ┃★│ • cjid
                ┃★│ • country
                ┃★│ • chinfo
                ┃★│ • currency
                ┃★│ • define
                ┃★│ • fancy
                ┃★│ • getnumber
                ┃★│ • githubstalk
                ┃★│ • lyrics
                ┃★│ • npm
                ┃★│ • news
                ┃★│ • news1
                ┃★│ • news2
                ┃★│ • mvdetail
                ┃★│ • praytime
                ┃★│ • ssweb
                ┃★│ • srepo
                ┃★│ • stickers
                ┃★│ • ttstalk
                ┃★│ • twtstalk
                ┃★│ • tempnumber
                ┃★│ • tempmail
                ┃★│ • vcc
                ┃★│ • yts
                ┃★│ • ytpost
                ┃★│ • ytstalk
                ┃★│ • webinfo
                ┃★│ • weather
                ┃★│ • Wikipedia
                ┃★╰──────────────
                ╰━━━━━━━━━━━━━━┈⊷
                > ${config.DESCRIPTION}`,
                image: true
            }
        };

        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation ||
                    receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];

                        try {
                            if (selectedMenu.image) {
                                await conn.sendMessage(
                                senderID,
                                {
                                    image: { url: config.ALIVE_IMG },
                                    caption: selectedMenu.content,
                                    contextInfo: contextInfo
                                },
                                { quoted: FakeVCard }
                                );
                            } else {
                                await conn.sendMessage(
                                senderID,
                                { text: selectedMenu.content, contextInfo: contextInfo },
                                { quoted: FakeVCard }
                                );
                            }

                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });

                        } catch (e) {
                            console.log('Menu reply error:', e);
                            await conn.sendMessage(
                            senderID,
                            { text: selectedMenu.content, contextInfo: contextInfo },
                            { quoted: FakeVCard }
                            );
                        }

                    } else {
                        await conn.sendMessage(
                        senderID,
                        {
                            text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1-11 to select a menu.\n\n*Example:* Reply with "1" for Download Menu\n\n> ${config.DESCRIPTION}`,
                            contextInfo: contextInfo
                        },
                        { quoted: FakeVCard }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        conn.ev.on("messages.upsert", handler);

        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
            from,
            { text: `❌ Menu system is currently busy. Please try again later.\n\n> ${config.DESCRIPTION}` },
            { quoted: FakeVCard }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});
