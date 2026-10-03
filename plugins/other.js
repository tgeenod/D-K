const axios = require('axios');
const crypto = require('crypto');
const { cmd } = require('../command');
const { fetchJson, sleep } = require('../lib/functions');

cmd({
    pattern: "date",
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
    pattern: "timenow",
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
    pattern: "calculate",
    alias: ["calc"],
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

cmd({
  pattern: "timezone",
  react: "🕰️",
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
    pattern: "count",
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
    pattern: "countx",
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
  pattern: "sss",
  react: "💫",
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
  pattern: "gpass",
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
    pattern: "createapi",
    alias: ["makeapi", "apimaker"],
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
