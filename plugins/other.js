const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require('axios');
const { fetchJson, sleep } = require('../lib/functions');
const { translate } = require('@vitalets/google-translate-api');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const crypto = require('crypto');

cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isOwner }) => {
    if (config.AUTO_TYPING === 'true') {
        await conn.sendPresenceUpdate('composing', from);
    }
});

cmd({
  on: "body"
},
async (conn, mek, m, { from, body, isOwner }) => {
 if (config.AUTO_RECORDING === 'true') {
                await conn.sendPresenceUpdate('recording', from);
            }
         }
   );

cmd({
  on: "body"
}, async (conn, mek, m, { from }) => {
  try {

    if (config.ALWAYS_ONLINE === "true") {
      await conn.sendPresenceUpdate("available", from);
    }

  } catch (e) {
    console.error("[Presence Error]", e);
  }
});

cmd({
  on: "body"
},
async (conn, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../lib/autoreply.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {

            if (config.AUTO_REPLY === 'true') {

                await m.reply(data[text])

            }
        }
    }
});

cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply,
  sender
}) => {
  try {
    const badWords = ["wtf", "mia", "xxx", "fuck", 'sex', "huththa", "pakaya", 'ponnaya', "hutto"];

    if (!isGroup || isAdmins || !isBotAdmins) {
      return;
    }

    const messageText = body.toLowerCase();
    const containsBadWord = badWords.some(word => messageText.includes(word));

    if (containsBadWord && config.ANTI_BAD_WORD === "true") {
      await conn.sendMessage(from, { 'delete': m.key }, { 'quoted': m });
      await conn.sendMessage(from, { 'text': "🚫 ⚠️ BAD WORDS NOT ALLOWED ⚠️ 🚫" }, { 'quoted': m });
    }
  } catch (error) {
    console.error(error);
    reply("An error occurred while processing the message.");
  }
});

cmd({
  'pattern': "couplepp",
  'react': '💑',
  'desc': "Get a male and female couple profile picture.",
  'category': "image",
  'use': ".couplepp",
  'filename': __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  try {
    reply("*💑 Fetching couple profile pictures...*");

    const response = await axios.get("https://apis.davidcyril.name.ng/couplepp");

    if (!response.data || !response.data.success) {
      return reply("❌ Failed to fetch couple profile pictures. Please try again later.");
    }

    const malePp = response.data.male;
    const femalePp = response.data.female;

    if (malePp) {
      await conn.sendMessage(from, {
        'image': { 'url': malePp },
        'caption': "👨 Male Couple Profile Picture"
      }, { 'quoted': m });
    }

    if (femalePp) {
      await conn.sendMessage(from, {
        'image': { 'url': femalePp },
        'caption': "👩 Female Couple Profile Picture"
      }, { 'quoted': m });
    }

  } catch (error) {
    console.error(error);
    reply("❌ An error occurred while fetching the couple profile pictures.");
  }
});

cmd({
  pattern: "timezone",
  desc: "Get the current time for a specific country.",
  react: "🕰️",
  category: "utility",
  use: ".timezone <country>",
  filename: __filename,
}, async (conn, mek, m, { args, reply }) => {
  try {
    if (args.length === 0) {
      return reply("❌ Please provide a country. Example: `.timezone Pakistan`");
    }

    const country = args.join(" ");
    const apiKey = process.env.IPGEO_API_KEY || "d6ca7264dd77441cbee974717ded084d";
    const url = `https://api.ipgeolocation.io/timezone?apiKey=${apiKey}&country=${encodeURIComponent(country)}`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.date_time) {
      return reply("❌ Unable to fetch time for the specified country. Please check your input.");
    }

    const message = `🕰️ *Current Time in ${data.country_name}*\n\n` +
                    `📅 Date & Time: ${data.date_time}\n` +
                    `⌚ Time Zone: ${data.timezone}`;

    reply(message);

  } catch (error) {
    console.error("Error fetching time:", error.message);
    reply("❌ Sorry, I couldn't fetch the time. Please check your input and try again.");
  }
});

cmd({
  pattern: "wikipedia",
  alias: ["wiki"],
  react: "📖",
  desc: "Fetch Wikipedia information and translate to English.",
  category: "information",
  filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
  try {
    if (!q) {
      return reply("Please provide a search query for Wikipedia.");
    }

    await reply("Searching Wikipedia...");

    const response = await fetchJson(`https://api.siputzx.my.id/api/s/wikipedia?query=${encodeURIComponent(q)}`);

    if (!response.status || !response.data) {
      return reply("No results found for your query.");
    }

    const { wiki, thumb } = response.data;

    const translated = await translate(wiki, { to: "en" });

    let message = `📖 *Wikipedia Result*\n\n📝 *Query:* ${q}\n\n${translated.text}`;

    if (thumb) {
      await conn.sendMessage(m.chat, {
        image: { url: thumb },
        caption: message
      });
    } else {
      await reply(message);
    }

  } catch (error) {
    console.error(error);
    reply("An error occurred: " + error.message);
  }
});

const linkPatterns = [
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
  /^https?:\/\/(www\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)$/,
  /wa\.me\/\S+/gi,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
  /https?:\/\/youtu\.be\/\S+/gi,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
  /https?:\/\/fb\.me\/\S+/gi,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
  /https?:\/\/ngl\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
];

cmd({
  on: 'body'
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins
}) => {
  try {
    if (!isGroup || isAdmins || !isBotAdmins) {
      return;
    }

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    if (containsLink && config.DELETE_LINKS === 'true') {
      await conn.sendMessage(from, { delete: m.key }, { quoted: m });
    }
  } catch (error) {
    console.error(error);
  }
});

