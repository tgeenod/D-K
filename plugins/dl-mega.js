const { cmd } = require('../command');
const { File } = require('megajs');
const axios = require('axios');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const os = require('os');

cmd({
    pattern: "mega",
    alias: ["meganz"],
    desc: "Download Mega.nz files via API",
    react: "🌐",
    category: "download",
    filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Mega.nz link.");

        await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

        const apiUrl = `https://m-api-five.vercel.app/downloader/megadl-v2?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result || !data.result.dllink) {
            return reply("⚠️ Invalid Mega link or API error.");
        }

        const file = data.result;
        const downloadUrl = file.dllink;
        const fileName = file.title || "mega_file.mp4";
        const fileSizeMB = file.filesize || ((file.size / 1024 / 1024).toFixed(2) + " MB");

        // Mimetype එක extension එකෙන් හෝ link එකේ headers වලින් ලබා ගැනීම
        let determinedMime = mime.lookup(fileName);
        if (!determinedMime) {
            try {
                const headRes = await axios.head(downloadUrl);
                determinedMime = headRes.headers['content-type'];
            } catch (e) {
                determinedMime = "application/octet-stream";
            }
        }

        await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            fileName: fileName,
            mimetype: determinedMime || "application/octet-stream",
            caption: `📁 *File:* ${fileName}\n📦 *Size:* ${fileSizeMB}\n\n*© Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Mega API download failed.");
    }
});

cmd({
    pattern: "megadl",
    alias: ["mega2", "meganz2"],
    react: "📦",
    desc: "Download any file from Mega.nz",
    category: "download",
    use: '.megadl <mega file link>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("📦 Please provide a Mega.nz file link.\n\nExample: `.megadl https://mega.nz/file/xxxx#key`");

        // React: Processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Initialize MEGA File from link
        const file = File.fromURL(q);
        
        // ගොනුවේ නම සහ විස්තර ලබා ගැනීම
        await file.loadAttributes();
        const fileName = file.name || "mega_file.bin";
        
        const mimeType = mime.lookup(fileName) || 'application/octet-stream';

        // Download into buffer
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        // Create temp file path
        const savePath = path.join(os.tmpdir(), fileName);

        // Save file locally
        fs.writeFileSync(savePath, data);

        // Send file
        await conn.sendMessage(from, {
            document: fs.readFileSync(savePath),
            fileName: fileName,
            mimetype: mimeType,
            caption: `📦 *File Name:* ${fileName}\n\n*Powered By 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳*`
        }, { quoted: mek });

        // Delete temp file
        fs.unlinkSync(savePath);

        // React: Done
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("❌ MEGA Downloader Error:", error);
        reply("❌ Failed to download file from Mega.nz. Make sure the link is valid and file is accessible.");
    }
});
