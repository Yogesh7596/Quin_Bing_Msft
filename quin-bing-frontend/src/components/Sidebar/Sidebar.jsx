import React from "react";
import './Sidebar.scss';

const Sidebar = ({ children, onClose, open }) => {
    return (
        <div className={`sidebar ${open ? "" : "hide-sidebar"}`}>
            <div style={{ position: "absolute", right: '20px', top: '1vw' }}>
                <i
                    className="fa fa-times crossicon"
                    onClick={onClose}
                    aria-hidden="true"
                >
                </i>

            </div>
            {children}
        </div>
    )
}

export default Sidebar;