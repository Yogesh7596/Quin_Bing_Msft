import React, { useState } from "react";
import "./CategoryModal.scss";
import "./UserForm.scss"
import Button from "react-bootstrap/Button";
import { trackPromise } from "react-promise-tracker";
import categoryService from "../api/categoryService"
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";

function CategoryModal({closeModal,modalHeader,setCategory, category,getCategoryList}) {
    const [showErrorMsg, setShowErrorMsg] = useState(false);
	const [sanityErrorMsg, setSanityErrorMsg] = useState("");
    const validator=()=>{
        if(!category.category_name){
            setShowErrorMsg(true);
            setSanityErrorMsg("Category name is required")
            return false
        }
        if(!category.category_code){
            setShowErrorMsg(true);
            setSanityErrorMsg("Category code is required")
            return false
        }
        setShowErrorMsg(false)
        return true
    }
    const handleSubmit=(e)=>{ e.preventDefault();
        var validateStatus=validator();
        if(validateStatus){
            try {
                closeModal();
                if(!category.id){
                    let params = {category_name: category.category_name, category_code : category.category_code};
                    trackPromise(categoryService.addCategory(params).then((res)=>{
                        alert(res.data.message);
                        getCategoryList();
                    }).catch((err)=>console.log(err))

                    )
                }else{
                    let params = {category_id: category.id, category_name: category.category_name, category_code : category.category_code};
                    trackPromise(categoryService.updateCategory(params).then((res)=>{
                        alert(res.data.message);
                        getCategoryList();
                    }).catch((err)=>console.log(err))

                    )
                }

            } catch (error) {
                console.log(error,"error while submitting")
            }
        }

    }

	return (
		<div>
			<div className="categoryModal">
				<div className="container h-100">
					<div>
						<div className="d-inline add-dataset-title">
							{modalHeader}
							<i className="fa fa-times float-right" style={{color:"#222"}} onClick={closeModal}></i>
						</div>
						<div className="col-auto pad-l-0 mt-2" style={{ backgroundColor: "#EEECF2", padding: '16px', borderRadius: '5px'}}>
							<div className="categorysection">
								{showErrorMsg && (
										<Alert variant="danger" onClose={() => {setShowErrorMsg(false);setSanityErrorMsg("")}} dismissible>
										<Alert.displayName>{sanityErrorMsg}</Alert.displayName>
									</Alert>
								)}

								<div className="row ">
									<div>
										<label>Category Name</label>
										<input
											type="text"
											name="category"
											className="form-control shadow-none"
											placeholder="Category Name"
											value={category?.category_name}
											onChange={(e)=>{setCategory({...category,category_name:e.target.value});setShowErrorMsg(false);setSanityErrorMsg("")}}
										/>
									</div>

									<div>
										<label>Category Code</label>
										<input
											type="text"
											name="category"
											className="form-control shadow-none"
											placeholder="Category Code"
											value={category ? category.category_code : ""}
											onChange={(e)=>{setCategory({...category,category_code:e.target.value});setShowErrorMsg(false);setSanityErrorMsg("")}}
										/>
									</div>
								</div>
							</div>
						</div>
						</div>
						<Form>
								<div className="mt-4">
									<div className="d-flex flex-row-reverse">
										<Button
											className="mt-2 cancel-btn btn-sm"
											variant="primary"
											onClick={closeModal}
											>
											{" "}
											Cancel{" "}
										</Button>
										<Button
											className="mt-2 create-btn btn-sm"
											variant="primary"
											onClick={handleSubmit}
											>
											{" "}
											Submit{" "}
										</Button>
									</div>
								</div>
							</Form>
				</div>
			</div>
		</div>
	);
}

export default CategoryModal;
