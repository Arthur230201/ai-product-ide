# 清理 Next.js 缓存并重启开发服务器
Write-Host "=== 清理 Next.js 缓存 ===" -ForegroundColor Cyan

# 检查 .next 文件夹是否存在
if (Test-Path .next) {
    Write-Host "正在删除 .next 缓存文件夹..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✓ 缓存已删除" -ForegroundColor Green
} else {
    Write-Host "✓ .next 文件夹不存在，无需清理" -ForegroundColor Green
}

# 检查 node_modules/.cache 是否存在
if (Test-Path node_modules\.cache) {
    Write-Host "正在删除 node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ node_modules/.cache 已删除" -ForegroundColor Green
}

Write-Host "`n=== 清理完成 ===" -ForegroundColor Green
Write-Host "现在请运行: npm run dev" -ForegroundColor Cyan























