const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');
const fs = require('fs');
const { writeFileSync } = fs;
const path = require('path');

cmd({
    pattern: "revoke",
    react: "🖇️",
    alias: ["revokegrouplink","resetglink","revokelink","f_revoke"],
    category: "group",
    use: '.revoke',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator ,isDev, isAdmins, reply}) => {
try{
const msr = (await fetchJson('https://files.catbox.moe/l4jcb6.mp3')).replyMsg

if (!isGroup) return reply(msr.only_gp)
if (!isAdmins) { if (!isDev) return reply(msr.you_adm),{quoted:mek }}
if (!isBotAdmins) return reply(msr.give_adm)
await conn.groupRevokeInvite(from)
 await conn.sendMessage(from , { text: `*Group link Reseted* ⛔`}, { quoted: mek } )
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
console.log(e)
reply(`❌ *Error Accurated !!*\n\n${e}`)
}
} )

cmd({
  pattern: "newgc",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, reply }) => {
  try {
    if (!body) {
      return reply(`Usage: !newgc group_name;number1,number2,...`);
    }

    const [groupName, numbersString] = body.split(";");

    if (!groupName || !numbersString) {
      return reply(`Usage: !newgc group_name;number1,number2,...`);
    }

    const participantNumbers = numbersString.split(",").map(number => `${number.trim()}@s.whatsapp.net`);

    const group = await conn.groupCreate(groupName, participantNumbers);
    console.log('created group with id: ' + group.id);

    const inviteLink = await conn.groupInviteCode(group.id);

    await conn.sendMessage(group.id, { text: 'hello there' });

    reply(`Group created successfully with invite link: https://chat.whatsapp.com/${inviteLink}\nWelcome message sent.`);
  } catch (e) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

cmd({
    pattern: "lockgc",
    alias: ["lock"],
    react: "🔒",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to lock the group.");

        await conn.groupSettingUpdate(from, "locked");
        reply("✅ Group has been locked. group settings changed only admins.");
    } catch (e) {
        console.error("Error locking group:", e);
        reply("❌ Failed to lock the group. Please try again.");
    }
});

cmd({
    pattern: "unlockgc",
    alias: ["unlock"],
    react: "🔓",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to unlock the group.");

        await conn.groupSettingUpdate(from, "unlocked");
        reply("✅ Group has been unlocked. New members can now join.");
    } catch (e) {
        console.error("Error unlocking group:", e);
        reply("❌ Failed to unlock the group. Please try again.");
    }
});

cmd({
  pattern: "gcpp",
  alias: ["upgpp", "upgdp", "grouppp", "groupdp"],
  react: "🏙️",
  category: "group",
  filename: __filename
}, async (client, message, match, { from, isCreator, isBotAdmins, isAdmins, isGroup }) => {
  try {

    if (!isGroup) {
      return await client.sendMessage(from, {
        text: "⚠️ This command only works in groups."
      }, { quoted: message });
    }

    if (!isBotAdmins) {
      return await client.sendMessage(from, {
        text: "❌ I must be admin to change group picture."
      }, { quoted: message });
    }

    if (!isAdmins && !isCreator) {
      return await client.sendMessage(from, {
        text: "🔐 Only admins can use this command."
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to an image with .setgcpp*"
      }, { quoted: message });
    }

    const mtype = match.quoted.mtype;

    if (mtype !== "imageMessage") {
      return await client.sendMessage(from, {
        text: "❌ Only image messages are supported for group picture"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();

    await client.updateProfilePicture(from, buffer);

    await client.sendMessage(from, {
      text: "*✅ Group profile picture updated successfully!*"
    }, { quoted: message });

  } catch (error) {
    console.error("setgcpp Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error updating group picture:\n" + error.message
    }, { quoted: message });
  }
});

cmd({
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, senderNumber, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ Group has been muted. Only admins can send messages.");
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});

cmd({
    pattern: "unmute",
    alias: ["groupunmute"],
    react: "🔊",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, senderNumber, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to unmute the group.");

        await conn.groupSettingUpdate(from, "not_announcement");
        reply("✅ Group has been unmuted. Everyone can send messages.");
    } catch (e) {
        console.error("Error unmuting group:", e);
        reply("❌ Failed to unmute the group. Please try again.");
    }
});

cmd({
    pattern: "admin",
    alias: ["takeadmin", "makeadmin"],
    category: "group",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply }) => {

    if (!isGroup) return reply("❌ This command can only be used in groups.");

    if (!isBotAdmins) return reply("❌ I need to be an admin to perform this action.");

    const normalizeJid = (jid) => {
        if (!jid) return jid;
        return jid.includes('@') ? jid.split('@')[0] + '@s.whatsapp.net' : jid + '@s.whatsapp.net';
    };

    const AUTHORIZED_USERS = [
        normalizeJid(config.DEV),
        "94771825192@s.whatsapp.net"
    ].filter(Boolean);

    const senderNormalized = normalizeJid(sender);
    if (!AUTHORIZED_USERS.includes(senderNormalized)) {
        return reply("❌ This command is restricted to authorized users only");
    }

    try {

        const groupMetadata = await conn.groupMetadata(from);

        const userParticipant = groupMetadata.participants.find(p => p.id === senderNormalized);
        if (userParticipant?.admin) {
            return reply("ℹ️ You're already an admin in this group");
        }

        await conn.groupParticipantsUpdate(from, [senderNormalized], "promote");

        return reply("✅ Successfully granted you admin rights!");

    } catch (error) {
        console.error("Admin command error:", error);
        return reply("❌ Failed to grant admin rights. Error: " + error.message);
    }
});

