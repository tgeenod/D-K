const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["id", "chatid", "gjid"],  
    desc: "Get full JID of current chat/user (Creator Only)",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, isGroup, reply, sender 
}) => {
    try {
        /*if (!isCreator) {
            return reply("❌ *Command Restricted* - Only my creator can use this.");
        }*/

        if (isGroup) {
            // Ensure group JID ends with @g.us
            const groupJID = from.includes('@g.us') ? from : `${from}@g.us`;
            return reply(`👥 *Group JID:*\n\`\`\`${groupJID}\`\`\``);
        } else {
            // Ensure user JID ends with @s.whatsapp.net
            const userJID = sender.includes('@s.whatsapp.net') ? sender : `${sender}@s.whatsapp.net`;
            return reply(`👤 *User JID:*\n\`\`\`${userJID}\`\`\``);
        }

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});


cmd({
  pattern: 'jid2',
  desc: 'Get the WhatsApp JID of a user. Reply to a message or provide a number.',
  category: 'utility',
  filename: __filename
}, async (conn, mek, m, { q, quoted, sender, reply }) => {
  try {
    let targetJid;
    
    // If replying to a message, get the sender of the quoted message
    if (m.quoted) {
      targetJid = m.quoted.sender;
    } 
    // Else if an argument is provided, assume it's a number or partial JID
    else if (q) {
      let number = q.replace(/[^0-9]/g, ''); // Keep only digits
      if (!number) {
        return reply("❌ Please provide a valid number.");
      }
      targetJid = number + '@s.whatsapp.net';
    } 
    // Otherwise, default to sender's own JID
    else {
      targetJid = sender;
    }
    
    await reply(`User JID: ${targetJid}`);
  } catch (error) {
    console.error("Error in getjid command:", error);
    await reply(`❌ Error: ${error}`);
  }
});
