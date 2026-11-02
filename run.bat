@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo SMART AGRICULTURAL IRRIGATION SYSTEM
echo ==========================================
if not exist out mkdir out
javac -encoding UTF-8 -d out src\*.java
if errorlevel 1 (
    echo.
    echo Compilation failed. Check the Java files and ensure a JDK is installed.
    pause
    exit /b 1
)
echo.
java -cp out Main
echo.
pause
