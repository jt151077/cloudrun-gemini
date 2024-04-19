const your_project_id = "jeremy-g9tual6k";
const your_region = "europe-west1";

const axios = require("axios");

module.exports = {
    getProjectId: async () => {
        let project = "";
        try {
            // Fetch the token to make a GCF to GCF call
            const response = await axios.get(
                "http://metadata.google.internal/computeMetadata/v1/project/project-id",
                {
                    headers: {
                        "Metadata-Flavor": "Google"
                    }
                }
            );

            if (response.data == "") {
                // running locally on Cloud Shell
                project = your_project_id;
            } else {
                // use project id from metadata service
                project = response.data;
            }
        } catch (ex) {
            // running locally on local terminal
            project = your_project_id;
        }

        return project;
    },

    getRegion: async () => {
        let region = "";
        try {
            // Fetch the token to make a GCF to GCF call
            const response = await axios.get(
                "http://metadata.google.internal/computeMetadata/v1/instance/region",
                {
                    headers: {
                        "Metadata-Flavor": "Google"
                    }
                }
            );

            if (response.data == "") {
                // running locally on Cloud Shell
                region = your_region;
            } else {
                // use region from metadata service
                let regionFull = response.data;
                const index = regionFull.lastIndexOf("/");
                region = regionFull.substring(index + 1);
            }
        } catch (ex) {
            // running locally on local terminal
            region = your_region;
        }
        return region;
    }
};