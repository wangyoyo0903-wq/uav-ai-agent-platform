const CONFIG = {
    MAX_DRONES: 5,
    UPDATE_INTERVAL: 50,
    AI_DECISION_INTERVAL: 1000,
    MAP_SCALE: 10,
    WORLD_SIZE: 1000,
    
    PHYSICS: {
        MAX_SPEED: 30,
        MAX_ACCELERATION: 5,
        MAX_ALTITUDE: 500,
        MIN_ALTITUDE: 10,
        CLIMB_RATE: 5,
        DESCENT_RATE: 3,
        TURN_RATE: 45,
        BATTERY_DRAIN_RATE: 0.01,
        WIND_INFLUENCE: 0.3
    },
    
    DRONE_TYPES: {
        SCOUT: { name: '侦察型', maxSpeed: 25, maxAltitude: 300, batteryCapacity: 3000 },
        CARGO: { name: '货运型', maxSpeed: 15, maxAltitude: 200, batteryCapacity: 5000 },
        SURVEY: { name: '测绘型', maxSpeed: 20, maxAltitude: 400, batteryCapacity: 4000 },
        RESCUE: { name: '救援型', maxSpeed: 30, maxAltitude: 350, batteryCapacity: 4500 }
    },
    
    FLIGHT_MODES: {
        IDLE: 'idle',
        TAKEOFF: 'takeoff',
        HOVER: 'hover',
        CRUISE: 'cruise',
        LANDING: 'landing',
        RTH: 'rth',
        MISSION: 'mission',
        EMERGENCY: 'emergency'
    },
    
    DRONE_STATUS: {
        OFFLINE: 'offline',
        IDLE: 'idle',
        ACTIVE: 'active',
        WARNING: 'warning',
        EMERGENCY: 'emergency'
    },
    
    AI_THINKING_TYPES: {
        PERCEPTION: 'perception',
        ANALYSIS: 'analysis',
        DECISION: 'decision',
        ALERT: 'alert'
    },
    
    LOG_LEVELS: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },
    
    MISSION_TYPES: {
        PATROL: 'patrol',
        TRACKING: 'tracking',
        MAPPING: 'mapping',
        SEARCH: 'search'
    },
    
    COLORS: {
        PRIMARY: '#00d4ff',
        SUCCESS: '#00ff88',
        WARNING: '#ff9500',
        DANGER: '#ff3b30',
        PURPLE: '#a855f7',
        BG_PRIMARY: '#0a0f1a',
        BG_SECONDARY: '#0d1421',
        BG_TERTIARY: '#111827',
        TEXT_PRIMARY: '#ffffff',
        TEXT_SECONDARY: '#a0aec0',
        TEXT_MUTED: '#6b7280'
    }
};

const AI_DECISION_TEMPLATES = {
    perception: [
        '检测到环境风速 {wind} m/s，风向 {windDir}°',
        '当前高度 {altitude}m，速度 {speed} m/s',
        '前方 {distance}m 处检测到障碍物',
        'GPS信号强度 {signal}%，定位精度 {gps}m',
        '电量剩余 {battery}%，预计续航 {flightTime} 分钟',
        '目标位置距离 {targetDistance}m，预计到达时间 {eta} 秒',
        '检测到附近有 {droneCount} 架无人机活动',
        '气象传感器报告：温度 {temp}°C，湿度 {humidity}%'
    ],
    analysis: [
        '分析飞行路径安全性：风险等级 {riskLevel}',
        '计算最优航线，考虑风向影响后调整航向 {heading}°',
        '电量消耗预测：当前任务需消耗 {powerNeed}%，剩余电量充足',
        '障碍物规避分析：建议 {action}',
        '多机协同分析：与 UAV-{droneId} 保持安全距离 {safeDistance}m',
        '气象条件评估：当前条件 {condition}，适合飞行',
        '任务进度分析：已完成 {progress}%，预计剩余时间 {remainingTime} 分钟'
    ],
    decision: [
        '执行指令：{command}，目标参数：{params}',
        '调整飞行姿态：俯仰 {pitch}°，横滚 {roll}°',
        '启动自动避障程序，绕行距离 {detourDistance}m',
        '切换飞行模式至 {mode}',
        '发送位置报告至控制中心',
        '请求 UAV-{droneId} 协助执行任务',
        '开始执行任务序列 #{missionId}'
    ],
    alert: [
        '警告：电量低于 {threshold}%，建议返航',
        '警报：检测到禁飞区，正在重新规划航线',
        '警告：信号强度下降至 {signal}%，可能丢失连接',
        '警报：与 UAV-{droneId} 距离过近，执行规避机动',
        '警告：风速超过安全阈值，建议降低飞行高度',
        '警报：GPS定位异常，切换至惯性导航模式',
        '紧急：检测到系统故障，启动应急程序'
    ]
};

const MISSION_NAMES = {
    patrol: '区域巡检',
    tracking: '目标跟踪',
    mapping: '测绘任务',
    search: '搜救任务'
};
