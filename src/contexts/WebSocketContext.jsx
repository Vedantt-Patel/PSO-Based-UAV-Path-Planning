import { createContext, useContext, useEffect, useState } from "react";
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
            console.log("Received path update:", data);
            if (data && data.path) {
                setPathData({
                    path: data.path,
                    iteration: data.iteration || 0,
                    cost: data.cost || 0,
                    length: data.length || 0,
                });
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
        <WebSocketContext.Provider value={{ socket, isConnected, pathData }}>
            {children}
        </WebSocketContext.Provider>
    );
};
