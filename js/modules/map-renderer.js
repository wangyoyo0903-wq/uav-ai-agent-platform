class MapRenderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        
        this.width = 800;
        this.height = 600;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.is3D = false;
        
        this.noFlyZones = [];
        this.obstacles = [];
        this.waypoints = [];
        
        this.gridSize = 50;
        this.showGrid = true;
        this.showTrajectories = true;
        
        this.colors = CONFIG.COLORS;
        this.initialized = false;
        
        this.generateEnvironment();
    }
    
    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) {
            console.warn(`Canvas ${this.canvasId} not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.initialized = true;
        this.resize();
    }
    
    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.centerX = this.width / 2;
            this.centerY = this.height / 2;
        }
    }
    
    generateEnvironment() {
        this.noFlyZones = [
            { x: 150, y: 100, radius: 50, name: '机场' },
            { x: -200, y: -150, radius: 40, name: '军事区' },
            { x: 50, y: -200, radius: 35, name: '敏感区域' }
        ];
        
        this.obstacles = [
            { x: 100, y: 50, z: 80, radius: 15, height: 80, type: 'building' },
            { x: -100, y: 100, z: 60, radius: 10, height: 60, type: 'tower' },
            { x: 50, y: -50, z: 40, radius: 8, height: 40, type: 'building' }
        ];
    }
    
    clear() {
        if (!this.ctx) return;
        this.ctx.fillStyle = this.colors.BG_PRIMARY;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    render(drones, waypoints = [], selectedDroneId = null) {
        if (!this.initialized || !this.ctx) {
            this.init();
            if (!this.ctx) return;
        }
        
        if (this.width <= 0 || this.height <= 0) {
            this.resize();
            if (this.width <= 0 || this.height <= 0) return;
        }
        
        this.clear();
        
        if (this.showGrid) {
            this.drawGrid();
        }
        
        this.drawNoFlyZones();
        this.drawObstacles();
        
        if (this.showTrajectories && drones) {
            drones.forEach(drone => this.drawTrajectory(drone));
        }
        
        this.drawWaypoints(waypoints || []);
        
        if (drones) {
            drones.forEach(drone => {
                this.drawDrone(drone, drone.id === selectedDroneId);
            });
        }
        
        this.drawBaseStation();
        this.drawCompass();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridSpacing = this.gridSize * this.scale;
        const startX = this.centerX + this.offset.x;
        const startY = this.centerY + this.offset.y;
        
        for (let x = startX % gridSpacing; x < this.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        for (let y = startY % gridSpacing; y < this.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.centerX + this.offset.x, 0);
        ctx.lineTo(this.centerX + this.offset.x, this.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, this.centerY + this.offset.y);
        ctx.lineTo(this.width, this.centerY + this.offset.y);
        ctx.stroke();
    }
    
    drawNoFlyZones() {
        const ctx = this.ctx;
        
        this.noFlyZones.forEach(zone => {
            const screenX = this.centerX + zone.x * this.scale + this.offset.x;
            const screenY = this.centerY - zone.y * this.scale + this.offset.y;
            const screenRadius = zone.radius * this.scale;
            
            ctx.fillStyle = 'rgba(255, 59, 48, 0.15)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 59, 48, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = this.colors.DANGER;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, screenX, screenY);
        });
    }
    
    drawObstacles() {
        const ctx = this.ctx;
        
        this.obstacles.forEach(obstacle => {
            const screenX = this.centerX + obstacle.x * this.scale + this.offset.x;
            const screenY = this.centerY - obstacle.y * this.scale + this.offset.y;
            const screenRadius = obstacle.radius * this.scale;
            
            ctx.fillStyle = 'rgba(255, 149, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = this.colors.WARNING;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = this.colors.TEXT_MUTED;
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${obstacle.height}m`, screenX, screenY + 3);
        });
    }
    
    drawTrajectory(drone) {
        if (!drone || !drone.trajectory || drone.trajectory.length < 2) return;
        
        const ctx = this.ctx;
        const trajectory = drone.trajectory;
        
        ctx.beginPath();
        
        for (let i = 0; i < trajectory.length; i++) {
            const point = trajectory[i];
            const screenX = this.centerX + point.x * this.scale + this.offset.x;
            const screenY = this.centerY - point.y * this.scale + this.offset.y;
            
            if (i === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        }
        
        const alpha = 0.3 + (drone.status === 'active' ? 0.2 : 0);
        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawDrone(drone, isSelected) {
        if (!drone || !drone.position) return;
        
        const ctx = this.ctx;
        const screenX = this.centerX + drone.position.x * this.scale + this.offset.x;
        const screenY = this.centerY - drone.position.y * this.scale + this.offset.y;
        
        const size = 12 * this.scale;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(-Utils.degToRad(drone.heading || 0));
        
        let color;
        switch (drone.status) {
            case CONFIG.DRONE_STATUS.ACTIVE:
                color = this.colors.SUCCESS;
                break;
            case CONFIG.DRONE_STATUS.WARNING:
                color = this.colors.WARNING;
                break;
            case CONFIG.DRONE_STATUS.EMERGENCY:
                color = this.colors.DANGER;
                break;
            default:
                color = this.colors.PRIMARY;
        }
        
        if (isSelected) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.7, size * 0.7);
        ctx.lineTo(0, size * 0.3);
        ctx.lineTo(size * 0.7, size * 0.7);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        
        if (isSelected) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = this.colors.TEXT_PRIMARY;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(drone.id || 'UAV', screenX, screenY - size - 8);
        
        ctx.fillStyle = this.colors.TEXT_MUTED;
        ctx.font = '9px monospace';
        ctx.fillText(`${(drone.position.z || 0).toFixed(0)}m`, screenX, screenY + size + 12);
    }
    
    drawWaypoints(waypoints) {
        const ctx = this.ctx;
        
        waypoints.forEach((wp, index) => {
            const screenX = this.centerX + wp.x * this.scale + this.offset.x;
            const screenY = this.centerY - wp.y * this.scale + this.offset.y;
            
            ctx.fillStyle = this.colors.WARNING;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = this.colors.BG_PRIMARY;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, screenX, screenY);
        });
        
        if (waypoints.length > 1) {
            ctx.strokeStyle = 'rgba(255, 149, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            waypoints.forEach((wp, index) => {
                const screenX = this.centerX + wp.x * this.scale + this.offset.x;
                const screenY = this.centerY - wp.y * this.scale + this.offset.y;
                
                if (index === 0) {
                    ctx.moveTo(screenX, screenY);
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            });
            
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawBaseStation() {
        const ctx = this.ctx;
        const screenX = this.centerX + this.offset.x;
        const screenY = this.centerY + this.offset.y;
        
        ctx.fillStyle = this.colors.PURPLE;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - 10);
        ctx.lineTo(screenX - 8, screenY + 5);
        ctx.lineTo(screenX + 8, screenY + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.colors.PURPLE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = this.colors.TEXT_MUTED;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('基站', screenX, screenY + 25);
    }
    
    drawCompass() {
        const ctx = this.ctx;
        const compassX = this.width - 50;
        const compassY = 50;
        const radius = 30;
        
        ctx.fillStyle = 'rgba(10, 15, 26, 0.8)';
        ctx.beginPath();
        ctx.arc(compassX, compassY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.colors.PRIMARY;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = this.colors.DANGER;
        ctx.beginPath();
        ctx.moveTo(compassX, compassY - radius + 5);
        ctx.lineTo(compassX - 5, compassY - radius + 15);
        ctx.lineTo(compassX + 5, compassY - radius + 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = this.colors.TEXT_PRIMARY;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', compassX, compassY - radius + 22);
        
        ctx.fillStyle = this.colors.TEXT_MUTED;
        ctx.font = '9px sans-serif';
        ctx.fillText('S', compassX, compassY + radius - 10);
        ctx.fillText('E', compassX + radius - 10, compassY);
        ctx.fillText('W', compassX - radius + 10, compassY);
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.centerX - this.offset.x) / this.scale,
            y: -(screenY - this.centerY - this.offset.y) / this.scale
        };
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: this.centerX + worldX * this.scale + this.offset.x,
            y: this.centerY - worldY * this.scale + this.offset.y
        };
    }
    
    zoom(factor) {
        this.scale = Utils.clamp(this.scale * factor, 0.5, 3);
    }
    
    pan(dx, dy) {
        this.offset.x += dx;
        this.offset.y += dy;
    }
    
    centerOn(x, y) {
        this.offset.x = -x * this.scale;
        this.offset.y = y * this.scale;
    }
    
    resetView() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
    }
    
    toggle3D() {
        this.is3D = !this.is3D;
        return this.is3D;
    }
    
    setWaypoints(waypoints) {
        this.waypoints = waypoints;
    }
}

class VideoRenderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.frame = 0;
        this.initialized = false;
    }
    
    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) {
            console.warn(`Canvas ${this.canvasId} not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.initialized = true;
        this.resize();
    }
    
    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }
    }
    
    render(drone) {
        if (!this.initialized || !this.ctx) {
            this.init();
            if (!this.ctx) return;
        }
        
        if (this.width <= 0 || this.height <= 0) {
            this.resize();
            if (this.width <= 0 || this.height <= 0) return;
        }
        
        this.frame++;
        this.drawBackground();
        this.drawNoise();
        this.drawScanlines();
        
        if (drone) {
            this.drawOverlay(drone);
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 20; i++) {
            const y = (this.frame * 0.5 + i * this.height / 20) % this.height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }
    
    drawNoise() {
        if (this.width <= 0 || this.height <= 0) return;
        
        const ctx = this.ctx;
        const imageData = ctx.getImageData(0, 0, Math.max(1, this.width), Math.max(1, this.height));
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 10 - 5;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    drawScanlines() {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        for (let y = 0; y < this.height; y += 2) {
            ctx.fillRect(0, y, this.width, 1);
        }
    }
    
    drawOverlay(drone) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - 40, centerY);
        ctx.lineTo(centerX - 20, centerY);
        ctx.moveTo(centerX + 20, centerY);
        ctx.lineTo(centerX + 40, centerY);
        ctx.moveTo(centerX, centerY - 40);
        ctx.lineTo(centerX, centerY - 20);
        ctx.moveTo(centerX, centerY + 20);
        ctx.lineTo(centerX, centerY + 40);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.strokeRect(50, 50, this.width - 100, this.height - 100);
        
        const corners = [
            [50, 50], [this.width - 50, 50],
            [50, this.height - 50], [this.width - 50, this.height - 50]
        ];
        
        corners.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (x < centerX ? 20 : -20), y);
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + (y < centerY ? 20 : -20));
            ctx.stroke();
        });
    }
}
