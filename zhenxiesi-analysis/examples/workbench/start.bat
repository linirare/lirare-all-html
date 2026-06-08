@echo off
chcp 65001 >nul
echo ========================================
echo   Agent Workbench - 本地启动
echo ========================================
echo.

:: 启动后端（端口 8765）
echo [1/2] 启动后端服务...
start "Agent Backend" cmd /c "cd /d D:\agent memory\agent memory\workbench\backend && python server.py"

:: 等后端起来
timeout /t 3 /nobreak >nul

:: 打开前端
echo [2/2] 打开工作台...
start "" "D:\agent memory\agent memory\workbench\index.html"

echo.
echo 工作台已启动！前端会自动连接后端。
echo 关闭时关掉后端命令行窗口即可。
echo.
pause
