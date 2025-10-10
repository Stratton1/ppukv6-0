#!/bin/bash

# ============================================================================
# PPUK v6 Relationship & Watchlist Endpoints Test Script
# ============================================================================
# 
# This script tests the new relationship enum and watchlist functionality:
# - my_properties endpoint with relationship filtering
# - watchlist_add endpoint
# - watchlist_remove endpoint  
# - property_snapshot with visibility tiers
#
# Usage: ./test_relationship_watchlist_endpoints.sh
#
# Prerequisites:
# 1. Set SUPABASE_URL environment variable
# 2. Set JWT_TOKEN environment variable (valid Supabase JWT)
# 3. Set TEST_PROPERTY_ID environment variable (valid property UUID)
# ============================================================================

# --- Configuration ---
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
JWT_TOKEN="${JWT_TOKEN:-YOUR_SUPABASE_JWT_TOKEN}"
TEST_PROPERTY_ID="${TEST_PROPERTY_ID:-YOUR_TEST_PROPERTY_ID}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function call_api() {
    local method=$1
    local endpoint=$2
    local body=$3
    local query_params=$4
    local expected_status=$5

    log_info "Calling $method $endpoint$query_params"
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$SUPABASE_URL/functions/v1/$endpoint$query_params" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$body")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$SUPABASE_URL/functions/v1/$endpoint$query_params" \
            -H "Authorization: Bearer $JWT_TOKEN")
    fi
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        log_success "HTTP $http_code (expected $expected_status)"
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    else
        log_error "HTTP $http_code (expected $expected_status)"
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    fi
    
    echo ""
    return $([ "$http_code" = "$expected_status" ] && echo 0 || echo 1)
}

function test_my_properties() {
    log_info "=== Testing my_properties endpoint ==="
    
    # Test 1: Get all properties
    log_info "Test 1: Get all properties"
    call_api GET "my_properties" "" "" 200
    
    # Test 2: Get owner properties only
    log_info "Test 2: Get owner properties only"
    call_api GET "my_properties" "" "?relationship=owner" 200
    
    # Test 3: Get occupier properties only
    log_info "Test 3: Get occupier properties only"
    call_api GET "my_properties" "" "?relationship=occupier" 200
    
    # Test 4: Get interested properties only
    log_info "Test 4: Get interested properties only"
    call_api GET "my_properties" "" "?relationship=interested" 200
    
    # Test 5: Pagination
    log_info "Test 5: Test pagination (limit=5, offset=0)"
    call_api GET "my_properties" "" "?limit=5&offset=0" 200
    
    # Test 6: Invalid relationship
    log_info "Test 6: Invalid relationship (should fail)"
    call_api GET "my_properties" "" "?relationship=invalid" 400
}

function test_watchlist_add() {
    log_info "=== Testing watchlist_add endpoint ==="
    
    # Test 1: Add property to watchlist
    log_info "Test 1: Add property to watchlist"
    call_api POST "watchlist_add" "{\"property_id\": \"$TEST_PROPERTY_ID\"}" "" 200
    
    # Test 2: Add same property again (should be idempotent)
    log_info "Test 2: Add same property again (idempotent test)"
    call_api POST "watchlist_add" "{\"property_id\": \"$TEST_PROPERTY_ID\"}" "" 200
    
    # Test 3: Invalid property ID
    log_info "Test 3: Invalid property ID (should fail)"
    call_api POST "watchlist_add" "{\"property_id\": \"invalid-uuid\"}" "" 400
    
    # Test 4: Missing property_id
    log_info "Test 4: Missing property_id (should fail)"
    call_api POST "watchlist_add" "{}" "" 400
}

