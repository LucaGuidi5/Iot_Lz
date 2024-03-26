#!/usr/bin/env python3
import time
from bme280 import BME280
try:
    from smbus2 import SMBus
except ImportError:
    from smbus import SMBus
    
# Initialize the SMBus object with bus number 1
bus = SMBus(1)

# Create an instance of the BME280 class with the initialized SMBus object
bme280 = BME280(i2c_dev=bus)
temperature = bme280.get_temperature() # Save the value of the temperature from the sensor
pressure = bme280.get_pressure() # Save the value of the pressure from the sensor
humidity = bme280.get_humidity() # Save the value of the humidity from the sensor
print("""{{\"Temperature\": \"{:05.2f} *C\",\"Pressure\": \"{:05.2f} hPa\",\"Relative humidity\": \"{:05.2f} %\"}}""".format(temperature, pressure, humidity)) # Print the values of the temperature, pressure and humidity in json format