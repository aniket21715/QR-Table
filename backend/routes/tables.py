import os
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_owner
from database import get_db
from models import Table, User

router = APIRouter(prefix="/tables", tags=["tables"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class TableOut(BaseModel):
    id: int
    label: str
    code: str
    restaurant_id: int

    model_config = {"from_attributes": True}


class TableCreate(BaseModel):
    label: str


@router.get("/", response_model=list[TableOut])
def list_tables(db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> list[Table]:
    return (
        db.query(Table)
        .filter(Table.restaurant_id == owner.restaurant_id)
        .order_by(Table.id)
        .all()
    )


@router.post("/", response_model=TableOut, status_code=201)
def create_table(
    payload: TableCreate, db: Session = Depends(get_db), owner: User = Depends(require_owner)
) -> Table:
    code = uuid.uuid4().hex[:10]
    table = Table(label=payload.label, code=code, restaurant_id=owner.restaurant_id)
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


@router.get("/{table_id}", response_model=TableOut)
def get_table(table_id: int, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> Table:
    table = (
        db.query(Table)
        .filter(Table.id == table_id)
        .filter(Table.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


@router.delete("/{table_id}", status_code=204)
def delete_table(table_id: int, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> None:
    table = (
        db.query(Table)
        .filter(Table.id == table_id)
        .filter(Table.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    db.delete(table)
    db.commit()


@router.get("/{table_id}/qr")
def table_qr(table_id: int, db: Session = Depends(get_db), owner: User = Depends(require_owner)) -> Response:
    table = (
        db.query(Table)
        .filter(Table.id == table_id)
        .filter(Table.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    try:
        import qrcode
    except Exception as exc:
        raise HTTPException(status_code=500, detail="qrcode not installed") from exc

    payload = (
        f"{FRONTEND_URL}/?restaurant={table.restaurant_id}&table={table.id}&code={table.code}"
    )
    qr = qrcode.make(payload)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="image/png")
