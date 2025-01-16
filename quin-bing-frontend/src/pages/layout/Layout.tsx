import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import github from "../../assets/github.svg";
import styles from "./Layout.module.css";
import AffineLogo from '../../assets/affineLogo.png';
import AffineLogosm from '../../assets/affinelogo_sm.png';
import quinLogo from '../../assets/Quin_Logo.png';
import quinLogoText from "../../assets/Quin_Logo.svg";
import React, { useEffect, useState } from "react";


const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const Layout = ({ isAdmin, signOutClickHandler }) => {
  const storedResponse = localStorage.getItem('msalResponse');
  // const { creditBalance } = useCredit();
  const [showCreditComponent, setShowCreditComponent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    sessionStorage.setItem('location', JSON.stringify(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    navigate(JSON.parse(sessionStorage.getItem("location")));
  }, []);

  let fullName; // Declare fullName outside of the if statement

  if (storedResponse !== null) {
    try {
      const parsedResponse = JSON.parse(storedResponse);

      if (parsedResponse?.account?.name) {
        fullName = parsedResponse.account.name;
      }
    } catch (error) {
      alert(error);
    }
  }

  const openCreditPage = () => {
    navigate('/layout/creditstemplate');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header} role={"banner"}>
        <div className={styles.headerContainer}>
          <Link to="/layout/home"
            className={styles.headerTitleContainer}>
            <img src={AffineLogo} className="d-inline-block align-left" alt='Affine' />
            <img src={quinLogo} className="d-inline-block align-left quin_logo" width="80px" />
            <img src={quinLogoText} className="d-inline-block align-left" width="100px" />
          </Link>
          <nav>
            <ul className={styles.headerNavList}>
              <li className={styles.headerNavLeftMargin}>
                <NavLink to="home" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                  Home
                </NavLink>
              </li>
              <li className={styles.headerNavLeftMargin}>
                <NavLink to="azure_sql_database" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                  Azure SQL Database
                </NavLink>
              </li>
              {/* {isAdmin && <li className={styles.headerNavLeftMargin}>
                <NavLink to="users" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                  Users
                </NavLink>
              </li>} */}
            </ul>
          </nav>
        </div>
        <div
          className="powerbtn"
          style={{
            marginLeft: "8px",
            height: "30px",
            width: "30px",
            alignItems: "center",
            paddingRight: "38px",
            fontSize: "23px",
          }}
        >
          <i
            className="fa fa-power-off pointer"
            onClick={signOutClickHandler}
            title="Logout"
          ></i>
        </div>
      </header>

      <Outlet />
      <footer className={styles.footer}>
        <div className={styles.left_container}>
          <span className={styles.copy_right}>copyright &copy; {currentYear}</span>
        </div>
        <div className={styles.powered}>
          <label className={styles.footertext}>Powered by </label>
          <a href="https://affine.ai" target="_blank" ><img className={styles.footerlogopos} src={AffineLogo} alt="Affine Logo" /></a>
        </div>
      </footer>
      {/* {showCreditComponent && <Creditstemplate />} */}
    </div>
  );
};

export default Layout;
