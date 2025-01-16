# Discord Music and Moderation Bot

This Discord bot provides music playback, moderation features, and fun interactions for your server.

## Commands

1. `!play <song name or URL>`: Plays music in a voice channel from a YouTube video name or URL. The bot will join the user's current voice channel and start playing the requested song. If a song is already playing, it will be added to the queue.

2. `!stop`: Stops the current music playback, clears the queue, and disconnects the bot from the voice channel.

3. `!skip`: Skips the current song and plays the next one in the queue.

4. `!queue`: Displays the current music queue.

5. `!ban <@user>`: Bans the mentioned user from the server. Only users with the "Ban Members" permission can use this command.

6. `!ask`: The bot will ask you a random question and await your response.

7. `!easteregg`: A fun easter egg command that generates a random Robux amount between 1 and 1 million, displayed in an embedded message with interactive buttons.

8. `!help`: Displays an embedded message with information about all available commands.

## Features

- Music playback with queue system and song information display
- YouTube search functionality (play songs by name or URL)
- Skip and queue management commands
- Moderation commands (ban)
- Interactive question and answer command
- Fun easter egg with interactive buttons
- Cooldown system to prevent command spam
- Comprehensive error handling and logging
- Embedded messages for better visual presentation

## Setup

1. Clone this repository.
2. Install the required packages:
