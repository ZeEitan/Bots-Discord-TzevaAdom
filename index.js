const {Client, Events, GatewayIntentBits} = require("discord.js");
const {runCommand,commandsCollection } = require("./commandTools.js");
const {wsConnect} = require("./webSockets")
const fs= require("node:fs");

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((intent) => {
        return GatewayIntentBits[intent]; // get all the intents to the client
    })
});        

client.on(Events.ClientReady,async () => {
    client.user.setActivity({ // set the status to red alerts - default
        name: `Red alerts`,
        type: 2,
    });
    commandsCollection(client); // load the commands
    await wsConnect(client); // connect to the websocket
});

client.on(Events.InteractionCreate, async interaction => {
    await runCommand(interaction); // run the command
});

client.on(Events.GuildDelete, async guild => {
    let data = await JSON.parse(fs.readFileSync('./data/data.json', 'utf8')); // get the data
    if(!data[guild.id]) return; // if the guild is not in the data
    delete data[guild.id] // delete the guild from the data
    const newData = JSON.stringify(data); // stringify the new data
    fs.writeFileSync('./data/data.json', newData, "utf8"); // write the new data
});

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log(`${client.user.username} is online!`) // log that the bot is online
})