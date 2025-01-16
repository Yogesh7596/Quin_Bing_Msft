import React, { useEffect, useState } from "react";
import ToolkitProvider from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import { trackPromise } from "react-promise-tracker";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { MultiSelect } from "react-multi-select-component";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
// import useCredit from "../../contextProviders/creditProvider/useCredit";
import "./credittemplate.scss";
import usercreditsService from "../../api/creditmanagementService";
import moment from 'moment';
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";

const Creditstemplate: React.FC<{}> = () => {

  const [creditHistoryList, setCreditHistoryList] = useState([]);
  const [creditType, setCreditType] = useState("All");
  // const { creditBalance } = useCredit();
  const pageSize = 10;
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role');
  const loggedInUser = localStorage.getItem('name');
  const [originalCreditHistoryList, setOriginalCreditHistoryList] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState(originalCreditHistoryList);
  const [fromDate, setFromDate] = useState(moment().startOf('month').format("DD-MM-YYYY"));
  const [toDate, setToDate] = useState(moment().format("DD-MM-YYYY"));
  const [usernames, setUsernames] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(role === 'Admin' ? [{ label: loggedInUser, value: loggedInUser }] : []);
  const [loaderMessage, setLoaderMessage] = useState("Fetching transactions...");
  const [loading, setLoading] = useState(true);
  const [userOptions, setUserOptions] = useState([]);
  const [userOptionsLoading, setUserOptionsLoading] = useState(true);

  useEffect(() => {
    transactionDetails(email);
  }, [email])

  /*api call to fetch usersdetails for dropdown */
  useEffect(() => {
    const fetchUsers = () => {
      if (email !== "") {
        trackPromise(
          usercreditsService
            .fetchUsers()
            .then((response) => {
              const usersArray = response.data.users;

              if (Array.isArray(usersArray)) {
                const userNamesFromApi = usersArray.map((user) => user.username);
                const userOptions = userNamesFromApi.map((username) => ({ label: username, value: username }));
                setUserOptions(userOptions);
                setUsernames(userNamesFromApi);
                setUserOptionsLoading(false)
                setUsers(usersArray);
              } else {
                console.error("Invalid API response format. 'users' property is missing or not an array.");
              }
            })
            .catch((err) => {
              alert(err.response?.data?.error || "Error fetching users");
            })
        );
      }
    };

    fetchUsers();
  }, [email]);

  /*api call to fetch selectedusers transctionhistory details  */
  const transactionDetails = (email) => {
    setLoading(true);
    trackPromise(
      usercreditsService
        .usertransctiondetails(email)
        .then((response) => {
          setOriginalCreditHistoryList(response.data.transactions);
          filterData(fromDate, toDate);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false)
          console.error("API Error:", err);
          alert(err.response.data.error);
        })
    );
  }

  /*based on the dropdown selection fetching user tranctionhistroy*/
  const handleUserDropdownChange = (selectedUsername) => {
    const selectedUser = users.find((user) => user.username === selectedUsername?.value);
    const userEmail = selectedUser.email;
    if (userEmail) {
      transactionDetails(userEmail)
      setSelectedUser([selectedUsername]);
    }
  };

  const handleFromDateChange = (e) => {
    const formattedFromDate = moment(e.target.value).format('DD-MM-YYYY');
    setFromDate(formattedFromDate);
    filterData(formattedFromDate, toDate);
  };


  const handleToDateChange = (e) => {
    const formattedToDate = moment(e.target.value).format('DD-MM-YYYY');
    setToDate(formattedToDate);
    filterData(fromDate, formattedToDate);
  };

  const formatDate = (date) => {
    return moment(date, "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY");
  };

  const filterData = (fromDate, toDate) => {
    const filteredResult = originalCreditHistoryList.filter(item => {
      const transactionDate = formatDate(item.Date)
      // Check if the date is within the selected date range
      const isDateInRange =
        moment(transactionDate, "DD-MM-YYYY") >= moment(fromDate, "DD-MM-YYYY") &&
        moment(transactionDate, "DD-MM-YYYY") <= moment(toDate, "DD-MM-YYYY");

      // Check if the credit type matches the selected type or if it's "All"
      const isCreditTypeMatch =
        creditType === "All" ||
        (creditType === "creditassigned" && item["Credit Assigned"] > 0) ||
        (creditType === "creditused" && item["Credit Used"] > 0);

      // Return true if both conditions are met
      return isDateInRange && isCreditTypeMatch;
    });
    setFilteredTransactions(filteredResult);
  };

  useEffect(() => {
    filterData(fromDate, toDate);
  }, [creditType, originalCreditHistoryList]);


  const columns = [
    {
      dataField: "Reference Id",
      text: "Reference Id",
      sort: true
    },
    // {
    //   dataField: "email",
    //   text: "email",
    //   sort: true
    // },
    {
      dataField: "Date",
      text: "Date",
      sort: true,
    },
    { dataField: "Transaction Type", text: "Transaction Type", sort: true },
    { dataField: "Credit Used", text: "Credit Used" },
    { dataField: "Credit Assigned", text: "Credit Assigned" },
    { dataField: "Balance", text: "Balance" },
  ];

  const pagination = paginationFactory({
    page: 1,
    sizePerPage: pageSize,
    lastPageText: ">>",
    firstPageText: "<<",
    nextPageText: ">",
    prePageText: "<",
    showTotal: true,
    alwaysShowAllBtns: true,
    hideSizePerPage: false,
  });

  return (
    <div>
      <ToolkitProvider
        bootstrap4
        keyField="id"
        data={filteredTransactions}
        columns={columns}
        search
        bordered={false}
      >{(props) => (
        <div className="App">
          <div className="container-fluid">
            <div className="row">
              {/* <div className=""> */}
              <div className="mt-3 transaction-history-header categoryheader">
                <div className="left-header">
                  <div className="text1 ml-8" >Credit History</div>
                  {role !== 'General' && (
                    <MultiSelect
                      options={userOptions}
                      value={selectedUser}
                      onChange={(val => {
                        // only sending the last object as we r modifying multi select to single select
                        handleUserDropdownChange(val[val.length - 1])
                      })}
                      labelledBy="Select"
                      hasSelectAll={false}
                      selectionLimit={1}
                      ClearIcon={null}
                      ClearSelectedIcon={null}
                      isLoading={userOptionsLoading}
                      disabled={userOptionsLoading}
                      closeOnChangedValue
                    />
                  )}
                </div>

                <div className="right-header">
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                    <span className="paddedspan">
                      <label className="radio-btnname">
                        <input
                          type="radio"
                          className="mx-1 Radio-Input"
                          name="creditType"
                          value="All"
                          onChange={() => setCreditType("All")}
                          checked={creditType === "All"}
                        />
                        All
                      </label>
                    </span>
                    <span className="paddedspan">
                      <label className="radio-btnname">
                        <input
                          type="radio"
                          className="mx-1  Radio-Input"
                          name="creditType"
                          value="creditassigned"
                          onChange={() => setCreditType("creditassigned")}
                          checked={creditType === "creditassigned"}
                        />
                        Credit Assigned
                      </label>
                    </span>
                    <span className="paddedspan">
                      <label className="radio-btnname">
                        <input
                          type="radio"
                          className="mx-1 Radio-Input"
                          name="creditType"
                          value="creditused"
                          onChange={() => setCreditType("creditused")}
                          checked={creditType === "creditused"}
                        />
                        Credit Used
                      </label>
                    </span>
                    <div className="" style={{ display: 'flex', width: "250px", alignItems: "center", marginLeft: "10px" }}>
                      <label className="label" >From Date :</label>
                      <input
                        type="date"
                        style={{ marginLeft: "5px", width: "150px" }}
                        className="form-control"
                        title="From Date"
                        value={moment(fromDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                        max={moment(toDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                        onChange={handleFromDateChange}
                      ></input>
                    </div>
                    <div className="" style={{ display: 'flex', width: "250px", alignItems: "center", marginLeft: "10px" }}>
                      <label className="label">End Date :</label>
                      <input
                        type="date"
                        style={{ marginLeft: "5px", width: "150px" }}
                        className="form-control"
                        title="To Date"
                        value={moment(toDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                        min={moment(fromDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                        max={moment().format('YYYY-MM-DD')}
                        onChange={handleToDateChange}
                      ></input>
                    </div>
                  </div>
                </div>
              </div>
              {/* </div> */}
            </div>
            <div className="row mb-5">
              <div className="col mb-5">
                <div style={{ "padding": "20px" }}>
                  <Card className="card2 mt-3">
                    {/* <Card.Body className="table-container list-view"> */}
                    <BootstrapTable
                      keyField="Reference Id"
                      pagination={pagination}
                      {...props.baseProps}
                      bordered={false}
                      noDataIndication="No Transaction History"
                    />
                    {/* </Card.Body> */}
                  </Card>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      </ToolkitProvider>
      {loading && <LoadingOverlay message={loaderMessage} />}
    </div>

  );
};

export default Creditstemplate;
