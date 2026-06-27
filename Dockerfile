FROM nginx:alpine

# 复制静态资源到 nginx 站点目录
COPY app.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets

EXPOSE 80
