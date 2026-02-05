from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_optional_user, require_owner
from database import get_db
from models import MenuCategory, MenuItem, User

router = APIRouter(prefix="/menu", tags=["menu"])

DIET_OPTIONS = {"veg", "nonveg", "vegan", "gluten_free"}


class MenuItemOut(BaseModel):
    id: int
    category_id: int | None
    name: str
    description: str | None
    price: float
    is_available: bool
    diet_tag: str | None

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    category_id: int | None = None
    name: str
    description: str | None = None
    price: float
    is_available: bool = True
    diet_tag: str | None = None


class MenuItemUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    description: str | None = None
    price: float | None = None
    is_available: bool | None = None
    diet_tag: str | None = None


class MenuCategoryOut(BaseModel):
    id: int
    name: str
    sort_order: int
    items: list[MenuItemOut] = []

    model_config = {"from_attributes": True}


class MenuCategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class MenuCategoryUpdate(BaseModel):
    name: str | None = None
    sort_order: int | None = None


def resolve_restaurant_id(restaurant_id: int | None, user: User | None) -> int:
    if restaurant_id:
        return restaurant_id
    if user:
        return user.restaurant_id
    raise HTTPException(status_code=400, detail="restaurant_id is required")


@router.get("/", response_model=list[MenuCategoryOut])
def list_menu(
    restaurant_id: int | None = None,
    diet: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[MenuCategoryOut]:
    restaurant_id = resolve_restaurant_id(restaurant_id, user)
    if diet and diet not in DIET_OPTIONS:
        raise HTTPException(status_code=400, detail="Invalid diet tag")

    categories = (
        db.query(MenuCategory)
        .filter(MenuCategory.restaurant_id == restaurant_id)
        .order_by(MenuCategory.sort_order, MenuCategory.id)
        .all()
    )

    filtered_categories: list[MenuCategoryOut] = []
    for category in categories:
        items = [item for item in category.items if item.restaurant_id == restaurant_id]
        if diet:
            items = [item for item in items if item.diet_tag == diet]
        if search:
            needle = search.lower()
            items = [
                item
                for item in items
                if needle in item.name.lower()
                or (item.description and needle in item.description.lower())
            ]
        items.sort(key=lambda item: item.id)
        if items:
            filtered_categories.append(
                MenuCategoryOut(
                    id=category.id,
                    name=category.name,
                    sort_order=category.sort_order,
                    items=items,
                )
            )

    uncategorized = (
        db.query(MenuItem)
        .filter(MenuItem.restaurant_id == restaurant_id)
        .filter(MenuItem.category_id.is_(None))
        .order_by(MenuItem.id)
        .all()
    )
    if diet:
        uncategorized = [item for item in uncategorized if item.diet_tag == diet]
    if search:
        needle = search.lower()
        uncategorized = [
            item
            for item in uncategorized
            if needle in item.name.lower()
            or (item.description and needle in item.description.lower())
        ]
    if uncategorized:
        filtered_categories.append(
            MenuCategoryOut(id=0, name="Other", sort_order=999, items=uncategorized)
        )
    return filtered_categories


@router.get("/items", response_model=list[MenuItemOut])
def list_menu_items(
    restaurant_id: int | None = None,
    category_id: int | None = None,
    available_only: bool = False,
    diet: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[MenuItem]:
    restaurant_id = resolve_restaurant_id(restaurant_id, user)
    query = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id)
    if category_id is not None:
        query = query.filter(MenuItem.category_id == category_id)
    if available_only:
        query = query.filter(MenuItem.is_available.is_(True))
    if diet:
        if diet not in DIET_OPTIONS:
            raise HTTPException(status_code=400, detail="Invalid diet tag")
        query = query.filter(MenuItem.diet_tag == diet)
    if search:
        query = query.filter(
            (MenuItem.name.ilike(f"%{search}%"))
            | (MenuItem.description.ilike(f"%{search}%"))
        )
    return query.order_by(MenuItem.id).all()


@router.get("/items/{item_id}", response_model=MenuItemOut)
def get_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    restaurant_id: int | None = None,
) -> MenuItem:
    restaurant_id = resolve_restaurant_id(restaurant_id, user)
    item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .filter(MenuItem.restaurant_id == restaurant_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


@router.post("/items", response_model=MenuItemOut, status_code=201)
def create_menu_item(
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> MenuItem:
    if payload.category_id is not None:
        category = (
            db.query(MenuCategory)
            .filter(MenuCategory.id == payload.category_id)
            .filter(MenuCategory.restaurant_id == owner.restaurant_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    if payload.diet_tag and payload.diet_tag not in DIET_OPTIONS:
        raise HTTPException(status_code=400, detail="Invalid diet tag")
    item = MenuItem(
        restaurant_id=owner.restaurant_id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        is_available=payload.is_available,
        diet_tag=payload.diet_tag,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=MenuItemOut)
def update_menu_item(
    item_id: int,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> MenuItem:
    item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .filter(MenuItem.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if payload.category_id is not None:
        category = (
            db.query(MenuCategory)
            .filter(MenuCategory.id == payload.category_id)
            .filter(MenuCategory.restaurant_id == owner.restaurant_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    if payload.diet_tag and payload.diet_tag not in DIET_OPTIONS:
        raise HTTPException(status_code=400, detail="Invalid diet tag")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> None:
    item = (
        db.query(MenuItem)
        .filter(MenuItem.id == item_id)
        .filter(MenuItem.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(item)
    db.commit()


@router.get("/categories", response_model=list[MenuCategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    restaurant_id: int | None = None,
) -> list[MenuCategoryOut]:
    restaurant_id = resolve_restaurant_id(restaurant_id, user)
    categories = (
        db.query(MenuCategory)
        .filter(MenuCategory.restaurant_id == restaurant_id)
        .order_by(MenuCategory.sort_order, MenuCategory.id)
        .all()
    )
    for category in categories:
        category.items.sort(key=lambda item: item.id)
    return categories


@router.post("/categories", response_model=MenuCategoryOut, status_code=201)
def create_category(
    payload: MenuCategoryCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> MenuCategory:
    existing = (
        db.query(MenuCategory)
        .filter(MenuCategory.name == payload.name)
        .filter(MenuCategory.restaurant_id == owner.restaurant_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")
    category = MenuCategory(
        name=payload.name,
        sort_order=payload.sort_order,
        restaurant_id=owner.restaurant_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=MenuCategoryOut)
def update_category(
    category_id: int,
    payload: MenuCategoryUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> MenuCategory:
    category = (
        db.query(MenuCategory)
        .filter(MenuCategory.id == category_id)
        .filter(MenuCategory.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> None:
    category = (
        db.query(MenuCategory)
        .filter(MenuCategory.id == category_id)
        .filter(MenuCategory.restaurant_id == owner.restaurant_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for item in category.items:
        item.category_id = None
    db.delete(category)
    db.commit()
