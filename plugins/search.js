const { cmd, commands } = require('../command');
const yts = require('yt-search');
const axios = require('axios');
const config = require('../config');
const path = require('path');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: '.yts tech',
    react: "🔎",
    filename: __filename
},

async(conn, mek, m,{from, l, quoted, body, isCmd, umarmd, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try{
        if (!q) return reply('*Please give me words to search*')
        try {
            var arama = await yts(q);
        } catch(e) {
            l(e)
            return await conn.sendMessage(from , { text: '*Error !!*' }, { quoted: mek } )
        }
        var mesaj = '';
        arama.all.map((video) => {
            mesaj += ' *🖲️' + video.title + '*\n🔗 ' + video.url + '\n\n'
        });
        await conn.sendMessage(from , { text:  mesaj }, { quoted: mek } )
    } catch (e) {
        l(e)
        reply('*Error !!*')
    }
});

cmd({
    pattern: "fancy",
    alias: ["font", "style"],
    react: "✍️",
    filename: __filename
}, async (conn, m, store, { from, quoted, args, q, reply }) => {
    try {
        if (!q) {
            return reply("❎ Please provide text to convert into fancy fonts.\n\n*Example:* .fancy Hello");
        }

        const apiUrl = `https://www.movanest.xyz/v2/fancytext?word=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (!response.data.status) {
            return reply("❌ Error fetching fonts. Please try again later.");
        }

        const fonts = response.data.results.join("\n\n");
        const resultText = `✨ *Fancy Fonts Converter* ✨\n\n${fonts}\n\n> *Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        await conn.sendMessage(from, { text: resultText }, { quoted: m });
    } catch (error) {
        console.error("❌ Error in fancy command:", error);
        reply("⚠️ An error occurred while fetching fonts.");
    }
});

cmd({
    pattern: "vcc",
    react: "💳",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    const apiUrl = `https://api.siputzx.my.id/api/tools/vcc-generator?type=MasterCard&count=5`;

    try {
        const response = await axios.get(apiUrl);
        const result = response.data;

        if (!result.status || !result.data || result.data.length === 0) {
            return reply("❌ Unable to generate VCCs. Please try again later.");
        }

        let responseMessage = `🎴 *Generated VCCs* (Type: Mastercard, Count: 5):\n\n`;

        result.data.forEach((card, index) => {
            responseMessage += `#️⃣ *Card ${index + 1}:*\n`;
            responseMessage += `🔢 *Card Number:* ${card.cardNumber}\n`;
            responseMessage += `📅 *Expiration Date:* ${card.expirationDate}\n`;
            responseMessage += `🧾 *Cardholder Name:* ${card.cardholderName}\n`;
            responseMessage += `🔒 *CVV:* ${card.cvv}\n\n`;
        });

        return reply(responseMessage);
    } catch (error) {
        console.error("Error fetching VCC data:", error);
        return reply("❌ An error occurred while generating VCCs. Please try again later.");
    }
});

cmd({
    pattern: "srepo",
    react: "🍃",
    filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
    try {
        const repoName = args.join(" ");
        if (!repoName) {
            return reply("❌ Please provide a GitHub repository in the format 📌 `owner/repo`.");
        }

        const apiUrl = `https://api.github.com/repos/${repoName}`;
        const { data } = await axios.get(apiUrl);

        let responseMsg = `📁 *GitHub Repository Info* 📁\n\n`;
        responseMsg += `📌 *Name*: ${data.name}\n`;
        responseMsg += `🔗 *URL*: ${data.html_url}\n`;
        responseMsg += `📝 *Description*: ${data.description || "No description"}\n`;
        responseMsg += `⭐ *Stars*: ${data.stargazers_count}\n`;
        responseMsg += `🍴 *Forks*: ${data.forks_count}\n`;
        responseMsg += `👤 *Owner*: ${data.owner.login}\n`;
        responseMsg += `📅 *Created At*: ${new Date(data.created_at).toLocaleDateString()}\n`;
        responseMsg += `\n> *© Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        await conn.sendMessage(from, { text: responseMsg }, { quoted: m });
    } catch (error) {
        console.error("GitHub API Error:", error);
        reply(`❌ Error fetching repository data: ${error.response?.data?.message || error.message}`);
    }
});

cmd({
    pattern: "ytpost",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a YouTube community post URL.\nExample: `.ytpost <url>`");

        const apiUrl = `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) {
            await react("❌");
            return reply("Failed to fetch the community post. Please check the URL.");
        }

        const post = data.data;
        let caption = `📢 *YouTube Community Post* 📢\n\n` +
        `📜 *Content:* ${post.content}`;

        if (post.images && post.images.length > 0) {
            for (const img of post.images) {
                await conn.sendMessage(from, { image: { url: img }, caption }, { quoted: mek });
                caption = "";
            }
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }

        await react("✅");
    } catch (e) {
        console.error("Error in ytpost command:", e);
        await react("❌");
        reply("An error occurred while fetching the YouTube community post.");
    }
});

