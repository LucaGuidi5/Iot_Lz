var mqtt = require('mqtt');
var config = require('./my_config.json'); // Importing configuration from a JSON file
var exec = require('child_process').exec;

var thngId=config.thngId; // Storing the thngId from the configuration
var thngUrl='/thngs/'+thngId; // Creating the URL for the thng
var thngApiKey=config.thngApiKey; // Storing the API key from the configuration
var interval;
var simulation = true; // Flag to determine if simulation mode is enabled


// Callback function that waits for the command to be executed and returns it as a string
function CaptureOutput(callback) {
    // weather1.py and http server must be in the same folder
    exec("python3 weather1.py", (error, data) => {
        callback(JSON.parse(data))
    })
}

console.log('Using Thng #'+thngId+' with API Key: '+ thngApiKey);

var client = mqtt.connect("mqtts://mqtt.evrythng.com:8883", { // Connecting to the MQTT broker
  username: 'authorization',
  password: thngApiKey 
});

client.on('connect', function () { // Event handler for when the client is connected
  client.subscribe(thngUrl+'/properties/'); // Subscribing to the properties topic
  updateProperty('livenow', true); // Updating the 'livenow' property to true

  if (!interval) interval = setInterval(updateProperties, 5000); // #F - Setting up a periodic update of properties
});

client.on('message', function (topic, message) { // Event handler for when a message is received
    console.log(message.toString());
});


function updateProperties () {
    if(simulation){
        var temperature = (219.5 + Math.random()).toFixed(3); // Generating a random temperature value
        updateProperty ('temperature',temperature); // Updating the 'temperature' property
      
        var pressure = (Math.random()*10).toFixed(3); // Generating a random pressure value
        updateProperty ('pressure',pressure); // Updating the 'pressure' property
      
        var humidity = (0.6+Math.random()/10).toFixed(3); //Generating a random humidity value
        updateProperty ('humidity',humidity); // Updating the 'humidity' property
    }else{
        CaptureOutput(function(sensor_data) { // Capturing sensor data from an external source
            updateProperty ('temperature', sensor_data['Temperature'].toFixed(3)); // Updating the 'temperature' property
            updateProperty ('pressure', sensor_data['Pressure'].toFixed(3)); // Updating the 'pressure' property
            updateProperty ('humidity', sensor_data['Relative humidity'].toFixed(3)); // Updating the 'humidity' property
        });

    }
    
}

function updateProperty (property,value) {
    client.publish(thngUrl+'/properties/'+property, '[{"value": '+value+'}]'); // Publishing the updated property value
}

// Let's close this connection cleanly
process.on('SIGINT', function() { // Cleanly exit this code and set the livenow property to false
  clearInterval(interval);
  updateProperty ('livenow', false); // Updating the 'livenow' property to false
  client.end(); // Closing the MQTT connection
  process.exit(); // Exiting the process
});