cmd({
    pattern: "report",
    alias: ["ask", "bug", "request"],
    desc: "Report a bug or request a feature",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, {
    from, body, command, args, senderNumber, reply
}) => {
    try {
        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("Only the bot owner can use this command.");
        }

        if (!args.length) {
            return reply(`Example: ${config.PREFIX}report Play command is not working`);
        }

        const reportedMessages = {};
        const devNumber = "94771825192";
        const messageId = m.key.id;

        if (reportedMessages[messageId]) {
            return reply("This report has already been forwarded to the owner. Please wait for a response.");
        }
        reportedMessages[messageId] = true;

        const reportText = `*| REQUEST/BUG |*\n\n*User*: @${m.sender.split("@")[0]}\n*Request/Bug*: ${args.join(" ")}`;
        const confirmationText = `Hi ${m.pushName}, your request has been forwarded to the owner. Please wait...`;

        await conn.sendMessage(`${devNumber}@s.whatsapp.net`, {
            text: reportText,
            mentions: [m.sender]
        }, { quoted: m });

        reply(confirmationText);
    } catch (error) {
        console.error(error);
        reply("An error occurred while processing your report.");
    }
});

cmd({
  pattern: "sss",
  react: "💫",
  desc: "Capture a full-page screenshot of a website.",
  category: "utility",
  use: ".sss <url>",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const url = args[0];
    if (!url) {
      return reply("❌ Please provide a valid URL. Example: `.screenshot https://github.com`");
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return reply("❌ Invalid URL. Please include 'http://' or 'https://'.");
    }

    const screenshotUrl = `https://image.thum.io/get/fullpage/${url}`;

    await conn.sendMessage(from, {
      image: { url: screenshotUrl },
      caption: `*WEB SS DOWNLOADER*\n\n> *© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`,
      contextInfo: {
        mentionedJid: [msg.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400240662312@newsletter',
          newsletterName: "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
          serverMessageId: 143,
        },
      },
    }, { quoted: mek });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ Failed to capture the screenshot. Please try again.");
  }
});

cmd({
  pattern: "tiktoksearch",
  alias: ["tiktoks", "tiks"],
  desc: "Search for TikTok videos using a query.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  if (!args[0]) {
    return reply("🌸 What do you want to search on TikTok?\n\n*Usage Example:*\n.tiktoksearch <query>");
  }

  const query = args.join(" ");
  await store.react('⌛');

  try {
    reply(`🔎 Searching TikTok for: *${query}*`);

    const response = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      await store.react('❌');
      return reply("❌ No results found for your query. Please try with a different keyword.");
    }

    const results = data.data.slice(0, 5).sort(() => Math.random() - 0.5);

    for (const video of results) {
      const message = `🌸 *TikTok Video Result*:\n\n`
        + `*• Title*: ${video.title}\n`
        + `*• Author*: ${video.author || 'Unknown'}\n`
        + `*• Duration*: ${video.duration || "Unknown"}\n`
        + `*• URL*: ${video.link}\n\n`;

      if (video.nowm) {
        await conn.sendMessage(from, {
          video: { url: video.nowm },
          caption: message
        }, { quoted: m });
      } else {
        reply(`❌ Failed to retrieve video for *"${video.title}"*.`);
      }
    }

    await store.react('✅');
  } catch (error) {
    console.error("Error in TikTokSearch command:", error);
    await store.react('❌');
    reply("❌ An error occurred while searching TikTok. Please try again later.");
  }
});

cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {
    if (!isGroup || isAdmins || !isBotAdmins) {
      return;
    }

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    if (containsLink && config.ANTI_LINK_KICK === 'true') {
      await conn.sendMessage(from, { 'delete': m.key }, { 'quoted': m });
      await conn.sendMessage(from, {
        'text': `⚠️ Links are not allowed in this group.\n@${sender.split('@')[0]} has been removed. 🚫`,
        'mentions': [sender]
      }, { 'quoted': m });

      await conn.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (error) {
    console.error(error);
    reply("An error occurred while processing the message.");
  }
});

cmd({
  pattern: "fullpp2",
  alias: ["setpp", "setdp"],
  react: "🖼️",
  desc: "Set full image as bot's profile picture",
  category: "tools",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {

    const botJid = client.user?.id || (client.user.id.split(":")[0] + "@s.whatsapp.net");

    if (message.sender !== botJid && !isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This command can only be used by the bot or its owner.*"
      }, { quoted: message });
    }

    if (!message.quoted || !message.quoted.mtype || !message.quoted.mtype.includes("image")) {
      return await client.sendMessage(from, {
        text: "*⚠️ Please reply to an image to set as profile picture*"
      }, { quoted: message });
    }

    await client.sendMessage(from, {
      text: "*⏳ Processing image, please wait...*"
    }, { quoted: message });

    const imageBuffer = await message.quoted.download();
    const image = await Jimp.read(imageBuffer);

    const blurredBg = image.clone().cover(640, 640).blur(10);
    const centeredImage = image.clone().contain(640, 640);
    blurredBg.composite(centeredImage, 0, 0);
    const finalImage = await blurredBg.getBufferAsync(Jimp.MIME_JPEG);

    await client.updateProfilePicture(botJid, finalImage);

    await client.sendMessage(from, {
      text: "*✅ Bot's profile picture updated successfully!*"
    }, { quoted: message });

  } catch (error) {
    console.error("fullpp Error:", error);
    await client.sendMessage(from, {
      text: `*❌ Error updating profile picture:*\n${error.message}`
    }, { quoted: message });
  }
});

