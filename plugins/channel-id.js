const { cmd } = require("../command");

cmd({
  pattern: "cid",
  react: "📡",
  desc: "Get WhatsApp Channel info from link",
  category: "whatsapp",
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
    desc: "Displays the @newsletter ID of the current channel",
    category: "tools",
    react: "📡",
    filename: __filename
},
async (conn, mek, m) => {
    const newsletterJid = m.chat;

    // Journaliser l'utilisation de la commande
    console.log(`[NEWSLETTER] Command used in: ${newsletterJid}`);

    if (!newsletterJid.endsWith("@newsletter")) {
        return conn.sendMessage(newsletterJid, {
            text: "This command must be used inside a WhatsApp channel (@newsletter)."
        }, { quoted: mek });
    }

    // Optionnel : V茅rifie si le JID semble valide (commence par "120")
    if (!newsletterJid.startsWith("120")) {
        return conn.sendMessage(newsletterJid, {
            text: "This does not appear to be a valid WhatsApp channel ID."
        }, { quoted: mek });
    }

    // Date et heure actuelle
    const now = new Date().toLocaleString();

    // Affiche l'ID du canal + date
    await conn.sendMessage(newsletterJid, {
        text: `Channel ID:\n\n*${newsletterJid}*\n\nDml *Executed on:* ${now}`
    }, { quoted: mek });

    // Simule un message transf茅r茅 d鈥檜n autre canal
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
