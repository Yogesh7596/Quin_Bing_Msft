import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

class databaseService {
  fetchDatabaseTables = (database) => {
    const querybuilder = `?database=${database}`;
      return api
      .get(`/get_table_names`)
      .then((reponse) => {
        return reponse
      })
      .catch((err) => {
        throw err;
      });
    }

    fetchAzureDatabases = (database) => {
      return api
      .get(`/get_db_names`)
      .then((reponse) => {
        return reponse
      })
      .catch((err) => {
        throw err;
      });
    }

  fetchDatabaseGCP = (database) => {
      return api
      .get(`/api/fetch_databases_gcp`)
      .then((reponse) => {
        return reponse
      })
      .catch((err) => {
        throw err;
      });
    }

  fetchDatabaseTablesGCP = (database) => {
    const querybuilder = `?database=${database}`;
      return api
      .get(`/api/fetch_tables_gcp${querybuilder}`)
      .then((reponse) => {
        return reponse
      })
      .catch((err) => {
        throw err;
      });
    }

  fetchTablesData = (database, tables) => {
    console.log("tn", tables)
    // const querybuilder = `?database=${database}&tables=${tables.join(',')}`;
    const payload = {
      tables: tables
    };
      return api
      .post("/get_table_schema",payload)
      .then((reponse) => {
        return reponse
      })
      .catch((err) => {
        throw err;
      });
    }

    fetchTablesDataGCP = (tables_info) => {
      console.log(tables_info)
      return api
        .post("/api/sample_data_gcp", tables_info)
        .then((response) => {
          return response;
        })
        .catch((err) => {
          throw err;
        });
    };
}

export default new databaseService()