cmd({
    pattern: "wstalk",
    alias: ["channelstalk", "chinfo"],
    desc: "Get WhatsApp channel information",
    category: "utility",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {

        if (!args) return reply("❌ Please provide a WhatsApp channel URL\nExample: .wstalk https://whatsapp.com/channel/0029Vad7YNyJuyA77CtIPX0x");

        const channelId = args.match(/channel\/([0-9A-Za-z]+)/i)?.[1];
        if (!channelId) return reply("❌ Invalid WhatsApp channel URL");

        const apiUrl = `https://itzpire.com/stalk/whatsapp-channel?url=https://whatsapp.com/channel/${channelId}`;

        const response = await axios.get(apiUrl);
        const data = response.data.data;

        const channelInfo = `╭━━〔 *CHANNEL INFO* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• *📢 Title*: ${data.title}
┃◈┃• *👥 Followers*: ${data.followers}
┃◈┃• *📝 Description*: ${data.description.replace(/\n/g, '\n┃◈┃• ')}
┃◈└───────────┈⊷
╰──────────────┈⊷
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

        await conn.sendMessage(from, {
            image: { url: data.img },
            caption: channelInfo,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in wstalk command:", e);
        reply(`❌ Error: ${e.response?.data?.message || e.message}`);
    }
});

let numberCache = {};

cmd({
    pattern: "getname",
    alias: ["getnumber"],
    react: "🔎",
    desc: "Get a Truecaller-style lookup for a phone number.",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { reply, q }) => {
    try {
        if (!q) return reply("❌ Please provide a phone number.\n👉 Example: /getname +94771825xxx");

        const num = q.replace(/[\s()-]/g, "");

        if (numberCache[num]) return reply(numberCache[num]);

        let contactName = num;
        try {
            const contact = await conn.onWhatsApp(num);
            if (contact && contact.length > 0 && contact[0].exists) {
                contactName = contact[0].notify || num;
            }
        } catch {  }

        const apiKey = "5fae6e0f3e530c6e638b6b924c6fddd3";
        const url = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${encodeURIComponent(num)}`;
        const res = await axios.get(url);
        const data = res.data;

        let msg = `🛑 *Phone Lookup Result* ✅\n\n`;
        msg += `👤 Name: ${contactName}\n`;
        msg += `📞 Number: ${num}\n`;
        msg += `✅ Valid: ${data.valid ? "Yes" : "No"}\n`;
        msg += `🌍 Country: ${data.country_name || "Unknown"} (${data.country_code || "-"})\n`;
        msg += `📍 Location: ${data.location || "Unknown"}\n`;
        msg += `📡 Carrier: ${data.carrier || "Unknown"}\n`;
        msg += `📱 Line Type: ${data.line_type || "Unknown"}\n`;

        numberCache[num] = msg;

        reply(msg);

    } catch (e) {
        console.error("Error in getname:", e);
        reply("❌ Failed to fetch number details. Please check your API or try again.");
    }
});

cmd({
  pattern: "post",
  alias: ["poststatus", "status", "story", "repost", "reshare"],
  react: '📝',
  desc: "Posts replied media to bot's status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner-only command.*"
      }, { quoted: message });
    }

    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType) {
      return await client.sendMessage(message.chat, {
        text: "*Please reply to an image, video, or audio file.*"
      }, { quoted: message });
    }

    const buffer = await quotedMsg.download();
    const mtype = quotedMsg.mtype;
    const caption = quotedMsg.text || '';

    let statusContent = {};

    switch (mtype) {
      case "imageMessage":
        statusContent = {
          image: buffer,
          caption: caption
        };
        break;
      case "videoMessage":
        statusContent = {
          video: buffer,
          caption: caption
        };
        break;
      case "audioMessage":
        statusContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: quotedMsg.ptt || false
        };
        break;
      default:
        return await client.sendMessage(message.chat, {
          text: "Only image, video, and audio files can be posted to status."
        }, { quoted: message });
    }

    await client.sendMessage("status@broadcast", statusContent);

    await client.sendMessage(message.chat, {
      text: "✅ Status Uploaded Successfully."
    }, { quoted: message });

  } catch (error) {
    console.error("Status Error:", error);
    await client.sendMessage(message.chat, {
      text: "❌ Failed to post status:\n" + error.message
    }, { quoted: message });
  }
});

