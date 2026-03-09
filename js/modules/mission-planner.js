class MissionPlanner {
    constructor() {
        this.currentMission = null;
        this.missionTypes = CONFIG.MISSION_TYPES;
    }
    
    createMission(type, waypoints, options = {}) {
        const mission = {
            id: Utils.generateId(),
            type: type,
            name: options.name || `${MISSION_NAMES[type]} ${Date.now()}`,
            waypoints: waypoints,
            altitude: options.altitude || 100,
            speed: options.speed || 10,
            status: 'pending',
            createdAt: Date.now(),
            startTime: null,
            endTime: null,
            progress: 0
        };
        
        stateManager.setMission(mission);
        stateManager.addLog('success', `任务已创建: ${mission.name}`);
        
        return mission;
    }
    
    startMission(droneId) {
        const mission = stateManager.getState().mission;
        const drone = droneManager.getDrone(droneId);
        
        if (!mission || !drone) {
            stateManager.addLog('error', '无法启动任务：任务或无人机不存在');
            return false;
        }
        
        if (mission.waypoints.length === 0) {
            stateManager.addLog('warning', '无法启动任务：没有航点');
            return false;
        }
        
        const droneState = drone.getState();
        
        if (droneState.flightMode === CONFIG.FLIGHT_MODES.IDLE) {
            droneManager.sendCommand(droneId, 'takeoff');
        }
        
        mission.status = 'active';
        mission.startTime = Date.now();
        
        drone.setMission(mission);
        
        const firstWaypoint = mission.waypoints[0];
        droneManager.sendCommand(droneId, 'goto', {
            x: firstWaypoint.x,
            y: firstWaypoint.y,
            z: mission.altitude
        });
        
        stateManager.setMission(mission);
        stateManager.addLog('success', `${droneId} 开始执行任务: ${mission.name}`, droneId);
        
        aiAgent.addThinking('decision', 
            `启动任务执行: ${mission.name}，共 ${mission.waypoints.length} 个航点`,
            droneId,
            92
        );
        
        return true;
    }
    
    pauseMission(droneId) {
        const drone = droneManager.getDrone(droneId);
        if (!drone) return false;
        
        const mission = stateManager.getState().mission;
        if (!mission || mission.status !== 'active') return false;
        
        mission.status = 'paused';
        droneManager.sendCommand(droneId, 'hover');
        
        stateManager.setMission(mission);
        stateManager.addLog('info', `${droneId} 任务已暂停`, droneId);
        
        return true;
    }
    
    resumeMission(droneId) {
        const drone = droneManager.getDrone(droneId);
        if (!drone) return false;
        
        const mission = stateManager.getState().mission;
        if (!mission || mission.status !== 'paused') return false;
        
        mission.status = 'active';
        stateManager.setMission(mission);
        
        const droneState = drone.getState();
        const currentWaypointIndex = this.getCurrentWaypointIndex(drone, mission);
        
        if (currentWaypointIndex < mission.waypoints.length) {
            const nextWaypoint = mission.waypoints[currentWaypointIndex];
            droneManager.sendCommand(droneId, 'goto', {
                x: nextWaypoint.x,
                y: nextWaypoint.y,
                z: mission.altitude
            });
        }
        
        stateManager.addLog('success', `${droneId} 任务已恢复`, droneId);
        
        return true;
    }
    
    cancelMission(droneId) {
        const drone = droneManager.getDrone(droneId);
        if (!drone) return false;
        
        const mission = stateManager.getState().mission;
        if (!mission) return false;
        
        mission.status = 'cancelled';
        mission.endTime = Date.now();
        
        droneManager.sendCommand(droneId, 'hover');
        
        stateManager.setMission(mission);
        stateManager.addLog('warning', `${droneId} 任务已取消`, droneId);
        
        return true;
    }
    
    completeMission(droneId) {
        const mission = stateManager.getState().mission;
        if (!mission) return false;
        
        mission.status = 'completed';
        mission.endTime = Date.now();
        mission.progress = 100;
        
        droneManager.sendCommand(droneId, 'rth');
        
        stateManager.setMission(mission);
        stateManager.addLog('success', `${droneId} 任务完成: ${mission.name}`, droneId);
        
        aiAgent.addThinking('decision',
            `任务完成: ${mission.name}，总耗时 ${Math.round((mission.endTime - mission.startTime) / 1000)} 秒`,
            droneId,
            95
        );
        
        return true;
    }
    
    getCurrentWaypointIndex(drone, mission) {
        const droneState = drone.getState();
        
        for (let i = 0; i < mission.waypoints.length; i++) {
            const wp = mission.waypoints[i];
            const dist = Utils.distance(
                droneState.position.x, droneState.position.y,
                wp.x, wp.y
            );
            
            if (dist > 10) {
                return i;
            }
        }
        
        return mission.waypoints.length;
    }
    
    updateMissionProgress(droneId) {
        const drone = droneManager.getDrone(droneId);
        const mission = stateManager.getState().mission;
        
        if (!drone || !mission || mission.status !== 'active') return;
        
        const droneState = drone.getState();
        const currentIndex = this.getCurrentWaypointIndex(drone, mission);
        
        mission.progress = Math.round((currentIndex / mission.waypoints.length) * 100);
        
        if (currentIndex >= mission.waypoints.length) {
            this.completeMission(droneId);
            return;
        }
        
        const currentWaypoint = mission.waypoints[currentIndex];
        const dist = Utils.distance(
            droneState.position.x, droneState.position.y,
            currentWaypoint.x, currentWaypoint.y
        );
        
        if (dist < 10) {
            if (currentIndex + 1 < mission.waypoints.length) {
                const nextWaypoint = mission.waypoints[currentIndex + 1];
                droneManager.sendCommand(droneId, 'goto', {
                    x: nextWaypoint.x,
                    y: nextWaypoint.y,
                    z: mission.altitude
                });
                
                aiAgent.addThinking('decision',
                    `${droneId} 到达航点 ${currentIndex + 1}，前往下一航点`,
                    droneId,
                    90
                );
            }
        }
        
        stateManager.setMission(mission);
    }
    
    addWaypoint(x, y, z = null) {
        const waypoint = {
            x: x,
            y: y,
            z: z,
            id: Utils.generateId()
        };
        
        stateManager.addWaypoint(waypoint);
        
        return waypoint;
    }
    
    removeWaypoint(waypointId) {
        stateManager.removeWaypoint(waypointId);
    }
    
    clearWaypoints() {
        stateManager.clearWaypoints();
    }
    
    generatePatrolMission(centerX, centerY, radius, points = 8) {
        const waypoints = [];
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            waypoints.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                z: null
            });
        }
        
        waypoints.push({ ...waypoints[0] });
        
        return waypoints;
    }
    
    generateSearchPattern(centerX, centerY, width, height, spacing = 50) {
        const waypoints = [];
        const rows = Math.ceil(height / spacing);
        
        for (let i = 0; i <= rows; i++) {
            const y = centerY - height / 2 + i * spacing;
            
            if (i % 2 === 0) {
                waypoints.push({ x: centerX - width / 2, y: y, z: null });
                waypoints.push({ x: centerX + width / 2, y: y, z: null });
            } else {
                waypoints.push({ x: centerX + width / 2, y: y, z: null });
                waypoints.push({ x: centerX - width / 2, y: y, z: null });
            }
        }
        
        return waypoints;
    }
}

const missionPlanner = new MissionPlanner();
