/**
 * owner : retrAIver
 * author : Manish from Affine
 */
import React, { useState, useEffect, lazy } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import Papa from "papaparse";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton, Dropdown } from "@fluentui/react";
import ToolkitProvider, {
    Search,
} from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import moment from "moment";
import { Settings24Regular } from "@fluentui/react-icons";
import UploadDocumentComp from "../upload/UploadDocumentComp";
import datasetService from "../../api/documentService";
import { trackPromise } from "react-promise-tracker";
import { DateTimeFormatter, getSizeinKB } from "../../utils";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import categoryService from "../../api/categoryService";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
// import useCredit from "../../contextProviders/creditProvider/useCredit";
import quinLogo from '../../assets/Quin_Logo.png';
import quinLogoText from "../../assets/Quin_Logo.svg";
import { QuestionInput } from "../../components/QuestionInput";
import Sidebar from "../../components/Sidebar/Sidebar";
import { formatFileSize } from "../../helpers";

const OneShot = lazy(() =>
    import("../../pages/oneshot/OneShot").then((module) => ({ default: module.Component }))
);
import "./DatabricksCSV.scss"

const pagination = paginationFactory({
    page: 1,
    sizePerPage: 10,
    lastPageText: ">>",
    firstPageText: "<<",
    nextPageText: ">",
    prePageText: "<",
    showTotal: true,
    alwaysShowAllBtns: true,
    hideSizePerPage: false,
});

const { SearchBar } = Search;

