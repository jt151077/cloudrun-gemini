/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#
### Service account for the frontend Cloud Run service
#
resource "google_service_account" "cloudrun_sa" {
  depends_on = [
    google_project_service.gcp_services
  ]

  project    = var.project_id
  account_id = var.service_account
}

resource "google_project_iam_member" "cloudrun_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}




#
### Service account for the backend Cloud Run service
#
resource "google_service_account" "backend_cloudrun_besa" {
  depends_on = [
    google_project_service.gcp_services
  ]

  project    = var.project_id
  account_id = "backend-cloudrun-besa"
}

#
### Frontend service account access to artifact registry to deploy the container
#
resource "google_project_iam_member" "be_run_artifactregistry_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.backend_cloudrun_besa.email}"
}

#
### Frontend service account access to write logs
#
resource "google_project_iam_member" "be_run_logs_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_cloudrun_besa.email}"
}

#
### Allow unauthorised access to frontend cloud run service (still must be accessed internal or via the Global Load Balancer)
#
resource "google_cloud_run_service_iam_binding" "be_unauthorised_access" {
  project  = var.project_id
  location = var.project_default_region
  service  = google_cloud_run_service.weather_service.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}