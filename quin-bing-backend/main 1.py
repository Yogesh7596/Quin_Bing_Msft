# Import the necessary Python libraries
from insight_df_summary1 import PythonPlot
from insight1 import SQLQuery
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

# Load credentials
openai.api_type = os.getenv('api_type')
openai.api_base = os.getenv('api_base')
openai.api_version = os.getenv('api_version')
openai.api_key = os.getenv('api_key')
connection_string = os.getenv('connection_string')

# Establishing Azure SQL Database connection
conn = odbc.connect(connection_string)
cursor = conn.cursor()

# Create objects of SQL Query and Python plot
sq = SQLQuery()
pp = PythonPlot()

class Quin:

    def __init__(self, selected_tables, user_query):
        self.user_query = user_query

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

        print("Pre-prompt", pre_prompt)
        self.pre_prompt = pre_prompt
    
    def download_data(self, name,df):
        csv = df.to_csv(index=False)
        base = base64.b64encode(csv.encode()).decode()
        file = (f'<a href="data:file/csv;base64,{base}" download="%s.csv">Click here to Download data</a>' % (name))
    
        return file
    
    def prompt(self):

        sample_res = {'insight_name': "Name of insight here",
                        'sql_query':'''Generated SQL Query here'''}

        pre_prompt_gpt = f"""You are an expert in SQL query generation.

        You are provided with USER QUERY:{self.user_query}. Your task is to generate insight and optimized SQL query.

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
    
    def sql_query_generation(self):

        pre_prompt_gpt = self.prompt()

        failure = True
        while failure:
            try:
                output_dic = sq.sql_query(pre_prompt_gpt)

                if output_dic and isinstance(output_dic, dict):

                    print(
                        '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@DICTIONARY@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                    print(output_dic)

                    insight_name = output_dic['insight_name']
                    sql_query = output_dic['sql_query']
                    print(
                        '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@VALUE@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                    print(sql_query)

                    sql_query = sql_query.replace('quickinsight.', '')
                    sql_query = str(sql_query).strip().lstrip("```sql").rstrip("```").strip()

                    # execute azure sql query and srtore filtered dataframe in insight_df
                    query_job = cursor.execute(sql_query)

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
                    failure = False
            except Exception as e:
                print("Error in SQL logic: ", e)
                continue
        
        return insight_name,sql_query,insight_df
    
    def explain_code(self,code):

        prompt = """Explain the following query : """ + code

        try:

            # use GPT to get code explanation
            completion = openai.ChatCompletion.create(
                engine="gpt-4o-05-13",
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
    
    def plot_or_insight(self, insight_title, df_insight, python_code):

        insight, code = pp.python_plot(insight_title, df_insight, self.user_query, python_code)

        return insight, code
