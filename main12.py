# Import the necessary Python libraries
from insight_df_summary12 import PythonPlot
from insight12 import SQLQuery
import streamlit as st
import os
import pypyodbc as odbc
# import pyodbc
import pandas as pd
import time
import openai
import base64
import json
from dotenv import load_dotenv
load_dotenv("quin_azure.env")

# Load credentials
openai.api_type = os.getenv('api_type')
openai.api_base = os.getenv('api_base')
openai.api_version = os.getenv('api_version')
openai.api_key = os.getenv('api_key')

# openai.api_type = "azure"
# openai.api_base = "https://aipractices.openai.azure.com/"
# openai.api_version = "2023-12-01-preview"
# openai.api_key = "e5990e77abe04e74b6de34cdb4d1cce4"

# openai.api_type = "azure"
# openai.api_base = "https://msn-aoai.openai.azure.com/"
# openai.api_version = "2024-02-15-preview"
# openai.api_key = "e26afefcac8f4801b902627b4dcc3acf"
 

connection_string = os.getenv('connection_string')
# connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:quickazuredemo.database.windows.net,1433;Database=quickinsight;Uid=bhaskar;Pwd=Affine@123;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

# Establishing Azure SQL Database connection
conn = odbc.connect(connection_string)
cursor = conn.cursor()

# Create objects of SQL Query and Python plot
sq = SQLQuery()
pp = PythonPlot()

