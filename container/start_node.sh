#!/bin/bash

args_array=("$@")
for i in "${args_array[@]}"; do
    :
    echo "### Got variable $i ###"
done

eval "$@"
