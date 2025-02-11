import React, { useEffect, useState } from "react";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { trackPromise } from "react-promise-tracker";

import usercreditsService from "../api/creditmanagementService";
// import useCredit from "../contextProviders/creditProvider/useCredit";
import { User } from "../types";
import { roleTypes } from "../constants";
import LoadingOverlay from "../components/LoadingOverlay/LoadingOverlay";

import "./UserForm.scss";

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

interface UserFormProps {
  closeModal: () => void;
  modalHeader: string;
  userObj: User | null;
  fetchUsers: () => void;
  creditPoolBalance: number;
  useCreditPool: boolean;
  setCreditPoolBalance: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  userObj,
  modalHeader,
  closeModal,
  fetchUsers,
  useCreditPool,
  creditPoolBalance,
  setCreditPoolBalance,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(userObj);
  const [credits, setCredits] = useState<number>(0);
  const [error, setError] = useState(null);
  const [creditAction, setCreditAction] = useState("assign");
  const [enableUpdateUser, setEnableUpdateUser] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState("Update");
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Updating Users...")

  // const { creditBalance, setCreditBalance } = useCredit();

  const handleCancel = () => {
    closeModal();
  };

  const changeCreditAction = (event) => {
    setCreditAction(event.target.value);
  };

  // Validating credit assigning and revoking
  const validateCreditAction = () => {
    let enable = true;
    if (
      creditAction === "assign" &&
      useCreditPool &&
      credits > creditPoolBalance
    ) {
      setError(`Credits assigned exceeds credit pool balance ${creditPoolBalance}`);
      enable = false;
    }
    if (creditAction === "revoke" && credits > userObj?.balance) {
      setError("Not enough balance to revoke");
      enable = false;
    }
    return enable;
  };

  // validating update user form
  useEffect(() => {
    if (credits < 0) {
      setError("Credits cannot be less than 0");
      setEnableUpdateUser(false);
    } else if (credits == 0 && userObj.role !== currentUser.role) {
      setEnableUpdateUser(true);
      setError("");
    } else if (credits == 0 && userObj.role === currentUser.role) {
      setEnableUpdateUser(false);
    } else if (credits > 0) {
      if (validateCreditAction()) {
        setEnableUpdateUser(true);
        setError(" ");
      } else {
        setEnableUpdateUser(false);
      }
    }
  }, [currentUser, credits, creditAction]);

  const updateUser = () => {
    setSubmitButtonText("Updating...");
    setLoading(true);
    const options = {
      email: currentUser.email, // Include email field
      id: currentUser.id,
      new_role: currentUser.role,
    };
    if (creditAction === "assign") {
      options["CreditAssigned"] = Number(credits);
    } else {
      options["Credit_Revoked"] = Number(credits);
    }

    const user_info = JSON.stringify(options);
    trackPromise(
      usercreditsService
        .updateUsers(user_info)
        .then((response) => {
          const { email = "", balance, credit_pool_balance } = response?.data;
          setSubmitButtonText("Update");
          fetchUsers();
          if (email === localStorage.getItem("email")) {
            if (balance !== creditBalance) {
              setCreditBalance(balance);
            }
          }
          setCreditPoolBalance(credit_pool_balance);
          alert(response.data.message ||
            `${userObj.role !== currentUser.role
              ? "Role updated"
              : options["CreditAssigned"]
                ? "Credits assigned"
                : "Credits revoked"
            } successfully`
          );
          setLoading(false);
          closeModal();
        })
        .catch((err) => {
          const { error } = err.response.data;
          setSubmitButtonText("Update");
          setError(error);
          setLoading(false);
          alert(error);
        })
    );
  };

  const setUserRole = (e) => {
    setCurrentUser((prevUser) => ({
      ...prevUser,
      role: e.target.value,
    }));
  };

  return (
    <div>
      <div className="overlay">
        {loading && <LoadingOverlay message={loaderMessage} />}
        <div className="container h-100 d-flex justify-content-center align-items-center section-view frame">
          <div className="pop-card-pos p-4 bg-white rounded shadow-lg datasetoverlayelm uploadStyle">
            <div className="d-flex flex-row justify-content-space-between align-items-center">
              <div className="d-inline add-dataset-title">{modalHeader}</div>
            </div>
            <div className="col-auto pad-l-0 mt-2">
              <div className="card choosefile-card">
                <div className="col-12 mt-2">
                  <div className="d-flex flex-row justify-content-space-evenly">
                    <div className="d-flex flex-row">
                      <label> Name: </label>{" "}
                      <p className="username">{currentUser?.username}</p>
                    </div>
                    <div className="d-flex flex-row offset-md-1">
                      <label>Role: </label>
                      <select
                        className="form-control shadow-none"
                        name="role"
                        value={currentUser.role}
                        onChange={setUserRole}
                      >
                        <option disabled value="">
                          Select an option
                        </option>
                        {roleTypes.map((ele) => (
                          <option key={ele.name} value={ele.name}>
                            {ele.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <br />
                  <div className="d-flex flex-row justify-content-space-evenly">
                    <div>
                      <label>
                        <input
                          type="radio"
                          value="assign"
                          checked={creditAction === "assign"}
                          onChange={changeCreditAction}
                        />
                        Assign
                      </label>
                      <label>
                        <input
                          type="radio"
                          value="revoke"
                          checked={creditAction === "revoke"}
                          onChange={changeCreditAction}
                        />
                        Revoke
                      </label>
                    </div>
                    <br />
                    <div className="d-flex flex-row offset-md-1">
                      <label>Credits: </label>
                      <input
                        defaultValue={credits}
                        type="number"
                        name="credit_revoked"
                        className="form-control shadow-none"
                        onChange={(e) => setCredits(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="errorText">{error ? error : ""}</div>
              <Form>
                <div className="mt-2">
                  <div className="d-flex flex-row-reverse">
                    <Button
                      className="mt-2 cancel-btn btn-sm"
                      variant="primary"
                      onClick={handleCancel}
                    >
                      {" "}
                      Cancel{" "}
                    </Button>
                    <Button
                      className="mt-2 create-btn btn-sm"
                      variant="primary"
                      disabled={!enableUpdateUser}
                      onClick={updateUser}
                    >
                      {" "}
                      {submitButtonText}{" "}
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
