@echo off
cd /d d:\praviceCode\mockTrading\server
set MONGO_URI=mongodb://admin:password@localhost:27017/mockTrading?authSource=admin
set PORT=5000
echo Starting server with MONGO_URI: %MONGO_URI%
node server.js