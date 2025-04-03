from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import numpy as np
from path_planning.environment import Environment
from path_planning.solution import SplinePath
from pso import PSO
import path_planning as pp
import threading
import logging
import eventlet
eventlet.monkey_patch()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, 
                   cors_allowed_origins="*",
                   async_mode='eventlet',
                   logger=True,
                   engineio_logger=True,
                   ping_timeout=60,
                   ping_interval=25)

env = None
current_optimization = None
optimization_lock = threading.Lock()

def stop_current_optimization():
    global current_optimization
    with optimization_lock:
        if current_optimization and current_optimization.is_alive():
            logger.info("Stopping current optimization...")
            current_optimization.join(timeout=1.0)
        current_optimization = None

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')
    stop_current_optimization()

@app.route('/api/init-environment', methods=['POST'])
def init_environment():
    try:
        data = request.json
        global env
        
        env_params = {
            'width': data.get('width', 100),
            'height': data.get('height', 100),
            'robot_radius': data.get('robotRadius', 1),
            'start': np.array(data.get('start', [5, 5])),
            'goal': np.array(data.get('goal', [95, 95]))
        }
        
        env = Environment(**env_params)
        
        env.clear_obstacles()
        
        for obs in data.get('obstacles', []):
            env.add_obstacle(pp.Obstacle(
                center=np.array(obs['center']),
                radius=obs['radius']
            ))
        
        logger.info(f'Environment initialized with {len(env.obstacles)} obstacles')
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f'Error initializing environment: {str(e)}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

def run_pso_optimization(problem, pso_params):
    try:
        def callback(data):
            try:
                sol = data['gbest']['details']['sol']
                path = sol.get_path().tolist()
                
                path_length = 0
                for i in range(len(path) - 1):
                    path_length += np.linalg.norm(np.array(path[i+1]) - np.array(path[i]))
                
                total_cost = float(data['gbest']['cost'])
                
                formatted_path = []
                for point in path:
                    formatted_path.append({
                        'x': float(point[0]),
                        'y': float(point[1])
                    })
                
                socketio.emit('path_update', {
                    'iteration': int(data['it']),
                    'path': formatted_path,
                    'cost': total_cost,
                    'length': float(path_length),
                    'details': {
                        'violations': int(data['gbest']['details'].get('violations', 0)),
                        'collisions': int(data['gbest']['details'].get('collision_violation_count', 0))
                    }
                })
                
          
                socketio.sleep(0.01)
                
                logger.info(f"Iteration {data['it']}: Cost = {total_cost:.2f}, Length = {path_length:.2f}")
            except Exception as e:
                logger.error(f'Error in PSO callback: {str(e)}')
        
        bestsol, _ = PSO(problem, callback=callback, **pso_params)
        
        if bestsol:
            sol = bestsol['details']['sol']
            path = sol.get_path().tolist()
            path_length = 0
            for i in range(len(path) - 1):
                path_length += np.linalg.norm(np.array(path[i+1]) - np.array(path[i]))
            
            formatted_path = []
            for point in path:
                formatted_path.append({
                    'x': float(point[0]),
                    'y': float(point[1])
                })
            
            socketio.emit('path_update', {
                'iteration': pso_params['max_iter'],
                'path': formatted_path,
                'cost': float(bestsol['cost']),
                'length': float(path_length),
                'details': {
                    'violations': int(bestsol['details'].get('violations', 0)),
                    'collisions': int(bestsol['details'].get('collision_violation_count', 0))
                }
            })
            
     
            socketio.sleep(0.01)
        
        return bestsol
    except Exception as e:
        logger.error(f'Error in PSO optimization: {str(e)}')
        socketio.emit('optimization_error', {'message': str(e)})
        return None

@app.route('/api/run-pso', methods=['POST'])
def run_pso():
    try:
        global current_optimization
        
        stop_current_optimization()
        
        data = request.json
        
        pso_params = {
            'max_iter': data.get('maxIter', 100),
            'pop_size': data.get('popSize', 100),
            'c1': data.get('c1', 2),
            'c2': data.get('c2', 1),
            'w': data.get('w', 0.8),
            'wdamp': data.get('wdamp', 1),
            'resetting': data.get('resetting', 25)
        }
        
        num_control_points = data.get('numControlPoints', 3)
        resolution = data.get('resolution', 50)
        cost_function = pp.EnvCostFunction(env, num_control_points, resolution)
        
        problem = {
            'num_var': 2 * num_control_points,
            'var_min': 0,
            'var_max': 1,
            'cost_function': cost_function
        }
        
        current_optimization = threading.Thread(
            target=run_pso_optimization,
            args=(problem, pso_params)
        )
        current_optimization.start()
        
        logger.info('PSO optimization started')
        return jsonify({'status': 'optimization_started'})
    except Exception as e:
        logger.error(f'Error starting PSO: {str(e)}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stop-optimization', methods=['POST'])
def stop_optimization():
    try:
        global current_optimization
        logger.info("Request to stop current optimization received")
        stop_current_optimization()
        return jsonify({'status': 'success', 'message': 'Optimization stopped'})
    except Exception as e:
        logger.error(f'Error stopping optimization: {str(e)}')
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    logger.info('Starting server...')
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)