class UIController {
    constructor() {
        this.mapRenderer = null;
        this.videoRenderer = null;
        this.splitMapRenderer = null;
        this.splitVideoRenderer = null;
        this.currentMode = 'demo';
        this.selectedScene = 'search';
        this.isInitialized = false;
        this.renderersReady = false;
    }
    
    init() {
        this.initRenderers();
        this.bindEvents();
        this.bindStateListeners();
        this.startClock();
        this.isInitialized = true;
    }
    
    initRenderers() {
        this.mapRenderer = new MapRenderer('map-canvas');
        this.videoRenderer = new VideoRenderer('video-canvas');
        this.splitMapRenderer = new MapRenderer('split-map-canvas');
        this.splitVideoRenderer = new VideoRenderer('split-video-canvas');
        this.renderersReady = true;
    }
    
    bindEvents() {
        this.bindModeSwitcher();
        this.bindSceneSelection();
        this.bindDemoButton();
        this.bindAIEditor();
        this.bindViewTabs();
        this.bindDroneList();
        this.bindControls();
        this.bindMapControls();
        this.bindThinkingToggle();
    }
    
    bindModeSwitcher() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        document.body.classList.toggle('mode-manual', mode === 'manual');
        
        if (mode === 'manual') {
            aiAgent.addThinking('decision', '⚙️ 切换至配置模式，可手动控制无人机', null, 90);
        } else {
            aiAgent.addThinking('decision', '🎬 切换至演示模式，选择场景开始演示', null, 90);
        }
    }
    
    bindSceneSelection() {
        const sceneCards = document.querySelectorAll('.scene-card');
        sceneCards.forEach(card => {
            card.addEventListener('click', () => {
                sceneCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.selectedScene = card.dataset.scene;
            });
        });
    }
    
    bindDemoButton() {
        const btn = document.getElementById('btn-start-demo');
        if (btn) {
            btn.addEventListener('click', () => {
                if (aiAgent.demoMode) {
                    aiAgent.addThinking('alert', '⏳ 演示正在进行中，请稍候...', null, 85);
                    return;
                }
                
                btn.classList.add('running');
                btn.innerHTML = '<span class="btn-icon-left">⏳</span><span>演示中...</span>';
                
                aiAgent.startScene(this.selectedScene);
                
                const duration = {
                    search: 30000,
                    patrol: 24000,
                    formation: 24000,
                    emergency: 24000
                };
                
                setTimeout(() => {
                    btn.classList.remove('running');
                    btn.innerHTML = '<span class="btn-icon-left">🚀</span><span>开始演示</span>';
                }, duration[this.selectedScene] || 30000);
            });
        }
    }
    
    bindAIEditor() {
        const styleOptions = document.querySelectorAll('input[name="decision-style"]');
        styleOptions.forEach(opt => {
            opt.addEventListener('change', () => {
                aiAgent.updateConfig({ decisionStyle: opt.value });
            });
        });
        
        const thresholdSlider = document.getElementById('risk-threshold');
        const thresholdValue = document.getElementById('threshold-value');
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', () => {
                thresholdValue.textContent = `${thresholdSlider.value}%`;
                aiAgent.updateConfig({ riskThreshold: parseInt(thresholdSlider.value) });
            });
        }
        
        const priorityOptions = document.querySelectorAll('input[name="priority"]');
        priorityOptions.forEach(opt => {
            opt.addEventListener('change', () => {
                aiAgent.updateConfig({ priority: opt.value });
            });
        });
        
        const capabilityMap = {
            'cap-auto-rth': 'autoRth',
            'cap-auto-avoid': 'autoAvoid',
            'cap-auto-coord': 'autoCoord',
            'cap-smart-schedule': 'smartSchedule'
        };
        
        Object.entries(capabilityMap).forEach(([id, capability]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    aiAgent.setCapability(capability, checkbox.checked);
                    aiAgent.addThinking('decision', 
                        `${checkbox.checked ? '✅' : '❌'} ${capability} ${checkbox.checked ? '已启用' : '已禁用'}`, 
                        null, 90);
                });
            }
        });
    }
    
    bindViewTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    switchView(view) {
        const views = ['map', 'video', 'split'];
        views.forEach(v => {
            const viewEl = document.getElementById(`${v}-view`);
            if (viewEl) {
                viewEl.classList.toggle('active', v === view);
            }
        });
        
        stateManager.setUIState({ currentView: view });
        
        setTimeout(() => {
            if (view === 'map' && this.mapRenderer) {
                this.mapRenderer.resize();
            } else if (view === 'video' && this.videoRenderer) {
                this.videoRenderer.resize();
            } else if (view === 'split') {
                if (this.splitMapRenderer) this.splitMapRenderer.resize();
                if (this.splitVideoRenderer) this.splitVideoRenderer.resize();
            }
        }, 100);
    }
    
    bindDroneList() {
        const addBtn = document.getElementById('btn-add-drone');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const drone = droneManager.createDrone();
                if (drone) {
                    this.updateDroneList();
                } else {
                    aiAgent.addThinking('alert', '⚠️ 已达到最大无人机数量', null, 85);
                }
            });
        }
        
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.drone-card');
            if (card) {
                const droneId = card.dataset.droneId;
                droneManager.selectDrone(droneId);
                this.updateDroneList();
            }
        });
    }
    
    bindControls() {
        const controlBtns = {
            'btn-takeoff': 'takeoff',
            'btn-land': 'land',
            'btn-hover': 'hover',
            'btn-rth': 'rth'
        };
        
        Object.entries(controlBtns).forEach(([btnId, command]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    const selectedDrone = droneManager.getSelectedDrone();
                    if (selectedDrone) {
                        droneManager.sendCommand(selectedDrone.id, command);
                    } else {
                        droneManager.sendCommandToAll(command);
                    }
                });
            }
        });
        
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }
    
    bindMapControls() {
        const zoomInBtn = document.getElementById('btn-zoom-in');
        const zoomOutBtn = document.getElementById('btn-zoom-out');
        const centerBtn = document.getElementById('btn-center');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (this.mapRenderer) this.mapRenderer.zoom(1.2);
                if (this.splitMapRenderer) this.splitMapRenderer.zoom(1.2);
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (this.mapRenderer) this.mapRenderer.zoom(0.8);
                if (this.splitMapRenderer) this.splitMapRenderer.zoom(0.8);
            });
        }
        
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                if (this.mapRenderer) this.mapRenderer.resetView();
                if (this.splitMapRenderer) this.splitMapRenderer.resetView();
            });
        }
        
        const mapCanvas = document.getElementById('map-canvas');
        if (mapCanvas) {
            mapCanvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const factor = e.deltaY > 0 ? 0.9 : 1.1;
                if (this.mapRenderer) this.mapRenderer.zoom(factor);
            });
        }
    }
    
    bindThinkingToggle() {
        const toggleBtns = document.querySelectorAll('.ai-thinking-panel .toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.dataset.mode;
                const streamEl = document.getElementById('thinking-stream');
                const cardsEl = document.getElementById('thinking-cards');
                
                if (streamEl && cardsEl) {
                    streamEl.style.display = mode === 'stream' ? 'block' : 'none';
                    cardsEl.style.display = mode === 'card' ? 'flex' : 'none';
                }
            });
        });
    }
    
    bindStateListeners() {
        stateManager.on('droneUpdate', () => this.updateDroneList());
        stateManager.on('droneAdded', () => this.updateDroneList());
        stateManager.on('droneRemoved', () => this.updateDroneList());
        stateManager.on('aiThinkingAdded', (thinking) => this.addAIThinking(thinking));
    }
    
    updateDroneList() {
        const listEl = document.getElementById('drone-list');
        if (!listEl) return;
        
        const drones = droneManager.getAllDrones();
        const selectedId = stateManager.getState().selectedDroneId;
        
        listEl.innerHTML = drones.map(drone => {
            const state = drone.getState();
            const statusClass = state.status;
            const batteryClass = state.battery < 20 ? 'critical' : state.battery < 40 ? 'low' : '';
            const isSelected = drone.id === selectedId;
            
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
        }).join('');
        
        const connectedEl = document.getElementById('connected-drones');
        if (connectedEl) {
            connectedEl.textContent = `${drones.length}/${CONFIG.MAX_DRONES}`;
        }
    }
    
    getStatusText(status) {
        const map = {
            'active': '活动中',
            'idle': '待命',
            'warning': '警告',
            'emergency': '紧急',
            'offline': '离线'
        };
        return map[status] || status;
    }
    
    addAIThinking(thinking) {
        const streamEl = document.getElementById('thinking-stream');
        const cardsEl = document.getElementById('thinking-cards');
        
        const typeClass = thinking.type;
        const tagText = { perception: '感知', analysis: '分析', decision: '决策', alert: '警告' }[thinking.type] || thinking.type;
        
        if (streamEl) {
            const line = document.createElement('div');
            line.className = `thinking-line ${typeClass}`;
            line.innerHTML = `
                <span class="timestamp">${thinking.time}</span>
                <span class="tag">${tagText}</span>
                <span class="content">${thinking.content}</span>
            `;
            streamEl.insertBefore(line, streamEl.firstChild);
            
            while (streamEl.children.length > 30) {
                streamEl.removeChild(streamEl.lastChild);
            }
        }
        
        if (cardsEl) {
            const iconText = { perception: '👁', analysis: '🧠', decision: '⚡', alert: '⚠' }[thinking.type] || '?';
            const titleText = { perception: '环境感知', analysis: '态势分析', decision: '执行决策', alert: '异常告警' }[thinking.type] || thinking.type;
            
            const card = document.createElement('div');
            card.className = `thinking-card ${typeClass}`;
            card.innerHTML = `
                <div class="thinking-card-header">
                    <div class="thinking-card-icon">${iconText}</div>
                    <span class="thinking-card-title">${titleText}</span>
                    <span class="thinking-card-time">${thinking.time}</span>
                </div>
                <div class="thinking-card-body">
                    <div class="thinking-card-content">${thinking.content}</div>
                </div>
            `;
            cardsEl.insertBefore(card, cardsEl.firstChild);
            
            while (cardsEl.children.length > 20) {
                cardsEl.removeChild(cardsEl.lastChild);
            }
        }
    }
    
    startClock() {
        const updateClock = () => {
            const timeEl = document.getElementById('system-time');
            if (timeEl) {
                timeEl.textContent = Utils.formatTime();
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    render() {
        if (!this.renderersReady) return;
        
        const state = stateManager.getState();
        const drones = droneManager.getAllDrones().map(d => d.getState());
        const waypoints = state.waypoints;
        const selectedDroneId = state.selectedDroneId;
        const currentView = state.ui.currentView || 'map';
        
        switch (currentView) {
            case 'map':
                if (this.mapRenderer) {
                    this.mapRenderer.render(drones, waypoints, selectedDroneId);
                }
                break;
            case 'video':
                const videoDrone = droneManager.getSelectedDrone();
                if (videoDrone && this.videoRenderer) {
                    this.videoRenderer.render(videoDrone.getState());
                    this.updateHUD(videoDrone.getState());
                }
                break;
            case 'split':
                if (this.splitMapRenderer) {
                    this.splitMapRenderer.render(drones, waypoints, selectedDroneId);
                }
                const splitVideoDrone = droneManager.getSelectedDrone();
                if (splitVideoDrone && this.splitVideoRenderer) {
                    this.splitVideoRenderer.render(splitVideoDrone.getState());
                }
                break;
        }
    }
    
    updateHUD(droneState) {
        const hudElements = {
            'hud-alt': droneState.position.z.toFixed(0),
            'hud-spd': droneState.speed.toFixed(1),
            'hud-hdg': droneState.heading.toFixed(0),
            'hud-bat': droneState.battery.toFixed(0),
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
