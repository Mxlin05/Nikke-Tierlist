from playwright.sync_api import sync_playwright
from db import init_database, add_characters, query_character_exists, add_banner
from datetime import datetime
import time
import re
import os

temp_duplicates = []

def extract_burst_type(srcset, char_data, name): 
    """
    arg: alt string, which is the burst type image used on prydwen
    output: no output, inplace modification of char_data
    function: takes the alt text that corresponds to a specific burst type, and extract whether it is type1,2,3,all, and assign it the "burst" key in dicationary
    """

    if not srcset: #if the scraping returns None 
        char_data['burst'] = None
        print(f"{name} failed burst type scraping, webscraper failed")
        return

    match = re.search(r'Type (\d|all)',srcset) #check for type_#, and capture the number or "all"

    if match: 
        result = match.group(1) #grab the first capture group, which should be the number
        if result.isdigit(): 
            char_data['burst'] = int(result)
        else: 
            char_data['burst'] = result
        print(f"{name} burst type scraped")
    else: 
        print(f"{name} failed burst type scraping, no match")
        char_data['burst'] = None

def extract_base_info(char_intro, char_data, name): 
    """
    input: character intro string text, and memory address of the char_data dictionary
    output: no output, char_data should be modified inplace
    function: take the introduction of each character and extract rarity, class, weapon, element, and manufacturer
    """
    
    if not char_intro: #if the web scraper returns None
        char_data['rarity'] = None
        char_data['class'] = None
        char_data['weapon'] = None
        char_data['manufacturer'] = None
        char_data['element'] = None
        print(f"{name} base info web scrape failed")
        return

    #regular expression match for rarity, class, weapon, manufacturer
    rarity_match = re.search(r'(SSR|SR|R)', char_intro)
    class_match = re.search(r'(Supporter|Defender|Attacker)', char_intro)
    weapon_match = re.search(r'(Assault Rifle|Minigun|Rocket Launcher|Shotgun|SMG|Sniper Rifle|Machine Gun)', char_intro)
    element_match = re.search(r'(Iron|Water|Wind|Electric|Fire)', char_intro)
    manufacturer_match = re.search(r'(Elysion|Missilis|Tetra|Pilgrim|Abnormal)', char_intro)
    #properly set the key value in dictionary
    if rarity_match: 
        char_data['rarity'] = rarity_match.group(1)
        print(f"{name} rarity matched")
    else: 
        char_data['rarity'] = None
        print(f"{name} rarity not matched")
    
    if class_match: 
        char_data['class'] = class_match.group(1)
        print(f"{name} class matched")
    else: 
        char_data['class'] = None
        print(f"{name} class not matched")
    
    if weapon_match: 
        char_data['weapon'] = weapon_match.group(1)
        print(f"{name} weapon matched")
    else: 
        char_data['weapon'] = None
        print(f"{name} weapon not matched")
    
    if manufacturer_match:
        char_data['manufacturer'] = manufacturer_match.group(1)
        print(f"{name} manufacturer matched")
    else: 
        char_data['manufacturer'] = None
        print(f"{name} manufacturer not matched")
    
    if element_match: 
        char_data['element'] = element_match.group(1)
        print(f"{name} element matched")
    else: 
        char_data['element'] = None
        print(f"{name} element not matched")

def extract_skills(kit_block, char_data, name): 
    """
    input: kitblock is 3 skills and normal attack, char_data is the dictionary we store everything in, name of character
    output: no output, inplace modification of char_data
    function: takes the scraped 4 blocks of normal attack and 3 skills, extracts and assigns it the right key in the dictionary  
    """

    if len(kit_block) >= 1 : 
        char_data['normal_attack'] = kit_block[0].inner_text().strip()
        print(f"{name} normal attack scraped")  
    else: 
        print(f'{name} fail normal attack scraping')
        char_data['normal_attack'] = None
    
    if len(kit_block) >= 2:
        char_data['skill_1'] = kit_block[1].inner_text().strip()
        print(f"{name} skill 1 scraped") 
    else: 
        print(f'{name} fail skill 1 scraping')
        char_data['skill_1'] = None

    if len(kit_block) >= 3: 
        char_data['skill_2'] = kit_block[2].inner_text().strip()
        print(f"{name} skill 2 scraped")  
    else:
        print(f'{name} fail skill 2 scraping')
        char_data['skill_2'] = None

    if len(kit_block) >= 4:
        char_data['burst_skill'] = kit_block[3].inner_text().strip()
        print(f"{name} burst skill scraped") 
    else: 
        print(f'{name} fail burst_skill scraping')
        char_data['burst_skill'] = None

