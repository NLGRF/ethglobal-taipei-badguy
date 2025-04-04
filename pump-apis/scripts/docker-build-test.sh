#!/bin/bash

# Create scripts directory if it doesn't exist
mkdir -p scripts

echo "Building Docker image..."
docker build -t pump-apis:test .

if [ $? -eq 0 ]; then
  echo "Docker build successful!"
  echo "Running container for testing..."
  docker run -d --name pump-apis-test -p 3000:3000 pump-apis:test
  
  echo "Waiting for server to start..."
  sleep 5
  
  echo "Testing API health check..."
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api)
  
  if [ "$response" -eq 200 ]; then
    echo "Health check passed! API is running correctly."
  else
    echo "Health check failed with HTTP code $response"
  fi
  
  echo "Stopping and removing test container..."
  docker stop pump-apis-test
  docker rm pump-apis-test
  
  echo "Docker test completed."
else
  echo "Docker build failed."
fi 