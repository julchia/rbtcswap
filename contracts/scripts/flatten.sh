#!/usr/bin/env bash

if [ -d "flats" ]; then
    rm -rf flats/*
else
    mkdir flats
fi

files=(
    ./contracts/FastSwap.sol
)

for filename in "${files[@]}"; do
    name=${filename##*/}
    ./node_modules/.bin/truffle-flattener $filename > ./flats/${name%.*}Flattened.sol
    sed -i '/SPDX-License-Identifier: MIT/d' ./flats/${name%.*}Flattened.sol
    echo "|> $filename ** Flattened"
done
