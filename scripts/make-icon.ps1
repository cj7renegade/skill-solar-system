# Draws the Skill Solar System icon and writes desktop\icon.ico (16-256 px) and desktop\icon.png (256 px).
# A gold sun on the app's navy background, two orbit rings, and planets in the subject colours.
# Run again after editing to regenerate:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\make-icon.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$out = Join-Path (Split-Path -Parent $PSScriptRoot) 'desktop'
$color = { param($hex) [System.Drawing.ColorTranslator]::FromHtml($hex) }

function Draw-Icon([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.Clear([System.Drawing.Color]::Transparent)
  $s = $size / 256.0
  $disc = { param($cx, $cy, $r, $brush) $g.FillEllipse($brush, [single](($cx - $r) * $s), [single](($cy - $r) * $s), [single](2 * $r * $s), [single](2 * $r * $s)) }
  # Rounded navy tile
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rad = 52 * $s; $w = $size - 1
  $path.AddArc(0, 0, $rad, $rad, 180, 90); $path.AddArc($w - $rad, 0, $rad, $rad, 270, 90)
  $path.AddArc($w - $rad, $w - $rad, $rad, $rad, 0, 90); $path.AddArc(0, $w - $rad, $rad, $rad, 90, 90); $path.CloseFigure()
  $tile = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Point]::new(0, 0)), ([System.Drawing.Point]::new(0, $size)), (& $color '#18304d'), (& $color '#080e19')
  $g.FillPath($tile, $path)
  # Orbit rings (fewer and thicker at small sizes so they stay visible)
  $ringWidth = [Math]::Max(1.2, 7 * $s)
  $ring = New-Object System.Drawing.Pen ((& $color '#7f93ad')), ([single]$ringWidth)
  if ($size -ge 32) { $g.DrawEllipse($ring, [single](34 * $s), [single](34 * $s), [single](188 * $s), [single](188 * $s)) }
  $g.DrawEllipse($ring, [single](72 * $s), [single](72 * $s), [single](112 * $s), [single](112 * $s))
  # Sun with a soft glow
  if ($size -ge 48) { & $disc 128 128 44 (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 233, 189, 121))) }
  & $disc 128 128 ([Math]::Max(30, 34)) (New-Object System.Drawing.SolidBrush (& $color '#e9bd79'))
  # Planets in subject colours: Electronics teal, Physics purple, Computing blue, Mechanics coral
  $p = [Math]::Max(15, 17)
  & $disc 184 128 $p (New-Object System.Drawing.SolidBrush (& $color '#72d7c5'))
  & $disc 72 128 $p (New-Object System.Drawing.SolidBrush (& $color '#c997fb'))
  if ($size -ge 32) {
    & $disc 61 61 ($p + 2) (New-Object System.Drawing.SolidBrush (& $color '#79baff'))
    & $disc 195 195 ($p - 1) (New-Object System.Drawing.SolidBrush (& $color '#ef9290'))
  }
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  if ($size -eq 256) {
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $out 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } else {
    # Classic icon bitmap: a 40-byte header, 32-bit BGRA rows bottom-up, then a 1-bit transparency mask.
    $w = New-Object System.IO.BinaryWriter $ms
    $w.Write([UInt32]40); $w.Write([Int32]$size); $w.Write([Int32]($size * 2)); $w.Write([UInt16]1); $w.Write([UInt16]32)
    $w.Write([UInt32]0); $w.Write([UInt32]0); $w.Write([Int32]0); $w.Write([Int32]0); $w.Write([UInt32]0); $w.Write([UInt32]0)
    for ($y = $size - 1; $y -ge 0; $y--) { for ($x = 0; $x -lt $size; $x++) { $c = $bmp.GetPixel($x, $y); $w.Write([byte]$c.B); $w.Write([byte]$c.G); $w.Write([byte]$c.R); $w.Write([byte]$c.A) } }
    $maskRow = [int]([Math]::Ceiling($size / 32.0) * 4)
    for ($y = $size - 1; $y -ge 0; $y--) {
      $row = New-Object byte[] $maskRow
      for ($x = 0; $x -lt $size; $x++) { if ($bmp.GetPixel($x, $y).A -lt 128) { $row[[int][Math]::Floor($x / 8)] = $row[[int][Math]::Floor($x / 8)] -bor (0x80 -shr ($x % 8)) } }
      $w.Write($row)
    }
    $w.Flush()
  }
  $bmp.Dispose()
  return ,$ms.ToArray()
}

# An .ico is a small directory followed by one image per size: classic bitmaps up to 128 px, PNG at 256.
$sizes = 16, 24, 32, 48, 64, 128, 256
$images = foreach ($size in $sizes) { ,(Draw-Icon $size) }
$file = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $file
$writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $dim = if ($sizes[$i] -ge 256) { 0 } else { $sizes[$i] }
  $writer.Write([byte]$dim); $writer.Write([byte]$dim); $writer.Write([byte]0); $writer.Write([byte]0)
  $writer.Write([UInt16]1); $writer.Write([UInt16]32); $writer.Write([UInt32]$images[$i].Length); $writer.Write([UInt32]$offset)
  $offset += $images[$i].Length
}
foreach ($image in $images) { $writer.Write($image) }
$writer.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $out 'icon.ico'), $file.ToArray())
Write-Host "Wrote $(Join-Path $out 'icon.ico') ($($file.Length) bytes, sizes $($sizes -join ', '))"
