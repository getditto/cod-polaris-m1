#!/bin/bash
# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
    echo "** Trapped CTRL-C"
}

args_array=("$@")
for i in "${args_array[@]}"; do
    :
    echo "### Got variable $i ###"
done
echo "args_count = $#"
eval "$@"