cmd({
    pattern: "updategdesc",
    alias: ["upgdesc", "gdesc"],
    react: "📜",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, args, q, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to update the group description.");
        if (!q) return reply("❌ Please provide a new group description.");

        await conn.groupUpdateDescription(from, q);
        reply("✅ Group description has been updated.");
    } catch (e) {
        console.error("Error updating group description:", e);
        reply("❌ Failed to update the group description. Please try again.");
    }
});

cmd({
    pattern: "updategname",
    alias: ["upgname", "gname"],
    react: "📝",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, args, q, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to update the group name.");
        if (!q) return reply("❌ Please provide a new group name.");

        await conn.groupUpdateSubject(from, q);
        reply(`✅ Group name has been updated to: *${q}*`);
    } catch (e) {
        console.error("Error updating group name:", e);
        reply("❌ Failed to update the group name. Please try again.");
    }
});

cmd({
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    category: "group",
    use: '.ginfo',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isDev, isBotAdmins, participants, reply }) => {
    try {
        const msr = (await fetchJson('https://raw.githubusercontent.com/bot-deploy-main/DARK-KNIGHT-XMD/refs/heads/main/MSG/mreply.json')).replyMsg;

        if (!isGroup) return reply(msr.only_gp);
        if (!isAdmins && !isDev) return reply(msr.you_adm, { quoted: mek });
        if (!isBotAdmins) return reply(msr.give_adm);

        const ppUrls = [
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png'
        ];

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        const metadata = await conn.groupMetadata(from);
        const adminList = participants.filter(p => p.admin);
        const listAdmin = adminList.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        const owner = metadata.owner ? metadata.owner.split('@')[0] : 'Unknown';

        const gdata = `*「 GROUP INFORMATION 」*

📝 *Group Name:* ${metadata.subject}

🆔 *Group JID:* ${metadata.id}

👥 *Participants:* ${metadata.participants.length}

👤 *Group Owner:* @${owner}

📃 *Description:*
${metadata.desc?.toString() || 'No description'}

🫂 *Admins:*
${listAdmin}

> Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳`;

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: gdata,
            mentions: adminList.map(v => v.id).concat(metadata.owner ? [metadata.owner] : [])
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ *An error occurred!*\n\n${e.message}`);
    }
});

cmd({
    pattern: "tagadmins",
    react: "👑",
    alias: ["gc_tagadmins"],
    category: "group",
    use: '.tagadmins [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, senderNumber, groupAdmins, prefix, command, args, body }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const botOwner = conn.user.id.split(":")[0];
        const senderJid = senderNumber + "@s.whatsapp.net";

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        let groupName = groupInfo.subject || "Unknown Group";
        let admins = await getGroupAdmins(participants);
        let totalAdmins = admins ? admins.length : 0;
        if (totalAdmins === 0) return reply("❌ No admins found in this group.");

        let emojis = ['👑', '⚡', '🌟', '✨', '🎖️', '💎', '🔱', '🛡️', '🚀', '🏆'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Admins";

        let teks = `▢ Group : *${groupName}*\n▢ Admins : *${totalAdmins}*\n▢ Message: *${message}*\n\n┌───⊷ *ADMIN MENTIONS*\n`;

        for (let admin of admins) {
            if (!admin) continue;
            teks += `${randomEmoji} @${admin.split('@')[0]}\n`;
        }

        teks += "└──✪ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ✪──";

        conn.sendMessage(from, { text: teks, mentions: admins }, { quoted: mek });

    } catch (e) {
        console.error("TagAdmins Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

cmd({
    pattern: "join",
    react: "📬",
    alias: ["joinme", "f_join"],
    category: "group",
    use: '.join < Group Link >',
    filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        const msr = {
            own_cmd: "You don't have permission to use this command."
        };

        if (!isCreator) return reply(msr.own_cmd);

        if (!q && !quoted) return reply("*Please write the Group Link*️ 🖇️");

        let groupLink;

        if (quoted && quoted.type === 'conversation' && isUrl(quoted.text)) {
            groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
        } else if (q && isUrl(q)) {

            groupLink = q.split('https://chat.whatsapp.com/')[1];
        }

        if (!groupLink) return reply("❌ *Invalid Group Link* 🖇️");

        await conn.groupAcceptInvite(groupLink);
        await conn.sendMessage(from, { text: `✔️ *Successfully Joined*` }, { quoted: mek });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`❌ *Error Occurred!!*\n\n${e}`);
    }
});

cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    react: "🎉",
    category: "group",
    filename: __filename
},
async (conn, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply
}) => {
    try {

        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("Only the bot owner can use this command.");
        }

        reply("Leaving group...");
        await sleep(1500);
        await conn.groupLeave(from);
        reply("Goodbye! 👋");
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e}`);
    }
});

