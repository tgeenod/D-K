const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function buildSticker(data, options = {}) {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const sticker = new Sticker(input, {
    pack: options.packname || options.pack || 'DARK-KNIGHT-XMD',
    author: options.author || 'DARK-KNIGHT-XMD',
    type: options.type || StickerTypes.FULL,
    categories: Array.isArray(options.categories) ? options.categories : [],
    id: options.id || crypto.randomBytes(8).toString('hex'),
    quality: options.quality || 50,
    background: options.background
  });
  return sticker.build();
}

async function writeExif(media, metadata = {}) {
  const source = media && media.data !== undefined ? media.data : media;
  const buffer = await buildSticker(source, metadata);
  const file = path.join(
    os.tmpdir(),
    `dk-sticker-${crypto.randomBytes(8).toString('hex')}.webp`
  );
  await fs.promises.writeFile(file, buffer);
  return file;
}

async function writeExifImg(buffer, options = {}) {
  return buildSticker(buffer, options);
}

async function writeExifVid(buffer, options = {}) {
  return buildSticker(buffer, options);
}

module.exports = { buildSticker, writeExif, writeExifImg, writeExifVid };
