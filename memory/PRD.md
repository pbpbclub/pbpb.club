# Factory Hub - Production Management System

## Original Problem Statement
Внутреннее ERP-приложение для мебельного производства. Основные функции:
- Управление заказами
- Производственный календарь
- Расчёт плановой и фактической стоимости
- База материалов и заказчиков

## User Personas
- **Владелец производства** - основной пользователь, управляет заказами, контролирует затраты и маржу
- **Менеджер по продажам** - создаёт заказы, работает с заказчиками
- **Производственный мастер** - отслеживает этапы производства

## Core Requirements

### Data Models
- **Order**: id, name, client, dates, status, stages[], costs
- **Stages**: project, estimation, welding, painting, woodwork, upholstery
- **Material**: name, type, price, unit
- **Client**: name, inn, contact info, payment terms

### Cost Calculation
- Себестоимость = сумма всех затрат по этапам
- Цена продажи = Себестоимость × 1.6 (60% наценка)
- Цена безналичными = Цена наличными / 0.87

### Visual Style (LOCKED)
- **Primary Blue**: #384E84 - кнопки, активные элементы
- **Accent Orange**: #E26A2D - акценты, предупреждения
- **Text Black**: #212121 (RAL 9005) - заголовки, основной текст
- **Gray**: #7A7A79 (RAL 7004) - sidebar, вторичный UI
- **Font**: Inter

---

## What's Been Implemented

### Phase 1 - Core Application (Completed ✅)
- FastAPI backend with MongoDB
- React frontend with Shadcn/UI components
- Dashboard with statistics
- Orders CRUD with list and detail views
- Materials database CRUD
- Clients (Заказчики) CRUD
- Production stages management
- Cost items tracking per stage
- Automatic cost calculation

### Phase 2 - Stitch UI Integration (Completed ✅) - December 2025
**New 5-Step Order Creation Wizard:**
1. **Информация** - название, дедлайн, приоритет
2. **Заказчик** - поиск и выбор клиента с автокомплитом
3. **Состав** - добавление позиций заказа (материалы, количество, цены)
4. **Этапы** - производственные этапы с работами (часы, ставки, расчёт)
5. **Финансы** - сводка (себестоимость, цена, маржа)

**Updated Order Detail Page:**
- 4 финансовые карточки (себестоимость, наличные, безналичные, маржа)
- Раскрывающиеся карточки производственных этапов
- Прогресс-бар выполнения
- Inline редактирование работ и затрат

**CSS Refactoring:**
- Централизованные CSS переменные в index.css
- Утилитарные классы fh-* для Factory Hub стилей
- Устранены конфликты и дублирование стилей

### Phase 3 - Inline Editing Architecture (Completed ✅) - December 2025
**Full Page Inline Editing for Order Detail:**
- Кнопка "Редактировать" переключает всю страницу в режим редактирования
- Синий баннер-индикатор режима редактирования
- Редактируемые поля на всех вкладках:
  - Обзор: название заказа, статус, дедлайн, описание
  - Заказчик: выпадающее меню с поиском из каталога + создание нового
  - Этапы: тип этапа, мастер, статус, даты начала/окончания, работы
- Кнопка "Сохранить всё" отправляет все изменения (включая этапы) в backend
- Кнопка "Отмена" отменяет изменения и выходит из режима редактирования
- Backend автоматически пересчитывает стоимости при обновлении этапов

### Phase 4 - Files, Events & Kanban (Completed ✅) - December 2025
**Files API:**
- GET /api/orders/{order_id}/files - список файлов заказа
- POST /api/orders/{order_id}/files - загрузка метаданных файла
- DELETE /api/orders/{order_id}/files/{file_id} - удаление файла
- Хранение в MongoDB коллекции order_files
- Автоматическое логирование события при загрузке

**Events API:**
- GET /api/orders/{order_id}/events - история событий заказа
- POST /api/orders/{order_id}/events - создание события
- Автоматическое логирование при изменении статуса этапа
- Хранение в MongoDB коллекции order_events

**Kanban Board (Производство):**
- 3 колонки: Не начат, В работе, Завершен
- Drag-and-drop с библиотекой @hello-pangea/dnd
- PUT /api/orders/{order_id}/stages/{stage_id}/status - обновление статуса
- Автоматическое логирование изменения статуса

---

## Prioritized Backlog

### P0 - Critical (Next)
- [x] ~~Backend API для файлов (загрузка/скачивание)~~ ✅
- [x] ~~Backend API для событий заказа~~ ✅
- [x] ~~Drag-and-drop на Kanban-доске~~ ✅

### P1 - High Priority
- [ ] Drag-and-drop перепланирование в календаре
- [ ] Gantt chart view для производственного плана
- [ ] Скачивание PDF заказа

### P2 - Medium Priority
- [ ] Склад - управление остатками материалов
- [ ] Автоматическое резервирование материалов для заказа
- [ ] Уведомления о низком остатке материалов
- [ ] Фильтры для таблиц заказов и клиентов

### P3 - Nice to Have
- [ ] Экспорт данных (CSV/Excel)
- [ ] Импорт прайс-листа материалов
- [ ] Печать сметы и акта выполненных работ
- [ ] Мобильная версия для мастеров
- [ ] Интеграция с 1С
- [ ] SMS/Email уведомления для клиентов

---

## Technical Architecture

```
/app/
├── backend/
│   ├── server.py          # FastAPI app, all API endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx # Main shell, sidebar
│   │   │   └── ui/        # Shadcn components
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── CreateOrder.jsx  # NEW: 5-step wizard
│   │   │   ├── Materials.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   └── Calendar.jsx
│   │   ├── index.css      # CSS variables, theme
│   │   └── App.js         # Routes
│   └── tailwind.config.js
└── scripts/
    ├── seed_data.py
    └── seed_clients.py
```

## API Endpoints
- `GET/POST/DELETE /api/orders` - CRUD заказов
- `GET /api/orders/:id` - детали заказа
- `POST /api/orders/:id/stages` - добавить этап
- `POST /api/orders/:id/stages/:stage_id/costs` - добавить затрату
- `GET/POST/DELETE /api/materials` - CRUD материалов
- `GET/POST/PUT/DELETE /api/clients` - CRUD заказчиков
- `GET /api/statistics` - статистика для дашборда
- `GET /api/calendar` - события для календаря

---

## Known Issues
- Web scraping для цен на металл не работает (заблокировано сайтом)

## Test Reports
- `/app/test_reports/iteration_4.json` - последний отчёт (Files, Events, Kanban)
- Backend: 100% (24/24 tests passed)
- Frontend: 100% (all features working)
