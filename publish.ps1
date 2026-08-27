<#
.SYNOPSIS
  Publishes whatever's currently in this folder to the live QRoll launcher
  (https://prince766767.github.io/QRoll/).

.DESCRIPTION
  Run this AFTER copying your updated file(s) from
  C:\Users\princ\OneDrive\Documents\outputs\qroll-launcher\ into this folder.
  It stages everything changed here, commits, and pushes -- the only step
  that actually reaches GitHub Pages is the push at the end.

  Run this from your own normal terminal (double-click it, or open
  PowerShell yourself and run .\publish.ps1). It's not meant to be run from
  an automated/non-interactive context -- git's credential lookup here
  needs a real interactive session to authenticate.

.PARAMETER Message
  Commit message describing what changed. If you don't pass one, you'll be
  prompted for it.

.EXAMPLE
  .\publish.ps1 "Fix the college-name typo on the splash screen"
#>
param(
  [Parameter(Position = 0)]
  [string]$Message
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

git add -A
$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "Nothing changed in this folder -- nothing to publish." -ForegroundColor Yellow
  exit 0
}

Write-Host "Files being published:" -ForegroundColor Cyan
$staged | ForEach-Object { Write-Host "  $_" }

if (-not $Message) {
  $Message = Read-Host "Commit message (what changed and why)"
  if (-not $Message) {
    Write-Host "No message entered -- aborting. Nothing was committed or pushed." -ForegroundColor Red
    git reset | Out-Null
    exit 1
  }
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "Commit failed -- nothing was pushed." -ForegroundColor Red
  exit 1
}

git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "PUSH FAILED (see error above). The commit above is saved locally," -ForegroundColor Red
  Write-Host "but NOT live yet -- run 'git push' again once whatever's wrong is fixed." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Pushed. GitHub Pages usually takes 1-2 minutes to rebuild --" -ForegroundColor Green
Write-Host "check https://prince766767.github.io/QRoll/ shortly, not instantly." -ForegroundColor Green
