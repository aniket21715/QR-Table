from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import os
from database import Base, engine
from routes import menu, orders, analytics, recommendations, tables, auth
from ws import manager

app = FastAPI(title="Restaurant QR Order")

cors_origins = os.getenv("CORS_ORIGINS", "*")
allow_origins = [origin.strip() for origin in cors_origins.split(",")] if cors_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    if os.getenv("AUTO_CREATE_DB", "true").lower() == "true":
        Base.metadata.create_all(bind=engine)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "restaurant-qr-order"}


app.include_router(menu.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(tables.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.websocket("/ws/orders")
async def orders_ws(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
