import { WebSocketProvider } from "./contexts/WebSocketContext";
import PathPlanning from "./pages/PathPlanning";

function App() {
    return (
        <WebSocketProvider>
            <PathPlanning />
        </WebSocketProvider>
    );
}

export default App;