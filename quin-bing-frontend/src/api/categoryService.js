//import api from "./interceptor";
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: { "Content-Type": "application/json" },
});

class categoryService {
  getCategory(payload) {
    let querybuilder = "";
    if (payload) {
      if (payload.status_flag == 1) {
        querybuilder = `?status_flag=1`;
      } else {
        querybuilder = `?status_flag=0`;
      }
    } else {
      querybuilder = `?status_flag=0`;
    }
    console.log(`/documentService/getCategories/${querybuilder}`,"querybuilder")
    return api
      .get(`/documentService/getCategories/${querybuilder}`)
      .then((res) => {
        return res;
      })
      .catch((err) => {});
  }
  updateCategory(payload) {
    let queryBuilder = "";
    if (payload.category_name) {
      queryBuilder = queryBuilder + `&category_name=${payload.category_name}`;
    }
    if (payload.category_code) {
      queryBuilder = queryBuilder + `&category_code=${payload.category_code}`;
    }
    if (queryBuilder === "") {
      if (payload.status_flag === 0) {
        payload.status_flag = false;
      } else {
        payload.status_flag = true;
      }
      queryBuilder = queryBuilder + `status_flag=${payload.status_flag}`;
    }
    return api
      .put(
        `/documentService/updateCategory?category_id=${payload.category_id}&${queryBuilder}`
      )
      .then((res) => {
        return res;
        
      })
      .catch((err) => {
        console.log(err);
        alert(err.response.data.message);
      });
  }
  addCategory(payload) {
    return api
      .get(
        `/documentService/addCategory?category_name=${payload.category_name}&category_code=${payload.category_code}`
      )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        alert(err.response.data.message);
      });
  }
}

export default new categoryService();
