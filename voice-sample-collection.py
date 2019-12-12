from starlette.applications import Starlette
from starlette.responses import JSONResponse, HTMLResponse, RedirectResponse, PlainTextResponse
from starlette.templating import Jinja2Templates
from starlette.staticfiles import StaticFiles
from pathlib import Path
from io import BytesIO
from b2sdk.v1 import *
import sys
import uvicorn
import aiohttp
import aiofiles
import asyncio
import os
import io
import uuid

async def get_bytes(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.read()

page = { 'title': "Accent Recognition - Voice Sample Collection" }

templates = Jinja2Templates(directory='templates')

app = Starlette(debug=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.route("/submit", methods=["POST"])
async def submit(request):
    data = await request.form()
    contents = await data["sampleFile"].read()
    id = str(uuid.uuid4())
    b2_upload(data["nativelang"]+"_"+data["country"]+"_"+id, contents)
    return JSONResponse({"id": id})

def b2_upload(filename, data):
    filepath = "/tmp/"+filename
    with open(filepath, 'wb') as sampleFile:
        sampleFile.write(data)
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    application_key_id = os.environ['b2_app_key_id']
    application_key = os.environ['b2_app_key']
    b2_api.authorize_account("production", application_key_id, application_key)
    bucket = b2_api.get_bucket_by_name("voice-samples")
    bucket.upload_local_file(filepath, filename)
    os.remove(filepath)

@app.route("/")
def form(request):
    return templates.TemplateResponse('index.html', {'request': request})

@app.route("/record")
def form(request):
    return templates.TemplateResponse('record.html', {'request': request})

@app.route("/form")
def redirect_to_homepage(request):
    return RedirectResponse("/")

if __name__ == "__main__":
    uvicorn.run("voice-sample-collection:app", host="127.0.0.1", port=8000)
