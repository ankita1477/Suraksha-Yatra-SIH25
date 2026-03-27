# Deployment Guide for AI Service on AWS EC2

## Overview
This guide deploys the AI service on AWS EC2, same deployment style as your backend API.
Recommended runtime:
- Backend API: port `4000`
- AI Service: port `5000`
- Process manager: PM2
- Reverse proxy: Nginx

## 1. Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_AWS_EC2_IP
```

## 2. Install Python and dependencies
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx
```

## 3. Upload or pull project
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/Suraksha-Yatra-SIH25.git
cd Suraksha-Yatra-SIH25/ai-service
```

## 4. Create runtime environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip==23.1.2 setuptools==67.8.0 wheel==0.40.0
pip install -r requirements.txt
```

## 5. Configure environment variables
Create `.env` in `ai-service/`:
```bash
AI_HOST=0.0.0.0
AI_PORT=5000
DEBUG=false
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/suraksha?retryWrites=true&w=majority
MONGODB_DATABASE=suraksha
```

## 6. Run AI service with PM2
Install PM2 if needed:
```bash
sudo npm install -g pm2
```

Start service:
```bash
cd ~/Suraksha-Yatra-SIH25/ai-service
pm2 start "source .venv/bin/activate && gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --threads 4 --timeout 120" --name suraksha-ai
pm2 save
pm2 startup
```

Check status/logs:
```bash
pm2 status
pm2 logs suraksha-ai
```

## 7. Nginx config (optional but recommended)
If you want AI exposed behind Nginx under `/ai/`:

Edit your Nginx site config (example `/etc/nginx/sites-available/default`):
```nginx
location /ai/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Verify deployment
Direct AI service:
```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/api/health
```

If using Nginx path:
```bash
curl http://YOUR_AWS_EC2_IP/ai/health
```

## 9. Update backend configuration
In backend `.env` on EC2:
```bash
AI_SERVICE_URL=http://127.0.0.1:5000
```

If backend uses Nginx route instead:
```bash
AI_SERVICE_URL=http://YOUR_AWS_EC2_IP/ai
```

Then restart backend process:
```bash
pm2 restart suraksha-backend
```

## 10. Quick update workflow
After code updates:
```bash
cd ~/Suraksha-Yatra-SIH25
git pull
cd ai-service
source .venv/bin/activate
pip install -r requirements.txt
pm2 restart suraksha-ai
```

## Troubleshooting
- AI not reachable: check `pm2 logs suraksha-ai` and `sudo nginx -t`
- MongoDB errors: verify `MONGODB_URL` and Atlas network access
- Slow startup: first model warm-up can take time; keep PM2 process running
