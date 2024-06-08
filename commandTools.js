const { REST, Routes, Collection} = require('discord.js');
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

function commandsCollection(client){
    client.commands = new Collection();

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        let command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
    commandRegister();
}

function commandRegister(){
    const commands = [];
    const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(__dirname, './Commands', file));
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: commands}).then(() =>
            console.log('Successfully reloaded application (/) commands.')
        );
    } catch (error) {
        console.error(error);
    }
}

async function runCommand(interaction){
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

module.exports = {runCommand, commandsCollection};