# Import the necessary Python libraries and functions
from streamlit_option_menu import option_menu
import streamlit as st
import time
from home import home
from main import azure_database
st.markdown("""
    <div style='text-align: center; margin-top:-70px; margin-bottom: 5px;margin-left: -50px;'>
    <h2 style='font-size: 40px; font-family: Courier New, monospace;
                    letter-spacing: 2px; text-decoration: none;'>
    <img src="https://acis.affineanalytics.co.in/assets/images/logo_small.png" alt="logo" width="70" height="60">
    <span style='background: linear-gradient(45deg, #ed4965, #c05aaf);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            text-shadow: none;'>
                    AFFINE QUIN
    </span>
    <span style='font-size: 40%;'>
    
    </span>
    </h2>
    </div>
    """, unsafe_allow_html=True)
# Use Streamlit to create a sidebar with multiple flow options
with st.sidebar:
    # Define an option menu with flow choices
    choose = option_menu("", ["Home", 'Azure SQL Database'],
                         icons=['house', 'filetype-csv', 'bar-chart-steps',
                                'cloud-arrow-down', 'database-down'],
                         menu_icon="app-indicator", default_index=0,
                         styles={
        "container": {"padding": "5!important", "background-color": "#fafafa"},
        "icon": {"color": "black", "font-size": "25px"},
        "nav-link": {"font-size": "16px", "text-align": "left", "margin": "0px", "--hover-color": "#eee"},
        "nav-link-selected": {"background-color": "#fa2a54"},
    }

    )

# Depending on the selected flow, call the respective function
if choose == "Home":
    home()

if 'total_time' not in st.session_state:
    st.session_state.total_time = None

elif choose == "Azure SQL Database":
    start = time.perf_counter()
    f = azure_database()
    end = time.perf_counter()
    st.session_state.total_time = f
    if st.session_state.total_time:
        st.write("Total time taken in minutes:", round((end-start)/60,2))