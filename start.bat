@echo off
chcp 65001 > nul
title TubeFetch - YouTube Downloader
echo ====================================================
echo   TubeFetch: YouTube Video ^& Audio Downloader
echo   Starting server at http://localhost:3000 ...
echo ====================================================

start http://localhost:3000
node server.js
pause
