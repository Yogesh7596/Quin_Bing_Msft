# Import the necessary Python libraries
from insight_df_summary12 import PythonPlot
from insight12 import SQLQuery
import streamlit as st
import os
import pypyodbc as odbc
import pyodbc
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
        pre_prompt = '''SQL tables with their properties and sample data:'''
        for table_idx, table in enumerate(selected_tables):
            table_query = f'SELECT column_name AS "column_name", data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(table_name) = LOWER(\'{table}\')'
            column_df = pd.read_sql(table_query, conn)
            five_rows_query = f'select top 5 * from {table}'
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
        return {"data": data_dict}
    
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
        data = {"time_taken_for_sql_query": str(time_taken_for_sql_query)}
        yield f"data: {json.dumps(data)}\n\n"
        time_taken_for_sql_execution = round(sql_run_end - sql_run_start,2)
        data = {"time_taken_for_sql_execution": str(time_taken_for_sql_execution)}
        yield f"data: {json.dumps(data)}\n\n"

        insight, code, time_taken_for_insights = pp.python_plot(insight_name, insight_df, user_query, plot)
        data = {"python_code": code}
        yield f"data: {json.dumps(data)}\n\n"        
        data = {"summary": insight}
        yield f"data: {json.dumps(data)}\n\n"
        data = {"time_taken_for_insights": str(time_taken_for_insights)}
        yield f"data: {json.dumps(data)}\n\n"
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
        yield f"data: {json.dumps(data)}\n\n"
        data = {"time_taken_for_explain": str(time_taken_for_explain)}
        yield f"data: {json.dumps(data)}\n\n"

        # data = {"insight_name": insight_name, "insight": insight, "sql_query": sql_query, "explained_sql_code": explained_sql_code, "explained_python_code": explained_python_code, "time_taken_for_sql_query": str(time_taken_for_sql_query), "time_taken_for_sql_execution": str(time_taken_for_sql_execution), "time_taken_for_insights": str(time_taken_for_insights), "time_taken_for_explain": str(time_taken_for_explain), "code": code, "insight_fetch": csv_str, "base64_plot": base64_plot}
        # yield f"data: {json.dumps(data)}\n\n"
        # return insight_name, insight, sql_query, explained_sql_code, explained_python_code, time_taken_for_sql_query, time_taken_for_sql_execution, time_taken_for_insights, time_taken_for_explain, code
