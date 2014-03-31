#!/bin/bash

echo "Loading initial data for agave.corpora"
mysql -u root -proot agave << EOF
REPLACE INTO corpora
    (id, name, created, host, port, corpora.schema, user, password)
VALUES
    ('agave_corpus', 'Agave Development Corpus', NOW(), 'localhost', 3306, 'agave_corpus', 'agave', 'agave');
EOF
