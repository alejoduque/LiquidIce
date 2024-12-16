#!/bin/bash

directories=("video" "audio" "texto" "foto" "documentos")

for dir in "${directories[@]}"; do
    # Create index.html in the root directory
    cp dirlisting.html "${dir}/index.html"
echo hecho    
done
