from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user_id to active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}.")

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send a message to all active connections for a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")

manager = ConnectionManager()

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, we primarily use this for pushing updates to the client
            data = await websocket.receive_text()
            # We don't necessarily need to handle incoming messages unless implementing chat
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
