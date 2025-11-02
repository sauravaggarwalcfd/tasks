from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== ENUMS ====================
class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PRODUCTION = "in_production"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    SHIPPED = "shipped"

class ProductionStage(str, Enum):
    CUTTING = "cutting"
    STITCHING = "stitching"
    FINISHING = "finishing"
    QUALITY_CHECK = "quality_check"
    PACKAGING = "packaging"

class QCStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    PENDING = "pending"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ==================== MODELS ====================

# Order Models
class SizeQuantity(BaseModel):
    size: str
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    style_number: str
    garment_type: str
    color: str
    sizes: List[SizeQuantity]
    total_quantity: int
    delivery_date: str
    notes: Optional[str] = ""

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    style_number: str
    garment_type: str
    color: str
    sizes: List[SizeQuantity]
    total_quantity: int
    delivery_date: str
    status: OrderStatus = OrderStatus.PENDING
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Production Models
class ProductionStageCreate(BaseModel):
    order_id: str
    stage: ProductionStage
    assigned_worker_id: Optional[str] = None
    notes: Optional[str] = ""

class ProductionStageRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    stage: ProductionStage
    assigned_worker_id: Optional[str] = None
    status: str = "pending"  # pending, in_progress, completed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Material Models
class MaterialCreate(BaseModel):
    name: str
    category: str  # fabric, thread, button, zipper, label, etc.
    unit: str  # meters, pieces, kg, etc.
    quantity: float
    reorder_level: float
    supplier_id: Optional[str] = None
    unit_price: float

class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    unit: str
    quantity: float
    reorder_level: float
    supplier_id: Optional[str] = None
    unit_price: float
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Supplier Models
class SupplierCreate(BaseModel):
    name: str
    contact_person: str
    phone: str
    email: str
    address: str
    materials_supplied: List[str]

class Supplier(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact_person: str
    phone: str
    email: str
    address: str
    materials_supplied: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Worker Models
class WorkerCreate(BaseModel):
    name: str
    department: str  # cutting, stitching, finishing, qc, packaging
    phone: str
    skills: List[str]

class Worker(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    department: str
    phone: str
    skills: List[str]
    active: bool = True
    joined_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Quality Check Models
class QualityCheckCreate(BaseModel):
    order_id: str
    stage: ProductionStage
    inspector_id: str
    defects_found: List[str]
    notes: Optional[str] = ""

class QualityCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    stage: ProductionStage
    inspector_id: str
    status: QCStatus = QCStatus.PENDING
    defects_found: List[str]
    notes: Optional[str] = ""
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Task/Communication Models
class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: str
    department: str
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[str] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    assigned_to: str
    department: str
    priority: TaskPriority
    status: TaskStatus = TaskStatus.PENDING
    due_date: Optional[str] = None
    tags: List[str] = []
    estimated_hours: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    created_by: Optional[str] = None


# Task Comment Models
class TaskCommentCreate(BaseModel):
    task_id: str
    user_id: str
    user_name: str
    comment: str

class TaskComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    user_id: str
    user_name: str
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Subtask Models
class SubtaskCreate(BaseModel):
    task_id: str
    title: str

class Subtask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    title: str
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


# Attachment Models
class TaskAttachmentCreate(BaseModel):
    task_id: str
    file_name: str
    file_url: str
    file_type: str
    uploaded_by: str

class TaskAttachment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    file_name: str
    file_url: str
    file_type: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Time Log Models
class TimeLogCreate(BaseModel):
    task_id: str
    user_id: str
    user_name: str
    hours: float
    description: Optional[str] = ""

class TimeLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    user_id: str
    user_name: str
    hours: float
    description: Optional[str] = ""
    logged_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Activity Log Model
class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    user_id: str
    user_name: str
    action: str  # "created", "commented", "status_changed", "assigned", etc.
    details: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== HELPER FUNCTIONS ====================
def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def serialize_doc(doc):
    if doc:
        for key, value in doc.items():
            if isinstance(value, datetime):
                doc[key] = value.isoformat()
    return doc

def deserialize_doc(doc):
    datetime_fields = ['created_at', 'updated_at', 'started_at', 'completed_at', 'checked_at', 'last_updated', 'joined_date']
    if doc:
        for field in datetime_fields:
            if field in doc and isinstance(doc[field], str):
                doc[field] = datetime.fromisoformat(doc[field])
    return doc


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Factory Management System API"}


# ==================== ORDER ROUTES ====================
@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate):
    order = Order(**order_input.model_dump())
    doc = order.model_dump()
    doc = serialize_doc(doc)
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    orders = [deserialize_doc(order) for order in orders]
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return deserialize_doc(order)

@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, status: Optional[str] = None, notes: Optional[str] = None):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if status:
        update_data['status'] = status
    if notes is not None:
        update_data['notes'] = notes
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order updated successfully"}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}


