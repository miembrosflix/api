# api

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

source ~/.bashrc

nvm install 16.17.0

git clone https://github.com/{usuario}/{repositorio}.git

cd ./api-convertzapp

npm install

npm i -g pm2

pm2 start ./index.js

apt install nginx

apt update

nano /etc/nginx/sites-available/default

proxy_pass http://localhost:3000;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;

nginx -t

systemctl restart nginx