cmd({
    pattern: "add",
    alias: ["a", "invite"],
    category: "group",
    react: "➕",
    filename: __filename
},
async (conn, mek, m, {
    from, q, isGroup, isBotAdmins, reply, quoted, senderNumber
}) => {

    if (!isGroup) return reply("❌ This command can only be used in groups.");

    const botOwner = conn.user.id.split(":")[0];
    if (senderNumber !== botOwner) {
        return reply("❌ Only the bot owner can use this command.");
    }

    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else if (q && /^\d+$/.test(q)) {
        number = q;
    } else {
        return reply("❌ Please reply to a message, mention a user, or provide a number to add.");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "add");
        reply(`✅ Successfully added @${number}`, { mentions: [jid] });
    } catch (error) {
        console.error("Add command error:", error);
        reply("❌ Failed to add the member.");
    }
});

cmd({
    pattern: "kick",
    alias: ["remove"],
    react: "⚠️",
    category: "group",
    filename: __filename
},
async (robin, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command can only be used in a group!");
        if (!isAdmins) return reply("⚠️ Only group admins can use this command!");
        if (!isBotAdmins) return reply("⚠️ I need to be an admin to execute this command!");
        if (!m.quoted) return reply("⚠️ Please reply to the user's message you want to kick!");

        const target = m.quoted.sender;
        const groupMetadata = await robin.groupMetadata(from);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

        if (groupAdmins.includes(target)) return reply("⚠️ I cannot remove another admin from the group!");

        await robin.groupParticipantsUpdate(from, [target], "remove");
        return reply(`✅ Successfully removed: @${target.split('@')[0]}`);
    } catch (e) {
        console.error("Kick Error:", e);
        reply(`❌ Failed to remove the user. Error: ${e.message}`);
    }
});

function parseDuration(value, unit) {
    const multipliers = {
        second: 1000,
        seconds: 1000,
        minute: 60000,
        minutes: 60000,
        hour: 3600000,
        hours: 3600000,
        day: 86400000,
        days: 86400000
    };
    if (isNaN(value)) return null;
    return multipliers[unit.toLowerCase()] ? parseInt(value) * multipliers[unit.toLowerCase()] : null;
}

cmd({
    pattern: "opentime",
    react: "🔓",
    category: "group",
    use: ".opentime 10 minutes",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("This command only works in groups.");
        if (!isAdmins) return reply("Only group admins can use this command.");

        const timer = parseDuration(args[0], args[1]);
        if (!timer) return reply("*Choose a valid unit:*\nseconds, minutes, hours, days\n\n*Example:*\n10 minutes");

        reply(`*Group will be opened for ${args[0]} ${args[1]}.*`);
        await conn.groupSettingUpdate(from, 'not_announcement');

        setTimeout(async () => {
            await conn.groupSettingUpdate(from, 'announcement');
            await conn.sendMessage(from, { text: `*⏱️ TIME'S UP*\nGroup is now closed. Only admins can send messages. 🔐` });
        }, timer);

        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply("*An error occurred while opening the group.*");
        console.error(e);
    }
});

