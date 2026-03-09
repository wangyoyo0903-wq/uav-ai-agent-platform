class DroneSimulator {
    constructor(droneId, config = {}) {
        this.id = droneId;
        this.config = {
            type: config.type || 'SCOUT',
            name: config.name || droneId,
            ...CONFIG.DRONE_TYPES[config.type || 'SCOUT'],
            ...config
        };
        
        this.state = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            attitude: { pitch: 0, roll: 0, yaw: 0 },
            heading: 0,
            battery: 100,
            signal: 100,
            gpsAccuracy: 1.5,
            status: CONFIG.DRONE_STATUS.IDLE,
            flightMode: CONFIG.FLIGHT_MODES.IDLE,
            targetPosition: null,
            targetHeading: null,
            homePosition: { x: 0, y: 0, z: 0 },
            mission: null,
            missionProgress: 0,
            trajectory: [],
            sensors: {
                temperature: 25,
                humidity: 60,
                pressure: 1013,
                windSpeed: 0,
                windDirection: 0
            },
            lastUpdate: Date.now()
        };
        
        this.trailLength = 100;
    }
    
    update(deltaTime, environment, settings) {
        const now = Date.now();
        const dt = deltaTime || (now - this.state.lastUpdate);
        this.state.lastUpdate = now;
        
        this.updateFlightMode(dt, environment, settings);
        
        const physics = physicsEngine.calculatePosition(this.state, dt, environment);
        this.state.position = physics.position;
        this.state.velocity = physics.velocity;
        
        this.state.battery = physicsEngine.calculateBatteryDrain(this.state, dt, settings);
        this.state.signal = physicsEngine.calculateSignalStrength(this.state);
        this.state.gpsAccuracy = physicsEngine.calculateGPSAccuracy(this.state, environment);
        
        if (this.state.targetPosition) {
            const attitude = physicsEngine.calculateAttitude(this.state, this.state.targetPosition);
            this.state.attitude = attitude;
        }
        
        if (this.state.targetHeading !== null) {
            this.state.heading = physicsEngine.calculateHeading(
                this.state.heading, 
                this.state.targetHeading, 
                dt
            );
        }
        
        this.updateTrail();
        this.updateStatus();
        this.updateSensors(environment);
        
        return this.getState();
    }
    
    updateFlightMode(dt, environment, settings) {
        switch (this.state.flightMode) {
            case CONFIG.FLIGHT_MODES.TAKEOFF:
                this.handleTakeoff(dt);
                break;
            case CONFIG.FLIGHT_MODES.LANDING:
                this.handleLanding(dt);
                break;
            case CONFIG.FLIGHT_MODES.HOVER:
                this.handleHover(dt);
                break;
            case CONFIG.FLIGHT_MODES.CRUISE:
            case CONFIG.FLIGHT_MODES.MISSION:
                this.handleCruise(dt, environment);
                break;
            case CONFIG.FLIGHT_MODES.RTH:
                this.handleReturnToHome(dt, environment);
                break;
            case CONFIG.FLIGHT_MODES.EMERGENCY:
                this.handleEmergency(dt);
                break;
        }
    }
    
    handleTakeoff(dt) {
        const targetAlt = 50;
        if (this.state.position.z < targetAlt) {
            this.state.velocity.z = CONFIG.PHYSICS.CLIMB_RATE;
        } else {
            this.state.velocity.z = 0;
            this.state.flightMode = CONFIG.FLIGHT_MODES.HOVER;
            this.state.status = CONFIG.DRONE_STATUS.ACTIVE;
        }
    }
    
    handleLanding(dt) {
        if (this.state.position.z > CONFIG.PHYSICS.MIN_ALTITUDE) {
            this.state.velocity.z = -CONFIG.PHYSICS.DESCENT_RATE;
            this.state.velocity.x *= 0.95;
            this.state.velocity.y *= 0.95;
        } else {
            this.state.velocity = { x: 0, y: 0, z: 0 };
            this.state.position.z = 0;
            this.state.flightMode = CONFIG.FLIGHT_MODES.IDLE;
            this.state.status = CONFIG.DRONE_STATUS.IDLE;
        }
    }
    
    handleHover(dt) {
        this.state.velocity.x *= 0.9;
        this.state.velocity.y *= 0.9;
        this.state.velocity.z = 0;
    }
    
    handleCruise(dt, environment) {
        if (this.state.targetPosition) {
            const path = physicsEngine.calculatePathToTarget(
                this.state, 
                this.state.targetPosition, 
                environment
            );
            
            if (path.distance > 5) {
                const headingRad = Utils.degToRad(path.heading);
                const speed = Math.min(this.config.maxSpeed, path.distance);
                
                this.state.velocity.x = Math.cos(headingRad) * speed;
                this.state.velocity.y = Math.sin(headingRad) * speed;
                this.state.targetHeading = path.heading;
                
                const altDiff = this.state.targetPosition.z - this.state.position.z;
                this.state.velocity.z = Utils.clamp(altDiff, -CONFIG.PHYSICS.DESCENT_RATE, CONFIG.PHYSICS.CLIMB_RATE);
            } else {
                this.state.velocity = { x: 0, y: 0, z: 0 };
                this.state.flightMode = CONFIG.FLIGHT_MODES.HOVER;
            }
        }
    }
    
    handleReturnToHome(dt, environment) {
        this.state.targetPosition = {
            ...this.state.homePosition,
            z: Math.max(this.state.position.z, 50)
        };
        
        const homeDist = Utils.distance(
            this.state.position.x, this.state.position.y,
            this.state.homePosition.x, this.state.homePosition.y
        );
        
        if (homeDist < 5 && this.state.position.z > 5) {
            this.state.flightMode = CONFIG.FLIGHT_MODES.LANDING;
        } else {
            this.handleCruise(dt, environment);
        }
    }
    
    handleEmergency(dt) {
        this.state.velocity = { x: 0, y: 0, z: -CONFIG.PHYSICS.DESCENT_RATE * 2 };
        this.state.status = CONFIG.DRONE_STATUS.EMERGENCY;
    }
    
    updateTrail() {
        this.state.trajectory.push({
            x: this.state.position.x,
            y: this.state.position.y,
            z: this.state.position.z,
            time: Date.now()
        });
        
        if (this.state.trajectory.length > this.trailLength) {
            this.state.trajectory.shift();
        }
    }
    
    updateStatus() {
        if (this.state.flightMode === CONFIG.FLIGHT_MODES.EMERGENCY) {
            this.state.status = CONFIG.DRONE_STATUS.EMERGENCY;
        } else if (this.state.battery < 20 || this.state.signal < 30) {
            this.state.status = CONFIG.DRONE_STATUS.WARNING;
        } else if (this.state.flightMode === CONFIG.FLIGHT_MODES.IDLE) {
            this.state.status = CONFIG.DRONE_STATUS.IDLE;
        } else {
            this.state.status = CONFIG.DRONE_STATUS.ACTIVE;
        }
    }
    
    updateSensors(environment) {
        this.state.sensors = {
            temperature: environment.temperature + Utils.randomRange(-1, 1),
            humidity: environment.humidity + Utils.randomRange(-2, 2),
            pressure: environment.pressure + Utils.randomRange(-5, 5),
            windSpeed: environment.windSpeed + Utils.randomRange(-0.5, 0.5),
            windDirection: environment.windDirection
        };
    }
    
    takeoff() {
        if (this.state.flightMode === CONFIG.FLIGHT_MODES.IDLE && this.state.battery > 10) {
            this.state.flightMode = CONFIG.FLIGHT_MODES.TAKEOFF;
            this.state.status = CONFIG.DRONE_STATUS.ACTIVE;
            this.state.homePosition = { ...this.state.position };
            return true;
        }
        return false;
    }
    
    land() {
        if (this.state.flightMode !== CONFIG.FLIGHT_MODES.IDLE && 
            this.state.flightMode !== CONFIG.FLIGHT_MODES.EMERGENCY) {
            this.state.flightMode = CONFIG.FLIGHT_MODES.LANDING;
            return true;
        }
        return false;
    }
    
    hover() {
        if (this.state.flightMode !== CONFIG.FLIGHT_MODES.IDLE &&
            this.state.flightMode !== CONFIG.FLIGHT_MODES.EMERGENCY) {
            this.state.flightMode = CONFIG.FLIGHT_MODES.HOVER;
            this.state.targetPosition = null;
            return true;
        }
        return false;
    }
    
    returnToHome() {
        if (this.state.flightMode !== CONFIG.FLIGHT_MODES.IDLE &&
            this.state.flightMode !== CONFIG.FLIGHT_MODES.EMERGENCY) {
            this.state.flightMode = CONFIG.FLIGHT_MODES.RTH;
            return true;
        }
        return false;
    }
    
    emergencyStop() {
        this.state.flightMode = CONFIG.FLIGHT_MODES.EMERGENCY;
        this.state.status = CONFIG.DRONE_STATUS.EMERGENCY;
        return true;
    }
    
    setTarget(x, y, z) {
        this.state.targetPosition = { x, y, z };
        this.state.flightMode = CONFIG.FLIGHT_MODES.CRUISE;
    }
    
    setHeading(heading) {
        this.state.targetHeading = heading;
    }
    
    setPosition(x, y, z = 0) {
        this.state.position = { x, y, z };
        this.state.homePosition = { x, y, z };
    }
    
    setMission(mission) {
        this.state.mission = mission;
        this.state.missionProgress = 0;
        this.state.flightMode = CONFIG.FLIGHT_MODES.MISSION;
    }
    
    getState() {
        return {
            id: this.id,
            name: this.config.name,
            type: this.config.type,
            ...this.state,
            speed: Math.sqrt(
                this.state.velocity.x ** 2 + 
                this.state.velocity.y ** 2
            ),
            verticalSpeed: this.state.velocity.z,
            flightTime: this.calculateFlightTime()
        };
    }
    
    calculateFlightTime() {
        if (this.state.battery <= 0) return 0;
        const drainRate = CONFIG.PHYSICS.BATTERY_DRAIN_RATE;
        return Utils.calculateBatteryTime(this.state.battery, drainRate);
    }
    
    reset() {
        this.state = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            attitude: { pitch: 0, roll: 0, yaw: 0 },
            heading: 0,
            battery: 100,
            signal: 100,
            gpsAccuracy: 1.5,
            status: CONFIG.DRONE_STATUS.IDLE,
            flightMode: CONFIG.FLIGHT_MODES.IDLE,
            targetPosition: null,
            targetHeading: null,
            homePosition: { x: 0, y: 0, z: 0 },
            mission: null,
            missionProgress: 0,
            trajectory: [],
            sensors: {
                temperature: 25,
                humidity: 60,
                pressure: 1013,
                windSpeed: 0,
                windDirection: 0
            },
            lastUpdate: Date.now()
        };
    }
}
