Add-Type -AssemblyName System.Drawing
$size = 64
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# fundo: quadrado escuro arredondado
$r = 12
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $r*2, $r*2, 180, 90)
$path.AddArc($size-$r*2-1, 0, $r*2, $r*2, 270, 90)
$path.AddArc($size-$r*2-1, $size-$r*2-1, $r*2, $r*2, 0, 90)
$path.AddArc(0, $size-$r*2-1, $r*2, $r*2, 90, 90)
$path.CloseFigure()
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 10, 6))
$g.FillPath($bgBrush, $path)

# gema dourada (losango facetado)
$cx = 32; $cy = 34; $w = 17; $h = 13
$pts = @(
  (New-Object System.Drawing.Point(($cx-$w), $cy)),
  (New-Object System.Drawing.Point(($cx - [int]($w/2)), ($cy-$h))),
  (New-Object System.Drawing.Point(($cx + [int]($w/2)), ($cy-$h))),
  (New-Object System.Drawing.Point(($cx+$w), $cy)),
  (New-Object System.Drawing.Point($cx, ($cy+$h+3))),
  (New-Object System.Drawing.Point(($cx-$w), $cy))
)
$goldDark = [System.Drawing.Color]::FromArgb(255, 136, 111, 31)
$gold = [System.Drawing.Color]::FromArgb(255, 212, 175, 55)
$fill = New-Object System.Drawing.SolidBrush($goldDark)
$g.FillPolygon($fill, $pts)
$penGold = New-Object System.Drawing.Pen($gold, 2)
$g.DrawPolygon($penGold, $pts)
$g.DrawLine($penGold, ($cx-$w), $cy, ($cx+$w), $cy)
$g.DrawLine($penGold, ($cx - [int]($w/2)), ($cy-$h), ($cx - [int]($w/4)), $cy)
$g.DrawLine($penGold, ($cx - [int]($w/4)), $cy, $cx, ($cy+$h+3))
$g.DrawLine($penGold, ($cx + [int]($w/2)), ($cy-$h), ($cx + [int]($w/4)), $cy)
$g.DrawLine($penGold, ($cx + [int]($w/4)), $cy, $cx, ($cy+$h+3))

$g.Dispose()

# salva como .ico multi-tamanho real (64 + 32 + 16)
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)
$sizes = @(64, 32, 16)
$images = @()
foreach ($s in $sizes) {
  $sb = New-Object System.Drawing.Bitmap($bmp, $s, $s)
  $msImg = New-Object System.IO.MemoryStream
  $sb.Save($msImg, [System.Drawing.Imaging.ImageFormat]::Png)
  $images += , $msImg.ToArray()
  $msImg.Dispose()
}
$bw.Write([uint16]0)      # reserved
$bw.Write([uint16]1)      # type icon
$bw.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
foreach ($s in $sizes) {
  $data = $images[$sizes.IndexOf($s)]
  $bw.Write([byte]$s)     # width
  $bw.Write([byte]$s)     # height
  $bw.Write([byte]0)      # palette
  $bw.Write([byte]0)      # reserved
  $bw.Write([uint16]1)    # planes
  $bw.Write([uint16]32)   # bpp
  $bw.Write([uint32]$data.Length)
  $bw.Write([uint32]$offset)
  $offset += $data.Length
}
foreach ($s in $sizes) {
  $bw.Write($images[$sizes.IndexOf($s)])
}
[System.IO.File]::WriteAllBytes('D:\PROJETOS\SKILL\Z.AI\finance-app\publish\finance.ico', $ms.ToArray())
$bw.Dispose(); $ms.Dispose()
Write-Host 'ICO criado com 64/32/16'
