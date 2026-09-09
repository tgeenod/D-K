const { cmd } = require('../command');
const axios = require('axios');


cmd({
  pattern: "timezone",
  desc: "Get the current time for a specific country.",
  react: "🕰️",
  category: "utility",
  use: ".timezone <country>",
  filename: __filename,
}, async (conn, mek, m, { args, reply }) => {
  try {
    if (args.length === 0) {
      return reply("❌ Please provide a country. Example: `.timezone Pakistan`");
    }
    
    const country = args.join(" ");
    const apiKey = process.env.IPGEO_API_KEY || "d6ca7264dd77441cbee974717ded084d";
    const url = `https://api.ipgeolocation.io/timezone?apiKey=${apiKey}&country=${encodeURIComponent(country)}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.date_time) {
      return reply("❌ Unable to fetch time for the specified country. Please check your input.");
    }
    
    const message = `🕰️ *Current Time in ${data.country_name}*\n\n` +
                    `📅 Date & Time: ${data.date_time}\n` +
                    `⌚ Time Zone: ${data.timezone}`;
                    
    reply(message);
    
  } catch (error) {
    console.error("Error fetching time:", error.message);
    reply("❌ Sorry, I couldn't fetch the time. Please check your input and try again.");
  }
});
