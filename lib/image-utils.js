const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * Convert an image buffer to a WhatsApp-compatible WebP sticker.
 * Metadata is intentionally omitted here; use lib/exif.js when pack/author
 * metadata is required.
 */
async function imageToWebp(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError('imageToWebp expects a non-empty Buffer');
  }

  const sticker = new Sticker(buffer, {
    type: StickerTypes.FULL,
    quality: 80
  });

  return sticker.build();
}

module.exports = { imageToWebp };
