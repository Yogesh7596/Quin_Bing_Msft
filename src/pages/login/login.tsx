import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AffineLogo from "../../assets/affineLogo.png";
import styles from "./login.module.css";
import RetravierLogo from "../../assets/Quin_Logo.png";
import quinLogoText from "../../assets/Quin_Logo.svg";
import { trackPromise } from "react-promise-tracker";
import usercreditsService from "../../api/creditmanagementService";
// import useCredit from "../../contextProviders/creditProvider/useCredit";
import Microsoft_Logo from "../../assets/Microsoft_Logo.png";
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';


const Login = ({ setIsAdmin, msalInstance }) => {
  const navigate = useNavigate();
  const [loginFailed, setLoginFailed] = useState(false);
  // const { setCreditBalance } = useCredit();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("")

  useEffect(() => {
    async function initializeMsal() {
      try {
        await msalInstance.handleRedirectPromise();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    }
    initializeMsal();
  }, []); 

  const submitHandler = (e) => {
    e.preventDefault();
    
    const validUsername = "admin@affine";
    const validPassword = "affine@2024";
    setLoading(true);
    setLoaderMessage('Signing In..................')
    if (username === validUsername && password === validPassword) {
      setIsAdmin(true);
      localStorage.setItem("role", "Admin"); 
      localStorage.setItem("name", "Admin User");
      localStorage.setItem("email", validUsername);
      localStorage.setItem("password", validPassword);
      // setLoading(false);
      setLoginFailed(false);
      navigate("/layout/home"); 
      setLoading(false);
    } else {
      setLoginFailed(true);
      setLoading(false);
    }
  };
  

  const usercredits = (userInfo) => {
    trackPromise(
      usercreditsService
        .userdata(userInfo)
        .then((response) => {
          const { role, balance } = response.data;
          localStorage.setItem("role", role);
          if (response.data.status !== 1) {
            setLoginFailed(true);
            sessionStorage.clear();
            localStorage.clear();
          } else {
            setLoginFailed(false);
            setIsAdmin(role === "Admin");
            setCreditBalance(balance);
            navigate("/layout/home");
          }

        })
        .catch((err) => {
          alert(err.response.data.error);
          setLoginFailed(true);
          sessionStorage.clear();
          localStorage.clear();
        })
    );
  };

  return (
    <div>
      {loading && <LoadingOverlay message={loaderMessage} />}
      <header className={styles.header} role={"banner"}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.headerTitleContainer}>
            <img
              src={AffineLogo}
              className="d-inline-block align-left"
              alt="Affine"
              style={{cursor: "default"}}
            />
            <img
              src={RetravierLogo}
              className="d-inline-block align-left quin_logo"
              width="80px"
              style={{cursor: "default"}}
            />
            <img
              src={quinLogoText}
              className="d-inline-block align-left"
              width="90px"
              style={{cursor: "default"}}
            />
          </Link>
        </div>
      </header>
      <div className="login-container">
        <div className="login-container">
          <div className="login1 div-wrapper d-flex justify-content-center mt-5">
            <div className="logincard">
              <div className="login-logo"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: 'auto',
                }}
              >
                <Link to="/" className="LoginContainer">
                  <img
                    src={Microsoft_Logo}
                    alt="Microsoft Logo"
                    style={{
                      height: '50px',
                      width: 'auto',
                    }}
                  />
                </Link>
              </div>
              <h2 className="header-group mb-3">Sign In</h2>
              <form onSubmit={submitHandler} autoComplete="off">
                <div className="form-group col-md-12">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group col-md-12 mt-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group col-md-12 text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary login-btn"
                    style={{ height: "35px", width: "100%",backgroundColor:"rgb(250, 42, 84)" }}
                  >
                    <span style={{ color: "#ffff" }}>Sign In</span>
                     <hr></hr>
                  </button>
                 
                  {loginFailed && (
                    <div style={{ color: "red", marginTop: "10px" }}>
                      Invalid username or password. Please try again.
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
