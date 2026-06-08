param(
  [string]$BaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body = $null
  )

  $uri = "$BaseUrl$Path"
  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri
  }

  $json = $Body | ConvertTo-Json -Depth 20
  return Invoke-RestMethod -Method $Method -Uri $uri -ContentType "application/json" -Body $json
}

function Assert-Truthy {
  param(
    [Parameter(Mandatory = $true)]$Value,
    [Parameter(Mandatory = $true)][string]$Message
  )

  if (-not $Value) {
    throw $Message
  }
}

function New-TestId {
  param([string]$Prefix)
  return "$Prefix-$([guid]::NewGuid().ToString())"
}

Write-Host "API smoke test basladi: $BaseUrl"

$health = Invoke-JsonRequest -Method "GET" -Path "/api/health"
Assert-Truthy $health.checkedAt "Health cevabinda checkedAt yok."
Write-Host "[OK] /api/health"

$market = Invoke-JsonRequest -Method "GET" -Path "/api/market?market=crypto&symbols=BTCUSDT,ETHUSDT"
Assert-Truthy ($market.tickers.Count -ge 1) "Market cevabinda ticker yok."
Write-Host "[OK] /api/market"

$analysis = Invoke-JsonRequest -Method "GET" -Path "/api/analyze?market=crypto&symbol=BTCUSDT&interval=1h"
Assert-Truthy $analysis.analysis "Analyze cevabinda analysis yok."
Assert-Truthy $analysis.decisionReport "Analyze cevabinda decisionReport yok."
Assert-Truthy $analysis.tradePlan "Analyze cevabinda tradePlan yok."
Write-Host "[OK] /api/analyze"

