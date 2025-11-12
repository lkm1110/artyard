# Test 2Checkout Webhook with Mock Data
# This script simulates a successful payment webhook from 2Checkout

Write-Host "🧪 Testing 2Checkout Webhook..." -ForegroundColor Cyan
Write-Host ""

# Mock Transaction Data (replace with actual IDs from your database)
$mockTransactionId = "00000000-0000-0000-0000-000000000001"  # Replace with real transaction ID
$mockSellerId = "00000000-0000-0000-0000-000000000002"       # Replace with real seller profile ID
$mockArtworkId = "00000000-0000-0000-0000-000000000003"      # Replace with real artwork ID

$webhookUrl = "https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/twocheckout-webhook"

$body = @{
    "MESSAGE_TYPE" = "ORDER_CREATED"
    "merchant_order_id" = $mockTransactionId
    "order_number" = "2CO-TEST-12345"
    "ORDERSTATUS" = "COMPLETE"
    "TOTAL" = "100.00"
    "invoice_list_amount" = "100.00"
    "custom_field_1" = $mockSellerId
    "custom_field_2" = $mockArtworkId
    "ship_name" = "John Doe"
    "ship_street_address" = "123 Main St"
    "ship_city" = "Seoul"
    "ship_state" = "Seoul"
    "ship_zip" = "06000"
    "ship_country" = "KR"
    "CUSTOMERFIRSTNAME" = "John"
    "CUSTOMERLASTNAME" = "Doe"
}

Write-Host "📤 Sending webhook request..." -ForegroundColor Yellow
Write-Host "Transaction ID: $mockTransactionId" -ForegroundColor Gray
Write-Host "Seller ID: $mockSellerId" -ForegroundColor Gray
Write-Host "Artwork ID: $mockArtworkId" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Method POST -Uri $webhookUrl -ContentType "application/x-www-form-urlencoded" -Body $body
    
    $statusCode = $response.StatusCode
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Response Status: $statusCode" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Response Body:" -ForegroundColor Cyan
    Write-Host ($content | ConvertTo-Json -Depth 10) -ForegroundColor White
    
    if ($content.success) {
        Write-Host ""
        Write-Host "🎉 Payment processed successfully!" -ForegroundColor Green
        Write-Host "✅ Transaction updated" -ForegroundColor Green
        Write-Host "✅ Artwork marked as sold" -ForegroundColor Green
        Write-Host "✅ Seller payout created" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Payment processing failed!" -ForegroundColor Red
        Write-Host "Error: $($content.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Request failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Supabase Dashboard → Transactions table" -ForegroundColor Gray
Write-Host "2. Check Artworks table (sale_status should be 'sold')" -ForegroundColor Gray
Write-Host "3. Check Seller Payouts table (new record should exist)" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/editor" -ForegroundColor Blue

