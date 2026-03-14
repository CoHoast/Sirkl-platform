#!/bin/bash
# Test all bills through extraction + calculation

API_BASE="https://sirkl-platform-production.up.railway.app"
BILLS_DIR="test-bills"

echo ""
echo "🏥 SIRKL Bill Negotiator - E2E Test"
echo "═══════════════════════════════════════"
echo ""

total_billed=0
total_fair=0
total_savings=0
success_count=0

for bill in $BILLS_DIR/bill-*.png; do
  filename=$(basename "$bill")
  echo "📄 Processing $filename..."
  
  # Extract bill
  extraction=$(curl -s -X POST -F "file=@$bill" "$API_BASE/api/bill-negotiator/extract")
  
  if echo "$extraction" | grep -q '"success":true'; then
    # Parse extraction results
    provider=$(echo "$extraction" | jq -r '.data.provider.name.value // "Unknown"')
    email=$(echo "$extraction" | jq -r '.data.provider.email.value // "N/A"')
    billed=$(echo "$extraction" | jq -r '.data.billing.total_billed.value // 0' | cut -d. -f1)
    
    echo "   Provider: $provider"
    echo "   Email: $email"
    echo "   Billed: \$$(printf "%'d" $billed)"
    
    # Get line items for fair price calculation
    line_items=$(echo "$extraction" | jq '[.data.line_items[] | {
      cptCode: .cpt_code.value,
      description: .description.value,
      units: (.quantity.value // 1),
      billedAmount: .charge.value
    }]')
    
    # Calculate fair price
    pricing=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{\"lineItems\": $line_items, \"state\": \"CO\"}" \
      "$API_BASE/api/bill-negotiator/calculate-fair-price")
    
    fair_price=$(echo "$pricing" | jq -r '.summary.totalFairPrice // 0' | cut -d. -f1)
    savings=$(echo "$pricing" | jq -r '.summary.totalPotentialSavings // 0' | cut -d. -f1)
    savings_pct=$(echo "$pricing" | jq -r '.summary.potentialSavingsPercent // 0' | cut -d. -f1)
    
    echo "   Fair Price: \$$(printf "%'d" $fair_price)"
    echo "   Savings: \$$(printf "%'d" $savings) (${savings_pct}%)"
    echo "   ✅ Success"
    
    total_billed=$((total_billed + billed))
    total_fair=$((total_fair + fair_price))
    total_savings=$((total_savings + savings))
    success_count=$((success_count + 1))
  else
    echo "   ❌ Extraction failed"
    echo "$extraction" | jq -r '.error // "Unknown error"' | head -1
  fi
  
  echo ""
done

echo "═══════════════════════════════════════"
echo "📊 SUMMARY"
echo "═══════════════════════════════════════"
echo ""
echo "Bills Processed:   10"
echo "Successful:        $success_count"
echo ""
echo "💰 FINANCIALS:"
echo "Total Billed:      \$$(printf "%'d" $total_billed)"
echo "Total Fair Price:  \$$(printf "%'d" $total_fair)"
echo "Total Savings:     \$$(printf "%'d" $total_savings)"

if [ $total_billed -gt 0 ]; then
  savings_pct=$((total_savings * 100 / total_billed))
  echo "Savings Rate:      ${savings_pct}%"
fi

echo ""
echo "✅ Test complete"
