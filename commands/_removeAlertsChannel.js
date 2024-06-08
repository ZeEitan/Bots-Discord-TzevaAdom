const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder} = require("discord.js");
const fs = require("node:fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("הסרת-חדר")
        .setDescription("מסיר את חדר ההתרעות")
        .setDefaultMemberPermissions(PermissionFlagsBits["Administrator"]),

    async execute(interaction) {

        let deleteAlertChannelMessage = new EmbedBuilder() // create the embed message
            .setAuthor({ name: "החדר נמחק בהצלחה  •", iconURL: process.env.DELETE})
            .setTimestamp()
            .setColor(0xEF5350);

        const serverID = interaction.guild.id; // get the server id
        let jsonData = JSON.parse(fs.readFileSync('./data/data.json', "utf8"));

        if (jsonData[serverID]){ // if the server id is in the data
            delete jsonData[serverID];
        }
        else { //change the message to an error message
            deleteAlertChannelMessage.setAuthor({ name: "לא הוגדר חדר  •", iconURL: process.env.WARNING});
            deleteAlertChannelMessage.setColor(0xfde384);
        }

        const newData = JSON.stringify(jsonData, null, 4); // stringify the new data
        fs.writeFileSync('./data/data.json', newData, "utf8"); // write the new data

        await interaction.reply({embeds: [deleteAlertChannelMessage]}) // send the message
    },
};

