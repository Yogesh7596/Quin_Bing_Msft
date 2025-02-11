import React, { useEffect, useState, lazy } from 'react';
import { MultiSelect } from 'react-multi-select-component';
import { keyframes, Label, Panel, TextField } from '@fluentui/react';
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

import './SqlDatabaseQuery.scss';
import { QuestionInput } from '../../components/QuestionInput';
import { Answer } from '../../components/Answer';
import { setAnswerFromStream } from '../../helpers';

let baseURL = import.meta.env.VITE_APP_API_URL

const SqlDatabaseQuery = () => {
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
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
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
        loadFiles();
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
        setLoaderMessage("Loading tables...");
        setLoadTableText("Loading tables...");
        setLoading(true);
        const table_names = ["KPI_VTPF", "RevenueVTPF"];
        // tables.map(table => {
        //     table_names.push(table.value)
        // })
        databaseService.fetchTablesData("quickinsight", table_names).then((response) => {
            console.log(response)
            setLoadedFiles(response.data.tables_data);
            setLoadTableText("Load tables");
            setLoading(false);
        })
            .catch((err) => {
                alert(err);
                setLoadTableText("Load tables");
                setLoading(false);
            })
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
                width: '69px',
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

    const getAzureInsightsRequest = async () => {
        setAnswer(null);
        setLoaderMessage("Fetching answer...");
        setLoading(true);
        try {

            // if (creditBalance <= 0) {
            //   // Display an alert indicating insufficient balance
            //   alert('Insufficient balance. Please recharge your account.');
            //   return;
            // }
            let email; // Declare the variable
            const storedResponse = localStorage.getItem('email');
            const parsedResponse = storedResponse;
            email = parsedResponse
            const question_prompt = question
            // console.log(question_prompt,email,database,selected_tables,showCode,showPlot)
            // const result = await getInsightsApi(email, question_prompt, props.selectedFileName, showCode, explainCode);
            const response = await fetch(baseURL + "/generate_insights", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_query: question_prompt,
                    explain_code: false,
                    is_plot: false,
                    show_code: false
                })
            });

            if (!response.ok) {
                throw Error(response.statusText || "Unknown error");
            }

            // Check if the Response object has the `body` property with a ReadableStream
            if (response.body && response.body instanceof ReadableStream) {
                await setAnswerFromStream(response.body, setAnswer);
                // console.log(response.body)
            }
            //const result = await response.json();
            //console.log("re a", result);
            //setAnswer(result);
            //setCreditBalance(result?.credit_balance?.credit_balance)

        } catch (e) {
            // setError(e);
        } finally {
            setLoading(false);
        }
    };

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
        <div className='sql-database-query'>
            {loading && <LoadingOverlay message={loaderMessage} />}
            <div className='tables'>
                <div className='table1 col-4'>
                    <div className='table-name'>Revenue VTF</div>
                    {Object.keys(loadedFiles || {}).length > 0 && (() => {
                        const data = loadedFiles["RevenueVTPF"];
                        const columns = [];

                        // Generate columns dynamically based on the keys in the first data object
                        Object.keys(data[0] || {}).forEach((key) => {
                            const column = {
                                name: key,
                                selector: row => row[key],
                            };
                            columns.push(column);
                        });

                        return (
                            <div className="col csv-data table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            {columns.map(col => (
                                                <th>{col.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(row => (
                                            <tr>
                                                {Object.values(row || {}).map(val => (
                                                    <td>{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
                <div className='table2 mr-3'>
                    <div className='table-name'>KPI Table</div>
                    {Object.keys(loadedFiles || {}).length > 0 && (() => {
                        const data = loadedFiles["KPI_VTPF"];
                        const columns = [];

                        // Generate columns dynamically based on the keys in the first data object
                        Object.keys(data[0] || {}).forEach((key) => {
                            const column = {
                                name: key,
                                selector: row => row[key],
                            };
                            columns.push(column);
                        });

                        return (
                            <div className="col csv-data table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            {columns.map(col => (
                                                <th>{col.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(row => (
                                            <tr>
                                                {Object.values(row || {}).map(val => (
                                                    <td>{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>

            </div>
            <div className='question-input'>
                <QuestionInput placeholder="Type a new question"
                    disabled={loading}
                    question={question}
                    setQuestion={setQuestion} />
                <button
                    className='generate-insights-button'
                    style={{ marginRight: '20px', background: "gray !important" }}
                    onClick={getAzureInsightsRequest}
                >Generate Insights</button>
            </div>
            <div className='mt-3' style={{ border: "1px solid black", borderRadius: "8px", background: "#fff" }}>
                {answer ? (
                    <Answer
                        answer={answer}
                        isLoading={loading}

                        question={question}
                        showCode={false}
                        explainCode={false}

                    />
                ) : <div style={{ margin: "20px" }}><p style={{ fontSize: "14px", opacity: 0.8 }}>Results</p></div>}
            </div>
        </div>
    )
}

export default SqlDatabaseQuery;