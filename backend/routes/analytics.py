from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, text

from auth import require_owner
from database import get_db
from models import Order, OrderItem, MenuItem, MenuCategory, User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> dict:
    total_orders = (
        db.query(func.count(Order.id))
        .filter(Order.restaurant_id == owner.restaurant_id)
        .scalar()
        or 0
    )
    total_revenue = (
        db.query(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.restaurant_id == owner.restaurant_id)
        .scalar()
    )
    return {
        "total_orders": int(total_orders),
        "total_revenue": float(total_revenue or 0)
    }


@router.get("/status")
def analytics_by_status(db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> dict:
    rows = (
        db.query(Order.status, func.count(Order.id))
        .filter(Order.restaurant_id == owner.restaurant_id)
        .group_by(Order.status)
        .all()
    )
    return {status: int(count) for status, count in rows}


@router.get("/top-items")
def top_items(limit: int = 5, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> list[dict]:
    rows = (
        db.query(
            MenuItem.id,
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("orders"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("revenue"),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .filter(MenuItem.restaurant_id == owner.restaurant_id)
        .group_by(MenuItem.id)
        .order_by(desc("orders"))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": row.id,
            "name": row.name,
            "orders": int(row.orders),
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    ]


@router.get("/by-category")
def sales_by_category(db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> list[dict]:
    rows = (
        db.query(
            MenuCategory.name,
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("revenue"),
        )
        .join(MenuItem, MenuItem.category_id == MenuCategory.id)
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .filter(MenuCategory.restaurant_id == owner.restaurant_id)
        .group_by(MenuCategory.name)
        .order_by(desc("revenue"))
        .all()
    )
    return [{"category": row.name, "revenue": float(row.revenue or 0)} for row in rows]


@router.get("/by-hour")
def orders_by_hour(days: int = 7, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> list[dict]:
    cutoff = func.now() - text(f"interval '{days} days'")
    rows = (
        db.query(
            extract("hour", Order.created_at).label("hour"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.restaurant_id == owner.restaurant_id)
        .filter(Order.created_at >= cutoff)
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    return [{"hour": int(row.hour), "orders": int(row.orders)} for row in rows]
