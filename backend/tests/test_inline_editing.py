"""
Test inline editing functionality for Factory Hub ERP
Tests the PUT /api/orders/{order_id} endpoint with stages data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestInlineEditing:
    """Test inline editing of order details and stages"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_order_id = None
        yield
        # Cleanup: Delete test order if created
        if self.test_order_id:
            try:
                requests.delete(f"{BASE_URL}/api/orders/{self.test_order_id}")
            except:
                pass
    
    def test_create_order_for_editing(self):
        """Create a test order for inline editing tests"""
        response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Inline_Edit_Order",
            "client": "TEST_Client",
            "planned_completion_date": "2026-03-15",
            "notes": "Test order for inline editing"
        })
        assert response.status_code == 200
        data = response.json()
        self.test_order_id = data["id"]
        assert data["name"] == "TEST_Inline_Edit_Order"
        assert data["client"] == "TEST_Client"
        print(f"Created test order: {self.test_order_id}")
        return data
    
    def test_update_order_basic_fields(self):
        """Test updating basic order fields (name, client, status, notes)"""
        # Create order first
        create_response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Order_Basic_Update",
            "client": "TEST_Original_Client",
            "notes": "Original notes"
        })
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        self.test_order_id = order_id
        
        # Update order
        update_response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json={
            "name": "TEST_Order_Updated_Name",
            "client": "TEST_Updated_Client",
            "status": "production",
            "notes": "Updated notes",
            "planned_completion_date": "2026-04-01"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Order_Updated_Name"
        assert updated["client"] == "TEST_Updated_Client"
        assert updated["status"] == "production"
        assert updated["notes"] == "Updated notes"
        print("SUCCESS: Basic order fields updated correctly")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_Order_Updated_Name"
        assert fetched["client"] == "TEST_Updated_Client"
        print("SUCCESS: Changes persisted to database")
    
    def test_add_stage_to_order(self):
        """Test adding a stage to an order"""
        # Create order
        create_response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Order_With_Stage",
            "client": "TEST_Client"
        })
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        self.test_order_id = order_id
        
        # Add stage
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json={
            "type": "welding",
            "status": "not_started",
            "master": "TEST_Master",
            "start_date": "2026-03-01",
            "end_date": "2026-03-10"
        })
        assert stage_response.status_code == 200
        stage = stage_response.json()
        assert stage["type"] == "welding"
        assert stage["master"] == "TEST_Master"
        print(f"SUCCESS: Stage added with id: {stage['id']}")
        
        # Verify stage is in order
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        order = get_response.json()
        assert len(order["stages"]) == 1
        assert order["stages"][0]["type"] == "welding"
        print("SUCCESS: Stage persisted in order")
    
    def test_update_order_with_stages(self):
        """Test updating order with stages array (inline editing save)"""
        # Create order with stage
        create_response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Order_Stage_Update",
            "client": "TEST_Client"
        })
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        self.test_order_id = order_id
        
        # Add initial stage
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json={
            "type": "welding",
            "status": "not_started",
            "master": "Original_Master"
        })
        assert stage_response.status_code == 200
        stage_id = stage_response.json()["id"]
        
        # Update order with modified stages (simulating inline edit save)
        update_response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json={
            "name": "TEST_Order_Stage_Update_Modified",
            "stages": [
                {
                    "id": stage_id,
                    "type": "welding",
                    "status": "in_progress",
                    "master": "Updated_Master",
                    "start_date": "2026-03-05",
                    "end_date": "2026-03-15",
                    "notes": "Stage updated via inline edit",
                    "cost_items": [],
                    "total_cost": 0
                }
            ]
        })
        assert update_response.status_code == 200
        print("SUCCESS: Order updated with stages array")
        
        # Verify changes
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        order = get_response.json()
        assert order["name"] == "TEST_Order_Stage_Update_Modified"
        assert len(order["stages"]) == 1
        assert order["stages"][0]["status"] == "in_progress"
        assert order["stages"][0]["master"] == "Updated_Master"
        print("SUCCESS: Stage changes persisted correctly")
    
    def test_update_stage_with_cost_items(self):
        """Test updating stages with cost items and verify cost calculations"""
        # Create order
        create_response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Order_Cost_Calc",
            "client": "TEST_Client"
        })
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        self.test_order_id = order_id
        
        # Add stage
        stage_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages", json={
            "type": "welding",
            "status": "not_started"
        })
        assert stage_response.status_code == 200
        stage_id = stage_response.json()["id"]
        
        # Add cost item
        cost_response = requests.post(f"{BASE_URL}/api/orders/{order_id}/stages/{stage_id}/costs", json={
            "name": "Welding work",
            "quantity": 10,
            "unit": "ч",
            "price_per_unit": 500
        })
        assert cost_response.status_code == 200
        cost_item = cost_response.json()
        assert cost_item["total"] == 5000  # 10 * 500
        print("SUCCESS: Cost item added with correct total")
        
        # Verify order costs are updated
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        order = get_response.json()
        assert order["actual_cost"] == 5000
        assert order["sale_price"] == 8000  # 5000 * 1.6
        assert order["cash_price"] == 8000
        print("SUCCESS: Order costs calculated correctly")
        
        # Update via inline edit with modified cost items
        update_response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json={
            "stages": [
                {
                    "id": stage_id,
                    "type": "welding",
                    "status": "in_progress",
                    "cost_items": [
                        {
                            "id": cost_item["id"],
                            "name": "Welding work updated",
                            "quantity": 20,
                            "unit": "ч",
                            "price_per_unit": 600,
                            "total": 12000
                        }
                    ],
                    "total_cost": 12000
                }
            ]
        })
        assert update_response.status_code == 200
        
        # Verify updated costs
        get_response2 = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response2.status_code == 200
        order2 = get_response2.json()
        assert order2["actual_cost"] == 12000
        assert order2["sale_price"] == 19200  # 12000 * 1.6
        print("SUCCESS: Cost recalculation after inline edit works correctly")


class TestOrderStatusTransitions:
    """Test order status changes via inline editing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_order_id = None
        yield
        if self.test_order_id:
            try:
                requests.delete(f"{BASE_URL}/api/orders/{self.test_order_id}")
            except:
                pass
    
    def test_status_transitions(self):
        """Test all valid status transitions"""
        # Create order
        create_response = requests.post(f"{BASE_URL}/api/orders", json={
            "name": "TEST_Status_Transitions",
            "client": "TEST_Client"
        })
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        self.test_order_id = order_id
        
        # Test each status
        statuses = ["draft", "project", "estimation", "production", "completed", "cancelled"]
        for status in statuses:
            update_response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json={
                "status": status
            })
            assert update_response.status_code == 200
            assert update_response.json()["status"] == status
            print(f"SUCCESS: Status changed to '{status}'")


class TestExistingOrderEditing:
    """Test editing the existing order ord_1770030656768"""
    
    def test_get_existing_order(self):
        """Verify existing test order can be fetched"""
        response = requests.get(f"{BASE_URL}/api/orders/ord_1770030656768")
        assert response.status_code == 200
        order = response.json()
        assert order["id"] == "ord_1770030656768"
        print(f"SUCCESS: Fetched existing order: {order['name']}")
    
    def test_existing_order_has_stages(self):
        """Verify existing order has stages"""
        response = requests.get(f"{BASE_URL}/api/orders/ord_1770030656768")
        assert response.status_code == 200
        order = response.json()
        assert "stages" in order
        assert len(order["stages"]) >= 1
        print(f"SUCCESS: Order has {len(order['stages'])} stage(s)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
