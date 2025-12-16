import requests

r = requests.get("http://127.0.0.1:8000/v1/username")


print(r.__dict__)