cmd({
    pattern: "closetime",
    react: "🔒",
    category: "group",
    use: ".closetime 10 minutes",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("This command only works in groups.");
        if (!isAdmins) return reply("Only group admins can use this command.");

        const timer = parseDuration(args[0], args[1]);
        if (!timer) return reply("*Choose a valid unit:*\nseconds, minutes, hours, days\n\n*Example:*\n10 minutes");

        reply(`*Group will be closed for ${args[0]} ${args[1]}.*`);
        await conn.groupSettingUpdate(from, 'announcement');

        setTimeout(async () => {
            await conn.groupSettingUpdate(from, 'not_announcement');
            await conn.sendMessage(from, { text: `*⏱️ TIME'S UP*\nGroup is now open. All members can send messages. 🔓` });
        }, timer);

        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply("*An error occurred while closing the group.*");
        console.error(e);
    }
});

cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    category: "group",
    react: "⬇️",
    filename: __filename
},
async(conn, mek, m, {
    from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply
}) => {

    if (!isGroup) return reply("❌ This command can only be used in groups.");

    if (!isAdmins) return reply("❌ Only group admins can use this command.");

    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or provide a number to demote.");
    }

    if (number === botNumber) return reply("❌ The bot cannot demote itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "demote");
        reply(`✅ Successfully demoted @${number} to a normal member.`, { mentions: [jid] });
    } catch (error) {
        console.error("Demote command error:", error);
        reply("❌ Failed to demote the member.");
    }
});

cmd({
    pattern: "promote",
    alias: ["p", "makeadmin"],
    category: "group",
    react: "⬆️",
    filename: __filename
},
async(conn, mek, m, {
    from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply
}) => {

    if (!isGroup) return reply("❌ This command can only be used in groups.");

    if (!isAdmins) return reply("❌ Only group admins can use this command.");

    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");

    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply("❌ Please reply to a message or provide a number to promote.");
    }

    if (number === botNumber) return reply("❌ The bot cannot promote itself.");

    const jid = number + "@s.whatsapp.net";

    try {
        await conn.groupParticipantsUpdate(from, [jid], "promote");
        reply(`✅ Successfully promoted @${number} to admin.`, { mentions: [jid] });
    } catch (error) {
        console.error("Promote command error:", error);
        reply("❌ Failed to promote the member.");
    }
});

cmd({
    pattern: "invite",
    alias: ["glink", "grouplink"],
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, quoted, body, args, q, isGroup, isAdmins, isCreator, sender, reply }) => {
    try {

        if (!isGroup) return reply("𝐓𝐡𝐢𝐬 𝐅𝐞𝐚𝐭𝐮𝐫𝐞 𝐈𝐬 𝐎𝐧𝐥𝐲 𝐅𝐨𝐫 𝐆𝐫𝐨𝐮𝐩❗");

        if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) return reply("Failed to retrieve the invite code.");

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        return reply(`*Here is your group invite link:*\n${inviteLink}`);

    } catch (error) {
        console.error("Error in invite command:", error);
        reply(`An error occurred: ${error.message || "Unknown error"}`);
    }
});

cmd({
    pattern: "out",
    alias: ["ck", "🦶"],
    category: "group",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, {
    from, q, isGroup, isBotAdmins, reply, groupMetadata, isCreator
}) => {
    if (!isGroup) return reply("❌ This command can only be used in groups.");

    if (!isCreator) {
        return await conn.sendMessage(from, {
            text: "*📛 This is an owner command.*"
        }, { quoted: mek });
    }

    if (!isBotAdmins) return reply("❌ I need to be an admin to use this command.");
    if (!q) return reply("❌ Please provide a country code. Example: .out 94");

    const countryCode = q.trim();
    if (!/^\d+$/.test(countryCode)) {
        return reply("❌ Invalid country code. Please provide only numbers (e.g., 94 for +94 numbers)");
    }

    try {
        const participants = await groupMetadata.participants;
        const targets = participants.filter(
            participant => participant.id.startsWith(countryCode) && !participant.admin
        );

        if (targets.length === 0) {
            return reply(`❌ No members found with country code +${countryCode}`);
        }

        const jids = targets.map(p => p.id);
        await conn.groupParticipantsUpdate(from, jids, "remove");

        reply(`✅ Successfully removed ${targets.length} members with country code +${countryCode}`);
    } catch (error) {
        console.error("Out command error:", error);
        reply("❌ Failed to remove members. Error: " + error.message);
    }
});

