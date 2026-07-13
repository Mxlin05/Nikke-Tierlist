import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

#pkill -f scrape.py
#pkill chrome
#216 should be the length of release_history asa of 5/30

script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
env_path = os.path.join(parent_dir, ".env")
load_dotenv(env_path)

DB_NAME = os.getenv("DB_NAME", "nikke_db")

db_info = {
    'host': os.getenv("DB_HOST", "localhost"),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD")
}

def init_database(): 
    """
    output: connection to sql database/or none
    function: connects to the mysql server, creates database and tables if they don't exist
    
    Overview of databases:
    characters ----- release_history
    treasures
    users ----- tierrows
    """

    try: 
        connection = mysql.connector.connect(**db_info) #create mysql connection
        if connection.is_connected(): 
            cursor = connection.cursor()

            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}") #create the database
            print(f"Database: {DB_NAME} checked/created successfully")

            cursor.execute(f"USE {DB_NAME}")
            #all characters
            create_table_query = """ 
            CREATE TABLE IF NOT EXISTS characters(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                rarity VARCHAR(50),
                class VARCHAR(50),
                weapon VARCHAR(50),
                manufacturer VARCHAR(50),
                element VARCHAR(50),
                burst VARCHAR(10),
                normal_attack TEXT,
                skill_1 TEXT,
                skill_2 TEXT,
                burst_skill TEXT,
                treasure INT,
                overspec INT
            )
            """ #make the required table

            cursor.execute(create_table_query)
            print("Table 'characters' checked/created successfully")
            #if characters have a treasure, they will have a separate entry here
            create_table_query = """
            CREATE TABLE IF NOT EXISTS treasures(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                rarity VARCHAR(50),
                class VARCHAR(50),
                weapon VARCHAR(50),
                manufacturer VARCHAR(50),
                element VARCHAR(50),
                burst VARCHAR(10),
                normal_attack TEXT,
                skill_1 TEXT,
                skill_2 TEXT,
                burst_skill TEXT,
                treasure INT,
                overspec INT
            )
            """

            cursor.execute(create_table_query)
            print("Table 'treasures' checked/created successfully")
            #all characters banner periods, if they didn't have a banner default is the game's release date
            create_table_query = """
            CREATE TABLE IF NOT EXISTS release_history(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                start_date DATETIME,
                end_date DATETIME,
                FOREIGN KEY (name) REFERENCES characters(name) ON DELETE CASCADE
            )
            """

            cursor.execute(create_table_query)
            print("Table 'release_history' checked/created successfully")
            #users table, maybe move password up to varchar(255)
            create_table_query = """
            CREATE TABLE IF NOT EXISTS users(
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) 
            )
            """

            cursor.execute(create_table_query)
            print("Table 'users' checked/created successfully")

            #tierlist nodes tables. Head nodes have all unranked nikkes by the user, all other nodes are ranks made by the player
            create_table_query = """
            CREATE TABLE IF NOT EXISTS tierrows(
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                tier_title VARCHAR(50),
                layer_title VARCHAR(50),
                description TEXT,
                sort_order INT NOT NULL, 
                isUnranked BOOLEAN DEFAULT FALSE,
                nikkes JSON,
                FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
            )
            """
            
            cursor.execute(create_table_query)
            print("Table 'tierrows' checked/created successfully")

        return connection
    except Error as e: 
        print(f"Error in initializing database: {e}")
        return None
    

def add_characters(connection, char_data, table_name="characters"):
    """
    input: mysql connection, char_data dictionary 
    output: t/f
    function: takes the connection, and character dictionary and adds it to the database table
    """           

    if not connection or not char_data: 
        return False
   
    try: 
        cursor = connection.cursor() #mysql connection
        insert_query = f"""
        INSERT IGNORE INTO {table_name}
        (name, rarity, class, weapon, manufacturer, element, burst, normal_attack, skill_1, skill_2, burst_skill, treasure, overspec)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """ 

        values = (
            char_data.get('name'),
            char_data.get('rarity'),
            char_data.get('class'),
            char_data.get('weapon'),
            char_data.get('manufacturer'),
            char_data.get('element'),
            char_data.get('burst'),
            char_data.get('normal_attack'),
            char_data.get('skill_1'),
            char_data.get('skill_2'),
            char_data.get('burst_skill'),
            char_data.get('treasure'),
            char_data.get('overspec')
        )
        cursor.execute(insert_query, values)
        connection.commit()

        if cursor.rowcount > 0:
            print(f"[{char_data.get('name')}] successfully saved to database.")
        else:
            print(f"[{char_data.get('name')}] already exists in database. Skipped.")

        return True
    except Error as e: 
        print(f"failed in inserting character into table: {char_data['name']} - {e}")
        return False

def add_banner(connection, date_data, table_name="release_history"):
    """
    input: mysql connection, date_data dictionary 
    output: t/f
    function: takes the connection, and date dictionary and adds it to the database table
    """

    if not connection or not date_data:
        return False
    
    try:
        cursor = connection.cursor()
        insert_query = f"""
        INSERT IGNORE INTO {table_name}
        (name, start_date, end_date)
        VALUES (%s, %s, %s)
        """ #insert query

        values = (
            date_data.get('name'),
            date_data.get('start_date'),
            date_data.get('end_date')
        )

        cursor.execute(insert_query,values)
        connection.commit()

        if cursor.rowcount > 0:
            print(f"[{date_data.get('name')}] successfully saved to database.")
        else:
            print(f"[{date_data.get('name')}] already exists in database. Skipped.")

        return True
    except Error as e:
        print(f"Failed to add {date_data['name']}'s banner period to the database - {e}")
        return False

def query_character_exists(connection, nikke_name): 
    """
    input: mysql connection, Nikke character name
    output: T/F
    function: checks to see if a specific nikke is already in the database.
    """

    if not connection:
        return False

    try: 
        cursor = connection.cursor()
        query = "SELECT name FROM characters WHERE name = %s" #try to find the existing nikke
        values = (nikke_name,) #valid tuple as entry into sql query

        cursor.execute(query, values) #run the sql command
        result = cursor.fetchone() #fetch the data from the query you just executed. If there is something a character exists. 

        if result: 
            print(f"{nikke_name} is already in the database. Do not scrape")
            return True
        else:
            return False
    except Error as e: 
        print(f"Error in querying for character existence {nikke_name} : {e}")
        return False