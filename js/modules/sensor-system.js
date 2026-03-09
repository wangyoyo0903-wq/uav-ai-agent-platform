class SensorSystem {
    constructor() {
        this.sensors = {
            temperature: { value: 25, unit: '°C', min: -20, max: 50 },
            humidity: { value: 60, unit: '%', min: 0, max: 100 },
            pressure: { value: 1013, unit: 'hPa', min: 900, max: 1100 },
            windSpeed: { value: 5, unit: 'm/s', min: 0, max: 30 },
            windDirection: { value: 0, unit: '°', min: 0, max: 360 }
        };
        
        this.updateInterval = 1000;
        this.interval = null;
    }
    
    start() {
        this.interval = setInterval(() => this.update(), this.updateInterval);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    update() {
        const state = stateManager.getState();
        const environment = state.environment;
        
        Object.keys(this.sensors).forEach(key => {
            const sensor = this.sensors[key];
            const envValue = environment[key] || sensor.value;
            const noise = Utils.randomRange(-1, 1);
            sensor.value = Utils.clamp(envValue + noise, sensor.min, sensor.max);
        });
        
        stateManager.setEnvironment({
            temperature: this.sensors.temperature.value,
            humidity: this.sensors.humidity.value,
            pressure: this.sensors.pressure.value,
            windSpeed: this.sensors.windSpeed.value,
            windDirection: this.sensors.windDirection.value
        });
    }
    
    getSensorData(droneId = null) {
        const drone = droneId ? droneManager.getDrone(droneId) : droneManager.getSelectedDrone();
        
        if (!drone) {
            return this.getDefaultSensorData();
        }
        
        const droneState = drone.getState();
        
        return {
            flight: {
                altitude: { value: droneState.position.z, unit: 'm' },
                speed: { value: droneState.speed, unit: 'm/s' },
                heading: { value: droneState.heading, unit: '°' },
                pitch: { value: droneState.attitude.pitch, unit: '°' },
                roll: { value: droneState.attitude.roll, unit: '°' },
                verticalSpeed: { value: droneState.verticalSpeed, unit: 'm/s' }
            },
            environment: {
                temperature: { value: droneState.sensors.temperature, unit: '°C' },
                humidity: { value: droneState.sensors.humidity, unit: '%' },
                windSpeed: { value: droneState.sensors.windSpeed, unit: 'm/s' },
                pressure: { value: droneState.sensors.pressure, unit: 'hPa' }
            },
            system: {
                battery: { value: droneState.battery, unit: '%' },
                signal: { value: droneState.signal, unit: '%' },
                gpsAccuracy: { value: droneState.gpsAccuracy, unit: 'm' },
                storage: { value: Utils.randomRange(10, 64), unit: 'GB' }
            }
        };
    }
    
    getDefaultSensorData() {
        return {
            flight: {
                altitude: { value: 0, unit: 'm' },
                speed: { value: 0, unit: 'm/s' },
                heading: { value: 0, unit: '°' },
                pitch: { value: 0, unit: '°' },
                roll: { value: 0, unit: '°' },
                verticalSpeed: { value: 0, unit: 'm/s' }
            },
            environment: {
                temperature: { value: this.sensors.temperature.value, unit: '°C' },
                humidity: { value: this.sensors.humidity.value, unit: '%' },
                windSpeed: { value: this.sensors.windSpeed.value, unit: 'm/s' },
                pressure: { value: this.sensors.pressure.value, unit: 'hPa' }
            },
            system: {
                battery: { value: 100, unit: '%' },
                signal: { value: 100, unit: '%' },
                gpsAccuracy: { value: 1.5, unit: 'm' },
                storage: { value: 32, unit: 'GB' }
            }
        };
    }
    
    setEnvironmentParameter(param, value) {
        if (this.sensors[param]) {
            const sensor = this.sensors[param];
            sensor.value = Utils.clamp(value, sensor.min, sensor.max);
            
            stateManager.setEnvironment({
                [param]: sensor.value
            });
        }
    }
    
    simulateWeatherChange() {
        const weatherTypes = [
            { name: '晴朗', windSpeed: 3, temperature: 28, humidity: 45 },
            { name: '多云', windSpeed: 6, temperature: 24, humidity: 55 },
            { name: '大风', windSpeed: 15, temperature: 20, humidity: 40 },
            { name: '高温', windSpeed: 2, temperature: 38, humidity: 30 },
            { name: '潮湿', windSpeed: 4, temperature: 26, humidity: 85 }
        ];
        
        const weather = Utils.randomChoice(weatherTypes);
        
        this.setEnvironmentParameter('windSpeed', weather.windSpeed);
        this.setEnvironmentParameter('temperature', weather.temperature);
        this.setEnvironmentParameter('humidity', weather.humidity);
        
        stateManager.addLog('info', `天气变化: ${weather.name}`);
        
        return weather;
    }
}

const sensorSystem = new SensorSystem();
