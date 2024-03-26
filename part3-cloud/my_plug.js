var mqtt = require('mqtt');

var config = require('./my_config.json'); // #A 
var thngId=config.thngId; 
var thngUrl='/thngs/'+thngId;
var thngApiKey=config.thngApiKey;
var interval;
var simulation = true;

var exec = require('child_process').exec;

// callback function that waits for the command to be executed returns it as an string
// datatype = [Temperature, Pressure, Relative humidity]
function CaptureOutput(datatype, callback) {
    // weather1.py and http server must be in the same folder
    exec("python3 weather1.py", (error, data) => {
        callback(JSON.parse(data)[datatype])
    })
}

console.log('Using Thng #'+thngId+' with API Key: '+ thngApiKey);

var client = mqtt.connect("mqtts://mqtt.evrythng.com:8883", {// #B
  username: 'authorization',
  password: thngApiKey 
});

client.on('connect', function () { // #C
  client.subscribe(thngUrl+'/properties/'); //#D
  updateProperty('livenow', true); //#E

  if (!interval) interval = setInterval(updateProperties, 5000); //#F
});

client.on('message', function (topic, message) { // #G
    console.log(message.toString());
});


function updateProperties () {
    if(simulation){
        var temperature = (219.5 + Math.random()).toFixed(3); // #H
        updateProperty ('temperature',temperature);
      
        var pressure = (Math.random()*10).toFixed(3); // #I
        updateProperty ('pressure',pressure);
      
        var humidity = (0.6+Math.random()/10).toFixed(3); // #J
        updateProperty ('humidity',humidity);
    }else{
        CaptureOutput('Temperature', function(temperature) { // #H
            updateProperty ('temperature',temperature.toFixed(3));
        });
    
        CaptureOutput('Pressure', function(pressure) { // #I
            updateProperty ('pressure',pressure.toFixed(3));
        });
    
        CaptureOutput('Relative humidity', function(humidity) { // #J
            updateProperty ('humidity',humidity.toFixed(3));
        });
    }
    
}

function updateProperty (property,value) {
    client.publish(thngUrl+'/properties/'+property, '[{"value": '+value+'}]');
}

// Let's close this connection cleanly
process.on('SIGINT', function() { // #K
  clearInterval(interval);
  updateProperty ('livenow', false);
  client.end();
  process.exit();
});
//#A Load configuration from file (Thng ID and Thng API key)
//#B Connect to the secure MQTT server on EVRYTHNG
//#C Callback called once when the MQTT connection suceeds
//#D Subscribe to all properties
//#E Set the property livenow to true
//#F Call the function updateProperties() in 5 seconds
//#G Called every time an MQTT message is received from the broker
//#H Measures voltage (fluctuates around ~220 volts)
//#I Measures current (fluctuates 0–10 amps)
//#J Measures power using P=U*I*PF (PF=power factor fluctuates 60–70%)
//#K Cleanly exit this code and set the livenow property to false
