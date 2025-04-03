import React from "react";

const MIN_RADIUS = 20;
const MAX_RADIUS = 100;

const Controls = ({
    selectedObstacle,
    obstacles,
    isLoading,
    pathData,
    onDeleteObstacle,
    onRadiusChange,
}) => {
    const selectedObstacleData = obstacles.find(
        (o) => o.id === selectedObstacle
    );

    return (
        <div className="w-64">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Controls</h2>

                {/* Real-time Path Update Indicator */}
                {pathData && pathData.path && pathData.path.length > 0 && (
                    <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-700 mb-2">
                            Real-time Updates
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-600">
                                    Current Iteration:
                                </span>
                                <span className="font-medium">
                                    {pathData.iteration}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Obstacle Management Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">
                                Obstacles ({obstacles.length})
                            </p>
                            {selectedObstacle && (
                                <span className="text-xs text-gray-500">
                                    Selected: #
                                    {obstacles.findIndex(
                                        (o) => o.id === selectedObstacle
                                    ) + 1}
                                </span>
                            )}
                        </div>

                        {selectedObstacle && selectedObstacleData && (
                            <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={onDeleteObstacle}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                                    >
                                        Delete Obstacle
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        ID: {selectedObstacle.slice(0, 6)}...
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-gray-700">
                                            Radius:{" "}
                                            {selectedObstacleData.radius}px
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {Math.round(
                                                (selectedObstacleData.radius /
                                                    MAX_RADIUS) *
                                                    100
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={MIN_RADIUS}
                                        max={MAX_RADIUS}
                                        value={selectedObstacleData.radius}
                                        onChange={onRadiusChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="text-xs text-gray-500">
                                    <p>
                                        Position: (
                                        {Math.round(selectedObstacleData.x)},{" "}
                                        {Math.round(selectedObstacleData.y)})
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Path Information Section */}
                    {pathData && pathData.path && pathData.path.length > 0 && (
                        <div className="mt-4 bg-white p-3 rounded border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Path Information
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Iteration:
                                    </span>
                                    <span className="font-medium">
                                        {pathData.iteration}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Total Cost:
                                    </span>
                                    <span className="font-medium">
                                        {pathData.cost.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Path Length:
                                    </span>
                                    <span className="font-medium">
                                        {pathData.length.toFixed(2)}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Path Points:</span>
                                        <span>{pathData.path.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Avg. Segment Length:</span>
                                        <span>
                                            {(
                                                pathData.length /
                                                (pathData.path.length - 1)
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Controls;
