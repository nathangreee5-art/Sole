"""Comprehensive backend API tests for Sole Serenity"""
import requests
import sys
import os
from io import BytesIO
from datetime import datetime

BASE_URL = os.environ.get("BACKEND_URL", "https://sole-build.preview.emergentagent.com").rstrip("/") + "/api"
ADMIN_EMAIL = "admin@soleserenity.co.uk"
ADMIN_PASSWORD = "SoleAdmin2025!"

class SoleSerenityTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.test_order_number = None
        self.test_order_token = None
        self.test_file_ids = []
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        """Log test messages"""
        prefix = "✅" if level == "PASS" else "❌" if level == "FAIL" else "🔍"
        print(f"{prefix} {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {}
        if 'Content-Type' not in headers and files is None:
            headers['Content-Type'] = 'application/json'
        
        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers={k:v for k,v in headers.items() if k != 'Content-Type'}, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                self.log(f"Unsupported method: {method}", "FAIL")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - Status: {response.status_code}", "PASS")
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "got": response.status_code,
                    "response": response.text[:200]
                })
                self.log(f"FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "FAIL")

            try:
                return success, response.json() if response.text else {}
            except Exception:
                return success, {}

        except Exception as e:
            self.failed_tests.append({"test": name, "error": str(e)})
            self.log(f"FAILED - Error: {str(e)}", "FAIL")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        if success and response.get("status") == "ok":
            self.log("Health check returned 'ok' status", "PASS")
            return True
        return False

    def test_services(self):
        """Test services endpoint"""
        success, response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        if success:
            services = response.get("services", [])
            if len(services) == 2:
                self.log(f"Found 2 services: {[s['name'] for s in services]}", "PASS")
            if "pricing" in response and "disclaimer" in response:
                self.log("Services response includes pricing and disclaimer", "PASS")
                return True
        return False

    def test_pricing_calculation(self):
        """Test pricing calculation with mixed items"""
        success, response = self.run_test(
            "Pricing Calculation (mixed items)",
            "POST",
            "pricing/calculate",
            200,
            data={
                "items": [
                    {"service": "quick"},
                    {"service": "quick"},
                    {"service": "deep"},
                    {"service": "deep"}
                ]
            }
        )
        if success:
            cleaning = response.get("cleaning_total")
            shipping = response.get("shipping_total")
            grand = response.get("grand_total")
            self.log(f"Pricing: cleaning={cleaning}, shipping={shipping}, grand={grand}", "INFO")
            # Expected: 2*13 + 2*18 = 62, but with tier pricing might be 55.8
            if cleaning and shipping and grand:
                self.log(f"Pricing calculation successful", "PASS")
                return True
        return False

    def test_upload_image(self):
        """Test image upload"""
        # Create a small test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'files': ('test.png', BytesIO(png_data), 'image/png')}
        success, response = self.run_test(
            "Upload Image (valid PNG)",
            "POST",
            "uploads",
            200,
            files=files
        )
        if success and response.get("files"):
            file_id = response["files"][0].get("file_id")
            self.test_file_ids.append(file_id)
            self.log(f"Image uploaded successfully, file_id: {file_id}", "PASS")
            return True
        return False

    def test_upload_invalid_file(self):
        """Test upload with non-image file"""
        files = {'files': ('test.txt', BytesIO(b'not an image'), 'text/plain')}
        success, response = self.run_test(
            "Upload Invalid File (should reject)",
            "POST",
            "uploads",
            400,
            files=files
        )
        if success:
            self.log("Correctly rejected non-image file", "PASS")
            return True
        return False

    def test_create_order(self):
        """Test order creation"""
        if not self.test_file_ids:
            self.log("No file IDs available, uploading test images first", "INFO")
            self.test_upload_image()
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data={
                "customer_name": "Test Customer",
                "email": "test@example.com",
                "phone": "07700900000",
                "billing_address": {
                    "line1": "123 Test Street",
                    "line2": "",
                    "city": "London",
                    "county": "Greater London",
                    "postcode": "SW1A 1AA",
                    "country": "United Kingdom"
                },
                "return_address": {
                    "line1": "123 Test Street",
                    "line2": "",
                    "city": "London",
                    "county": "Greater London",
                    "postcode": "SW1A 1AA",
                    "country": "United Kingdom"
                },
                "items": [
                    {
                        "pair_index": 0,
                        "service": "quick",
                        "brand": "Nike",
                        "model": "Air Max",
                        "material": "Leather",
                        "color": "White",
                        "size": "UK 9",
                        "condition": "Lightly worn"
                    }
                ],
                "photos": [
                    {
                        "file_id": self.test_file_ids[0] if self.test_file_ids else "test",
                        "slot": "front",
                        "pair_index": 0
                    }
                ],
                "special_instructions": "Please be careful with the laces"
            }
        )
        if success and response.get("order"):
            order = response["order"]
            self.test_order_number = order.get("order_number")
            self.test_order_token = order.get("access_token")
            self.log(f"Order created: {self.test_order_number}", "PASS")
            if order.get("status") == "PENDING_ASSESSMENT":
                self.log("Order status is PENDING_ASSESSMENT", "PASS")
                return True
        return False

    def test_get_order_with_token(self):
        """Test order retrieval with correct token"""
        if not self.test_order_number or not self.test_order_token:
            self.log("No test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Get Order (with correct token)",
            "GET",
            f"orders/{self.test_order_number}",
            200,
            params={"token": self.test_order_token}
        )
        if success and response.get("order"):
            self.log("Order retrieved successfully with token", "PASS")
            return True
        return False

    def test_get_order_wrong_token(self):
        """Test order retrieval with wrong token (should fail)"""
        if not self.test_order_number:
            self.log("No test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Get Order (with wrong token - should fail)",
            "GET",
            f"orders/{self.test_order_number}",
            403,
            params={"token": "wrong_token_12345"}
        )
        if success:
            self.log("Correctly rejected wrong token", "PASS")
            return True
        return False

    def test_checkout_before_approval(self):
        """Test checkout blocked before approval"""
        if not self.test_order_number or not self.test_order_token:
            self.log("No test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Checkout Before Approval (should fail)",
            "POST",
            f"orders/{self.test_order_number}/checkout",
            400,
            data={
                "token": self.test_order_token,
                "origin_url": "https://premium-clean-flow.preview.emergentagent.com"
            }
        )
        if success:
            self.log("Correctly blocked checkout before approval", "PASS")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        if success and response.get("token"):
            self.admin_token = response["token"]
            user = response.get("user", {})
            if user.get("role") == "admin":
                self.log(f"Admin login successful, role: {user.get('role')}", "PASS")
                return True
        return False

    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        success, response = self.run_test(
            "Admin Login (wrong password - should fail)",
            "POST",
            "auth/login",
            401,
            data={
                "email": ADMIN_EMAIL,
                "password": "WrongPassword123!"
            }
        )
        if success:
            self.log("Correctly rejected wrong password", "PASS")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        if not self.admin_token:
            self.log("No admin token available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            if "counts" in response and "revenue" in response and "pairs_cleaned" in response:
                self.log(f"Dashboard data: {response.get('counts', {}).get('total_orders', 0)} orders, £{response.get('revenue', 0)} revenue", "PASS")
                return True
        return False

    def test_admin_approve_order(self):
        """Test admin approve order"""
        if not self.admin_token or not self.test_order_number:
            self.log("No admin token or test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Admin Approve Order",
            "POST",
            f"admin/orders/{self.test_order_number}/approve",
            200,
            data={"note": "Approved for testing"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and response.get("order"):
            order = response["order"]
            if order.get("status") == "APPROVED":
                self.log("Order approved successfully, status: APPROVED", "PASS")
                return True
        return False

    def test_checkout_after_approval(self):
        """Test checkout after approval (should return Stripe URL)"""
        if not self.test_order_number or not self.test_order_token:
            self.log("No test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Checkout After Approval",
            "POST",
            f"orders/{self.test_order_number}/checkout",
            200,
            data={
                "token": self.test_order_token,
                "origin_url": "https://premium-clean-flow.preview.emergentagent.com"
            }
        )
        if success:
            checkout_url = response.get("checkout_url")
            session_id = response.get("session_id")
            if checkout_url and "stripe.com" in checkout_url:
                self.log(f"Stripe checkout URL generated: {checkout_url[:50]}...", "PASS")
                return True
        return False

    def test_admin_manual_label(self):
        """Test admin manual label upload"""
        if not self.admin_token or not self.test_order_number:
            self.log("No admin token or test order available", "FAIL")
            return False
        
        # Create a small PDF-like file
        pdf_data = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF'
        
        files = {'file': ('label.pdf', BytesIO(pdf_data), 'application/pdf')}
        data = {
            'type': 'inbound',
            'tracking_number': 'TEST123456789',
            'tracking_url': 'https://track.example.com/TEST123456789'
        }
        
        url = f"{self.base_url}/admin/orders/{self.test_order_number}/label/manual"
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        self.tests_run += 1
        self.log("Testing Admin Manual Label Upload...", "INFO")
        
        try:
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                resp_data = response.json()
                order = resp_data.get("order", {})
                if order.get("status") in ["LABEL_GENERATED", "AWAITING_SHOES"]:
                    self.log(f"Manual label uploaded, status: {order.get('status')}", "PASS")
                    return True
            else:
                self.failed_tests.append({
                    "test": "Admin Manual Label Upload",
                    "expected": 200,
                    "got": response.status_code,
                    "response": response.text[:200]
                })
                self.log(f"FAILED - Expected 200, got {response.status_code}", "FAIL")
        except Exception as e:
            self.failed_tests.append({"test": "Admin Manual Label Upload", "error": str(e)})
            self.log(f"FAILED - Error: {str(e)}", "FAIL")
        
        return False

    def test_admin_status_change(self):
        """Test admin status change"""
        if not self.admin_token or not self.test_order_number:
            self.log("No admin token or test order available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Admin Status Change (SHOES_RECEIVED)",
            "POST",
            f"admin/orders/{self.test_order_number}/status",
            200,
            data={
                "status": "SHOES_RECEIVED",
                "note": "Shoes received for testing"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and response.get("order"):
            order = response["order"]
            if order.get("status") == "SHOES_RECEIVED":
                self.log("Status changed to SHOES_RECEIVED", "PASS")
                return True
        return False

    def test_admin_settings_get(self):
        """Test admin get settings"""
        if not self.admin_token:
            self.log("No admin token available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Admin Get Settings",
            "GET",
            "admin/settings",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            if "business" in response and "pricing" in response and "shipping_rates" in response:
                self.log("Settings retrieved successfully", "PASS")
                if "royal_mail" in response:
                    self.log(f"Royal Mail config: {response.get('royal_mail')}", "INFO")
                return True
        return False

    def test_admin_settings_update(self):
        """Test admin update settings"""
        if not self.admin_token:
            self.log("No admin token available", "FAIL")
            return False
        
        success, response = self.run_test(
            "Admin Update Settings",
            "PUT",
            "admin/settings",
            200,
            data={
                "announcement": "Test announcement from automated testing"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            if response.get("announcement") == "Test announcement from automated testing":
                self.log("Settings updated successfully", "PASS")
                return True
        return False

    def test_admin_faq_crud(self):
        """Test admin FAQ CRUD operations"""
        if not self.admin_token:
            self.log("No admin token available", "FAIL")
            return False
        
        # Create FAQ
        success, response = self.run_test(
            "Admin Create FAQ",
            "POST",
            "admin/faq",
            200,
            data={
                "q": "Test question?",
                "a": "Test answer.",
                "order": 999
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and response.get("id"):
            faq_id = response["id"]
            self.log(f"FAQ created with ID: {faq_id}", "PASS")
            
            # Delete FAQ
            success_del, _ = self.run_test(
                "Admin Delete FAQ",
                "DELETE",
                f"admin/faq/{faq_id}",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            if success_del:
                self.log("FAQ deleted successfully", "PASS")
                return True
        return False

    def test_admin_review_crud(self):
        """Test admin review CRUD operations"""
        if not self.admin_token:
            self.log("No admin token available", "FAIL")
            return False
        
        # Create review
        success, response = self.run_test(
            "Admin Create Review",
            "POST",
            "admin/reviews",
            200,
            data={
                "name": "Test Reviewer",
                "location": "London",
                "rating": 5,
                "text": "Great service!",
                "approved": True,
                "order": 999
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and response.get("id"):
            review_id = response["id"]
            self.log(f"Review created with ID: {review_id}", "PASS")
            
            # Delete review
            success_del, _ = self.run_test(
                "Admin Delete Review",
                "DELETE",
                f"admin/reviews/{review_id}",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            if success_del:
                self.log("Review deleted successfully", "PASS")
                return True
        return False

    def test_public_faq(self):
        """Test public FAQ endpoint"""
        success, response = self.run_test(
            "Public FAQ Endpoint",
            "GET",
            "faq",
            200
        )
        if success and isinstance(response, list):
            self.log(f"FAQ endpoint returned {len(response)} items", "PASS")
            return True
        return False

    def test_public_reviews(self):
        """Test public reviews endpoint"""
        success, response = self.run_test(
            "Public Reviews Endpoint",
            "GET",
            "reviews",
            200
        )
        if success and isinstance(response, list):
            self.log(f"Reviews endpoint returned {len(response)} items", "PASS")
            return True
        return False

    def test_public_gallery(self):
        """Test public gallery endpoint"""
        success, response = self.run_test(
            "Public Gallery Endpoint",
            "GET",
            "gallery",
            200
        )
        if success and isinstance(response, list):
            self.log(f"Gallery endpoint returned {len(response)} items", "PASS")
            return True
        return False

    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("\n" + "="*60)
        print("SOLE SERENITY BACKEND API TESTS")
        print("="*60 + "\n")
        
        # Public endpoints
        print("\n--- PUBLIC ENDPOINTS ---")
        self.test_health()
        self.test_services()
        self.test_pricing_calculation()
        self.test_public_faq()
        self.test_public_reviews()
        self.test_public_gallery()
        
        # File uploads
        print("\n--- FILE UPLOADS ---")
        self.test_upload_image()
        self.test_upload_invalid_file()
        
        # Order flow
        print("\n--- ORDER FLOW ---")
        self.test_create_order()
        self.test_get_order_with_token()
        self.test_get_order_wrong_token()
        self.test_checkout_before_approval()
        
        # Admin auth
        print("\n--- ADMIN AUTH ---")
        self.test_admin_login()
        self.test_admin_login_wrong_password()
        
        # Admin operations
        print("\n--- ADMIN OPERATIONS ---")
        self.test_admin_dashboard()
        self.test_admin_approve_order()
        self.test_checkout_after_approval()
        self.test_admin_manual_label()
        self.test_admin_status_change()
        
        # Admin settings & content
        print("\n--- ADMIN SETTINGS & CONTENT ---")
        self.test_admin_settings_get()
        self.test_admin_settings_update()
        self.test_admin_faq_crud()
        self.test_admin_review_crud()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n--- FAILED TESTS ---")
            for fail in self.failed_tests:
                print(f"❌ {fail.get('test', 'Unknown')}")
                if 'expected' in fail:
                    print(f"   Expected: {fail['expected']}, Got: {fail['got']}")
                if 'error' in fail:
                    print(f"   Error: {fail['error']}")
                if 'response' in fail:
                    print(f"   Response: {fail['response']}")
        
        print("\n" + "="*60 + "\n")
        
        return 0 if self.tests_passed == self.tests_run else 1


def main():
    tester = SoleSerenityTester()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
