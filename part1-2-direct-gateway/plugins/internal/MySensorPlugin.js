var resources = require('../../resources/my_model.js'),
  utils = require('../../utils/utils.js');

var interval, sensor;
var model = resources.pi.sensors;
var pluginName = 'Temperature, Pressure & Humidity';
var localParams = {'simulate': false, 'frequency': 5000};

var exec = require('child_process').exec;

// callback function that waits for the command to be executed returns it as an string
// datatype = [Temperature, Pressure, Relative humidity]
function CaptureOutput(callback) {
    // weather1.py and http server must be in the same folder
    exec("python3 weather1.py", (error, data) => {
      model.temperature.value = JSON.parse(data)['Temperature'];
      model.pressure.value = JSON.parse(data)['Pressure'];
      model.humidity.value = JSON.parse(data)['Relative humidity'];
      showValue();
      callback();
    })
}

exports.start = function (params) {
  localParams = params;
  if (params.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};

exports.stop = function () {
  if (params.simulate) {
    clearInterval(interval);
  } else {
    sensor.unexport();
  }
  console.info('%s plugin stopped!', pluginName);
};

function connectHardware() {
 //var sensorDriver = require('node-dht-sensor');
  var sensor = {
    initialize: function () {
      return true;//sensorDriver.initialize(22, model.temperature.gpio); //#A
    },
    read: function () {
      /*var readout = sensorDriver.read(); //#B
      model.temperature.value = parseFloat(readout.temperature.toFixed(2));
      model.humidity.value = parseFloat(readout.humidity.toFixed(2)); //#C
      showValue();
        */
      CaptureOutput(function () {
        /*
        model.temperature.value = sensor_json['Temperature'];
        model.pressure.value = sensor_json['Pressure'];
        model.humidity.value = sensor_json['Relative humidity'];
        showValue();
        */
      });

      setTimeout(function () {
        sensor.read(); //#D
      }, localParams.frequency);
    }
  };
  if (sensor.initialize()) {
    console.info('Hardware %s sensor started!', pluginName);
    sensor.read();
  } else {
    console.warn('Failed to initialize sensor!');
  }
};

function simulate() {
  interval = setInterval(function () {
    model.temperature.value = utils.randomInt(0, 40);
    model.humidity.value = utils.randomInt(0, 100);
    model.pressure.value = utils.randomInt(0, 100);
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info('Temperature: %s C, Pressure %s hPa, humidity %s \%',
    model.temperature.value, model.pressure.value, model.humidity.value);
};

//#A Initialize the driver for DHT22 on GPIO 12 (as specified in the model)
//#B Fetch the values from the sensors
//#C Update the model with the new temperature and humidity values; note that all observers will be notified
//#D Because the driver doesn’t provide interrupts, you poll the sensors for new values on a regular basis with a regular timeout function and set sensor.read() as a callback
