
# Builds a desktop version of jupyter lab for MBSE experimentation with sysmlv2 with noVNC+xrdp
# Added Gonme desktop for fun stuff
# J.K DeHart
# jdehart@avian.com
##############################

#FROM continuumio/miniconda3
FROM condaforge/mambaforge

## Must add `DEBIAN_FRONTEND=noninteractive` to prevent any os waiting for user input situations
  ## see --> https://askubuntu.com/questions/909277/avoiding-user-interaction-with-tzdata-when-installing-certbot-in-a-docker-contai
ARG DEBIAN_FRONTEND=noninteractive

## Update server
RUN apt-get --quiet --yes update
RUN apt-get -y upgrade     

# EPOSE 3389 for xrdp
# or ubuntu-desktop
RUN apt-get install -y --no-install-recommends gnome-desktop xrdp snapd
RUN snap install novnc

## Clean up a bit to keep the image small
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

## Build the jupyter lab environment
RUN mamba install -c conda-forge -y git nodejs \
    sos sos-notebook jupyterlab-sos sos-papermill sos-r sos-python sos-bash \
<<<<<<< HEAD
    jupyter-sysml-kernel jupyterlab-git
=======
    jupyter-sysml-kernel jupyterlab-git jupyter_kernel_gateway

RUN pip install elyra jupyterlab-scheduler jupyterlab-interactive-dashboard-editor \
    openmdao[all] jupyter-contrib-core jupyter-contrib-nbextensions
>>>>>>> 6ec6f58285513b7a02677fffb1e622784517b636

RUN pip install jupyterlab-novnc
RUN jupyter lab build

##
## Non-root user is a requirement of Binder:
##   https://mybinder.readthedocs.io/en/latest/tutorials/dockerfile.html
ARG NB_USER=ubuntu
ARG NB_UID=1000
ENV USER ${NB_USER}
ENV NB_UID ${NB_UID}
ENV HOME /home/${NB_USER}

RUN adduser --disabled-password \
    --gecos "Default user" \
    --uid ${NB_UID} \
    ${NB_USER}

USER root
RUN chown -R ${NB_UID} ${HOME}

# create links to scilab
#RUN ln -s ./opt/scilab-6.1.0/bin/scilab-cli /home/ubuntu/scilab

## Switch to the lowly user, no more root.
USER ${NB_USER}
WORKDIR ${HOME}

## Move to home directory
RUN cd /home/ubuntu

## Move any files in the top level directory to the doc directory
#RUN find . -maxdepth 1 -type f -exec mv \{\} doc \;

## Copy all notebooks into the docker image. Move them into a notebooks
## subdirectory so that nbviewer + mybinder can work together.
#RUN mkdir notebooks
#COPY --chown=${NB_USER} notebooks/ notebooks/

## This only makes sense in the `make spin-up` environment, i.e. locally
#RUN rm notebooks/*/StartHere.ipynb

## Trust the notebooks so that the SVG images will be displayed.
#RUN find . -name \*.ipynb -exec jupyter trust \{\} \;

# Setup Jupyterlab server and run
EXPOSE 8888
<<<<<<< HEAD
EXPOSE 3389

=======
>>>>>>> 6ec6f58285513b7a02677fffb1e622784517b636
CMD ["jupyter", "lab", "--ip='*'", "--port=8888", "--no-browser", "--allow-root"]

# Used for trouble shooting
# CMD ["/bin/bash"]
