from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
import io
from main12 import *
import matplotlib.pyplot as plt

from dotenv import load_dotenv
load_dotenv("quin_azure.env")

# Load credentials
admin_id = os.getenv('id')
admin_password = os.getenv('password')


app = FastAPI()

# Allow CORS for your React frontend
origins = [
    "*",  # React app running locally
    "https://quin.generax.ai" # Add other origins here if needed
]
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specified origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)
 

quin_obj = Quin()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/login")
async def login(id: str, password: str):
    if id == admin_id & password == admin_password:
        return {"message": "Login success"}

@app.get("/get_db_names")
async def db_connection_and_get_db_names():
    return {"databases": ["quickinsight"]}

@app.get("/get_table_names")
async def get_table_names():
    try:
        table_list = []
        table_list = quin_obj.list_tables()
    except Exception as e:
        print(
            'Something went wrong\n', e)
        return {"data": [], "message": f'Internal Server Error: {e}'}
    return {"message": "success", "tables": table_list}

@app.post("/get_table_schema")
async def get_table_schema(request: Request):
    data = {}
    try:
        body_data = await request.json()
        tables = body_data.get("tables")
        if tables:
            data = quin_obj.load_schemas(tables)
        else:
            return {"data": {}, "message": "Invalid tables list input"}
    except Exception as e:
        print(
            'Something went wrong\n', e)
        return {"data": {}, "message": f'Internal Server Error: {e}'}
    return {"data": data}

@app.post("/generate_insights")
async def generate_insights(request: Request):
    try:
        data = await request.json()
        user_query = data.get("user_query")
        is_plot = data.get("is_plot")
        explain_code = data.get("explain_code")
        show_code = data.get("show_code")
        if user_query:
            return StreamingResponse(content=quin_obj.sql_query_generation(user_query, is_plot, explain_code,show_code), media_type="text/event-stream")
        else:
            return {"data": {}, "message": "Invalid user_query input"}
    except Exception as e:
        print(
            'Something went wrong\n', e)
        return {"data": {}, "message": f'Internal Server Error: {e}'}
    # return {"message": "Hello World"}

@app.post("/download_data")
async def download_data(request: Request):
    file = ""
    try:
        body_data = await request.json()
        name = "data"
        df = body_data.get("df")
        # print("line 61: ", df)
        # insight_df = pd.DataFrame(df)
        if df:
            insight_df = pd.read_csv(io.StringIO(df))
            file = quin_obj.download_data(name, insight_df)
        else:
            return {"data": {}, "message": "Invalid df input"}
    except Exception as e:
        print(
            'Something went wrong\n', e)
        return {"data": "", "message": f'Internal Server Error: {e}'}
    return {"data": file}

@app.post("/plot")
async def generate_plot(request: Request):
    # Remove plt.show() if present    
    try: 
        body_data = await request.json()
        python_code = body_data.get("python_code")
        if python_code:
            python_code = python_code.replace("plt.show()", "")

            # Execute the Python code to generate the plot
            exec(python_code)

            # Save the plot to a BytesIO object   
            img = io.BytesIO()
            plt.savefig(img, format='png')
            img.seek(0)

            # Clear the plot to avoid overlapping
            plt.clf()

            # Return the image as a PNG response
            return Response(content=img.getvalue(), media_type="image/png")
        else:
            return {"data": {}, "message": "Invalid python_code input"}
    except Exception as e:
        print(
            'Something went wrong\n', e)
        return {"data": "", "message": f'Internal Server Error: {e}'}