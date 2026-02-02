from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class OrderStatus(str, Enum):
    draft = "draft"
    project = "project"
    estimation = "estimation"
    production = "production"
    completed = "completed"
    cancelled = "cancelled"

class StageType(str, Enum):
    project = "project"
    estimation = "estimation"
    welding = "welding"
    painting = "painting"
    woodwork = "woodwork"
    upholstery = "upholstery"

class StageStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"

class MaterialType(str, Enum):
    metal = "metal"
    wood = "wood"
    fabric = "fabric"
    paint = "paint"
    other = "other"

class PaymentStage(str, Enum):
    prepayment = "prepayment"
    production = "production"
    delivery = "delivery"
    completed = "completed"

# Models
class PaymentInfo(BaseModel):
    stage: PaymentStage
    amount: float
    paid: bool = False
    paid_date: Optional[str] = None
    notes: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"client_{int(datetime.now().timestamp()*1000)}")
    name: str
    legal_name: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    legal_address: Optional[str] = None
    actual_address: Optional[str] = None
    bank_name: Optional[str] = None
    bik: Optional[str] = None
    account_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    payment_stages: List[PaymentInfo] = []
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientCreate(BaseModel):
    name: str
    legal_name: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    legal_address: Optional[str] = None
    actual_address: Optional[str] = None
    bank_name: Optional[str] = None
    bik: Optional[str] = None
    account_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    legal_address: Optional[str] = None
    actual_address: Optional[str] = None
    bank_name: Optional[str] = None
    bik: Optional[str] = None
    account_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

# Models
class MaterialSource(str, Enum):
    warehouse = "warehouse"  # Из склада
    purchase = "purchase"    # Под заказ

class Material(BaseModel):
    id: str = Field(default_factory=lambda: f"mat_{int(datetime.now().timestamp()*1000)}")
    name: str
    type: MaterialType
    article: Optional[str] = None  # Артикул
    price: float
    unit: str  # шт, м, кг, м2
    source: MaterialSource = MaterialSource.warehouse  # Источник
    quantity_available: float = 0  # Доступно на складе
    quantity_required: float = 0   # Требуется
    location: Optional[str] = None  # Локация на складе
    supplier: Optional[str] = None  # Поставщик
    supplier_contact: Optional[str] = None  # Контакт поставщика
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaterialCreate(BaseModel):
    name: str
    type: MaterialType
    article: Optional[str] = None
    price: float
    unit: str
    source: MaterialSource = MaterialSource.warehouse
    quantity_available: float = 0
    quantity_required: float = 0
    location: Optional[str] = None
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None

class CostItem(BaseModel):
    id: str = Field(default_factory=lambda: f"cost_{int(datetime.now().timestamp()*1000)}")
    name: str  # Название позиции (например, "Труба 25x25")
    quantity: float
    unit: str
    price_per_unit: float
    total: float

class CostItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    price_per_unit: float

class Stage(BaseModel):
    id: str = Field(default_factory=lambda: f"stage_{int(datetime.now().timestamp()*1000)}")
    type: StageType
    status: StageStatus = StageStatus.not_started
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    master: Optional[str] = None
    notes: Optional[str] = None
    cost_items: List[CostItem] = []
    total_cost: float = 0.0

class StageCreate(BaseModel):
    type: StageType
    status: Optional[StageStatus] = StageStatus.not_started
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    master: Optional[str] = None
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"ord_{int(datetime.now().timestamp()*1000)}")
    name: str
    client: str
    status: OrderStatus = OrderStatus.draft
    order_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    planned_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    stages: List[Stage] = []
    planned_cost: float = 0.0
    actual_cost: float = 0.0
    sale_price: float = 0.0
    cash_price: float = 0.0
    cashless_price: float = 0.0
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    name: str
    client: str
    planned_completion_date: Optional[str] = None
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    status: Optional[OrderStatus] = None
    planned_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    notes: Optional[str] = None
    stages: Optional[List[Dict[str, Any]]] = None

# File model for order attachments
class FileType(str, Enum):
    document = "document"
    image = "image"
    invoice = "invoice"
    contract = "contract"
    drawing = "drawing"
    other = "other"

class OrderFile(BaseModel):
    id: str = Field(default_factory=lambda: f"file_{int(datetime.now().timestamp()*1000)}")
    order_id: str
    name: str
    file_type: FileType = FileType.other
    size: int = 0  # bytes
    mime_type: Optional[str] = None
    url: Optional[str] = None  # For external URLs or path to stored file
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    uploaded_by: Optional[str] = None

class OrderFileCreate(BaseModel):
    name: str
    file_type: FileType = FileType.other
    size: int = 0
    mime_type: Optional[str] = None
    url: Optional[str] = None
    uploaded_by: Optional[str] = None

# Event model for order history
class EventType(str, Enum):
    created = "created"
    updated = "updated"
    status_changed = "status_changed"
    stage_added = "stage_added"
    stage_updated = "stage_updated"
    cost_added = "cost_added"
    file_uploaded = "file_uploaded"
    comment = "comment"

class OrderEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"event_{int(datetime.now().timestamp()*1000)}")
    order_id: str
    event_type: EventType
    message: str
    details: Optional[Dict[str, Any]] = None
    user: str = "Система"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderEventCreate(BaseModel):
    event_type: EventType
    message: str
    details: Optional[Dict[str, Any]] = None
    user: str = "Система"

# Settings model for app configuration
class AppSettings(BaseModel):
    id: str = "app_settings"
    markup_percent: float = 60.0  # Наценка в процентах
    cashless_coefficient: float = 0.87  # Коэффициент для безналичного расчёта
    default_work_rate: float = 500.0  # Ставка по умолчанию ₽/ч
    company_name: Optional[str] = None
    company_inn: Optional[str] = None
    company_address: Optional[str] = None
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Materials endpoints
@api_router.post("/materials", response_model=Material)
async def create_material(material: MaterialCreate):
    material_obj = Material(**material.model_dump())
    await db.materials.insert_one(material_obj.model_dump())
    return material_obj

@api_router.get("/materials", response_model=List[Material])
async def get_materials(type: Optional[MaterialType] = None, source: Optional[MaterialSource] = None):
    query = {}
    if type:
        query["type"] = type
    if source:
        query["source"] = source
    materials = await db.materials.find(query, {"_id": 0}).to_list(1000)
    return materials

@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material: MaterialCreate):
    material_obj = Material(id=material_id, **material.model_dump())
    result = await db.materials.replace_one({"id": material_id}, material_obj.model_dump())
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return material_obj

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}

# Orders endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_obj = Order(**order.model_dump())
    await db.orders.insert_one(order_obj.model_dump())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[OrderStatus] = None, client: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if client:
        query["client"] = {"$regex": client, "$options": "i"}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {k: v for k, v in order_update.model_dump().items() if v is not None}
    
    # If stages are being updated, recalculate costs
    if "stages" in update_data and update_data["stages"]:
        stages = update_data["stages"]
        # Recalculate total costs for each stage and overall
        for stage in stages:
            cost_items = stage.get("cost_items", [])
            stage_total = sum(item.get("total", 0) for item in cost_items)
            stage["total_cost"] = stage_total
        
        actual_cost = sum(s.get("total_cost", 0) for s in stages)
        sale_price = actual_cost * 1.6
        cash_price = sale_price
        cashless_price = cash_price / 0.87 if cash_price > 0 else 0
        
        update_data["actual_cost"] = actual_cost
        update_data["sale_price"] = sale_price
        update_data["cash_price"] = cash_price
        update_data["cashless_price"] = cashless_price
    
    if update_data:
        await db.orders.update_one({"id": order_id}, {"$set": update_data})
        order.update(update_data)
    return order

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# Stages endpoints
@api_router.post("/orders/{order_id}/stages", response_model=Stage)
async def add_stage(order_id: str, stage: StageCreate):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    stage_obj = Stage(**stage.model_dump())
    await db.orders.update_one(
        {"id": order_id},
        {"$push": {"stages": stage_obj.model_dump()}}
    )
    return stage_obj

@api_router.put("/orders/{order_id}/stages/{stage_id}", response_model=Stage)
async def update_stage(order_id: str, stage_id: str, stage_update: StageCreate):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    stages = order.get("stages", [])
    stage_index = next((i for i, s in enumerate(stages) if s["id"] == stage_id), None)
    if stage_index is None:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    stage_obj = Stage(id=stage_id, **stage_update.model_dump())
    stages[stage_index] = stage_obj.model_dump()
    
    await db.orders.update_one({"id": order_id}, {"$set": {"stages": stages}})
    return stage_obj

@api_router.post("/orders/{order_id}/stages/{stage_id}/costs", response_model=CostItem)
async def add_cost_item(order_id: str, stage_id: str, cost: CostItemCreate):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    stages = order.get("stages", [])
    stage_index = next((i for i, s in enumerate(stages) if s["id"] == stage_id), None)
    if stage_index is None:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    total = cost.quantity * cost.price_per_unit
    cost_obj = CostItem(**cost.model_dump(), total=total)
    
    stages[stage_index].setdefault("cost_items", []).append(cost_obj.model_dump())
    stage_total = sum(item.get("total", 0) for item in stages[stage_index]["cost_items"])
    stages[stage_index]["total_cost"] = stage_total
    
    # Recalculate order costs
    actual_cost = sum(s.get("total_cost", 0) for s in stages)
    sale_price = actual_cost * 1.6
    cash_price = sale_price
    cashless_price = cash_price / 0.87
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "stages": stages,
            "actual_cost": actual_cost,
            "sale_price": sale_price,
            "cash_price": cash_price,
            "cashless_price": cashless_price
        }}
    )
    return cost_obj

