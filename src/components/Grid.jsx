import React, { useState, useEffect } from "react";
import { Stage, Layer, Circle, Line, Group } from "react-konva";

const GRID_SIZE = 600;

const Grid = ({
    obstacles,
    selectedObstacle,
    path,
    startPos,
    endPos,
    isSettingStart,
    isSettingEnd,
    onStageClick,
    onObstacleClick,
}) => {
    const [hoveredObstacle, setHoveredObstacle] = useState(null);
    const [pathKey, setPathKey] = useState(0); // Add key to force re-render
    const [flashPath, setFlashPath] = useState(false);

    // Update path key and flash effect when path changes
    useEffect(() => {
        if (path && path.length > 0) {
            setPathKey((prev) => prev + 1);
            setFlashPath(true);
            const timer = setTimeout(() => {
                setFlashPath(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [path]);

    const handleStageClick = (e) => {
        // Only handle clicks directly on the stage
        if (e.target === e.target.getStage()) {
            onStageClick(e);
        }
    };

    // Calculate a key for the path that changes when the path data changes
    const getPathSignature = () => {
        if (!path || path.length === 0) return "empty";
        const firstPoint = path[0];
        const lastPoint = path[path.length - 1];
        return `${path.length}-${firstPoint.x.toFixed(
            2
        )}-${firstPoint.y.toFixed(2)}-${lastPoint.x.toFixed(
            2
        )}-${lastPoint.y.toFixed(2)}`;
    };

    return (
        <div className="flex-1 border border-gray-200 rounded relative">
            <Stage
                width={GRID_SIZE}
                height={GRID_SIZE}
                onClick={handleStageClick}
                className={`bg-gray-50 ${
                    isSettingStart
                        ? "cursor-pointer"
                        : isSettingEnd
                        ? "cursor-pointer"
                        : "cursor-crosshair"
                }`}
            >
                <Layer>
                    {/* Grid lines */}
                    {Array.from({
                        length: GRID_SIZE / 50 + 1,
                    }).map((_, i) => (
                        <React.Fragment key={i}>
                            <Line
                                points={[i * 50, 0, i * 50, GRID_SIZE]}
                                stroke="#ddd"
                                strokeWidth={1}
                            />
                            <Line
                                points={[0, i * 50, GRID_SIZE, i * 50]}
                                stroke="#ddd"
                                strokeWidth={1}
                            />
                        </React.Fragment>
                    ))}

                    {/* Obstacles */}
                    {obstacles.map((obstacle) => (
                        <Group key={obstacle.id}>
                            <Circle
                                x={obstacle.x}
                                y={obstacle.y}
                                radius={obstacle.radius}
                                fill={
                                    selectedObstacle === obstacle.id
                                        ? "#9fb4ff"
                                        : hoveredObstacle === obstacle.id
                                        ? "#e5e7eb"
                                        : "#d1d5db"
                                }
                                opacity={0.6}
                                onClick={(e) => onObstacleClick(e, obstacle.id)}
                                onMouseEnter={() =>
                                    setHoveredObstacle(obstacle.id)
                                }
                                onMouseLeave={() => setHoveredObstacle(null)}
                                stroke={
                                    selectedObstacle === obstacle.id
                                        ? "#4f46e5"
                                        : "#9ca3af"
                                }
                                strokeWidth={2}
                            />
                            {/* Show radius indicator for selected obstacle */}
                            {selectedObstacle === obstacle.id && (
                                <Circle
                                    x={obstacle.x}
                                    y={obstacle.y}
                                    radius={obstacle.radius}
                                    stroke="#4f46e5"
                                    strokeWidth={1}
                                    dash={[5, 5]}
                                />
                            )}
                        </Group>
                    ))}

                    {/* Path */}
                    {path && path.length > 0 && (
                        <Line
                            key={`path-${pathKey}-${getPathSignature()}`}
                            points={path
                                .flatMap((point) => {
                                    if (
                                        !point ||
                                        typeof point.x !== "number" ||
                                        typeof point.y !== "number"
                                    ) {
                                        return [];
                                    }
                                    return [point.x, point.y];
                                })
                                .filter((point) => point !== undefined)}
                            stroke={flashPath ? "#6366f1" : "#4f46e5"}
                            strokeWidth={flashPath ? 3 : 2}
                            tension={0.3}
                            lineCap="round"
                            lineJoin="round"
                            shadowColor={flashPath ? "#6366f1" : "transparent"}
                            shadowBlur={flashPath ? 5 : 0}
                            shadowOpacity={0.5}
                        />
                    )}

                    {/* Start and End points */}
                    <Group>
                        <Circle
                            x={startPos.x}
                            y={startPos.y}
                            radius={10}
                            fill="#22c55e"
                            stroke={isSettingStart ? "#15803d" : "#15803d"}
                            strokeWidth={isSettingStart ? 3 : 2}
                        />
                        <Circle
                            x={endPos.x}
                            y={endPos.y}
                            radius={10}
                            fill="#ef4444"
                            stroke={isSettingEnd ? "#b91c1c" : "#b91c1c"}
                            strokeWidth={isSettingEnd ? 3 : 2}
                        />
                    </Group>
                </Layer>
            </Stage>
            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded text-sm text-gray-600">
                {isSettingStart
                    ? "Click to set start position"
                    : isSettingEnd
                    ? "Click to set end position"
                    : "Click anywhere to place obstacles • Click obstacle to select • Drag slider to resize"}
            </div>

            {/* Display current iteration */}
            {path && path.length > 0 && (
                <div className="absolute top-4 right-4 bg-blue-50 p-2 rounded text-sm font-semibold border border-blue-200 shadow-sm animate-pulse">
                    <span className="text-blue-700">
                        Real-time path updates
                    </span>
                </div>
            )}
        </div>
    );
};

export default Grid;
