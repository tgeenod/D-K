const { cmd } = require('../command')
const Jimp = require("jimp")

cmd({
  pattern: "topixel",
  alias: ["pixel"],   // <-- alias එක
  desc: "Pixelate an image",
  category: "tools",
  use: ".topixel <size>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const quoted = m.quoted ? m.quoted : m
    const mime = (quoted.msg || quoted).mimetype || ""

    if (!mime.startsWith("image/")) return reply("🖼️ *Reply to an image!*")

    let pixelSize = parseInt(q) || 32
    if (pixelSize < 8) pixelSize = 8
    if (pixelSize > 1024) pixelSize = 1024

    reply(`⏳ Pixelating... (size ${pixelSize})`)

    const media = await quoted.download()
    if (!media) return reply("❌ Failed to download image")

    const image = await Jimp.read(media)
    const small = image.clone().resize(pixelSize, pixelSize, Jimp.RESIZE_NEAREST_NEIGHBOR)
    const pixelated = small.resize(image.bitmap.width, image.bitmap.height, Jimp.RESIZE_NEAREST_NEIGHBOR)
    const buffer = await pixelated.getBufferAsync(Jimp.MIME_JPEG)

    await conn.sendMessage(
      from,
      { image: buffer, caption: `✅ Pixelated (size: ${pixelSize})` },
      { quoted: m }
    )
  } catch (e) {
    reply(`❌ Error: ${e.message}`)
  }
})
