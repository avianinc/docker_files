# 1. setting up python 3.8 kernal using RAPIDS Image at Ubuntu 20.04
FROM rapidsai/rapidsai-core:cuda11.0-base-ubuntu20.04-py3.8
# Set our locale to en_US.UTF-8.
ENV LANG en_US.UTF-8
ENV LC_CTYPE en_US.UTF-8
USER root
RUN set -x \
  && apt-get update \
  && apt-get install -y \
      apt-utils \
      lsb-release \
      gnupg2 \
  && apt install -y \
      python3-pip \
      build-essential \
      default-libmysqlclient-dev \
      libmysqlclient-dev \
      gosu \
      git \
 # packages for network troubleshooting
      vim \
      iputils-ping \
      telnet \
      netcat \
      tcpdump \
      net-tools \
      curl \
      git-all \
      cron \
# requirement for cloud filestore mount (user notebook files)
      nfs-common \
# install sudo to mount jupyterhub home directory
      sudo \
      yarn \
  &&  rm -rf ~/.cache
# setting up ENV variables for Jupyterhub SSL certificate and key
ENV SSL_CERT /srv/jupyterhub/secrets/jupyterhub.crt
ENV SSL_KEY /srv/jupyterhub/secrets/Jupyterhub.key
# copy users
RUN mkdir -p /srv/jupyterhub
COPY ./users/create_users.sh /srv/jupyterhub/users/create_users.sh
COPY ./userlist /srv/jupyterhub/userlist
RUN chmod 700 /srv/jupyterhub/users && \
    chmod 600 /srv/jupyterhub/users/*
RUN ["chmod", "+x", "/srv/jupyterhub/users/create_users.sh"]
# create all jupyterlab users at the OS level
RUN /srv/jupyterhub/users/create_users.sh
# setting up conda and nodejs
RUN conda update conda --quiet --yes && \
conda config --system --append channels conda-forge && \
conda config --system --set show_channel_urls true && \
conda update --all --quiet --yes && \
conda install -y -c conda-forge nodejs && \
conda install -y -c conda-forge/label/gcc7 nodejs && \
conda install -y -c conda-forge/label/cf201901 nodejs && \
conda install -y -c conda-forge/label/cf202003 nodejs
# install python packages (example)
RUN source activate rapids && \
pip3 install \
anaconda \
pandas \
numpy \
scipy \
notebook \
plotly && \
# install external packages (like xgboost)
apt-get install -y build-essential cmake && \
git clone --recursive https://github.com/dmlc/xgboost && \
cd xgboost && \
mkdir build && \
cd build && \
cmake .. && \
make -j$(nproc) && \
pip3 install xgboost && cd .. && \
source deactivate && \
unset OLDPWD
# install external packages (like xgboost)
apt-get install -y build-essential cmake && \
git clone --recursive https://github.com/dmlc/xgboost && \
cd xgboost && \
mkdir build && \
cd build && \
cmake .. && \
make -j$(nproc) && \
pip3 install xgboost && cd .. && \
source deactivate && \
unset OLDPWD
# setting up jupyterlab and jupyterhub
USER $NB_USER
WORKDIR /srv/jupyterhub
RUN pip3 install jupyterlab==3.0.16 && \
conda install jupyterhub && \
jupyterhub --generate-config
CMD ["jupyterhub"]
# copying kernel config files
COPY ./config/python3-8-kernel-config.json /usr/local/share/jupyter/kernels/python3_8/kernel.json
COPY ./config/python3-8-kernel.sh /usr/local/share/jupyter/kernels/python3_8/python3-8-kernel.sh
RUN chmod 755 /usr/local/share/jupyter/kernels/python3_8/python3-8-kernel.sh
# setting libcuda.so so that it can point to NVIDIA drivers and fix ptxjitcompiler not found issue
RUN cp /usr/local/cuda-11.0/compat/libcuda.so.1 /usr/lib/x86_64-linux-gnu && \
cp /usr/local/cuda-11.0/compat/libcuda.so.450.119.04 /usr/lib/x86_64-linux-gnu
# 2. python 3.7 kernel
USER root
ENV PYTHON_3_7_ENV python3_7
RUN conda install -c anaconda python=3.7.7 && \
    conda update --all && \
    conda config --append channels conda-forge && \
    conda create --yes --quiet --name $PYTHON_3_7_ENV python=3.7.7 && \
    source activate $PYTHON_3_7_ENV && \
    pip3 install notebook && \
    pip3 install pandas==1.2.0 && \
    pip config set global.progress_bar off && \
    pip config set global.index-url https://pypi.org/simple && \
    source deactivate && \
    conda clean -tipsy && \
    unset OLDPWD
COPY ./config/python3-7-kernel-config.json /usr/local/share/jupyter/kernels/python3_7/kernel.json
COPY ./config/python3-7-kernel.sh /usr/local/share/jupyter/kernels/python3_7/python3-7-kernel.sh
RUN chmod 755 /usr/local/share/jupyter/kernels/python3_7/python3-7-kernel.sh
# 3. R Studio Kernel
COPY ./rstudio/r_kernel.sh /srv/jupyterhub/rstudio/r_kernel.sh
RUN chmod 700 /srv/jupyterhub/rstudio && \
    chmod 600 /srv/jupyterhub/rstudio/*
ENV PATH=$PATH:/usr/lib/rstudio-server/bin
ENV RSTUDIO_ENV RSTUDIO
RUN conda update --all && \
    conda config --append channels conda-forge && \
    conda create --yes --quiet --name $RSTUDIO_ENV && \
    source activate $RSTUDIO_ENV && \
# rstudio-server
    apt-get update && \
    curl --silent -L --fail https://download2.rstudio.org/server/xenial/amd64/rstudio-server-1.3.1093-amd64.deb > /tmp/rstudio-server-1.3.1093-amd64.deb && \
    apt-get install -y /tmp/rstudio-server-1.3.1093-amd64.deb && \
    rm /tmp/rstudio-server-1.3.1093-amd64.deb && \
    apt-get clean && \
# setting up depednecies before installing R packages
    apt-get update && \
    apt-get install -y libcurl4-openssl-dev && \
    apt-get install -y libssl-dev && \
    apt-get install -y libxml2-dev && \
# installing R packages
    Rscript -e "install.packages('xgboost', dependencies = TRUE)" && \
    Rscript /srv/jupyterhub/rstudio/r_kernel.sh && \
    source deactivate && \
    conda clean -tipsy && \
    unset OLDPWD
COPY ./rstudio/r-kernel-config.json /usr/local/share/jupyter/kernels/r/kernel.json
COPY ./rstudio/r_kernel.sh /usr/local/share/jupyter/kernels/r/r_kernel.sh
RUN chmod 755 /usr/local/share/jupyter/kernels/r/r_kernel.sh
# additional packages and cleanup
RUN pip3 install notebook && \
pip3 install jupyterlab==3.0.16 && \
rm -r -f /usr/local/share/jupyter/kernels/r