function DatabricksCSV() {
    const [showAddDataset, setShowAddDataset] = useState(true);
    const [loading, setLoading] = useState(true);
    const [datasetsList, setDatasetsList] = useState([]);
    const [filteredDatasetsList, setFilteredDatasetsList] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [categoryList, setcategoryList] = useState([]);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [isDisabled, setDisabled] = useState(false);
    const [modaltext, setText] = useState("");
    const [csvData, setCsvData] = useState({ dataType: { columns: [], data: [] }, data: { columns: [], data: [] } })
    const [loaderMessage, setLoaderMessage] = useState("Fetching uploaded files...")
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [documentColumns, setDocumentColumns] = useState([{
        dataField: "file_name",
        text: "File",
        sort: true,
        headerAlign: "left",
        align: "left",
        width: 50,
    }])
    const [databricksHost, setDatabricksHost] = useState('');
    const [databricksToken, setDatabricksToken] = useState('');
    const [databricksAPIEndpoint, setDatabricksAPIEndpoint] = useState('');
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const pageSize = 10;

    // const { creditBalance, setCreditBalance } = useCredit();

    useEffect(() => {
        getAllDocuments();
    }, []);

    /**
     * get All Documents List from db
     */
    const getAllDocuments = () => {
        setLoaderMessage("Fetching uploaded files...")
        setLoading(true);
        const user_info = { email: localStorage.getItem("email") }
        trackPromise(
            datasetService.getAllFilesFromDatabricks()
                .then((response) => {
                    const temp = [...response.data.csv_files].map((dataset, index) => ({
                        ...dataset,
                        id: index + 1,
                        // status: dataset.status ? "Indexed" : "Uploaded",
                        action: (
                            <div className="actionicons">
                                {/* <i className="fa-solid fa-trash text-danger" title="Delete Document"  onClick={() => deleteDoc(dataset.fileId)}></i>  */}
                            </div>
                        ),
                    }));
                    setDatasetsList(temp);
                    setFilteredDatasetsList(temp);
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    alert(err.response.data.error);
                })
        );
    };
    const getCategory = () => {
        trackPromise(
            categoryService
                .getCategory({ status_flag: 1 })
                .then((res) => {
                    setcategoryList(res.data.CategoryList);
                })
                .catch((err) => console.log(err))
        );
    };

    const clearState = (datasetName) => {
        if (datasetName) {
            getAllDocuments();
        }
    };

    const filterResultsBySearch = (val) => {
        setSearchText(val);
        let lowerVal = val.toLowerCase();
        if (lowerVal == "") {
            setFilteredDatasetsList(datasetsList);
        } else {
            let results = datasetsList
                .filter(
                    (data) =>
                        data.file_name.toLowerCase().includes(lowerVal) ||
                        data.uploaded_by.toLowerCase().includes(lowerVal)
                )
            setFilteredDatasetsList(results);
        }
    };

    const connectToDatabricks = () => {
        setSettingsPanelOpen(false);
        setLoading(true);
        setLoaderMessage("Updating Databricks Connection Settings....")
        const databricks_connection_settings = {
            'DATABRICKS_HOST': databricksHost,
            'DATABRICKS_TOKEN': databricksToken,
            'DATABRICKS_API_ENDPOINT': databricksAPIEndpoint,
        }
        datasetService.saveDatabricksSettings(databricks_connection_settings).then((response) => {
            getAllDocuments();
        }).catch(err => {
            setLoading(false);
            setLoaderMessage("Fetching uploaded files...");
        })
    }

    const deleteDocs = (file_name) => {
        let confirmDelete = window.confirm("Are you sure you want to delete these documents?");

        if (confirmDelete) {
            setLoaderMessage("Deleting file...")
            setLoading(true);
            trackPromise(
                datasetService
                    .deleteDocumentDatabricks(file_name)
                    .then((response) => {
                        alert(response.data.message);
                        if (file_name === selectedFileName) {
                            setSelectedFileName("");
                            setCsvData({
                                dataType: { columns: [], data: [] },
                                data: { columns: [], data: [] },
                            })
                        }
                        getAllDocuments();
                    })
                    .catch((err) => {
                        setLoading(false);
                        alert(err.response.data.message);
                    })
            );
        }
    };

    const _onRefreshClick = () => {
        getAllDocuments();
    };

    const showCsvData = (file_name) => {
        setLoaderMessage("Loading csv data...");
        setCsvData({
            dataType: { columns: [], data: [] },
            data: { columns: [], data: [] },
        })
        setSelectedFileName("");
        setLoading(true);
        trackPromise(
            datasetService
                .getSampleFromDatabricks(file_name)
                .then((response) => {
                    const data = response.data;
                    setSelectedFileName(file_name)
                    const columns = [];
                    const keys = Object.keys(data[0] || {});
                    const values = Object.values(data[0] || {})
                    const dataTypeColumns = [
                        {
                            dataField: 'index',
                            text: 'SL',
                            formatter: (cell, row, rowIndex) => rowIndex + 1,
                            editable: false, // optional, if you don't want to edit the index column
                        },
                        {
                            dataField: "Column",
                            text: "Column",
                            sort: true,
                            headerAlign: "left",
                            align: "left",
                        },
                        {
                            dataField: "Data Type",
                            text: "Type",
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
                    const index = {
                        dataField: 'index',
                        text: 'SL',
                        formatter: (cell, row, rowIndex) => rowIndex + 1,
                        editable: false, // optional, if you don't want to edit the index column
                    };
                    columns.push(index);
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
                    const csvData = {
                        dataType: { columns: dataTypeColumns, data: dataTypeData },
                        data: { columns: columns, data: data },
                    }
                    setCsvData(csvData);
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    alert(err.response.data.message);
                })
        );

    }


    const columns = [
        {
            dataField: 'index',
            text: 'SL',
            formatter: (cell, row, rowIndex) => {
                return (
                    <span className="mt-2"
                    >
                        {rowIndex + 1}
                    </span>
                )
            },
            editable: false, // optional, if you don't want to edit the index column
        },
        {
            dataField: "file_name",
            text: "File",
            sort: true,
            headerAlign: "left",
            align: "left",
            width: 50,
            formatter: (cell, row) => {
                return (
                    <span className="pointer file-name" style={{
                        background: "white",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
                        padding: "7px",
                        color: "black",
                        fontSize: "12px"
                    }}
                        onClick={() => showCsvData(row["file_name"])}
                    >
                        {row["file_name"]}
                    </span>
                )
            }
        },
        {
            dataField: "view_details",
            text: "Details",
            headerAlign: "left",
            align: "center",
            formatter: (cell, row) => {
                const popover = (
                    <Popover id="popover-basic">
                        <Popover.Header as="h3">File Details</Popover.Header>
                        <Popover.Body>
                            <table>
                                <tr><td>File Name: </td><td>{row["file_name"]}</td></tr>
                                <tr><td>File Size: </td><td>{row["file_size_mb"]} MB</td></tr>
                                {/* <tr><td>Uploaded By: </td><td>{row["uploaded_by"]}</td></tr>
                                <tr><td>Uploaded At: </td><td>{moment(row["uploaded_at"], "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY")}</td></tr> */}
                            </table>
                        </Popover.Body>
                    </Popover>
                );
                return (
                    <span style={{ textAlign: 'center', cursor: "pointer" }}>
                        <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={popover}>
                            <span style={{ fontSize: "16px", fontWeight: 500 }}>...</span>
                        </OverlayTrigger>
                    </span>
                )
            },
        },
        {
            dataField: "id",
            text: <div style={{ textAlign: 'center' }}>Action</div>,
            formatter: (cell, row) => (
                <div style={{ textAlign: 'center' }}>
                    <i
                        className="fas fa-trash action-icon mt-2"
                        title="Delete"
                        style={{ cursor: 'pointer' }}
                        onClick={() => deleteDocs(row["file_name"])} // Pass the chunk_id as an argument
                    ></i>
                </div>
            ),
        },
    ];

    useEffect(() => {
        const elements = document.querySelectorAll('.file-name');

        // Iterate through the elements
        elements.forEach((element, index) => {
            // Access the text content of each element
            const textContent = element.textContent;
            if (textContent === selectedFileName) {
                element.style.backgroundColor = "rgba(115, 118, 225, 1)";
                element.style.color = "#fff";
            } else {
                element.style.backgroundColor = "#fff";
                element.style.color = "#000";
            }
        })
    }, [selectedFileName, filteredDatasetsList])

    return (
        <div className="d-flex documents" style={{ justifyContent: 'center' }}>
            {loading && <LoadingOverlay message={loaderMessage} />}
            <Panel
                headerText="Databricks Connection"
                isOpen={settingsPanelOpen}
                isBlocking={false}
                closeButtonAriaLabel="Close"
                onDismiss={() => setSettingsPanelOpen(false)}
            >
                <TextField
                    label="Databricks HOST"
                    autoAdjustHeight
                    onChange={(e) => setDatabricksHost(e.target.value)}
                />
                <TextField
                    label="Databricks Token"
                    autoAdjustHeight
                    onChange={(e) => setDatabricksToken(e.target.value)}
                />
                <TextField
                    label="Databricks Api Endpoint"
                    autoAdjustHeight
                    onChange={(e) => setDatabricksAPIEndpoint(e.target.value)}
                />
                <Button className="mt-2" onClick={connectToDatabricks}>Connect</Button>
            </Panel>
            <Sidebar open={showAddDataset} onClose={() => setShowAddDataset(false)}>
                <div className="upload-section">
                    <UploadDocumentComp
                        clearState={(datasetName) => clearState(datasetName)}
                        getAllDocuments={() => getAllDocuments()}
                        categoryList={categoryList.filter(
                            (category) => category.status === 1
                        )}
                        setCsvData={setCsvData}
                        setSelectedFileName={setSelectedFileName}
                        type="databricks_csv"
                    />
                    <ToolkitProvider
                        bootstrap4
                        keyField="index"
                        data={filteredDatasetsList}
                        columns={columns}
                        search
                        bordered={false}
                    >
                        {(props) => (
                            <div>
                                <div className="row">
                                    <div className="mt-3">
                                        <h6 className="mb-0 choose-file">Choose a File</h6>
                                        <div className="documentheader d-flex">
                                            <div className="text1 serach-cls">
                                                <SearchBar
                                                    placeholder="Search Documents"
                                                    {...props.searchProps}
                                                    onSearch={(val) => {
                                                        filterResultsBySearch(val);
                                                    }}
                                                    searchText={searchText}
                                                />
                                                <i
                                                    className="fa-solid fa-magnifying-glass fa-search-icon"
                                                    title="Search"
                                                ></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="documents-list">

                                    <BootstrapTable
                                        keyField="datasetName"
                                        pagination={pagination}
                                        {...props.baseProps}
                                        bordered={false}
                                        headerClasses="table-header-fixed"
                                        noDataIndication={loading ? "Loading..." : "No Documents"}
                                    />
                                </div>
                            </div>
                        )}
                    </ToolkitProvider>
                </div>
            </Sidebar>
            <div className={showAddDataset ? 'document-upload-section' : 'document-section'}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {!showAddDataset ? <button
                        className="collapse-button"
                        title="<<"
                        onClick={() => setShowAddDataset(!showAddDataset)}
                    >
                        View or Upload file <i
                            className="fa fa-upload me-2"
                            title="Upload File"
                        ></i>
                    </button> : <span></span>}
                    <Settings24Regular className="pointer" onClick={() => setSettingsPanelOpen(true)} />
                </div>
                {csvData.data.data.length > 0 && <div>
                    <div className="d-flex">
                        {csvData.dataType.data.length > 0 && <div className="col csv-column">
                            <h6>DataType</h6>
                            <ToolkitProvider
                                bootstrap4
                                keyField="index"
                                data={csvData.dataType.data}
                                columns={csvData.dataType.columns}
                                search
                                bordered={false}
                            >
                                {(props) => (
                                    <BootstrapTable
                                        {...props.baseProps}
                                        // other BootstrapTable props
                                        bordered={false}
                                        headerClasses="table-header-fixed"
                                    // noDataIndication={loading ? "Loading..." : "No Users"}
                                    />
                                )}
                            </ToolkitProvider>
                        </div>}
                        {csvData.data.data.length > 0 && <div className="col csv-data">
                            <h6>Data</h6>
                            <ToolkitProvider
                                bootstrap4
                                keyField="index"
                                data={csvData.data.data.slice(0, 10)}
                                columns={csvData.data.columns}
                                search
                                bordered={false}
                            >
                                {(props) => (
                                    <BootstrapTable
                                        {...props.baseProps}
                                        // other BootstrapTable props
                                        bordered={false}
                                        headerClasses="table-header-fixed"
                                    // noDataIndication={loading ? "Loading..." : "No Users"}
                                    />
                                )}
                            </ToolkitProvider>
                        </div>}
                    </div>
                </div>}
                {selectedFileName || loading ? <div className={`d-flex mt-3 ${showAddDataset ? 'col-md-12' : 'col-md-9'}`} style={{ justifyContent: "space-between", marginLeft: showAddDataset ? 0 : "11vw" }}>
                    {selectedFileName && <OneShot selectedFileName={selectedFileName} type="databricks_csv" />}
                </div> : <div className="d-flex" style={{ justifyContent: 'center', marginTop: "20vh", flexDirection: "column", alignItems: "center" }}>
                    <span>
                        <img src={quinLogo} className="d-inline-block align-left quin_logo" width="80px" />
                        <img src={quinLogoText} className="d-inline-block align-left" width="60%" />
                    </span>
                    <h3 style={{ color: "blue" }}>

                        Please choose file to generate insights and plots
                    </h3>
                </div>}
                <Modal
                    show={show}
                    onHide={handleClose}
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>License Validation Error</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {modaltext}, Please connect at{" "}
                        <a href="mailto:retreaiveractivation@affine.ai">
                            Affine Admin
                        </a>
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
}

export default DatabricksCSV;
