class StateManager {
    constructor() {
        this.state = {
            drones: new Map(),
            selectedDroneId: null,
            waypoints: [],
            mission: null,
            environment: {
                windSpeed: 5,
                windDirection: 0,
                temperature: 25,
                humidity: 60,
                pressure: 1013
            },
            settings: {
                windSpeed: 5,
                windDirection: 0,
                batteryDrain: 1,
                aiInterval: 1000,
                riskThreshold: 70
            },
            ui: {
                currentView: 'map',
                aiDisplayMode: 'stream',
                is3DView: false,
                zoom: 1,
                mapCenter: { x: 0, y: 0 }
            },
            logs: [],
            alerts: [],
            aiThinking: []
        };
        
        this.listeners = new Map();
        this.maxLogs = 100;
        this.maxAlerts = 10;
        this.maxThinking = 50;
    }
    
    getState() {
        return this.state;
    }
    
    getDrone(droneId) {
        return this.state.drones.get(droneId);
    }
    
    getAllDrones() {
        return Array.from(this.state.drones.values());
    }
    
    getSelectedDrone() {
        if (!this.state.selectedDroneId) return null;
        return this.state.drones.get(this.state.selectedDroneId);
    }
    
    setDrone(droneId, droneData) {
        const existingDrone = this.state.drones.get(droneId);
        const drone = { ...existingDrone, ...droneData, id: droneId };
        this.state.drones.set(droneId, drone);
        this.emit('droneUpdate', { droneId, drone });
        return drone;
    }
    
    addDrone(drone) {
        this.state.drones.set(drone.id, drone);
        this.emit('droneAdded', drone);
        return drone;
    }
    
    removeDrone(droneId) {
        const drone = this.state.drones.get(droneId);
        if (drone) {
            this.state.drones.delete(droneId);
            if (this.state.selectedDroneId === droneId) {
                this.state.selectedDroneId = null;
            }
            this.emit('droneRemoved', droneId);
        }
        return drone;
    }
    
    selectDrone(droneId) {
        if (this.state.drones.has(droneId)) {
            this.state.selectedDroneId = droneId;
            this.emit('droneSelected', droneId);
        }
    }
    
    setEnvironment(envData) {
        this.state.environment = { ...this.state.environment, ...envData };
        this.emit('environmentUpdate', this.state.environment);
    }
    
    setSettings(settings) {
        this.state.settings = { ...this.state.settings, ...settings };
        this.emit('settingsUpdate', this.state.settings);
    }
    
    setUIState(uiState) {
        this.state.ui = { ...this.state.ui, ...uiState };
        this.emit('uiUpdate', this.state.ui);
    }
    
    addWaypoint(waypoint) {
        this.state.waypoints.push({
            ...waypoint,
            id: Utils.generateId(),
            order: this.state.waypoints.length + 1
        });
        this.emit('waypointsUpdate', this.state.waypoints);
    }
    
    removeWaypoint(waypointId) {
        this.state.waypoints = this.state.waypoints
            .filter(wp => wp.id !== waypointId)
            .map((wp, index) => ({ ...wp, order: index + 1 }));
        this.emit('waypointsUpdate', this.state.waypoints);
    }
    
    clearWaypoints() {
        this.state.waypoints = [];
        this.emit('waypointsUpdate', this.state.waypoints);
    }
    
    setMission(mission) {
        this.state.mission = mission;
        this.emit('missionUpdate', mission);
    }
    
    clearMission() {
        this.state.mission = null;
        this.emit('missionUpdate', null);
    }
    
    addLog(level, message, droneId = null) {
        const log = {
            id: Utils.generateId(),
            time: Utils.formatTime(),
            timestamp: Date.now(),
            level,
            message,
            droneId
        };
        this.state.logs.unshift(log);
        if (this.state.logs.length > this.maxLogs) {
            this.state.logs.pop();
        }
        this.emit('logAdded', log);
        return log;
    }
    
    clearLogs() {
        this.state.logs = [];
        this.emit('logsCleared');
    }
    
    addAlert(type, message, droneId = null, critical = false) {
        const alert = {
            id: Utils.generateId(),
            time: Utils.formatTime(),
            timestamp: Date.now(),
            type,
            message,
            droneId,
            critical,
            dismissed: false
        };
        this.state.alerts.unshift(alert);
        if (this.state.alerts.length > this.maxAlerts) {
            this.state.alerts.pop();
        }
        this.emit('alertAdded', alert);
        return alert;
    }
    
    dismissAlert(alertId) {
        const alert = this.state.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.dismissed = true;
            this.emit('alertDismissed', alertId);
        }
    }
    
    addAIThinking(type, content, droneId = null, confidence = null) {
        const thinking = {
            id: Utils.generateId(),
            time: Utils.formatTime(),
            timestamp: Date.now(),
            type,
            content,
            droneId,
            confidence
        };
        this.state.aiThinking.unshift(thinking);
        if (this.state.aiThinking.length > this.maxThinking) {
            this.state.aiThinking.pop();
        }
        this.emit('aiThinkingAdded', thinking);
        return thinking;
    }
    
    clearAIThinking() {
        this.state.aiThinking = [];
        this.emit('aiThinkingCleared');
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in listener for ${event}:`, error);
                }
            });
        }
    }
    
    serialize() {
        return JSON.stringify({
            drones: Array.from(this.state.drones.entries()),
            selectedDroneId: this.state.selectedDroneId,
            waypoints: this.state.waypoints,
            mission: this.state.mission,
            environment: this.state.environment,
            settings: this.state.settings,
            ui: this.state.ui
        });
    }
    
    deserialize(data) {
        const parsed = JSON.parse(data);
        this.state.drones = new Map(parsed.drones);
        this.state.selectedDroneId = parsed.selectedDroneId;
        this.state.waypoints = parsed.waypoints;
        this.state.mission = parsed.mission;
        this.state.environment = parsed.environment;
        this.state.settings = parsed.settings;
        this.state.ui = parsed.ui;
        this.emit('stateRestored', this.state);
    }
}

const stateManager = new StateManager();
