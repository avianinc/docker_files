#!/bin/sh
echo
jupyter lab --allow-root --ip=* --port=8888 &
/notebooks/novnc/utils/novnc_proxy --vnc localhost:5901 --listen 6080
fg %1 #puts job in forground