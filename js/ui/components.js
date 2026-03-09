class UIComponents {
    static createDroneCard(drone, isSelected) {
        const state = drone.getState();
        const statusClass = state.status;
        const batteryClass = state.battery < 20 ? 'critical' : state.battery < 40 ? 'low' : '';
        
        return `
            <div class="drone-card ${isSelected ? 'selected' : ''}" data-drone-id="${drone.id}">
                <div class="drone-card-header">
                    <span class="drone-id">${drone.id}</span>
                    <span class="drone-status ${statusClass}">${this.getStatusText(state.status)}</span>
                </div>
                <div class="drone-stats">
                    <div class="drone-stat">
                        <span class="drone-stat-label">电量</span>
                        <span class="drone-stat-value ${batteryClass}">${state.battery.toFixed(0)}%</span>
                    </div>
                    <div class="drone-stat">
                        <span class="drone-stat-label">高度</span>
                        <span class="drone-stat-value">${state.position.z.toFixed(0)}m</span>
                    </div>
                    <div class="drone-stat">
                        <span class="drone-stat-label">速度</span>
                        <span class="drone-stat-value">${state.speed.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    static getStatusText(status) {
        const statusMap = {
            [CONFIG.DRONE_STATUS.ACTIVE]: '活动中',
            [CONFIG.DRONE_STATUS.IDLE]: '待命',
            [CONFIG.DRONE_STATUS.WARNING]: '警告',
            [CONFIG.DRONE_STATUS.EMERGENCY]: '紧急',
            [CONFIG.DRONE_STATUS.OFFLINE]: '离线'
        };
        return statusMap[status] || status;
    }
    
    static createWaypointItem(waypoint, index) {
        return `
            <div class="waypoint-item" data-waypoint-id="${waypoint.id}">
                <div class="waypoint-info">
                    <span class="waypoint-number">${index + 1}</span>
                    <span class="waypoint-coords">
                        X: ${waypoint.x.toFixed(0)}, Y: ${waypoint.y.toFixed(0)}
                    </span>
                </div>
                <button class="waypoint-remove" data-waypoint-id="${waypoint.id}">×</button>
            </div>
        `;
    }
    
    static createThinkingLine(thinking) {
        const typeClass = thinking.type;
        const tagText = this.getThinkingTagText(thinking.type);
        
        return `
            <div class="thinking-line ${typeClass}">
                <span class="timestamp">${thinking.time}</span>
                <span class="tag">${tagText}</span>
                <span class="content">${thinking.content}</span>
            </div>
        `;
    }
    
    static createThinkingCard(thinking) {
        const typeClass = thinking.type;
        const iconText = this.getThinkingIcon(thinking.type);
        const titleText = this.getThinkingTitle(thinking.type);
        
        return `
            <div class="thinking-card ${typeClass}">
                <div class="thinking-card-header">
                    <div class="thinking-card-icon">${iconText}</div>
                    <span class="thinking-card-title">${titleText}</span>
                    <span class="thinking-card-time">${thinking.time}</span>
                </div>
                <div class="thinking-card-body">
                    <div class="thinking-card-content">${thinking.content}</div>
                    ${thinking.confidence ? `
                        <div class="thinking-card-meta">
                            <div class="thinking-card-confidence">
                                <span>置信度: </span>
                                <strong>${thinking.confidence}%</strong>
                            </div>
                            ${thinking.droneId ? `<div class="thinking-card-drone">${thinking.droneId}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    static getThinkingTagText(type) {
        const map = {
            [CONFIG.AI_THINKING_TYPES.PERCEPTION]: '感知',
            [CONFIG.AI_THINKING_TYPES.ANALYSIS]: '分析',
            [CONFIG.AI_THINKING_TYPES.DECISION]: '决策',
            [CONFIG.AI_THINKING_TYPES.ALERT]: '警告'
        };
        return map[type] || type;
    }
    
    static getThinkingIcon(type) {
        const map = {
            [CONFIG.AI_THINKING_TYPES.PERCEPTION]: '👁',
            [CONFIG.AI_THINKING_TYPES.ANALYSIS]: '🧠',
            [CONFIG.AI_THINKING_TYPES.DECISION]: '⚡',
            [CONFIG.AI_THINKING_TYPES.ALERT]: '⚠'
        };
        return map[type] || '?';
    }
    
    static getThinkingTitle(type) {
        const map = {
            [CONFIG.AI_THINKING_TYPES.PERCEPTION]: '环境感知',
            [CONFIG.AI_THINKING_TYPES.ANALYSIS]: '态势分析',
            [CONFIG.AI_THINKING_TYPES.DECISION]: '执行决策',
            [CONFIG.AI_THINKING_TYPES.ALERT]: '异常告警'
        };
        return map[type] || type;
    }
    
    static createLogEntry(log) {
        return `
            <div class="log-entry ${log.level}">
                <span class="time">${log.time}</span>
                <span class="message">${log.message}</span>
            </div>
        `;
    }
    
    static createAlertItem(alert) {
        return `
            <div class="alert-item ${alert.critical ? 'critical' : ''}" data-alert-id="${alert.id}">
                <span class="alert-icon">${alert.critical ? '⚠' : '⚡'}</span>
                <span class="alert-message">${alert.message}</span>
            </div>
        `;
    }
    
    static createVideoTab(droneId, isActive) {
        return `
            <button class="video-tab ${isActive ? 'active' : ''}" data-drone-id="${droneId}">
                ${droneId}
            </button>
        `;
    }
    
    static updateSensorDisplay(sensorData) {
        const elements = {
            'sensor-altitude': sensorData.flight.altitude.value,
            'sensor-speed': sensorData.flight.speed.value,
            'sensor-heading': sensorData.flight.heading.value,
            'sensor-pitch': sensorData.flight.pitch.value,
            'sensor-roll': sensorData.flight.roll.value,
            'sensor-vspeed': sensorData.flight.verticalSpeed.value,
            'sensor-temp': sensorData.environment.temperature.value,
            'sensor-humidity': sensorData.environment.humidity.value,
            'sensor-wind': sensorData.environment.windSpeed.value,
            'sensor-pressure': sensorData.environment.pressure.value,
            'sensor-battery': sensorData.system.battery.value,
            'sensor-signal': sensorData.system.signal.value,
            'sensor-gps': sensorData.system.gpsAccuracy.value,
            'sensor-storage': sensorData.system.storage.value
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                const unit = this.getSensorUnit(id);
                el.textContent = `${typeof value === 'number' ? value.toFixed(1) : value}${unit}`;
            }
        });
        
        this.updateBatteryIndicator(sensorData.system.battery.value);
        this.updateSignalIndicator(sensorData.system.signal.value);
    }
    
    static getSensorUnit(sensorId) {
        const units = {
            'sensor-altitude': ' m',
            'sensor-speed': ' m/s',
            'sensor-heading': ' °',
            'sensor-pitch': ' °',
            'sensor-roll': ' °',
            'sensor-vspeed': ' m/s',
            'sensor-temp': ' °C',
            'sensor-humidity': ' %',
            'sensor-wind': ' m/s',
            'sensor-pressure': ' hPa',
            'sensor-battery': ' %',
            'sensor-signal': ' %',
            'sensor-gps': ' m',
            'sensor-storage': ' GB'
        };
        return units[sensorId] || '';
    }
    
    static updateBatteryIndicator(battery) {
        const fillEl = document.getElementById('battery-fill');
        if (fillEl) {
            fillEl.style.setProperty('--battery-width', `${battery}%`);
            fillEl.style.cssText = `width: ${battery}%`;
            
            if (battery < 20) {
                fillEl.style.background = CONFIG.COLORS.DANGER;
            } else if (battery < 40) {
                fillEl.style.background = CONFIG.COLORS.WARNING;
            } else {
                fillEl.style.background = CONFIG.COLORS.SUCCESS;
            }
        }
    }
    
    static updateSignalIndicator(signal) {
        const barsEl = document.getElementById('signal-bars');
        if (barsEl) {
            const bars = Math.ceil(signal / 20);
            barsEl.innerHTML = Array(5).fill(0).map((_, i) => 
                `<span style="height: ${(i + 1) * 3}px; opacity: ${i < bars ? 1 : 0.3}"></span>`
            ).join('');
        }
    }
    
    static updateHUD(droneState) {
        const hudElements = {
            'hud-alt': droneState.position.z.toFixed(0),
            'hud-spd': droneState.speed.toFixed(1),
            'hud-hdg': droneState.heading.toFixed(0),
            'hud-bat': droneState.battery.toFixed(0),
            'hud-sig': droneState.signal.toFixed(0),
            'hud-drone-id': droneState.id
        };
        
        Object.entries(hudElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
            }
        });
    }
}
