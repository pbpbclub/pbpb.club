import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(ROOT_DIR / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    print("Очистка существующих данных...")
    await db.materials.delete_many({})
    await db.orders.delete_many({})
    
    print("Добавление материалов...")
    materials = [
        {
            "id": "mat_1",
            "name": "Труба 25x25 мм",
            "type": "metal",
            "price": 350,
            "unit": "м",
            "notes": "Профильная труба",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_2",
            "name": "Труба 30x30 мм",
            "type": "metal",
            "price": 420,
            "unit": "м",
            "notes": "Профильная труба",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_3",
            "name": "Труба 40x40 мм",
            "type": "metal",
            "price": 580,
            "unit": "м",
            "notes": "Профильная труба",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_4",
            "name": "Доска сосна 40мм",
            "type": "wood",
            "price": 25000,
            "unit": "м3",
            "notes": "Строганная",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_5",
            "name": "Фанера 18мм",
            "type": "wood",
            "price": 1800,
            "unit": "м2",
            "notes": "Березовая",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_6",
            "name": "Краска порошковая RAL 9005",
            "type": "paint",
            "price": 650,
            "unit": "кг",
            "notes": "Черная матовая",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mat_7",
            "name": "Ткань велюр",
            "type": "fabric",
            "price": 1200,
            "unit": "м",
            "notes": "Мебельная",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    await db.materials.insert_many(materials)
    print(f"Добавлено {len(materials)} материалов")
    
    print("Добавление заказов...")
    today = datetime.now(timezone.utc)
    
    orders = [
        {
            "id": "ord_1",
            "name": "Обеденный стол LOFT",
            "client": "Иван Петров",
            "status": "production",
            "order_date": (today - timedelta(days=10)).isoformat(),
            "planned_completion_date": (today + timedelta(days=5)).isoformat(),
            "stages": [
                {
                    "id": "stage_1_1",
                    "type": "welding",
                    "status": "completed",
                    "start_date": (today - timedelta(days=8)).isoformat(),
                    "end_date": (today - timedelta(days=6)).isoformat(),
                    "master": "Алексей",
                    "notes": "Сварка каркаса",
                    "cost_items": [
                        {"id": "cost_1", "name": "Труба 40x40", "quantity": 12, "unit": "м", "price_per_unit": 580, "total": 6960},
                        {"id": "cost_2", "name": "Работа сварщика", "quantity": 8, "unit": "час", "price_per_unit": 1500, "total": 12000}
                    ],
                    "total_cost": 18960
                },
                {
                    "id": "stage_1_2",
                    "type": "painting",
                    "status": "in_progress",
                    "start_date": (today - timedelta(days=3)).isoformat(),
                    "end_date": today.isoformat(),
                    "master": "Сергей",
                    "notes": "Порошковая покраска",
                    "cost_items": [
                        {"id": "cost_3", "name": "Краска RAL 9005", "quantity": 2, "unit": "кг", "price_per_unit": 650, "total": 1300},
                        {"id": "cost_4", "name": "Покраска", "quantity": 1, "unit": "шт", "price_per_unit": 5000, "total": 5000}
                    ],
                    "total_cost": 6300
                },
                {
                    "id": "stage_1_3",
                    "type": "woodwork",
                    "status": "not_started",
                    "start_date": (today + timedelta(days=1)).isoformat(),
                    "end_date": (today + timedelta(days=4)).isoformat(),
                    "master": "Дмитрий",
                    "notes": "Столешница",
                    "cost_items": [],
                    "total_cost": 0
                }
            ],
            "actual_cost": 25260,
            "sale_price": 40416,
            "cash_price": 40416,
            "cashless_price": 46456.32,
            "notes": "Срочный заказ",
            "created_at": (today - timedelta(days=10)).isoformat()
        },
        {
            "id": "ord_2",
            "name": "Стеллаж металлический",
            "client": "ООО Офис Групп",
            "status": "estimation",
            "order_date": (today - timedelta(days=3)).isoformat(),
            "planned_completion_date": (today + timedelta(days=12)).isoformat(),
            "stages": [
                {
                    "id": "stage_2_1",
                    "type": "project",
                    "status": "completed",
                    "start_date": (today - timedelta(days=2)).isoformat(),
                    "end_date": (today - timedelta(days=1)).isoformat(),
                    "master": "",
                    "notes": "Проектирование",
                    "cost_items": [{"id": "cost_5", "name": "Проект", "quantity": 1, "unit": "шт", "price_per_unit": 3000, "total": 3000}],
                    "total_cost": 3000
                },
                {
                    "id": "stage_2_2",
                    "type": "estimation",
                    "status": "in_progress",
                    "start_date": today.isoformat(),
                    "end_date": (today + timedelta(days=1)).isoformat(),
                    "master": "",
                    "notes": "Подготовка сметы",
                    "cost_items": [],
                    "total_cost": 0
                }
            ],
            "actual_cost": 3000,
            "sale_price": 4800,
            "cash_price": 4800,
            "cashless_price": 5517.24,
            "notes": "5 полок",
            "created_at": (today - timedelta(days=3)).isoformat()
        },
        {
            "id": "ord_3",
            "name": "Диван угловой",
            "client": "Марина Соколова",
            "status": "production",
            "order_date": (today - timedelta(days=15)).isoformat(),
            "planned_completion_date": (today + timedelta(days=10)).isoformat(),
            "stages": [
                {
                    "id": "stage_3_1",
                    "type": "woodwork",
                    "status": "completed",
                    "start_date": (today - timedelta(days=12)).isoformat(),
                    "end_date": (today - timedelta(days=8)).isoformat(),
                    "master": "Дмитрий",
                    "notes": "Каркас дивана",
                    "cost_items": [
                        {"id": "cost_6", "name": "Доска сосна", "quantity": 0.5, "unit": "м3", "price_per_unit": 25000, "total": 12500},
                        {"id": "cost_7", "name": "Фанера 18мм", "quantity": 8, "unit": "м2", "price_per_unit": 1800, "total": 14400}
                    ],
                    "total_cost": 26900
                },
                {
                    "id": "stage_3_2",
                    "type": "upholstery",
                    "status": "in_progress",
                    "start_date": (today - timedelta(days=5)).isoformat(),
                    "end_date": (today + timedelta(days=8)).isoformat(),
                    "master": "Елена",
                    "notes": "Обивка",
                    "cost_items": [
                        {"id": "cost_8", "name": "Велюр", "quantity": 15, "unit": "м", "price_per_unit": 1200, "total": 18000}
                    ],
                    "total_cost": 18000
                }
            ],
            "actual_cost": 44900,
            "sale_price": 71840,
            "cash_price": 71840,
            "cashless_price": 82574.71,
            "notes": "Цвет ткани: серый",
            "created_at": (today - timedelta(days=15)).isoformat()
        },
        {
            "id": "ord_4",
            "name": "Стул барный - 4 шт",
            "client": "Кафе Центральное",
            "status": "completed",
            "order_date": (today - timedelta(days=20)).isoformat(),
            "planned_completion_date": (today - timedelta(days=5)).isoformat(),
            "actual_completion_date": (today - timedelta(days=3)).isoformat(),
            "stages": [
                {
                    "id": "stage_4_1",
                    "type": "welding",
                    "status": "completed",
                    "start_date": (today - timedelta(days=18)).isoformat(),
                    "end_date": (today - timedelta(days=16)).isoformat(),
                    "master": "Алексей",
                    "notes": "Каркасы",
                    "cost_items": [
                        {"id": "cost_9", "name": "Труба 25x25", "quantity": 20, "unit": "м", "price_per_unit": 350, "total": 7000}
                    ],
                    "total_cost": 7000
                },
                {
                    "id": "stage_4_2",
                    "type": "painting",
                    "status": "completed",
                    "start_date": (today - timedelta(days=14)).isoformat(),
                    "end_date": (today - timedelta(days=12)).isoformat(),
                    "master": "Сергей",
                    "notes": "Покраска",
                    "cost_items": [
                        {"id": "cost_10", "name": "Краска", "quantity": 1.5, "unit": "кг", "price_per_unit": 650, "total": 975}
                    ],
                    "total_cost": 975
                },
                {
                    "id": "stage_4_3",
                    "type": "woodwork",
                    "status": "completed",
                    "start_date": (today - timedelta(days=10)).isoformat(),
                    "end_date": (today - timedelta(days=8)).isoformat(),
                    "master": "Дмитрий",
                    "notes": "Сиденья",
                    "cost_items": [
                        {"id": "cost_11", "name": "Фанера", "quantity": 2, "unit": "м2", "price_per_unit": 1800, "total": 3600}
                    ],
                    "total_cost": 3600
                }
            ],
            "actual_cost": 11575,
            "sale_price": 18520,
            "cash_price": 18520,
            "cashless_price": 21287.36,
            "notes": "Выполнено досрочно",
            "created_at": (today - timedelta(days=20)).isoformat()
        },
        {
            "id": "ord_5",
            "name": "Консоль металлическая",
            "client": "Анна Волкова",
            "status": "project",
            "order_date": today.isoformat(),
            "planned_completion_date": (today + timedelta(days=20)).isoformat(),
            "stages": [],
            "actual_cost": 0,
            "sale_price": 0,
            "cash_price": 0,
            "cashless_price": 0,
            "notes": "Новый заказ, требуется проект",
            "created_at": today.isoformat()
        }
    ]
    
    await db.orders.insert_many(orders)
    print(f"Добавлено {len(orders)} заказов")
    print("\nТестовые данные успешно добавлены!")
    print("\nСтатистика:")
    print(f"- Материалов: {await db.materials.count_documents({})}")
    print(f"- Заказов: {await db.orders.count_documents({})}")

if __name__ == "__main__":
    print("Запуск скрипта добавления тестовых данных...\n")
    asyncio.run(seed_data())
    client.close()
    print("\nГотово!")