$snapshotId = $null
$snapshotBody = @{
  market = "crypto"
  symbol = "TESTUSDT"
  interval = "1h"
  price = 123.45
  score = 67
  stance = "watch"
  confidence = 72
  reportJson = "{`"test`":true}"
}
$snapshot = Invoke-JsonRequest -Method "POST" -Path "/api/snapshots" -Body $snapshotBody
$snapshotId = $snapshot.snapshot.id
Assert-Truthy $snapshotId "Snapshot id olusmadi."
$snapshots = Invoke-JsonRequest -Method "GET" -Path "/api/snapshots"
Assert-Truthy ($snapshots.snapshots | Where-Object { $_.id -eq $snapshotId }) "Snapshot listede bulunamadi."
$snapshotDelete = Invoke-JsonRequest -Method "DELETE" -Path "/api/snapshots?id=$snapshotId"
Assert-Truthy $snapshotDelete.ok "Snapshot silinemedi."
Write-Host "[OK] /api/snapshots"

$tradeId = New-TestId -Prefix "trade"
$tradeBody = @{
  id = $tradeId
  symbol = "BTCUSDT"
  timeframe = "1h"
  side = "long"
  entryPrice = 100
  stopLoss = 95
  targetPrice = 115
  quantity = 1
  strategy = "Smoke test"
  status = "plan"
  note = "Silinebilir test kaydi"
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
}
$trade = Invoke-JsonRequest -Method "POST" -Path "/api/trades" -Body $tradeBody
Assert-Truthy ($trade.entry.id -eq $tradeId) "Trade kaydi olusmadi."
$tradePatch = Invoke-JsonRequest -Method "PATCH" -Path "/api/trades" -Body @{ id = $tradeId; status = "open" }
Assert-Truthy $tradePatch.ok "Trade status guncellenemedi."
$tradeDelete = Invoke-JsonRequest -Method "DELETE" -Path "/api/trades?id=$tradeId"
Assert-Truthy $tradeDelete.ok "Trade kaydi silinemedi."
Write-Host "[OK] /api/trades"

$portfolioId = New-TestId -Prefix "portfolio"
$portfolioBody = @{
  id = $portfolioId
  symbol = "BTCUSDT"
  quantity = 1
  averageCost = 100
  stopLoss = 95
  note = "Silinebilir test kaydi"
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
}
$portfolio = Invoke-JsonRequest -Method "POST" -Path "/api/portfolio" -Body $portfolioBody
Assert-Truthy ($portfolio.position.id -eq $portfolioId) "Portfoy kaydi olusmadi."
$portfolioDelete = Invoke-JsonRequest -Method "DELETE" -Path "/api/portfolio?id=$portfolioId"
Assert-Truthy $portfolioDelete.ok "Portfoy kaydi silinemedi."
Write-Host "[OK] /api/portfolio"

$alertId = New-TestId -Prefix "alert"
$alertBody = @{
  id = $alertId
  market = "crypto"
  symbol = "BTCUSDT"
  metric = "price"
  direction = "above"
  threshold = 100
  note = "Silinebilir test kaydi"
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
}
$alert = Invoke-JsonRequest -Method "POST" -Path "/api/alerts" -Body $alertBody
Assert-Truthy ($alert.alert.id -eq $alertId) "Uyari kaydi olusmadi."
$alertPatch = Invoke-JsonRequest -Method "PATCH" -Path "/api/alerts" -Body @{
  id = $alertId
  triggeredAt = (Get-Date).ToUniversalTime().ToString("o")
}
Assert-Truthy $alertPatch.ok "Uyari tetiklenme zamani guncellenemedi."
$alertDelete = Invoke-JsonRequest -Method "DELETE" -Path "/api/alerts?id=$alertId"
Assert-Truthy $alertDelete.ok "Uyari kaydi silinemedi."
Write-Host "[OK] /api/alerts"

$usageNoteBody = @{
  date = (Get-Date).ToString("yyyy-MM-dd")
  symbols = "BTCUSDT, ETHUSDT"
  snapshots = 1
  tradeNotes = "Smoke test notu"
  usefulPanel = "Karar raporu"
  confusingPanel = ""
  dataIssue = ""
  nextAction = "Smoke test temizligi"
}
$usageNote = Invoke-JsonRequest -Method "POST" -Path "/api/usage-notes" -Body $usageNoteBody
$usageNoteId = $usageNote.note.id
Assert-Truthy $usageNoteId "Kullanim notu olusmadi."
$usageNotes = Invoke-JsonRequest -Method "GET" -Path "/api/usage-notes"
Assert-Truthy ($usageNotes.notes | Where-Object { $_.id -eq $usageNoteId }) "Kullanim notu listede bulunamadi."
$usageNoteDelete = Invoke-JsonRequest -Method "DELETE" -Path "/api/usage-notes?id=$usageNoteId"
Assert-Truthy $usageNoteDelete.ok "Kullanim notu silinemedi."
Write-Host "[OK] /api/usage-notes"

$usageSummary = Invoke-JsonRequest -Method "GET" -Path "/api/usage-summary?days=7"
Assert-Truthy $usageSummary.summary.generatedAt "Kullanim ozetinde generatedAt yok."
Assert-Truthy ($usageSummary.summary.range.days -eq 7) "Kullanim ozeti gun araligi hatali."
Assert-Truthy ($null -ne $usageSummary.summary.totals.notes) "Kullanim ozeti toplam not alani yok."
Assert-Truthy ($usageSummary.summary.recommendations.Count -ge 1) "Kullanim ozeti onerileri yok."
Write-Host "[OK] /api/usage-summary"

$exportJson = Invoke-JsonRequest -Method "GET" -Path "/api/export?type=trades&format=json"
Assert-Truthy ($null -ne $exportJson.records) "Trade JSON export records alani yok."
$snapshotExportJson = Invoke-JsonRequest -Method "GET" -Path "/api/export?type=snapshots&format=json"
Assert-Truthy ($null -ne $snapshotExportJson.records) "Snapshot JSON export records alani yok."
$exportCsv = Invoke-WebRequest -Method "GET" -Uri "$BaseUrl/api/export?type=portfolio&format=csv" -UseBasicParsing
Assert-Truthy ($exportCsv.Content -match "id") "Portfolio CSV export beklenen basligi icermiyor."
$snapshotExportCsv = Invoke-WebRequest -Method "GET" -Uri "$BaseUrl/api/export?type=snapshots&format=csv" -UseBasicParsing
Assert-Truthy ($snapshotExportCsv.Content -match "reportJson") "Snapshot CSV export beklenen basligi icermiyor."
Write-Host "[OK] /api/export"

$importId = New-TestId -Prefix "import-trade"
$importBody = @{
  records = @(
    @{
      id = $importId
      symbol = "BTCUSDT"
      timeframe = "1h"
      side = "long"
      entryPrice = 100
      stopLoss = 95
      targetPrice = 115
      quantity = 1
      strategy = "Import smoke test"
      status = "plan"
      note = "Silinebilir import kaydi"
      createdAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  )
}
$import = Invoke-JsonRequest -Method "POST" -Path "/api/import?type=trades" -Body $importBody
Assert-Truthy $import.ok "Import basarisiz."
$cleanupImport = Invoke-JsonRequest -Method "DELETE" -Path "/api/trades?id=$importId"
Assert-Truthy $cleanupImport.ok "Import test kaydi temizlenemedi."

$snapshotImportId = New-TestId -Prefix "import-snapshot"
$snapshotImportBody = @{
  records = @(
    @{
      id = $snapshotImportId
      market = "crypto"
      symbol = "BTCUSDT"
      interval = "1h"
      price = 100
      score = 55
      stance = "wait"
      confidence = 60
      reportJson = "{`"source`":`"api-smoke-test`"}"
      createdAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  )
}
$snapshotImport = Invoke-JsonRequest -Method "POST" -Path "/api/import?type=snapshots" -Body $snapshotImportBody
Assert-Truthy $snapshotImport.ok "Snapshot import basarisiz."
$cleanupSnapshotImport = Invoke-JsonRequest -Method "DELETE" -Path "/api/snapshots?id=$snapshotImportId"
Assert-Truthy $cleanupSnapshotImport.ok "Snapshot import test kaydi temizlenemedi."
Write-Host "[OK] /api/import"

Write-Host "API smoke test tamamlandi."
