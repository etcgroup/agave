#!/bin/bash
set -e

echo "Installing NodeJS and NPM..."
add-apt-repository --yes ppa:chris-lea/node.js
apt-get update --yes
apt-get install --yes python-software-properties python g++ make nodejs

echo "Installing grunt globally..."
npm install -g grunt-cli

echo "Installing agave node_modules..."
sudo -u vagrant bash -c "cd /home/vagrant/agave && npm install --no-bin-link"
