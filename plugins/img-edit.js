const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

// 🔹 Upload function to Catbox (image hosting)
async function uploadToCatbox(fileBuffer) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fileBuffer, "image.jpg");

  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
  });
  return res.data; // returns the hosted image URL
}

// 🔹 Command definition
cmd(
  {
    pattern: "editimg",
    alias: ["imgedit"],
    desc: "Edit an image using a custom prompt",
    category: "image",
    react: "🎨",
    use: ".imgedit <prompt> (reply to an image)",
    filename: __filename,
  },
  async (client, message, args, { q: prompt }) => {
    try {
      // ✅ Check for prompt
      if (!prompt) {
        return message.reply("⚠️ Please provide a prompt.\nExample: `.imgedit make it look like a cartoon`");
      }

      // ✅ Check if user replied to an image
      if (!message.quoted || message.quoted.mtype !== "imageMessage") {
        return message.reply("❌ Reply to an image with your prompt to edit it.");
      }

      // 📥 Download the quoted image
      const imageBuffer = await message.quoted.download();

      // ☁️ Upload to Catbox to get public URL
      const uploadedUrl = await uploadToCatbox(imageBuffer);

      // 🧠 Call external API for image editing
      const apiUrl = `https://api.zenzxz.my.id/maker/imagedit?url=${encodeURIComponent(
        uploadedUrl
      )}&prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      // 📤 Send the edited image back
      await client.sendMessage(
        message.chat,
        {
          image: response.data,
          caption: `✨ Image edited with prompt: *${prompt}*`,
        },
        { quoted: message }
      );
    } catch (err) {
      console.error(err);
      message.reply("❌ Error while editing image. Please try again later.");
    }
  }
);
