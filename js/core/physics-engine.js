class PhysicsEngine {
    constructor() {
        this.gravity = 9.81;
        this.airDensity = 1.225;
    }
    
    calculatePosition(drone, deltaTime, environment) {
        const dt = deltaTime / 1000;
        const pos = { ...drone.position };
        const vel = { ...drone.velocity };
        
        const windEffect = this.calculateWindEffect(environment);
        vel.x += windEffect.x * dt;
        vel.y += windEffect.y * dt;
        
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        pos.z += vel.z * dt;
        
        pos.x = Utils.clamp(pos.x, -CONFIG.WORLD_SIZE / 2, CONFIG.WORLD_SIZE / 2);
        pos.y = Utils.clamp(pos.y, -CONFIG.WORLD_SIZE / 2, CONFIG.WORLD_SIZE / 2);
        pos.z = Utils.clamp(pos.z, CONFIG.PHYSICS.MIN_ALTITUDE, CONFIG.PHYSICS.MAX_ALTITUDE);
        
        return { position: pos, velocity: vel };
    }
    
    calculateWindEffect(environment) {
        const windSpeed = environment.windSpeed || 0;
        const windDirection = environment.windDirection || 0;
        const windRad = Utils.degToRad(windDirection);
        
        return {
            x: Math.cos(windRad) * windSpeed * CONFIG.PHYSICS.WIND_INFLUENCE,
            y: Math.sin(windRad) * windSpeed * CONFIG.PHYSICS.WIND_INFLUENCE
        };
    }
    
    calculateVelocity(drone, targetVelocity, deltaTime) {
        const dt = deltaTime / 1000;
        const currentVel = { ...drone.velocity };
        const maxAccel = CONFIG.PHYSICS.MAX_ACCELERATION;
        
        const accelX = Utils.clamp(targetVelocity.x - currentVel.x, -maxAccel, maxAccel);
        const accelY = Utils.clamp(targetVelocity.y - currentVel.y, -maxAccel, maxAccel);
        const accelZ = Utils.clamp(targetVelocity.z - currentVel.z, -maxAccel * 0.5, maxAccel * 0.5);
        
        currentVel.x += accelX * dt;
        currentVel.y += accelY * dt;
        currentVel.z += accelZ * dt;
        
        currentVel.x = Utils.clamp(currentVel.x, -CONFIG.PHYSICS.MAX_SPEED, CONFIG.PHYSICS.MAX_SPEED);
        currentVel.y = Utils.clamp(currentVel.y, -CONFIG.PHYSICS.MAX_SPEED, CONFIG.PHYSICS.MAX_SPEED);
        currentVel.z = Utils.clamp(currentVel.z, -CONFIG.PHYSICS.CLIMB_RATE, CONFIG.PHYSICS.CLIMB_RATE);
        
        return currentVel;
    }
    
    calculateHeading(currentHeading, targetHeading, deltaTime) {
        const dt = deltaTime / 1000;
        const maxTurn = CONFIG.PHYSICS.TURN_RATE * dt;
        
        let diff = targetHeading - currentHeading;
        
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        const turn = Utils.clamp(diff, -maxTurn, maxTurn);
        return Utils.normalizeAngle(currentHeading + turn);
    }
    
    calculateBatteryDrain(drone, deltaTime, settings) {
        const dt = deltaTime / 1000;
        const baseDrain = CONFIG.PHYSICS.BATTERY_DRAIN_RATE;
        const multiplier = settings.batteryDrain || 1;
        
        const speed = Math.sqrt(
            drone.velocity.x ** 2 + 
            drone.velocity.y ** 2 + 
            drone.velocity.z ** 2
        );
        
        const speedFactor = 1 + (speed / CONFIG.PHYSICS.MAX_SPEED) * 0.5;
        const altitudeFactor = 1 + (drone.position.z / CONFIG.PHYSICS.MAX_ALTITUDE) * 0.2;
        
        const drain = baseDrain * speedFactor * altitudeFactor * multiplier * dt;
        
        return Math.max(0, drone.battery - drain);
    }
    
    calculateSignalStrength(drone, baseStation = { x: 0, y: 0 }) {
        const distance = Utils.distance(
            drone.position.x, drone.position.y,
            baseStation.x, baseStation.y
        );
        
        const maxDistance = CONFIG.WORLD_SIZE / 2;
        const signal = 100 * (1 - (distance / maxDistance) ** 0.5);
        
        return Math.max(0, Math.min(100, signal));
    }
    
    calculateGPSAccuracy(drone, environment) {
        const baseAccuracy = 1.5;
        const altitudeFactor = drone.position.z / CONFIG.PHYSICS.MAX_ALTITUDE;
        const speedFactor = Math.sqrt(
            drone.velocity.x ** 2 + drone.velocity.y ** 2
        ) / CONFIG.PHYSICS.MAX_SPEED;
        
        const noise = Utils.randomRange(-0.5, 0.5);
        
        return baseAccuracy + altitudeFactor * 2 + speedFactor * 1.5 + noise;
    }
    
    calculateAttitude(drone, targetPosition) {
        const dx = targetPosition.x - drone.position.x;
        const dy = targetPosition.y - drone.position.y;
        const dz = targetPosition.z - drone.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const pitch = distance > 0 ? Utils.radToDeg(Math.atan2(dz, distance)) : 0;
        const roll = Utils.clamp(drone.velocity.x * 0.5, -15, 15);
        
        return { pitch, roll };
    }
    
    checkCollision(drone, obstacles = []) {
        for (const obstacle of obstacles) {
            const dist = Utils.distance3D(
                drone.position.x, drone.position.y, drone.position.z,
                obstacle.x, obstacle.y, obstacle.z
            );
            
            if (dist < obstacle.radius + 5) {
                return {
                    collision: true,
                    obstacle,
                    distance: dist
                };
            }
        }
        
        return { collision: false };
    }
    
    checkNoFlyZone(drone, noFlyZones = []) {
        for (const zone of noFlyZones) {
            const dist = Utils.distance(
                drone.position.x, drone.position.y,
                zone.x, zone.y
            );
            
            if (dist < zone.radius) {
                return {
                    inZone: true,
                    zone,
                    distance: dist
                };
            }
        }
        
        return { inZone: false };
    }
    
    calculatePathToTarget(drone, target, environment) {
        const dx = target.x - drone.position.x;
        const dy = target.y - drone.position.y;
        const dz = target.z - drone.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const heading = Utils.angle(drone.position.x, drone.position.y, target.x, target.y);
        
        const windEffect = this.calculateWindEffect(environment);
        const adjustedHeading = heading - Math.atan2(windEffect.y, windEffect.x) * (180 / Math.PI) * 0.1;
        
        return {
            distance,
            heading: Utils.normalizeAngle(adjustedHeading),
            estimatedTime: distance / CONFIG.PHYSICS.MAX_SPEED
        };
    }
    
    calculateAvoidancePath(drone, obstacle, environment) {
        const dx = drone.position.x - obstacle.x;
        const dy = drone.position.y - obstacle.y;
        
        const angle = Math.atan2(dy, dx);
        const avoidDistance = obstacle.radius + 20;
        
        const targetX = obstacle.x + Math.cos(angle) * avoidDistance;
        const targetY = obstacle.y + Math.sin(angle) * avoidDistance;
        
        return {
            x: targetX,
            y: targetY,
            z: Math.max(drone.position.z, obstacle.z + 20)
        };
    }
}

const physicsEngine = new PhysicsEngine();
