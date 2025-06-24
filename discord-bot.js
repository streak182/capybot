import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let config = JSON.parse(fs.readFileSync('./server/config.json', 'utf8'));

async function getCapybaraImage() {
  try {
    const res = await fetch('https://some-capybara-api.com/image');
    const data = await res.json();
    return data.url;
  } catch (e) {
    console.log('Error fetching image, using fallback.');
    return 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Capybara_portrait.jpg';
  }
}

async function postDailyImages() {
  for (const guildId in config) {
    const { channelId, roleId } = config[guildId];
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) continue;
    const image = await getCapybaraImage();
    channel.send({
      content: roleId ? `<@&${roleId}> Here’s your daily capybara!` : 'Here’s your daily capybara!',
      files: [image],
    });
  }
}

client.on('messageCreate', async (msg) => {
  if (!msg.content.startsWith('?') && !msg.content.startsWith('!')) return;

  const command = msg.content.replace(/[?!]/, '').split(' ')[0];

  if (command === 'capyday' || command === 'capytest') {
    const image = await getCapybaraImage();
    msg.channel.send({ content: 'Capybara time!', files: [image] });
  }

  if (command === 'setchannel') {
    if (!msg.member.permissions.has('ManageGuild')) return;
    config[msg.guild.id] = config[msg.guild.id] || {};
    config[msg.guild.id].channelId = msg.mentions.channels.first()?.id;
    fs.writeFileSync('./server/config.json', JSON.stringify(config, null, 2));
    msg.reply('Channel set!');
  }

  if (command === 'setrole') {
    if (!msg.member.permissions.has('ManageGuild')) return;
    config[msg.guild.id] = config[msg.guild.id] || {};
    config[msg.guild.id].roleId = msg.mentions.roles.first()?.id;
    fs.writeFileSync('./server/config.json', JSON.stringify(config, null, 2));
    msg.reply('Role set!');
  }

  if (command === 'status') {
    const conf = config[msg.guild.id];
    msg.reply(conf ? `Channel: <#${conf.channelId}> | Role: <@&${conf.roleId}>` : 'No config found.');
  }
});

cron.schedule('0 9 * * *', () => {
  postDailyImages();
});

client.once('ready', () => {
  console.log(`CapyBot logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
console.log("Redeploy trigger");
