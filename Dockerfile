FROM node
LABEL authors="Kit Plummer <kit@ditto.live>"

# update dependencies and install curl
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Create app directory
WORKDIR /app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# COPY package*.json ./ \
#     ./source ./

# This will copy everything from the source path
# --more of a convenience when testing locally.
COPY start_node.sh /app/
COPY package*.json /app/
COPY dist /app/dist
# update each dependency in package.json to the latest version
RUN npm install

RUN chmod +x /app/start_node.sh
ENTRYPOINT ["/app/start_node.sh"]
CMD ["autov"]
