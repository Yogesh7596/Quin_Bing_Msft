import React, { useEffect, useState, lazy } from 'react';
import { MultiSelect } from 'react-multi-select-component';
import { Label, Panel, TextField } from '@fluentui/react';
import BootstrapTable from "react-bootstrap-table-next";
import ToolkitProvider, {
} from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import { Settings24Regular } from "@fluentui/react-icons";
import Button from "react-bootstrap/Button";
import MultiSelectWithClearIcon from '../../components/MultiSelectWithClearIcon/MultiSelectWithClearIcon';
import Sidebar from '../../components/Sidebar/Sidebar';
import databaseService from '../../api/databaseService';
import datasetService from "../../api/documentService";
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import quinLogo from "../../assets/Quin_Logo.png";
import quinLogoText from "../../assets/Quin_Logo.svg";
const OneShot = lazy(() =>
    import("../../pages/oneshot/OneShot").then((module) => ({ default: module.Component }))
);

import './AzureSqlDatabase.scss';


const AzureSQLDatabase = () => {
    const [database, setDatabase] = useState([])
    const [databaseOptions, setDatabaseOptions] = useState([]);
    const [tableOptions, setTableOptions] = useState([])
    const [tables, setTables] = useState([]);
    const [loadedFiles, setLoadedFiles] = useState([]);
    const [csvData, setCsvData] = useState({});
    const [selectedCsvData, setSelectedCsvData] = useState({ dataType: { columns: [], data: [] }, data: { columns: [], data: [] } })
    const [showSidebar, setShowSidebar] = useState(true);
    const [loadedTables, setLoadedTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState("")
    const [loadTableText, setLoadTableText] = useState("Load tables");
    const [server, setServer] = useState('');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [conversationPanelOpen, setConversationsPanelOpen] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const data = [
        { id: 1, name: "John Doe", age: 28 },
        { id: 2, name: "Jane Smith", age: 34 },
        { id: 3, name: "Sam Green", age: 22 },
      ];

      const convertToCSV = (array: Array<any>) => {
        const headers = Object.keys(array[0]).join(",") + "\n"; // CSV headers
        const rows = array
          .map((row) =>
            Object.values(row)
              .map((value) => `"${value}"`) // Wrap values in quotes for CSV format
              .join(",")
          )
          .join("\n"); // CSV rows
      
        return headers + rows; // Combine headers and rows
      };
      const downloadCSV = (csvContent: string, fileName: string) => {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.setAttribute("download", fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Cleanup the link
      };
      
      const handleDownload = () => {
        const csvContent = convertToCSV(data); // Convert data to CSV
        downloadCSV(csvContent, "data.csv"); // Trigger download with file name
      };

    const saveAzureSettings = () => {
        setLoaderMessage("Updating Azure Connection String...");
        setLoading(true);
        setSettingsPanelOpen(false);
        const azure_connection_settings = {
            server: server,
            user: user,
            password: password
        }
        datasetService.saveAzureSettings(azure_connection_settings).then((response) => {
            setLoading(false);
            fetchDatabases();
        }).catch(err => {
            setLoading(false);
            setLoaderMessage("")
        })
    }

    const fetchDatabases = () => {
        setLoaderMessage("Fetching databases from azure....")
        setLoading(true);
        databaseService.fetchAzureDatabases().then((response) => {
            const options = [];
            response.data?.databases?.map((database) => {
                options.push({ label: database, value: database })
            })
            setDatabaseOptions(options);
            setLoading(false);
            setLoaderMessage("");
            setConnectionError(false);
        })
            .catch((err) => {
                alert("Could not connect. Please try again");
                setConnectionError(true);
                setLoading(false);
                setLoaderMessage("");
            })
    }

    useEffect(() => {
        fetchDatabases();
    }, [])

    useEffect(() => {
        if (database.length > 0) {
            setLoaderMessage("Fetching tables from database...");
            setLoading(true);
            databaseService.fetchDatabaseTables().then((response) => {
                const options = [];
                response.data?.tables?.map((table) => {
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
            const table_names = [];
            tables.map(table => {
                table_names.push(table.value)
            })
            databaseService.fetchTablesData(database[0].value, table_names).then((response) => {
                // console.log(response)
                setLoadedFiles(response.data.data.data);
                setLoadTableText("Load tables");
                setLoading(false);
            })
                .catch((err) => {
                    alert(err);
                    setLoadTableText("Load tables");
                    setLoading(false);
                })
        }
    }

    useEffect(() => {
        let options = Object.keys(loadedFiles || {});
        if (options.length > 0) {
            showCsvData();
        }
        options = options.map(option => ({ label: option, value: option }))
        setLoadedTables(options);
    }, [loadedFiles]);

    useEffect(() => {
        if (tables.length > 0 && selectedTable.length < 1) {
            setSelectedTable([tables[0]])
        }
        if (selectedTable.length > 0) {
            const tableExists = tables.some(table => table.value === selectedTable[0].value);
            if (!tableExists) {
                if (tables.length > 0) {
                    setSelectedTable([tables[0]])
                } else {
                    setSelectedTable([]);
                }
            }
        }
    }, [loadedTables])

    useEffect(() => {
        if (selectedTable[0]?.value) {
            setLoaderMessage("Loading csv data...");
            setLoading(true);
            setSelectedCsvData({ dataType: { columns: [], data: [] }, data: { columns: [], data: [] } })
            setTimeout(() => {
                setSelectedCsvData(csvData[selectedTable[0].value]);
                setLoading(false);
            }, 100)
        }
    }, [selectedTable]);

    const showCsvData = () => {
        setLoaderMessage("Loading csv data...");
        setLoading(true);
        setCsvData({})
        let csv = {}
        tables.map(table => {
            const data = loadedFiles[table.value];
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
                width:'69px',
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
            csv[table.value] = {
                dataType: { columns: dataTypeColumns, data: dataTypeData },
                data: { columns: columns, data: data },
            }
        })
        setCsvData(csv);
        setLoading(false);
    }

    const customValueRenderer = (selectedOptions, options) => {
        return (
            <div
                style={{ display: 'flex', flexWrap: 'wrap', maxHeight: '100px', overflow: 'auto', cursor: "pointer" }}
            >
                {selectedOptions.length > 0 ? <span>{selectedOptions[0].label}</span> : <span>Select...</span>}
            </div>
        );
    };


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
                            // isLoading={userOptionsLoading}
                            // disabled={userOptionsLoading}
                            closeOnChangedValue
                            valueRenderer={customValueRenderer}
                            style={{ marginLeft: 0 }}
                        />
                    </>
                }
                {tableOptions.length > 0 && (
                    <>
                        <Label className='upload-text mt-2'>Select Tables</Label>
                        <MultiSelectWithClearIcon options={tableOptions} updateSelectedOptions={setTables} />
                        <button className='load-files' onClick={loadFiles} disabled={tables.length < 1}>{loadTableText}</button>
                    </>)}
            </Sidebar>
            <div className={`csv-with-query ${showSidebar ? 'select-table-with-csv' : 'database-table-csv'}`}>
                <div className='d-flex load-view mt-2' style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div >
                        {!showSidebar ? <button
                            className="collapse-button"
                            title="Load table"
                            onClick={() => setShowSidebar(true)}
                        >
                            Load tables from Database
                        </button> : <span></span>}
                         {/* <button onClick={handleDownload}>Download CSV</button>; */}
                        {loadedTables.length > 0 &&
                            <div className='d-flex'>
                                <Label style={{ marginRight: "3px", fontWeight: 500 }}>view sample data:</Label>
                                <MultiSelect
                                    options={loadedTables}
                                    value={selectedTable}
                                    onChange={(val => {
                                        // only sending the last object as we r modifying multi select to single select
                                        setSelectedTable([val[val.length - 1]])
                                    })}
                                    labelledBy="Select"
                                    hasSelectAll={false}
                                    ClearIcon={null}
                                    ClearSelectedIcon={null}
                                    // isLoading={userOptionsLoading}
                                    // disabled={userOptionsLoading}
                                    closeOnChangedValue
                                    valueRenderer={customValueRenderer}
                                />
                            </div>}

                    </div>
          
                    {/* <Settings24Regular className="pointer" onClick={() => setSettingsPanelOpen(true)} /> */}
                    
                </div>
                <Panel
                    headerText="Azure SQL Database Connection"
                    isOpen={settingsPanelOpen}
                    isBlocking={false}
                    closeButtonAriaLabel="Close"
                    onDismiss={() => setSettingsPanelOpen(false)}
                >
                    <TextField
                        label="Server"
                        autoAdjustHeight
                        onChange={(e) => setServer(e.target.value)}
                    />
                    <TextField
                        label="User"
                        autoAdjustHeight
                        onChange={(e) => setUser(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        autoAdjustHeight
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button className='mt-2' onClick={saveAzureSettings}>Connect</Button>
                </Panel>


                {selectedTable[0]?.value ? (
                    <div>
                        {(() => {
                            const data = selectedCsvData.data;
                            const dataType = selectedCsvData.dataType;

                            if (data?.data?.length > 0) {
                                return (
                                    <div>
                                        <div className="d-flex mt-2" style={{ justifyContent: "center" }}>
                                            {dataType.data.length > 0 && (
                                                <div>
                                                    
                                                </div>
                                            )}
                                            {data.data.length > 0 && (
                                                <div className="col csv-data">
                                                    <h6>{selectedTable[0].value}</h6>
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
                            {database.length > 0 && selectedCsvData.data.data.length > 0 &&
                                <OneShot database={database[0].value} selected_tables={tables.map(table => table.value)} type="azure_sql_database" />}
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

export default AzureSQLDatabase;