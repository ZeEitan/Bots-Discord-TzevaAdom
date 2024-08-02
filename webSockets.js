const { EmbedBuilder} = require("discord.js");
const WebSocket = require("ws");
const fs = require("node:fs");
require('./data/data.js');

//const { takeScreenshot } = require("./utils/takeScreenshot.js");

let client;

/*
Build the embed message of the alert
input:
    alertType - the alert type
    alertAreas - the alert areas
    alertCities - the alert cities
output:
    the alert message
*/
// async function buildMessage(alertType, alertAreas, alertCities){
//     return new EmbedBuilder()
//         .setAuthor({ name: `${alertType['he'][0]}   •`, iconURL: alertType['he'][1]})
//         .setTitle(alertAreas.join(", "))
//         .setDescription(alertCities.join(", "))
//         .setColor(0xf4a743)
//         .setTimestamp();
// }

/*
the websocket event handler
input:
    alertData - the alert data
    cities - the cities data
    areas - the areas data
output:
    none
*/
async function onAlert({alertData, cities, areas}) {
    const { type, data: alert } = alertData;
    if (isAlert(type)) return;
    const alertAreas = getAlertArea(cities, areas, alert);

    console.log(JSON.stringify(alert));

    const alertJson = JSON.parse(JSON.stringify(alert));
    const alertCities = alertJson.cities;
    const alertType =  threatsNames[alertJson["threat"]];

    //let alertMessage = buildMessage(alertType, alertAreas, alertCities); // build the alert message
    let alertMessage = new EmbedBuilder()
        .setAuthor({ name: `${alertType['he'][0]}   •`, iconURL: alertType['he'][1]})
        .setTitle(alertAreas.join(", "))
        .setDescription(alertCities.join(", "))
        .setColor(0xf4a743)
        .setTimestamp();
    await sendMessage(alertMessage); // send the alert message

    client.user.setActivity({
        name: `${alertType['he'][0]}: ${alertAreas.join(", ")}`,
        type: 4,
    }); // set the status to the alert type and areas
    
    const redAlertsStatus = (() => {
        client.user.setActivity({
            name: `Red alerts`,
            type: 2,
        }); // set the status to red alerts - default
    });

    setTimeout(redAlertsStatus, 1000 * 60 * 5); // set the status to red alerts after 5 minutes
}

/*
fetch the alerts history
input:
    none
output:
    the alerts history
*/
// async function fetchAlertsHistory() {
//     return new Promise((resolve, reject) => {
//         fetch("https://api.tzevaadom.co.il/alerts-history/?")
//             .then(async (response) => {
//                     try {
//                         if (!response.ok) {
//                             Throw new Error(`API request failed with status ${response.status}`);
//                         }
//
//                         const responseJson = await response.json();
//                         resolve(responseJson);
//
//                     } catch (error) {
//                         reject(error);
//                     }
//             })
//             .catch(error => {
//                 console.error("Error fetching alerts:", error);
//                 reject(error);
//             });
//     });
// }

/*
send the message to the alert channel
input:
    alertMessage - the alert message
output:
    none
*/
async function sendMessage(alertMessage){
    let alertChannel = await JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));
    let channels = Object.values(alertChannel);

    let sentAlerts = [];

    for (let channelId of channels) { // send the alert to all the channels
        try {
            let channel = await client.channels.fetch(channelId); // get the channel
            //let alert = 
            console.log("Sending alert to channel:", channelId)
            sentAlerts.push(await channel.send({ embeds: [alertMessage] })); // send the alert message
            //sentAlerts.push(alert); // add the alert to the sentAlerts
        } catch (e){
            console.error(e);
        }
    }

    for(let alert in sentAlerts){
        await alert.react("🚨");
    }

    // fetchAlertsHistory()
    //     .then(async alerts => {
    //         //console.log("Alerts:", alerts);
    //         const alertId = alerts[0]["id"];
    //         console.log("Alert Id: ", alertId);
    //
    //         // await takeScreenshot(alertId); // take a screenshot of the alert
    //         // const file  = new AttachmentBuilder(`${alertId}.png`);
    //         // alertMessage.setImage(`attachment://${alertId}.png`);
    //
    //         for(let alert of sentAlerts){ // edit the alert message to include the screenshot
    //             await alert.edit({ embeds: [alertMessage], files: [file] });
    //             await alert.react("🚨");
    //         }
    //
    //         //fs.unlinkSync(`${alertId}.png`);
    //     })
    //
    //     .catch(error => {
    //         console.error("Error:", error);
    //     });
}


/*
connect to the websocket
input:
    botClient - the bot client
output:
    none
*/
async function wsConnect(botClient) {
    client = botClient; // set the client
    const citiesData = await fetchCitiesData();
    let ws = createWebSocket();
    let isReconnecting = false;

    const handleReconnect = () => { // handle the reconnection
        ws.close();
        if (isReconnecting) return;
        isReconnecting = true;

        setTimeout(wsConnect, 5000);
    };

    ws.onopen = () => console.log("Connected to ws!"); // log the connection

    ws.onclose = () => handleReconnect(); // reconnect if the connection is closed

    ws.onerror = (e) => {
        console.error(e);
        handleReconnect();
    }
    ws.onmessage = async (m) => {
        if (typeof m.data === "string") {
            const onAlertParameters = getCitiesData(m, citiesData);
            await onAlert(onAlertParameters)
        }
    }
}

/*
check if the type is alert
input:
    type - the type of the alert
output:
    true if the type is alert, false otherwise
*/
function isAlert(type){
    return type !== "ALERT";
}

/*
create a websocket
input:
    none
output:
    the websocket
*/
function createWebSocket() {
    const WEBSOCKET_URL = "wss://ws.tzevaadom.co.il:8443/socket?platform=WEB"; // the websocket url
    return new WebSocket(WEBSOCKET_URL, {
        headers: {
            origin: "https://www.tzevaadom.co.il", 
        },
    });
}

/*
fetch the cities data
input:
    none
output:
    the cities data
*/
async function fetchCitiesData() {
    const versionR = await fetch("https://api.tzevaadom.co.il/lists-versions");
    const versionJson = await versionR.json();
    const version = versionJson.cities;

    const response = await fetch(
        "https://www.tzevaadom.co.il/static/cities.json?v=" + version
    );
    return response.json();
}

/*
get the alert area
input: 
    cities - the cities data
    areas - the areas data
    alert - the alert data
output:
    the alert area
*/
function getAlertArea(cities, areas, alert){
    let alertAreas = new Set();
    alert.cities.forEach((city) => ( // get the alert areas
        alertAreas = alertAreas.add(areas[cities[city]["area"]]["he"])
    ));
    return Array.from(alertAreas).sort(); // sort the alert areas
}

/*
get the cities data
input: 
    m - the message from the websocket
    citiesData - the cities data
output:
    the cities data
*/
function getCitiesData(m, citiesData){
    return {
        alertData: JSON.parse(m.data), // get the alert data
        cities: citiesData.cities, // get the cities data
        areas: citiesData.areas, // get the areas data
    }
}

module.exports = {wsConnect}; // export the wsConnect function to be used in other files