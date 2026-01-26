#!/usr/bin/env python3
"""
Script to seed the database with metal materials data
Based on typical metal prices in Russia
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Metal materials data based on typical Russian prices
MATERIALS_DATA = [
    # Труба профильная
    {"name": "Труба профильная 20x20x1.5 мм", "type": "metal", "price": 85, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 25x25x2 мм", "type": "metal", "price": 120, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 30x30x2 мм", "type": "metal", "price": 145, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 40x40x2 мм", "type": "metal", "price": 190, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 40x40x3 мм", "type": "metal", "price": 280, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 50x50x2 мм", "type": "metal", "price": 240, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 50x50x3 мм", "type": "metal", "price": 350, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 60x40x2 мм", "type": "metal", "price": 250, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 60x60x3 мм", "type": "metal", "price": 420, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 80x40x3 мм", "type": "metal", "price": 450, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 80x80x3 мм", "type": "metal", "price": 560, "unit": "м", "notes": "Профильная труба"},
    {"name": "Труба профильная 100x100x4 мм", "type": "metal", "price": 950, "unit": "м", "notes": "Профильная труба"},
    
    # Труба круглая электросварная
    {"name": "Труба круглая э/с 20x2 мм", "type": "metal", "price": 75, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 25x2 мм", "type": "metal", "price": 95, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 32x2 мм", "type": "metal", "price": 120, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 40x2 мм", "type": "metal", "price": 150, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 48x3 мм", "type": "metal", "price": 250, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 57x3 мм", "type": "metal", "price": 320, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 76x3 мм", "type": "metal", "price": 430, "unit": "м", "notes": "Электросварная труба"},
    {"name": "Труба круглая э/с 89x3.5 мм", "type": "metal", "price": 580, "unit": "м", "notes": "Электросварная труба"},
    
    # Уголок
    {"name": "Уголок 25x25x3 мм", "type": "metal", "price": 85, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 32x32x3 мм", "type": "metal", "price": 110, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 40x40x3 мм", "type": "metal", "price": 135, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 40x40x4 мм", "type": "metal", "price": 175, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 50x50x4 мм", "type": "metal", "price": 220, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 50x50x5 мм", "type": "metal", "price": 270, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 63x63x5 мм", "type": "metal", "price": 340, "unit": "м", "notes": "Уголок равнополочный"},
    {"name": "Уголок 75x75x6 мм", "type": "metal", "price": 490, "unit": "м", "notes": "Уголок равнополочный"},
    
    # Полоса
    {"name": "Полоса 20x4 мм", "type": "metal", "price": 45, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 25x4 мм", "type": "metal", "price": 55, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 30x4 мм", "type": "metal", "price": 68, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 40x4 мм", "type": "metal", "price": 90, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 40x5 мм", "type": "metal", "price": 112, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 50x5 мм", "type": "metal", "price": 140, "unit": "м", "notes": "Полоса стальная"},
    {"name": "Полоса 60x6 мм", "type": "metal", "price": 200, "unit": "м", "notes": "Полоса стальная"},
    
    # Круг
    {"name": "Круг 10 мм", "type": "metal", "price": 45, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 12 мм", "type": "metal", "price": 65, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 14 мм", "type": "metal", "price": 88, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 16 мм", "type": "metal", "price": 115, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 18 мм", "type": "metal", "price": 145, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 20 мм", "type": "metal", "price": 180, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 25 мм", "type": "metal", "price": 280, "unit": "м", "notes": "Круг стальной"},
    {"name": "Круг 30 мм", "type": "metal", "price": 400, "unit": "м", "notes": "Круг стальной"},
    
    # Квадрат
    {"name": "Квадрат 10x10 мм", "type": "metal", "price": 45, "unit": "м", "notes": "Квадрат стальной"},
    {"name": "Квадрат 12x12 мм", "type": "metal", "price": 65, "unit": "м", "notes": "Квадрат стальной"},
    {"name": "Квадрат 14x14 мм", "type": "metal", "price": 88, "unit": "м", "notes": "Квадрат стальной"},
    {"name": "Квадрат 16x16 мм", "type": "metal", "price": 115, "unit": "м", "notes": "Квадрат стальной"},
    {"name": "Квадрат 20x20 мм", "type": "metal", "price": 180, "unit": "м", "notes": "Квадрат стальной"},
    
    # Арматура
    {"name": "Арматура А400 8 мм", "type": "metal", "price": 28, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 10 мм", "type": "metal", "price": 45, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 12 мм", "type": "metal", "price": 65, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 14 мм", "type": "metal", "price": 88, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 16 мм", "type": "metal", "price": 115, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 18 мм", "type": "metal", "price": 145, "unit": "м", "notes": "Арматура рифленая"},
    {"name": "Арматура А400 20 мм", "type": "metal", "price": 180, "unit": "м", "notes": "Арматура рифленая"},
    
    # Листовой металл
    {"name": "Лист г/к 2 мм", "type": "metal", "price": 1800, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 3 мм", "type": "metal", "price": 2700, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 4 мм", "type": "metal", "price": 3600, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 5 мм", "type": "metal", "price": 4500, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 6 мм", "type": "metal", "price": 5400, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 8 мм", "type": "metal", "price": 7200, "unit": "м2", "notes": "Лист горячекатаный"},
    {"name": "Лист г/к 10 мм", "type": "metal", "price": 9000, "unit": "м2", "notes": "Лист горячекатаный"},
    
    # Дерево
    {"name": "Доска сосна 40 мм", "type": "wood", "price": 25000, "unit": "м3", "notes": "Строганая"},
    {"name": "Фанера 18 мм", "type": "wood", "price": 1800, "unit": "м2", "notes": "Березовая"},
    {"name": "Фанера 12 мм", "type": "wood", "price": 1200, "unit": "м2", "notes": "Березовая"},
    {"name": "МДФ 16 мм", "type": "wood", "price": 850, "unit": "м2", "notes": ""},
    {"name": "МДФ 19 мм", "type": "wood", "price": 1050, "unit": "м2", "notes": ""},
    {"name": "ЛДСП 16 мм", "type": "wood", "price": 650, "unit": "м2", "notes": ""},
    
    # Краска
    {"name": "Краска порошковая RAL 9005", "type": "paint", "price": 650, "unit": "кг", "notes": "Черная матовая"},
    {"name": "Краска порошковая RAL 9016", "type": "paint", "price": 650, "unit": "кг", "notes": "Белая"},
    {"name": "Краска порошковая RAL 7016", "type": "paint", "price": 680, "unit": "кг", "notes": "Антрацит"},
    {"name": "Грунт ГФ-021", "type": "paint", "price": 180, "unit": "кг", "notes": "Красно-коричневый"},
    
    # Ткани
    {"name": "Ткань велюр", "type": "fabric", "price": 1200, "unit": "м", "notes": "Мебельная"},
    {"name": "Ткань рогожка", "type": "fabric", "price": 850, "unit": "м", "notes": "Мебельная"},
    {"name": "Кожзам", "type": "fabric", "price": 950, "unit": "м", "notes": ""},
    {"name": "Натуральная кожа", "type": "fabric", "price": 4500, "unit": "м", "notes": ""},
    {"name": "Поролон 50 мм", "type": "fabric", "price": 450, "unit": "м2", "notes": "Плотность 25"},
    {"name": "Синтепон 200г", "type": "fabric", "price": 120, "unit": "м2", "notes": ""},
]

MASTERS_DATA = [
    {"name": "Иванов Алексей Петрович", "phone": "+7 (903) 123-45-67", "specialization": "welding", "hourly_rate": 800, "notes": "Опыт 15 лет, аргонная сварка"},
    {"name": "Петров Сергей Николаевич", "phone": "+7 (905) 234-56-78", "specialization": "welding", "hourly_rate": 700, "notes": "Полуавтомат, MIG/MAG"},
    {"name": "Сидоров Михаил Александрович", "phone": "+7 (906) 345-67-89", "specialization": "painting", "hourly_rate": 600, "notes": "Порошковая покраска"},
    {"name": "Козлов Дмитрий Владимирович", "phone": "+7 (909) 456-78-90", "specialization": "woodwork", "hourly_rate": 750, "notes": "Столяр-краснодеревщик"},
    {"name": "Федоров Андрей Игоревич", "phone": "+7 (912) 567-89-01", "specialization": "woodwork", "hourly_rate": 650, "notes": "Работа с массивом"},
    {"name": "Смирнов Владимир Олегович", "phone": "+7 (915) 678-90-12", "specialization": "upholstery", "hourly_rate": 700, "notes": "Перетяжка мебели"},
    {"name": "Морозов Евгений Сергеевич", "phone": "+7 (918) 789-01-23", "specialization": "universal", "hourly_rate": 850, "notes": "Универсальный мастер"},
]


async def seed_materials():
    print("Clearing existing materials...")
    await db.materials.delete_many({})
    
    print(f"Seeding {len(MATERIALS_DATA)} materials...")
    for i, material in enumerate(MATERIALS_DATA):
        material_doc = {
            "id": f"mat_{int(datetime.now(timezone.utc).timestamp()*1000) + i}",
            "name": material["name"],
            "type": material["type"],
            "price": material["price"],
            "unit": material["unit"],
            "notes": material["notes"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.materials.insert_one(material_doc)
    
    print("Materials seeded successfully!")


async def seed_masters():
    print("Clearing existing masters...")
    await db.masters.delete_many({})
    
    print(f"Seeding {len(MASTERS_DATA)} masters...")
    for i, master in enumerate(MASTERS_DATA):
        master_doc = {
            "id": f"master_{int(datetime.now(timezone.utc).timestamp()*1000) + i}",
            "name": master["name"],
            "phone": master["phone"],
            "specialization": master["specialization"],
            "hourly_rate": master["hourly_rate"],
            "notes": master["notes"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.masters.insert_one(master_doc)
    
    print("Masters seeded successfully!")


async def main():
    await seed_materials()
    await seed_masters()
    print("\nDatabase seeding completed!")


if __name__ == "__main__":
    asyncio.run(main())
