# Backs up everything that is yours and not in Git: the Maps folder and the app's own data folder
# (shared proficiency answers, the draft map, review sessions). Run it through Backup-User-Data.cmd.
#
#   Copies   <project>\Maps\                    -> <backup>\Maps\
#            %APPDATA%\skill-solar-system\      -> <backup>\skill-solar-system\
#   Into     %OneDrive%\Skill Solar System Backups\<yyyy-MM-dd_HHmmss>\
#
# Every copied file is checked against its original by SHA-256. Only the 10 newest backup folders
# are kept; older ones are removed, and only folders inside the backups folder whose names are a
# timestamp. File contents are hashed as bytes and never parsed, printed or changed.
$ErrorActionPreference = 'Stop'
$Keep = 10
$StampPattern = '^\d{4}-\d{2}-\d{2}_\d{6}$'

function Fail($message) {
  Write-Host ''
  Write-Host "BACKUP NOT MADE: $message" -ForegroundColor Red
  exit 1
}

# The app writes to these folders while it is open, so a copy taken then could be half-written.
$running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^(electron|Skill Solar System)' })
if ($running.Count) { Fail 'the Skill Solar System app is open. Close it and run this again.' }

if (-not $env:OneDrive) { Fail 'OneDrive is not set up on this account, so there is nowhere safe outside the project to put the backup.' }
if (-not $env:APPDATA) { Fail 'the APPDATA folder could not be found.' }

$project = Split-Path -Parent $PSScriptRoot
$sources = @(
  @{ Name = 'Maps'; Path = Join-Path $project 'Maps' },
  @{ Name = 'skill-solar-system'; Path = Join-Path $env:APPDATA 'skill-solar-system' }
)
foreach ($source in $sources) { if (-not (Test-Path -LiteralPath $source.Path -PathType Container)) { Fail "the folder $($source.Path) does not exist." } }

$root = Join-Path $env:OneDrive 'Skill Solar System Backups'
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$destination = Join-Path $root $stamp
if (Test-Path -LiteralPath $destination) { Fail "$destination already exists. Wait a second and run this again." }

Write-Host "Backing up to $destination"
$files = 0; $bytes = 0; $failed = @()
foreach ($source in $sources) {
  $base = (Get-Item -LiteralPath $source.Path).FullName.TrimEnd('\')
  foreach ($file in Get-ChildItem -LiteralPath $base -Recurse -File -Force) {
    $relative = $file.FullName.Substring($base.Length + 1)
    $target = Join-Path (Join-Path $destination $source.Name) $relative
    $folder = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
    try {
      Copy-Item -LiteralPath $file.FullName -Destination $target
      $same = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    } catch { $same = $false }
    if ($same) { $files++; $bytes += $file.Length } else { $failed += "$($source.Name)\$relative" }
  }
}

Write-Host ''
Write-Host ('Files copied and verified: {0}' -f $files)
Write-Host ('Size: {0:N1} MB' -f ($bytes / 1MB))
if ($failed.Count) {
  Write-Host ('Files that did not verify: {0}' -f $failed.Count) -ForegroundColor Red
  $failed | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
  Fail "verification failed. The incomplete copy is left at $destination; older backups were not removed."
}
Write-Host 'Verification: PASSED (every file matches its original)' -ForegroundColor Green

# Keep the newest backups only. Folders not named like a timestamp are never touched.
$backups = @(Get-ChildItem -LiteralPath $root -Directory | Where-Object { $_.Name -match $StampPattern } | Sort-Object Name -Descending)
$old = @($backups | Select-Object -Skip $Keep)
foreach ($folder in $old) { Remove-Item -LiteralPath $folder.FullName -Recurse -Force }
Write-Host ('Backups kept: {0} (removed {1} older)' -f ($backups.Count - $old.Count), $old.Count)
Write-Host "Saved in: $destination"
exit 0
