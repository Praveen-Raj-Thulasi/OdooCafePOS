#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/cafinity-backend"

echo -e "${YELLOW}Authenticating Docker with AWS ECR...${NC}"
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL

echo -e "\n${YELLOW}Building backend Docker image...${NC}"
docker build -t cafinity-backend ../backend

echo -e "\n${YELLOW}Tagging image...${NC}"
docker tag cafinity-backend:latest $ECR_URL:latest

echo -e "\n${YELLOW}Pushing image to ECR...${NC}"
docker push $ECR_URL:latest

echo -e "\n${YELLOW}Triggering force deployment in ECS Fargate...${NC}"
aws ecs update-service \
  --cluster odoo-cafe-cluster-prod \
  --service odoo-cafe-backend-service-prod \
  --force-new-deployment \
  --region us-east-1

echo -e "\n${GREEN}Deployment triggered successfully! Fargate will spin up the updated container now.${NC}"