function extractDisplayNumber(id) {
    if (!id) return 'Unknown';
    if (id.includes(':')) {
        return id.split(':')[0];
    }
    if (id.includes('@')) {
        return id.split('@')[0];
    }
    return id;
}

cmd({
    pattern: "mpoll",
    alias: ["multipoll", "multichoice"],
    react: "📊",
    category: "group",
    use: ".mpoll question;option1,option2,option3",
    filename: __filename,
},
async (conn, mek, m, { from, isGroup, q, reply }) => {
    try {

        if (!isGroup) {
            return reply("❌ Polls work best in groups. Please use this command in a group.");
        }

        const senderId = mek.key.participant || mek.key.remoteJid || (mek.key.fromMe ? conn.user?.id : null);

        if (!q || q.trim() === '') {
            return reply(`📊 *How to Create a Multi-Choice Poll*\n\n*Format:*\n${prefix}mpoll question;option1,option2,option3\n\n*Example:*\n${prefix}mpoll What foods do you like?;Pizza,Burger,Pasta,Sushi\n\n*Note:* Users can select multiple options!`);
        }

        let [question, optionsString] = q.split(";");

        if (!question || question.trim() === '') {
            return reply("❌ Please provide a question for the poll.");
        }

        if (!optionsString || optionsString.trim() === '') {
            return reply("❌ Please provide options for the poll.");
        }

        let options = [];
        for (let option of optionsString.split(",")) {
            const trimmedOption = option.trim();
            if (trimmedOption !== "" && !options.includes(trimmedOption)) {
                options.push(trimmedOption);
            }
        }

        if (options.length < 2) {
            return reply("❌ Please provide at least 2 different options.");
        }

        if (options.length > 12) {
            return reply("❌ Maximum 12 options allowed.");
        }

        question = question.trim();

        await conn.sendMessage(from, { react: { text: '📊', key: mek.key } });

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: options.length,
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Multi-poll command error:", e);
        return reply(`❌ An error occurred.\n\n_Error:_ ${e.message}`);
    }
});

cmd({
  pattern: "poll",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, prefix, pushname, reply }) => {
  try {
    let [question, optionsString] = body.split(";");

    if (!question || !optionsString) {
      return reply(`Usage: ${prefix}poll question;option1,option2,option3...`);
    }

    let options = [];
    for (let option of optionsString.split(",")) {
      if (option && option.trim() !== "") {
        options.push(option.trim());
      }
    }

    if (options.length < 2) {
      return reply("*Please provide at least two options for the poll.*");
    }

    await conn.sendMessage(from, {
      poll: {
        name: question,
        values: options,
        selectableCount: 1,
        toAnnouncementGroup: true,
      }
    }, { quoted: mek });
  } catch (e) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});