cmd({
    pattern: "countryinfo",
    alias: ["cinfo", "country","cinfo2"],
    desc: "Get information about a country",
    category: "info",
    react: "🌍",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a country name.\nExample: `.countryinfo Sri Lanka`");

        const apiUrl = `https://api.siputzx.my.id/api/tools/countryInfo?name=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) {
            await react("❌");
            return reply(`No information found for *${q}*. Please check the country name.`);
        }

        const info = data.data;
        let neighborsText = info.neighbors.length > 0
            ? info.neighbors.map(n => `🌍 *${n.name}*`).join(", ")
            : "No neighboring countries found.";

        const text = `🌍 *Country Information: ${info.name}* 🌍\n\n` +
                     `🏛 *Capital:* ${info.capital}\n` +
                     `📍 *Continent:* ${info.continent.name} ${info.continent.emoji}\n` +
                     `📞 *Phone Code:* ${info.phoneCode}\n` +
                     `📏 *Area:* ${info.area.squareKilometers} km² (${info.area.squareMiles} mi²)\n` +
                     `🚗 *Driving Side:* ${info.drivingSide}\n` +
                     `💱 *Currency:* ${info.currency}\n` +
                     `🔤 *Languages:* ${info.languages.native.join(", ")}\n` +
                     `🌟 *Famous For:* ${info.famousFor}\n` +
                     `🌍 *ISO Codes:* ${info.isoCode.alpha2.toUpperCase()}, ${info.isoCode.alpha3.toUpperCase()}\n` +
                     `🌎 *Internet TLD:* ${info.internetTLD}\n\n` +
                     `🔗 *Neighbors:* ${neighborsText}`;

        await conn.sendMessage(from, {
            image: { url: info.flag },
            caption: text,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

        await react("✅");
    } catch (e) {
        console.error("Error in countryinfo command:", e);
        await react("❌");
        reply("An error occurred while fetching country information.");
    }
});

cmd({
  pattern: "gpass",
  desc: "Generate a strong password with customizable options.",
  category: "other",
  react: '🔐',
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  body,
  isCmd,
  command,
  args,
  q,
  isGroup,
  sender,
  senderNumber,
  botNumber2,
  botNumber,
  pushname,
  isMe,
  isOwner,
  groupMetadata,
  groupName,
  participants,
  groupAdmins,
  isBotAdmins,
  isAdmins,
  reply
}) => {
  try {

    let passwordLength = args[0] ? parseInt(args[0]) : 12;
    const passwordType = args[1] || 'all';

    if (isNaN(passwordLength) || passwordLength < 8) {
      return reply("❌ Please provide a valid length for the password (Minimum 8 Characters).");
    }

    const sets = {
      letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+[]{}|;:,.<>?'
    };

    let allChars = sets.letters + sets.numbers + sets.symbols;
    let passwordChars = '';

    if (passwordType === 'letters') {
      passwordChars = sets.letters;
    } else if (passwordType === 'numbers') {
      passwordChars = sets.numbers;
    } else if (passwordType === 'symbols') {
      passwordChars = sets.symbols;
    } else {
      passwordChars = allChars;
    }

    const generatePassword = (length) => {
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, passwordChars.length);
        password += passwordChars[randomIndex];
      }
      return password;
    };

    const generatedPassword = generatePassword(passwordLength);

    const strength = passwordLength > 16 ? 'Very Strong' : passwordLength > 12 ? 'Strong' : 'Medium';

    await conn.sendMessage(from, {
      text: `🔐 *Your Strong Password* 🔐\n\nHere is your generated password (${strength}):\n\n*${generatedPassword}*\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
    }, {
      quoted: quoted
    });

  } catch (error) {
    console.error(error);
    reply("❌ Error generating password: " + error.message);
  }
});

cmd({
  pattern: "screenshot",
  react: "🌐",
  alias: ["ss", "ssweb"],
  desc: "Capture a full-page screenshot of a website.",
  category: "utility",
  use: ".screenshot <url>",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const url = args[0];
    if (!url) return reply("❌ Please provide a URL\nExample: .screenshot https://google.com");
    if (!url.startsWith("http")) return reply("❌ URL must start with http:// or https://");

    const loadingBars = [
        { percent: 10, bar: "[▓░░░░░░░░░]", text: "✦ Initializing capture..." },
        { percent: 20, bar: "[▓▓░░░░░░░░]", text: "✦ Connecting to website..." },
        { percent: 30, bar: "[▓▓▓░░░░░░░]", text: "✦ Loading page content..." },
        { percent: 40, bar: "[▓▓▓▓░░░░░░]", text: "✦ Rendering elements..." },
        { percent: 50, bar: "[▓▓▓▓▓░░░░░]", text: "✦ Processing JavaScript..." },
        { percent: 60, bar: "[▓▓▓▓▓▓░░░░]", text: "✦ Capturing viewport..." },
        { percent: 70, bar: "[▓▓▓▓▓▓▓░░░]", text: "✦ Scrolling page..." },
        { percent: 80, bar: "[▓▓▓▓▓▓▓▓░░]", text: "✦ Finalizing screenshot..." },
        { percent: 90, bar: "[▓▓▓▓▓▓▓▓▓░]", text: "✦ Optimizing image..." },
        { percent: 100, bar: "[▓▓▓▓▓▓▓▓▓▓]", text: "✓ Capture complete!" }
    ];

    const loadingMsg = await conn.sendMessage(from, {
        text: "🔄 Starting screenshot capture...\n✦ Please wait..."
    }, { quoted: mek });

    for (const frame of loadingBars) {
        await sleep(800);
        await conn.relayMessage(from, {
            protocolMessage: {
                key: loadingMsg.key,
                type: 14,
                editedMessage: {
                    conversation: `📸 ${frame.bar} ${frame.percent}%\n${frame.text}`
                }
            }
        }, {});
    }

    await sleep(800);
    await conn.relayMessage(from, {
        protocolMessage: {
            key: loadingMsg.key,
            type: 14,
            editedMessage: {
                conversation: "✅ Screenshot Captured!\n✦ Sending now..."
            }
        }
    }, {});

    await sleep(1000);

    await conn.sendMessage(from, {
        image: { url: `https://image.thum.io/get/fullpage/${url}` },
        caption: "- 🖼️ *Screenshot Generated*\n\n" +
                "> Its 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 say it beiby 🎭"
    }, { quoted: mek });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ Failed to capture screenshot\n✦ Please try again later");
  }
});

const BASE_URL = "https://v6.exchangerate-api.com/v6";
const API_KEY = "9c8b8532d40e5da04fac9772";

