#!/bin/bash -x

# Ensure script stops when commands fail.
set -e

sqlite3 /var/www/html/storage/database/database.sqlite "VACUUM INTO /tmp/db_backup.sqlite"
gzip /tmp/db_backup.sqlite

aws s3 cp /tmp/db_backup.sqlite.gz s3://safibre/db_backup-`date +%d`.gz \
  --endpoint-url $AWS_ENDPOINT_URL_S3 \
  --region $AWS_REGION \
  --access-key-id $AWS_ACCESS_KEY_ID \
  --secret-access-key $AWS_SECRET_ACCESS_KEY
