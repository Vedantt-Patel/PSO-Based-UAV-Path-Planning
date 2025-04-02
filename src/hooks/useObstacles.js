import { useState, useCallback } from "react";

const GRID_SIZE = 600;
const MIN_RADIUS = 20;
const MAX_RADIUS = 100;
const SAFE_DISTANCE = 30; 
const DEFAULT_START = { x: 50, y: GRID_SIZE / 2 };
const DEFAULT_END = { x: GRID_SIZE - 50, y: GRID_SIZE / 2 };

export const useObstacles = () => {
    const [obstacles, setObstacles] = useState([]);
    const [selectedObstacle, setSelectedObstacle] = useState(null);
    const [startPos, setStartPos] = useState(DEFAULT_START);
    const [endPos, setEndPos] = useState(DEFAULT_END);
    const [isSettingStart, setIsSettingStart] = useState(false);
    const [isSettingEnd, setIsSettingEnd] = useState(false);

    const isOverlapping = useCallback((x, y, radius, existingObstacles) => {
        return existingObstacles.some((obs) => {
            const dx = x - obs.x;
            const dy = y - obs.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < radius + obs.radius + 10; 
        });
    }, []);

    const isNearStartOrEnd = useCallback(
        (x, y, radius) => {
            const startDist = Math.sqrt(
                Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
            );
            const endDist = Math.sqrt(
                Math.pow(x - endPos.x, 2) + Math.pow(y - endPos.y, 2)
            );
            return (
                startDist < SAFE_DISTANCE + radius ||
                endDist < SAFE_DISTANCE + radius
            );
        },
        [startPos, endPos]
    );

    const isOutOfBounds = useCallback((x, y, radius) => {
        return (
            x - radius < 0 ||
            x + radius > GRID_SIZE ||
            y - radius < 0 ||
            y + radius > GRID_SIZE
        );
    }, []);

    const handleStageClick = useCallback(
        (e) => {
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();

            if (!pos) return;

            if (isSettingStart) {
                setStartPos({ x: pos.x, y: pos.y });
                setIsSettingStart(false);
                return;
            }
            if (isSettingEnd) {
                setEndPos({ x: pos.x, y: pos.y });
                setIsSettingEnd(false);
                return;
            }

            const clickedOnObstacle = e.target !== stage;
            if (clickedOnObstacle) {
                return;
            }

            if (isOutOfBounds(pos.x, pos.y, MIN_RADIUS)) {
                console.warn("Position out of bounds");
                return;
            }

            if (isNearStartOrEnd(pos.x, pos.y, MIN_RADIUS)) {
                console.warn("Too close to start/end points");
                return;
            }

            let radius = MIN_RADIUS;
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
                if (!isOverlapping(pos.x, pos.y, radius, obstacles)) {
                    const newObstacle = {
                        id: Math.random().toString(36).substr(2, 9),
                        x: pos.x,
                        y: pos.y,
                        radius: radius,
                    };
                    setObstacles((prev) => [...prev, newObstacle]);
                    return;
                }
                radius = Math.min(radius + 10, MAX_RADIUS);
                attempts++;
            }
        },
        [
            obstacles,
            isOverlapping,
            isNearStartOrEnd,
            isOutOfBounds,
            isSettingStart,
            isSettingEnd,
        ]
    );

    const handleRadiusChange = useCallback(
        (e) => {
            if (!selectedObstacle) return;

            const newRadius = Number(e.target.value);
            const selectedObs = obstacles.find(
                (o) => o.id === selectedObstacle
            );
            if (!selectedObs) return;

            if (isOutOfBounds(selectedObs.x, selectedObs.y, newRadius)) {
                console.warn("New radius would place obstacle out of bounds");
                return;
            }

            if (isNearStartOrEnd(selectedObs.x, selectedObs.y, newRadius)) {
                console.warn(
                    "New radius would place obstacle too close to start/end points"
                );
                return;
            }

            const otherObstacles = obstacles.filter(
                (o) => o.id !== selectedObstacle
            );
            if (
                !isOverlapping(
                    selectedObs.x,
                    selectedObs.y,
                    newRadius,
                    otherObstacles
                )
            ) {
                setObstacles((prev) =>
                    prev.map((obs) =>
                        obs.id === selectedObstacle
                            ? { ...obs, radius: newRadius }
                            : obs
                    )
                );
            }
        },
        [
            selectedObstacle,
            obstacles,
            isOverlapping,
            isNearStartOrEnd,
            isOutOfBounds,
        ]
    );

    const handleObstacleClick = useCallback((e, id) => {
        e.cancelBubble = true; 
        setSelectedObstacle(id);
    }, []);

    const handleDeleteObstacle = useCallback(() => {
        if (selectedObstacle) {
            setObstacles((prev) =>
                prev.filter((obs) => obs.id !== selectedObstacle)
            );
            setSelectedObstacle(null);
        }
    }, [selectedObstacle]);

    const clearObstacles = useCallback(() => {
        setObstacles([]);
        setSelectedObstacle(null);
    }, []);

    const resetPositions = useCallback(() => {
        setStartPos(DEFAULT_START);
        setEndPos(DEFAULT_END);
    }, []);

    return {
        obstacles,
        selectedObstacle,
        startPos,
        endPos,
        isSettingStart,
        isSettingEnd,
        handleStageClick,
        handleRadiusChange,
        handleObstacleClick,
        handleDeleteObstacle,
        clearObstacles,
        setIsSettingStart,
        setIsSettingEnd,
        resetPositions,
    };
};
