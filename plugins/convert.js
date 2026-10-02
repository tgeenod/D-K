const {cmd, commands} = require('../command');
const {fetchJson} = require('../lib/functions');
const fetch = require('node-fetch');
const axios = require('axios');
const {Sticker, createSticker, StickerTypes} = require('wa-sticker-formatter');
const PDFDocument = require('pdfkit');
const {Buffer} = require('buffer');
const config = require('../config');
const Config = config;
const googleTTS = require('google-tts-api');
const crypto = require('crypto');
const webp = require('node-webpmux');
const fs = require('fs-extra');
const {exec} = require('child_process');
const path = require('path');
const {fetchGif, fetchImage, gifToSticker} = require('../lib/sticker-utils');
const os = require('os');
const {tmpdir} = os;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const {getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep} = require('../lib/functions');
const ffmpeg = require('fluent-ffmpeg');
const {videoToWebp} = require('../lib/video-utils');
const converter = require('../lib/converter');
const stickerConverter = require('../lib/sticker-converter');
const FormData = require('form-data');
cmd({
  pattern: "attp",
  react: "✨",
  use: ".attp HI",
  filename: __filename,
}, async (conn, mek, m, {args, reply}) => {
try {
  if (!args[0])
  return reply("*Please provide text!*");
  const gifBuffer = await fetchGif(`https://api-fix.onrender.com/api/maker/attp?text=${encodeURIComponent(args[0])}`);
  const stickerBuffer = await gifToSticker(gifBuffer);
  await conn.sendMessage(m.chat, {sticker: stickerBuffer}, {quoted: mek});
}
catch (error) {
  reply(`❌ ${error.message}`);
}
});
cmd({
  pattern: "tts",
  react: "👧",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try {
  if (!q)
  return reply("Need some text.");
  const url = googleTTS.getAudioUrl(q, {
    lang: 'hi-IN',
    slow: false,
    host: 'https://translate.google.com',
  });
await conn.sendMessage(from, {audio: {url: url}, mimetype: 'audio/mpeg', ptt: false}, {quoted: mek});
}
catch (a) {
  reply(`${a}`);
}
});
cmd({
  pattern: "tiny",
  alias: ['short', 'shorturl'],
  react: "🫧",
  use: "<url>",
  filename: __filename,
}, async (conn, mek, m, {from, quoted, isOwner, isAdmins, reply, args}) => {
console.log("Command tiny triggered");
if (!args[0]) {
  console.log("No URL provided");
  return reply("*🏷️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴍᴇ ᴀ ʟɪɴᴋ.*");
}
try {
  const link = args[0];
  console.log("URL to shorten:", link);
  const response = await axios.get(`https://tinyurl.com/api-create.php?url=${link}`);
  const shortenedUrl = response.data;
  console.log("Shortened URL:", shortenedUrl);
  return reply(`*🛡️YOUR SHORTENED URL*\n\n${shortenedUrl}`);
}
catch (e) {
  console.error("Error shortening URL:", e);
  return reply("An error occurred while shortening the URL. Please try again.");
}
});
cmd({
  pattern: 'sticker',
  alias: ['s', 'stickergif'],
  use: '<reply media or URL>',
  filename: __filename,
}, async (conn, mek, m, {quoted, args, q, reply, from}) => {
if (!mek.quoted)
return reply(`*Reply to any Image or Video, Sir.*`);
let mime = mek.quoted.mtype;
let pack = Config.STICKER_NAME || "𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳";
if (mime === "imageMessage" || mime === "stickerMessage") {
  let media = await mek.quoted.download();
  let sticker = new Sticker(media, {
    pack: pack,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    id: "12345",
    quality: 75,
    background: 'transparent',
  });
const buffer = await sticker.toBuffer();
return conn.sendMessage(mek.chat, {sticker: buffer}, {quoted: mek});
}
else {
  return reply("*Uhh, Please reply to an image.*");
}
});
cmd({
  pattern: 'take',
  alias: ['rename', 'stake'],
  use: '<reply media or URL>',
  filename: __filename,
}, async (conn, mek, m, {quoted, args, q, reply, from}) => {
if (!mek.quoted)
return reply(`*Reply to any sticker.*`);
if (!q)
return reply(`*Please provide a pack name using .take <packname>*`);
let mime = mek.quoted.mtype;
let pack = q;
if (mime === "imageMessage" || mime === "stickerMessage") {
  let media = await mek.quoted.download();
  let sticker = new Sticker(media, {
    pack: pack,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    id: "12345",
    quality: 75,
    background: 'transparent',
  });
const buffer = await sticker.toBuffer();
return conn.sendMessage(mek.chat, {sticker: buffer}, {quoted: mek});
}
else {
  return reply("*Uhh, Please reply to an image.*");
}
});
cmd({
  pattern: "tts3",
  react: "🔊",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try {
  if (!q) {
    return reply("Please provide text for conversion! Usage: `.tts3 <text>`");
  }
let voiceLanguage = 'en-US';
if (args[0] === "ur" || args[0] === "urdu") {
  voiceLanguage = 'ur';
}
const url = googleTTS.getAudioUrl(q, {
  lang: voiceLanguage,
  slow: false,
  host: 'https://translate.google.com'
});
await conn.sendMessage(from, {
  audio: {url: url},
  mimetype: 'audio/mpeg',
  ptt: false
}, {quoted: mek});
}
catch (error) {
  console.error(error);
  reply(`Error: ${error.message}`);
}
});
cmd({
  pattern: "fetch",
  alias: ["get", "api"],
  react: "🌐",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, args, reply}) => {
try {
  const q = args.join(' ').trim();
  if (!q)
  return reply('❌ Please provide a valid URL or query.');
  if (!/^https?:\/\//.test(q))
  return reply('❌ Please provide a valid URL.');
  const data = await fetchJson(q);
  const content = JSON.stringify(data, null, 2);
  await conn.sendMessage(from, {
    text: `🔍 *Fetched Data*:\n\`\`\`${content.slice(0, 2048)}\`\`\``,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardingSourceMessage: 'Your Data Request',
    }
}, {quoted: mek});
}
catch (e) {
  console.error("Error in fetch command:", e);
  reply(`❌ An error occurred:\n${e.message}`);
}
});
cmd({
  pattern: "trt",
  alias: ["translate"],
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, {from, q, reply}) => {
try {
  const args = q.split(' ');
  if (args.length < 2)
  return reply("❗ Please provide a language code and text. Usage: .translate [language code] [text]");
  const targetLang = args[0];
  const textToTranslate = args.slice(1).join(' ');
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`;
  const response = await axios.get(url);
  const translation = response.data.responseData.translatedText;
  const translationMessage = `> *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 TRANSLATION*
  > 🔤 *Original*: ${textToTranslate}
  > 🔠 *Translated*: ${translation}
  > 🌐 *Language*: ${targetLang.toUpperCase()}`;
  return reply(translationMessage);
}
catch (e) {
  console.log(e);
  return reply("⚠️ An error occurred data while translating the your text. Please try again later🤕");
}
});
cmd({
  pattern: 'vsticker',
  alias: ['gsticker', 'g2s', 'gs', 'v2s', 'vs',],
  use: '<reply media or URL>',
  filename: __filename,
}, async (conn, mek, m, {quoted, args, reply}) => {
try {
  if (!mek.quoted)
  return reply('*Reply to a video or GIF to convert it to a sticker!*');
  const mime = mek.quoted.mtype;
  if (!['videoMessage', 'imageMessage'].includes(mime)) {
    return reply('*Please reply to a valid video or GIF.*');
  }
const media = await mek.quoted.download();
const webpBuffer = await videoToWebp(media);
const sticker = new Sticker(webpBuffer, {
  pack: config.STICKER_NAME || 'My Pack',
  author: '',
  type: StickerTypes.FULL,
  categories: ['🤩', '🎉'],
  id: '12345',
  quality: 75,
  background: 'transparent',
});
const stickerBuffer = await sticker.toBuffer();
return conn.sendMessage(mek.chat, {sticker: stickerBuffer}, {quoted: mek});
}
catch (error) {
  console.error(error);
  reply(`❌ An error occurred: ${error.message}`);
}
});
cmd({
  pattern: "topdf",
  alias: ["pdf", "topdf"], use: '.topdf',
  react: "📄",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try {
  if (!q)
  return reply("Please provide the text you want to convert to PDF. *Eg* `.topdf` *English Language*");
  const doc = new PDFDocument();
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', async () => {
    const pdfData = Buffer.concat(buffers);
    await conn.sendMessage(from, {
      document: pdfData,
      mimetype: 'application/pdf',
      fileName: '𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳.pdf',
      caption: `
      *📄 PDF created successully!*
      > © Created By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ☣️`
    }, {quoted: mek});
});
doc.text(q);
doc.end();
}
catch (e) {
  console.error(e);
  reply(`Error: ${e.message}`);
}
});
cmd({
  pattern: 'brat',
  alias: ['bratsticker'],
  react: '💅',
  filename: __filename,
}, async (conn, mek, m, {args, reply}) => {
const text = (args.length ? args.join(' ') : m?.quoted?.text) || null;
if (!text)
return reply('❌ Please enter text!\n\nExample: .brat Hello');
await conn.sendMessage(m.chat, {react: {text: '⏳', key: mek.key}});
try {
  const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(text)}`;
  const res = await fetch(apiUrl);
  if (!res.ok)
  throw new Error(`HTTP ${res.status}`);
  const buffer = await res.buffer();
  const sticker = new Sticker(buffer, {
    pack: 'NovaCore AI',
    author: 'Brat Generator',
    type: 'full',
    quality: 80
  });
await conn.sendMessage(m.chat, {sticker: await sticker.build()}, {quoted: mek});
await conn.sendMessage(m.chat, {react: {text: '✅', key: mek.key}});
}
catch (e) {
  console.error(e);
  await conn.sendMessage(m.chat, {react: {text: '❌', key: mek.key}});
  reply(`⚠️ Failed to create sticker: ${e.message}`);
}
});
cmd({
  pattern: "tts2",
  react: "🔊",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try {
  if (!q) {
    return reply("Please provide text for conversion! Usage: `.tts2 <text>`");
  }
let voiceLanguage = 'en-US';
let selectedVoice = 'male';
if (args[0] === "male") {
  voiceLanguage = 'en-US';
}
else if (args[0] === "female") {
  voiceLanguage = 'en-GB';
  selectedVoice = 'female';
}
else if (args[0] === "loud") {
  voiceLanguage = 'en-US';
}
else if (args[0] === "deep") {
  voiceLanguage = 'en-US';
}
else {
  voiceLanguage = 'en-US';
}
const url = googleTTS.getAudioUrl(q, {
  lang: voiceLanguage,
  slow: false,
  host: 'https://translate.google.com'
});
await conn.sendMessage(from, {
  audio: {url: url},
  mimetype: 'audio/mpeg',
  ptt: false
}, {quoted: mek});
}
catch (error) {
  console.error(error);
  reply(`Error: ${error.message}`);
}
});
cmd({
  pattern: 'convert',
  alias: ['sticker2img', 'stoimg', 'stickertoimage', 's2i'],
  react: '🖼️',
  filename: __filename
}, async (client, match, message, {from}) => {
if (!message.quoted) {
  return await client.sendMessage(from, {
    text: "✨ *Sticker Converter*\n\nPlease reply to a sticker message\n\nExample: `.convert` (reply to sticker)"
  }, {quoted: message});
}
if (message.quoted.mtype !== 'stickerMessage') {
  return await client.sendMessage(from, {
    text: "❌ Only sticker messages can be converted"
  }, {quoted: message});
}
await client.sendMessage(from, {
  text: "🔄 Converting sticker to image..."
}, {quoted: message});
try {
  const stickerBuffer = await message.quoted.download();
  const imageBuffer = await stickerConverter.convertStickerToImage(stickerBuffer);
  await client.sendMessage(from, {
    image: imageBuffer,
    caption: "> Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ☣️",
    mimetype: 'image/png'
  }, {quoted: message});
}
catch (error) {
  console.error('Conversion error:', error);
  await client.sendMessage(from, {
    text: "❌ Please try with a different sticker."
  }, {quoted: message});
}
});
cmd({
  pattern: 'tomp3',
  react: '🎵',
  filename: __filename
}, async (client, match, message, {from}) => {
if (!match.quoted) {
  return await client.sendMessage(from, {
    text: "*🔊 Please reply to a video/audio message*"
  }, {quoted: message});
}
if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
  return await client.sendMessage(from, {
    text: "❌ Only video/audio messages can be converted"
  }, {quoted: message});
}
if (match.quoted.seconds > 300) {
  return await client.sendMessage(from, {
    text: "⏱️ Media too long (max 5 minutes)"
  }, {quoted: message});
}
await client.sendMessage(from, {
  text: "🔄 Converting to audio..."
}, {quoted: message});
try {
  const buffer = await match.quoted.download();
  const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
  const audio = await converter.toAudio(buffer, ext);
  await client.sendMessage(from, {
    audio: audio,
    mimetype: 'audio/mpeg'
  }, {quoted: message});
}
catch (e) {
  console.error('Conversion error:', e.message);
  await client.sendMessage(from, {
    text: "❌ Failed to process audio"
  }, {quoted: message});
}
});
cmd({
  pattern: 'toptt',
  react: '🎙️',
  filename: __filename
}, async (client, match, message, {from}) => {
if (!match.quoted) {
  return await client.sendMessage(from, {
    text: "*🗣️ Please reply to a video/audio message*"
  }, {quoted: message});
}
if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
  return await client.sendMessage(from, {
    text: "❌ Only video/audio messages can be converted"
  }, {quoted: message});
}
if (match.quoted.seconds > 60) {
  return await client.sendMessage(from, {
    text: "⏱️ Media too long for voice (max 1 minute)"
  }, {quoted: message});
}
await client.sendMessage(from, {
  text: "🔄 Converting to voice message..."
}, {quoted: message});
try {
  const buffer = await match.quoted.download();
  const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
  const ptt = await converter.toPTT(buffer, ext);
  await client.sendMessage(from, {
    audio: ptt,
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true
  }, {quoted: message});
}
catch (e) {
  console.error('PTT conversion error:', e.message);
  await client.sendMessage(from, {
    text: "❌ Failed to create voice message"
  }, {quoted: message});
}
});
cmd({
  pattern: "img2url",
  alias: ["imgurl2", "url2", "geturl2"],
  react: "🖇",
  use: ".img2url [reply to image]",
  filename: __filename,
}, async (client, message, args, {reply}) => {
try {
  const quotedMsg = message.quoted ? message.quoted : message;
  const mimeType = (quotedMsg.msg || quotedMsg).mimetype || "";
  if (!mimeType || !mimeType.startsWith("image/")) {
    throw "⚠️ Please reply to an image (JPG, PNG, or GIF)";
  }
const mediaBuffer = await quotedMsg.download();
const tempFilePath = path.join(os.tmpdir(), `imgbb_${Date.now()}`);
fs.writeFileSync(tempFilePath, mediaBuffer);
const form = new FormData();
form.append("image", fs.createReadStream(tempFilePath));
const expiration = 600;
const imgbbApiKey = "eb6ec8d812ae32e7a1a765740fd1b497";
const response = await axios.post(`https://api.imgbb.com/1/upload?expiration=${expiration}&key=${imgbbApiKey}`, form, {headers: form.getHeaders()});
fs.unlinkSync(tempFilePath);
const data = response.data.data;
if (!data || !data.url)
throw "❌ Upload failed.";
await reply(`✅ *Image Uploaded Successfully!*\n\n` +
`🖼 *Filename:* ${data.image.filename}\n` +
`📏 *Size:* ${formatBytes(mediaBuffer.length)}\n` +
`🔗 *Direct URL:* ${data.url}\n` +
`> © Uploaded by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ☣️`);
}
catch (error) {
  console.error(error);
  await reply(`❌ Error: ${error.message || error}`);
}
});
cmd({
  'pattern': "tourl",
  'alias': ["imgtourl", "imgurl", "url", "geturl", "upload"],
  'react': '🖇',
  'use': ".tourl [reply to media]",
  'filename': __filename
}, async (client, message, args, {reply}) => {
try {
  const quotedMsg = message.quoted ? message.quoted : message;
  const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
  if (!mimeType) {
    throw "Please reply to an image, video, or audio file";
  }
const mediaBuffer = await quotedMsg.download();
const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);
fs.writeFileSync(tempFilePath, mediaBuffer);
let extension = '';
if (mimeType.includes('image/jpeg'))
extension = '.jpg';
else if (mimeType.includes('image/png'))
extension = '.png';
else if (mimeType.includes('video'))
extension = '.mp4';
else if (mimeType.includes('audio'))
extension = '.mp3';
const fileName = `file${extension}`;
const form = new FormData();
form.append('fileToUpload', fs.createReadStream(tempFilePath), fileName);
form.append('reqtype', 'fileupload');
const response = await axios.post("https://catbox.moe/user/api.php", form, {
  headers: form.getHeaders()
});
if (!response.data) {
  throw "Error uploading to Catbox";
}
const mediaUrl = response.data;
fs.unlinkSync(tempFilePath);
let mediaType = 'File';
if (mimeType.includes('image'))
mediaType = 'Image';
else if (mimeType.includes('video'))
mediaType = 'Video';
else if (mimeType.includes('audio'))
mediaType = 'Audio';
await reply(`*${mediaType} Uploaded Successfully*\n\n` +
`*Size:* ${formatBytes(mediaBuffer.length)}\n` +
`*URL:* ${mediaUrl}\n\n` +
`> © Uploaded by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ☣️`);
}
catch (error) {
  console.error(error);
  await reply(`Error: ${error.message || error}`);
}
});
function formatBytes(bytes) {
  if (bytes === 0)
  return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
cmd({
  pattern: "caption",
  alias: ["cap", "recaption", "c"],
  react: '✏️',
  filename: __filename
}, async (client, message, match, {from}) => {
try {
  if (!message.quoted) {
    return await client.sendMessage(from, {
      text: "*❗️ Please reply to a media message (image/video/document) to add caption!*\n\n*Usage:*\n- Reply to media with .caption [your text]\n- Or just .caption [text] to add caption to previous media"
    }, {quoted: message});
}
const quotedMsg = message.quoted;
if (!quotedMsg || !quotedMsg.download) {
  return await client.sendMessage(from, {
    text: "❌ The quoted message is not valid media"
  }, {quoted: message});
}
const buffer = await quotedMsg.download();
const mtype = quotedMsg.mtype;
const cmdText = message.body.split(' ')[0].toLowerCase();
const newCaption = message.body.slice(cmdText.length).trim();
if (!buffer) {
  return await client.sendMessage(from, {
    text: "❌ Failed to download the media"
  }, {quoted: message});
}
const messageContent = {
  caption: newCaption,
  mimetype: quotedMsg.mimetype
};
switch (mtype) {
  case "imageMessage":
  messageContent.image = buffer;
  messageContent.mimetype = messageContent.mimetype || "image/jpeg";
  break;
  case "videoMessage":
  messageContent.video = buffer;
  messageContent.mimetype = messageContent.mimetype || "video/mp4";
  break;
  case "documentMessage":
  messageContent.document = buffer;
  messageContent.mimetype = messageContent.mimetype || "application/octet-stream";
  break;
  case "audioMessage":
  messageContent.audio = buffer;
  messageContent.mimetype = messageContent.mimetype || "audio/mp4";
  messageContent.ptt = quotedMsg.ptt || false;
  break;
  default:
  return await client.sendMessage(from, {
    text: "❌ Only image, video, document and audio messages can be recaptioned"
  }, {quoted: message});
}
await client.sendMessage(from, messageContent, {quoted: message});
}
catch (error) {
  console.error("Caption Error:", error);
  await client.sendMessage(from, {
    text: "❌ Error adding caption:\n" + (error.message || error.toString())
  }, {quoted: message});
}
});
function formatBytes(bytes) {
  if (bytes === 0)
  return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
cmd({
  pattern: "aivoice",
  alias: ["vai", "voicex", "voiceai"],
  react: "🪃",
  filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try {
  if (!args[0]) {
    return reply("Please provide text after the command.\nExample: .aivoice hello");
  }
const inputText = args.join(' ');
await conn.sendMessage(from, {
  react: {text: '⏳', key: m.key}
});
const voiceModels = [
{number: "1", name: "Hatsune Miku", model: "miku"},
{number: "2", name: "Nahida (Exclusive)", model: "nahida"},
{number: "3", name: "Nami", model: "nami"},
{number: "4", name: "Ana (Female)", model: "ana"},
{number: "5", name: "Optimus Prime", model: "optimus_prime"},
{number: "6", name: "Goku", model: "goku"},
{number: "7", name: "Taylor Swift", model: "taylor_swift"},
{number: "8", name: "Elon Musk", model: "elon_musk"},
{number: "9", name: "Mickey Mouse", model: "mickey_mouse"},
{number: "10", name: "Kendrick Lamar", model: "kendrick_lamar"},
{number: "11", name: "Angela Adkinsh", model: "angela_adkinsh"},
{number: "12", name: "Eminem", model: "eminem"}
];
let menuText = "╭━━━〔 *AI VOICE MODELS* 〕━━━⊷\n";
voiceModels.forEach(model => {
  menuText += `┃▸ ${model.number}. ${model.name}\n`;
});
menuText += "╰━━━⪼\n\n";
menuText += `📌 *Reply with the number to select voice model for:*\n"${inputText}"`;
const sentMsg = await conn.sendMessage(from, {
  image: {url: config.ALIVE_IMG},
  caption: menuText
}, {quoted: m});
const messageID = sentMsg.key.id;
let handlerActive = true;
const handlerTimeout = setTimeout(() => {
  handlerActive = false;
  conn.ev.off("messages.upsert", messageHandler);
  reply("⌛ Voice selection timed out. Please try the command again.");
}, 120000);
const messageHandler = async (msgData) => {
  if (!handlerActive)
  return;
  const receivedMsg = msgData.messages[0];
  if (!receivedMsg || !receivedMsg.message)
  return;
  const receivedText = receivedMsg.message.conversation ||
  receivedMsg.message.extendedTextMessage?.text ||
  receivedMsg.message.buttonsResponseMessage?.selectedButtonId;
  const senderID = receivedMsg.key.remoteJid;
  const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
  if (isReplyToBot && senderID === from) {
    clearTimeout(handlerTimeout);
    conn.ev.off("messages.upsert", messageHandler);
    handlerActive = false;
    await conn.sendMessage(senderID, {
      react: {text: '⬇️', key: receivedMsg.key}
    });
  const selectedNumber = receivedText.trim();
  const selectedModel = voiceModels.find(model => model.number === selectedNumber);
  if (!selectedModel) {
    return reply("❌ Invalid option! Please reply with a number from the menu.");
  }
try {
  await conn.sendMessage(from, {
    text: `🔊 Generating audio with ${selectedModel.name} voice...`
  }, {quoted: receivedMsg});
const apiUrl = `https://api.agatz.xyz/api/voiceover?text=${encodeURIComponent(inputText)}&model=${selectedModel.model}`;
const response = await axios.get(apiUrl, {
  timeout: 30000
});
const data = response.data;
if (data.status === 200) {
  await conn.sendMessage(from, {
    audio: {url: data.data.oss_url},
    mimetype: "audio/mpeg"
  }, {quoted: receivedMsg});
}
else {
  reply("❌ Error generating audio. Please try again.");
}
}
catch (error) {
  console.error("API Error:", error);
  reply("❌ Error processing your request. Please try again.");
}
}
};
conn.ev.on("messages.upsert", messageHandler);
}
catch (error) {
  console.error("Command Error:", error);
  reply("❌ An error occurred. Please try again.");
}
});