cmd({
    pattern: "convertmoney",
    react: "💸",
    alias: ["currency", "cvmoney"],
    desc: "Convert money from one currency to another currency",
    category: "utility",
    use: ".currency amount fromCurrency toCurrency (e.g: .convert 100 USD EUR)",
    filename: __filename,
}, async (conn, mek, msg, { from, reply, args }) => {
    try {
        if (args.length !== 3) {
            return reply("*⭕ ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ! ᴜsᴇ: .ᴄᴜʀʀᴇɴᴄʏ ᴀᴍᴏᴜɴᴛ ғʀᴏᴍᴄᴜʀʀᴇɴᴄʏ ᴛᴏᴄᴜʀʀᴇɴᴄʏ*\n*ᴇxᴀᴍᴘʟᴇ: .ᴄᴜʀʀᴇɴᴄʏ 𝟷𝟶𝟶 ᴜsᴅ ᴘᴋʀ*");
        }

        const amount = parseFloat(args[0]);
        const fromCurrency = args[1].toUpperCase();
        const toCurrency = args[2].toUpperCase();

        if (isNaN(amount)) {
            return reply("*❌ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ ᴀᴍᴏᴜɴᴛ!*");
        }

        const response = await axios.get(`${BASE_URL}/${API_KEY}/latest/${fromCurrency}`);

        if (response.data.result === "error") {
            throw new Error(response.data["error-type"]);
        }

        const rates = response.data.conversion_rates;

        if (!rates[toCurrency]) {
            return reply("*❌ ɪɴᴠᴀʟɪᴅ ᴛᴀʀɢᴇᴛ ᴄᴜʀʀᴇɴᴄʏ ᴄᴏᴅᴇ! ᴘʟᴇᴀsᴇ ᴜsᴇ ᴠᴀʟɪᴅ ᴄᴜʀʀᴇɴᴄʏ ᴄᴏᴅᴇs ʟɪᴋᴇ ᴜsᴅ, ᴇᴜʀ, ɢʙᴘ, ᴇᴛᴄ.*");
        }

        const convertedAmount = (amount * rates[toCurrency]).toFixed(2);
        const formattedAmount = new Intl.NumberFormat().format(amount);
        const formattedResult = new Intl.NumberFormat().format(convertedAmount);

        const message = `*🌍 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 CURRENCY CONVERSION 💵*\n\n` +
            `*💲 Form:* ${formattedAmount} ${fromCurrency}\n` +
            `*🏷️ To:* ${formattedResult} ${toCurrency}\n` +
            `*💰 Rate:* 1 ${fromCurrency} = ${rates[toCurrency]} ${toCurrency}\n\n` +
            `*⏰ Last Updated:* ${response.data.time_last_update_utc}`;

        reply(message);

    } catch (error) {
        console.error("Currency conversion error:", error);

        if (error.message === "unsupported-code") {
            reply("❌ Invalid currency code! Please use valid currency codes like USD, EUR, GBP, etc.");
        } else if (error.message === "malformed-request") {
            reply("❌ Invalid API request format. Please try again.");
        } else if (error.message === "invalid-key") {
            reply("❌ API key validation failed. Please contact the administrator.");
        } else if (error.message === "inactive-account") {
            reply("❌ API account is not active. Please contact the administrator.");
        } else if (error.message === "quota-reached") {
            reply("❌ API quota has been reached. Please try again later.");
        } else {
            reply("❌ Failed to convert currency. Please try again later.");
        }
    }
});

cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {

    if (!global.warnings) {
      global.warnings = {};
    }

    if (!isGroup || isAdmins || !isBotAdmins) {
      return;
    }

    const linkPatterns = [
      /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
      /https?:\/\/(?:api\.whatsapp\.com|wa\.me)\/\S+/gi,
      /wa\.me\/\S+/gi,
      /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
      /https?:\/\/(?:www\.)?\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
      /https?:\/\/(?:whatsapp\.com|channel\.me)\/\S+/gi,
      /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
      /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
    ];

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    if (containsLink && config.ANTI_LINK === 'true') {
      console.log(`Link detected from ${sender}: ${body}`);

      try {
        await conn.sendMessage(from, {
          delete: m.key
        });
        console.log(`Message deleted: ${m.key.id}`);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }

      global.warnings[sender] = (global.warnings[sender] || 0) + 1;
      const warningCount = global.warnings[sender];

      if (warningCount < 4) {

        await conn.sendMessage(from, {
          text: `‎*⚠️LINKS ARE NOT ALLOWED⚠️*\n` +
                `*╭────⬡ WARNING ⬡────*\n` +
                `*├▢ USER :* @${sender.split('@')[0]}!\n` +
                `*├▢ COUNT : ${warningCount}*\n` +
                `*├▢ REASON : LINK SENDING*\n` +
                `*├▢ WARN LIMIT : 3*\n` +
                `*╰────────────────*`,
          mentions: [sender]
        });
      } else {

        await conn.sendMessage(from, {
          text: `@${sender.split('@')[0]} *HAS BEEN REMOVED - WARN LIMIT EXCEEDED!*`,
          mentions: [sender]
        });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        delete global.warnings[sender];
      }
    }
  } catch (error) {
    console.error("Anti-link error:", error);
    reply("❌ An error occurred while processing the message.");
  }
});

