#-------------------------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See https://go.microsoft.com/fwlink/?linkid=2090316 for license information.
#-------------------------------------------------------------------------------------------------------------

# To fully customize the contents of this image, use the following Dockerfile instead:
# https://github.com/microsoft/vscode-dev-containers/tree/v0.117.1/containers/javascript-node-12/.devcontainer/Dockerfile
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-12 AS base

FROM base AS ci-cd

# ,------.                              ,--.                                               ,--.   
# |  .-.  \   ,---.  ,--.  ,--.  ,---.  |  |  ,---.   ,---.  ,--,--,--.  ,---.  ,--,--,  ,-'  '-. 
# |  |  \  : | .-. :  \  `'  /  | .-. : |  | | .-. | | .-. | |        | | .-. : |      \ '-.  .-' 
# |  '--'  / \   --.   \    /   \   --. |  | ' '-' ' | '-' ' |  |  |  | \   --. |  ||  |   |  |   
# `-------'   `----'    `--'     `----' `--'  `---'  |  |-'  `--`--`--'  `----' `--''--'   `--'   
#                                                    `--'                                                                       
FROM ci-cd AS development

RUN echo "alias gst='git status'"  >> ~/.bashrc \ 
    && echo "alias gcm='git checkout master'"  >> ~/.bashrc \  
    && echo "alias gp='git push'"  >> ~/.bashrc \  
    && echo "alias gcam='git commit -a -m'"  >> ~/.bashrc \  
    && echo "alias gpsup='git push --set-upstream origin $(git_current_branch)'"  >> ~/.bashrc \  
    && echo "alias gcb='git checkout -b'" >> ~/.bashrc \
    && echo "alias gitsetup='git config --global user.name $GIT_USER && git config --global user.email $GIT_EMAIL && mkdir -p ~/.ssh && cp -u /root/host-ssh/id_rsa ~/.ssh && chmod 600 ~/.ssh/id_rsa && ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub'" >> ~/.bashrc


# ,------.                     ,--.                   ,--.   ,--.                  
# |  .--. ' ,--.--.  ,---.   ,-|  | ,--.,--.  ,---. ,-'  '-. `--'  ,---.  ,--,--,  
# |  '--' | |  .--' | .-. | ' .-. | |  ||  | | .--' '-.  .-' ,--. | .-. | |      \ 
# |  | --'  |  |    ' '-' ' \ `-' | '  ''  ' \ `--.   |  |   |  | ' '-' ' |  ||  | 
# `--'      `--'     `---'   `---'   `----'   `---'   `--'   `--'  `---'  `--''--' 

# docker build -f .devcontainer/Dockerfile --target production .
FROM ci-cd AS production-build

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY *.json ./

RUN npm install --no-optional

COPY . .

RUN npm run build

FROM nginx AS production

COPY --from=production-build /home/node/app/dist /usr/share/nginx/html



