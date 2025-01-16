const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ytdl = require('ytdl-core');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const ytsearch = require('yt-search');

const queue = new Map();

module.exports = {
  ban: {
    data: { name: 'ban' },
    cooldown: 5,
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("You don't have permission to use this command.");
      }

      const user = message.mentions.users.first();
      if (!user) {
        return message.reply("Please mention a user to ban.");
      }

      try {
        await message.guild.members.ban(user);
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('User Banned')
          .setDescription(`${user.tag} has been banned from the server.`)
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Error banning user:', error);
        await message.reply('There was an error trying to ban the user.');
      }
    },
  },

  play: {
    data: { name: 'play' },
    cooldown: 3,
    execute: async (message, args) => {
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
        return message.reply('You need to be in a voice channel to use this command!');
      }

      const permissions = voiceChannel.permissionsFor(message.client.user);
      if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.reply('I need permissions to join and speak in your voice channel!');
      }

      const query = args.join(' ');
      if (!query) {
        return message.reply('Please provide a song name or URL to play.');
      }

      const serverQueue = queue.get(message.guild.id);

      try {
        let songInfo;
        if (ytdl.validateURL(query)) {
          songInfo = await ytdl.getInfo(query);
        } else {
          const { videos } = await ytsearch(query);
          if (!videos.length) return message.reply('No search results found.');
          songInfo = await ytdl.getInfo(videos[0].url);
        }

        const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: formatDuration(songInfo.videoDetails.lengthSeconds),
        };

        if (!serverQueue) {
          const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
          };

          queue.set(message.guild.id, queueConstruct);
          queueConstruct.songs.push(song);

          try {
            const connection = joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: message.guild.id,
              adapterCreator: message.guild.voiceAdapterCreator,
            });
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
          } catch (err) {
            console.error('Error connecting to voice channel:', err);
            queue.delete(message.guild.id);
            return message.reply('There was an error connecting to the voice channel!');
          }
        } else {
          serverQueue.songs.push(song);
          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Song Added to Queue')
            .setDescription(`**${song.title}** has been added to the queue!`)
            .addFields(
              { name: 'Duration', value: song.duration, inline: true },
              { name: 'Position in queue', value: serverQueue.songs.length.toString(), inline: true }
            )
            .setTimestamp();
          return message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error playing music:', error);
        await message.reply('There was an error trying to play the music.');
      }
    },
  },

  stop: {
    data: { name: 'stop' },
    cooldown: 3,
    execute: async (message) => {
      const serverQueue = queue.get(message.guild.id);
      if (!serverQueue) {
        return message.reply("There's no music playing right now!");
      }
      serverQueue.songs = [];
      serverQueue.connection.destroy();
      queue.delete(message.guild.id);
      await message.reply('🛑 Music playback stopped and disconnected from voice channel.');
    },
  },

  queue: {
    data: { name: 'queue' },
    cooldown: 3,
    execute: async (message) => {
      const serverQueue = queue.get(message.guild.id);
      if (!serverQueue) {
        return message.reply("There's no music playing right now!");
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Music Queue')
        .setDescription(serverQueue.songs.map((song, index) => `${index + 1}. ${song.title} (${song.duration})`).join('\n'))
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    },
  },

  skip: {
    data: { name: 'skip' },
    cooldown: 3,
    execute: async (message) => {
      const serverQueue = queue.get(message.guild.id);
      if (!serverQueue) {
        return message.reply("There's no music playing right now!");
      }
      serverQueue.connection.destroy();
      await message.reply('⏭️ Skipped the current song!');
      play(message.guild, serverQueue.songs[1]);
    },
  },

  ask: {
    data: { name: 'ask' },
    cooldown: 5,
    execute: async (message) => {
      const questions = [
        "What's your favorite color?",
        "If you could have any superpower, what would it be?",
        "What's your dream vacation destination?",
        "If you could meet any historical figure, who would it be?",
        "What's your favorite book or movie?"
      ];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      const response = await message.reply(randomQuestion);
      
      try {
        const collected = await message.channel.awaitMessages({
          filter: m => m.author.id === message.author.id,
          max: 1,
          time: 30000,
          errors: ['time']
        });
        
        const answer = collected.first().content;
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Question and Answer')
          .addFields(
            { name: 'Question', value: randomQuestion },
            { name: 'Your Answer', value: answer }
          )
          .setTimestamp();
        await response.edit({ content: 'Thanks for sharing!', embeds: [embed] });
      } catch (error) {
        await response.edit("You didn't respond in time. Maybe next time!");
      }
    },
  },

  easteregg: {
    data: { name: 'easteregg' },
    cooldown: 10,
    execute: async (message) => {
      const robux = Math.floor(Math.random() * 1000000) + 1;
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎉 Easter Egg Alert!')
        .setDescription(`You are worth ${robux} Robux! 🤗`)
        .setFooter({ text: 'This is just for fun and not real Robux!' });
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('share')
            .setLabel('Share your Robux')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('reroll')
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Secondary),
        );

      const reply = await message.reply({ embeds: [embed], components: [row] });

      const filter = i => ['share', 'reroll'].includes(i.customId) && i.user.id === message.author.id;
      const collector = reply.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', async i => {
        if (i.customId === 'share') {
          await i.update({ content: `${message.author} is sharing ${robux} Robux with everyone!`, components: [] });
        } else if (i.customId === 'reroll') {
          const newRobux = Math.floor(Math.random() * 1000000) + 1;
          const newEmbed = EmbedBuilder.from(embed).setDescription(`You are worth ${newRobux} Robux! 🤗`);
          await i.update({ embeds: [newEmbed], components: [] });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          reply.edit({ content: 'Easter egg expired!', components: [] });
        }
      });
    },
  },

  help: {
    data: { name: 'help' },
    cooldown: 5,
    execute: async (message) => {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Bot Commands')
        .setDescription('Here are the available commands:')
        .addFields(
          { name: '!play <song name or URL>', value: 'Play a song in your voice channel' },
          { name: '!stop', value: 'Stop the music and disconnect the bot' },
          { name: '!skip', value: 'Skip the current song' },
          { name: '!queue', value: 'Show the current music queue' },
          { name: '!ban <@user>', value: 'Ban a user from the server (requires ban permissions)' },
          { name: '!ask', value: 'The bot will ask you a random question' },
          { name: '!easteregg', value: 'Discover a fun surprise!' },
          { name: '!help', value: 'Show this help message' }
        )
        .setFooter({ text: 'Enjoy the music and have fun!' });
      await message.reply({ embeds: [embed] });
    },
  },
};

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.connection.destroy();
    queue.delete(guild.id);
    return;
  }

  const stream = ytdl(song.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  player.play(resource);
  serverQueue.connection.subscribe(player);

  player.on('error', error => {
    console.error('Error playing audio:', error);
    serverQueue.textChannel.send('An error occurred while playing the song.');
    serverQueue.songs.shift();
    play(guild, serverQueue.songs[0]);
  });

  player.on('stateChange', (oldState, newState) => {
    if (newState.status === 'idle') {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    }
  });

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Now Playing')
    .setDescription(`🎵 Now playing: **${song.title}**`)
    .addFields(
      { name: 'Duration', value: song.duration, inline: true },
      { name: 'Requested by', value: song.requestedBy, inline: true }
    )
    .setTimestamp();

  serverQueue.textChannel.send({ embeds: [embed] });
}

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

Now, let's update the `package.json` file to include the new dependencies:

```json type="code" project="Discord Bot" file="package.json"
{
  "name": "discord-music-bot",
  "version": "1.0.0",
  "description": "A Discord bot with music playback and moderation features",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js"
  },
  "dependencies": {
    "discord.js": "^14.9.0",
    "@discordjs/voice": "^0.16.0",
    "dotenv": "^16.0.3",
    "ytdl-core": "^4.11.4",
    "yt-search": "^2.10.4",
    "winston": "^3.8.2"
  }
}
