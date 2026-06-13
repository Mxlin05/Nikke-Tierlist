import { useState, useEffect } from 'react';
import Auth from "./components/Auth"
import Nikkepedia from './components/Roster';

const link = 'http://localhost:3000/';

function App() {
  const [nikkes, setNikkes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
      if (!user){ //no user, just return
        return;
      }

      fetch(`${link}api/nikkes/`)
      .then((response) => {
        if (!response.ok){
          throw new Error("Network response was bad")
        }
        return response.json()
      })
      .then((data) => {
        console.log(data);
        setNikkes(data); //save the array of nikke data
        setLoading(false); //Turn off loading text
      })
      .catch((error) => {
        console.error("Error fetching Nikkes:", error)
        setLoading(false);
      });
    }, [user])
  
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
          setError(data.error);
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
      <div className="min-h-screen bg-slate-900 text-white pb-8">
        <div className="max-w-[1550px] mx-auto px-8">
            {/* Header Section with Logout Button */}
          <div className="sticky top-0 z-20 bg-slate-900 pt-8 pb-4 mb-8 border-b border-slate-700 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-blue-400">
              Nikke Roster
            </h1>
            
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-semibold">
                Welcome, {user.username}!
              </span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Show a loading message if the fetch hasn't finished yet */}
          {loading && <p className="text-center text-slate-400 text-xl">Loading database...</p>}
  
          <Nikkepedia roster={nikkes}/>
  
          </div>
        </div>
    );
  }    
}

export default App;