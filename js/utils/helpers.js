const Utils = {
    formatTime(date = new Date()) {
        return date.toTimeString().split(' ')[0];
    },
    
    formatDateTime(date = new Date()) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },
    
    formatCoord(value) {
        return Math.abs(value).toFixed(6) + (value >= 0 ? 'N' : 'S');
    },
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    distance3D(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2) + 
            Math.pow(z2 - z1, 2)
        );
    },
    
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    },
    
    normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    },
    
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },
    
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },
    
    generateDroneId(index) {
        return `UAV-${String(index).padStart(2, '0')}`;
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    formatTemplate(template, values) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return values[key] !== undefined ? values[key] : match;
        });
    },
    
    calculateBatteryTime(battery, drainRate) {
        const minutes = (battery / 100) / drainRate * 60;
        return Math.floor(minutes);
    },
    
    calculateETA(distance, speed) {
        if (speed <= 0) return Infinity;
        return Math.ceil(distance / speed);
    },
    
    calculateRiskLevel(drone, environment) {
        let risk = 0;
        
        if (drone.battery < 20) risk += 30;
        else if (drone.battery < 40) risk += 15;
        
        if (environment.windSpeed > 15) risk += 25;
        else if (environment.windSpeed > 10) risk += 10;
        
        if (drone.signal < 50) risk += 20;
        else if (drone.signal < 70) risk += 10;
        
        if (drone.gpsAccuracy > 5) risk += 15;
        
        return Math.min(risk, 100);
    },
    
    getRiskLevelText(risk) {
        if (risk < 20) return '低';
        if (risk < 50) return '中';
        if (risk < 75) return '高';
        return '极高';
    },
    
    smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
};
