import React, { useState } from "react";
import Grid from "../components/Grid";
import Controls from "../components/Controls";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useObstacles } from "../hooks/useObstacles";

const BACKEND_URL = "http://localhost:5000";
const GRID_SIZE = 600;

const PathPlanning = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [maxIter, setMaxIter] = useState(100);
    const [popSize, setPopSize] = useState(100);
    const [numControlPoints, setNumControlPoints] = useState(2);
    const { socket, isConnected, pathData, clearPathData, stopOptimization } =
        useWebSocket();
    const {
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
    } = useObstacles();

    const calculatePath = async () => {
        if (!isConnected) {
            console.error("Not connected to WebSocket server");
            return;
        }

        setIsLoading(true);
        try {
            // First initialize the environment
            await fetch(`${BACKEND_URL}/api/init-environment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    width: GRID_SIZE,
                    height: GRID_SIZE,
                    robotRadius: 10,
                    start: [startPos.x, startPos.y],
                    goal: [endPos.x, endPos.y],
                    obstacles: obstacles.map((obs) => ({
                        center: [obs.x, obs.y],
                        radius: obs.radius,
                    })),
                }),
            });

            // Then run the PSO algorithm
            const response = await fetch(`${BACKEND_URL}/api/run-pso`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    maxIter,
                    popSize,
                    numControlPoints,
                    resolution: 50,
                }),
            });

            const data = await response.json();
            if (data.status === "optimization_started") {
                console.log("Path optimization started");
            }
        } catch (error) {
            console.error("Error calculating path:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Comprehensive reset function that handles everything
    const handleReset = async () => {
        // Stop any running optimizations
        await stopOptimization();

        // Clear the path data
        clearPathData();

        // Reset start and end positions
        resetPositions();

        // Clear all obstacles
        clearObstacles();

        // Reset loading state
        setIsLoading(false);

        console.log("Complete reset performed");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            UAV Path Planning
                        </h1>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSettingStart(true)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Set Start
                            </button>
                            <button
                                onClick={() => setIsSettingEnd(true)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Set End
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={calculatePath}
                                disabled={isLoading || !isConnected}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isLoading
                                    ? "Calculating..."
                                    : "Calculate Path"}
                            </button>
                            <button
                                onClick={clearObstacles}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Clear Obstacles
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Iterations
                            </label>
                            <input
                                type="number"
                                min="100"
                                max="5000"
                                value={maxIter}
                                onChange={(e) =>
                                    setMaxIter(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Population Size
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="500"
                                value={popSize}
                                onChange={(e) =>
                                    setPopSize(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Control Points
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={numControlPoints}
                                onChange={(e) =>
                                    setNumControlPoints(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-8">
                        <Grid
                            obstacles={obstacles}
                            selectedObstacle={selectedObstacle}
                            path={pathData.path}
                            startPos={startPos}
                            endPos={endPos}
                            isSettingStart={isSettingStart}
                            isSettingEnd={isSettingEnd}
                            onStageClick={handleStageClick}
                            onObstacleClick={handleObstacleClick}
                        />
                        <Controls
                            selectedObstacle={selectedObstacle}
                            obstacles={obstacles}
                            isLoading={isLoading}
                            pathData={pathData}
                            onDeleteObstacle={handleDeleteObstacle}
                            onRadiusChange={handleRadiusChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PathPlanning;
