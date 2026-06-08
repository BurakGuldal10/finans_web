param(
  [string]$BaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"

function Assert-Truthy {
  param(
    [Parameter(Mandatory = $true)]$Value,
    [Parameter(Mandatory = $true)][string]$Message
  )

  if (-not $Value) {
    throw $Message
  }
}

function Invoke-Page {
  param([Parameter(Mandatory = $true)][string]$Path)
  return Invoke-WebRequest -Method "GET" -Uri "$BaseUrl$Path" -UseBasicParsing
}

function Invoke-Json {
  param([Parameter(Mandatory = $true)][string]$Path)
  return Invoke-RestMethod -Method "GET" -Uri "$BaseUrl$Path"
}

Write-Host "Page smoke test basladi: $BaseUrl"

$dashboardPage = Invoke-Page -Path "/"
Assert-Truthy ($dashboardPage.StatusCode -eq 200) "Dashboard 200 donmedi."
Assert-Truthy ($dashboardPage.Content -match "Finansman Asistani") "Dashboard basligi HTML icinde bulunamadi."
Assert-Truthy ($dashboardPage.Content -match "Canli karar destek paneli") "Dashboard ana aciklamasi bulunamadi."
Write-Host "[OK] Dashboard HTML"

$login = Invoke-Page -Path "/login"
Assert-Truthy ($login.StatusCode -eq 200) "Login sayfasi 200 donmedi."
Assert-Truthy ($login.Content -match "Lokal erisim") "Login sayfasi beklenen icerigi icermiyor."
Write-Host "[OK] Login HTML"

$health = Invoke-Json -Path "/api/health"
Assert-Truthy $health.checkedAt "Health cevabinda checkedAt yok."
Assert-Truthy ($null -ne $health.data.snapshots) "Health cevabinda snapshot sayisi yok."
Write-Host "[OK] Dashboard health baglantisi"

$market = Invoke-Json -Path "/api/market?market=crypto&symbols=BTCUSDT"
Assert-Truthy ($market.tickers.Count -ge 1) "Dashboard piyasa verisi alamadi."
Assert-Truthy ($market.tickers[0].symbol -eq "BTCUSDT") "BTCUSDT piyasa cevabinda bulunamadi."
Write-Host "[OK] Dashboard market baglantisi"

$analysis = Invoke-Json -Path "/api/analyze?market=crypto&symbol=BTCUSDT&interval=1h"
Assert-Truthy $analysis.analysis "Dashboard analiz verisi alamadi."
Assert-Truthy $analysis.decisionReport "Dashboard karar raporu verisi alamadi."
Assert-Truthy $analysis.tradePlan "Dashboard trade plani verisi alamadi."
Write-Host "[OK] Dashboard analiz baglantisi"

$snapshots = Invoke-Json -Path "/api/snapshots"
Assert-Truthy ($null -ne $snapshots.snapshots) "Snapshot listesi alinamadi."
Write-Host "[OK] Dashboard snapshot baglantisi"

Write-Host "Page smoke test tamamlandi."
