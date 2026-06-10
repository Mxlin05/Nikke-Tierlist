import { useState, useEffect } from 'react';
import Auth from "./components/Auth"

const link = 'http://localhost:3000/'

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
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
            {/* Header Section with Logout Button */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
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
  
          {/* The Grid Container */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            
            {/* Loop through the 'nikkes' array and create a card for each one */}
            {nikkes.map((nikke) => (
              <div 
                key={nikke.id} 
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-center hover:bg-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-md"
              >
                <p className="font-semibold text-lg text-slate-100">
                  {nikke.name}
                </p>
              </div>
            ))}
  
          </div>
        </div>
      </div>
    );
  }    
}

export default App;