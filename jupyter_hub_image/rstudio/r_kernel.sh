#!/bin/Rscript
# R packages referred from https://support.rstudio.com/hc/en-us/articles/201057987-Quick-list-of-useful-R-packages
 install.packages(
     c(
       'DBI',
       'odbc',
.... {{type additional packages name here}}),
       repos='http://cran.us.r-project.org' 
       )
# Installing R Kernal via CRAN
install.packages('IRkernel')
# Making the kernel available to JupyterHub
IRkernel::installspec(user = FALSE)