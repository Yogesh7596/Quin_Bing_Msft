import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton, Dropdown } from "@fluentui/react";
import ToolkitProvider, { Search } from "react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min";
import { trackPromise } from "react-promise-tracker";
import paginationFactory from "react-bootstrap-table2-paginator";
import CategoryModal from "../../modals/CategoryModal";
import BootstrapTable from "react-bootstrap-table-next";
import categoryService from "../../api/categoryService";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
import "./CategoryList.scss"


const CategoryList = () => {
  const { SearchBar } = Search;
  const [openModal, setopenModal] = useState(false);
  const [modalHeader, setModalheader] = useState("Add Category");
  const [categoryList, setcategoryList] = useState([])
  const [filteredCategoryList, setFilteredCategoryList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState()
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  let selectedCategory = null;


  const handleOpen = () => { setopenModal(true); }
  const handleClose = () => { setopenModal(false) }

  useEffect(() => {
    getCategoryList();
  }, [])

  function getDocHeight() {
    var D = document;
    return Math.max(
      D.body.scrollHeight, D.documentElement.scrollHeight,
      D.body.offsetHeight, D.documentElement.offsetHeight,
      D.body.clientHeight, D.documentElement.clientHeight
    )
  }
  useEffect(() => {
    if (window.innerWidth <= 768) {
      window.addEventListener('scroll', onScroll);
    }

    return () => {
      if (window.innerWidth <= 768) { window.removeEventListener('scroll', onScroll) }
    };
  }, [categoryList, filteredCategoryList]);

  const onScroll = () => {
    if (categoryList.length > filteredCategoryList.length) {
      var winheight = window.innerHeight || (document.documentElement || document.body).clientHeight
      var docheight = getDocHeight()
      var scrollTop = (document.documentElement || document.body.parentNode || document.body).scrollTop
      var trackLength = docheight - winheight
      var pctScrolled = Math.floor(scrollTop / trackLength * 100)
      if (!isNaN(pctScrolled)) {
        if (pctScrolled > 90) {
          if (searchText != "") {
            let lowerVal = searchText.toLowerCase();
            let results = categoryList.filter((data) => data.category_code.toLowerCase().includes(lowerVal) ||
              data.category_name.toLowerCase().includes(lowerVal) ||
              data.created_by.toLowerCase().includes(lowerVal)
            )
            if (results.length > filteredCategoryList.length) {
              setFilteredCategoryList(results.slice(0, (filteredCategoryList.length + pageSize)));
            }
          } else {
            setFilteredCategoryList([...categoryList.slice(0, (filteredCategoryList.length + pageSize))]);
          }
        }
      }
    }
  }

  const handleSubmit = () => {
    if (!category.category_name || !category.category_code) {
      return alert("Please enter category name and category code");
    }
    try {
      // closeModal();
      setLoading(true);
      if (!category.id) {
        let params = { category_name: category.category_name, category_code: category.category_code };
        trackPromise(categoryService.addCategory(params).then((res) => {
          alert(res.data.message);
          getCategoryList();
          selectedCategory = null;
          setIsConfigPanelOpen(false);
          setLoading(false);
        }).catch((err) => {
          setLoading(false)
          console.log(err)
        })

        )
      } else {
        let params = { category_id: category.id, category_name: category.category_name, category_code: category.category_code };
        trackPromise(categoryService.updateCategory(params).then((res) => {
          alert(res.data.message);
          getCategoryList();
          selectedCategory = null;
          setIsConfigPanelOpen(false);
          setLoading(false);
        }).catch((err) => {
          setLoading(false);
          console.log(err)
        })

        )
      }

    } catch (error) {
      console.log(error, "error while submitting")
    }
  }

  const getCategoryList = () => {
    setLoading(true);
    trackPromise(
      categoryService.getCategory({ status_flag: 0 }).then((res) => {
        // NEED TO REPLACE RESPONSE DATA WITH CATERGORY LIST
        let existingCategory = []
        let catergoryList2 = [...res?.data?.CategoryList];
        catergoryList2.map((val) => {
          existingCategory.push(val.category_name.toLowerCase());
          let status_val = val.status;
          val.status = val.status === 1 ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>
          val.action = status_val === 0 ?
            <div>
              <i className="fa fa-pencil hide-pencil" title="Edit Category" style={{ color: "#222" }} onClick={() => updateCategory(val)}></i>
              <i className="ms-3 fa fa-solid fa-toggle-off text-danger" style={{ color: "#222" }} title="Activate Category" onClick={() => changeUserStatus(val.id, 1)}></i>
            </div>
            :
            <div>
              <i className="fa fa-pencil" title="Edit Category" style={{ color: "#222" }} onClick={() => updateCategory(val)}></i>
              <i className="ms-3 fa fa-solid fa-toggle-on text-success" style={{ color: "#222" }} title="Deactivate Category" onClick={() => changeUserStatus(val.id, 0)}></i>
            </div>
        })
        setcategoryList(catergoryList2);
        setFilteredCategoryList(catergoryList2.slice(0, pageSize));
        setLoading(false);
      })

    )
  }

  const filterResultsBySearch = (val) => {
    setSearchText(val);
    let lowerVal = val.toLowerCase();
    if (lowerVal == "") {
      setFilteredCategoryList(categoryList);
    } else {
      let results = categoryList.filter((data) => data.category_code.toLowerCase().includes(lowerVal) ||
        data.category_name.toLowerCase().includes(lowerVal) ||
        data.created_by.toLowerCase().includes(lowerVal)
      ).slice(0, pageSize);
      setFilteredCategoryList(results);
    }
  }


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
  const columns = [
    {
      dataField: "id",
      text: "Sl No",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "category_name",
      text: "Name",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "category_code",
      text: "Code",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "status",
      text: "Status",
      headerAlign: "left",
      align: "left",
    },
    {
      dataField: "action",
      text: "Action",
      headerAlign: "left",
      align: "left",
    },

  ];

  const updateCategory = (row) => {
    setModalheader("Edit Category");
    handleOpen();
    setCategory({ ...category, id: row.id, category_name: row.category_name, category_code: row.category_code })
  }
  const changeUserStatus = (categoryID, status) => {
    let confirmDelete = false
    if (status == 1) {
      confirmDelete = window.confirm("Are you sure you want to activate this category?");
    }
    else {
      confirmDelete = window.confirm("Are you sure you want to Deactivate this category?");
    }

    if (confirmDelete) {
      setLoading(true);
      trackPromise(
        categoryService.updateCategory({ category_id: categoryID, status_flag: status }).then((response) => {
          alert(response.data.message);
          getCategoryList();
          setLoading(false);
        })
      );
    }
  }

  return (
    <>
      {!isConfigPanelOpen && loading && <LoadingOverlay message="Fetching categories..." />}
      <Panel
        headerText="Add Category"
        isOpen={isConfigPanelOpen}
        isBlocking={false}
        onDismiss={() => setIsConfigPanelOpen(false)}
        closeButtonAriaLabel="Close"
        onRenderFooterContent={() => <div>
          <DefaultButton style={{ marginRight: '8px' }} onClick={() => handleSubmit()}>Submit</DefaultButton>
          <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>
        </div>}
        isFooterAtBottom={true}
      >
        {loading && <LoadingOverlay message="Adding new category..." />}
        <div className="categoryModall">
          <div className="categorysection">
            <div>
              <label style={{ marginBottom: '4px' }} className="root-160">Category Name</label>
              <input
                type="text"
                name="category"
                className="form-control shadow-none inputfield"
                placeholder="Category Name"
                value={category?.category_name}
                onChange={(e) => { setCategory({ ...category, category_name: e.target.value }); setShowErrorMsg(false); setSanityErrorMsg("") }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ marginBottom: '4px' }}>Category Code</label>
              <input
                type="text"
                name="category"
                className="form-control shadow-none inputfield"
                placeholder="Category Code"
                value={category ? category.category_code : ""}
                onChange={(e) => { setCategory({ ...category, category_code: e.target.value }); setShowErrorMsg(false); setSanityErrorMsg("") }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <ToolkitProvider
        bootstrap4
        keyField="category_name"
        data={filteredCategoryList}
        columns={columns}
        search
        bordered={false}
      >{(props) => (
        <>

          <div className="App">
            <div className="container-fluid">

              <div className="row">
                <div className="">
                  <div className="mt-3 categoryheader">
                    <div className="text1">Category</div>
                    <div className="text1 serach-cls">
                      <SearchBar
                        placeholder="Search Category"
                        {...props.searchProps}
                        onSearch={(val) => {
                          filterResultsBySearch(val);
                        }}
                        searchText={searchText}
                      />
                      <i
                        className="fa-solid fa-magnifying-glass fa-search-icon"
                        title="Search"
                      ></i>
                    </div>
                    <div className="adddataset-btn-div ">
                      <Button
                        className="adddataset-btn"
                        variant="primary"
                        onClick={() => {
                          setIsConfigPanelOpen(true);
                          setModalheader("Add Category"); setCategory({ ...category, id: "", category_name: "", category_code: "" })
                        }}
                      >
                        <i
                          className="fa-solid fa-plus me-2"
                          title="Create New User"
                        ></i>
                        New Category
                      </Button>
                    </div>
                  </div>
                </div>
              </div>


              {openModal &&
                <CategoryModal closeModal={handleClose} modalHeader={modalHeader} setCategory={setCategory} category={category} getCategoryList={getCategoryList} />
              }

              <div className="row mobilelist">
                {
                  filteredCategoryList.map((doc) => {
                    return (
                      <Card style={{ marginTop: '16px' }}>
                        <Card.Body className="custom_card">
                          {
                            columns.map((eachCol) => {
                              return (
                                <div className="row" style={{ marginBottom: '8px' }}>
                                  <div className="col-4">
                                    <h6>{eachCol.text}</h6>
                                  </div>
                                  <div className="col-8">
                                    <h6>{doc[eachCol.dataField]}</h6>
                                  </div>
                                </div>

                              );
                            })
                          }
                        </Card.Body>
                      </Card>
                    )
                  })
                }
              </div>
              <div className="row  mb-5">
                <div className="col mb-5">
                  <div>
                    <Card className="card2 mt-3">
                      {

                        <BootstrapTable
                          keyField="user_name"
                          pagination={pagination}
                          {...props.baseProps}
                          bordered={false}
                          noDataIndication="No Categories"
                        />

                      }
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>

      )}
      </ToolkitProvider>



    </>
  )
}

export default CategoryList