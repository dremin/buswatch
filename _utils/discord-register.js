require('dotenv').config();
const axios = require('axios');
const db = require('../db');

const commands = [
  {
    name: 'bus',
    description: 'Get the latest service information for CTA buses.',
    options: [
      {
        type: 3,
        name: 'number',
        description: 'Provide up to 10 buses separated by spaces.',
        required: true,
        min_length: 3,
        max_length: 49
      }
    ],
    type: 1
  }
];

const discordPutRequest = async (endpoint, data) => {
  try {
    const response = await axios.put(`https://discord.com/api/v10/${endpoint}`, data, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'Buswatch (https://buswatch.scj.me, 1.0.0)',
      }
    });
    
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
  }
  
  return {};
}

discordPutRequest(`applications/${process.env.DISCORD_APP_ID}/commands`, commands);