cmd({
    pattern: "createapi",
    desc: "Create a custom API endpoint",
    alias: ["makeapi", "apimaker"],
    category: "utility",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        if (!q) {
            return reply(`
*🌐 API CREATOR GUIDE*

🔹 Usage: .createapi <METHOD> <ENDPOINT> <RESPONSE_TYPE>

📌 *Examples:*
.createapi GET /users json
.createapi POST /create-user json
.createapi PUT /update-product json

📝 *Parameters:*
- METHOD: GET, POST, PUT, DELETE
- ENDPOINT: Must start with '/'
- RESPONSE_TYPE: json, text, xml
`);
        }

        const parts = q.split(/\s+/);
        if (parts.length < 3) {
            return reply("⚠️ *Invalid format!* Use: `.createapi <METHOD> <ENDPOINT> <RESPONSE_TYPE>`");
        }

        const [method, endpoint, responseType] = parts;

        const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
        if (!validMethods.includes(method.toUpperCase())) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`⚠️ *Invalid method!* Choose from: ${validMethods.join(', ')}`);
        }

        if (!endpoint.startsWith('/')) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("⚠️ *Endpoint must start with '/'* (e.g., `/users`)");
        }

        const validResponseTypes = ['json', 'text', 'xml'];
        if (!validResponseTypes.includes(responseType.toLowerCase())) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`⚠️ *Invalid response type!* Choose from: ${validResponseTypes.join(', ')}`);
        }

        await m.react("🔧");

        const apiStructure = {
            method: method.toUpperCase(),
            endpoint: endpoint,
            responseType: responseType.toLowerCase(),
            createdAt: new Date().toISOString(),
            status: "draft"
        };

        const responseTemplates = {
            json: { status: true, message: "API endpoint created successfully", data: {} },
            text: "API endpoint created successfully",
            xml: `<?xml version="1.0" encoding="UTF-8"?><api><status>true</status><message>API endpoint created successfully</message></api>`
        };

        const responseTemplate = responseTemplates[responseType.toLowerCase()];

        const apiCode = `
// ${apiStructure.method} ${apiStructure.endpoint}
app.${apiStructure.method.toLowerCase()}('${apiStructure.endpoint}', (req, res) => {
    try {
        // Your API logic here
        res.${apiStructure.responseType}(${JSON.stringify(responseTemplate, null, 2)});
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});
`;

        await reply(`
*🌐 API ENDPOINT CREATED*

📍 Method: *${apiStructure.method}*
🔗 Endpoint: *${apiStructure.endpoint}*
📦 Response Type: *${apiStructure.responseType}*
⏰ Created: *${apiStructure.createdAt}*

*📝 Sample Implementation:*
\`\`\`javascript
${apiCode}
\`\`\`

*📋 Sample Response:*
\`\`\`${apiStructure.responseType}
${JSON.stringify(responseTemplate, null, 2)}
\`\`\`
`);

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("API Creation Error:", error);

        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });

        await reply(`
❌ *API Creation Failed*
🔍 Error: ${error.message}
📝 Please try again
`);
    }
});

cmd({
    pattern: "tempnum",
    alias: ["fakenum", "tempnumber"],
    desc: "Get temporary numbers & OTP instructions",
    category: "tools",
    react: "📱",
    use: "<country-code>"
},
async (conn, mek, m, { from, args, reply }) => {
    try {

        if (!args || args.length < 1) {
            return reply(`❌ *Usage:* .tempnum <country-code>\nExample: .tempnum us\n\n📦 Use .otpbox <number>* to check OTPs`);
        }

        const countryCode = args[0].toLowerCase();

        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${countryCode}`,
            {
                timeout: 10000,
                validateStatus: status => status === 200
            }
        );

        if (!data?.result || !Array.isArray(data.result)) {
            console.error("Invalid API structure:", data);
            return reply(`⚠ Invalid API response format\nTry .tempnum us`);
        }

        if (data.result.length === 0) {
            return reply(`📭 No numbers available for *${countryCode.toUpperCase()}*\nTry another country code!\n\nUse .otpbox <number> after selection`);
        }

        const numbers = data.result.slice(0, 25);
        const numberList = numbers.map((num, i) =>
            `${String(i+1).padStart(2, ' ')}. ${num.number}`
        ).join("\n");

        await reply(
            `╭──「 📱 TEMPORARY NUMBERS 」\n` +
            `│\n` +
            `│ Country: ${countryCode.toUpperCase()}\n` +
            `│ Numbers Found: ${numbers.length}\n` +
            `│\n` +
            `${numberList}\n\n` +
            `╰──「 📦 USE: .otpbox <number> 」\n` +
            `_Example: .otpbox +1234567890_`
        );

    } catch (err) {
        console.error("API Error:", err);
        const errorMessage = err.code === "ECONNABORTED" ?
            `⏳ *Timeout*: API took too long\nTry smaller country codes like 'us', 'gb'` :
            `⚠ *Error*: ${err.message}\nUse format: .tempnum <country-code>`;

        reply(`${errorMessage}\n\n🔑 Remember: ${prefix}otpinbox <number>`);
    }
});

cmd({
    pattern: "templist",
    alias: ["tempnumberlist", "tempnlist", "listnumbers"],
    desc: "Show list of countries with temp numbers",
    category: "tools",
    react: "🌍",
    filename: __filename,
    use: ".templist"
},
async (conn, m, { reply }) => {
    try {
        const { data } = await axios.get("https://api.vreden.my.id/api/tools/fakenumber/country");

        if (!data || !data.result) return reply("❌ Couldn't fetch country list.");

        const countries = data.result.map((c, i) => `*${i + 1}.* ${c.title} \`(${c.id})\``).join("\n");

        await reply(`🌍 *Total Available Countries:* ${data.result.length}\n\n${countries}`);
    } catch (e) {
        console.error("TEMP LIST ERROR:", e);
        reply("❌ Failed to fetch temporary number country list.");
    }
});

