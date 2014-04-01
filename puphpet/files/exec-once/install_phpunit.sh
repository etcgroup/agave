#!/bin/bash

echo "Installing PHPUnit..."
pear config-set auto_discover 1
pear install --force pear.phpunit.de/PHPUnit
