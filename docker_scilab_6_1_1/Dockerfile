
# Builds a Scilab latest docker containter for workflow analysos
# J.K DeHart
# jdehart@avian.com
##############################

#FROM continuumio/miniconda3
FROM ubuntu:20.04

## Must add `DEBIAN_FRONTEND=noninteractive` to prevent any os waiting for user input situations
  ## see --> https://askubuntu.com/questions/909277/avoiding-user-interaction-with-tzdata-when-installing-certbot-in-a-docker-contai
ARG DEBIAN_FRONTEND=noninteractive

## Update server
RUN apt-get --quiet --yes update
RUN apt-get -y upgrade
RUN apt-get install -yqq --no-install-recommends \
  build-essential \
  scilab      

## Clean up a bit to keep the image small
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# Used for trouble shooting
CMD ["/bin/bash"]