cmd({
    pattern: "githubstalk",
    react: "🖥️",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const username = args[0];
        if (!username) {
            return reply("Please provide a GitHub username.");
        }
        const apiUrl = `https://api.github.com/users/${username}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        let userInfo = `👤 *Username*: ${data.name || data.login}
        🔗 *Github Url*:(${data.html_url})
        📝 *Bio*: ${data.bio || 'Not available'}
        🏙️ *Location*: ${data.location || 'Unknown'}
        📊 *Public Repos*: ${data.public_repos}
        👥 *Followers*: ${data.followers} | Following: ${data.following}
        📅 *Created At*: ${new Date(data.created_at).toDateString()}
        🔭 *Public Gists*: ${data.public_gists}
        > © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;
        const sentMsg = await conn.sendMessage(from,{image:{url: data.avatar_url },caption: userInfo },{quoted:mek })
    } catch (e) {
        console.log(e);
        reply(`error: ${e.response ? e.response.data.message : e.message}`);
    }
});

cmd({
    pattern: "weather",
    react: "🌤",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a city name. Usage: .weather [city name]");
        const apiKey = '2d61a72574c11c4f36173b627f8cb177';
        const city = q;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        const weather = `
        > 🌍 *Weather Information for ${data.name}, ${data.sys.country}* 🌍
        > 🌡️ *Temperature*: ${data.main.temp}°C
        > 🌡️ *Feels Like*: ${data.main.feels_like}°C
        > 🌡️ *Min Temp*: ${data.main.temp_min}°C
        > 🌡️ *Max Temp*: ${data.main.temp_max}°C
        > 💧 *Humidity*: ${data.main.humidity}%
        > ☁️ *Weather*: ${data.weather[0].main}
        > 🌫️ *Description*: ${data.weather[0].description}
        > 💨 *Wind Speed*: ${data.wind.speed} m/s
        > 🔽 *Pressure*: ${data.main.pressure} hPa

        > *© Powdered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*
        `;
        return reply(weather);
    } catch (e) {
        console.log(e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 City not found. Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the weather information. Please try again later.");
    }
});

cmd({
    pattern: "xstalk",
    alias: ["twitterstalk", "twtstalk"],
    react: "🔍",
    filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a valid Twitter/X username.");
        }

        await conn.sendMessage(from, {
            react: { text: "⏳", key: m.key }
        });

        const apiUrl = `https://delirius-apiofc.vercel.app/tools/xstalk?username=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data) {
            return reply("⚠️ Failed to fetch Twitter/X user details. Ensure the username is correct.");
        }

        const user = data.data;
        const verifiedBadge = user.verified ? "✅" : "❌";

        const caption = `╭━━━〔 *TWITTER/X STALKER* 〕━━━⊷\n`
        + `┃👤 *Name:* ${user.name}\n`
        + `┃🔹 *Username:* @${user.username}\n`
        + `┃✔️ *Verified:* ${verifiedBadge}\n`
        + `┃👥 *Followers:* ${user.followers_count}\n`
        + `┃👤 *Following:* ${user.following_count}\n`
        + `┃📝 *Tweets:* ${user.tweets_count}\n`
        + `┃📅 *Joined:* ${user.created}\n`
        + `┃🔗 *Profile:* [Click Here](${user.url})\n`
        + `╰━━━⪼\n\n`
        + `🔹 *Powered BY 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        await conn.sendMessage(from, {
            image: { url: user.avatar },
            caption: caption
        }, { quoted: m });

    } catch (error) {
        console.error("Error:", error);
        reply("❌ An error occurred while processing your request. Please try again.");
    }
});

function getFlagEmoji(countryCode) {
    if (!countryCode) return "";
    return countryCode
    .toUpperCase()
    .split("")
    .map(letter => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}

cmd({
    pattern: "check",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        let code = args[0];
        if (!code) return reply("❌ Please provide a country code. Example: `.check 255`");
        code = code.replace(/\+/g, '');

        const url = "https://country-code-1-hmla.onrender.com/countries";
        const { data } = await axios.get(url);

        const matchingCountries = data.filter(country => country.calling_code === code);

        if (matchingCountries.length > 0) {
            const countryNames = matchingCountries
            .map(c => `${getFlagEmoji(c.code)} ${c.name}`)
            .join("\n");

            await conn.sendMessage(from, {
                text: `✅ *Country Code:* ${code}\n🌍 *Countries:*\n${countryNames}`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363400240662312@newsletter",
                        newsletterName: "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
                        serverMessageId: 1
                    }
                }
            }, { quoted: mek });
        } else {
            reply(`❌ No country found for the code ${code}.`);
        }
    } catch (error) {
        console.error(error);
        reply("❌ An error occurred while checking the country code.");
    }
});

