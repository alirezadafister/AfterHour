import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

database_url = os.getenv("DATABASE_URL")
print("Using:", database_url)

conn = psycopg2.connect(database_url)
cursor = conn.cursor()
cursor.execute("SELECT title FROM events;")
rows = cursor.fetchall()

print("Connected successfully. Events found:")
for row in rows:
    print("-", row[0])

cursor.close()
conn.close()