1. The Scraper: Python (with Playwright or BeautifulSoup)

Why: Python is the undisputed king of data extraction. Since Prydwen might use dynamic rendering, you can write a short Python script using Playwright to navigate the URLs, wait for the data to load, and extract the stats.

Storage: Your Python script can dump this raw data straight into your database or output it as JSON files.

2. The Database: MySQL

Why: Game data is highly relational. A Nikke has a Class (Attacker/Defender/Supporter), a Weapon type, a Burst Tier (I, II, III), and an Element. MySQL is perfect for filtering and sorting this kind of structured data (e.g., "Show me all Burst III Attackers").

3. The Backend API: FastAPI (Python) OR Express (TypeScript)

Why FastAPI: Since you are already scraping in Python, using FastAPI to serve that data to your frontend is seamless. It's incredibly fast and automatically generates documentation for your API endpoints.

Why Express: If you prefer to keep your web serving in the JavaScript ecosystem, an Express server written in TypeScript is lightweight and perfectly suited for serving JSON data from your database to your frontend.

4. The Frontend: React + Vite, tailwind css and shadcn/ui

Why: To build interactive tier lists (like drag-and-drop ranking features, sorting tables, or character detail modals), React is the industry standard. Next.js is a great framework on top of React that will make your site lightning-fast by pre-rendering the character data.