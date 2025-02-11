# Import the necessary Python libraries
import streamlit as st
import openai
import time
import matplotlib.pyplot as plt
import io

class PythonPlot:

    def __init__(self):
        pass

    def plot_to_base64(self, python_code):
        python_code = python_code.replace("plt.show()","")
        exec(python_code)
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plt.clf()
        return img.seek(0) 

    def python_plot(self, insight_title, df_insight, question_prompt, python_code):
        """
        Gives natural language insight and python code for better visualization of this insight.

        Args:
            insight_title (str): title of the insight.
            df_insight (dataframe): relevant filterd out database with respect to question.
            show_code (bool): Boolean value to see the python code.
            explain_code (bool): Boolean value to get the explanation of the code.
            question_prompt (str): question asked by user.
            python_code(bool): Boolean value to see the python plot.

        Returns:
            1.The natural language insights.
            2.Python code for plot

        """

        # define prompt to get the required output in expected format.
        if python_code:
            insight_python_start = time.perf_counter()
            prompt = """
            from following dataframe create textual summary. Textual summary should be short and crisp. Use bullet points if there are multiple insights.
        and give python code to generate most relevant type plot/chart using seaborn or matplotlib or pandas for better visualization of this data.
        The plot should look refined and professional.
        do not use scientific notations.convert axis range to Thousand, Million or Billion etc.
        Do NOT use list repetition while generating list elements instead write the entire list of elements which will be used for dataframe. For eg. Do NOT write like this [2015]*3. Rather write like this [2015, 2015, 2015] 
        If hues are present, color-coded legends must be included. Legend should not be overlapping on the graph. If there are more than 7 xticks, rotate them by 75 degree.
        Show values as well in the plot, so that it will be easier to read and understand.
        Do not overlap the plot/chart. enclose this python code in '{}'.
        If no plot is generated then {} will be empty.
        Results should contain textual summary and then python code in '{}'.
        For example"
        If textual summary and plot both then 
        textual summary  
        {
        import
        }"
        If there is only textual summary and no plot is generated then
        textual summary  
        {         

        }"
        The phrasing of the summary should consider the <"""+insight_title+""">.
        If the data is not provided or the provided dataframe is blank then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
        Give more weightage to the insight title than the question while generating summary and plot code.
        While generating python code for plot, consider dataframe but do not generate dataframe in the code instead read 'data.csv' file using pandas, because 'data.csv' contains the same dataframe.
        Insight Title: """+insight_title+"""
        Question: """+question_prompt+"""
        Data:
        """
            # Generate insights and python code using the OpenAI GPT-4 model.
            completion = openai.ChatCompletion.create(
                engine="gpt-4o-05-13",
                temperature=0,
                max_tokens = 4000,
                messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                        {"role": "user", "content": prompt+df_insight.to_csv(index=False)}])
            # Retrieve the generated insight and python code from the response.
            output = completion["choices"][0]["message"]['content']
            print('###################OUTPUT###################')
            print(output)

            # Extract the natural language insight present before the JSON-like dictionary structure.
            output_summary = output[:output.find('{')]
            print('###################OUTPUT_SUMMARY###################')
            print(output_summary)

            # Extract the Python code for generating plots from the output
            plot_code = output[output.find('import'):output.rfind('plt.show()')+11]
            plot_code = plot_code.replace("```python","").replace("```","")
            print('###################PLOT CODE###################')
            print(plot_code)

            return output_summary,plot_code
            
        else:
            insight_python_start = time.perf_counter()
            prompt = """
            from following dataframe create textual summary. Textual summary should be short and crisp. Use bullet points if there are multiple insights.
        Results should contain textual summary.
        The phrasing of the textual summary should consider the <"""+insight_title+""">.
        If the data is not provided or the provided data has no values then give output as <NO DATA AVAILABLE FOR GIVEN QUESTION.>
        Give more weightage to the insight title than the question while generating summary.
        Insight Title: """+insight_title+"""
        Question: """+question_prompt+"""
        Data:
        """
            # Generate insights and python code using the OpenAI GPT-4 model.
            completion = openai.ChatCompletion.create(
                engine="gpt-4o-05-13",
                temperature=0,
                max_tokens = 4000,
                messages=[{'role': 'system', 'content': 'You are a text summarizer '},
                        {"role": "user", "content": prompt+df_insight.to_csv(index=False)}])
            # Retrieve the generated insight and python code from the response.
            output = completion["choices"][0]["message"]['content']
            print(completion)
            # st.text(completion)
            # st.text(output)
            print('###################OUTPUT###################')
            print(output)

            insight_python_end = time.perf_counter()
            plot_code = 'None'

            return output,plot_code