from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
from models import MenuItem, OrderItem

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class TrendingItem(BaseModel):
    id: int
    name: str
    orders: int


class FbtItem(BaseModel):
    id: int
    name: str
    together: int


@router.get("/trending", response_model=list[TrendingItem])
def trending_items(
    restaurant_id: int, limit: int = 5, db: Session = Depends(get_db)
) -> list[TrendingItem]:
    rows = (
        db.query(
            MenuItem.id,
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("orders"),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .filter(MenuItem.restaurant_id == restaurant_id)
        .group_by(MenuItem.id)
        .order_by(desc("orders"))
        .limit(limit)
        .all()
    )
    return [TrendingItem(id=row.id, name=row.name, orders=int(row.orders)) for row in rows]


@router.get("/fbt", response_model=list[FbtItem])
def frequently_bought_together(
    restaurant_id: int, item_id: int, limit: int = 5, db: Session = Depends(get_db)
) -> list[FbtItem]:
    exists = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .filter(MenuItem.restaurant_id == restaurant_id)
        .first()
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Menu item not found")

    order_ids = (
        db.query(OrderItem.order_id)
        .filter(OrderItem.menu_item_id == item_id)
        .subquery()
    )

    rows = (
        db.query(
            MenuItem.id,
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("together"),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .filter(MenuItem.restaurant_id == restaurant_id)
        .filter(OrderItem.order_id.in_(order_ids))
        .filter(MenuItem.id != item_id)
        .group_by(MenuItem.id)
        .order_by(desc("together"))
        .limit(limit)
        .all()
    )
    return [FbtItem(id=row.id, name=row.name, together=int(row.together)) for row in rows]
