class DroneManager {
    constructor() {
        this.drones = new Map();
        this.droneCount = 0;
    }
    
    createDrone(config = {}) {
        if (this.drones.size >= CONFIG.MAX_DRONES) {
            return null;
        }
        
        this.droneCount++;
        const droneId = config.id || Utils.generateDroneId(this.droneCount);
        
        const drone = new DroneSimulator(droneId, {
            type: config.type || Utils.randomChoice(Object.keys(CONFIG.DRONE_TYPES)),
            name: config.name || `无人机 ${this.droneCount}`,
            ...config
        });
        
        const startX = Utils.randomRange(-200, 200);
        const startY = Utils.randomRange(-200, 200);
        drone.setPosition(startX, startY, 0);
        
        this.drones.set(droneId, drone);
        stateManager.addDrone(drone.getState());
        stateManager.addLog('success', `${droneId} 已连接`, droneId);
        
        return drone;
    }
    
    removeDrone(droneId) {
        const drone = this.drones.get(droneId);
        if (drone) {
            this.drones.delete(droneId);
            stateManager.removeDrone(droneId);
            stateManager.addLog('info', `${droneId} 已断开连接`, droneId);
            return true;
        }
        return false;
    }
    
    getDrone(droneId) {
        return this.drones.get(droneId);
    }
    
    getAllDrones() {
        return Array.from(this.drones.values());
    }
    
    getActiveDrones() {
        return this.getAllDrones().filter(d => d.state.status !== CONFIG.DRONE_STATUS.OFFLINE);
    }
    
    update(deltaTime, environment, settings) {
        const updates = [];
        
        this.drones.forEach((drone, id) => {
            const state = drone.update(deltaTime, environment, settings);
            stateManager.setDrone(id, state);
            updates.push(state);
            
            this.checkAlerts(drone, state);
        });
        
        return updates;
    }
    
    checkAlerts(drone, state) {
        if (state.battery < 20 && state.battery > 0) {
            if (!drone.lowBatteryAlerted) {
                stateManager.addAlert('battery', '电量过低，建议返航', drone.id, state.battery < 10);
                stateManager.addLog('warning', `${drone.id} 电量警告: ${state.battery.toFixed(1)}%`, drone.id);
                drone.lowBatteryAlerted = true;
            }
        } else {
            drone.lowBatteryAlerted = false;
        }
        
        if (state.signal < 30) {
            if (!drone.lowSignalAlerted) {
                stateManager.addAlert('signal', '信号弱，可能丢失连接', drone.id, state.signal < 15);
                stateManager.addLog('warning', `${drone.id} 信号警告: ${state.signal.toFixed(1)}%`, drone.id);
                drone.lowSignalAlerted = true;
            }
        } else {
            drone.lowSignalAlerted = false;
        }
        
        if (state.status === CONFIG.DRONE_STATUS.EMERGENCY) {
            if (!drone.emergencyAlerted) {
                stateManager.addAlert('emergency', '紧急状态', drone.id, true);
                stateManager.addLog('error', `${drone.id} 进入紧急状态`, drone.id);
                drone.emergencyAlerted = true;
            }
        } else {
            drone.emergencyAlerted = false;
        }
    }
    
    sendCommand(droneId, command, params = {}) {
        const drone = this.drones.get(droneId);
        if (!drone) return false;
        
        let success = false;
        let message = '';
        
        switch (command) {
            case 'takeoff':
                success = drone.takeoff();
                message = success ? `${droneId} 起飞` : `${droneId} 无法起飞`;
                break;
            case 'land':
                success = drone.land();
                message = success ? `${droneId} 开始降落` : `${droneId} 无法降落`;
                break;
            case 'hover':
                success = drone.hover();
                message = success ? `${droneId} 悬停` : `${droneId} 无法悬停`;
                break;
            case 'rth':
                success = drone.returnToHome();
                message = success ? `${droneId} 返航中` : `${droneId} 无法返航`;
                break;
            case 'emergency':
                success = drone.emergencyStop();
                message = success ? `${droneId} 紧急停止!` : `${droneId} 紧急停止失败`;
                break;
            case 'goto':
                success = drone.setTarget(params.x, params.y, params.z);
                message = success ? `${droneId} 前往目标点` : `${droneId} 无法前往目标`;
                break;
            case 'heading':
                success = true;
                drone.setHeading(params.heading);
                message = `${droneId} 调整航向至 ${params.heading}°`;
                break;
            default:
                message = `未知命令: ${command}`;
        }
        
        const logLevel = success ? 'success' : 'warning';
        stateManager.addLog(logLevel, message, droneId);
        
        return success;
    }
    
    sendCommandToAll(command, params = {}) {
        const results = [];
        this.drones.forEach((drone, id) => {
            results.push({
                droneId: id,
                success: this.sendCommand(id, command, params)
            });
        });
        return results;
    }
    
    selectDrone(droneId) {
        if (this.drones.has(droneId)) {
            stateManager.selectDrone(droneId);
            return true;
        }
        return false;
    }
    
    getSelectedDrone() {
        const selectedId = stateManager.getState().selectedDroneId;
        return selectedId ? this.drones.get(selectedId) : null;
    }
    
    getStatistics() {
        const drones = this.getAllDrones();
        return {
            total: drones.length,
            active: drones.filter(d => d.state.status === CONFIG.DRONE_STATUS.ACTIVE).length,
            idle: drones.filter(d => d.state.status === CONFIG.DRONE_STATUS.IDLE).length,
            warning: drones.filter(d => d.state.status === CONFIG.DRONE_STATUS.WARNING).length,
            emergency: drones.filter(d => d.state.status === CONFIG.DRONE_STATUS.EMERGENCY).length,
            avgBattery: drones.reduce((sum, d) => sum + d.state.battery, 0) / drones.length || 0,
            avgSignal: drones.reduce((sum, d) => sum + d.state.signal, 0) / drones.length || 0
        };
    }
    
    initializeDefaultDrones(count = 3) {
        for (let i = 0; i < count && i < CONFIG.MAX_DRONES; i++) {
            this.createDrone();
        }
    }
}

const droneManager = new DroneManager();
