# FROM python:3.8.0
#FROM ubuntu:18.04
FROM condaforge/mambaforge

## Must add `DEBIAN_FRONTEND=noninteractive` to prevent any os waiting for user input situations
  ## see --> https://askubuntu.com/questions/909277/avoiding-user-interaction-with-tzdata-when-installing-certbot-in-a-docker-contai
ARG DEBIAN_FRONTEND=noninteractive

ENV DISPLAY :1

#RUN git clone --depth=1 https://github.com/Bash-it/bash-it.git ~/.bash_it && \
#    bash ~/.bash_it/install.sh --silent

# curl -sL https://deb.nodesource.com/setup_12.x | bash - && \

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y nodejs \
                       supervisor \
                       openssl \
                       xvfb \
                       x11vnc \
                       scilab \
                       openbox && apt-get clean 

RUN mamba install nodejs git -y

RUN pip install --upgrade pip && \
    pip install --upgrade \
    PyVirtualDisplay \
    pillow \
    numpy \
    pandas \
    dash \
    Jupyterlab \
    ipywidgets \
    jupyterlab-git \
    jupyter-server-proxy \
    jupyter-dash \
    jupyterlab-novnc \
    nbserverproxy 

RUN jupyter lab build
# RUN pip install --upgrade pip && \
#     pip install --upgrade \
#     jupyterlab "pywidgets>=7.5"
RUN jupyter serverextension enable --py nbserverproxy

RUN jupyter labextension install \
    jupyterlab-plotly@4.14.3 \
    @jupyter-widgets/jupyterlab-manager \
    @jupyterlab/git \
    @jupyterlab/server-proxy

#COPY config/ /root/.jupyter/


VOLUME /notebooks
WORKDIR /notebooks

RUN git clone https://github.com/novnc/noVNC.git ./novnc  && \
    git clone https://github.com/novnc/websockify.git ./novnc/utils/websockify

COPY entrypoint.sh .

RUN chmod -R 755 /notebooks/
EXPOSE 8888 8050 5901 6080 8081
ENTRYPOINT ["/notebooks/entrypoint.sh"]