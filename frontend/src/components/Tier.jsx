import { useState, useEffect } from "react";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, useDroppable, useDraggable } from "@dnd-kit/core";
const link = import.meta.env.VITE_API_LINK;

//() => function() tells it to store the function for later use
//function tells the div to store the function for later use.
// function() calls the function to action, but an empty instruction like () => will have it store it instead

//produces a custom tierlist creation system for the user
function TierList({username, layers, setLayers}){
    if (!layers || layers.length <= 0){
        return <CreateTierList username={username} layers={layers} setLayers={setLayers}/>
    }
    else{
        return <ListLayers username={username} layers={layers} setLayers={setLayers}/>
    }
}   

function NikkeCard({ nikke, currentLayer }){
    //tells dnd-kit this item can be dragged. We pass layer in the data object 
    //setNodRef tells js that this particular element will be dragged
    //listeners - has all the onPointerDown, and onKeydown, and other sensors to tell js that the user grabbed an item
    //attributes - for accessibility
    //transform - transform stores vector of how far object being dragged has moved from its original position
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: nikke,
        data: {currentLayer: currentLayer}
    });
    //css to move item visually while you drag it, updates the visual position to the position given by Transform
    const style = {
        transform: CSS.Translate.toString(transform),
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {})
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 flex items-center justify-center hover:bg-slate-700 hover:border-blue-400 transition-colors cursor-grab active:cursor-grabbing shadow-sm"  
        >
             <p className="text-sm font-semibold text-slate-200 pointer-events-none">
                {nikke}
             </p>
        </div>
    )
}

function TierRow({tier, handleMoveUp, handleMoveDown, handleDeleteLayer}){
    //tell dnd-kit this is a valid drop zone
    //isOver is a boolean set whenever you hover over a droppable object
    const {setNodeRef, isOver} = useDroppable({
        id: tier.layer_title,
    });

    return(
        <div className="flex bg-slate-800 border border-slate-700 rounded-lg min-h-[100px] shadow-sm">
            <div className="w-32 shrink-0 bg-slate-700 flex items-center justify-center border-r border-slate-600 rounded-l-lg">
                <span className="text-xl font-bold text-slate-200 text-center px-2">
                    {tier.layer_title}
                </span>
            </div>

            <div ref={setNodeRef} className={`flex-1 p-4 flex gap-2 flex-wrap items-start content-start transition-colors ${isOver ? 'bg-slate-700/50' : 'bg-slate-900/50'}`}>
                {tier.nikkes && tier.nikkes.length > 0 ? (
                    tier.nikkes.map((nikke) => (
                        <NikkeCard key={nikke} nikke={nikke} currentLayer={tier.layer_title} />))
                ) : (
                    <span className="text-slate-500 text-sm italic flex items-center h-full">
                        Drag characters here...
                    </span>
                )}
            </div>

            {tier.layer_title !== "Unranked" && (
                <div className="flex shrink-0 border-l border-slate-700">
                    <div className="w-10 flex flex-col border-r border-slate-700">
                        <button onClick={() => handleMoveUp(tier.layer_title)} className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold text-xl" title="Move Up">↑</button>
                        <button onClick={() => handleMoveDown(tier.layer_title)} className="flex-1 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border-t border-slate-700 font-bold text-xl" title="Move Down">↓</button>
                    </div>
                    <button onClick={() => handleDeleteLayer(tier.layer_title)} className="w-12 flex items-center justify-center bg-red-950/30 text-red-400 hover:text-white hover:bg-red-600 transition-colors font-bold text-lg" title="Delete Layer">X</button>
                </div>
            )}
        </div>
    )
}

