# Import the necessary Python libraries
from insight_df_summary import insight_df_summary
from insight import insight
import streamlit as st
import os
import pypyodbc as odbc
import pyodbc
import pandas as pd
import time
import openai
import base64
from dotenv import load_dotenv
load_dotenv()
# Import the necessary function

def download_csv(name,df):
                    
    csv = df.to_csv(index=False)
    base = base64.b64encode(csv.encode()).decode()
    file = (f'<a href="data:file/csv;base64,{base}" download="%s.csv">Click here to Download data</a>' % (name))
    
    return file


def azure_database():
    """
    Allows user to select csv file from connected azure sql database.
    Internally calls insight.py and insight_df_summary.py to get sql query to run on azure sql database,
    natural language insight and python plot.
    """
    # Load credentials
    # openai.api_type = os.getenv('api_type')
    # openai.api_base = os.getenv('api_base')
    # openai.api_version = os.getenv('api_version')
    # openai.api_key = os.getenv('api_key')

    openai.api_type = "azure"
    openai.api_base = "https://aipractices.openai.azure.com/"
    openai.api_version = "2023-12-01-preview"
    # openai.api_key = "1dfa2422e0ba43a88044e87df4655c4c"
    openai.api_key = "e5990e77abe04e74b6de34cdb4d1cce4"

    # openai.api_type = "azure"
    # openai.api_base = "https://msn-aoai.openai.azure.com/"
    # openai.api_version = "2024-02-15-preview"
    # openai.api_key = "ba353e6d44164d59b8d29dc333cd58ea"

    # Create a connection to connect with Azure SQL Database.
    connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:quickazuredemo.database.windows.net,1433;Database=quickinsight;Uid=bhaskar;Pwd=Affine@123;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'
    # connection_string = os.getenv('connection_string')
    conn = odbc.connect(connection_string)

    cursor = conn.cursor()
    # Initialize a variable to count the number of selected tables.
    # number_of_tables = 0
    flag = False

    # with st.sidebar:
    # Create a dropdown selectbox in the Streamlit sidebar for choosing a database name.
    # The list ["Select", "quickinsight"] provides the available options, and "index=0" sets the initial selection to "Select".
    database = st.sidebar.selectbox("Select Database Name:", [
        "Select", "quickinsight"], index=0)

    # Construct a azure SQL query to retrieve table names from the selected database.

    if database != "Select":
        # SQL query to retrieve table names from the database.
        table_query = """select t.name as table_name from sys.tables t order by table_name;"""
        # Execute the table query and fetch the results.
        query_job1 = cursor.execute(table_query)
        table_list = []
        for table in query_job1:
            table_list.append(table[0])

        # Allow the user to select tables using Streamlit's multiselect widget.
        selected_tables = st.sidebar.multiselect('Select Tables:', table_list)
        # Initialize a pre-prompt message.
        pre_prompt = '''SQL tables with their properties and sample data:'''
        # Check if the button has been clicked before in the session.
        if "button_clicked" not in st.session_state:
            st.session_state.button_clicked = False
        # Define a callback function for the button click event.

        def callbacks():
            # Button was clicked
            st.session_state.button_clicked = True

        # Check if the "Load the files" button is clicked or the button was previously clicked.
        if (st.sidebar.button("Load the files", on_click=callbacks) or st.session_state.button_clicked):

            if selected_tables:

                # for i in range(len(selected_tables)):
                if len(selected_tables) == 1:

                    table = selected_tables[0].replace("'", "")
                    # SQL query to retrieve column names and data types for the selected table.
                    query_job2 = cursor.execute(f'''SELECT column_name, data_type
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE table_name = '{table}' ''')
                    # Fetch the results and create a DataFrame.
                    df2 = query_job2.fetchall()
                    df2 = [tuple(i) for i in df2]
                    column_df = pd.DataFrame(df2)
                    column_df.columns = [x[0] for x in query_job2.description]
                    # Display the table name and its column information in the sidebar.
                    with st.sidebar:
                        st.markdown(table)
                        st.dataframe(column_df, hide_index=True)
                    # Construct a string with the database, table, and column information.
                    # final_str = database+"."+table + \
                    #     str(tuple(column_df["column_name"]))
                    # final_str = final_str.replace("'", "")
                    # # Update the pre-prompt message with the table information.
                    # pre_prompt = pre_prompt+'''\n'''+final_str

            ############################################################
                # Create a form using Streamlit to handle user input.
                if 'insight_df' not in st.session_state:
                    st.session_state.insight_df = pd.DataFrame()
                
                with st.form("plot_form"):
                    # if number_of_tables == 1:

                    #     # plot dataframe
                    #     # Display a loading spinner while fetching data.
                    #     with st.spinner('Wait for it ...Fetching the data...'):
                    #        # Azure SQL query to retrieve a sample of 10 rows from the selected table.
                    #         five_rows_query = 'select top 10 * from ' + \
                    #             table + ' ORDER BY newid()'
                    #         # five_rows_query = 'select * from ' + \
                    #         #     table + ' TABLESAMPLE (20 ROWS)'

                    #         # SELECT column FROM table ORDER BY RAND ( ) LIMIT 10
                    #         # Execute the azure SQL query to fetch the data.
                    #         query_job_5_rows = cursor.execute(
                    #             five_rows_query)
                    #         # Fetch the results and create a DataFrame.
                    #         dataframe_five_rows = query_job_5_rows.fetchall()
                    #         dataframe_five_rows = [
                    #             tuple(i) for i in dataframe_five_rows]
                    #         dataframe_five_rows = pd.DataFrame(
                    #             dataframe_five_rows)
                    #         dataframe_five_rows.columns = [
                    #             x[0] for x in query_job_5_rows.description]
                    #         # Display the sampled data in a DataFrame on UI.
                    #         st.dataframe(dataframe_five_rows, height=220)
                    #         flag = True
                    # else:
                    #     flag = True


                    if True:

                        for table_idx, table in enumerate(selected_tables):
                            # print("selected tablesssss:", selected_tables)
                            table_query = f'SELECT column_name AS "column_name", data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(table_name) = LOWER(\'{table}\')'
                            column_df = pd.read_sql(table_query, conn)
                            five_rows_query = f'select top 5 * from {table}'
                            dataframe_five_rows = pd.read_sql(five_rows_query, conn)
                            # latest_date_in_table = f'select Max(Date) from msn_quin_demo'
                            # latest_date = pd.read_sql(latest_date_in_table, conn)
                            # print("LATEST DATEEEEEEEEEEEEEEEEEEEEEEEE", latest_date.loc[0])
                            user_prompt = " "
                            each_table = f"""

                            Table: {str(table_idx)}
                                Table name : {table}

                                Table properties: 
                                {column_df.to_csv(index=False)}

                                Sample records:
                                {dataframe_five_rows.to_csv(index=False)}
                                
                            -------------------
                            """

                            pre_prompt = pre_prompt + each_table
                            # Create a text input box for user question
                        print("PREEEEEEEEEEEEEEEEEEEEEEEE", pre_prompt)
                        question_prompt = st.text_input(
                            "Ask Question:", key="question_prompt")
                        # Use st.columns to create multiple columns for layout purposes
                        col1, col2, col3, col4 = st.columns(4)
                        # Use st.form_submit_button to create a button for generating insight
                        plot_submit = col1.form_submit_button(
                            "Generate Insights", on_click=callbacks)
                        # Create a checkbox for show the code functionality
                        show_code = col2.checkbox('Show the code')
                        # Create a checkbox for python code and plot
                        python_code = col3.checkbox('Show plot')
                        # Create a checkbox for explain the code functionality
                        explain_code = col4.checkbox('Explain the code')

                        sql_end = 0.0
                        sql_start = 0.0
                        sql_run_end = 0.0
                        sql_run_start = 0.0
                        df_save_end = 0.0
                        df_save_start = 0.0
                        py_insight = 0.0
                        py_plot = 0.0

                        if plot_submit:
                            # Use st.spinner to display a loading spinner while processing
                            with st.spinner('Wait for it...Generating the insight and plots...'):
                                # prompt to get sql query :instruction+column names + question + sample_rows
                                # GENERATE AN OPTIMIZED SQL QUERY. ENSURE THE GENERATED SQL QUERY FOLLOWS SQL BEST PRACTICES FOR OPTIMIZING PERFORMANCE ON LARGE DATASETS. THE GOAL IS TO MINIMIZE EXECUTION TIME WHILE RETRIEVING THE REQUIRED DATA.
                                sample_res = {'insight_name': "Name of insight here",
                                              'sql_query':'''Generated SQL Query here'''}
                                pre_prompt_gpt = f"""You are an expert in SQL query generation.

                                You are provided with USER QUERY:{question_prompt}. Your task is to generate insight and optimized SQL query.

                                GENERATE AN OPTIMIZED SQL QUERY THAT FOLLOWS SQL BEST PRACTICES FOR OPTIMIZING PERFORMANCE ON LARGE DATASETS. THE GOAL IS TO MINIMIZE EXECUTION TIME WHILE RETRIEVING THE REQUIRED DATA.

                                Consider below keyword instructions for better SQL queries if USER QUERY contains particular keyword:
                                1. Wo1W means week-on-week with LAG of 7 days.
                                2. Wo2W means week-on-week with LAG of 14 days.
                                3. Wo3W means week-on-week with LAG of 21 days.
                                4. Wo4W means week-on-week with LAG of 28 days.
                                5. Wo5W means week-on-week with LAG of 35 days.
                                6. Yo1Y means year-on-year with LAG of 365 days.
                                7. Yo2Y means year-on-year with LAG of 730 days.
                                8. Yo3Y means year-on-year with LAG of 1095 days.
                                9. T2D means trailing 2 days. You need to use last 2 days data.
                                10. T3D means trailing 3 days. You need to use last 3 days data.
                                11. T5D means trailing 5 days. You need to use last 5 days data.
                                12. T7D means trailing 7 days. You need to use last 7 days data.

                                For example: Wo1W revenue change or revenue drop for 08-08-2024 means total revenue of 08-08-2024 and total revenue of 01-08-2024. Only these two date revenue. DO NO INCLUDE WHOLE WEEK DATE in SQL query.
                                For example: Wo3W revenue change or revenue drop for 08-08-2024 means total revenue of 08-08-2024 and total revenue of 18-07-2024. Only these two date revenue. DO NO INCLUDE WHOLE WEEK DATE in SQL query.
                                **DO NOT USE BETWEEN CLAUSE FOR WoW**

                                For example: T2D Wo1W of 08-08-2024 means current week revenue will be combined revenue of 07-08-2024 and 08-08-2024 and previous 1 week revenue will be comnbined revenue of 31-07-2024 and 01-08-2024.
                                For example: T3D Wo2W of 08-08-2024 means current week revenue will be combined revenue of 06-08-2024, 07-08-2024 and 08-08-2024 and previous 2 week revenue will be revenue of 23-07-2024, 24-07-2024 and 25-07-2024.

                                **If Wo1W, Wo2W, Wo3W, Wo4W and Wo5W combined with previous year then first calculate WoW for current year using the week-on-week logic and then calculate WoW for previous year using the week-on-week logic.**
                                For example: Calculation of Wo1W revenue change of prior year and Wo1W revenue change of current year for 08-08-2024 means change in revenue of 08-08-2024 and revenue of 01-08-2024 will be Wo1W revenue change for current year and change in revenue of 08-08-2023 and revenue of 01-08-2023 will be Wo1W revenue change for prior year.
                                For example: Calculation of Wo2W revenue change of prior year and Wo2W revenue change of current year for 08-08-2024 means change in revenue of 08-08-2024 and revenue of 25-07-2024 will be Wo2W revenue change for current year and change in revenue of 08-08-2023 and revenue of 25-07-2023 will be Wo2W revenue change for prior year.

                                You are given with a SCHEMA which contains tables, their properties and sample data.

                                From the given Schema generate insight and SQL query based on the USER QUERY.
                                If the question is not relevant to the Schema provided give output as "Irrelevant question"
                                Give output in the form of dictionary where key will be the name of the insight and value will be the SQL query to fetch data from the Azure SQL database.
                                When multiple WoW mentioned in USER QUERY like (Wo1W, Wo2W, etc.) then generate single SQL query that can perform all mentioned calculation using single SQL query.
                                Insight is a one liner on what that SQL query data would represent
                                Make sure to always Use MSSQL - Azure SQL dialect when framing SQL query.
                                Use TOP instead of LIMIT.
                                Do not use any function to fetch the current date like GETDATE() or Current_Date.
                                Never use CAST() or CONVERT() function in SQL query, use datatypes as-it-is.
                                Date column having duplicate date values so need to apply GROUP BY accordingly. Generate a single query for the USER QUERY.
                                Give proper name to the column in the SQL query. If there is any space in column name then write column names like this [Page Type]. Give the query in triple quotes. Do NOT give google bigquery.

                                SCHEMA:

                                {pre_prompt}


                                Give response in the form of a dictionary.

                                Sample response(Strictly follow the sample response structure):

                                {str(sample_res)}


                                """
                                failure = True
                                while failure:
                                    try:
                                        sql_start = time.perf_counter()
                                        output_dic = insight(pre_prompt_gpt)
                                        sql_end = time.perf_counter()
                                        # output_dic will contain title of insight as key and value will be azure sql query to get relevant data based on question.
                                        if output_dic and isinstance(output_dic, dict):

                                            print(
                                                '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@DICTIONARY@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                                            print(output_dic)

                                            sql_run_start = time.perf_counter()
                                            # for k, v in output_dic.items():
                                            k = output_dic['insight_name']
                                            v = output_dic['sql_query']
                                            print(
                                                '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@VALUE@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                                            print(v)
                                            v = v.replace('quickinsight.', '')
                                            v = str(v).strip().lstrip("```sql").rstrip("```").strip()
                                            # execute azure sql query and srtore filtered dataframe in insight_df
                                            
                                            query_job = cursor.execute(v)

                                            insight_fetch = query_job.fetchall()
                                            insight_fetch = [
                                                tuple(i) for i in insight_fetch]

                                            insight_df = pd.DataFrame(
                                                insight_fetch)

                                            insight_df.columns = [
                                                x[0] for x in query_job.description]

                                            sql_run_end = time.perf_counter()

                                            print(
                                                '***********************************q_to_df***********************************')
                                            print(insight_df)
                                            df_save_start = time.perf_counter()
                                            st.session_state.insight_df = insight_df
                                            insight_df.to_csv('data.csv', index=False)
                                            df_save_end = time.perf_counter()
                                            failure = False
                                    except Exception as e:
                                        print("Error in SQL logic: ", e)
                                        continue
                                if not st.session_state.insight_df.empty:

                                    try:
                                        # display title of insight on UI
                                        st.markdown(
                                            f"### <u>**{(k).replace('_',' ').title()}**</u>", unsafe_allow_html=True)
                                        # if checked for Show the code
                                        if show_code:

                                            st.markdown(
                                                f"###### **{'SQL query to fetch relevant data'}**", unsafe_allow_html=True)
                                            st.code(
                                                v, language='sql')
                                        # if checked for explain the sql query
                                        if explain_code:
                                            # Create an expander to see explanation of the sql query
                                            with st.expander(f"###### **{'See code explaination'}**"):
                                                # definre prompt to get code explanation
                                                prompt = """Explain the following query : """+v
                                                # use GPT to get code explanation
                                                completion = openai.ChatCompletion.create(
                                                    engine="gpt-4o-05-13",
                                                    temperature=0,
                                                    max_tokens = 4000,
                                                    messages=[{'role': 'system', 'content': 'Your job is to explain the code '},
                                                                {"role": "user", "content": prompt}])

                                                output = completion["choices"][0]["message"]['content']
                                                # display explanation if clicked on expander
                                                st.write(output)
                                        # Call the helper_function insight_df_summary from insight_df_summary.py file to get natural language insight and python code for plot.
                                        py_insight, py_plot = insight_df_summary(
                                            k, insight_df, show_code, explain_code, question_prompt, python_code)
                                        
                                    # handle token limit errors
                                    except openai.error.InvalidRequestError as r:
                                        st.text(r)
                                        print(
                                            'Relevant data exceeded token limit')
                                        st.markdown(
                                            f"### **Relevant data exceeded token limit**", unsafe_allow_html=True)
                                    except Exception as e:
                                        st.text(e)
                                        print(
                                            'Something went wrong')
                                        st.markdown(
                                            f"### **Something went wrong**", unsafe_allow_html=True)
                                else:
                                    # if insight_df is empty: means no relevant data
                                    st.markdown(
                                        f"### **No data available relevent to this query**", unsafe_allow_html=True)
                                    print(
                                        '********************************EMPTY DATAFRAME************')
                        else:
                            pass

                    if not st.session_state.insight_df.empty: 
                        st.write("Time taken to generate SQL Query in seconds: ",round(sql_end-sql_start,2))
                        st.write("Time taken to execute SQL Query in seconds: ",round(sql_run_end-sql_run_start,2))
                        st.write("Time taken to save CSV file in seconds: ",round(df_save_end-df_save_start,2))
                        st.write("Time taken to generate insights and python code in seconds: ",py_insight)
                        st.write("Time taken to run python code to plot in seconds: ",py_plot)

                        
                        st.markdown(download_csv('data',st.session_state.insight_df),unsafe_allow_html=True)
            #################################################################
    cursor.close()
    conn.close()
    return True
