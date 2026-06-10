import { useState } from "react";
const link = 'http://localhost:3000/'

function Auth(){
    const [isLogin,setIsLogin] = useState(true);
    const [isMatch,setIsMatch] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [retypepassword, setRetypePassword] = useState("");
    const [error, setError] = useState("");
    
    const handleSubmit = async(e) => { //function to handle submit
        e.preventDefault(); //prevents page from refreshing on submit
        setError('');

        const endpoint = isLogin ? 'login' : 'register'; //endpoint changes depending on state of isLogin

        if (!isLogin && password !== retypepassword){
            setIsMatch(true);
            return;
        }
        else{
            setIsMatch(false);
        }
        try { //pause the function here and wait for the response from the server
            const response = await fetch(`${link}api/auth/${endpoint}`, { //fetch returns a promise that probably resolves to a response
                method: 'POST', //post method to not store sensitive info in the link
                headers: {'Content-Type': 'application/json'}, //tells server contents of the body are json
                body: JSON.stringify({username, password}), //takes username and password and turns it into strings
                credentials: 'include' //tells browser to accept cookies from the server response
            });

            const data = await response.json(); //turns response into a json object i can use

            if (response.ok){
                window.location.reload();
            }
            else {
                setError(data.error);
            }
        }
        catch (err){
            setError("Failed to connect to Server")
        }
    };
  //return a component that adjusts based on whether the user is trying to login or register. 
    return(
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 w-96">
                <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="p-3 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        required
                    />
                    {!isLogin && <input 
                        type="password"
                        placeholder="Re-type the password"
                        value={retypepassword}
                        onChange={(e) => setRetypePassword(e.target.value)}
                        className="p-3 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        required
                    />}
                    {isMatch && <div className="text-red-400 text-sm font-semibold text-center">The 2 passwords must match</div>}
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors"
                    >{isLogin ? "Login" : "Sign Up"}</button>
                </form>
                <p className="mt-4 text-center text-slate-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:text-blue-300 font-semibold underline">{isLogin ? "Register" : "Login"}</button>
                </p>
            </div>
        </div>
    );
}

export default Auth