cmd({
    pattern: "otpbox",
    alias: ["checkotp", "getotp"],
    desc: "Check OTP messages for temporary number",
    category: "tools",
    react: "🔑",
    use: "<full-number>"
},
async (conn, mek, m, { from, args, reply }) => {
    try {

        if (!args[0] || !args[0].startsWith("+")) {
            return reply(`❌ *Usage:* .otpbox <full-number>\nExample: .otpbox +254732297xx`);
        }

        const phoneNumber = args[0].trim();

        const { data } = await axios.get(
            `https://api.vreden.my.id/api/tools/fakenumber/message?nomor=${encodeURIComponent(phoneNumber)}`,
            {
                timeout: 10000,
                validateStatus: status => status === 200
            }
        );

        if (!data?.result || !Array.isArray(data.result)) {
            return reply("⚠ No OTP messages found for this number");
        }

        const otpMessages = data.result.map(msg => {

            const otpMatch = msg.content.match(/\b\d{4,8}\b/g);
            const otpCode = otpMatch ? otpMatch[0] : "Not found";

            return `┌ *From:* ${msg.from || "Unknown"}
│ *Code:* ${otpCode}
│ *Time:* ${msg.time_wib || msg.timestamp}
└ *Message:* ${msg.content.substring(0, 50)}${msg.content.length > 50 ? "..." : ""}`;
        }).join("\n\n");

        await reply(
            `╭──「 🔑 OTP MESSAGES 」\n` +
            `│ Number: ${phoneNumber}\n` +
            `│ Messages Found: ${data.result.length}\n` +
            `│\n` +
            `${otpMessages}\n` +
            `╰──「 📌 Use .tempnum to get numbers 」`
        );

    } catch (err) {
        console.error("OTP Check Error:", err);
        const errorMsg = err.code === "ECONNABORTED" ?
            "⌛ OTP check timed out. Try again later" :
            `⚠ Error: ${err.response?.data?.error || err.message}`;

        reply(`${errorMsg}\n\nUsage: .otpbox +2547322xx`);
    }
});

cmd({
    pattern: "rcolor",
    desc: "Generate a random color with name and code.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { reply }) => {
    try {
        const colorNames = [
            "Red", "Green", "Blue", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White",
            "Gray", "Cyan", "Magenta", "Violet", "Indigo", "Teal", "Lavender", "Turquoise"
        ];

        const randomColorHex = "#" + Math.floor(Math.random()*16777215).toString(16);
        const randomColorName = colorNames[Math.floor(Math.random() * colorNames.length)];

        reply(`🎨 *Random Color:* \nName: ${randomColorName}\nCode: ${randomColorHex}`);
    } catch (e) {
        console.error("Error in .randomcolor command:", e);
        reply("❌ An error occurred while generating the random color.");
    }
});

cmd({
    pattern: "binary",
    desc: "Convert text into binary format.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {
        if (!args.length) return reply("❌ Please provide the text to convert to binary.");

        const textToConvert = args.join(" ");
        const binaryText = textToConvert.split('').map(char => {
            return `00000000${char.charCodeAt(0).toString(2)}`.slice(-8);
        }).join(' ');

        reply(`🔑 *Binary Representation:* \n${binaryText}`);
    } catch (e) {
        console.error("Error in .binary command:", e);
        reply("❌ An error occurred while converting to binary.");
    }
});

cmd({
    pattern: "dbinary",
    desc: "Decode binary string into text.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {
        if (!args.length) return reply("❌ Please provide the binary string to decode.");

        const binaryString = args.join(" ");
        const textDecoded = binaryString.split(' ').map(bin => {
            return String.fromCharCode(parseInt(bin, 2));
        }).join('');

        reply(`🔓 *Decoded Text:* \n${textDecoded}`);
    } catch (e) {
        console.error("Error in .binarydecode command:", e);
        reply("❌ An error occurred while decoding the binary string.");
    }
});

cmd({
    pattern: "base64",
    desc: "Encode text into Base64 format.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {

        if (!args.length) return reply("❌ Please provide the text to encode into Base64.");

        const textToEncode = args.join(" ");

        const encodedText = Buffer.from(textToEncode).toString('base64');

        reply(`🔑 *Encoded Base64 Text:* \n${encodedText}`);
    } catch (e) {
        console.error("Error in .base64 command:", e);
        reply("❌ An error occurred while encoding the text into Base64.");
    }
});

cmd({
    pattern: "unbase64",
    desc: "Decode Base64 encoded text.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {

        if (!args.length) return reply("❌ Please provide the Base64 encoded text to decode.");

        const base64Text = args.join(" ");

        const decodedText = Buffer.from(base64Text, 'base64').toString('utf-8');

        reply(`🔓 *Decoded Text:* \n${decodedText}`);
    } catch (e) {
        console.error("Error in .unbase64 command:", e);
        reply("❌ An error occurred while decoding the Base64 text.");
    }
});

cmd({
    pattern: "urlencode",
    desc: "Encode text into URL encoding.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {
        if (!args.length) return reply("❌ Please provide the text to encode into URL encoding.");

        const textToEncode = args.join(" ");
        const encodedText = encodeURIComponent(textToEncode);

        reply(`🔑 *Encoded URL Text:* \n${encodedText}`);
    } catch (e) {
        console.error("Error in .urlencode command:", e);
        reply("❌ An error occurred while encoding the text.");
    }
});

cmd({
    pattern: "urldecode",
    desc: "Decode URL encoded text.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {
        if (!args.length) return reply("❌ Please provide the URL encoded text to decode.");

        const encodedText = args.join(" ");
        const decodedText = decodeURIComponent(encodedText);

        reply(`🔓 *Decoded Text:* \n${decodedText}`);
    } catch (e) {
        console.error("Error in .urldecode command:", e);
        reply("❌ An error occurred while decoding the URL encoded text.");
    }
});

cmd({
    pattern: "roll",
    desc: "Roll a dice (1-6).",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { reply }) => {
    try {

        const result = Math.floor(Math.random() * 6) + 1;

        reply(`🎲 You rolled: *${result}*`);
    } catch (e) {
        console.error("Error in .roll command:", e);
        reply("❌ An error occurred while rolling the dice.");
    }
});

cmd({
    pattern: "coinflip",
    desc: "Flip a coin and get Heads or Tails.",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { reply }) => {
    try {

        const result = Math.random() < 0.5 ? "Heads" : "Tails";

        reply(`🪙 Coin Flip Result: *${result}*`);
    } catch (e) {
        console.error("Error in .coinflip command:", e);
        reply("❌ An error occurred while flipping the coin.");
    }
});