cmd({
    pattern: "webinfo",
    alias: ["siteinfo", "web"],
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const url = args[0];
        if (!url) return reply('⚠️ Please provide a website URL.\n\nExample: *.webinfo https://example.com*');

        const apiKey = 'APIKEY';
        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/web/info?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

        const { data } = await axios.get(apiUrl);

        if (!data || data.status !== "success" || !data.data) {
            return reply('❌ Website info failed.');
        }

        const info = data.data;

        const caption = `╭─❰ 🌐 𝗪𝗲𝗯𝘀𝗶𝘁𝗲 𝗜𝗻𝗳𝗼 ❱──➤
        ┃ 🏷️ *Title:* ${info.title || 'N/A'}
        ┃ 📃 *Description:* ${info.description || 'N/A'}
        ┃ 🏢 *Publisher:* ${info.publisher || 'N/A'}
        ┃ 🗓️ *Date:* ${info.date || 'N/A'}
        ┃ 🖼️ *Image Size:* ${info.image?.size_pretty || 'N/A'}
        ┃ 🌍 *URL:* ${info.url || url}
        ╰──────────────➤`;

        const fixedImageUrl = 'https://files.catbox.moe/a757v6.jpg';
        const response = await axios.get(fixedImageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption
        }, { quoted: m });

    } catch (e) {
        console.error("Error in webinfo command:", e);
        reply(`🚨 *An error occurred:* ${e.message}`);
    }
});

cmd({
    pattern: "define",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a word to define.\n\n📌 *Usage:* .define [word]");

        const word = q.trim();
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        const response = await axios.get(url);
        const definitionData = response.data[0];

        const definition = definitionData.meanings[0].definitions[0].definition;
        const example = definitionData.meanings[0].definitions[0].example || '❌ No example available';
        const synonyms = definitionData.meanings[0].definitions[0].synonyms.join(', ') || '❌ No synonyms available';
        const phonetics = definitionData.phonetics[0]?.text || '🔇 No phonetics available';
        const audio = definitionData.phonetics[0]?.audio || null;

        const wordInfo = `
        📖 *Word*: *${definitionData.word}*
        🗣️ *Pronunciation*: _${phonetics}_
        📚 *Definition*: ${definition}
        ✍️ *Example*: ${example}
        📝 *Synonyms*: ${synonyms}

        🔗 *Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        if (audio) {
            await conn.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg' }, { quoted: mek });
        }

        return reply(wordInfo);
    } catch (e) {
        console.error("❌ Error:", e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 *Word not found.* Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the definition. Please try again later.");
    }
});

cmd({
    pattern: "tiktokstalk",
    alias: ["tstalk", "ttstalk"],
    react: "📱",
    filename: __filename
}, async (conn, m, store, { from, args, q, reply }) => {
    try {
        if (!q) {
            return reply("❎ Please provide a TikTok username.\n\n*Example:* .tiktokstalk mrbeast");
        }

        const apiUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status) {
            return reply("❌ User not found. Please check the username and try again.");
        }

        const user = data.data.user;
        const stats = data.data.stats;

        const profileInfo = `🎭 *TikTok Profile Stalker* 🎭

        👤 *Username:* @${user.uniqueId}
        📛 *Nickname:* ${user.nickname}
        ✅ *Verified:* ${user.verified ? "Yes ✅" : "No ❌"}
        📍 *Region:* ${user.region}
        📝 *Bio:* ${user.signature || "No bio available."}
        🔗 *Bio Link:* ${user.bioLink?.link || "No link available."}

        📊 *Statistics:*
        👥 *Followers:* ${stats.followerCount.toLocaleString()}
        👤 *Following:* ${stats.followingCount.toLocaleString()}
        ❤️ *Likes:* ${stats.heartCount.toLocaleString()}
        🎥 *Videos:* ${stats.videoCount.toLocaleString()}

        📅 *Account Created:* ${new Date(user.createTime * 1000).toLocaleDateString()}
        🔒 *Private Account:* ${user.privateAccount ? "Yes 🔒" : "No 🌍"}

        🔗 *Profile URL:* https://www.tiktok.com/@${user.uniqueId}
        `;

        const profileImage = { image: { url: user.avatarLarger }, caption: profileInfo };

        await conn.sendMessage(from, profileImage, { quoted: m });
    } catch (error) {
        console.error("❌ Error in TikTok stalk command:", error);
        reply("⚠️ An error occurred while fetching TikTok profile data.");
    }
});

cmd({
    pattern: "app",
    react: '📲',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide an app name to search.");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = `https://api.deline.web.id/search/playstore?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.result || response.data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ No results found for that app name.");
        }

        const apps = response.data.result.slice(0, 5);

        let finalMessage = `📲 *PLAY STORE SEARCH RESULTS*\n\n`;

        apps.forEach((app, index) => {
            finalMessage += `🔸 *${index + 1}. ${app.nama}*\n`;
            finalMessage += `• 👨‍💻 *Dev:* ${app.developer}\n`;
            finalMessage += `• ⭐ *Rating:* ${app.rate2 || 'N/A'}\n`;
            finalMessage += `• 🔗 *Link:* ${app.link}\n\n`;
            finalMessage += `─────────────────\n\n`;
        });

        finalMessage += `*Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        await conn.sendMessage(
        from,
        { text: finalMessage },
        { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Play Store Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ Error fetching Play Store results. Please try again later.");
    }
});

cmd({
    pattern: "npm",
    react: '📦',
    filename: __filename,
    use: ".npm <package-name>"
}, async (conn, mek, msg, { from, args, reply }) => {
    try {

        if (!args.length) {
            return reply("Please provide the name of the npm package you want to search for. Example: .npm express");
        }

        const packageName = args.join(" ");
        const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

        const response = await axios.get(apiUrl);
        if (response.status !== 200) {
            throw new Error("Package not found or an error occurred.");
        }

        const packageData = response.data;
        const latestVersion = packageData["dist-tags"].latest;
        const description = packageData.description || "No description available.";
        const npmUrl = `https://www.npmjs.com/package/${packageName}`;
        const license = packageData.license || "Unknown";
        const repository = packageData.repository ? packageData.repository.url : "Not available";

        const message = `
        *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 NPM SEARCH*

        *🔰 NPM PACKAGE:* ${packageName}
        *📄 DESCRIPTION:* ${description}
        *⏸️ LAST VERSION:* ${latestVersion}
        *🪪 LICENSE:* ${license}
        *🪩 REPOSITORY:* ${repository}
        *🔗 NPM URL:* ${npmUrl}
        `;

        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (error) {
        console.error("Error:", error);

        const errorMessage = `
        *❌ NPM Command Error Logs*

        *Error Message:* ${error.message}
        *Stack Trace:* ${error.stack || "Not available"}
        *Timestamp:* ${new Date().toISOString()}
        `;

        await conn.sendMessage(from, { text: errorMessage }, { quoted: mek });
        reply("An error occurred while fetching the npm package details.");
    }
});

