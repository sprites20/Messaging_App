from flask import Flask, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return "Socket.IO server running with Flask!"

@socketio.on('connect')
def handle_connect():
    user_id = request.args.get('user_id')
    print(f"User connected: {user_id}")
    emit('server_response', {'response': f'Connected as {user_id}'})

@socketio.on('client_event')
def handle_client_event(data):
    user_id = data['user_id']
    message = data['message']
    print(f"Received message from {user_id}: {message}")
    emit('server_response', {'response': f'Received: {message}'}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.args.get('user_id')
    print(f"User disconnected: {user_id}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
