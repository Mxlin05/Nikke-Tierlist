import { useState, useEffect } from 'react';
import Auth from "./components/Auth"
import Nikkepedia from './components/Roster';
import TierList from './components/Tier';

const link = import.meta.env.VITE_API_LINK;

function App() {
  const [nikkes, setNikkes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navg, setNavg] = useState(false);
  const [page, setPage] = useState("Roster");
  const [layers, setLayers] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!user){
      return;
    }
    //extract all tier layers a user may have
    const extractAll = async () => {
      try{
        const response = await fetch(`${link}api/nikkes/retrieve/${user.username}`);
        const data = await response.json();

        if (response.ok) {
          setLayers(data);
        }
        else {
          console.error(data.error);
        }
      }
      catch(err){
        console.error("Failed to grab tier list layers");
      }
    }

    extractAll();
  }, [user]);

  useEffect(() => {
    //grab all nikkes
      if (!user){ //no user, just return
        return;
      }
      //async function to call api to grab all nikkes
      const extractAll = async () => {
        try{
          const response = await fetch(`${link}api/nikkes/`); //fetch call to return a promise from the api of grabbing all nikkes
          const data = await response.json(); //turn the response into a json i can use
          
          if (response.ok){
            setNikkes(data);
          }
          else{
            console.error(data.error);
          }
        }
        catch (err){
          console.error("Failed to grab all nikkes in db");
          setLoading(false);
        }
        finally{
          setLoading(false);
        }
      }

      extractAll();
    }, [user]);
  
  useEffect(() => { //check if there is a already a current user logged in, via a token in the cookiejar
    const checkSession = async () => {
      try {
        const response = await fetch(`${link}api/auth/me`, { //api call to verify token
          credentials: 'include'
        });
        const data = await response.json();
  
        if (response.ok){ //set user if valid
          setUser({userId: data.userId, username: data.username});
        }
        else {
          console.error(data.error);
        }
      }
      catch (err){
        console.error("Session check failed");
      }
      finally{
        setIsVerifying(false);
      }
    }

    checkSession();
  }, []);

  const handleLogout = async () => { //when logout button is pressed run this function to call the logout api
    try{
      const response = await fetch(`${link}api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok){
        setUser(null);
      }
      else{
        window.alert("Failed to log you out");
      }
    }
    catch (err){
      console.error("Logout failed");
    }
  }
  //return components

  if (isVerifying){ //display this if the api for verifying user existence is still running
    return <div className='min-h-screen bg-slate-900 text-white flex items-center justify-center'>Loading session...</div>
  }
  //if the initial api call to verify token fails, there isn't an user set, so give them the login screen
  if (!user){
    return <Auth />
  }
  else {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex">
        <div className="flex-1 max-w-[1650px] mx-auto px-8 pb-8">
            {/* Header Section with Logout Button */}
          <div className="sticky top-0 z-20 bg-slate-900 pt-8 pb-4 mb-8 border-b border-slate-700 flex justify-between items-center">
            {page === "Roster" && <h1 className="text-4xl font-bold text-blue-400">Nikke Roster</h1>}
            {page === "Tierlist" && <h1 className="text-4xl font-bold text-blue-400">Tier List</h1>}
            
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-semibold">
                Welcome, {user.username}!
              </span>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold transition-colors">
                Log Out
              </button>

              <button onClick={() => setNavg(!navg)} className='bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold transition-colors shadow'>{navg ? '✖ Close' : '☰ Menu'}</button>
            </div>
          </div>

          {/* Show a loading message if the fetch hasn't finished yet */}
          {loading && <p className="text-center text-slate-400 text-xl">Loading database...</p>}
          {!loading && page === "Roster" && <Nikkepedia roster={nikkes}/>}
          {!loading && page === "Tierlist" && <TierList username={user.username} layers={layers} setLayers={setLayers}/>}
          </div>
          
          <div className={`shrink-0 bg-slate-800 border-slate-700 h-screen sticky top-0 flex flex-col shadow-xl z-30 transition-all duration-300 overflow-hidden ${navg ? 'w-[280px] p-6 border-l' : 'w-0 p-0 border-l-0'}`}>
            <div className='w-[232px]'>
              <h2 className='text-xs font-bold text-slate-500 uppercase tracking-widest mb-6'>
                  Navigation
              </h2>

              <div className="flex flex-col gap-3">
                <button onClick={() => setPage("Roster")} className={`text-left px-4 py-3 rounded-lg font-semibold transition-all ${page === "Roster" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                    <div className='flex items-center gap-3'>
                      Nikkepedia
                    </div>
                </button>

                <button onClick={() => setPage("Tierlist")} className={`text-left px-4 py-3 rounded-lg font-semibold transition-all ${page === "Tierlist" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                    <div className='flex items-center gap-3'>
                      Tier List
                    </div>
                </button>
              </div>
          </div>
          
          </div>

        </div>
    );
  }    
}

export default App;