def scrape_character(char_data, name): 
    """
    arg: char_data dictionary to fill up with nikke information, name domain name for prydwen, 
    output: dictionary of Nikke character descriptions. eg Name: Siren, Class: supporter, weapon; SMG, Element: wind
    function: takes the name of a single nikke, scrapes prydwen for their descriptions and returns it to the called function to be stored into the database. 
    """

    url = f"https://www.prydwen.gg/nikke/characters/{name}"
    print(f"Scraping: {url}")
    with sync_playwright() as p: #boot playwright up and have it run atomically
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--proxy-server='direct://'",  #wsl will connect directly to website 
                "--proxy-bypass-list=*", #bypass all proxy rules on all websites
                "--disable-features=AsyncDns", #disable wsl dns resolution and use the google resolution
                "--disable-ipv6" #disable ipv6 cause its ass apparently 
            ]
        ) #creates a dummy chrome browser,
        print(f"Created dummy browser")
        try: 
            mask = browser.new_context( #creates a mask to pretend to be an actual chrome user
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US"
            )
            page = mask.new_page() #ctrl + t
            time.sleep(1)
            page.goto(url) #go to prydwen
            # print("ran after url")
            page.wait_for_selector(".combined") #wait for the page to load

            try: 
                intro_block = page.locator(".combined") #find the combined div
                char_intro = intro_block.inner_text().strip() #grab text character stats
                extract_base_info(char_intro, char_data, name)
                
                burst_source_img = intro_block.locator("img[alt*='Type']").first #grab the image source that says type 1 type 2 type 3
                # print(f"was able to grab the burst {burst_source_img}")
                alt = burst_source_img.get_attribute("alt")
                # print(f"grabbed srcset {srcset}")
                extract_burst_type(alt, char_data, name) #extract burst type

                kit_block = page.locator(".skills .grid > div").all() #find the div with skills as the class, and add it to the dictionary 
                extract_skills(kit_block, char_data, name)
            except Exception as e: 
                print(f"Error in scraping data for {name}. Error is {e}")
                char_data = False
        except Exception as e: 
             print(f"Error in setting up chromium and going to prydwen, Error is {e}")
             char_data = False
        finally: 
            browser.close()
        return char_data

def create_character_link(line): 
    """
    input: line formatted always as {name}, {if treasure}, {if overspec}, {if custom-link}
    output: custom-link name used to scrape prydwen
    function: takes the character line from character_list and returns the name needed to attach to prydwen's link. 
    diesel: winter sweets -> diesel-winter-sweets
    """
    line_broken = [part.strip().lower() for part in line.split(",")] #split the character line by , and clean it up
    
    if len(line_broken) > 1: 
        for x in line_broken[1:]:#looks for a potential custom domain name that can't be put together
            if x not in ['overspec','treasure']: 
                return x
            
    name = line_broken[0]        
    name = name.replace(":","") #remove the :
    name = re.sub(r'[ .,`\[\]\(\)\']+', '-', name) #replaces any spaces, periods, commas, backticks, apostrophes, or brackets with a hyphen. '+' ensures that if there is a comma AND a space, it becomes one hyphen

    return name.strip('-')

def check_overspec_treasure(char_data, line):
    """
    input: char_data, nikke's dicionary of its kit, line formatted always as {name}, {if treasure}, {if overspec}, {if custom-link}
    output: nothing, in-place changes
    function: parses line to see if there is a treasure or overspec indicator and update char_data accordingly
    """

    line_broken = [part.strip().lower() for part in line.split(",")] #split the character line by , and clean it up

    if 'overspec' in line_broken: #check overspec
        char_data['overspec'] = 1
    else:
        char_data['overspec'] = 0

    if 'treasure' in line_broken: #check treasure
        char_data['treasure'] = 1
    else:
        char_data['treasure'] = 0

    return

def create_treasure_link(line):
    """
    input: line formatted always as {name}, {if treasure}, {if overspec}, {if custom-link}
    output: custom-link name used to scrape prydwen
    function: takes the character line from character_list and returns the name needed to attach to prydwen's link. FOR TREASURE CHARACTERS 
    moran -> moran-treasure
    """
    line_broken = [part.strip().lower() for part in line.split(",")] #split the character line by , and clean it up
    
    if len(line_broken) > 1: 
        for x in line_broken[1:]:#looks for a potential custom domain name that can't be put together
            if x not in ['overspec','treasure']: 
                return x + "-treasure"
            
    name = line_broken[0]        
    name = name.replace(":","") #remove the :
    name = re.sub(r'[ .,`\[\]\']+','-',name) #replaces any spaces, periods, commas, backticks, apostrophes, or brackets with a hyphen. '+' ensures that if there is a comma AND a space, it becomes one hyphen
    name = name.strip('-')
    name = name + "-treasure"
    return name

