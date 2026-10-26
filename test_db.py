import getpass
import psycopg

host = "app-postgresql-pwj6w.apps.teh2.abrhapaas.com"

password = getpass.getpass("Database password: ")

try:
    with psycopg.connect(
        host=host,
        port=31009,
        dbname="padbushehr",
        user="client",
        password=password,
        sslmode="disable",
        connect_timeout=8,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), version()")
            database, version = cur.fetchone()

            print("CONNECTION SUCCESSFUL")
            print("Database:", database)
            print("PostgreSQL:", version.split(",")[0])

except Exception as e:
    print("CONNECTION FAILED")
    print(type(e).__name__ + ":", e)