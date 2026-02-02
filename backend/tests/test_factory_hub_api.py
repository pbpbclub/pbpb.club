"""
Factory Hub API Tests - Testing all CRUD operations for Orders, Clients, Materials
and the multi-step order creation wizard functionality
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndStatistics:
    """Health check and statistics endpoint tests"""
    
    def test_statistics_endpoint(self):
        """Test statistics endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/statistics")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "active_orders" in data
        assert "completed_orders" in data
        assert "total_revenue" in data
        print(f"Statistics: {data}")


class TestClientsCRUD:
    """Client CRUD operations tests"""
    
    def test_get_clients_list(self):
        """Test getting list of clients"""
        response = requests.get(f"{BASE_URL}/api/clients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} clients")
    
    def test_create_client(self):
        """Test creating a new client"""
        client_data = {
            "name": "TEST_Client_" + str(int(time.time())),
            "inn": "1234567890",
            "phone": "+7 999 123 4567",
            "email": "test@example.com",
            "contact_person": "Иван Иванов"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == client_data["name"]
        assert data["inn"] == client_data["inn"]
        assert "id" in data
        print(f"Created client: {data['id']}")
        return data["id"]
    
    def test_create_and_get_client(self):
        """Test creating a client and verifying persistence"""
        # Create client
        client_data = {
            "name": "TEST_Verify_Client_" + str(int(time.time())),
            "inn": "9876543210",
            "phone": "+7 999 987 6543"
        }
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert create_response.status_code == 200
        created = create_response.json()
        client_id = created["id"]
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == client_data["name"]
        assert fetched["inn"] == client_data["inn"]
        print(f"Client verified: {client_id}")
    
    def test_update_client(self):
        """Test updating a client"""
        # First create a client
        client_data = {"name": "TEST_Update_Client_" + str(int(time.time()))}
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Update client
        update_data = {"name": "TEST_Updated_Client_Name", "phone": "+7 111 222 3333"}
        update_response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == update_data["name"]
        assert fetched["phone"] == update_data["phone"]
        print(f"Client updated: {client_id}")
    
    def test_delete_client(self):
        """Test deleting a client"""
        # Create client to delete
        client_data = {"name": "TEST_Delete_Client_" + str(int(time.time()))}
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Delete client
        delete_response = requests.delete(f"{BASE_URL}/api/clients/{client_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 404
        print(f"Client deleted: {client_id}")
    
    def test_search_clients(self):
        """Test searching clients by name"""
        response = requests.get(f"{BASE_URL}/api/clients", params={"search": "TEST"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Search found {len(data)} clients")


class TestMaterialsCRUD:
    """Material CRUD operations tests"""
    
    def test_get_materials_list(self):
        """Test getting list of materials"""
        response = requests.get(f"{BASE_URL}/api/materials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} materials")
    
    def test_create_material(self):
        """Test creating a new material"""
        material_data = {
            "name": "TEST_Material_" + str(int(time.time())),
            "type": "metal",
            "price": 1500.0,
            "unit": "м",
            "notes": "Test material"
        }
        response = requests.post(f"{BASE_URL}/api/materials", json=material_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == material_data["name"]
        assert data["type"] == material_data["type"]
        assert data["price"] == material_data["price"]
        assert "id" in data
        print(f"Created material: {data['id']}")
        return data["id"]
    
    def test_filter_materials_by_type(self):
        """Test filtering materials by type"""
        # Create a metal material first
        material_data = {
            "name": "TEST_Metal_" + str(int(time.time())),
            "type": "metal",
            "price": 2000.0,
            "unit": "кг"
        }
        requests.post(f"{BASE_URL}/api/materials", json=material_data)
        
        # Filter by type
        response = requests.get(f"{BASE_URL}/api/materials", params={"type": "metal"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for material in data:
            assert material["type"] == "metal"
        print(f"Found {len(data)} metal materials")
    
    def test_update_material(self):
        """Test updating a material"""
        # Create material
        material_data = {
            "name": "TEST_Update_Material_" + str(int(time.time())),
            "type": "wood",
            "price": 500.0,
            "unit": "м2"
        }
        create_response = requests.post(f"{BASE_URL}/api/materials", json=material_data)
        assert create_response.status_code == 200
        material_id = create_response.json()["id"]
        
        # Update material
        update_data = {
            "name": "TEST_Updated_Material",
            "type": "wood",
            "price": 750.0,
            "unit": "м2"
        }
        update_response = requests.put(f"{BASE_URL}/api/materials/{material_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["price"] == 750.0
        print(f"Material updated: {material_id}")
    
    def test_delete_material(self):
        """Test deleting a material"""
        # Create material to delete
        material_data = {
            "name": "TEST_Delete_Material_" + str(int(time.time())),
            "type": "fabric",
            "price": 300.0,
            "unit": "м"
        }
        create_response = requests.post(f"{BASE_URL}/api/materials", json=material_data)
        assert create_response.status_code == 200
        material_id = create_response.json()["id"]
        
        # Delete material
        delete_response = requests.delete(f"{BASE_URL}/api/materials/{material_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion - should get 404
        get_response = requests.get(f"{BASE_URL}/api/materials")
        materials = get_response.json()
        material_ids = [m["id"] for m in materials]
        assert material_id not in material_ids
        print(f"Material deleted: {material_id}")


class TestOrdersCRUD:
    """Order CRUD operations tests"""
    
    def test_get_orders_list(self):
        """Test getting list of orders"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} orders")
    
    def test_create_order(self):
        """Test creating a new order"""
        order_data = {
            "name": "TEST_Order_" + str(int(time.time())),
            "client": "Test Client",
            "planned_completion_date": "2026-02-15",
            "notes": "Test order notes"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == order_data["name"]
        assert data["client"] == order_data["client"]
        assert data["status"] == "draft"
        assert "id" in data
        print(f"Created order: {data['id']}")
        return data["id"]
    
    def test_create_and_get_order(self):
        """Test creating an order and verifying persistence"""
        # Create order
        order_data = {
            "name": "TEST_Verify_Order_" + str(int(time.time())),
            "client": "Verification Client",
            "planned_completion_date": "2026-03-01"
        }
        create_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert create_response.status_code == 200
        created = create_response.json()
        order_id = created["id"]
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == order_data["name"]
        assert fetched["client"] == order_data["client"]
        print(f"Order verified: {order_id}")
    
    def test_update_order_status(self):
        """Test updating order status"""
        # Create order
        order_data = {
            "name": "TEST_Status_Order_" + str(int(time.time())),
            "client": "Status Test Client"
        }
        create_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        
        # Update status
        update_data = {"status": "production"}
        update_response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["status"] == "production"
        print(f"Order status updated: {order_id}")
    
    def test_delete_order(self):
        """Test deleting an order"""
        # Create order to delete
        order_data = {
            "name": "TEST_Delete_Order_" + str(int(time.time())),
            "client": "Delete Test Client"
        }
        create_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        
        # Delete order
        delete_response = requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 404
        print(f"Order deleted: {order_id}")
    
    def test_filter_orders_by_status(self):
        """Test filtering orders by status"""
        response = requests.get(f"{BASE_URL}/api/orders", params={"status": "draft"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for order in data:
            assert order["status"] == "draft"
        print(f"Found {len(data)} draft orders")


class TestOrderStages:
    """Order stages and cost items tests"""
    
    def test_add_stage_to_order(self):
        """Test adding a production stage to an order"""
        # Create order first
        order_data = {
            "name": "TEST_Stage_Order_" + str(int(time.time())),
            "client": "Stage Test Client"
        }
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert order_response.status_code == 200
        order_id = order_response.json()["id"]
        
        # Add stage
        stage_data = {
            "type": "welding",
            "status": "not_started",
            "master": "Иван Сварщиков"
        }
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json=stage_data)
        assert stage_response.status_code == 200
        stage = stage_response.json()
        assert stage["type"] == "welding"
        assert "id" in stage
        print(f"Stage added: {stage['id']}")
        return order_id, stage["id"]
    
    def test_add_cost_item_to_stage(self):
        """Test adding cost items to a stage"""
        # Create order and stage
        order_data = {
            "name": "TEST_Cost_Order_" + str(int(time.time())),
            "client": "Cost Test Client"
        }
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = order_response.json()["id"]
        
        stage_data = {"type": "painting", "status": "not_started"}
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json=stage_data)
        stage_id = stage_response.json()["id"]
        
        # Add cost item
        cost_data = {
            "name": "Покрасочные работы",
            "quantity": 8,
            "unit": "ч",
            "price_per_unit": 500
        }
        cost_response = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/stages/{stage_id}/costs",
            json=cost_data
        )
        assert cost_response.status_code == 200
        cost = cost_response.json()
        assert cost["name"] == cost_data["name"]
        assert cost["total"] == 8 * 500  # quantity * price_per_unit
        print(f"Cost item added with total: {cost['total']}")
    
    def test_order_cost_calculation(self):
        """Test that order costs are calculated correctly after adding cost items"""
        # Create order
        order_data = {
            "name": "TEST_Calc_Order_" + str(int(time.time())),
            "client": "Calculation Test Client"
        }
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        order_id = order_response.json()["id"]
        
        # Add stage
        stage_data = {"type": "woodwork", "status": "not_started"}
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json=stage_data)
        stage_id = stage_response.json()["id"]
        
        # Add cost items
        cost1 = {"name": "Столярные работы", "quantity": 10, "unit": "ч", "price_per_unit": 600}
        cost2 = {"name": "Материалы", "quantity": 5, "unit": "шт", "price_per_unit": 1000}
        
        requests.post(f"{BASE_URL}/api/orders/{order_id}/stages/{stage_id}/costs", json=cost1)
        requests.post(f"{BASE_URL}/api/orders/{order_id}/stages/{stage_id}/costs", json=cost2)
        
        # Get order and verify calculations
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        order = get_response.json()
        
        expected_actual_cost = (10 * 600) + (5 * 1000)  # 6000 + 5000 = 11000
        expected_sale_price = expected_actual_cost * 1.6  # 17600
        expected_cash_price = expected_sale_price  # 17600
        expected_cashless_price = expected_cash_price / 0.87  # ~20229.89
        
        assert order["actual_cost"] == expected_actual_cost
        assert order["sale_price"] == expected_sale_price
        assert order["cash_price"] == expected_cash_price
        assert abs(order["cashless_price"] - expected_cashless_price) < 1  # Allow small float difference
        print(f"Cost calculations verified: actual={order['actual_cost']}, sale={order['sale_price']}")
    
    def test_multiple_stages_workflow(self):
        """Test creating order with multiple stages (simulating wizard flow)"""
        # Create order
        order_data = {
            "name": "TEST_Wizard_Order_" + str(int(time.time())),
            "client": "Wizard Test Client",
            "planned_completion_date": "2026-04-01",
            "notes": "Приоритет: normal. Номер: ORD-2026-0001"
        }
        order_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert order_response.status_code == 200
        order_id = order_response.json()["id"]
        
        # Add welding stage
        welding_stage = {"type": "welding", "status": "not_started", "master": "Сварщик"}
        welding_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json=welding_stage)
        welding_id = welding_response.json()["id"]
        
        # Add painting stage
        painting_stage = {"type": "painting", "status": "not_started", "master": "Маляр"}
        painting_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json=painting_stage)
        painting_id = painting_response.json()["id"]
        
        # Add cost items to welding
        requests.post(f"{BASE_URL}/api/orders/{order_id}/stages/{welding_id}/costs", json={
            "name": "Сварочные работы", "quantity": 5, "unit": "ч", "price_per_unit": 700
        })
        
        # Add cost items to painting
        requests.post(f"{BASE_URL}/api/orders/{order_id}/stages/{painting_id}/costs", json={
            "name": "Покраска", "quantity": 3, "unit": "ч", "price_per_unit": 500
        })
        
        # Verify order has all stages
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        order = get_response.json()
        
        assert len(order["stages"]) == 2
        assert order["actual_cost"] == (5 * 700) + (3 * 500)  # 3500 + 1500 = 5000
        print(f"Multi-stage order created with {len(order['stages'])} stages, cost: {order['actual_cost']}")


class TestCalendarAPI:
    """Calendar API tests"""
    
    def test_calendar_endpoint(self):
        """Test calendar endpoint with date range"""
        response = requests.get(f"{BASE_URL}/api/calendar", params={
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Calendar returned {len(data)} events")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup clients
    try:
        clients_response = requests.get(f"{BASE_URL}/api/clients")
        if clients_response.status_code == 200:
            for client in clients_response.json():
                if client["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/clients/{client['id']}")
    except:
        pass
    
    # Cleanup materials
    try:
        materials_response = requests.get(f"{BASE_URL}/api/materials")
        if materials_response.status_code == 200:
            for material in materials_response.json():
                if material["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/materials/{material['id']}")
    except:
        pass
    
    # Cleanup orders
    try:
        orders_response = requests.get(f"{BASE_URL}/api/orders")
        if orders_response.status_code == 200:
            for order in orders_response.json():
                if order["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/orders/{order['id']}")
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