def banner_scraper_helper(block, period_book):
    """
    input: banner group block either live or historical, period_book is a dictionary of nikke's start and end banner periods
    output: t/f, inplace places to period_book
    function: takes the block of banners, iterates through all banner groups (time periods), iterates through all individual banners, and store all nikke's found start and end banner periods
    """
    banner_group = block.locator(".banner-group").all() #grabs all the individual banner groups

    for group in banner_group:
        character_lists = group.locator(".banner-list a").all() #for each banner group, grab all the characters within each banner group
        for character in character_lists:
            name_locator = character.locator(".name-tags-row h3") #read the name of the character being featured
            if name_locator.count() > 0: 
                name = name_locator.inner_text().strip().title()
                raw_date = character.locator(".banner-date-info").inner_text().strip() #grab the period that this banner was available for
                print(f"\n{name}'s banner")
                print(f"raw date: {raw_date}")

                try: 
                    start_time,end_time = raw_date.split(" - ") #APR 25, 2024 - MAY 15, 2024 split this format into 2 parts
                    start_time = datetime.strptime(start_time.strip(), "%b %d, %Y") #convert them into datetime python objects
                    end_time = datetime.strptime(end_time.strip(), "%b %d, %Y")

                    period_book[name + ' start_date'] = start_time.strftime("%Y-%m-%d 00:00:00")
                    period_book[name + ' end_date'] = end_time.strftime("%Y-%m-%d 00:00:00")
                except Exception as e:
                    print(f"Processing of raw date {raw_date} gone wrong. Error: {e}")

    return True

def scrape_banner_period(date_data, period_book):
    """
    input: date_data dictionary filled with nikke information, period_book previously scraped nikke banner dates
    output: date_data dictionary
    function: takes the name of a nikke and inplace modify the date_data with the start and end period of a nikke's banner
    """

    first_key = date_data['name'] + ' start_date' #creating the keys for period_book
    second_key = date_data['name'] + ' end_date'

    if first_key in period_book and second_key in period_book:
        date_data['start_date'] = period_book[first_key]
        date_data['end_date'] = period_book[second_key]
    else: #only if you have exhuasted all banner blocks do you apply the default date
        print(f"{date_data['name']}'s banner wasn't found, will apply the game's launch date")
        sub_start_end = datetime.strptime("NOV 4, 2022", "%b %d, %Y") #if nikke isn't found in the banner history, probably a welfare unit, or a unit on release, just give it the game's release date
        date_data['start_date'] = sub_start_end.strftime("%Y-%m-%d 00:00:00")
        date_data['end_date'] = sub_start_end.strftime("%Y-%m-%d 00:00:00")

    return date_data

def scrape_all_banners(period_book):
    """
    input: period_book dictionary that should be filled with nikke : banner period
    output: period_book
    function: goes to loot and waifus and scrapes all banners live and historical. Storing historical with priority
    """

    url = f"https://lootandwaifus.com/nikke-banner-history/"
    print(f"Scraping all banners in nikke")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--proxy-server='direct://'",  #wsl will connect directly to website 
                "--proxy-bypass-list=*", #bypass all proxy rules on all websites
                "--disable-features=AsyncDns", #disable wsl dns resolution and use the google resolution
                "--disable-ipv6" #disable ipv6 cause its ass apparently 
            ]
        ) #creates a dummy chrome browser,
        print(f"Created dummy browser")
        try: 
            mask = browser.new_context( #creates a mask to pretend to be an actual chrome user
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US"
            )
            page = mask.new_page() #ctrl + t
            time.sleep(1)
            page.goto(url) #go to prydwen
            # print("ran after url")
            page.wait_for_selector(".banner-section") #wait for the page to load

            try: 
                banner_block = page.locator(".banner-section").all() #scrape the banner sections live or historical

                for i,block in enumerate(banner_block): #go through all banner blocks, always go through last block as reruns can happen
                    print(f"Searching {i+1} banner block")
                    if banner_scraper_helper(block,period_book): 
                        print(f"All banners in block {i+1} have been found")

            except Exception as e: 
                print(f"Error in scraping all banner periods has failed. Error is {e}")
                period_book = False
        except Exception as e: 
             print(f"Error in setting up chromium and going to prydwen, Error is {e}")
             period_book = False
        finally: 
            browser.close()
        return period_book

