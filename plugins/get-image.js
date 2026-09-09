const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "getimage",
    desc: "Convert image URL to WhatsApp image",
    alias: ["imagefromurl", "fetchimage"],
    category: "media",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text) return reply('Please provide an image URL\nExample: !getimage https://example.com/image.jpg');

        const imageUrl = text.trim();

        // Validate URL
        if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
            return reply('❌ Invalid image URL! Must be direct link to image (jpg/png/gif/webp)');
        }

        // Verify the image exists
        try {
            const response = await axios.head(imageUrl);
            if (!response.headers['content-type']?.startsWith('image/')) {
                return reply('❌ URL does not point to a valid image');
            }
        } catch (e) {
            return reply('❌ Could not access image URL. Please check the link');
        }

        // Send the image
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: 'Here is your image from the URL'
        }, { quoted: mek });

    } catch (error) {
        console.error('GetImage Error:', error);
        reply('❌ Failed to process image. Error: ' + error.message);
    }
});


cmd({
    pattern: "getvideo",
    desc: "Convert video URL to WhatsApp video",
    alias: ["videoget", "getvid"],
    category: "media",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text) return reply('Please provide a video URL\nExample: !getvideo https://example.com/video.mp4');

        const videoUrl = text.trim();

        // Validate URL
        if (!videoUrl.match(/^https?:\/\/.+\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/i)) {
            return reply('❌ Invalid video URL! Must be direct link to a video (mp4/mov/webm/mkv/avi/m4v)');
        }

        // Verify the video exists
        try {
            const response = await axios.head(videoUrl);
            if (!response.headers['content-type']?.startsWith('video/')) {
                return reply('❌ URL does not point to a valid video');
            }
        } catch (e) {
            return reply('❌ Could not access video URL. Please check the link');
        }

        // Send the video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: 'Here is your video from the URL'
        }, { quoted: mek });

    } catch (error) {
        console.error('GetVideo Error:', error);
        reply('❌ Failed to process video. Error: ' + error.message);
    }
});

