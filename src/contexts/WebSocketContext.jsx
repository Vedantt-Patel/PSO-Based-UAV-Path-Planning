import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [pathData, setPathData] = useState({
        path: [],
        iteration: 0,
        cost: 0,
        length: 0,
    });

    // Keep track of last update time for debugging
    const lastUpdateRef = useRef(Date.now());
    const updateCountRef = useRef(0);

    // Function to clear the path data
    const clearPathData = () => {
        setPathData({
            path: [],
            iteration: 0,
            cost: 0,
            length: 0,
        });
        updateCountRef.current = 0;
    };

    // Function to stop the current optimization
    const stopOptimization = async () => {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/stop-optimization`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const data = await response.json();
            console.log("Optimization stopped:", data);
        } catch (error) {
            console.error("Error stopping optimization:", error);
        }
    };

    useEffect(() => {
        const newSocket = io(BACKEND_URL, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true,
            autoConnect: true,
        });

        newSocket.on("connect", () => {
            console.log("Connected to WebSocket server");
            setIsConnected(true);
            // Reset counters on new connection
            updateCountRef.current = 0;
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from WebSocket server");
            setIsConnected(false);
        });

        newSocket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error);
            setIsConnected(false);
        });

        newSocket.on("error", (error) => {
            console.error("Socket error:", error);
            setIsConnected(false);
        });

        newSocket.on("path_update", (data) => {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateRef.current;
            updateCountRef.current += 1;

            console.log(
                `[Update #${updateCountRef.current}] Received path update at iteration ${data.iteration} (${timeSinceLastUpdate}ms since last update)`,
                data
            );

            if (data && Array.isArray(data.path)) {
                setPathData((prev) => {
                    // Only update if this is a new iteration or first path
                    if (
                        data.iteration > prev.iteration ||
                        prev.path.length === 0
                    ) {
                        console.log(
                            `Updating path data to iteration ${data.iteration}`
                        );
                        lastUpdateRef.current = now;
                        return {
                            path: data.path,
                            iteration: data.iteration || 0,
                            cost: data.cost || 0,
                            length: data.length || 0,
                        };
                    }
                    console.log(
                        `Ignoring older path update (current: ${prev.iteration}, received: ${data.iteration})`
                    );
                    return prev;
                });
            } else {
                console.error("Invalid path data received:", data);
            }
        });

        newSocket.on("optimization_error", (data) => {
            console.error("Optimization error:", data.message);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket.connected) {
                newSocket.disconnect();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider
            value={{
                socket,
                isConnected,
                pathData,
                clearPathData,
                stopOptimization,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};
