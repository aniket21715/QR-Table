from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_owner
from database import get_db
from models import Order, OrderItem, MenuItem, Table, User
from ws import manager

router = APIRouter(prefix="/orders", tags=["orders"])
ALLOWED_STATUSES = {"pending", "in_progress", "ready", "completed", "cancelled"}


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    special_instructions: str | None = None


class OrderCreate(BaseModel):
    restaurant_id: int | None = None
    table_id: int | None = None
    items: list[OrderItemCreate]
    notes: str | None = None


class MenuItemSnapshot(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class OrderItemOut(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    special_instructions: str | None
    menu_item: MenuItemSnapshot | None = None

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    status: str
    table_id: int | None
    restaurant_id: int
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str


@router.get("/", response_model=list[OrderOut])
def list_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> list[Order]:
    query = db.query(Order).filter(Order.restaurant_id == owner.restaurant_id)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.id.desc()).all()


@router.get("/history", response_model=list[OrderOut])
def order_history(
    limit: int = 50, db: Session = Depends(get_db), owner: User = Depends(require_owner)
) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.restaurant_id == owner.restaurant_id)
        .order_by(Order.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> Order:
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .filter(Order.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must include items")

    restaurant_id = payload.restaurant_id
    table = None
    if payload.table_id is not None:
        table = db.query(Table).filter(Table.id == payload.table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        restaurant_id = table.restaurant_id

    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")

    order = Order(
        status="pending",
        table_id=payload.table_id,
        restaurant_id=restaurant_id,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
        menu_item = (
            db.query(MenuItem)
            .filter(MenuItem.id == item.menu_item_id)
            .filter(MenuItem.restaurant_id == restaurant_id)
            .first()
        )
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=item.quantity,
            unit_price=float(menu_item.price),
            special_instructions=item.special_instructions,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)
    try:
        await manager.broadcast({"type": "order_created", "order_id": order.id})
    except Exception:
        pass
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> Order:
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .filter(Order.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    try:
        await manager.broadcast(
            {"type": "order_status", "order_id": order.id, "status": order.status}
        )
    except Exception:
        pass
    return order
