class App {
    constructor() {
        this.uiController = new UIController();
        this.lastUpdateTime = Date.now();
        this.updateInterval = CONFIG.UPDATE_INTERVAL;
        this.isRunning = false;
    }
    
    init() {
        this.uiController.init();
        
        droneManager.initializeDefaultDrones(3);
        
        sensorSystem.start();
        aiAgent.start();
        
        this.uiController.updateDroneList();
        
        this.start();
        
        console.log('🛸 UAV AI Agent Platform initialized');
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    loop() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
    
    update(deltaTime) {
        const state = stateManager.getState();
        const settings = state.settings;
        const environment = state.environment;
        
        droneManager.update(deltaTime, environment, settings);
    }
    
    render() {
        this.uiController.render();
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