# ==================== PRODUCTION ROUTES ====================
@api_router.post("/production", response_model=ProductionStageRecord)
async def create_production_stage(stage_input: ProductionStageCreate):
    stage_record = ProductionStageRecord(**stage_input.model_dump())
    doc = stage_record.model_dump()
    doc = serialize_doc(doc)
    await db.production_stages.insert_one(doc)
    return stage_record

@api_router.get("/production", response_model=List[ProductionStageRecord])
async def get_production_stages(order_id: Optional[str] = None):
    query = {}
    if order_id:
        query['order_id'] = order_id
    stages = await db.production_stages.find(query, {"_id": 0}).to_list(1000)
    stages = [deserialize_doc(stage) for stage in stages]
    return stages

@api_router.put("/production/{stage_id}")
async def update_production_stage(stage_id: str, status: Optional[str] = None, 
                                 started_at: Optional[str] = None,
                                 completed_at: Optional[str] = None):
    update_data = {}
    if status:
        update_data['status'] = status
    if started_at:
        update_data['started_at'] = started_at
    if completed_at:
        update_data['completed_at'] = completed_at
    
    result = await db.production_stages.update_one({"id": stage_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Production stage not found")
    return {"message": "Production stage updated successfully"}


# ==================== MATERIAL ROUTES ====================
@api_router.post("/materials", response_model=Material)
async def create_material(material_input: MaterialCreate):
    material = Material(**material_input.model_dump())
    doc = material.model_dump()
    doc = serialize_doc(doc)
    await db.materials.insert_one(doc)
    return material

@api_router.get("/materials", response_model=List[Material])
async def get_materials(low_stock: Optional[bool] = None):
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    materials = [deserialize_doc(mat) for mat in materials]
    
    if low_stock:
        materials = [mat for mat in materials if mat['quantity'] <= mat['reorder_level']]
    
    return materials

@api_router.get("/materials/{material_id}", response_model=Material)
async def get_material(material_id: str):
    material = await db.materials.find_one({"id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return deserialize_doc(material)

@api_router.put("/materials/{material_id}")
async def update_material(material_id: str, quantity: Optional[float] = None, 
                         unit_price: Optional[float] = None):
    update_data = {"last_updated": datetime.now(timezone.utc).isoformat()}
    if quantity is not None:
        update_data['quantity'] = quantity
    if unit_price is not None:
        update_data['unit_price'] = unit_price
    
    result = await db.materials.update_one({"id": material_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material updated successfully"}

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}


# ==================== SUPPLIER ROUTES ====================
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier_input: SupplierCreate):
    supplier = Supplier(**supplier_input.model_dump())
    doc = supplier.model_dump()
    doc = serialize_doc(doc)
    await db.suppliers.insert_one(doc)
    return supplier

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(1000)
    suppliers = [deserialize_doc(sup) for sup in suppliers]
    return suppliers

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}


# ==================== WORKER ROUTES ====================
@api_router.post("/workers", response_model=Worker)
async def create_worker(worker_input: WorkerCreate):
    worker = Worker(**worker_input.model_dump())
    doc = worker.model_dump()
    doc = serialize_doc(doc)
    await db.workers.insert_one(doc)
    return worker

@api_router.get("/workers", response_model=List[Worker])
async def get_workers(department: Optional[str] = None, active: Optional[bool] = None):
    query = {}
    if department:
        query['department'] = department
    if active is not None:
        query['active'] = active
    workers = await db.workers.find(query, {"_id": 0}).to_list(1000)
    workers = [deserialize_doc(worker) for worker in workers]
    return workers

@api_router.put("/workers/{worker_id}")
async def update_worker(worker_id: str, active: Optional[bool] = None):
    update_data = {}
    if active is not None:
        update_data['active'] = active
    
    result = await db.workers.update_one({"id": worker_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"message": "Worker updated successfully"}

@api_router.delete("/workers/{worker_id}")
async def delete_worker(worker_id: str):
    result = await db.workers.delete_one({"id": worker_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"message": "Worker deleted successfully"}


# ==================== QUALITY CHECK ROUTES ====================
@api_router.post("/quality-checks", response_model=QualityCheck)
async def create_quality_check(qc_input: QualityCheckCreate):
    qc = QualityCheck(**qc_input.model_dump())
    if len(qc.defects_found) == 0:
        qc.status = QCStatus.PASSED
    else:
        qc.status = QCStatus.FAILED
    
    doc = qc.model_dump()
    doc = serialize_doc(doc)
    await db.quality_checks.insert_one(doc)
    return qc

@api_router.get("/quality-checks", response_model=List[QualityCheck])
async def get_quality_checks(order_id: Optional[str] = None):
    query = {}
    if order_id:
        query['order_id'] = order_id
    qcs = await db.quality_checks.find(query, {"_id": 0}).to_list(1000)
    qcs = [deserialize_doc(qc) for qc in qcs]
    return qcs


# ==================== TASK ROUTES ====================
@api_router.post("/tasks", response_model=Task)
async def create_task(task_input: TaskCreate):
    task = Task(**task_input.model_dump())
    doc = task.model_dump()
    doc = serialize_doc(doc)
    await db.tasks.insert_one(doc)
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(status: Optional[str] = None, department: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    if department:
        query['department'] = department
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    tasks = [deserialize_doc(task) for task in tasks]
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, status: Optional[str] = None):
    update_data = {}
    if status:
        update_data['status'] = status
        if status == "completed":
            update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated successfully"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# ==================== ANALYTICS ROUTES ====================
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics():
    # Get counts
    total_orders = await db.orders.count_documents({})
    active_orders = await db.orders.count_documents({"status": {"$in": ["pending", "in_production", "quality_check"]}})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    total_workers = await db.workers.count_documents({"active": True})
    total_materials = await db.materials.count_documents({})
    low_stock_materials = await db.materials.count_documents({"$expr": {"$lte": ["$quantity", "$reorder_level"]}})
    
    pending_tasks = await db.tasks.count_documents({"status": "pending"})
    total_qc_checks = await db.quality_checks.count_documents({})
    failed_qc = await db.quality_checks.count_documents({"status": "failed"})
    
    return {
        "orders": {
            "total": total_orders,
            "active": active_orders,
            "completed": completed_orders
        },
        "workers": {
            "total": total_workers
        },
        "materials": {
            "total": total_materials,
            "low_stock": low_stock_materials
        },
        "tasks": {
            "pending": pending_tasks
        },
        "quality": {
            "total_checks": total_qc_checks,
            "failed": failed_qc,
            "pass_rate": round((total_qc_checks - failed_qc) / total_qc_checks * 100, 2) if total_qc_checks > 0 else 100
        }
    }

@api_router.get("/analytics/production-efficiency")
async def get_production_efficiency():
    # Get production stages data
    stages = await db.production_stages.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    
    stage_counts = {}
    for stage in stages:
        stage_name = stage.get('stage', 'unknown')
        stage_counts[stage_name] = stage_counts.get(stage_name, 0) + 1
    
    return {
        "stage_completion": stage_counts,
        "total_completed_stages": len(stages)
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
