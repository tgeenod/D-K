const fetch = require('node-fetch');
const { Sticker } = require('wa-sticker-formatter');
const { cmd } = require('../command'); // use cmd instead of lite()

cmd({
  pattern: 'brat',
  alias: ['bratsticker'],
  react: '💅',
  desc: 'Create a brat-style sticker from text',
  category: 'sticker',
  filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
  // Get input text (either typed or quoted)
  const text = (args.length ? args.join(' ') : m?.quoted?.text) || null;

  if (!text) return reply('❌ Please enter text!\n\nExample: .brat Hello');

  // Send loading reaction
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: mek.key } });

  try {
    // API call
    const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.buffer();

    // Create sticker
    const sticker = new Sticker(buffer, {
      pack: 'NovaCore AI',
      author: 'Brat Generator',
      type: 'full',
      quality: 80
    });

    // Send sticker
    await conn.sendMessage(m.chat, { sticker: await sticker.build() }, { quoted: mek });
    await conn.sendMessage(m.chat, { react: { text: '✅', key: mek.key } });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: mek.key } });
    reply(`⚠️ Failed to create sticker: ${e.message}`);
  }
});
