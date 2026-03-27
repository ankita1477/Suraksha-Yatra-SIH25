#!/bin/bash
# Deploy Gemini RAG chatbot to EC2
# Run: bash deploy-chatbot.sh
set -e

REPO=~/Suraksha-Yatra-SIH25
VENV=$REPO/ai-service/.venv
ENV_FILE=$REPO/ai-service/.env

echo "=== Pulling latest code ==="
cd $REPO
git pull origin main

echo "=== Installing new Python packages ==="
source $VENV/bin/activate
pip install "google-generativeai>=0.8.0" "flask-cors>=4.0.0"

echo "=== Setting GEMINI_API_KEY in .env ==="
if grep -q "GEMINI_API_KEY" $ENV_FILE; then
  sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=AIzaSyALAOU_Zf1eyckKjuGGkmDbngDmHyJUrmk|" $ENV_FILE
else
  echo "GEMINI_API_KEY=AIzaSyALAOU_Zf1eyckKjuGGkmDbngDmHyJUrmk" >> $ENV_FILE
fi

echo "=== Restarting AI service ==="
pm2 restart suraksha-ai
pm2 save

echo "=== Rebuilding dashboard ==="
cd $REPO/dashboard
npm install
npm run build

echo "=== Copying dashboard to web root ==="
sudo cp -r dist/* /var/www/html/

echo "=== Done! Testing /api/chat ==="
sleep 3
curl -s -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","session_id":"test"}' | python3 -m json.tool || true
