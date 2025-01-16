import React, { useEffect, useState, lazy } from 'react';
import { MultiSelect } from 'react-multi-select-component';
import { Label, Panel, TextField } from '@fluentui/react';
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, {
} from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import Button from "react-bootstrap/Button";
import datasetService from "../../api/documentService";
import MultiSelectWithClearIcon from '../../components/MultiSelectWithClearIcon/MultiSelectWithClearIcon';
import { Settings24Regular } from "@fluentui/react-icons";
import Sidebar from '../../components/Sidebar/Sidebar';
import databaseService from '../../api/databaseService';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import quinLogo from "../../assets/Quin_Logo.png";
import quinLogoText from "../../assets/Quin_Logo.svg";
const OneShot = lazy(() =>
    import("../../pages/oneshot/OneShot").then((module) => ({ default: module.Component }))
);

import './GoogleCloudStorage.scss';

const GoogleCloudStorage = () => {
    const [database, setDatabase] = useState([])
    const [tableOptions, setTableOptions] = useState([])
    const [tables, setTables] = useState([]);
    const [loadedFiles, setLoadedFiles] = useState([]);
    const [csvData, setCsvData] = useState({ dataType: { columns: [], data: [] }, data: { columns: [], data: [] } });
    const [selectedCsvData, setSelectedCsvData] = useState({ dataType: { columns: [], data: [] }, data: { columns: [], data: [] } })
    const [showSidebar, setShowSidebar] = useState(true);
    const [loadedTables, setLoadedTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loaderMessage, setLoaderMessage] = useState("")
    const [loadTableText, setLoadTableText] = useState("Load tables");
    const [databaseOptions, setDatabaseOptions] = useState([]);
    const [columnDatatype, setColumnDatatype] = useState({})
    const [joinQuery, setJoinQuery] = useState('');
    const [type, setType] = useState('');
    const [projectId, setProjectId] = useState('');
    const [privateKeyId, setPrivateKeyId] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientId, setClientId] = useState('');
    const [authURI, setAuthURI] = useState('');
    const [tokenURI, setTokenURI] = useState('');
    const [authProviderX509CertUrl, setAuthProviderX509CertUrl] = useState('')
    const [clientX509CertUrl, setClientX509CertUrl] = useState('')
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        fetchDatabaseGCP();
    }, [])

    const fetchDatabaseGCP = () => {
        setLoaderMessage("Fetching databases from cloud...");
        setLoading(true);
        databaseService.fetchDatabaseGCP().then((response) => {
            const options = [];
            response.data?.map((database) => {
                options.push({ label: database, value: database })
            })
            setDatabaseOptions(options);
            setLoading(false);
            setConnectionError(false);
        })
            .catch((err) => {
                alert("Could not connect. Please try again.");
                setConnectionError(true);
                setLoading(false);
            })
    }

    useEffect(() => {
        if (database.length > 0) {
            setLoaderMessage("Fetching tables from database...");
            setLoading(true);
            databaseService.fetchDatabaseTablesGCP(database[0].value).then((response) => {
                const options = [];
                response.data?.map((table) => {
                    options.push({ label: table, value: table })
                })
                setTableOptions(options);
                setLoading(false);
            })
                .catch((err) => {
                    alert(err);
                    setLoading(false);
                })
        }
    }, [database])

    const loadFiles = () => {
        if (tables.length > 0) {
            setLoaderMessage("Loading tables...");
            setLoadTableText("Loading tables...");
            setLoading(true);
            setCsvData({ data: { columns: [], data: [] } })
            const table_names = [];
            tables.map(table => {
                table_names.push(table.value)
            })
            databaseService.fetchTablesDataGCP({ database: database[0]?.value, tables: table_names }).then((response) => {
                setLoadedFiles(response.data.sample_data);
                setColumnDatatype(response.data.columns_info);
                setSelectedTables(Object.keys(response.data.columns_info) || {})
                response.data.join_query && setJoinQuery(response.data.join_query)
                setLoadTableText("Load tables");
            })
                .catch((err) => {
                    alert(err);
                    setLoading(false);
                    setLoadTableText("Load tables");

                })
        }
    }

    const showCsvData = () => {
        setLoaderMessage("Loading csv data...");
        setLoading(true);

        let csv = {}
        const data = loadedFiles;
        const columns = [];
        const keys = Object.keys(data[0] || {});
        const values = Object.values(data[0] || {});

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
        csv = {
            data: { columns: columns, data: data },
        }
        setCsvData(csv);
        setLoading(false);
    }

    useEffect(() => {
        if (loadedFiles?.length > 0) {
            showCsvData();
        }
    }, [loadedFiles])


    const customValueRenderer = (selectedOptions, options) => {
        return (
            <div
                style={{ display: 'flex', flexWrap: 'wrap', maxHeight: '100px', overflow: 'auto', cursor: "pointer" }}
            >
                {selectedOptions.length > 0 ? <span>{selectedOptions[0].label}</span> : <span>Select...</span>}
            </div>
        );
    };

    const dataTypeColumns = [
        {
            dataField: 'index',
            text: 'SL',
            formatter: (cell, row, rowIndex) => rowIndex + 1,
            editable: false, // optional, if you don't want to edit the index column
        },
        {
            dataField: "column_name",
            text: "Column",
            sort: true,
            headerAlign: "left",
            align: "left",
        },
        {
            dataField: "data_type",
            text: "Type",
            sort: true,
            headerAlign: "left",
            align: "left",
        }
    ];

    const saveGCPSettings = () => {
        setLoaderMessage("Updating GCP Connection Settings....");
        setSettingsPanelOpen(false);
        setLoading(true);
        let gcp_connection_settings = {
            "type": type,
            "project_id": projectId,
            "private_key_id": privateKeyId,
            "private_key": privateKey,
            "client_email": clientEmail,
            "client_id": clientId,
            "auth_uri": authURI,
            "token_uri": tokenURI,
            "auth_provider_x509_cert_url": authProviderX509CertUrl,
            "client_x509_cert_url": clientX509CertUrl,
        }
        datasetService.saveGCPSettings(gcp_connection_settings).then((response) => {
            fetchDatabaseGCP();
        }).catch(err => {
            setLoading(false);
            setLoaderMessage("")
        })
    }
    return (
        <div className='azure-sql'>
            {loading && <LoadingOverlay message={loaderMessage} />}
            <Sidebar open={showSidebar} onClose={() => setShowSidebar(false)}>
                {connectionError ? <h6>No connection available</h6> :
                    <>
                        <Label className='upload-text'>Select Database</Label>
                        <MultiSelect
                            options={databaseOptions}
                            value={database}
                            onChange={(val => {
                                // only sending the last object as we r modifying multi select to single select
                                setDatabase([val[val.length - 1]])
                            })}
                            labelledBy="Select"
                            hasSelectAll={false}
                            ClearIcon={null}
                            ClearSelectedIcon={null}
                            isLoading={databaseOptions.length < 1}
                            // disabled={userOptionsLoading}
                            closeOnChangedValue
                            valueRenderer={customValueRenderer}
                            style={{ marginLeft: 0 }}
                        />
                    </>}
                {tableOptions.length > 0 && (
                    <>
                        <Label className='upload-text mt-2'>Select Tables</Label>
                        <MultiSelectWithClearIcon options={tableOptions} updateSelectedOptions={setTables} />
                        <button className='load-files' onClick={loadFiles} disabled={tables.length < 1}>{loadTableText}</button>
                    </>)}
                {selectedTables.length > 0 && selectedTables?.map(table => (
                    columnDatatype?.[table] &&
                    <>
                        <p className='mt-3'><b>{table}</b></p>
                        <ToolkitProvider
                            bootstrap4
                            keyField="index"
                            data={columnDatatype[table]}
                            columns={dataTypeColumns}
                            search
                            bordered={false}
                        >
                            {(props) => (
                                <BootstrapTable
                                    {...props.baseProps}
                                    bordered={false}
                                    headerClasses="table-header-fixed"
                                />
                            )}
                        </ToolkitProvider>
                    </>
                ))}
            </Sidebar>
            <div className={`csv-with-query ${showSidebar ? 'select-table-with-csv' : 'database-table-csv'}`}>
                <div className='d-flex load-view mt-2' style={{ justifyContent: 'space-between' }}>
                    {!showSidebar ? <button
                        className="collapse-button"
                        title="Load table"
                        onClick={() => setShowSidebar(true)}
                    >
                        Load tables from Database
                    </button> : <span></span>}
                    <Settings24Regular className="pointer" onClick={() => setSettingsPanelOpen(true)} />
                </div>
                <Panel
                    headerText="Google Cloud Storage Connection"
                    isOpen={settingsPanelOpen}
                    isBlocking={false}
                    closeButtonAriaLabel="Close"
                    onDismiss={() => setSettingsPanelOpen(false)}
                >
                    <TextField
                        label="Type"
                        autoAdjustHeight
                        onChange={(e) => setType(e.target.value)}
                    />
                    <TextField
                        label="project_id"
                        autoAdjustHeight
                        onChange={(e) => setProjectId(e.target.value)}
                    />
                    <TextField
                        label="private_key_id"
                        autoAdjustHeight
                        onChange={(e) => setPrivateKeyId(e.target.value)}
                    />
                    <TextField
                        label="private_key"
                        autoAdjustHeight
                        onChange={(e) => setPrivateKey(e.target.value)}
                    />
                    <TextField
                        label="client_email"
                        autoAdjustHeight
                        onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <TextField
                        label="client_id"
                        autoAdjustHeight
                        onChange={(e) => setClientId(e.target.value)}
                    />
                    <TextField
                        label="auth_uri"
                        autoAdjustHeight
                        onChange={(e) => setAuthURI(e.target.value)}
                    />
                    <TextField
                        label="token_uri"
                        autoAdjustHeight
                        onChange={(e) => setTokenURI(e.target.value)}
                    />
                    <TextField
                        label="auth_provider_x509_cert_url"
                        autoAdjustHeight
                        onChange={(e) => setAuthProviderX509CertUrl(e.target.value)}
                    />
                    <TextField
                        label="client_x509_cert_url"
                        autoAdjustHeight
                        onChange={(e) => setClientX509CertUrl(e.target.value)}
                    />
                    <Button className="mt-2" onClick={saveGCPSettings}>Connect</Button>
                </Panel>
                {csvData.data.data.length > 0 ? (
                    <div>
                        {(() => {
                            const data = csvData.data;
                            const dataType = csvData.dataType;

                            if (data?.data?.length > 0) {
                                return (
                                    <div>
                                        <div className="d-flex mt-2" style={{ justifyContent: "center" }}>
                                            {data.data.length > 0 && (
                                                <div className="col csv-data-gcp">
                                                    <h6>{selectedTables?.[1] ? 'Joined data sample' : selectedTables?.[0]}</h6>
                                                    <ToolkitProvider
                                                        bootstrap4
                                                        keyField="index"
                                                        data={data.data.slice(0, 10)}
                                                        columns={data.columns}
                                                        search
                                                        bordered={false}
                                                    >
                                                        {(props) => (
                                                            <BootstrapTable
                                                                {...props.baseProps}
                                                                bordered={false}
                                                                headerClasses="table-header-fixed"
                                                            />
                                                        )}
                                                    </ToolkitProvider>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div className='mt-3' style={{ marginLeft: showSidebar ? 0 : "13vw", maxWidth: "70vw" }}>
                            {database.length > 0 && csvData.data.data.length > 0 &&
                                <OneShot
                                    database={database[0].value}
                                    selected_tables={selectedTables.length > 0 && selectedTables.map(table => table)}
                                    type="gcp"
                                    sample_data={csvData.data.data}
                                    join_query={joinQuery}
                                />}
                        </div>
                    </div>
                ) : !loading && (<div className="d-flex" style={{ justifyContent: 'center', marginTop: "20vh", flexDirection: "column", alignItems: "center" }}>
                    <span>
                        <img src={quinLogo} className="d-inline-block align-left quin_logo" width="80px" />
                        <img src={quinLogoText} className="d-inline-block align-left" width="60%" />
                    </span>
                    <h3 style={{ color: "blue" }}>

                        Please choose {database?.[0]?.value ? 'table' : 'database'} to generate insights and plots
                    </h3>
                </div>)}
            </div>
        </div>
    )
}

export default GoogleCloudStorage;