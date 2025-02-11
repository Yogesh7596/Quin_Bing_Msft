/**
 * owner : retrAIver
 * author : Manish from Affine
 */
//import api from "./interceptor";
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

class documentService {
  uploadFiles(email, file, remarks) {
    const payload = new FormData();
    payload.append("email", email);
    payload.append("remarks", remarks);
    file.forEach((ele, i) => {
      payload.append("files", ele);
    });
    const config = {
      headers: { "content-type": "multipart/form-data" },
    };
    return api.post(`/api/uploadFile`, payload, config).then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });;
  }

  saveDatabricksSettings(databricks_connection_settings) {
    console.log("dat", databricks_connection_settings)
    return api.post(`/save_databricks_settings`, databricks_connection_settings).then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
  }

  saveGCPSettings(gcp_connection_settings) {
    console.log("dat", gcp_connection_settings);
    const private_key = gcp_connection_settings["private_key"].replace("\\\\", "\\");
    console.log(private_key)
    gcp_connection_settings['private_key'] = private_key
    return api.post(`api/save_gcp_settings`, gcp_connection_settings).then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
  }

  saveAzureSettings(azure_connection_settings) {
    return api.post(`api/save_azure_settings`, azure_connection_settings).then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
  }

  uploadDatabricksToCSV(email, file, remarks) {
    const payload = new FormData();
    payload.append("email", email);
    payload.append("remarks", remarks);
    payload.append("file", file);
    const config = {
      headers: { "content-type": "multipart/form-data" },
    };
    return api.post(`/api/upload_csv_to_databricks`, payload, config).then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });;
  }

  getAllDocuments(user_info) {
    const querybuilder = `?email=${user_info.email}`;
    return api
      .get(`/api/uploadedFilesList/${querybuilder}`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        return this.getAllDocuments()
      });
  }

  getAllFilesFromDatabricks() {
    return api
      .get(`/api/fetch_files_from_databricks`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        return getAllFilesFromDatabricks()
      });
  }

  deleteDocument(file_name) {
    const querybuilder = `${file_name}`;
    return api
      .delete(`/api/deleteFile/${querybuilder}`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        throw err;
      });
  }

  deleteDocumentDatabricks(file_name) {
    const querybuilder = `${file_name}`;
    return api
      .delete(`/api/delete_file_databricks/${querybuilder}`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        throw err;
      });
  }

  downloadDocument(file_name) {
    return api
      .get(`/api/download_blob/${file_name}`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        throw err;
      });
  }

  getSampleFromDatabricks(file_name) {
    return api
      .get(`/api/read_file_sample/${file_name}`)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        throw err;
      });
  }

  downloadcsvfFile(df){
    return api
    .post(`/download_data`,df)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
  }



  downloadPdfFile(payload) {
    return api.post(`/api/download-pdf`, payload, { responseType: 'blob' })
      .then((response) => {
        // responseType: 'blob' ensures that the response is treated as a Blob by axios
        const blob = new Blob([response.data], { type: 'application/pdf' });  // Create a blob from the response data
        const url = window.URL.createObjectURL(blob);  // Create an object URL from the Blob
        const link = document.createElement('a');  // Create an anchor element
        link.href = url;
        link.setAttribute('download', 'multi-agent-chat.pdf');  // Set the download attribute
        document.body.appendChild(link);  // Append the anchor to the DOM
        link.click();  // Trigger the download
        link.parentNode.removeChild(link);  // Clean up the DOM by removing the anchor
        window.URL.revokeObjectURL(url);  // Revoke the object URL to free up memory
      })
      .catch((err) => {
        console.error('Error downloading PDF:', err);  // Handle the error
        throw err;
      });
  };
  

}

export default new documentService();
