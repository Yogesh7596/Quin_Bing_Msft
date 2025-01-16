import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToolkitProvider from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import axios from "axios";

import UserForm from "../../modals/UserForm";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
import { User } from "../../types";

import "./UsersList.scss";

import { trackPromise } from "react-promise-tracker";
import usercreditsService from "../../api/creditmanagementService";

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

const UsersList: React.FC = ({ setIsAdmin, signOutClickHandler }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [updateUserObj, setUpdateUserObj] = useState<User | null>(null);
  const [users, setUsers] = useState<User[] | []>([]);
  const [creditPoolBalance, setCreditPoolBalance] = useState<number>(0);
  const [useCreditPool, setUseCreditPool] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState("Fetching Users...");
  const userEmail = localStorage.getItem("email", "")

  const navigate = useNavigate();

  const columns = [
    {
      dataField: "username",
      text: "User Name",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "email",
      text: "Email",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "role",
      text: "Role",
      sort: true,
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "file_uploaded",
      text: "File Upload",
      sort: true,
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "query_count",
      text: "Query Count",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "credit_assigned",
      text: "Credit Assigned",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "credit_used",
      text: "Credits Used",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "credit_revoked",
      text: "Credits Revoked",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "balance",
      text: "Balance",
      headerAlign: "left",
      align: "left",
    },

    {
      dataField: "status",
      text: "Status",
      headerAlign: "left",
      align: "left",
      formatter: (cell: any, row: User) => (
        row.status === 1 ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-danger">Inactive</span>
        )
      ),
    },

    {
      dataField: "action",
      text: "Action",
      headerAlign: "left",
      align: "left",
      formatter: (cell: any, row: User) => (
        <>
          <i
            className="fa fa-pencil pointer"
            style={{ color: "#222", marginRight: "10px" }}
            title="Edit User"
            onClick={() => updateUser(row)}
          ></i>

          {row.status === 1 ? (
            <i
              className="fa fa-solid fa-toggle-on text-success pointer"
              style={{ color: "#222" }}
              title="Deactivate User"
              onClick={() => changeUserStatus({ status: 0, email: row.email })}
            ></i>
          ) : (
            <i
              className="fa fa-solid fa-toggle-off text-danger"
              style={{ color: "#222" }}
              title="Activate User"
              onClick={() => changeUserStatus({ status: 1, email: row.email })}
            ></i>
          )}
        </>
      ),
    },
  ];

  const changeUserStatus = ({ status, email }) => {
    let confirmDelete = false
    if (status == 1) {
      confirmDelete = window.confirm("Are you sure you want to activate this user?");
    }
    else {
      confirmDelete = window.confirm("Are you sure you want to Deactivate this user?");
    }

    if (confirmDelete) {
      setLoading(true);
      trackPromise(
        usercreditsService
          .updateuserstatus({ status, email })
          .then((response) => {
            console.log(response)
            fetchUsers()
            if (email === userEmail) {
              signOutClickHandler();
            }
          })
          .catch((err) => {
            setLoading(false);
          })
      )
    }
  }

  const fetchUsers = () => {
    setLoading(true);
    trackPromise(
      usercreditsService
        .fetchUsers()
        .then((response) => {
          const { config, users } = response.data;

          // Update status and possibly set action for each user
          // const updatedUsers = users.map((val) => {
          //   let status_val = val.status;
          //   val.status = status_val === 1 ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>;
          //   return val;
          // });
          users?.map(user => {
            if (user.email === userEmail) {
              const isAdmin = user.role === "Admin";
              if (!isAdmin) {
                setIsAdmin(false);
                navigate("/layout/home")
              }
            }
          })
          setUsers(users);
          setCreditPoolBalance(config.credit_pool_balance);
          setUseCreditPool(config.use_credit_pool);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);
        })
    );
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setUpdateUserObj("");
  };

  const updateUser = (userObj: User) => {
    setUpdateUserObj(userObj);
    setShowModal(true);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div></div>
        {useCreditPool && (
          <div className="credit-pool-balance">
            Credit Pool Balance: {creditPoolBalance}
          </div>
        )}
      </div>
      {loading && <LoadingOverlay message={loaderMessage} />}
      <div
        className="users-list"
        style={{ paddingTop: useCreditPool ? "20px" : "50px" }}
      >
        <ToolkitProvider
          bootstrap4
          keyField="id"
          data={users}
          columns={columns}
          bordered={false}
        >
          {(props) => (
            <div>
              {showModal && updateUserObj && (
                <UserForm
                  closeModal={closeModal}
                  modalHeader="Update User"
                  userObj={updateUserObj}
                  fetchUsers={fetchUsers}
                  useCreditPool={useCreditPool}
                  creditPoolBalance={creditPoolBalance}
                  setCreditPoolBalance={setCreditPoolBalance}
                />
              )}
              <BootstrapTable
                {...props.baseProps}
                // other BootstrapTable props
                bordered={false}
                noDataIndication={loading ? "Loading..." : "No Users"}
                pagination={pagination}
              />
            </div>
          )}
        </ToolkitProvider>
      </div>
    </div>
  );
};

export default UsersList;
