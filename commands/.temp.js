const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} = require("discord.js");
const fs = require("fs");

const {takeScreenshot} = require("../utils/takeScreenshot.js");

module.exports = {data: new SlashCommandBuilder()
        .setName('temp')
        .setDescription("Temp command please don't use!!")
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The input to echo back')
                .addChoices(
                    { name: 'Plane', value: 'Plane' },
                    { name: 'Red alert', value: 'Red alert' },
                )
                .setRequired(true)
        ), async execute(interaction) {
        
        const cities = "גונן, כפר בלום, כפר סאלד, להבות הבשן, נאות מרדכי, עמיר, שדה נחמיה, שמיר"
        const type = interaction.options.getString('type');
        const image = (type === 'Plane') ? process.env.PLANE_ALERT : process.env.RED_ALERT;
        const alertString = (type === 'Plane') ? 'חדירת כלי טיס עוין' : 'צבע אדום';

        let alertChannel = await JSON.parse(fs.readFileSync('./data/data.json', 'utf8'))[interaction.guildId];

        if(!alertChannel){
            const unValidChannelMessage = new EmbedBuilder()
                .setAuthor({ name: "לא הוגדר חדר  •", iconURL: process.env.WARNING})
                .setColor(0xfde384)
                .setTimestamp()

            return await interaction.reply({embeds: [unValidChannelMessage]});
        }

        alertChannel = await interaction.guild.channels.fetch(alertChannel);

        const temp = new EmbedBuilder()
            .setAuthor({ name: "התרעה מדומה" + '  •', iconURL: process.env.DELETE})
            .setColor(0xEF5350)

        let alert = new EmbedBuilder()
            .setAuthor({ name: alertString + '  •', iconURL: image})
            .setTitle("קו העימות")
            .setColor(0xf4a743)
            .setDescription(cities)
            .setTimestamp();

        const confirmMessage = new EmbedBuilder()
            .setAuthor({ name: "ההתרעה נשלחה  •", iconURL: process.env.LIKE})
            .setColor(0x90EE90)
            .setDescription("ההתרעה תוצג בחדר " + `<#${alertChannel.id}>`)
            .setTimestamp();

        await interaction.reply({embeds: [confirmMessage]});
        const sentMessage = await alertChannel.send({ embeds: [temp, alert]});
        
        //edit reply to interaction
        // const id = "2009"
        // const begin = new Date();
        // await takeScreenshot(id);
        // const end = new Date();
        // console.log("Time to create image - ", (end - begin) / 1000);
        // const file  = new AttachmentBuilder(`${id}.png`);

        //alert.setImage(`attachment://${id}.png`);
        //await sentMessage.edit({ embeds: [temp, alert], files: [file] });
        await sentMessage.react("🚨");
        //
        //
        // //delete image
        // fs.unlinkSync(`./${id}.png`);
    },
};