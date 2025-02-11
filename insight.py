import ast
import openai
import streamlit as st

class SQLQuery:

    def __init__(self):
        pass

    def sql_query(self,pre_prompt_gpt):
        """
        This function is called from main function to get the sql query.
        Generates the sql query to get releveant data with respect to question.

        Args:
            pre_prompt_gpt (string): prompt for GPT model.

        Returns:
            dict: The dictionary containing title of insight as key and sql query as values
        """
        # add instruction in the prompt
        prompt = pre_prompt_gpt+"""output example
            if question is relevant to the table then output:
            {'insight_name': "Name of insight here", 'sql_query': '''Generated SQL Query here'''}
            if question is not relevant to the table then output:
            "1.No data found
            2.Irrelevant question"

            """
        
        # Generate sql query using the OpenAI GPT-4o model.
        completion = openai.ChatCompletion.create(
            engine="gpt-4o-05-13",
            temperature=0,
            max_tokens = 4000,
            messages=[{'role': 'system', 'content': 'You are a business analytics insight generater'},
                        {"role": "user", "content": prompt}])
        
        # Retrieve the generated sql query from the response.
        output = completion["choices"][0]["message"]['content']

        print(
            '#####################insight_output####################################')
        print(output)

        # Check if the generated output contains a JSON-like dictionary structure.
        if output.find('{') != -1:
            # Extract the dictionary structure from the output.
            output_dict_str = output[output.find('{'):output.rfind('}')+1]
            # Parse the dictionary string into a Python dictionary.
            output_dic = ast.literal_eval(output_dict_str)
            print("output_dic:  ", output_dic)
            print("type: ", type(output_dic))
            # Return the parsed dictionary as the result.
            return output_dic
        else:
            # If the output is not in a dictionary format, display it as a Markdown message.
            print("Didn't get { in SQL query generation response\n",output)
            return {}