function ListLayers({username, layers, setLayers}){
    const [isAdding, setIsAdding] = useState(false);

    const handleMoveUp = async(layer_title) => {
        try{
            const response = await fetch(`${link}api/nikkes/move/up`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, tier_title: layers[0].tier_title, layer_title})
            });
            const data = await response.json();

            if (response.ok){
                setLayers(data);
            }
            else{
                window.alert(data.error);
            }
        }   
        catch(err){
            console.error("Failed to connect to server");
        }
    }

    const handleMoveDown = async(layer_title) => {
        try{
            const response = await fetch(`${link}api/nikkes/move/down`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, tier_title: layers[0].tier_title, layer_title})
            });
            const data = await response.json();

            if (response.ok){
                setLayers(data);
            }
            else{
                window.alert(data.error);
            }
        }   
        catch(err){
            console.error("Failed to connect to server");
        }
    }

    const handleDelete = async() => {
        //handles deleting logic
        try{
            const response = await fetch(`${link}api/nikkes/${username}`,{
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok){
                console.log("Successfully deleted tier list");
                setLayers([])
            }
            else {
                console.error("Failed to delete tier list");
            }
        }
        catch(err){
            console.error("Failed to connect to Server");
        }
    }

    const handleDeleteLayer = async(layer_title) => {
        if (!window.confirm(`Are you sure you want to delete ${layer_title}? Characters will be moved to Unranked`)){
            return;
        }

        try{
            const response = await fetch(`${link}api/nikkes/create/delete`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, layer_title})
            });
            const data = await response.json();

            if (response.ok){
                setLayers(data);
            }
            else{
                window.alert(data.error);
            }
        }
        catch(err){
            console.log("Failed to connect to server")
        }
    }

    const handleDrag = async (event) => {
        //active is the metadata from useDraggable
        //over is the metadata from useDroppable
        const {active, over} = event;

        if (!over) {
            return;
        }

        const nikkeName = active.id; //active contains all information about current Nikke status
        const sourceLayer = active.data.current.currentLayer;
        const destinationLayer = over.id; //over contains all information regarding a nikke's future location

        if (sourceLayer === destinationLayer){
            return;
        }

        try{
            const response = await fetch(`${link}api/nikkes/character/move`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: username,
                    tier_title: layers[0].tier_title,
                    layer_title_location: sourceLayer,
                    layer_title_destination: destinationLayer,
                    nikke: nikkeName
                })
            });
            const data = await response.json();

            if (response.ok){
                setLayers(data);
            }
            else{
                window.alert(data.error);
            }
        }
        catch(err){
            console.error("Failed to move character");
        }
    }

    return(
        <div className="flex flex-col gap-4 w-full max-w-[1200px] mx-auto mt-8">
            <div className="flex flex-col items-center text-center gap-2 mb-4 border-b border-slate-700 pb-6 px-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
                    {layers[0].tier_title}
                </h1>
                <p className="text-base md:text-lg text-slate-400 max-w-3xl">
                    {layers[0].description}
                </p>
            </div>
            
            <div className="flex justify-center mb-2">
                <button onClick={() => setIsAdding(true)} className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-md border border-slate-600 transition-colors shadow-sm font-semibold">+ Add a tier</button>
            </div>

            {layers.length > 0 ? (
                <>
                    <DndContext onDragEnd={handleDrag}>
                        {layers.map((tier) => (
                            <TierRow key={tier.layer_title} tier={tier} handleMoveUp={handleMoveUp} handleMoveDown={handleMoveDown} handleDeleteLayer={handleDeleteLayer}/>
                        ))}
                    </DndContext>
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={() => handleDelete()}
                            className="bg-red-900/80 hover:bg-red-600 border border-red-700 text-red-100 px-6 py-2 rounded-lg font-bold transition-colors shadow-md"
                        >
                            Delete Entire Tier List
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center text-slate-400 py-12 text-xl font-semibold"> 
                    No tier list found 
                </div>
            )}
            {
                isAdding && <AddLayer username={username} layers={layers} setLayers={setLayers} closeModal={() => setIsAdding(false)}/>
            }
        </div>
    );
}

function AddLayer({username, layers, setLayers, closeModal}){
    const [layer_title, setLayer_title] = useState("");
    
    const handleAddLayer = async(e) => {
        e.preventDefault();
        try{
            const trimmedTitle = layer_title.trim();
            const response = await fetch(`${link}api/nikkes/create/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, tier_title: layers[0].tier_title, layer_title: trimmedTitle})
            });
            const data = await response.json();

            if (response.ok){
               setLayers([data[0], ...layers]);
               closeModal(); // closes the overlay by calling the function stored in closeModal
            }
            else{
                console.error(data.error);
            }
        }
        catch(err){
            console.error("Failed to connect to server");
        }
    }
    
    return(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-2xl w-full max-w-md relative">
                <button onClick={() => closeModal()} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    ✕
                </button>

                <h2 className="text-3xl font-bold text-blue-400 mb-2 text-center">
                    Create New Tier
                </h2>

                <form onSubmit={handleAddLayer} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 font-semibold text-sm">Tier List Title</label>
                        <input
                            type="text"
                            placeholder="e.g. S Tier, A Tier"
                            value={layer_title}
                            onChange={(e) => setLayer_title(e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-slate-100 px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button 
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors shadow-md"
                        >
                            Create Tier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function CreateTierList({username, layers, setLayers}){
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            const trimmedTitle = title.trim();
            const trimmedDescription = description.trim();
            const response = await fetch(`${link}api/nikkes/create/new`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, title: trimmedTitle, description: trimmedDescription})
            });
            const data = await response.json();

            if (response.ok){
                setLayers(data);
            }
            else {
                console.error(data.error);
            }
        }
        catch(err){
            console.error("Failed to connect to Server");
        }
    }

    return(
        <div className="flex flex-col items-center justify-center pt-24 pb-12 px-4">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-blue-400 mb-2 text-center">
                    Create Tier List
                </h2>
                <p className="text-slate-400 text-center mb-6 text-sm">
                    Start by creating your unranked character pool.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 font-semibold text-sm">Tier List Title</label>
                        <input
                            type="text"
                            placeholder="e.g., Playable or Not"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-slate-100 px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-300 font-semibold text-sm">Description</label>
                        <input
                            type="text"
                            placeholder="What is this tier list based on?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-slate-100 px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors shadow-md w-full"
                    >
                        Initialize Roster
                    </button>
                </form>
            </div>
        </div>
    )
}

export default TierList;