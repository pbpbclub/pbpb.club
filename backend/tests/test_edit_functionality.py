"""
Test suite for edit functionality in Factory Hub application.
Tests PUT endpoints for orders, clients, and materials.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOrdersEditFunctionality:
    """Test order edit (PUT) functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_order_id = None
        yield
        # Cleanup
        if self.test_order_id:
            try:
                requests.delete(f"{BASE_URL}/api/orders/{self.test_order_id}")
            except:
                pass
    
    def test_create_order_for_edit(self):
        """Create an order to test edit functionality"""
        payload = {
            "name": "TEST_EditOrder",
            "client": "TEST_Client",
            "planned_completion_date": "2026-02-15",
            "notes": "Original notes"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=payload)
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_EditOrder"
        assert data["client"] == "TEST_Client"
        assert data["status"] == "draft"
        
        self.test_order_id = data["id"]
        return data["id"]
    
    def test_update_order_name(self):
        """Test updating order name"""
        # Create order first
        order_id = self.test_create_order_for_edit()
        
        # Update order name
        update_payload = {"name": "TEST_UpdatedOrderName"}
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200, f"Failed to update order: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_UpdatedOrderName"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_UpdatedOrderName"
    
    def test_update_order_client(self):
        """Test updating order client"""
        order_id = self.test_create_order_for_edit()
        
        update_payload = {"client": "TEST_UpdatedClient"}
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["client"] == "TEST_UpdatedClient"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        assert get_response.json()["client"] == "TEST_UpdatedClient"
    
    def test_update_order_status(self):
        """Test updating order status"""
        order_id = self.test_create_order_for_edit()
        
        update_payload = {"status": "production"}
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "production"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "production"
    
    def test_update_order_multiple_fields(self):
        """Test updating multiple order fields at once"""
        order_id = self.test_create_order_for_edit()
        
        update_payload = {
            "name": "TEST_MultiUpdate",
            "client": "TEST_MultiClient",
            "status": "estimation",
            "notes": "Updated notes"
        }
        response = requests.put(f"{BASE_URL}/api/orders/{order_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_MultiUpdate"
        assert data["client"] == "TEST_MultiClient"
        assert data["status"] == "estimation"
        assert data["notes"] == "Updated notes"
    
    def test_update_nonexistent_order(self):
        """Test updating a non-existent order returns 404"""
        update_payload = {"name": "TEST_NonExistent"}
        response = requests.put(f"{BASE_URL}/api/orders/nonexistent_id_12345", json=update_payload)
        assert response.status_code == 404


class TestClientsEditFunctionality:
    """Test client edit (PUT) functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_client_id = None
        yield
        # Cleanup
        if self.test_client_id:
            try:
                requests.delete(f"{BASE_URL}/api/clients/{self.test_client_id}")
            except:
                pass
    
    def test_create_client_for_edit(self):
        """Create a client to test edit functionality"""
        payload = {
            "name": "TEST_EditClient",
            "inn": "1234567890",
            "contact_person": "Иван Иванов",
            "phone": "+7 999 123-45-67",
            "email": "test@example.com",
            "notes": "Original notes"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=payload)
        assert response.status_code == 200, f"Failed to create client: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_EditClient"
        
        self.test_client_id = data["id"]
        return data["id"]
    
    def test_update_client_name(self):
        """Test updating client name"""
        client_id = self.test_create_client_for_edit()
        
        update_payload = {"name": "TEST_UpdatedClientName"}
        response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_payload)
        assert response.status_code == 200, f"Failed to update client: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_UpdatedClientName"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "TEST_UpdatedClientName"
    
    def test_update_client_contact_info(self):
        """Test updating client contact information"""
        client_id = self.test_create_client_for_edit()
        
        update_payload = {
            "contact_person": "Петр Петров",
            "phone": "+7 888 765-43-21",
            "email": "updated@example.com"
        }
        response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["contact_person"] == "Петр Петров"
        assert data["phone"] == "+7 888 765-43-21"
        assert data["email"] == "updated@example.com"
    
    def test_update_client_inn(self):
        """Test updating client INN"""
        client_id = self.test_create_client_for_edit()
        
        update_payload = {"inn": "9876543210"}
        response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["inn"] == "9876543210"
    
    def test_update_nonexistent_client(self):
        """Test updating a non-existent client returns 404"""
        update_payload = {"name": "TEST_NonExistent"}
        response = requests.put(f"{BASE_URL}/api/clients/nonexistent_id_12345", json=update_payload)
        assert response.status_code == 404


class TestMaterialsEditFunctionality:
    """Test material edit (PUT) functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_material_id = None
        yield
        # Cleanup
        if self.test_material_id:
            try:
                requests.delete(f"{BASE_URL}/api/materials/{self.test_material_id}")
            except:
                pass
    
    def test_create_material_for_edit(self):
        """Create a material to test edit functionality"""
        payload = {
            "name": "TEST_EditMaterial",
            "type": "metal",
            "price": 1500.0,
            "unit": "м",
            "notes": "Original notes"
        }
        response = requests.post(f"{BASE_URL}/api/materials", json=payload)
        assert response.status_code == 200, f"Failed to create material: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_EditMaterial"
        
        self.test_material_id = data["id"]
        return data["id"]
    
    def test_update_material_name(self):
        """Test updating material name"""
        material_id = self.test_create_material_for_edit()
        
        update_payload = {
            "name": "TEST_UpdatedMaterialName",
            "type": "metal",
            "price": 1500.0,
            "unit": "м"
        }
        response = requests.put(f"{BASE_URL}/api/materials/{material_id}", json=update_payload)
        assert response.status_code == 200, f"Failed to update material: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_UpdatedMaterialName"
    
    def test_update_material_price(self):
        """Test updating material price"""
        material_id = self.test_create_material_for_edit()
        
        update_payload = {
            "name": "TEST_EditMaterial",
            "type": "metal",
            "price": 2500.0,
            "unit": "м"
        }
        response = requests.put(f"{BASE_URL}/api/materials/{material_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["price"] == 2500.0
    
    def test_update_material_type(self):
        """Test updating material type"""
        material_id = self.test_create_material_for_edit()
        
        update_payload = {
            "name": "TEST_EditMaterial",
            "type": "wood",
            "price": 1500.0,
            "unit": "м"
        }
        response = requests.put(f"{BASE_URL}/api/materials/{material_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["type"] == "wood"
    
    def test_update_material_all_fields(self):
        """Test updating all material fields"""
        material_id = self.test_create_material_for_edit()
        
        update_payload = {
            "name": "TEST_FullUpdate",
            "type": "fabric",
            "price": 3000.0,
            "unit": "м2",
            "notes": "Updated notes"
        }
        response = requests.put(f"{BASE_URL}/api/materials/{material_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_FullUpdate"
        assert data["type"] == "fabric"
        assert data["price"] == 3000.0
        assert data["unit"] == "м2"
        assert data["notes"] == "Updated notes"
    
    def test_update_nonexistent_material(self):
        """Test updating a non-existent material returns 404"""
        update_payload = {
            "name": "TEST_NonExistent",
            "type": "metal",
            "price": 1000.0,
            "unit": "м"
        }
        response = requests.put(f"{BASE_URL}/api/materials/nonexistent_id_12345", json=update_payload)
        assert response.status_code == 404


class TestDeleteFunctionality:
    """Test delete functionality for orders, clients, and materials"""
    
    def test_delete_order(self):
        """Test deleting an order"""
        # Create order
        payload = {"name": "TEST_DeleteOrder", "client": "TEST_Client"}
        create_response = requests.post(f"{BASE_URL}/api/orders", json=payload)
        assert create_response.status_code == 200
        order_id = create_response.json()["id"]
        
        # Delete order
        delete_response = requests.delete(f"{BASE_URL}/api/orders/{order_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 404
    
    def test_delete_client(self):
        """Test deleting a client"""
        # Create client
        payload = {"name": "TEST_DeleteClient"}
        create_response = requests.post(f"{BASE_URL}/api/clients", json=payload)
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Delete client
        delete_response = requests.delete(f"{BASE_URL}/api/clients/{client_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 404
    
    def test_delete_material(self):
        """Test deleting a material"""
        # Create material
        payload = {"name": "TEST_DeleteMaterial", "type": "metal", "price": 1000.0, "unit": "м"}
        create_response = requests.post(f"{BASE_URL}/api/materials", json=payload)
        assert create_response.status_code == 200
        material_id = create_response.json()["id"]
        
        # Delete material
        delete_response = requests.delete(f"{BASE_URL}/api/materials/{material_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/materials")
        materials = get_response.json()
        material_ids = [m["id"] for m in materials]
        assert material_id not in material_ids


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
