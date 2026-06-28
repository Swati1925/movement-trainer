from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Movement Trainer backend is running"}