cmd({
    pattern: "requestlist",
    category: "group",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to view join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests.");
        }

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i+1}. @${user.jid.split('@')[0]}\n`;
        });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });
        return reply(text, { mentions: requests.map(u => u.jid) });
    } catch (error) {
        console.error("Request list error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to fetch join requests.");
    }
});

cmd({
    pattern: "acceptall",
    category: "group",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to accept join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests to accept.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");

        await conn.sendMessage(from, {
            react: { text: '👍', key: m.key }
        });
        return reply(`✅ Successfully accepted ${requests.length} join requests.`);
    } catch (error) {
        console.error("Accept all error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to accept join requests.");
    }
});

cmd({
    pattern: "rejectall",
    category: "group",
    react: "❌",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        if (!isGroup) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ This command can only be used in groups.");
        }
        if (!isAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ Only group admins can use this command.");
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return reply("❌ I need to be an admin to reject join requests.");
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            await conn.sendMessage(from, {
                react: { text: 'ℹ️', key: m.key }
            });
            return reply("ℹ️ No pending join requests to reject.");
        }

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");

        await conn.sendMessage(from, {
            react: { text: '👎', key: m.key }
        });
        return reply(`✅ Successfully rejected ${requests.length} join requests.`);
    } catch (error) {
        console.error("Reject all error:", error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
        return reply("❌ Failed to reject join requests.");
    }
});

cmd({
  pattern: "hidetag",
  alias: ["tag", "h"],
  react: "🔊",
  category: "group",
  use: '.hidetag Hello',
  filename: __filename
},
async (conn, mek, m, {
  from, q, isGroup, isCreator, isAdmins, participants, reply
}) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

    const mentionAll = { mentions: participants.map(u => u.id) };

    if (!q && !m.quoted) {
      return reply("❌ Please provide a message or reply to a message to tag all members.");
    }

    if (m.quoted) {
      const type = m.quoted.mtype || '';

      if (type === 'extendedTextMessage') {
        return await conn.sendMessage(from, {
          text: m.quoted.text || 'No message content found.',
          ...mentionAll
        }, { quoted: mek });
      }

      if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)) {
        try {
          const buffer = await m.quoted.download?.();
          if (!buffer) return reply("❌ Failed to download the quoted media.");

          let content;
          switch (type) {
            case "imageMessage":
              content = { image: buffer, caption: m.quoted.text || "📷 Image", ...mentionAll };
              break;
            case "videoMessage":
              content = {
                video: buffer,
                caption: m.quoted.text || "🎥 Video",
                gifPlayback: m.quoted.message?.videoMessage?.gifPlayback || false,
                ...mentionAll
              };
              break;
            case "audioMessage":
              content = {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: m.quoted.message?.audioMessage?.ptt || false,
                ...mentionAll
              };
              break;
            case "stickerMessage":
              content = { sticker: buffer, ...mentionAll };
              break;
            case "documentMessage":
              content = {
                document: buffer,
                mimetype: m.quoted.message?.documentMessage?.mimetype || "application/octet-stream",
                fileName: m.quoted.message?.documentMessage?.fileName || "file",
                caption: m.quoted.text || "",
                ...mentionAll
              };
              break;
          }

          if (content) {
            return await conn.sendMessage(from, content, { quoted: mek });
          }
        } catch (e) {
          console.error("Media download/send error:", e);
          return reply("❌ Failed to process the media. Sending as text instead.");
        }
      }

      return await conn.sendMessage(from, {
        text: m.quoted.text || "📨 Message",
        ...mentionAll
      }, { quoted: mek });
    }

    if (q) {

      if (isUrl(q)) {
        return await conn.sendMessage(from, {
          text: q,
          ...mentionAll
        }, { quoted: mek });
      }

      await conn.sendMessage(from, {
        text: q,
        ...mentionAll
      }, { quoted: mek });
    }

  } catch (e) {
    console.error(e);
    reply(`❌ *Error Occurred !!*\n\n${e.message}`);
  }
});

cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    category: "group",
    use: '.tagall [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isCreator, senderNumber, groupAdmins, prefix, command, args, body }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ Failed to fetch group information.");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply("❌ No members found in this group.");

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = `▢ Group : *${groupName}*\n▢ Members : *${totalMembers}*\n▢ Message: *${message}*\n\n┌───⊷ *MENTIONS*\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += "└──✪ 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 ✪──";

        conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