class Quin:

    def __init__(self):
        pass
    
    def download_data(self, name,df):
        csv = df.to_csv(index=False)
        base = base64.b64encode(csv.encode()).decode()
        file = (f'<a href="data:file/csv;base64,{base}" download="%s.csv">Click here to Download data</a>' % (name))
    
        return file
    
    def list_tables(self):
        table_query = """select t.name as table_name from sys.tables t order by table_name;"""
        # Execute the table query and fetch the results.
        query_job1 = cursor.execute(table_query)
        table_list = []
        for table in query_job1:
            table_list.append(table[0])
        
        return table_list
    
    def load_schemas(self, selected_tables):
        data_dict = {}
        tables_data = {}
        conn = odbc.connect(connection_string)
        cursor = conn.cursor()
        pre_prompt = '''SQL tables with their properties and sample data:'''
        for table_idx, table in enumerate(selected_tables):
            table_query = f'SELECT column_name AS "column_name", data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(table_name) = LOWER(\'{table}\')'
            column_df = pd.read_sql(table_query, conn)
            five_rows_query = f'select top 5 * from {table}'
            query_result = cursor.execute(five_rows_query)
            show_all_rows_query = cursor.execute(f'select * from {table}')
            data = show_all_rows_query.fetchall()
            data = [dict(zip([column[0] for column in cursor.description], row)) for row in data]
            tables_data[table] = data
            dataframe_five_rows = pd.read_sql(five_rows_query, conn)

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

            query_job2 = cursor.execute(f'''SELECT column_name, data_type
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE table_name = '{table}' ''')
            
            # Fetch the results and create a DataFrame.
            df2 = query_job2.fetchall()
            data = [dict(zip([column[0] for column in cursor.description], row)) for row in df2]
            data_dict[table] = data
            # df2 = [tuple(i) for i in df2]
            # column_df = pd.DataFrame(df2)
            # column_df.columns = [x[0] for x in query_job2.description]

            # data_dict = {}
            # # for table in tables_list:
            # # Assuming table names are valid SQL identifiers (no injection risk)
            # query = f"SELECT TOP 10 * FROM {table} ORDER BY newid();"
            # query_result = cursor.execute(query)
            # data = query_result.fetchall()
            # data = [dict(zip([column[0] for column in cursor.description], row)) for row in data]
            # data_dict[table] = data

        print("Pre-prompt", pre_prompt)
        self.pre_prompt = pre_prompt
        print("data dict", data_dict)
        print("tables_data", tables_data)
        return {"data": data_dict, "tables_data": tables_data}
    
    def prompt(self, user_query):

        sample_res = {'insight_name': "Name of insight here",
                        'sql_query':'''Generated SQL Query here'''}

        pre_prompt_gpt = f"""You are an expert in SQL query generation.

        You are provided with USER QUERY:{user_query}. Your task is to generate insight and optimized SQL query.

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

        {self.pre_prompt}


        Give response in the form of a dictionary.

        Sample response(Strictly follow the sample response structure):

        {str(sample_res)}


        """

        return pre_prompt_gpt
    
    def explain_code(self,code):

        prompt = """Explain the following query : """ + code

        try:

            # use GPT to get code explanation
            completion = openai.ChatCompletion.create(
                # engine="gpt-4o-05-13",
                engine="gpt-4o-msn",
                temperature=0,
                max_tokens = 4000,
                messages=[{'role': 'system', 'content': 'Your job is to explain the code '},
                            {"role": "user", "content": prompt}])

            output = completion["choices"][0]["message"]['content']

        except openai.error.InvalidRequestError as r:
            print(
                'Relevant data exceeded token limit\n', r)
            output = f'Due to error {r}, there is no code explanation'
            
        except Exception as e:
            print(
                'Something went wrong\n', e)
            output = f'Due to error {e}, there is no code explanation'

        return output
    
    def sql_query_generation(self, user_query, plot, explain_code,show_code):

        pre_prompt_gpt = self.prompt(user_query)

        failure = True
        sql_start = 0.0
        sql_end = 0.0
        sql_run_start = 0.0
        sql_run_end = 0.0
        insight_name = ""
        sql_query = ""
        insight_df = pd.DataFrame()
        csv_str = ""
        base64_plot = ""
        while failure:
            try:
                sql_start = time.perf_counter()
                print("preprompt gpt: ", pre_prompt_gpt)
                output_dic = sq.sql_query(pre_prompt_gpt)
                sql_end = time.perf_counter()
                print("line 214: ",output_dic)
                               
                if output_dic and isinstance(output_dic, dict):

                    print(
                        '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@DICTIONARY@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                    print(output_dic)

                    insight_name = output_dic['insight_name']
                    data = {"insight_name": insight_name}
                    # yield f"data: {json.dumps(data)}\n\n"
                    sql_query = output_dic['sql_query']
                    print(
                        '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@VALUE@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                    print(sql_query)

                    sql_query = sql_query.replace('quickinsight.', '')
                    sql_query = str(sql_query).strip().lstrip("```sql").rstrip("```").strip()
                    data = {"sql_query": sql_query}
                    # if show_code:
                    yield f"data: {json.dumps(data)}\n\n"
                    # else:
                    #     data = {"sql_query": ""}
                    #     yield f"data: {json.dumps(data)}\n\n"

                    sql_run_start = time.perf_counter()
                    # execute azure sql query and srtore filtered dataframe in insight_df
                    query_job = cursor.execute(sql_query)

                    sql_run_end = time.perf_counter()

                    insight_fetch = query_job.fetchall()
                    insight_fetch = [
                        tuple(i) for i in insight_fetch]

                    insight_df = pd.DataFrame(
                        insight_fetch)

                    insight_df.columns = [
                        x[0] for x in query_job.description]

                    print(
                        '***********************************q_to_df***********************************')
                    print(insight_df)

                    insight_df.to_csv('data.csv', index=False)
                    csv_str = insight_df.to_csv(index=False)
                    data = {"insight_fetch": csv_str}
                    yield f"data: {json.dumps(data)}\n\n"
                    failure = False
            except Exception as e:
                print("Error in SQL logic: ", e)
                # continue
                break
        
        time_taken_for_sql_query = round(sql_end - sql_start,2)
        # data = {"time_taken_for_sql_query": str(time_taken_for_sql_query)}
        # yield f"data: {json.dumps(data)}\n\n"
        time_taken_for_sql_execution = round(sql_run_end - sql_run_start,2)
        # data = {"time_taken_for_sql_execution": str(time_taken_for_sql_execution)}
        # yield f"data: {json.dumps(data)}\n\n"

        insight, code, time_taken_for_insights = pp.python_plot(insight_name, insight_df, user_query, plot)
        data = {"python_code": code}
        yield f"data: {json.dumps(data)}\n\n"        
        data = {"summary": insight}
        yield f"data: {json.dumps(data)}\n\n"
        # data = {"time_taken_for_insights": str(time_taken_for_insights)}
        # yield f"data: {json.dumps(data)}\n\n"
        if plot:
            base64_plot = pp.plot_to_base64(code)
            data = {"plot": base64_plot}
            yield f"data: {json.dumps(data)}\n\n"
        else:
            data = {"plot": ""}
            yield f"data: {json.dumps(data)}\n\n"
        if explain_code:

            explain_start = time.perf_counter()

            explained_sql_code = self.explain_code(sql_query)

          
            explained_python_code = self.explain_code(code)
            
            
            explain_end = time.perf_counter()

            time_taken_for_explain = round(explain_end-explain_start,2)
            print(type(insight_name))
            print(type(insight))
            print(type(sql_query))
            print(type(explained_sql_code))
            print(type(explained_python_code))
            print(type(time_taken_for_sql_query))
            print(type(time_taken_for_sql_execution))
            print(type(time_taken_for_insights))
            print(type(time_taken_for_explain))
            print(type(code))
            print(type(insight_fetch))

            print(csv_str)
        
        else:
            explained_sql_code = ""
            explained_python_code = ""
            time_taken_for_explain = 0.0
        data = {"sql_explanation": explained_sql_code}
        yield f"data: {json.dumps(data)}\n\n"
        data = {"python_explanation": explained_python_code}
        # yield f"data: {json.dumps(data)}\n\n"
        # data = {"time_taken_for_explain": str(time_taken_for_explain)}
        yield f"data: {json.dumps(data)}\n\n"

        # data = {"insight_name": insight_name, "insight": insight, "sql_query": sql_query, "explained_sql_code": explained_sql_code, "explained_python_code": explained_python_code, "time_taken_for_sql_query": str(time_taken_for_sql_query), "time_taken_for_sql_execution": str(time_taken_for_sql_execution), "time_taken_for_insights": str(time_taken_for_insights), "time_taken_for_explain": str(time_taken_for_explain), "code": code, "insight_fetch": csv_str, "base64_plot": base64_plot}
        # yield f"data: {json.dumps(data)}\n\n"
        # return insight_name, insight, sql_query, explained_sql_code, explained_python_code, time_taken_for_sql_query, time_taken_for_sql_execution, time_taken_for_insights, time_taken_for_explain, code

    def forecast_memo_query(self, user_query):
        try:
            conn = odbc.connect(connection_string)
            selected_tables = ['KPI_VTPF','RevenueVTPF']
            custom_prompt = '''SQL tables with their properties and data:'''
            df_dict = {}
            for table_idx, table in enumerate(selected_tables):
                # print("selected tablesssss:", selected_tables)
                table_query = f'SELECT column_name AS "column_name", data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(table_name) = LOWER(\'{table}\')'
                column_df = pd.read_sql(table_query, conn)
                five_rows_query = f'select * from {table}'
                dataframe_five_rows = pd.read_sql(five_rows_query, conn)
                df_dict[table] = dataframe_five_rows
                user_prompt = " "
                each_table = f"""

                Table: {str(table_idx)}
                    Table name : {table}

                    Table properties: 
                    {column_df.to_csv(index=False)}

                    Complete records:
                    {dataframe_five_rows.to_csv(index=False)}
                    
                -------------------
                """

                custom_prompt = custom_prompt + each_table

            print("PREEEEEEEEEEEEEEEEEEEEEEEE", custom_prompt)
            output_list = []
            for q in user_query.split('?,'):
                question = q.strip()
                if all(char in question.lower() for char in ("wow", "vtf", "emea")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: What is WoW VTF of Total of EMEA region for 2024-08-14?
                    SUMMARY: For EMEA PCT organic Core R7 VTPF, we observe an increase of +3.5pts (-2.3pts on 8/14 vs +1.2pts on 8/21) driven by the following contributors.
                    Here in example QUESTION user wants to know about WoW VTF of Total of EMEA region for 14th August 2024 of RevenueVTPF table.
                    And in SUMMARY we have 8/14 that means 14th August and 8/21 means 21st August, which is week-on-week with LAG of 7 days of 14th August.
                    -2.3pts is the value on 14th August and +1.2pts is the value on 21st August, so there is increase of +3.5pts(1.2-(-2.3)).
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    WoW means week-on-week with LAG of 7 days.
                    **MAINTAIN THE SAME FORMAT OF SUMMARY WITH VALUES FROM DATA PROVIDED BELOW. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(0,output)
                    time.sleep(3)

                elif all(char in question.lower() for char in ("wow", "srpvs", "forecast", "emea")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: Compare WoW of SRPVs values between current year, last year and forecast for EMEA in single sentence?
                    SUMMARY: -2.0pts: SRPVs saw an increase this year (+1.4% WoW) which is lesser than previous year (+5.6% WoW) but higher than the forecasted value (-0.6% WoW, chart1).
                    Here in example QUESTION user wants to compare values from KPI_VTPF table for SRPVs and EMEA.
                    And in SUMMARY we have -2.0pts ("-" sign in value because value in VTF Column of KPI_VTPF table is negative but if we have positive value then you need to use "+" sign in value) from VTF column, +1.4% from Cuurent_Year column, +5.6% from Last_Year column and -0.6% from Forecast column of KPI_VTPF table.
                    There must be chart1 mentioned in SUMMARY.
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    **MAINTAIN THE FORMAT OF SUMMARY. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(1,output)
                    time.sleep(3)
                
                elif all(char in question.lower() for char in ("rpm", "forecast", "emea")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: Compare current year, last year and forecast for EMEA region for RPM in single sentence?
                    SUMMARY: +1.5pts: RPM saw an increase this year (+2.0% WoW, supply driven) which is relatively higher than the forecasted value (+0.4% WoW, chart2).
                    Here in example QUESTION user wants to compare values from KPI_VTPF table for RPM and EMEA.
                    And in SUMMARY we have +1.5pts ("+" sign in value because value in VTF Column of KPI_VTPF table is positive but if we have negative value then you need to use "-" sign in value) from VTF column and RPM row, +2.0% from Cuurent_Year column and RPM row and +0.4% from Forecast column and RPM row of KPI_VTPF table.
                    In KPI_VTPF table, for EMEA region, Cuurent_Year RPM value is the sum of Cuurent_Year RPM S and RPM D values (+2.0 = 1.9+0.1). Among RPM S and RPM D, the greater contribution of RPM S that's why we have supply driven in SUMMARY. If we have greater contribution of RPM D and there must be demand driven instead of supply driven in the SUMMARY.
                    There must be chart2 mentioned in SUMMARY.
                    **Put focus on forecasted value and demand driven or supply driven. Double check these things before generating final SUMMARY.**
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    **MAINTAIN THE FORMAT OF SUMMARY. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(2,output)
                    time.sleep(3)

                elif all(char in question.lower() for char in ("wow", "vtf", "na")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: What is WoW VTF of Total of NA region for 2024-08-14?
                    SUMMARY: For NA PCT organic Core R7 VTPF, we observe a decrease of +1.1pts (+2.9pts on 8/14 vs +1.8pts on 8/21) driven by the following contributors.
                    Here in example QUESTION user wants to know about WoW VTF of Total of NA region for 14th August 2024.
                    And in SUMMARY we have 8/14 that means 14th August and 8/21 means 21st August, which is week-on-week with LAG of 7 days of 14th August.
                    +2.9pts is the value on 14th August and +1.8pts is the value on 21st August, so there is decrease of +1.1pts(1.8-2.9).
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    **MAINTAIN THE FORMAT OF SUMMARY. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(3,output)
                    time.sleep(3)

                elif all(char in question.lower() for char in ("wow", "srpvs", "forecast", "na")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: Compare WoW of SRPVs values between current year, last year and forecast for NA in single sentence?
                    SUMMARY: +3.6pts: SRPVs saw an increase this year (+2.5% WoW) which is higher than the previous year (+0.9% WoW) and slightly higher than the forecasted value (+2.1% WoW, chart3).
                    Here in example QUESTION user wants to compare values from KPI_VTPF table for SRPVs and NA.
                    And in SUMMARY we have +3.6pts ("+" sign in value because value in VTF Column of KPI_VTPF table is positive but if we have negative value then you need to use "-" sign in value) from VTF column, +2.5% from Cuurent_Year column, +0.9% from Last_Year column and +2.1% from Forecast column of KPI_VTPF table.
                    There must be chart3 mentioned in SUMMARY.
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    **MAINTAIN THE FORMAT OF SUMMARY. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+ custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(4,output)
                    time.sleep(3)

                elif all(char in question.lower() for char in ("rpm", "forecast", "na")):
                    prompt = """
                        from following two tables create textual summary based on QUESTION. Textual summary should be short and crisp. 
                    Results should contain textual summary.
                    Consider the given two tables and QUESTION then frame your SUMMARY accordingly.
                    Understand from below example and make sure to keep the same format of SUMMARY for particular QUESTION.
                    For example:
                    Sample data of Tables KPI_VTPF and RevenueVTPF.
                    Table: 0
                                                Table name : KPI_VTPF

                                                Table properties:
                                                column_name,data_type
                    Region,nvarchar
                    WoW,nvarchar
                    Cuurent_Year,nvarchar
                    Last_Year,nvarchar
                    Forecast,nvarchar
                    YoY,nvarchar
                    VTF,nvarchar


                                                    Complete records:
                                                    region,wow,cuurent_year,last_year,forecast,yoy,vtf
                    EMEA,SRPVs,1.40%,5.60%,-0.60%,-4.20%,-2.00%
                    EMEA,RPM,2.00%,-4.30%,0.40%,6.30%,+1.50%
                    EMEA,RPM S,1.90%,-2.60%,0.00%,4.50%,0.00%
                    EMEA,RPM D,0.10%,-1.70%,0.00%,1.80%,0.00%
                    EMEA,Resid,0.00%,-0.20%,0.00%,0.20%,0.00%
                    EMEA,Total,3.40%,1.10%,-0.20%,2.30%,0.00%
                    NA,SRPVs,2.50%,0.90%,2.10%,1.70%,+3.60%
                    NA,RPM,-1.30%,-1.90%,0.10%,0.60%,-0.60%
                    NA,RPM S,0.20%,-1.70%,0.00%,1.90%,-1.50%
                    NA,RPM D,-1.50%,-0.20%,0.00%,-1.30%,0.00%
                    NA,Resid,0.00%,0.00%,0.00%,0.00%,0.00%
                    NA,Total,1.20%,-1.10%,2.20%,2.20%,-1.00%


                                                -------------------


                                                Table: 1
                                                    Table name : RevenueVTPF

                                                    Table properties:
                                                    column_name,data_type
                    Region,nvarchar
                    Date,date
                    VTF,nvarchar


                                                    Complete records:
                                                    region,date,vtf
                    EMEA,2024-08-14,-2.30%
                    EMEA,2024-08-15,-1.80%
                    EMEA,2024-08-16,-1.50%
                    EMEA,2024-08-17,-1.00%
                    EMEA,2024-08-18,0.40%
                    EMEA,2024-08-19,0.70%
                    EMEA,2024-08-20,0.80%
                    EMEA,2024-08-21,1.20%
                    NA,2024-08-14,2.90%
                    NA,2024-08-15,2.80%
                    NA,2024-08-16,2.90%
                    NA,2024-08-17,3.30%
                    NA,2024-08-18,3.60%
                    NA,2024-08-19,3.50%
                    NA,2024-08-20,2.60%
                    NA,2024-08-21,1.80%


                                                -------------------
                    QUESTION: Compare current year, last year and forecast for NA region for RPM in single sentence?
                    SUMMARY: -0.6pts: RPM saw a decrease this year (-1.3% WoW, demand driven) which is quite less than the forecasted value (+0.1% WoW).
                    Here in example QUESTION user wants to compare values from KPI_VTPF table for RPM and NA.
                    And in SUMMARY we have -0.6pts ("-" sign in value because value in VTF Column of KPI_VTPF table is negative but if we have positive value then you need to use "+" sign in value) from VTF column and RPM row for NA region, -1.3% from Cuurent_Year column and RPM row and +0.1% from forecast column and RPM row of wow column and NA row of region column of KPI_VTPF table.
                    In KPI_VTPF table, for NA region, Cuurent_Year RPM value is the sum of Cuurent_Year RPM S and RPM D values (-1.3 = 0.2+(-1.5)). Among RPM S and RPM D, the greater contribution of RPM D that's why we have demand driven in SUMMARY. If we have greater contribution of RPM S and there must be supply driven instead of demand driven in the SUMMARY.
                    **Put focus on forecasted value(from forecast column) and demand driven or supply driven. Double check these things before generating final SUMMARY.**
                    If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
                    While generating textual SUMMARY for the QUESTION, first analyze the tables and then decide if there needs to be increase or decrease in sentence.
                    **CAREFULLY ANALYZE IF THE VALUE INDICATES AN INCREASE OR DECREASE, AND MENTION TERMS LIKE "INCREASE", "DECREASE", "HIGHER THAN", "LOWER THAN", "LESS THAN", "MORE THAN" APPROPRIATELY WHILE GENERATING THE SUMMARY.
                    **ENSURE YOU ARE MINDFUL OF "+" AND "-" SIGNS IN THE TABLE DATA WHILE GENERATING THE SUMMARY.**
                    **MAINTAIN THE FORMAT OF SUMMARY. ONLY GIVE SUMMARY IN THE OUTPUT. DO NOT GENERATE ANY EXPLANATION**
                    **UNDERSTAND FROM ABOVE EXAMPLE SAMPLE DATA AND EXAMPLE SUMMARY AND GENERATE FINAL SUMMARY FOR ACTUAL DATA PROVIDED BELOW**
                    Before generating the final SUMMARY, ensure that SUMMARY should adhere to the following guidelines:
                    - Maintain accuracy: Ensure that any comparison between values (like percentages) reflects the correct logical relationship (e.g., an increase should not be described as "less than" a decrease).
                    - Clarity: Rephrase sentences if needed to make the comparison or statement clear and unambiguous. Avoid vague terms or inconsistent descriptions.
                    - Context Awareness: Consider all given context (like forecasts and actual values) and reflect that accurately in your response.
                    QUESTION: """+question+"""
                    DATA:
                    """
                    completion = openai.ChatCompletion.create(
                        engine="gpt-4o-msn",
                        temperature=0,
                        max_tokens = 4000,
                        messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                                {"role": "user", "content": prompt+ custom_prompt}])
                    # Retrieve the generated insight and python code from the response.
                    output = completion["choices"][0]["message"]['content']
                    # print(completion)
                    # print(output)
                    if 'SUMMARY' in output:
                        output = output[output.find('SUMMARY')+9:]
                    else:
                        output = output
                    
                    output_list.insert(5,output)
                    time.sleep(3)

            print(output_list)
            final_output = ""
            for i,o in enumerate(output_list):
                if i == 2:
                    final_output += o + '\n\n'
                else:
                    final_output += o + '\n'

            data = {"summary": final_output}
            yield f"data: {json.dumps(data)}\n\n"
        except Exception as e:
            print("Error in SQL logic: ", e)
            data = {"summary": e}
            yield f"data: {json.dumps(data)}\n\n"
            
