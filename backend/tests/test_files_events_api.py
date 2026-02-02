"""
Factory Hub API Tests - Files, Events, and Stage Status Update APIs
Tests for the new features: file attachments, event logging, and stage status updates
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test order ID for testing
TEST_ORDER_ID = "ord_1770030656768"


class TestFilesAPI:
    """Tests for /api/orders/{order_id}/files endpoints"""
    
    def test_get_files_list(self):
        """Test GET /api/orders/{order_id}/files returns list"""
        response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} files for order")
    
    def test_get_files_for_nonexistent_order(self):
        """Test GET files for non-existent order returns 404"""
        response = requests.get(f"{BASE_URL}/api/orders/nonexistent_order/files")
        assert response.status_code == 404
    
    def test_upload_file_metadata(self):
        """Test POST /api/orders/{order_id}/files uploads file metadata"""
        file_data = {
            "name": f"TEST_file_{int(time.time())}.pdf",
            "file_type": "document",
            "size": 12345,
            "mime_type": "application/pdf",
            "url": "https://example.com/test.pdf",
            "uploaded_by": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == file_data["name"]
        assert data["file_type"] == file_data["file_type"]
        assert data["size"] == file_data["size"]
        assert data["order_id"] == TEST_ORDER_ID
        assert "id" in data
        print(f"Uploaded file: {data['id']}")
        return data["id"]
    
    def test_upload_file_creates_event(self):
        """Test that uploading a file creates an event"""
        # Upload file
        file_data = {
            "name": f"TEST_event_file_{int(time.time())}.jpg",
            "file_type": "image",
            "size": 5000,
            "uploaded_by": "Event Test User"
        }
        upload_response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert upload_response.status_code == 200
        
        # Check events
        events_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events")
        assert events_response.status_code == 200
        events = events_response.json()
        
        # Find the file_uploaded event
        file_events = [e for e in events if e["event_type"] == "file_uploaded" and file_data["name"] in e["message"]]
        assert len(file_events) > 0, "File upload event not found"
        print(f"File upload event created: {file_events[0]['message']}")
    
    def test_delete_file(self):
        """Test DELETE /api/orders/{order_id}/files/{file_id} deletes file"""
        # First upload a file
        file_data = {
            "name": f"TEST_delete_file_{int(time.time())}.txt",
            "file_type": "other",
            "size": 100
        }
        upload_response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["id"]
        
        # Delete the file
        delete_response = requests.delete(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files/{file_id}")
        assert delete_response.status_code == 200
        
        # Verify file is deleted
        files_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files")
        files = files_response.json()
        file_ids = [f["id"] for f in files]
        assert file_id not in file_ids, "File was not deleted"
        print(f"File deleted: {file_id}")
    
    def test_delete_nonexistent_file(self):
        """Test DELETE non-existent file returns 404"""
        response = requests.delete(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files/nonexistent_file")
        assert response.status_code == 404


class TestEventsAPI:
    """Tests for /api/orders/{order_id}/events endpoints"""
    
    def test_get_events_list(self):
        """Test GET /api/orders/{order_id}/events returns list"""
        response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} events for order")
    
    def test_get_events_for_nonexistent_order(self):
        """Test GET events for non-existent order returns 404"""
        response = requests.get(f"{BASE_URL}/api/orders/nonexistent_order/events")
        assert response.status_code == 404
    
    def test_create_event(self):
        """Test POST /api/orders/{order_id}/events creates event"""
        event_data = {
            "event_type": "comment",
            "message": f"TEST comment at {int(time.time())}",
            "user": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        data = response.json()
        assert data["event_type"] == event_data["event_type"]
        assert data["message"] == event_data["message"]
        assert data["user"] == event_data["user"]
        assert data["order_id"] == TEST_ORDER_ID
        assert "id" in data
        assert "created_at" in data
        print(f"Created event: {data['id']}")
    
    def test_create_event_with_details(self):
        """Test creating event with details field"""
        event_data = {
            "event_type": "updated",
            "message": "Order updated with details",
            "details": {"field": "status", "old_value": "draft", "new_value": "production"},
            "user": "Admin"
        }
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        data = response.json()
        assert data["details"] == event_data["details"]
        print(f"Created event with details: {data['id']}")
    
    def test_events_sorted_by_date_desc(self):
        """Test that events are returned sorted by created_at descending"""
        response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) >= 2:
            # Check that first event is newer than second
            first_date = events[0]["created_at"]
            second_date = events[1]["created_at"]
            assert first_date >= second_date, "Events not sorted by date descending"
            print("Events are sorted by date descending")


class TestStageStatusUpdate:
    """Tests for PUT /api/orders/{order_id}/stages/{stage_id}/status endpoint"""
    
    def test_update_stage_status(self):
        """Test PUT /api/orders/{order_id}/stages/{stage_id}/status updates status"""
        # First get the order to find a stage
        order_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}")
        assert order_response.status_code == 200
        order = order_response.json()
        
        if not order.get("stages"):
            pytest.skip("No stages in test order")
        
        stage_id = order["stages"][0]["id"]
        
        # Update status to completed
        response = requests.put(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/stages/{stage_id}/status?status=completed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["stage_id"] == stage_id
        print(f"Stage status updated to: {data['status']}")
    
    def test_update_stage_status_logs_event(self):
        """Test that updating stage status logs an event"""
        # Get order and stage
        order_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}")
        order = order_response.json()
        
        if not order.get("stages"):
            pytest.skip("No stages in test order")
        
        stage_id = order["stages"][0]["id"]
        
        # Update status
        requests.put(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/stages/{stage_id}/status?status=not_started")
        
        # Check events
        events_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events")
        events = events_response.json()
        
        # Find stage_updated event
        stage_events = [e for e in events if e["event_type"] == "stage_updated"]
        assert len(stage_events) > 0, "Stage update event not found"
        print(f"Stage update event found: {stage_events[0]['message']}")
    
    def test_update_nonexistent_stage(self):
        """Test updating non-existent stage returns 404"""
        response = requests.put(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/stages/nonexistent_stage/status?status=completed")
        assert response.status_code == 404
    
    def test_update_stage_in_nonexistent_order(self):
        """Test updating stage in non-existent order returns 404"""
        response = requests.put(f"{BASE_URL}/api/orders/nonexistent_order/stages/some_stage/status?status=completed")
        assert response.status_code == 404


class TestFileTypes:
    """Tests for different file types"""
    
    def test_upload_document_type(self):
        """Test uploading document file type"""
        file_data = {"name": "TEST_doc.pdf", "file_type": "document", "size": 1000}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        assert response.json()["file_type"] == "document"
    
    def test_upload_image_type(self):
        """Test uploading image file type"""
        file_data = {"name": "TEST_img.jpg", "file_type": "image", "size": 2000}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        assert response.json()["file_type"] == "image"
    
    def test_upload_invoice_type(self):
        """Test uploading invoice file type"""
        file_data = {"name": "TEST_invoice.pdf", "file_type": "invoice", "size": 3000}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        assert response.json()["file_type"] == "invoice"
    
    def test_upload_contract_type(self):
        """Test uploading contract file type"""
        file_data = {"name": "TEST_contract.pdf", "file_type": "contract", "size": 4000}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        assert response.json()["file_type"] == "contract"
    
    def test_upload_drawing_type(self):
        """Test uploading drawing file type"""
        file_data = {"name": "TEST_drawing.dwg", "file_type": "drawing", "size": 5000}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files", json=file_data)
        assert response.status_code == 200
        assert response.json()["file_type"] == "drawing"


class TestEventTypes:
    """Tests for different event types"""
    
    def test_create_created_event(self):
        """Test creating 'created' event type"""
        event_data = {"event_type": "created", "message": "Order created", "user": "System"}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        assert response.json()["event_type"] == "created"
    
    def test_create_updated_event(self):
        """Test creating 'updated' event type"""
        event_data = {"event_type": "updated", "message": "Order updated", "user": "Admin"}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        assert response.json()["event_type"] == "updated"
    
    def test_create_status_changed_event(self):
        """Test creating 'status_changed' event type"""
        event_data = {"event_type": "status_changed", "message": "Status changed to production", "user": "Manager"}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        assert response.json()["event_type"] == "status_changed"
    
    def test_create_comment_event(self):
        """Test creating 'comment' event type"""
        event_data = {"event_type": "comment", "message": "This is a comment", "user": "User"}
        response = requests.post(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/events", json=event_data)
        assert response.status_code == 200
        assert response.json()["event_type"] == "comment"


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed files after all tests"""
    yield
    # Cleanup test files
    try:
        files_response = requests.get(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files")
        if files_response.status_code == 200:
            for file in files_response.json():
                if file["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/orders/{TEST_ORDER_ID}/files/{file['id']}")
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