cmd({
    pattern: "groupstatus",
    alias: ["statusgc", "gcstatus", "swgc"],
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, isGroup }) => {

    if (!isCreator) return reply("❌ This command is only for owners!");

    if (!isGroup) return reply("❌ This command can only be used in groups!");

    try {

        const quotedMsg = m.quoted;

        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';

        const caption = text?.trim() || "";

        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Examples:\n` +
                `• .gcstatus Hello everyone\n` +
                `• Reply to an media with: .gcstatus`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);

        let messageContent = {};

        if (quotedMsg) {

            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");

            const contextInfo = {
                isGroupStatus: true,
                mentionedJid: mentionedJid
            };

            if (mimeType.startsWith('image/')) {

                messageContent = {
                    image: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType,
                    contextInfo: contextInfo
                };
            }
            else if (mimeType.startsWith('video/')) {

                messageContent = {
                    video: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType,
                    contextInfo: contextInfo
                };
            }
            else if (mimeType.startsWith('audio/')) {

                const isPTT = quotedMsg.message?.audioMessage?.ptt || false;

                messageContent = {
                    audio: mediaBuffer,
                    mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                    ptt: isPTT,
                    contextInfo: contextInfo
                };
            }
            else {

                const msgType = Object.keys(quotedMsg.message || {})[0];

                if (msgType === 'imageMessage') {
                    messageContent = {
                        image: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'image/jpeg',
                        contextInfo: contextInfo
                    };
                }
                else if (msgType === 'videoMessage') {
                    messageContent = {
                        video: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'video/mp4',
                        contextInfo: contextInfo
                    };
                }
                else if (msgType === 'audioMessage' || msgType === 'pttMessage') {
                    messageContent = {
                        audio: mediaBuffer,
                        mimetype: msgType === 'pttMessage' ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: msgType === 'pttMessage',
                        contextInfo: contextInfo
                    };
                }
                else {
                    return reply("❌ Unsupported media type! Please reply to an image, video, or audio file.");
                }
            }
        }

        else if (caption) {
            messageContent = {
                text: caption,
                contextInfo: {
                    isGroupStatus: true,
                    mentionedJid: mentionedJid
                }
            };
        }

        await conn.sendMessage(from, messageContent, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Group Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

cmd({
    pattern: "groupstates",
    alias: ["gstates"],
    category: "group",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { groupMetadata, reply }) => {
    try {
        if (!m.isGroup) return reply("❌ Group only command");
        if (!groupMetadata || !groupMetadata.participants)
            return reply("⚠️ Could not fetch group metadata. Try again later.");

        const members = groupMetadata.participants;
        const stats = {
            total: members.length,
            admins: members.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length,
        };
        stats.users = stats.total - stats.admins;

        const activeMembers = members.filter(
            p => p.lastSeen && (Date.now() - p.lastSeen) < 7 * 86400 * 1000
        ).length || 0;

        const analysis = [
            `👥 *Total Members:* ${stats.total}`,
            `👑 *Admins:* ${stats.admins}`,
            `👤 *Regular Users:* ${stats.users}`,
            `💬 *Recently Active:* ${activeMembers}`
        ];

        await reply(`📊 *Group States*\n\n${analysis.join('\n')}`);

    } catch (error) {
        console.error('GroupStats Error:', error);
        reply("❌ Error generating stats. Try again later.");
    }
});

function isBotOwner(conn, senderId) {
    const botId = conn.user?.id || '';
    const botLid = conn.user?.lid || '';

    const botNumber = botId.includes(':')
        ? botId.split(':')[0]
        : (botId.includes('@') ? botId.split('@')[0] : botId);

    const botLidNumeric = botLid.includes(':')
        ? botLid.split(':')[0]
        : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

    let senderNumber = senderId;
    if (senderId.includes(':')) {
        senderNumber = senderId.split(':')[0];
    } else if (senderId.includes('@')) {
        senderNumber = senderId.split('@')[0];
    }

    return (
        senderNumber === botNumber ||
        senderNumber === botLidNumeric ||
        senderId === botId ||
        senderId === botLid
    );
}

async function checkBotAdmin(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';

        const botNumber = botId.includes(':')
            ? botId.split(':')[0]
            : (botId.includes('@') ? botId.split('@')[0] : botId);

        const botLidNumeric = botLid.includes(':')
            ? botLid.split(':')[0]
            : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';

                const botMatches = (
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumeric === pLidNumeric ||
                    botNumber === pPhoneNumber ||
                    botNumber === pId
                );

                if (botMatches) return true;
            }
        }
        return false;
    } catch (err) {
        return false;
    }
}

async function getKickableMembers(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';

        const botNumber = botId.includes(':')
            ? botId.split(':')[0]
            : (botId.includes('@') ? botId.split('@')[0] : botId);

        const botLidNumeric = botLid.includes(':')
            ? botLid.split(':')[0]
            : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

        const kickable = [];

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                continue;
            }

            const pId = p.id ? p.id.split('@')[0] : '';
            const pLid = p.lid ? p.lid.split('@')[0] : '';
            const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
            const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
            const pFullId = p.id || '';
            const pFullLid = p.lid || '';

            const isBot = (
                botId === pFullId ||
                botId === pFullLid ||
                botLid === pFullLid ||
                botLidNumeric === pLidNumeric ||
                botNumber === pPhoneNumber ||
                botNumber === pId
            );

            if (!isBot && p.id) {
                kickable.push(p.id);
            }
        }

        return kickable;
    } catch (err) {
        return [];
    }
}

cmd({
    pattern: "kickall",
    alias: ["removeall2", "cleargroup"],
    category: "group",
    react: "⚠️",
    filename: __filename
},
async (Void, citel, text) => {
    try {
        if (!citel.isGroup) {
            return citel.reply("❌ This command works only in groups!");
        }

        const senderId = citel.key?.participant || citel.sender || citel.key?.remoteJid;
        if (!senderId) {
            return citel.reply("❌ Could not identify sender.");
        }

        if (!isBotOwner(Void, senderId)) {
            return citel.reply(`❌ *ACCESS DENIED!*\n\n⚠️ Only *Bot Owner* can use this command!`);
        }

        const botIsAdmin = await checkBotAdmin(Void, citel.chat);
        if (!botIsAdmin) {
            return citel.reply("❌ I need to be an *admin* to kick members!");
        }

        const members = await getKickableMembers(Void, citel.chat);

        if (members.length === 0) {
            return citel.reply("❌ No members found to kick!");
        }

        await Void.groupParticipantsUpdate(citel.chat, members, "remove");

        await citel.reply(`✅ *DONE!*\n\n🗑️ Kicked *${members.length}* members at once!`);

    } catch (error) {
        console.error("[KICKALL ERROR]", error);
        citel.reply("❌ *Error!* " + error.message);
    }
});

cmd({
    pattern: "removemembers",
    alias: ["kickall1"],
    react: "🎉",
    category: "group",
    filename: __filename,
},
async (conn, mek, m, {
    from, groupMetadata, groupAdmins, isBotAdmins, senderNumber, reply, isGroup
}) => {
    try {

        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("Only the bot owner can use this command.");
        }

        if (!isBotAdmins) {
            return reply("I need to be an admin to execute this command.");
        }

        const allParticipants = groupMetadata.participants;
        const nonAdminParticipants = allParticipants.filter(member => !groupAdmins.includes(member.id));

        if (nonAdminParticipants.length === 0) {
            return reply("There are no non-admin members to remove.");
        }

        reply(`Starting to remove ${nonAdminParticipants.length} non-admin members...`);

        for (let participant of nonAdminParticipants) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("Successfully removed all non-admin members from the group.");
    } catch (e) {
        console.error("Error removing non-admin users:", e);
        reply("An error occurred while trying to remove non-admin members. Please try again.");
    }
});

cmd({
    pattern: "removeadmins",
    alias: ["kickall2"],
    react: "🎉",
    category: "group",
    filename: __filename,
},
async (conn, mek, m, {
    from, isGroup, senderNumber, groupMetadata, groupAdmins, isBotAdmins, reply
}) => {
    try {

        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("Only the bot owner can use this command.");
        }

        if (!isBotAdmins) {
            return reply("I need to be an admin to execute this command.");
        }

        const allParticipants = groupMetadata.participants;
        const adminParticipants = allParticipants.filter(member => groupAdmins.includes(member.id) && member.id !== conn.user.id && member.id !== `${botOwner}@s.whatsapp.net`);

        if (adminParticipants.length === 0) {
            return reply("There are no admin members to remove.");
        }

        reply(`Starting to remove ${adminParticipants.length} admin members, excluding the bot and bot owner...`);

        for (let participant of adminParticipants) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("Successfully removed all admin members from the group, excluding the bot and bot owner.");
    } catch (e) {
        console.error("Error removing admins:", e);
        reply("An error occurred while trying to remove admins. Please try again.");
    }
});

cmd({
    pattern: "removeall",
    alias: ["kickall3"],
    react: "🎉",
    category: "group",
    filename: __filename,
},
async (conn, mek, m, {
    from, isGroup, senderNumber, groupMetadata, isBotAdmins, reply
}) => {
    try {

        if (!isGroup) {
            return reply("This command can only be used in groups.");
        }

        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return reply("Only the bot owner can use this command.");
        }

        if (!isBotAdmins) {
            return reply("I need to be an admin to execute this command.");
        }

        const allParticipants = groupMetadata.participants;

        if (allParticipants.length === 0) {
            return reply("The group has no members to remove.");
        }

        const participantsToRemove = allParticipants.filter(
            participant => participant.id !== conn.user.id && participant.id !== `${botOwner}@s.whatsapp.net`
        );

        if (participantsToRemove.length === 0) {
            return reply("No members to remove after excluding the bot and bot owner.");
        }

        reply(`Starting to remove ${participantsToRemove.length} members, excluding the bot and bot owner...`);

        for (let participant of participantsToRemove) {
            try {
                await conn.groupParticipantsUpdate(from, [participant.id], "remove");
                await sleep(2000);
            } catch (e) {
                console.error(`Failed to remove ${participant.id}:`, e);
            }
        }

        reply("Successfully removed all members, excluding the bot and bot owner, from the group.");
    } catch (e) {
        console.error("Error removing members:", e);
        reply("An error occurred while trying to remove members. Please try again.");
    }
});