def scrape_all_character_data(character_list): 
    """
    args: txt that has the list of characters to scrape data for
    output: dictionary of character : t/f pairs, that lists out what characters were scraped and whether they were successful or not 
    Function: Scrapes all requested character data from Prydwen and stores it inside a database 
    """
    if not os.path.exists(character_list): 
        print(f"File: {character_list} doesn't fucking exist")
        return None
    
    print(f"Beginning scraping process")

    connection = init_database()
    check_book = {}
    treasure_book = {}
    banner_book = {}
    period_book = {}
    max_attempts = 1

    with open(character_list, 'r') as f: #open the txt file, iterate through each line, and call scrape_character 
        for line in f: 
            attempts = 0
            char_data = False
            line = line.lower().strip()

            if not line: #if there is a blank line in the file for some reason
                continue

            if query_character_exists(connection, line.split(',')[0].title()): #takes the line, and extracts the first set of words before ,. which is always the name
                check_book[line.split(',')[0].title()] = True
                temp_duplicates.append(line.split(',')[0].title())
                continue
            
            if not period_book: #if period book hasn't been filled fill it.
                period_book = scrape_all_banners(period_book)
                if not period_book:
                    print(f"Scraping of all nikke banner dates has failed. Aborting entire process")
                    return [check_book,treasure_book,banner_book]

            while attempts < max_attempts:
                time.sleep(2)
                print(f"{line}: attempt {attempts + 1}")    

                char_data = {"name" : line.split(",")[0].title()} #create the dictionary for nikke information
                date_data = {"name" : line.split(",")[0].title()} #create the dictionary for nikke banner period
                check_overspec_treasure(char_data, line) #check for overspec and treasure
                
                treasure_data = None #clean stale data
                if char_data['treasure'] == 1:
                    treasure_data = char_data.copy() #if there is treasure, make a copy of char_data and adjust the new dict to be treasure version
                    treasure_data['name'] = treasure_data['name'] + " (Treasure)"

                char_data = scrape_character(char_data, create_character_link(line)) #attempt to scrape character
                date_data = scrape_banner_period(date_data,period_book)

                if char_data and char_data['treasure'] == 1: 
                    print(f"{line.split(',')[0].title()} has a treasure, attempting that scraping")
                    treasure_data = scrape_character(treasure_data, create_treasure_link(line)) #attempt to scrape treasure version of character
               
                attempts += 1
                if char_data and date_data:  #makes sure that both char_data, date_data, treasure_data exists if need be
                    if char_data['treasure'] == 1:
                        if treasure_data:
                            break
                    else:
                        break 

            if char_data: #if char_data exists, add it to the database
                print(f"Successfully scraped: {line.split(',')[0].title()}") 
                add_characters(connection, char_data)
                if char_data['treasure'] == 1:  
                    if treasure_data: #checks for treasure_data and adds it
                        add_characters(connection, treasure_data, 'treasures')
                        treasure_book[line.split(',')[0].title()] = True
                    else:
                        treasure_book[line.split(',')[0].title()] = False
                check_book[line.split(',')[0].title()] = True
            else: 
                print(f"Failed to scrape: {line.split(',')[0].title()}")
                check_book[line.split(',')[0].title()] = False

            if date_data: #adds banner data if exists
                print(f"Successfully scraped: {line.split(',')[0].title()}'s banner period")
                add_banner(connection,date_data)
                banner_book[line.split(',')[0].title()] = True
            else:
                print(f"Failed to scrape: {line.split(',')[0].title()}'s banner period")
                banner_book[line.split(',')[0].title()] = False

            # print(char_data)
            print("____________________________________________________________")
    connection.close()
    return [check_book,treasure_book,banner_book]

if __name__ == "__main__": 
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_file = os.path.join(script_dir, "character_list.txt")

    check_book, treasure_book, banner_book = scrape_all_character_data(target_file)

    print(f"{temp_duplicates} duplicate list")
    print(f"\nThere are {len(check_book)} nikkes scraped:")
    print(f"\nThere are {len(treasure_book)} favorite item nikkes")
    for key, value in check_book.items():
        if not value:
            print(f"This nikke: {key} failed its character scraping")
        elif banner_book.get(key) == False:
            print(f"This nikke: {key} succeeded character scraping, but FAILED banner scraping")

    # with open(target_file, "r") as f: 
    #     for line in f: 
    #         print(create_character_link(line))
    
    # date_data = {'name': 'Crown'}
    # print(scrape_banner_period(date_data))

    # period_book = {}
    # period_book = scrape_all_banners(period_book)
    # print(f'\n{len(period_book)}')