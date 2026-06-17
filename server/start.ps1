$env:MONGO_URI = "mongodb://admin:password@localhost:27017/mockTrading?authSource=admin"
$env:PORT = "5000"
Write-Host "Starting server with MONGO_URI: $env:MONGO_URI"
node server.js