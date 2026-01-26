import requests
import sys
import json
from datetime import datetime, timedelta

class FurnitureAPITester:
    def __init__(self, base_url="https://furniture-factory.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {
            'orders': [],
            'materials': [],
            'stages': [],
            'costs': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_statistics(self):
        """Test statistics endpoint"""
        success, data = self.run_test(
            "Get Statistics",
            "GET",
            "statistics",
            200
        )
        if success:
            required_fields = ['total_orders', 'active_orders', 'completed_orders', 'total_revenue']
            for field in required_fields:
                if field not in data:
                    print(f"❌ Missing field in statistics: {field}")
                    return False
            print(f"   Statistics: {data}")
        return success

    def test_materials_crud(self):
        """Test materials CRUD operations"""
        print("\n📦 Testing Materials CRUD...")
        
        # Create material
        material_data = {
            "name": "Test Steel Pipe",
            "type": "metal",
            "price": 150.50,
            "unit": "м",
            "notes": "Test material for API testing"
        }
        
        success, created_material = self.run_test(
            "Create Material",
            "POST",
            "materials",
            200,
            data=material_data
        )
        
        if not success:
            return False
            
        material_id = created_material.get('id')
        self.created_items['materials'].append(material_id)
        
        # Get all materials
        success, materials = self.run_test(
            "Get All Materials",
            "GET",
            "materials",
            200
        )
        
        if not success:
            return False
            
        # Get materials by type filter
        success, filtered_materials = self.run_test(
            "Get Materials by Type",
            "GET",
            "materials",
            200,
            params={"type": "metal"}
        )
        
        if not success:
            return False
            
        # Update material
        updated_data = {
            "name": "Updated Steel Pipe",
            "type": "metal",
            "price": 175.00,
            "unit": "м",
            "notes": "Updated test material"
        }
        
        success, updated_material = self.run_test(
            "Update Material",
            "PUT",
            f"materials/{material_id}",
            200,
            data=updated_data
        )
        
        if not success:
            return False
            
        # Delete material
        success, _ = self.run_test(
            "Delete Material",
            "DELETE",
            f"materials/{material_id}",
            200
        )
        
        if success:
            self.created_items['materials'].remove(material_id)
            
        return success

    def test_orders_crud(self):
        """Test orders CRUD operations"""
        print("\n📋 Testing Orders CRUD...")
        
        # Create order
        order_data = {
            "name": "Test Dining Table",
            "client": "Test Client",
            "planned_completion_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "notes": "Test order for API testing"
        }
        
        success, created_order = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success:
            return False
            
        order_id = created_order.get('id')
        self.created_items['orders'].append(order_id)
        
        # Get all orders
        success, orders = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        if not success:
            return False
            
        # Get orders by status filter
        success, filtered_orders = self.run_test(
            "Get Orders by Status",
            "GET",
            "orders",
            200,
            params={"status": "draft"}
        )
        
        if not success:
            return False
            
        # Get orders by client search
        success, searched_orders = self.run_test(
            "Search Orders by Client",
            "GET",
            "orders",
            200,
            params={"client": "Test"}
        )
        
        if not success:
            return False
            
        # Get specific order
        success, order_detail = self.run_test(
            "Get Order Detail",
            "GET",
            f"orders/{order_id}",
            200
        )
        
        if not success:
            return False
            
        # Update order
        update_data = {
            "name": "Updated Dining Table",
            "status": "project"
        }
        
        success, updated_order = self.run_test(
            "Update Order",
            "PUT",
            f"orders/{order_id}",
            200,
            data=update_data
        )
        
        return success, order_id

    def test_stages_and_costs(self, order_id):
        """Test stages and cost items"""
        print("\n🔧 Testing Stages and Cost Items...")
        
        # Add stage to order
        stage_data = {
            "type": "welding",
            "status": "not_started",
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=5)).isoformat(),
            "master": "Test Master",
            "notes": "Test welding stage"
        }
        
        success, created_stage = self.run_test(
            "Add Stage to Order",
            "POST",
            f"orders/{order_id}/stages",
            200,
            data=stage_data
        )
        
        if not success:
            return False
            
        stage_id = created_stage.get('id')
        self.created_items['stages'].append(stage_id)
        
        # Add cost item to stage
        cost_data = {
            "name": "Steel Pipe 25x25",
            "quantity": 10.0,
            "unit": "м",
            "price_per_unit": 150.0
        }
        
        success, created_cost = self.run_test(
            "Add Cost Item to Stage",
            "POST",
            f"orders/{order_id}/stages/{stage_id}/costs",
            200,
            data=cost_data
        )
        
        if not success:
            return False
            
        # Verify cost calculations
        success, updated_order = self.run_test(
            "Get Updated Order with Costs",
            "GET",
            f"orders/{order_id}",
            200
        )
        
        if success:
            actual_cost = updated_order.get('actual_cost', 0)
            sale_price = updated_order.get('sale_price', 0)
            cash_price = updated_order.get('cash_price', 0)
            cashless_price = updated_order.get('cashless_price', 0)
            
            expected_total = cost_data['quantity'] * cost_data['price_per_unit']  # 1500
            expected_sale_price = expected_total * 1.6  # 2400
            expected_cashless_price = expected_sale_price / 0.87  # ~2758.62
            
            print(f"   Cost Calculations:")
            print(f"   Actual Cost: {actual_cost} (Expected: {expected_total})")
            print(f"   Sale Price: {sale_price} (Expected: {expected_sale_price})")
            print(f"   Cash Price: {cash_price} (Expected: {expected_sale_price})")
            print(f"   Cashless Price: {cashless_price} (Expected: {expected_cashless_price:.2f})")
            
            # Verify calculations with tolerance
            tolerance = 0.01
            if (abs(actual_cost - expected_total) < tolerance and
                abs(sale_price - expected_sale_price) < tolerance and
                abs(cash_price - expected_sale_price) < tolerance and
                abs(cashless_price - expected_cashless_price) < tolerance):
                print("✅ Cost calculations are correct")
                return True
            else:
                print("❌ Cost calculations are incorrect")
                return False
                
        return success

    def test_calendar(self):
        """Test calendar endpoint"""
        print("\n📅 Testing Calendar...")
        
        start_date = datetime.now().replace(day=1).isoformat()
        end_date = (datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1).isoformat()
        
        success, calendar_data = self.run_test(
            "Get Calendar Data",
            "GET",
            "calendar",
            200,
            params={
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        if success:
            print(f"   Calendar events found: {len(calendar_data)}")
            
        return success

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created orders (this will also delete stages and costs)
        for order_id in self.created_items['orders']:
            try:
                self.run_test(
                    f"Cleanup Order {order_id}",
                    "DELETE",
                    f"orders/{order_id}",
                    200
                )
            except:
                pass
                
        # Delete created materials
        for material_id in self.created_items['materials']:
            try:
                self.run_test(
                    f"Cleanup Material {material_id}",
                    "DELETE",
                    f"materials/{material_id}",
                    200
                )
            except:
                pass

def main():
    print("🏭 Starting Furniture Production API Tests...")
    print("=" * 60)
    
    tester = FurnitureAPITester()
    
    try:
        # Test statistics
        if not tester.test_statistics():
            print("❌ Statistics test failed, stopping tests")
            return 1
            
        # Test materials CRUD
        if not tester.test_materials_crud():
            print("❌ Materials CRUD test failed, stopping tests")
            return 1
            
        # Test orders CRUD
        success, order_id = tester.test_orders_crud()
        if not success:
            print("❌ Orders CRUD test failed, stopping tests")
            return 1
            
        # Test stages and costs
        if not tester.test_stages_and_costs(order_id):
            print("❌ Stages and costs test failed")
            # Don't stop here, continue with other tests
            
        # Test calendar
        if not tester.test_calendar():
            print("❌ Calendar test failed")
            
    finally:
        # Always cleanup
        tester.cleanup()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())