cmd({
    pattern: "download",
    alias: ["downurl" ,"down"],
    use: ".download <link>",
    react: "📁",
    filename: __filename
},
async (conn, mek, m, {
    from,
    q,
    reply
}) => {
    try {
        if (!q) {
            return reply("❗ කරුණාකර download link එකක් ලබා දෙන්න.");
        }

        const link = q.trim();
        const urlPattern = /^(https?:\/\/[^\s]+)/i;
        if (!urlPattern.test(link)) {
            return reply("❗ දීලා තියෙන URL එක වැරදි.\nකරුණාකර හරි link එකක් දෙන්න.");
        }

        const response = await axios.head(link);
        const headers = response.headers;

        const mimeType = headers['content-type'] || 'application/octet-stream';

        let fileName = "Downloaded_File";
        const contentDisposition = headers['content-disposition'];

        if (contentDisposition && contentDisposition.includes('filename=')) {
            fileName = contentDisposition.split('filename=')[1].replaceAll('"', '').trim();
        } else {

            fileName = path.basename(new URL(link).pathname) || "file";
        }

        const caption = `*Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

        await conn.sendMessage(from, {
            document: { url: link },
            mimetype: mimeType,
            fileName: fileName,
            caption: caption
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply("❌ Download failed!\n\n" + (err.message || err));
    }
});

cmd({
    pattern: "mvdetail",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender, args }) => {
    try {

        const movieName = args.length > 0 ? args.join(' ') : m.text.replace(/^[\.\#\$\!]?movie\s?/i, '').trim();

        if (!movieName) {
            return reply("📽️ Please provide the name of the movie.\nExample: .movie Iron Man");
        }

        const apiUrl = `https://apis.davidcyril.name.ng/imdb?query=${encodeURIComponent(movieName)}`;
        const response = await axios.get(apiUrl);

        if (!response.data.status || !response.data.movie) {
            return reply("🚫 Movie not found. Please check the name and try again.");
        }

        const movie = response.data.movie;

        const dec = `
        🎬 *${movie.title}* (${movie.year}) ${movie.rated || ''}

        ⭐ *IMDb:* ${movie.imdbRating || 'N/A'} | 🍅 *Rotten Tomatoes:* ${movie.ratings.find(r => r.source === 'Rotten Tomatoes')?.value || 'N/A'} | 💰 *Box Office:* ${movie.boxoffice || 'N/A'}

        📅 *Released:* ${new Date(movie.released).toLocaleDateString()}
        ⏳ *Runtime:* ${movie.runtime}
        🎭 *Genre:* ${movie.genres}

        📝 *Plot:* ${movie.plot}

        🎥 *Director:* ${movie.director}
        ✍️ *Writer:* ${movie.writer}
        🌟 *Actors:* ${movie.actors}

        🌍 *Country:* ${movie.country}
        🗣️ *Language:* ${movie.languages}
        🏆 *Awards:* ${movie.awards || 'None'}

        [View on IMDb](${movie.imdbUrl})
        `;

        await conn.sendMessage(
        from,
        {
            image: {
                url: movie.poster && movie.poster !== 'N/A' ? movie.poster : 'https://files.catbox.moe/brlkte.jpg'
            },
            caption: dec,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: '𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳',
                    serverMessageId: 143
                }
            }
        },
        { quoted: mek }
        );

    } catch (e) {
        console.error('Movie command error:', e);
        reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "praytime",
    alias: ["prayertimes", "prayertime", "ptime" ],
    react: "✅",
    filename: __filename,
},
async(conn, mek, m, {from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, isItzcp, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        const city = args.length > 0 ? args.join(" ") : "bhakkar";
        const apiUrl = `https://api.nexoracle.com/islamic/prayer-times?city=${city}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            return reply('Error fetching prayer times!');
        }

        const data = await response.json();

        if (data.status !== 200) {
            return reply('Failed to get prayer times. Please try again later.');
        }

        const prayerTimes = data.result.items[0];
        const weather = data.result.today_weather;
        const location = data.result.city;

        let dec = `*Prayer Times for ${location}, ${data.result.state}*\n\n`;
        dec += `📍 *Location*: ${location}, ${data.result.state}, ${data.result.country}\n`;
        dec += `🕌 *Method*: ${data.result.prayer_method_name}\n\n`;

        dec += `🌅 *Fajr*: ${prayerTimes.fajr}\n`;
        dec += `🌄 *Shurooq*: ${prayerTimes.shurooq}\n`;
        dec += `☀️ *Dhuhr*: ${prayerTimes.dhuhr}\n`;
        dec += `🌇 *Asr*: ${prayerTimes.asr}\n`;
        dec += `🌆 *Maghrib*: ${prayerTimes.maghrib}\n`;
        dec += `🌃 *Isha*: ${prayerTimes.isha}\n\n`;

        dec += `🧭 *Qibla Direction*: ${data.result.qibla_direction}°\n`;

        const temperature = weather.temperature !== null ? `${weather.temperature}°C` : 'Data not available';
        dec += `🌡️ *Temperature*: ${temperature}\n`;

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
                    newsletterName: '𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳',
                    serverMessageId: 143
                }
            }
        },
        { quoted: mek });

    } catch (e) {
        console.log(e);
        reply('*Error occurred while fetching prayer times and weather.*');
    }
});

cmd({
    pattern: "tempmail",
    alias: ["genmail"],
    react: "📧",
    filename: __filename
},
async (conn, mek, m, { from, reply, prefix }) => {
    try {
        const response = await axios.get('https://apis.davidcyril.name.ng/temp-mail');
        const { email, session_id, expires_at } = response.data;

        const expiresDate = new Date(expires_at);
        const timeString = expiresDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const dateString = expiresDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const message = `
        📧 *TEMPORARY EMAIL GENERATED*

        ✉️ *Email Address:*
        ${email}

        ⏳ *Expires:*
        ${timeString} • ${dateString}

        🔑 *Session ID:*
        \`\`\`${session_id}\`\`\`

        📥 *Check Inbox:*
        .inbox ${session_id}

        _Email will expire after 24 hours_
        `;

        await conn.sendMessage(
        from,
        {
            text: message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400240662312@newsletter',
                    newsletterName: 'TempMail Service',
                    serverMessageId: 101
                }
            }
        },
        { quoted: mek }
        );

    } catch (e) {
        console.error('TempMail error:', e);
        reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "checkmail",
    alias: ["inbox", "tmail", "mailinbox"],
    react: "📬",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const sessionId = args[0];
        if (!sessionId) return reply('🔑 Please provide your session ID\nExample: .checkmail YOUR_SESSION_ID');

        const inboxUrl = `https://apis.davidcyril.name.ng/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`;
        const response = await axios.get(inboxUrl);

        if (!response.data.success) {
            return reply('❌ Invalid session ID or expired email');
        }

        const { inbox_count, messages } = response.data;

        if (inbox_count === 0) {
            return reply('📭 Your inbox is empty');
        }

        let messageList = `📬 *You have ${inbox_count} message(s)*\n\n`;
        messages.forEach((msg, index) => {
            messageList += `━━━━━━━━━━━━━━━━━━\n` +
            `📌 *Message ${index + 1}*\n` +
            `👤 *From:* ${msg.from}\n` +
            `📝 *Subject:* ${msg.subject}\n` +
            `⏰ *Date:* ${new Date(msg.date).toLocaleString()}\n\n` +
            `📄 *Content:*\n${msg.body}\n\n`;
        });

        await reply(messageList);

    } catch (e) {
        console.error('CheckMail error:', e);
        reply(`❌ Error checking inbox: ${e.response?.data?.message || e.message}`);
    }
});

