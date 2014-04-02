#!/bin/bash

echo "Installing pip..."
apt-get install --yes python-pip

echo "Installing virtualenv and virtualenvwrapper..."
pip install virtualenv virtualenvwrapper

echo "Making Agave virtualenv..."

su vagrant << EOF
export WORKON_HOME=$HOME/.virtualenvs
if [ -e '/usr/local/bin/virtualenvwrapper.sh' ]; then
    source /usr/local/bin/virtualenvwrapper.sh
    mkvirtualenv -a /home/vagrant/agave agave

    echo "Installing twitter-monitor"
    workon agave
    pip install twitter-monitor
fi
EOF