#!/bin/sh

sudo yum update -y
sudo yum install docker -y

# config docker
sudo usermod -a -G docker ec2-user
id ec2-user
newgrp docker

# enable docker
sudo systemctl enable docker.service
sudo systemctl start docker.service

# create env file
echo 'FIREBASE_SA_BASE64={FIREBASE_SA_BASE64}
DISCORD_TOKEN={DISCORD_TOKEN}
GITHUB_ACCESS_TOKEN={GITHUB_ACCESS_TOKEN}
' > /home/ec2-user/.env

# setup warp?
echo "WARP mode: client warp+doh."

# install cloudflare warp
curl -fsSl https://pkg.cloudflareclient.com/cloudflare-warp-ascii.repo | sudo tee /etc/yum.repos.d/cloudflare-warp.repo

# Update repo
sudo yum update
sudo yum install cloudflare-warp -y

sudo warp-cli --accept-tos registration new
sudo warp-cli --accept-tos mode warp+doh

sudo warp-cli --accept-tos add-excluded-route 0.0.0.0/0
sudo warp-cli --accept-tos connect

# pull discord image
docker run -d \
	--name presence \
	--env-file=/home/ec2-user/.env \
	--restart=always \
	hacksore/presence-bot:latest