cmd({
    pattern: "cid",
    react: "📡",
    filename: __filename
}, async (conn, mek, m, {
    from,
    args,
    q,
    reply
}) => {
    try {
        if (!q) return reply("❎ Please provide a WhatsApp Channel link.\n\n*Example:* .cinfo https://whatsapp.com/channel/123456789");

        const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
        if (!match) return reply("⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx");

        const inviteId = match[1];

        let metadata;
        try {
            metadata = await conn.newsletterMetadata("invite", inviteId);
        } catch (e) {
            return reply("❌ Failed to fetch channel metadata. Make sure the link is correct.");
        }

        if (!metadata || !metadata.id) return reply("❌ Channel not found or inaccessible.");

        const infoText = `*— 乂 Channel Info —*\n\n` +
        `🆔 *ID:* ${metadata.id}\n` +
        `📌 *Name:* ${metadata.name}\n` +
        `👥 *Followers:* ${metadata.subscribers?.toLocaleString() || "N/A"}\n` +
        `📅 *Created on:* ${metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString("id-ID") : "Unknown"}`;

        if (metadata.preview) {
            await conn.sendMessage(from, {
                image: { url: `https://pps.whatsapp.net${metadata.preview}` },
                caption: infoText
            }, { quoted: m });
        } else {
            await reply(infoText);
        }

    } catch (error) {
        console.error("❌ Error in .cinfo plugin:", error);
        reply("⚠️ An unexpected error occurred.");
    }
});

