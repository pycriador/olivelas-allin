$jsonPath = 'static/data/anuncios.json'
$imagesDir = 'static/images'
if (!(Test-Path $imagesDir)) { New-Item -ItemType Directory -Force -Path $imagesDir }

$raw = Get-Content $jsonPath -Raw -Encoding UTF8
$anuncios = $raw | ConvertFrom-Json

$count = 0
foreach ($ad in $anuncios) {
    if ($ad.primaryImage -and $ad.primaryImage.StartsWith('http')) {
        $uri = $ad.primaryImage
        $fileName = ($uri.Split('?')[0]).Split('/')[-1]
        if (!$fileName -or $fileName.Length -lt 3) {
            $fileName = "  -primary .jpg\
 }
 $dest = Join-Path $imagesDir $fileName
 if (!(Test-Path $dest)) {
 try {
 Write-Host \Downloading $uri -> $fileName\
 Invoke-WebRequest -Uri $uri -OutFile $dest -TimeoutSec 15
 $count++
 } catch {
 Write-Warning \Falha ao baixar $uri : $_\
 }
 }
 $ad.primaryImage = \images/$fileName\
 }

 if ($ad.images) {
 foreach ($img in $ad.images) {
 if ($img.url -and $img.url.StartsWith('http')) {
 $uri = $img.url
 $fileName = ($uri.Split('?')[0]).Split('/')[-1]
 if (!$fileName -or $fileName.Length -lt 3) {
 $fileName = \.jpg\
 }
 $dest = Join-Path $imagesDir $fileName
 if (!(Test-Path $dest)) {
 try {
 Write-Host \Downloading $uri -> $fileName\
 Invoke-WebRequest -Uri $uri -OutFile $dest -TimeoutSec 15
 $count++
 } catch {
 Write-Warning \Falha ao baixar $uri : $_\
 }
 }
 $img.url = \images/$fileName\
 }
 }
 }
}

$updatedJson = $anuncios | ConvertTo-Json -Depth 10
Set-Content -Path $jsonPath -Value $updatedJson -Encoding UTF8
Write-Host \Total de novas imagens baixadas: $count\
