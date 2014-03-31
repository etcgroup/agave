#!/bin/bash

echo "Loading initial data for agave.corpora"
mysql -u root -proot agave << EOF
REPLACE INTO corpora (id, name, created)
VALUES (1, 'agave_corpus', NOW());
EOF
