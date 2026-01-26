import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(ROOT_DIR / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_clients():
    print("Добавление тестовых заказчиков...")
    
    clients = [
        {
            "id": "client_1",
            "name": "ООО Офис Групп",
            "legal_name": "Общество с ограниченной ответственностью 'Офис Групп'",
            "inn": "7743012345",
            "kpp": "774301001",
            "legal_address": "г. Москва, ул. Ленина, д. 10, офис 5",
            "actual_address": "г. Москва, ул. Ленина, д. 10, офис 5",
            "bank_name": "ПАО Сбербанк",
            "bik": "044525225",
            "account_number": "40702810838000012345",
            "contact_person": "Иванов Иван Иванович",
            "phone": "+7 (495) 123-45-67",
            "email": "info@officegroup.ru",
            "payment_stages": [],
            "notes": "Крупный постоянный клиент, скидка 5%",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "client_2",
            "name": "ИП Петров А.В.",
            "legal_name": "Индивидуальный предприниматель Петров Алексей Владимирович",
            "inn": "772012345678",
            "kpp": None,
            "legal_address": "г. Москва, ул. Пушкина, д. 25, кв. 12",
            "actual_address": "г. Москва, ул. Пушкина, д. 25, кв. 12",
            "bank_name": "ВТБ",
            "bik": "044525187",
            "account_number": "40802810900000067890",
            "contact_person": "Петров Алексей Владимирович",
            "phone": "+7 (916) 234-56-78",
            "email": "petrov@example.com",
            "payment_stages": [],
            "notes": "Работает без НДС",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "client_3",
            "name": "Кафе Центральное",
            "legal_name": "ООО 'Кафе Центральное'",
            "inn": "7705123456",
            "kpp": "770501001",
            "legal_address": "г. Москва, Тверская ул., д. 7",
            "actual_address": "г. Москва, Тверская ул., д. 7",
            "bank_name": "Альфа-Банк",
            "bik": "044525593",
            "account_number": "40702810501230000789",
            "contact_person": "Смирнова Мария Петровна",
            "phone": "+7 (495) 987-65-43",
            "email": "info@central-cafe.ru",
            "payment_stages": [],
            "notes": "Требуется быстрая доставка",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "client_4",
            "name": "ООО СтройИнвест",
            "legal_name": "Общество с ограниченной ответственностью 'СтройИнвест'",
            "inn": "7712345678",
            "kpp": "771201001",
            "legal_address": "г. Москва, проспект Мира, д. 150, стр. 2",
            "actual_address": "г. Москва, проспект Мира, д. 150, стр. 2",
            "bank_name": "Газпромбанк",
            "bik": "044525823",
            "account_number": "40702810200000098765",
            "contact_person": "Кузнецов Сергей Николаевич",
            "phone": "+7 (499) 111-22-33",
            "email": "kuznetsov@stroyinvest.ru",
            "payment_stages": [],
            "notes": "Оплата по факту выполнения работ",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "client_5",
            "name": "Анна Волкова",
            "legal_name": None,
            "inn": None,
            "kpp": None,
            "legal_address": None,
            "actual_address": "г. Москва, ул. Арбат, д. 45, кв. 78",
            "bank_name": None,
            "bik": None,
            "account_number": None,
            "contact_person": "Волкова Анна Сергеевна",
            "phone": "+7 (903) 555-77-99",
            "email": "anna.volkova@mail.ru",
            "payment_stages": [],
            "notes": "Частный клиент, оплата наличными",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.clients.insert_many(clients)
    print(f"✓ Добавлено {len(clients)} заказчиков")
    
    # Update existing orders with client IDs
    print("\nОбновление связей заказов с заказчиками...")
    await db.orders.update_one(
        {"client": "Иван Петров"},
        {"$set": {"client": "ООО Офис Групп"}}
    )
    await db.orders.update_one(
        {"client": "ООО Офис Групп"},
        {"$set": {"client": "ООО Офис Групп"}}
    )
    await db.orders.update_one(
        {"client": "Марина Соколова"},
        {"$set": {"client": "Анна Волкова"}}
    )
    await db.orders.update_one(
        {"client": "Кафе Центральное"},
        {"$set": {"client": "Кафе Центральное"}}
    )
    print("✓ Связи обновлены")
    
    print(f"\n✓ Всего заказчиков в базе: {await db.clients.count_documents({})}")

if __name__ == "__main__":
    print("Запуск скрипта добавления заказчиков...\n")
    asyncio.run(seed_clients())
    client.close()
    print("\nГотово!")
