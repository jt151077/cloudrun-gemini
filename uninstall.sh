#!/bin/bash

echo 'Destroying all resources'

gcloud beta deploy delete --file clouddeploy.yaml --force --region europe-west1 --project PROJECT_ID
terraform apply -destroy -auto-approve