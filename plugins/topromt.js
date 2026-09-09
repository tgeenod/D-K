const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');

cmd({
  pattern: 'topromt',
  alias: ['imagetoprompt'],
  desc: 'Generate a text prompt from an image',
  category: 'ai',
  react: '🖼️',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!mime.startsWith('image/')) return reply('❌ Please provide an image!');

    reply('⏳ Generating prompt from your image...');

    const buffer = await q.download();
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });

    const { data } = await axios.post(
      'https://be.neuralframes.com/clip_interrogate/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Accept': 'application/json, text/plain, */*',
          'Authorization': 'Bearer uvcKfXuj6Ygncs6tiSJ6VXLxoapJdjQ3EEsSIt45Zm+vsl8qcLAAOrnnGWYBccx4sbEaQtCr416jxvc/zJNAlcDjLYjfHfHzPpfJ00l05h0oy7twPKzZrO4xSB+YGrmCyb/zOduHh1l9ogFPg/3aeSsz+wZYL9nlXfXdvCqDIP9bLcQMHiUKB0UCGuew2oRt',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://www.neuralframes.com/tools/image-to-prompt'
        }
      }
    );

    await reply(`📝 Generated prompt:\n${data.prompt}`);
  } catch (e) {
    console.error(e);
    reply(`❌ Failed: ${e.message}`);
  }
});