cmd({
    pattern: "cjid",
    react: "📡",
    filename: __filename
},
async (conn, mek, m) => {
    const newsletterJid = m.chat;

    console.log(`[NEWSLETTER] Command used in: ${newsletterJid}`);

    if (!newsletterJid.endsWith("@newsletter")) {
        return conn.sendMessage(newsletterJid, {
            text: "This command must be used inside a WhatsApp channel (@newsletter)."
        }, { quoted: mek });
    }

    if (!newsletterJid.startsWith("120")) {
        return conn.sendMessage(newsletterJid, {
            text: "This does not appear to be a valid WhatsApp channel ID."
        }, { quoted: mek });
    }

    const now = new Date().toLocaleString();

    await conn.sendMessage(newsletterJid, {
        text: `Channel ID:\n\n*${newsletterJid}*\n\nDml *Executed on:* ${now}`
    }, { quoted: mek });

    const fakeNewsletterJid = '120363400240662312@newsletter';
    const fakeNewsletterName = 'TEST';
    const serverMessageId = 101;
    const message = `Forwarded from another newsletter:\n\n*${newsletterJid}*`;

    await conn.sendMessage(
    newsletterJid,
    {
        text: message,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: fakeNewsletterJid,
                newsletterName: fakeNewsletterName,
                serverMessageId: serverMessageId
            }
        }
    },
    { quoted: mek }
    );
});