function test_watchlist_remove() {
    log_info "=== Testing watchlist_remove endpoint ==="
    
    # Test 1: Remove property from watchlist
    log_info "Test 1: Remove property from watchlist"
    call_api POST "watchlist_remove" "{\"property_id\": \"$TEST_PROPERTY_ID\"}" "" 200
    
    # Test 2: Remove same property again (should be idempotent)
    log_info "Test 2: Remove same property again (idempotent test)"
    call_api POST "watchlist_remove" "{\"property_id\": \"$TEST_PROPERTY_ID\"}" "" 200
    
    # Test 3: Invalid property ID
    log_info "Test 3: Invalid property ID (should fail)"
    call_api POST "watchlist_remove" "{\"property_id\": \"invalid-uuid\"}" "" 400
    
    # Test 4: Missing property_id
    log_info "Test 4: Missing property_id (should fail)"
    call_api POST "watchlist_remove" "{}" "" 400
}

function test_property_snapshot() {
    log_info "=== Testing property_snapshot endpoint ==="
    
    # Test 1: Get property snapshot (interested relationship)
    log_info "Test 1: Get property snapshot (interested relationship)"
    call_api GET "property_snapshot" "" "?property_id=$TEST_PROPERTY_ID" 200
    
    # Test 2: Get property snapshot with include flags
    log_info "Test 2: Get property snapshot with include flags"
    call_api GET "property_snapshot" "" "?property_id=$TEST_PROPERTY_ID&include_epc=true&include_flood=true&include_planning=false" 200
    
    # Test 3: Invalid property ID
    log_info "Test 3: Invalid property ID (should fail)"
    call_api GET "property_snapshot" "" "?property_id=invalid-uuid" 400
    
    # Test 4: Missing property_id
    log_info "Test 4: Missing property_id (should fail)"
    call_api GET "property_snapshot" "" "" 400
}

function test_authentication() {
    log_info "=== Testing authentication ==="
    
    # Test 1: No authorization header
    log_info "Test 1: No authorization header (should fail)"
    response=$(curl -s -w "\n%{http_code}" -X GET "$SUPABASE_URL/functions/v1/my_properties")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "401" ]; then
        log_success "HTTP 401 (expected)"
    else
        log_error "HTTP $http_code (expected 401)"
    fi
    echo ""
    
    # Test 2: Invalid token
    log_info "Test 2: Invalid token (should fail)"
    response=$(curl -s -w "\n%{http_code}" -X GET "$SUPABASE_URL/functions/v1/my_properties" \
        -H "Authorization: Bearer invalid-token")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "401" ]; then
        log_success "HTTP 401 (expected)"
    else
        log_error "HTTP $http_code (expected 401)"
    fi
    echo ""
}

function test_cors() {
    log_info "=== Testing CORS ==="
    
    # Test OPTIONS request
    log_info "Test OPTIONS request (CORS preflight)"
    response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$SUPABASE_URL/functions/v1/my_properties" \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        log_success "HTTP 200 (CORS preflight successful)"
    else
        log_error "HTTP $http_code (CORS preflight failed)"
    fi
    echo ""
}

function validate_environment() {
    log_info "=== Validating Environment ==="
    
    if [ "$JWT_TOKEN" = "YOUR_SUPABASE_JWT_TOKEN" ]; then
        log_error "JWT_TOKEN not set. Please set it to a valid Supabase JWT token."
        return 1
    fi
    
    if [ "$TEST_PROPERTY_ID" = "YOUR_TEST_PROPERTY_ID" ]; then
        log_error "TEST_PROPERTY_ID not set. Please set it to a valid property UUID."
        return 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl to run this script."
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. JSON responses will not be formatted."
    fi
    
    log_success "Environment validation passed"
    echo ""
    return 0
}

function main() {
    echo "============================================================================"
    echo "PPUK v6 Relationship & Watchlist Endpoints Test Suite"
    echo "============================================================================"
    echo ""
    
    # Validate environment
    if ! validate_environment; then
        exit 1
    fi
    
    # Run tests
    test_authentication
    test_cors
    test_my_properties
    test_watchlist_add
    test_watchlist_remove
    test_property_snapshot
    
    echo "============================================================================"
    log_success "All tests completed!"
    echo "============================================================================"
}

# Run main function
main "$@"
