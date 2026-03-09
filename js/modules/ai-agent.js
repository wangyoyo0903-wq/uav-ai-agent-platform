class AIAgent {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.decisionInterval = 800;
        this.confidence = 85;
        
        this.config = {
            decisionStyle: 'conservative',
            riskThreshold: 70,
            priority: 'safety',
            capabilities: {
                autoRth: true,
                autoAvoid: true,
                autoCoord: true,
                smartSchedule: true
            }
        };
        
        this.demoMode = false;
        this.currentScene = 'search';
        this.thinkingCounter = 0;
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => this.process(), this.decisionInterval);
        this.showWelcome();
    }
    
    showWelcome() {
        setTimeout(() => {
            this.addThinking('perception', '🚀 AI Agent 系统启动，正在初始化...', null, 98);
        }, 300);
        setTimeout(() => {
            this.addThinking('analysis', '检测到 3 架无人机已就绪，等待任务指令', null, 95);
        }, 1000);
        setTimeout(() => {
            this.addThinking('decision', '💡 选择左侧场景并点击「开始演示」查看AI自主决策能力', null, 92);
        }, 2000);
    }
    
    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.addThinking('decision', `⚙️ AI配置已更新: ${JSON.stringify(newConfig)}`, null, 90);
    }
    
    setCapability(capability, enabled) {
        this.config.capabilities[capability] = enabled;
    }
    
    startScene(sceneName) {
        this.currentScene = sceneName;
        this.demoMode = true;
        
        const scenes = {
            search: () => this.runSearchScene(),
            patrol: () => this.runPatrolScene(),
            formation: () => this.runFormationScene(),
            emergency: () => this.runEmergencyScene()
        };
        
        if (scenes[sceneName]) {
            scenes[sceneName]();
        }
    }
    
    runSearchScene() {
        this.addThinking('decision', '🎯 启动搜救任务 - AI将自主搜索目标区域', null, 98);
        
        const drones = droneManager.getAllDrones();
        
        setTimeout(() => {
            this.addThinking('perception', `📡 分析搜索区域，分配 ${drones.length} 架无人机执行扇形搜索`, null, 95);
        }, 1000);
        
        setTimeout(() => {
            drones.forEach((drone, i) => {
                droneManager.sendCommand(drone.id, 'takeoff');
            });
            this.addThinking('decision', '🛫 所有无人机起飞，开始搜索任务', null, 94);
        }, 2000);
        
        setTimeout(() => {
            this.addThinking('analysis', '🔍 搜索模式: 扇形扩展，覆盖半径 500m', null, 90);
        }, 4000);
        
        setTimeout(() => {
            drones.forEach((drone, i) => {
                const angle = (i / drones.length) * Math.PI * 2;
                const targetX = Math.cos(angle) * 180;
                const targetY = Math.sin(angle) * 180;
                droneManager.sendCommand(drone.id, 'goto', { x: targetX, y: targetY, z: 80 });
            });
            this.addThinking('decision', '📍 分配搜索航点，各机开始巡航', null, 92);
        }, 5000);
        
        setTimeout(() => {
            this.addThinking('perception', '👁️ 视觉传感器扫描中... 区域 A1 完成', null, 88);
        }, 8000);
        
        setTimeout(() => {
            this.addThinking('analysis', '📊 搜索进度: 35%，未发现目标', null, 86);
        }, 12000);
        
        setTimeout(() => {
            this.addThinking('perception', '👁️ 视觉传感器扫描中... 区域 B2 完成', null, 87);
        }, 15000);
        
        setTimeout(() => {
            this.addThinking('alert', '🎯 检测到疑似目标！坐标: (120, -80)', null, 96);
        }, 18000);
        
        setTimeout(() => {
            this.addThinking('decision', '🚁 UAV-02 前往确认目标，其他无人机继续搜索', 'UAV-02', 94);
        }, 20000);
        
        setTimeout(() => {
            this.addThinking('analysis', '✅ 目标确认！标记位置并通知指挥中心', null, 98);
        }, 24000);
        
        setTimeout(() => {
            drones.forEach(d => droneManager.sendCommand(d.id, 'rth'));
            this.addThinking('decision', '🎉 搜救任务完成！所有无人机返航', null, 99);
            this.demoMode = false;
        }, 28000);
    }
    
    runPatrolScene() {
        this.addThinking('decision', '📡 启动巡检任务 - AI将执行智能巡检', null, 98);
        
        const drones = droneManager.getAllDrones();
        
        setTimeout(() => {
            this.addThinking('perception', '📋 加载巡检路线: 电力线路 A-B-C-D', null, 95);
        }, 1000);
        
        setTimeout(() => {
            drones[0] && droneManager.sendCommand(drones[0].id, 'takeoff');
            this.addThinking('decision', `🛫 ${drones[0]?.id || 'UAV-01'} 起飞执行巡检`, drones[0]?.id, 94);
        }, 2000);
        
        setTimeout(() => {
            this.addThinking('analysis', '⚡ 巡检模式: 低速飞行，高精度拍摄', null, 90);
        }, 4000);
        
        setTimeout(() => {
            drones[0] && droneManager.sendCommand(drones[0].id, 'goto', { x: 100, y: 0, z: 60 });
            this.addThinking('perception', '📍 到达巡检点 A，开始检测', null, 88);
        }, 6000);
        
        setTimeout(() => {
            this.addThinking('analysis', '✅ 点 A 检测完成，设备正常', null, 92);
        }, 10000);
        
        setTimeout(() => {
            drones[0] && droneManager.sendCommand(drones[0].id, 'goto', { x: 100, y: 100, z: 60 });
            this.addThinking('perception', '📍 到达巡检点 B，开始检测', null, 88);
        }, 12000);
        
        setTimeout(() => {
            this.addThinking('alert', '⚠️ 点 B 检测到异常：设备温度偏高', null, 94);
        }, 16000);
        
        setTimeout(() => {
            this.addThinking('decision', '📸 拍摄高清图像并标记异常位置', null, 92);
        }, 18000);
        
        setTimeout(() => {
            drones[0] && droneManager.sendCommand(drones[0].id, 'rth');
            this.addThinking('decision', '🎉 巡检任务完成！发现 1 处异常', null, 98);
            this.demoMode = false;
        }, 22000);
    }
    
    runFormationScene() {
        this.addThinking('decision', '🛸 启动编队任务 - AI将协调多机编队飞行', null, 98);
        
        const drones = droneManager.getAllDrones();
        
        setTimeout(() => {
            this.addThinking('perception', `📊 编队配置: ${drones.length} 机三角形编队`, null, 95);
        }, 1000);
        
        setTimeout(() => {
            drones.forEach(d => droneManager.sendCommand(d.id, 'takeoff'));
            this.addThinking('decision', '🛫 所有无人机起飞，准备编队', null, 94);
        }, 2000);
        
        setTimeout(() => {
            this.addThinking('analysis', '📐 计算编队位置，保持安全间距 20m', null, 90);
        }, 4000);
        
        setTimeout(() => {
            drones.forEach((drone, i) => {
                const x = (i - 1) * 40;
                const y = i === 1 ? 0 : (i === 0 ? -30 : 30);
                droneManager.sendCommand(drone.id, 'goto', { x, y, z: 80 });
            });
            this.addThinking('decision', '📍 编队位置分配完成，开始编队飞行', null, 92);
        }, 6000);
        
        setTimeout(() => {
            this.addThinking('perception', '✈️ 编队飞行中，速度 15 m/s，队形稳定', null, 88);
        }, 10000);
        
        setTimeout(() => {
            this.addThinking('analysis', '🔄 执行编队转弯，各机调整位置', null, 90);
        }, 14000);
        
        setTimeout(() => {
            this.addThinking('perception', '✅ 编队转弯完成，保持队形继续飞行', null, 88);
        }, 18000);
        
        setTimeout(() => {
            drones.forEach(d => droneManager.sendCommand(d.id, 'rth'));
            this.addThinking('decision', '🎉 编队任务完成！所有无人机返航', null, 99);
            this.demoMode = false;
        }, 22000);
    }
    
    runEmergencyScene() {
        this.addThinking('decision', '🚨 启动应急任务 - 模拟突发情况响应', null, 98);
        
        const drones = droneManager.getAllDrones();
        
        setTimeout(() => {
            drones.forEach(d => droneManager.sendCommand(d.id, 'takeoff'));
            this.addThinking('decision', '🛫 紧急起飞！所有无人机立即升空', null, 96);
        }, 1000);
        
        setTimeout(() => {
            this.addThinking('perception', '📡 检测到紧急情况：区域 C 发生异常', null, 94);
        }, 3000);
        
        setTimeout(() => {
            this.addThinking('alert', '⚠️ 风速突然增大至 18 m/s！', null, 98);
        }, 5000);
        
        setTimeout(() => {
            this.addThinking('decision', '📉 根据保守策略，降低飞行高度至 40m', null, 94);
            drones.forEach(d => {
                const state = d.getState();
                droneManager.sendCommand(d.id, 'goto', { 
                    x: state.position.x, 
                    y: state.position.y, 
                    z: 40 
                });
            });
        }, 7000);
        
        setTimeout(() => {
            this.addThinking('alert', '🔋 UAV-02 电量警告: 25%', 'UAV-02', 96);
        }, 10000);
        
        setTimeout(() => {
            if (this.config.capabilities.autoRth) {
                droneManager.sendCommand(drones[1]?.id || 'UAV-02', 'rth');
                this.addThinking('decision', '🔄 自动返航已启用，UAV-02 返回基地', 'UAV-02', 95);
            }
        }, 12000);
        
        setTimeout(() => {
            this.addThinking('analysis', '📊 剩余无人机继续执行任务，保持警戒', null, 90);
        }, 15000);
        
        setTimeout(() => {
            this.addThinking('perception', '✅ 风速下降至安全范围，恢复正常高度', null, 88);
        }, 18000);
        
        setTimeout(() => {
            drones.forEach(d => droneManager.sendCommand(d.id, 'rth'));
            this.addThinking('decision', '🎉 应急任务完成！所有无人机安全返航', null, 99);
            this.demoMode = false;
        }, 22000);
    }
    
    process() {
        if (!this.isRunning || this.demoMode) return;
        
        const state = stateManager.getState();
        const drones = droneManager.getAllDrones();
        
        if (drones.length === 0) return;
        
        this.thinkingCounter++;
        
        if (this.thinkingCounter % 5 === 0) {
            drones.forEach(drone => {
                this.analyzeDrone(drone, state);
            });
        }
        
        this.updateConfidence();
    }
    
    analyzeDrone(drone, state) {
        const droneState = drone.getState();
        const env = state.environment;
        
        if (droneState.battery < 20 && this.config.capabilities.autoRth) {
            this.addThinking('alert', 
                `🔋 ${drone.id} 电量低 (${droneState.battery.toFixed(0)}%)，自动返航`, 
                drone.id, 95);
            droneManager.sendCommand(drone.id, 'rth');
        }
        
        if (env.windSpeed > 15 && this.config.decisionStyle === 'conservative') {
            this.addThinking('alert',
                `💨 风速过高 (${env.windSpeed.toFixed(1)} m/s)，建议降低高度`,
                drone.id, 90);
        }
        
        if (droneState.flightMode !== 'idle' && Math.random() < 0.2) {
            const types = ['perception', 'analysis', 'decision'];
            const type = Utils.randomChoice(types);
            const messages = {
                perception: `${drone.id} 高度 ${droneState.position.z.toFixed(0)}m，速度 ${droneState.speed.toFixed(1)} m/s`,
                analysis: `${drone.id} 飞行状态正常，电量 ${droneState.battery.toFixed(0)}%`,
                decision: `${drone.id} 继续执行当前任务`
            };
            this.addThinking(type, messages[type], drone.id, Utils.randomInt(80, 95));
        }
    }
    
    addThinking(type, content, droneId = null, confidence = null) {
        stateManager.addAIThinking(type, content, droneId, confidence);
        
        const valueEl = document.getElementById('confidence-value-mini');
        if (valueEl && confidence) {
            valueEl.textContent = `${confidence}%`;
        }
    }
    
    updateConfidence() {
        const drones = droneManager.getAllDrones();
        if (drones.length === 0) return;
        
        let totalRisk = 0;
        drones.forEach(d => {
            const state = d.getState();
            if (state.battery < 20) totalRisk += 30;
            if (state.signal < 50) totalRisk += 20;
        });
        
        this.confidence = Math.max(50, Math.min(99, 100 - totalRisk / drones.length));
    }
}

const aiAgent = new AIAgent();