cmd({
    pattern: "ytstalk",
    alias: ["youtubestalk", "ytsearch"],
    use: ".ytstalk <username>",
    filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
    try {
        const username = args.join(" ");
        if (!username) {
            return reply("❌ Please provide a YouTube username. Example: `.ytstalk tech`");
        }

        const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`);
        const { status, data } = response.data;

        if (!status || !data) {
            return reply("❌ No information found for the specified YouTube channel. Please try again.");
        }

        const {
            channel: {
                username: ytUsername,
                subscriberCount,
                videoCount,
                avatarUrl,
                channelUrl,
                description,
            },
            latest_videos,
        } = data;

        const ytMessage = `
        📺 *YouTube Channel*: ${ytUsername}
        👥 *Subscribers*: ${subscriberCount}
        🎥 *Total Videos*: ${videoCount}
        📝 *Description*: ${description || "N/A"}
        🔗 *Channel URL*: ${channelUrl}

        🎬 *Latest Videos*:
        ${latest_videos.slice(0, 3).map((video, index) => `
            ${index + 1}. *${video.title}*
            ▶️ *Views*: ${video.viewCount}
            ⏱️ *Duration*: ${video.duration}
            📅 *Published*: ${video.publishedTime}
            🔗 *Video URL*: ${video.videoUrl}
            `).join("\n")}
            `;

            await conn.sendMessage(from, {
                image: { url: avatarUrl },
                caption: ytMessage,
            });
        } catch (error) {
            console.error("Error fetching YouTube channel information:", error);
            reply("❌ Unable to fetch YouTube channel information. Please try again later.");
        }
    });

    cmd({
        pattern: "ytstalk2",
        alias: ["ytinfo2"],
        react: "🔍",
        filename: __filename
    }, async (conn, m, store, { from, quoted, q, reply }) => {
        try {
            if (!q) {
                return reply("❌ Please provide a valid YouTube channel username or ID.");
            }

            await conn.sendMessage(from, {
                react: { text: "⏳", key: m.key }
            });

            const apiUrl = `https://delirius-apiofc.vercel.app/tools/ytstalk?channel=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.status || !data.data) {
                return reply("⚠️ Failed to fetch YouTube channel details. Ensure the username or ID is correct.");
            }

            const yt = data.data;
            const caption = `╭━━━〔 *YOUTUBE STALKER* 〕━━━⊷\n`
            + `┃👤 *Username:* ${yt.username}\n`
            + `┃📊 *Subscribers:* ${yt.subscriber_count}\n`
            + `┃🎥 *Videos:* ${yt.video_count}\n`
            + `┃🔗 *Channel Link:* (${yt.channel})\n`
            + `╰━━━⪼\n\n`
            + `🔹 *Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`;

            await conn.sendMessage(from, {
                image: { url: yt.avatar },
                caption: caption
            }, { quoted: m });

        } catch (error) {
            console.error("Error:", error);
            reply("❌ An error occurred while processing your request. Please try again.");
        }
    });

    const lyricsCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

    cmd({
        pattern: "lyrics",
        alias: ["ly", "lyric"],
        react: "📝",
        filename: __filename
    }, async (conn, mek, m, { from, q }) => {

        if (!q) return await conn.sendMessage(from, { text: "Use: .lyrics <song name>" }, { quoted: mek });

        try {
            const cacheKey = `lyrics_${q.toLowerCase()}`;
            let data = lyricsCache.get(cacheKey);

            if (!data) {

                const url = `https://eliteprotech-apis.zone.id/lyrics?query=${encodeURIComponent(q)}`;
                const res = await axios.get(url);

                data = res.data;

                if (!data.success || !data.result?.length) throw new Error("No lyrics found.");
                lyricsCache.set(cacheKey, data);
            }

            const lyricsList = data.result.map((item, i) => ({
                number: i + 1,
                id: item.id,
                title: item.name,
                track: item.trackName,
                artist: item.artistName,
                album: item.albumName,
                duration: item.duration,
                plainLyrics: item.plainLyrics,
                syncedLyrics: item.syncedLyrics
            }));

            let textList = "🔢 𝑅𝑒𝑝𝑙𝑦 𝐵𝑒𝑙𝑜𝑤 𝑁𝑢𝑚𝑏𝑒𝑟\n━━━━━━━━━━━━━━━━━\n\n";
            lyricsList.forEach(l => {
                textList += `🔸 *${l.number}. ${l.title}* - ${l.artist}\n`;
            });

            const sentMsg = await conn.sendMessage(from, {
                text: `*🔍 𝐋𝐘𝐑𝐈𝐂𝐒 𝐒𝐄𝐀𝐑𝐂𝐇 🎶*\n\n${textList}\n💬 Reply with song number to view lyrics.\n\n> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`,
            }, { quoted: mek });

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
                    const selected = lyricsList.find(l => l.number === num);
                    if (!selected) return;

                    await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

                    const minutes = Math.floor(selected.duration / 60);
                    const seconds = selected.duration % 60;

                    let info =
                    `🔍 *Lyrics Track Found* 🎵\n\n` +
                    `🎵 *Track:* ${selected.title}\n` +
                    `👤 *Artist:* ${selected.artist}\n` +
                    `💿 *Album:* ${selected.album}\n` +
                    `🕐 *Duration:* ${minutes}:${seconds < 10 ? '0' : ''}${seconds}\n\n` +
                    `━━━━━━━━━━━━━━━━━\n\n` +
                    `📝 *𝐏𝐥𝐚𝐢𝐧 𝐋𝐲𝐫𝐢𝐜𝐬:*\n\n${selected.plainLyrics || "Not Available"}\n\n` +
                    `━━━━━━━━━━━━━━━━━\n\n` +
                    `⏳ *𝐒𝐲𝐧𝐜𝐞𝐝 𝐋𝐲𝐫𝐢𝐜𝐬 (𝐓𝐢𝐦𝐞-𝐒𝐭𝐚𝐦𝐩𝐞𝐝):*\n\n${selected.syncedLyrics || "Not Available"}\n\n` +
                    `> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

                    await conn.sendMessage(from, {
                        text: info
                    }, { quoted: msg });
                }
            };

            conn.ev.on("messages.upsert", listener);

        } catch (err) {
            await conn.sendMessage(from, { text: `*Error:* ${err.message}` }, { quoted: mek });
        }
    });

    cmd({
        pattern: "news",
        react: "📰",
        filename: __filename
    },
    async (conn, mek, m, { from, reply }) => {
        try {
            const response = await axios.get("https://tharuzz-news-api.vercel.app/api/news/derana");
            const articles = response.data.datas;

            if (!articles || !articles.length) return reply("❌ No news articles found.");

            const headerImage = "https://files.catbox.moe/8xi7k1.jpg";

            let newsMessage = `📰 *Ada Derana – Latest Headlines*\n\n`;

            for (let i = 0; i < Math.min(articles.length, 20); i++) {
                const a = articles[i];
                newsMessage += `
                ━━━━━━━━━━━━━━━━━
                🗞️ *${i + 1}. ${a.title || "No Title"}*

                📝 _${a.description || "No Description"}_

                🔗 _${a.link || "No URL"}_
                ━━━━━━━━━━━━━━━━━\n`;
            }

            newsMessage += `
            © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
            🌐 Source: Ada Derana`;

            await conn.sendMessage(from, {
                image: { url: headerImage },
                caption: newsMessage
            });

        } catch (e) {
            console.error("Error fetching news:", e);
            reply("⚠️ Could not fetch Derana news. Please try again later.");
        }
    });

    cmd({
        pattern: "news1",
        react: "📰",
        filename: __filename
    },
    async (conn, mek, m, { from, reply }) => {
        try {

            const sources = [
            { name: "Lankadeepalk News", url: "https://saviya-kolla-api.koyeb.app/news/lankadeepa" },
            { name: "Ada News", url: "https://saviya-kolla-api.koyeb.app/news/ada" },
            { name: "Sirasa News", url: "https://saviya-kolla-api.koyeb.app/news/sirasa" },
            { name: "Gagana News", url: "https://saviya-kolla-api.koyeb.app/news/gagana" },
            { name: "Lankadeepa News", url: "https://vajira-api.vercel.app/news/lankadeepa" },
            { name: "Lanka News", url: "https://vajira-api.vercel.app/news/lnw" },
            { name: "Siyatha News", url: "https://vajira-api.vercel.app/news/siyatha" },
            { name: "Gossip Lanka News", url: "https://vajira-api.vercel.app/news/gossiplankanews" }
            ];

            const defaultImage = "https://files.catbox.moe/8xi7k1.jpg";

            reply("📡 *Fetching latest news from all sources...*\n\n1. Lankadeepalk News\n2. Ada News\n3. Sirasa News\n4. Gagana News\n5. Lankadeepa News\n6. Lanka News\n7. Siyatha News\n8. Gossip Lanka News");

            for (const src of sources) {
                try {
                    const res = await axios.get(src.url);
                    const data = res.data;

                    let result = data.result;

                    if (!result) {
                        await conn.sendMessage(from, { text: `❌ No news found for *${src.name}*.` });
                        continue;
                    }

                    let msg = `
                    📰 *${src.name} - Latest*

                    ━━━━━━━━━━━━━━━

                    🗞️ *${result.title || "No Title"}*

                    📆 _${result.date || "No Date"}_

                    📝 _${result.desc || "No Description"}_

                    🔗 _${result.url || result.link || "No Link"}_

                    ━━━━━━━━━━━━━━━
                    © ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
                    `;

                    const image = result.image || result.thumbnail || defaultImage;
                    if (image) {
                        await conn.sendMessage(from, { image: { url: image }, caption: msg });
                    } else {
                        await conn.sendMessage(from, { text: msg });
                    }

                    await new Promise(res => setTimeout(res, 1500));

                } catch (err) {
                    console.error(`Error fetching from ${src.name}:`, err.message);
                    await conn.sendMessage(from, { text: `⚠️ Error loading news from *${src.name}*.` });
                }
            }

            reply("✅ *All news sources updated successfully!*");

        } catch (e) {
            console.error("Global Error:", e);
            reply("⚠️ Could not fetch news. Please try again later.");
        }
    });

    cmd({
        pattern: "news2",
        react: "📰",
        filename: __filename
    },
    async (conn, mek, m, { from, reply }) => {
        try {
            const apiKey="0f2c43ab11324578a7b1709651736382";
            const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
            const articles = response.data.articles;

            if (!articles.length) return reply("No news articles found.");

            for (let i = 0; i < Math.min(articles.length, 5); i++) {
                const article = articles[i];
                let message = `
                📰 *${article.title}*

                ⚠️ _${article.description}_

                🔗 _${article.url}_

                ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳
                `;

                console.log('Article URL:', article.urlToImage);

                if (article.urlToImage) {

                    await conn.sendMessage(from, { image: { url: article.urlToImage }, caption: message });
                } else {

                    await conn.sendMessage(from, { text: message });
                }
            };
        } catch (e) {
            console.error("Error fetching news:", e);
            reply("Could not fetch news. Please try again later.");
        }
    });
