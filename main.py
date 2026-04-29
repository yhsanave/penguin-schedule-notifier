from fastapi import FastAPI
from pydantic import BaseModel
import requests


class Message(BaseModel):
    content: str
    webhookURL: str


app = FastAPI()


@app.post('/')
def forward(message: Message):
    res = requests.post(
        url=message.webhookURL,
        data=message.content,
        headers={
            'Content-Type': 'application/json'
        }
    )
    return res
