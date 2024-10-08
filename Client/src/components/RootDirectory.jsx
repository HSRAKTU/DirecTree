import axios from "axios";
import { useEffect, useState } from "react";


function RootDirectory() {
    const [treeData, setTreeData] = useState([]); // State to hold the folder structure
    const [activeFolder, setActiveFolder] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [newItemName, setNewItemName] = useState(""); // State to hold new file name with extension
    const [creating, setCreating] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [activeCard, setActiveCard] = useState({ id: null, type: null});
    const [showDropOutline, setShowDropOutline] = useState(null);

    // Helper function to split file name and extension
    const extractFileNameAndType = (fullName) => {
        const parts = fullName.split('.');
        const fileType = parts.pop(); // Get the extension
        const fileName = parts.join('.'); // Join the rest as the file name
        return { fileName, fileType };
    };


    // Function to fetch folders and files from the backend
    const fetchItems = async (parentId = null) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/folders/sub`, {
                params: { parentId: parentId === null ? 'bleh' : parentId }
            });
            console.log("Response:", response.data.data);
            return response.data.data; // Return subfolders and files
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    // Load root items initially
    const loadRootItems = async () => {
        const { subfolders, files } = await fetchItems();
        const rootTree = await buildTree(subfolders, files);
        setTreeData(rootTree); // Build the initial tree structure
    };

    // Function to build the tree structure
    const buildTree = (folders, files) => {
        return [
            ...folders.map(folder => ({
                type: 'directory',
                name: folder.name,
                id: folder._id,
                isOpen: false, // Track if the folder is open
                subfolders: [], // Initialize with empty subfolders
            })),
            ...files.map(file => ({
                type: 'file',
                name: `${file.name}.${file.fileType}`,
                id: file._id,
            }))
        ];
    };

    const handleFolderClick = async (folderId) => {
        const { subfolders, files } = await fetchItems(folderId); // Fetch subitems for the folder
        setActiveFile(null);
    
        setTreeData(prevTree => {
            // Recursive function to update the tree
            const updateNode = (nodes) => {
                return nodes.map(node => {
                    if (node.id === folderId) {
                        return {
                            ...node,
                            isOpen: !node.isOpen, // Toggle folder open/close
                            subfolders: node.isOpen ? [] : buildTree(subfolders, files) // Only update subfolders when opening
                        };
                    }
                    if (node.type === 'directory' && node.subfolders.length > 0) {
                        return {
                            ...node,
                            subfolders: updateNode(node.subfolders) // Recursively update subfolders
                        };
                    }
                    return node;
                });
            };
    
            return updateNode(prevTree); // Update the tree with new subfolders
        });
        setActiveFolder(folderId);
        setDeleting(folderId);
    };
    
    const handleFileClick = (fileId) => {
        setActiveFile(fileId);
        setActiveFolder(null); // Clear any folder selection
        setDeleting(fileId);
    };


    // Function to create a new file
    const handleCreateFile = async () => {
        if (!newItemName) return;

        const { fileName, fileType } = extractFileNameAndType(newItemName); // Extract fileName and fileType

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/files/create`, {
                name: fileName,
                fileType: fileType,
                folderId: activeFolder || null// Associate with active folder
            });
             // After creating the file, fetch and update the active folder's content
            const { subfolders, files } = await fetchItems(activeFolder);
            updateTreeData(activeFolder, subfolders, files); // Update tree with new file data

            setNewItemName(""); // Reset input field
            setCreating(null); // Close the input after creation
        } catch (error) {
            console.error("Error creating file:", error);
        }
    };

    // Function to create a new folder
    const handleCreateFolder = async () => {
        if (!newItemName) return;

        try {
            const newFolderRes = await axios.post(`${import.meta.env.VITE_API_URL}/folders/create`, {
                name: newItemName,
                parentId: activeFolder || null// Associate with active folder
            });
            console.log("NEw Folder::",newFolderRes.data.data)
            // Refetch the parent folder to get updated contents
            const { subfolders, files } = await fetchItems(newFolderRes.data.data.parentId);
            updateTreeData(newFolderRes.data.data.parentId, subfolders, files); // Update tree with new folder data
            
            // Set the parent of the newly created folder as active
            setActiveFolder(newFolderRes.data.data.parentId);
            
            setNewItemName(""); // Reset input field
            setCreating(null); // Close the input after creation
            await loadRootItems();
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const updateTreeData = (folderId, newSubfolders, newFiles) => {
        setTreeData(prevTree => {
            const updateNode = (nodes) => {
                return nodes.map(node => {
                    if (node.id === folderId) {
                        return {
                            ...node,
                            subfolders: buildTree(newSubfolders, newFiles) // Update subfolders
                        };
                    }
                    if (node.type === 'directory' && node.subfolders.length > 0) {
                        return {
                            ...node,
                            subfolders: updateNode(node.subfolders) // Recursively update subfolders
                        };
                    }
                    return node;
                });
            };
            return updateNode(prevTree);
        });
    };
    
    // Common function to handle both creation modes (file/folder)
    const handleCreate = () => {
        if (creating === 'file') {
            //console.log("creating file??")
            handleCreateFile();
        } else if (creating === 'folder') {
            handleCreateFolder();
        }
    };

    const handleDelete = async () => {
        if (!activeFolder && !activeFile) return;
        try {
            if (activeFolder) {
                // Delete folder
                const delResponse = await axios.delete(`${import.meta.env.VITE_API_URL}/folders/delete`,{
                    params: { folderId : activeFolder}
                });
                console.log(`Folder with id ${activeFolder} deleted`,delResponse);
    
                // Reload the tree after deletion by refetching the parent folder
                const { subfolders, files } = await fetchItems(null); // Fetch root items again
                setTreeData(buildTree(subfolders, files)); // Update tree after deletion
                setActiveFolder(null); // Clear active folder
                setDeleting(null);
            } else if (activeFile) {
                // Delete file
                const delResponse = await axios.delete(`${import.meta.env.VITE_API_URL}/files/delete`,{
                    params: {fileId : activeFile}
                });
                console.log(`File with id ${activeFile} deleted`, delResponse);
    
               // Reload the tree after deletion
                if (activeFolder === null) {
                    const { subfolders, files } = await fetchItems(null); // Fetch root items again
                    setTreeData(buildTree(subfolders, files)); // Update tree after deletion
                } else {
                    const { subfolders, files } = await fetchItems(activeFolder); // Fetch active folder items
                    updateTreeData(activeFolder, subfolders, files); // Update the active folder contents
                }

                setActiveFile(null); // Clear active file
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }

    const onDrop = async (itemId, type) => {
        if(itemId == showDropOutline) return;
        try {
            if(type == 'directory'){
                const move = await axios.patch(`${import.meta.env.VITE_API_URL}/folders/move`,{
                    folderId : itemId,
                    targetParentId: showDropOutline
                })
                await loadRootItems();
                console.log("moved a folder successfully::", move)
            }else if(type == 'file'){
                const move = await axios.patch(`${import.meta.env.VITE_API_URL}/files/move`,{
                    fileId : itemId,
                    targetFolderId: showDropOutline
                })
                await loadRootItems(); 
                console.log("moved a file successfully::", move)
            }
            setActiveCard({id: null, type: null});
        } catch (error) {
            console.log("Error while moving",type,error);
        } finally {
            setShowDropOutline(null); // Reset drop outline
        }
    }

    useEffect(() => {
        loadRootItems(); // Fetch the initial tree on component mount
    },[]);


    // Recursive function to render folders and files
    const renderTree = (items, level = 0) => {
        const hoverCounter = {}; 

        return items.map(item => {
            const marginLeft = `${level * 20}px`; // Set margin based on level

            if (item.type === 'directory') {
                hoverCounter[item.id] = hoverCounter[item.id] || 0;
                return (
                    <div 
                        key={item.id} 
                        className={`${item.id == activeFolder ? "border-2 border-red-600":""} `}
                        draggable="true" 
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent the event from affecting other folders
                           // Increment hover count
                            hoverCounter[item.id] += 1;
                            setShowDropOutline(item.id); 
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent affecting parent or sibling folders
                                // Decrement hover count
                            hoverCounter[item.id] -= 1;

                            // Only reset the outline if hoverCounter reaches zero
                            if (hoverCounter[item.id] === 0) {
                                setTimeout(() => {
                                    setShowDropOutline(null);
                                }, 100);  
                            }
                        }}
                        onDragOver={(e) => e.preventDefault()} // Allow dropping
                        onDrop={(e) => {
                            e.preventDefault(); // Prevent default behavior (e.g., opening files)
                            e.stopPropagation();
                            onDrop(activeCard.id, activeCard.type);
                        }}
                        onDragStart = {(e) => {
                            e.stopPropagation();
                            console.log('Dragging:', item.type, "Target", showDropOutline);
                            setActiveCard({ id: item.id, type: 'directory' });
                        }}      
                    >
                        <div 
                            style={{ marginLeft }} 
                            onClick={() => handleFolderClick(item.id)}
                            className={`hover:cursor-pointer ${item.id === showDropOutline ? "border-2 border-blue-900" : "border-2 border-gray-400"}`}
                        >
                            📁 {item.name} {item.isOpen ? '-' : '+'}
                        </div>
                        {item.isOpen && item.subfolders.length > 0 && (
                            <div>
                                {renderTree(item.subfolders, level + 1)} {/* Render subfolders */}
                            </div>
                        )}
                    </div>
                );
            } else if (item.type === 'file') {
                return (
                    <div 
                        key={item.id} 
                        style={{ marginLeft }} 
                        className={item.id == activeFile ? "border-2 border-red-600 hover:cursor-pointer":"hover:cursor-pointer " }
                        onClick={() => handleFileClick(item.id)}
                        draggable = "true"
                        onDragStart = {(e) => {
                            e.stopPropagation();
                            console.log('Dragging:', item.type, 'Target:', showDropOutline);
                            setActiveCard({ id: item.id, type: 'file' });
                        }}
                    >
                        📄 {item.name}
                    </div>
                );
            }
            return null; // Fallback
        });
    };

   
    return (
        <div>
            {/* <h5>Item picked: {activeCard.type} and dropping to {showDropOutline}</h5> */}
            <h3 onClick={() => {
                setActiveFolder(null)
                setActiveFile(null)
                setDeleting(null)
                setShowDropOutline(null)
            }} className="hover:cursor-pointer">Root Directory</h3> 
            <div className="mx-2 px-2">
                <button className="mx-2" onClick={() => setCreating('file')}>📄+</button>
                <button className="mx-2" onClick={() => setCreating('folder')}>📁+</button>
                {deleting && (
                    <button className="mx-2" onClick={handleDelete}>🗑️-</button>
                )}
            </div>
            {creating && (
                <div className="mx-2 px-2">
                    <input
                        type="text"
                        placeholder={creating === 'file' ? 'Enter file name (e.g., file.txt)' : 'Enter folder name'}
                        value={newItemName}
                        className="text-black"
                        onChange={(e) => setNewItemName(e.target.value)}
                    />
                    <button onClick={handleCreate}>Create</button>
                    <button onClick={() => setCreating(null)}>Cancel</button> {/* Cancel button */}
                </div>
            )}
            
            {renderTree(treeData)} {/* Render the tree */}
        </div>
    );
}

export default RootDirectory;
