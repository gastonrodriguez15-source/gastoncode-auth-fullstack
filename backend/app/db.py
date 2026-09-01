from tinydb import TinyDB


db = TinyDB("db.json")

users = db.table("users")
reset_tokens = db.table("reset_tokens")