const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder} = require("discord.js");
const fs = require("node:fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("הגדרת-חדר")
        .setDescription("מגדיר חדר התרעות")
        .addChannelOption(option => option
            .setName('חדר')
            .setDescription('חדר שבו יוצגו התרעות')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits["Administrator"]),

    async execute(interaction) {
        const serverID = interaction.guild.id; // get the server id
        const channel = interaction.options.getChannel("חדר"); // get the channel
        let channelID;

        if(channel) {
            channelID = channel.id;
        }

        if(!channel.isTextBased() || channel.isVoiceBased()){ // if the channel is not a text channel
            const errorMessage = new EmbedBuilder()
                .setAuthor({ name: "חדר זה אינו חדר טקסט  •", iconURL: process.env.DELETE})
                .setColor(0xEF5350)
                .setTimestamp();

            return await interaction.reply({embeds: [errorMessage]});
        }


        let jsonData = JSON.parse(fs.readFileSync('./data/data.json', "utf8"));

        if (jsonData[serverID]){ // if the server id is in the data
            jsonData[serverID] = channelID;
        } else {
            const newObject = {
                [serverID]: channelID // add the server id and the channel id to the data
            }
            Object.assign(jsonData, newObject);
        }

        const newData = JSON.stringify(jsonData, null, 4);
        fs.writeFileSync('./data/data.json', newData, "utf8"); // write the new data

        const confirmMessage = new EmbedBuilder()
            .setAuthor({ name: "חדר התרעות חדש הוגדר  •", iconURL: process.env.LIKE})
            .setColor(0x90EE90)
            .setDescription("ההתרעות יוצגו בחדר " + `<#${channelID}>`)
            .setTimestamp();

        await interaction.reply({embeds: [confirmMessage]}) // send the confirm message
    },
};

