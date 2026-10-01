const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

async function imageToWebp(buffer) {
  const id = crypto.randomBytes(8).toString('hex');
  const input = path.join(os.tmpdir(), `dk-${id}.png`);
  const output = path.join(os.tmpdir(), `dk-${id}.webp`);
  await fs.promises.writeFile(input, buffer);
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(input).outputOptions(['-vcodec libwebp','-lossless 1','-compression_level 6','-q:v 80'])
        .toFormat('webp').on('end', resolve).on('error', reject).save(output);
    });
    return await fs.promises.readFile(output);
  } finally {
    await fs.promises.unlink(input).catch(()=>{});
    await fs.promises.unlink(output).catch(()=>{});
  }
}
module.exports = { imageToWebp };
