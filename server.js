    // Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
require('dotenv').config()
var configFile, config;
const fs = require("fs");
var besc_client = require("besc-ess-nodejs-client");
var keypair = new besc_client.keyPair(process.env.PROJECT_ID, process.env.APIKEY);
const ProjectData = besc_client.ProjectData;
const Device = besc_client.Device;
var host_client;
if(process.env.BESC_ESS_API_PATH){
  console.log("Using custom ESS API URL");
  host_client = new besc_client.Host(process.env.BESC_ESS_API_PATH);
}
else{
  console.log("Using default ESS API URL");
  host_client = besc_client.Host.createDefault();
}

// Using the Azure CLI:
// az iot hub device-identity show-connection-string --hub-name {YourIoTHubName} --device-id MyNodeDevice --output table
var connectionString = process.env.CONNECTIONSTRING;
var serviceconnectionString = process.env.SERVICECONNECTIONSTRING;
// Using the Node.js Device SDK for IoT Hub:
//   https://github.com/Azure/azure-iot-sdk-node
// The sample connects to a device-specific MQTT endpoint on your IoT Hub.
var Mqtt = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message;

var client = DeviceClient.fromConnectionString(connectionString, Mqtt);


// Create a message and send it to the IoT hub every second
setInterval(function(){
  let deviceReading = fs.readFileSync(process.env.ENERGY_DATA_PATH);  
  var message = new Message(deviceReading);


  console.log('Sending message: ' + message.getData());

  // Send the message.
  client.sendEvent(message, function (err) {
    if (err) {
      console.error('send error: ' + err.toString());
    } else {
      console.log('message sent');
    }
  });
}, (process.env.REPEAT_EVERY_MINUTES)*5000);

// Connects to an IoT hub's Event Hubs-compatible endpoint
// to read messages sent from a device.
var { EventHubClient, EventPosition } = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};

// - Telemetry is sent in the message body
// - The device can add arbitrary application properties to the message
var printMessage = async function (message) {

  try{
  if(!process.env.DISABLE_DATA_SEND){
    var response = await sendData(message.body.Devices);

    console.log("\nESS API Response:");
    console.log(response);
    }
  }catch(error){
      console.log("Error at printmsg: " + error);
  }

};

//Sending data to MongoDB 
const sendData = async (devicesReading) => {
    try {
        configFile = fs.readFileSync("./config.json");

        config = JSON.parse(configFile);

    } catch (error) {
        console.error("Throw at config" + error);
        process.exit();

    }
    var reading = [];
    var totalEnergy = 0;

    for (var x = 0; x < devicesReading.length; x++) {

        var deviceReading = devicesReading[x];

        reading.push(new Device(deviceReading.name, deviceReading.energy));
        totalEnergy += deviceReading.energy;
    }
    

    var projectData = ProjectData.creatWithCurrentTime(
        config.ProjectName,
        reading,
        totalEnergy,
        config.AverageRT,
        config.Location
    );

    try {
        var response = await besc_client.API.sendProjectData(host_client, keypair, projectData);

        return response;
    }
    catch (apiError) {
        console.log(`Throw at sendData: ${apiError}`);
    }
}


// Connect to the partitions on the IoT Hub's Event Hubs-compatible endpoint.
// This only reads messages sent after this application started.
var ehClient;
EventHubClient.createFromIotHubConnectionString(serviceconnectionString).then(function (client) {
  console.log("Successfully created the EventHub Client from iothub connection string.");
  ehClient = client;
  return ehClient.getPartitionIds();
}).then(function (ids) {
  console.log("The partition ids are: ", ids);
  return ids.map(function (id) {
    
    return ehClient.receive(id, printMessage, printError, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
  });
}).catch(printError);
