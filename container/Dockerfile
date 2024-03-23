FROM node:20-slim
LABEL authors="Kit Plummer <kit@ditto.live>"

WORKDIR /app

COPY container/start_node.sh /app/
COPY package*.json /app/
COPY dist /app/dist

RUN npm install && npm cache clean --force && chmod +x /app/start_node.sh
ENTRYPOINT ["/app/start_node.sh"]
CMD ["autov"]
