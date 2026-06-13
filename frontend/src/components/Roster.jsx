import { useState, useMemo } from "react";
const link = 'http://localhost:3000/';

function Nikkepedia({roster}){
    const [weapon, setWeapon] = useState("*"); //fields to store the different sorting types
    const [element, setElement] = useState("*");
    const [manufacturer, setManufacturer] = useState("*");
    const [burst, setBurst] = useState("*");
    const [classification, setClassification] = useState("*"); 
    const [treasure, setTreasure] = useState("*");
    const [overspec, setOverspec] = useState("*");

    const filteredRoster = useMemo(() => {//useMemo makes it so that this function is only ever ran upon change of any of the states, not upon re-renders
        return roster.filter((nikke) => { //massive filter function, if the sorting is "*", take all nikkes, if not, match the nikkes properties. Filter works by letting nikke into the list if the function inside returns true
            const filterWeapon = weapon === "*" || nikke.weapon?.trim().toLowerCase() === weapon.trim().toLowerCase();
            const filterElement = element === "*" || nikke.element?.trim().toLowerCase() === element.trim().toLowerCase();
            const filterManufacturer = manufacturer === "*" || nikke.manufacturer?.trim().toLowerCase() === manufacturer.trim().toLowerCase();
            const filterBurst = (burst === "*" || nikke.burst?.toString() === burst) || nikke.name === "Red Hood";
            const filterClassfication = classification === "*" || nikke.class?.trim().toLowerCase() === classification.trim().toLowerCase();
            const filterTreasure = treasure === "*" || (nikke.treasure === 1 && nikke.name.includes("(Treasure)"));
            const filterOverspec = overspec === "*" || nikke.overspec === 1;

            return filterWeapon && filterElement && filterManufacturer && filterBurst && filterClassfication && filterTreasure && filterOverspec;
        });
    }, [roster, weapon, element, manufacturer, burst, classification, treasure, overspec]);

    const handleSwitch = (state, setState, activeName) => { //handle the case where you want to switch to all nikkes or just specifically treasure or overspec
        if (state === "*"){
            setState(activeName);
        }
        else {
            setState("*");
        }
    };

    const handleReset = () => {
        setWeapon("*");
        setElement("*");
        setManufacturer("*");
        setBurst("*");
        setClassification("*");
        setTreasure("*");
        setOverspec("*");
        return;
    };

    const getButtonClass = (currentFilter, buttonValue) => { //custom button class for css
        const baseClass = "px-3 py-1 text-sm font-semibold rounded transition-colors ";
        return currentFilter === buttonValue 
            ? baseClass + "bg-blue-600 text-white" 
            : baseClass + "bg-slate-700 text-slate-300 hover:bg-slate-600";
    };

    return(
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/*Sort by Weapon, Element, Manufacturer, Burst Type, Class*/}
            <div className="w-full lg:w-[380px] shrink-0 bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col gap-6 shadow-md sticky top-31 z-10 max-h-[85vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Weapon: </span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (setWeapon("*"))} className={getButtonClass(weapon, "*")}>*</button>
                        <button onClick={() => (setWeapon("Assault Rifle"))} className={getButtonClass(weapon, "Assault Rifle")}>Assault Rifle</button>
                        <button onClick={() => (setWeapon("Minigun"))} className={getButtonClass(weapon, "Minigun")}>Minigun</button>
                        <button onClick={() => (setWeapon("Rocket Launcher"))} className={getButtonClass(weapon, "Rocket Launcher")}>Rocket Launcher</button>
                        <button onClick={() => (setWeapon("Shotgun"))} className={getButtonClass(weapon, "Shotgun")}>Shotgun</button>
                        <button onClick={() => (setWeapon("Sniper Rifle"))} className={getButtonClass(weapon, "Sniper Rifle")}>Sniper Rifle</button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Element:</span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (setElement("*"))} className={getButtonClass(element, "*")}>*</button>
                        <button onClick={() => (setElement("Electric"))} className={getButtonClass(element, "Electric")}>Electric</button>
                        <button onClick={() => (setElement("Fire"))} className={getButtonClass(element, "Fire")}>Fire</button>
                        <button onClick={() => (setElement("Water"))} className={getButtonClass(element, "Water")}>Water</button>
                        <button onClick={() => (setElement("Wind"))} className={getButtonClass(element, "Wind")}>Wind</button>
                        <button onClick={() => (setElement("Iron"))} className={getButtonClass(element, "Iron")}>Iron</button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Manufacturer:</span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (setManufacturer("*"))} className={getButtonClass(manufacturer, "*")}>*</button>
                        <button onClick={() => (setManufacturer("Abnormal"))} className={getButtonClass(manufacturer, "Abnormal")}>Abnormal</button>
                        <button onClick={() => (setManufacturer("Elysion"))} className={getButtonClass(manufacturer, "Elysion")}>Elysion</button>
                        <button onClick={() => (setManufacturer("Missilis"))} className={getButtonClass(manufacturer, "Missilis")}>Missilis</button>
                        <button onClick={() => (setManufacturer("Pilgrim"))} className={getButtonClass(manufacturer, "Pilgrim")}>Pilgrim</button>
                        <button onClick={() => (setManufacturer("Tetra"))} className={getButtonClass(manufacturer, "Tetra")}>Tetra</button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Burst:</span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (setBurst("*"))} className={getButtonClass(burst, "*")}>*</button>
                        <button onClick={() => (setBurst("1"))} className={getButtonClass(burst, "1")}>1</button>
                        <button onClick={() => (setBurst("2"))} className={getButtonClass(burst, "2")}>2</button>
                        <button onClick={() => (setBurst("3"))} className={getButtonClass(burst, "3")}>3</button>
                    </div>
                </div> 
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Class:</span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (setClassification("*"))} className={getButtonClass(classification, "*")}>*</button>
                        <button onClick={() => (setClassification("Attacker"))} className={getButtonClass(classification, "Attacker")}>Attacker</button>
                        <button onClick={() => (setClassification("Defender"))} className={getButtonClass(classification, "Defender")}>Defender</button>
                        <button onClick={() => (setClassification("Supporter"))} className={getButtonClass(classification, "Supporter")}>Supporter</button>
                    </div>
                </div> 
                <div className="flex flex-col gap-2">
                    <span className="text-slate-300 font-bold border-b border-slate-700 pb-1 mb-1">Special:</span>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => (handleSwitch(treasure, setTreasure, "Treasures Only"))} className={getButtonClass(treasure, "Treasures Only")}>Treasures Only</button>
                        <button onClick={() => (handleSwitch(overspec, setOverspec, "Overspecs Only"))} className={getButtonClass(overspec, "Overspecs Only")}>Overspecs Only</button>
                    </div>
                </div>
                {/*don't use () => for handleReset because you aren't passing any args into it. () => creates a brand new mini function to call another function. setting it equal to {handleReset} gives React the exact address of function to run later*/}
                <div className="flex justify-center pt-2 mt-2">
                    <button onClick={handleReset} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow transition-colors">Reset All Filters</button>
                </div> 
            </div>
            {/*List out relevant nikkes. Unique key names is important, as react reads the div components by key to see what needs to be changed when mapping occurs. Duplicate keys creates an issue where only the first instance of the key is ever grabbed*/}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRoster.length > 0 ? (filteredRoster.map((nikke) => (
                    <div key={nikke.name} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-center hover:bg-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-md">
                        <p>{nikke.name}</p>    
                    </div>
                ))) :
                (<div className="col-span-full text-center py-12 text-slate-500 font-semibold text-lg"> 
                    No Nikkes match these filters
                </div>
                )}
                
            </div>
        </div>
    )
}

export default Nikkepedia;