# Calendar endpoints
@api_router.get("/calendar")
async def get_calendar_data(start_date: str, end_date: str):
    orders = await db.orders.find({
        "stages": {
            "$elemMatch": {
                "$or": [
                    {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}},
                    {"start_date": {"$gte": start_date, "$lte": end_date}}
                ]
            }
        }
    }, {"_id": 0}).to_list(1000)
    
    events = []
    for order in orders:
        for stage in order.get("stages", []):
            if stage.get("start_date") and stage.get("end_date"):
                events.append({
                    "id": stage["id"],
                    "order_id": order["id"],
                    "order_name": order["name"],
                    "client": order["client"],
                    "stage_type": stage["type"],
                    "status": stage["status"],
                    "start": stage["start_date"],
                    "end": stage["end_date"],
                    "master": stage.get("master"),
                    "title": f"{order['name']} - {stage['type']}"
                })
    return events

# Statistics
@api_router.get("/statistics")
async def get_statistics():
    total_orders = await db.orders.count_documents({})
    active_orders = await db.orders.count_documents({"status": {"$in": ["project", "estimation", "production"]}})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Total revenue from completed orders
    completed = await db.orders.find({"status": "completed"}, {"_id": 0, "cash_price": 1}).to_list(1000)
    total_revenue = sum(o.get("cash_price", 0) for o in completed)
    
    return {
        "total_orders": total_orders,
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue
    }

# Clients endpoints
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    client_obj = Client(**client_data.model_dump())
    await db.clients.insert_one(client_obj.model_dump())
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"inn": {"$regex": search, "$options": "i"}},
            {"contact_person": {"$regex": search, "$options": "i"}}
        ]
    clients = await db.clients.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_update: ClientUpdate):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = {k: v for k, v in client_update.model_dump().items() if v is not None}
    if update_data:
        await db.clients.update_one({"id": client_id}, {"$set": update_data})
        client.update(update_data)
    return client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

@api_router.get("/clients/{client_id}/orders")
async def get_client_orders(client_id: str):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_name = client["name"]
    orders = await db.orders.find({"client": client_name}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

# ============== ORDER FILES API ==============

@api_router.get("/orders/{order_id}/files", response_model=List[OrderFile])
async def get_order_files(order_id: str):
    """Get all files for an order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    files = await db.order_files.find({"order_id": order_id}, {"_id": 0}).sort("uploaded_at", -1).to_list(100)
    return files

@api_router.post("/orders/{order_id}/files", response_model=OrderFile)
async def upload_order_file(order_id: str, file_data: OrderFileCreate):
    """Upload a file metadata for an order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    file_obj = OrderFile(order_id=order_id, **file_data.model_dump())
    await db.order_files.insert_one(file_obj.model_dump())
    
    # Log event
    event = OrderEvent(
        order_id=order_id,
        event_type=EventType.file_uploaded,
        message=f"Загружен файл: {file_data.name}",
        user=file_data.uploaded_by or "Система"
    )
    await db.order_events.insert_one(event.model_dump())
    
    return file_obj

@api_router.delete("/orders/{order_id}/files/{file_id}")
async def delete_order_file(order_id: str, file_id: str):
    """Delete a file from an order"""
    result = await db.order_files.delete_one({"id": file_id, "order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted"}

# ============== ORDER EVENTS API ==============

@api_router.get("/orders/{order_id}/events", response_model=List[OrderEvent])
async def get_order_events(order_id: str):
    """Get all events for an order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    events = await db.order_events.find({"order_id": order_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return events

@api_router.post("/orders/{order_id}/events", response_model=OrderEvent)
async def create_order_event(order_id: str, event_data: OrderEventCreate):
    """Create a new event for an order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    event = OrderEvent(order_id=order_id, **event_data.model_dump())
    await db.order_events.insert_one(event.model_dump())
    return event

# ============== STAGE UPDATE WITH EVENT LOGGING ==============

@api_router.put("/orders/{order_id}/stages/{stage_id}/status")
async def update_stage_status(order_id: str, stage_id: str, status: StageStatus):
    """Update stage status and log event"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    stages = order.get("stages", [])
    stage_index = next((i for i, s in enumerate(stages) if s["id"] == stage_id), None)
    if stage_index is None:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    old_status = stages[stage_index]["status"]
    stages[stage_index]["status"] = status.value
    
    await db.orders.update_one({"id": order_id}, {"$set": {"stages": stages}})
    
    # Log event
    stage_type = stages[stage_index]["type"]
    event = OrderEvent(
        order_id=order_id,
        event_type=EventType.stage_updated,
        message=f"Статус этапа '{stageTypeLabels.get(stage_type, stage_type)}' изменен: {stageStatusLabels.get(old_status, old_status)} → {stageStatusLabels.get(status.value, status.value)}",
        details={"stage_id": stage_id, "old_status": old_status, "new_status": status.value}
    )
    await db.order_events.insert_one(event.model_dump())
    
    return {"message": "Stage status updated", "stage_id": stage_id, "status": status.value}

# Helper dictionaries for event messages
stageTypeLabels = {
    "project": "Проект",
    "estimation": "Смета",
    "welding": "Сварка",
    "painting": "Покраска",
    "woodwork": "Столярка",
    "upholstery": "Обивка",
}

stageStatusLabels = {
    "not_started": "Не начат",
    "in_progress": "В работе",
    "completed": "Завершен",
}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()