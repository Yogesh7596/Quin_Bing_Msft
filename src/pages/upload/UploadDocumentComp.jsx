/**
 * owner : retrAIver
 * author : Manish from Affine
 */
import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Papa from "papaparse";
import Card from "react-bootstrap/Card";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import ToolkitProvider, {
  Search,
} from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import datasetService from "../../api/documentService";
import successIcon from "../../assets/images/success_icon.svg";
import { trackPromise } from "react-promise-tracker";
import "./UploadDocumentComp.scss";
import infoIcon from "../../assets/images/info_icon.svg";
import infoData from "../../assets/data/info.json";
import { Tooltip } from "bootstrap/dist/js/bootstrap.esm.min";
import Alert from "react-bootstrap/Alert";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
// import useCredit from "../../contextProviders/creditProvider/useCredit";
// import helper from "../services/tokenStore";

function UploadDocumentComp(componentprops) {
  const { categoryList, setCsvData, type } = componentprops
  const [fileName, setFileName] = useState([]);
  const [file, setFile] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [sanityErrorMsg,] = useState("");
  const [show, setShow] = useState(false);
  const [invalidFileList, setInvalidFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // const { creditBalance, setCreditBalance } = useCredit();

  const email = localStorage.getItem('email');

  const getInitialCategory = () => {
    if (categoryList.length > 0) {
      return categoryList[0].id;
    } else {
      return 0;
    }
  }

  const [selectedCategory, setselectedCategory] = useState(getInitialCategory());
  // const {setCreditBalance} = useCredit()

  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new Tooltip(tooltipTriggerEl);
  });



  const changeRemarks = (e) => {
    setRemarks(e.target.value);
    // formValidation(e.target.value)
  };

  const addCSVData = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const columns = [];
        const keys = Object.keys(results.data[0] || {});
        const values = Object.values(results.data[0] || {})
        const dataTypeColumns = [
          {
            dataField: "Column",
            text: "Column",
            sort: true,
            headerAlign: "left",
            align: "left",
          },
          {
            dataField: "Data Type",
            text: "Data Type",
            sort: true,
            headerAlign: "left",
            align: "left",
          }
        ];
        const dataTypeData = [];
        values.map((value, i) => {
          const data = { "Column": keys[i], "Data Type": typeof (value) };
          dataTypeData.push(data);
        });
        keys.map(key => {
          const column = {
            dataField: key,
            text: key,
            sort: true,
            headerAlign: "left",
            align: "left",
          }
          columns.push(column)
        })
        setCsvData({
          dataType: { columns: dataTypeColumns, data: dataTypeData },
          data: { columns: columns, data: results.data },
        })
        componentprops.setSelectedFileName(file.name)
      },
    });
  }

  const onFileChange = (e) => {
    e.preventDefault();

    let fileNames = [];
    let files = [];
    let invalidFileListTemp = [];
    Array.from(e.target.files).forEach((ele) => {
      if (fileName.filter((existingFile) => existingFile === ele.name).length === 0) {
        if (
          ele.name.includes(".csv")
        ) {
          if (file.size > 209715200) {
            alert('File size exceeds 200MB limit. Please choose a smaller file');
          } else {
            fileNames.push(ele.name);
            files.push(ele);
          }
        }
        else {
          alert("Only CSV files are accepted");
        }
      }
    });
    setInvalidFileList(invalidFileListTemp);
    setFileName(fileNamesExisting => [...fileNamesExisting, ...fileNames]);
    setFile(filesExistingfiles => [...filesExistingfiles, ...files]);
    document.getElementById('pdf-file').value = "";
  };
  const removeFile = (deletedFile) => {
    let existingFileName = fileName.filter((filename) => filename !== deletedFile);
    setFileName(existingFileName);
    let existingFile = file.filter((eachfile) => eachfile?.name !== deletedFile);
    setFile(existingFile);
  }

  const clearState = () => {
    setFile([]);
    setFileName([]);
    componentprops.clearState();
  };

  const uploadDocumentDetails = () => {
    if (creditBalance <= 0) {
      alert('Insufficient balance. Please recharge your account.');
      return;
    }
    else {
      if (invalidFileList && invalidFileList.length) {
        let invalidFileStr = invalidFileList.join(",");
        alert(
          `Please upload only .txt, .doc, .docx or .pdf files.\nFollowing file/files have invalid format : ${invalidFileStr} `
        );
      } else {
        setLoading(true);
        if (type === "upload_csv") {
          trackPromise(
            datasetService.uploadFiles(email, file, remarks).then((response) => {
              setCsvData({
                dataType: { columns: [], data: [] },
                data: { columns: [], data: [] },
              })
              addCSVData(file[0])
              if (response?.data?.message) {
                if (response?.data?.filename) {
                  if (response?.data?.status == "success") {
                    alert(
                      `${response.data.filename} - ` + `${response.data.message}`
                    );
                  } else {
                    alert(
                      `${response.data.filename} - ` + `${response.data.message}`
                    );
                  }
                } else {
                  alert(`${response.data.message}`);
                }
              }
              setLoading(false);
              componentprops.getAllDocuments();
              clearState();
            }).catch(err => {
              setLoading(false);
              alert(err.response.data.message || "Something went wrong");
            })
          )
        }
        else {
          datasetService.uploadDatabricksToCSV(email, file[0], remarks).then((response) => {
            setCsvData({
              dataType: { columns: [], data: [] },
              data: { columns: [], data: [] },
            })
            addCSVData(file[0])
            if (response?.data?.message) {
              alert(
                `${file[0].name} - ` + `${response.data.message}`
              );
            }
            else {
              alert(`${response.data.detail}`);
            }
            setLoading(false);
            componentprops.getAllDocuments();
            clearState();
          }).catch(err => {
            setLoading(false);
            alert(err.response.data.detail || "Something went wrong")
          })
        }
      }
    }

  };

  const handleCategory = (e) => {
    setselectedCategory(e.target.value)
  }
  return (
    <Card style={{ width: '250px' }}>
      {show && (
        <Alert variant="danger" onClose={() => setShow(false)} dismissible>
          <Alert.Heading>Sanity Check Error!</Alert.Heading>
          <p>{sanityErrorMsg}</p>
        </Alert>
      )}
      {/* <i onClick={() => clearState()} class="fa fa-times crossicon" aria-hidden="true"></i> */}
      {loading && <LoadingOverlay message="Uploading files..." />}
      <div className="col-auto pad-l-0" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <div>
            <form>
              <div className="flex-row">
                {/* <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i style={{ fontSize: '48px', marginRight: '16px' }} className="fa-solid fa-file"></i>
                  <div style={{ width: '100%' }}>
                    <label style={{ fontSize: '0.8rem', margin: 5, fontWeight: 'lighter' }} className="upload-text mt-2">Category</label>
                    <select
                      className="form-control  mb-3 shadow-none inputfield"
                      onChange={handleCategory}
                      style={{ width: '100%' }}
                    >
                      {componentprops.categoryList.map((val) => (
                        <option selected={val.id == selectedCategory} key={val.category_name} value={val.id}>{val.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div> */}
                <div className="upload-item">
                  <h5 className="upload-text">
                    Upload a File
                    <img
                      src={infoIcon}
                      className="info-icon-style cursor-pointer"
                      alt="Upload"
                      title={infoData.addDataset.fileupload}
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                    />
                  </h5>
                  <p className="choosetext">
                    {" "}
                    Maximum file size: 200 MB{" "}
                  </p>

                  {fileName && (
                    <div className="file-detail">
                      <span className="file_name">
                        {
                          fileName.map((eachFile) => <label style={{ margin: '5px', padding: '5px', backgroundColor: 'lightgray', borderRadius: '10px', marginRight: '10px' }}>{eachFile}<i onClick={() => removeFile(eachFile)} style={{ marginLeft: '5px', color: 'red' }} className="fa-solid fa-square-minus"></i></label>)
                        }
                      </span>
                    </div>
                  )}

                  <label
                    className="custom-file-upload btn btn-outline-secondary btn-sm"
                    title="Browse for a file."
                  >
                    Browse
                    <input
                      className="upload-cls inputfield"
                      type="file"
                      id="pdf-file"
                      accept=".csv"
                      name="pdf-file"
                      onChange={onFileChange}
                      hidden
                      multiple
                    />
                  </label>
                  <div className="col-12 col-md-12 p-15">

                  </div>
                  {/* <label className="upload-text mt-3">Remarks</label>
                    <textarea
                      className="form-control shadow-none inputfield"
                      rows="1"
                      onChange={changeRemarks}
                    ></textarea> */}
                </div>
              </div>
            </form>
          </div>
        </div>

        <Form>
          <div className="mt-2">
            <div className="d-flex flex-row-reverse" style={{ justifyContent: 'start' }}>
              <Button
                className="btn-sm cancel-btn"
                variant="primary"
                onClick={clearState}
              >
                {" "}
                Cancel{" "}
              </Button>
              <Button
                className="btn-sm create-btn"
                variant="primary"
                onClick={uploadDocumentDetails}
                disabled={file.length === 0}
              >
                {" "}
                {loading ? "Uploading..." : "Upload"}{" "}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </Card>
  );
}

export default UploadDocumentComp;
