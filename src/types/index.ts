export interface Obstacle {
    id: string;
    x: number;
    y: number;
    radius: number;
}

export interface PathPoint {
    x: number;
    y: number;
}

export interface EnvironmentConfig {
    width: number;
    height: number;
    robotRadius: number;
    start: [number, number];
    goal: [number, number];
}

export interface PSOConfig {
    maxIter: number;
    popSize: number;
    numControlPoints: number;
    resolution: number;
}
