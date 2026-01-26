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

class Specialization(str, Enum):
    welding = "welding"
    painting = "painting"
    woodwork = "woodwork"
    upholstery = "upholstery"
    universal = "universal"

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

# Master Models
class Master(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"master_{int(datetime.now().timestamp()*1000)}")
    name: str
    phone: Optional[str] = None
    specialization: Specialization = Specialization.universal
    hourly_rate: float = 0.0
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MasterCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    specialization: Specialization = Specialization.universal
    hourly_rate: float = 0.0
    notes: Optional[str] = None

class MasterUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[Specialization] = None
    hourly_rate: Optional[float] = None
    notes: Optional[str] = None

# Models
class Material(BaseModel):
    id: str = Field(default_factory=lambda: f"mat_{int(datetime.now().timestamp()*1000)}")
    name: str
    type: MaterialType
    price: float
    unit: str  # шт, м, кг, м2
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaterialCreate(BaseModel):
    name: str
    type: MaterialType
    price: float
    unit: str
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

# Materials endpoints
@api_router.post("/materials", response_model=Material)
async def create_material(material: MaterialCreate):
    material_obj = Material(**material.model_dump())
    await db.materials.insert_one(material_obj.model_dump())
    return material_obj

@api_router.get("/materials", response_model=List[Material])
async def get_materials(type: Optional[MaterialType] = None):
    query = {}
    if type:
        query["type"] = type
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

# Masters endpoints
@api_router.post("/masters", response_model=Master)
async def create_master(master_data: MasterCreate):
    master_obj = Master(**master_data.model_dump())
    await db.masters.insert_one(master_obj.model_dump())
    return master_obj

@api_router.get("/masters", response_model=List[Master])
async def get_masters(specialization: Optional[Specialization] = None):
    query = {}
    if specialization:
        query["specialization"] = specialization
    masters = await db.masters.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return masters

@api_router.get("/masters/{master_id}", response_model=Master)
async def get_master(master_id: str):
    master = await db.masters.find_one({"id": master_id}, {"_id": 0})
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return master

@api_router.put("/masters/{master_id}", response_model=Master)
async def update_master(master_id: str, master_update: MasterUpdate):
    master = await db.masters.find_one({"id": master_id}, {"_id": 0})
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    update_data = {k: v for k, v in master_update.model_dump().items() if v is not None}
    if update_data:
        await db.masters.update_one({"id": master_id}, {"$set": update_data})
        master.update(update_data)
    return master

@api_router.delete("/masters/{master_id}")
async def delete_master(master_id: str):
    result = await db.masters.delete_one({"id": master_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Master not found")
    return {"message": "Master deleted"}

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