cmd({
    pattern: "flip",
    desc: "Flip the text you provide.",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {

        if (!args.length) return reply("❌ Please provide the text to flip.");

        const flippedText = args.join(" ").split('').reverse().join('');

        reply(`🔄 Flipped Text: *${flippedText}*`);
    } catch (e) {
        console.error("Error in .flip command:", e);
        reply("❌ An error occurred while flipping the text.");
    }
});

cmd({
    pattern: "pick",
    desc: "Pick between two choices.",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {

        if (args.length < 2) return reply("❌ Please provide two choices to pick from. Example: `.pick Ice Cream, Pizza`");

        const option = args.join(" ").split(',')[Math.floor(Math.random() * 2)].trim();

        reply(`🎉 Bot picks: *${option}*`);
    } catch (e) {
        console.error("Error in .pick command:", e);
        reply("❌ An error occurred while processing your request.");
    }
});

cmd({
    pattern: "timenow",
    desc: "Check the current local time.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { reply }) => {
    try {

        const now = new Date();

        const localTime = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Colombo"
        });

        reply(`🕒 Current Local Time in Sri Lanka: ${localTime}`);
    } catch (e) {
        console.error("Error in .timenow command:", e);
        reply("❌ An error occurred. Please try again later.");
    }
});

cmd({
    pattern: "date",
    desc: "Check the current date.",
    category: "utility",
    filename: __filename,
},
async (conn, mek, m, { reply }) => {
    try {

        const now = new Date();

        const currentDate = now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        reply(`📅 Current Date: ${currentDate}`);
    } catch (e) {
        console.error("Error in .date command:", e);
        reply("❌ An error occurred. Please try again later.");
    }
});

cmd({
    pattern: "shapar",
    desc: "Send shapar ASCII art with mentions.",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {

        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        const mentionedUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) {
            return reply("Please mention a user to send the ASCII art to.");
        }

        const asciiArt = `
          _______
       .-'       '-.
      /           /|
     /           / |
    /___________/  |
    |   _______ |  |
    |  |  \\ \\  ||  |
    |  |   \\ \\ ||  |
    |  |____\\ \\||  |
    |  '._  _.'||  |
    |    .' '.  ||  |
    |   '.___.' ||  |
    |___________||  |
    '------------'  |
     \\_____________\\|
`;

        const message = `😂 @${mentionedUser.split("@")[0]}!\n😂 that for you:\n\n${asciiArt}`;

        await conn.sendMessage(from, {
            text: message,
            mentions: [mentionedUser],
        }, { quoted: m });

    } catch (e) {
        console.error("Error in .shapar command:", e);
        reply("An error occurred while processing the command. Please try again.");
    }
});

cmd({
    pattern: "rate",
    desc: "Rate someone out of 10.",
    category: "fun",
    filename: __filename,
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("This command can only be used in groups.");

        const mentionedUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) return reply("Please mention someone to rate.");

        const randomRating = Math.floor(Math.random() * 10) + 1;
        const message = `@${mentionedUser.split("@")[0]} is rated ${randomRating}/10.`;

        await conn.sendMessage(from, { text: message, mentions: [mentionedUser] }, { quoted: m });
    } catch (e) {
        console.error("Error in .rate command:", e);
        reply("An error occurred. Please try again.");
    }
});

cmd({
    pattern: "countx",
    desc: "Start a reverse countdown from the specified number to 1.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { args, reply, senderNumber }) => {
    try {

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("❎ Only the bot owner can use this command.");
        }

        if (!args[0]) {
            return reply("✳️ Use this command like:\n *Example:* .countx 10");
        }

        const count = parseInt(args[0].trim());

        if (isNaN(count) || count <= 0 || count > 50) {
            return reply("❎ Please specify a valid number between 1 and 50.");
        }

        reply(`⏳ Starting reverse countdown from ${count}...`);

        for (let i = count; i >= 1; i--) {
            await conn.sendMessage(m.chat, { text: `${i}` }, { quoted: mek });
            await sleep(1000);
        }

        reply(`✅ Countdown completed.`);
    } catch (e) {
        console.error(e);
        reply("❎ An error occurred while processing your request.");
    }
});

cmd({
    pattern: "count",
    desc: "Start a countdown from 1 to the specified number.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { args, reply, senderNumber }) => {
    try {

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("❎ Only the bot owner can use this command.");
        }

        if (!args[0]) {
            return reply("✳️ Use this command like:\n *Example:* .count 10");
        }

        const count = parseInt(args[0].trim());

        if (isNaN(count) || count <= 0 || count > 50) {
            return reply("❎ Please specify a valid number between 1 and 50.");
        }

        reply(`⏳ Starting countdown to ${count}...`);

        for (let i = 1; i <= count; i++) {
            await conn.sendMessage(m.chat, { text: `${i}` }, { quoted: mek });
            await sleep(1000);
        }

        reply(`✅ Countdown completed.`);
    } catch (e) {
        console.error(e);
        reply("❎ An error occurred while processing your request.");
    }
});

cmd({
    pattern: "calculate",
    alias: ["calc"],
    desc: "Evaluate a mathematical expression.",
    category: "utilities",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {

        if (!args[0]) {
            return reply("✳️ Use this command like:\n *Example:* .calculate 5+3*2");
        }

        const expression = args.join(" ").trim();

        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
            return reply("❎ Invalid expression. Only numbers and +, -, *, /, ( ) are allowed.");
        }

        let result;
        try {
            result = eval(expression);
        } catch (e) {
            return reply("❎ Error in calculation. Please check your expression.");
        }

        reply(`✅ Result of "${expression}" is: ${result}`);
    } catch (e) {
        console.error(e);
        reply("❎ An error occurred while processing your request.");
    }
});
