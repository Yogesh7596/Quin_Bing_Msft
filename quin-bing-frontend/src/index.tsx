import React, { lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicClientApplication } from '@azure/msal-browser';
import { initializeIcons } from "@fluentui/react";
import Layout from "./pages/layout/Layout";
import Login from "./pages/login/login";
import Chat from "./pages/chat/Chat";
import DocumentsList from "./pages/upload/DocumentsList";
import Category from "./pages/category/CategoryList";
import ProtectedRoute from "./protectedroute";
import UsersList from "./pages/users/UsersList";
import CreditProvider from './contextProviders/creditProvider/creditProvider'
import Creditstemplate from "./pages/creditstemplate/credittemplate";
import msalConfig from "./config/msalConfig";

import "./App.scss";
import "./index.css";
import Home from "./pages/home/Home";
import AzureSQLDatabase from "./pages/azureSqlDatabase/AzureSqlDatabase";
import DatabricksCSV from "./pages/databricksCSV/DatabricksCSV";
import GoogleCloudStorage from "./pages/googleCloudStorage/GoogleCloudStorage";
import SqlDatabaseQuery from "./pages/qa/SqlDatabaseQuery";

const NoPage = lazy(() =>
  import("./pages/NoPage").then((module) => ({ default: module.Component }))
);

initializeIcons();

const msalInstance = new PublicClientApplication(msalConfig);

const App = () => {
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("role") === "Admin"
  );

  function signOutClickHandler() {
    var confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/login";
    }

  }

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Login setIsAdmin={setIsAdmin} msalInstance={msalInstance} />
      ),
    },
    {
      path: "/login",
      element: (
        <Login setIsAdmin={setIsAdmin} msalInstance={msalInstance} />
      ),
    },
    {
      path: "layout",
      element: (
        <ProtectedRoute redirectTo={"/"}>
          <Layout isAdmin={isAdmin} signOutClickHandler={signOutClickHandler} />
        </ProtectedRoute>
      ),
      children: [
        // {
        //   index: true,
        //   path: "chat",
        //   element: <Chat />,
        // },
        // {
        //   path: "qa",
        //   lazy: () => import("./pages/oneshot/OneShot"),
        // },
        {
          path: "home",
          element: <Home />,
        },
        // {
        //   path: "upload_csv",
        //   element: <DocumentsList />,
        // },
        {
          path: "azure_sql_database",
          element: <AzureSQLDatabase />,
        },
        {
          path: "azure_sql_query",
          element: <SqlDatabaseQuery />,
        },

        // {
        //   path: "databricks_csv",
        //   element: <DatabricksCSV />,
        // },
        // {
        //   path: "google_cloud_storage",
        //   element: <GoogleCloudStorage />,
        // },
        {
          path: "*",
          element: <NoPage />,
        },
        {
          path: "users",
          element: isAdmin ? <UsersList setIsAdmin={setIsAdmin} signOutClickHandler={signOutClickHandler} /> : <NoPage />,
        },
        {
          path: "creditstemplate",
          element: <Creditstemplate />,
        }
      ],
    },
  ]);

  return (
    <React.StrictMode>
      {/* <CreditProvider setIsAdmin={setIsAdmin}> */}
      <RouterProvider router={router} />
      {/* </CreditProvider> */}
    </React.StrictMode>
  );
};




ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);