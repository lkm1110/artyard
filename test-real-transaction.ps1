# Test 2Checkout Webhook with REAL Transaction Data
# Transaction ID: b8973af4-15c6-4b32-ba24-68d6681070c5

Write-Host "🧪 Testing 2Checkout Webhook with REAL transaction..." -ForegroundColor Cyan
Write-Host ""

$webhookUrl = "https://bkvycanciimgyftdtqpx.supabase.co/functions/v1/twocheckout-webhook"

# Real transaction data from your app
$body = @{
    "MESSAGE_TYPE" = "ORDER_CREATED"
    "merchant_order_id" = "b8973af4-15c6-4b32-ba24-68d6681070c5"  # Real transaction ID
    "order_number" = "2CO-TEST-12345"
    "ORDERSTATUS" = "COMPLETE"
    "TOTAL" = "1.00"
    "invoice_list_amount" = "1.00"
    "custom_field_1" = "0ea47191-eaa2-4ce5-9985-c6a7f2fe7aab"  # seller_id
    "custom_field_2" = "a8a0279a-cced-4a59-beb7-bbd1905f9c3a"  # artwork_id (kuku)
    "ship_name" = "Test Buyer"
    "ship_street_address" = "123 Main St"
    "ship_city" = "Seoul"
    "ship_state" = "Seoul"
    "ship_zip" = "06000"
    "ship_country" = "KR"
    "CUSTOMERFIRSTNAME" = "Test"
    "CUSTOMERLASTNAME" = "Buyer"
}

Write-Host "📤 Sending webhook request..." -ForegroundColor Yellow
Write-Host "Transaction ID: b8973af4-15c6-4b32-ba24-68d6681070c5" -ForegroundColor Green
Write-Host "Artwork: kuku ($1.00)" -ForegroundColor Green
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
        Write-Host "✅ Transaction updated to 'paid'" -ForegroundColor Green
        Write-Host "✅ Artwork marked as 'sold'" -ForegroundColor Green
        Write-Host "✅ Seller payout created (Platform fee: 10%)" -ForegroundColor Green
        Write-Host ""
        Write-Host "💰 Transaction breakdown:" -ForegroundColor Cyan
        Write-Host "  Total: `$1.00" -ForegroundColor White
        Write-Host "  Platform fee (10%): `$0.10" -ForegroundColor White
        Write-Host "  Seller amount: `$0.90" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Payment processing failed!" -ForegroundColor Red
        Write-Host "Error: $($content.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Request failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Response details:" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📝 Next Steps - Verify in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "1. Transactions table → status should be 'paid'" -ForegroundColor Gray
Write-Host "2. Artworks table → 'kuku' should be 'sold'" -ForegroundColor Gray
Write-Host "3. Seller Payouts table → new record with `$0.90" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx/editor" -ForegroundColor Blue

