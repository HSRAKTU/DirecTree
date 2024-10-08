import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Folder } from "../models/folder.model.js";
import { File } from "../models/file.model.js";


const createFolder = asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;

    if(!name){
        throw new ApiError(400, "name is requied");
    }

    const folderParentId = parentId || null;

    const existingFolder = await Folder.findOne({name, parentId : folderParentId});
    if(existingFolder){
        res
        .status(409)
        .json({message: "same folder exists inside this folder"});
        throw new ApiError(409, "Name coincidence!");
    }

    const folder = await Folder.create({
        name,
        parentId,
    })

    if(!folder){
        res.status(500).json({message: "Folder creation failed"});
        throw new ApiError(500, "Folder creation failed in backend");
    }
    console.log("New Folder created");
    return res.status(201).json(
        new ApiResponse(200, folder,"Folder Created.")
    )
})

const getSubfoldersAndFiles = asyncHandler(async (req, res) => {
    const parentId = req.query.parentId === 'bleh' ? null : req.query.parentId;

    // Check if parentId is provided
    if (parentId === undefined) {
        throw new ApiError(400, "parentId is required");
    }

    let subfolders, files;

    // Check for root folder (parentId is null)
    if (parentId === null) {
        subfolders = await Folder.find({ parentId: null });
        files = await File.find({ folderId: null });
    } else {
        // Check if the parentId exists in the database
        const parentFolder = await Folder.findById(parentId);
        if (!parentFolder) {
            throw new ApiError(404, "Parent folder does not exist");
        }

        subfolders = await Folder.find({ parentId });
        files = await File.find({ folderId: parentId });
    }

    console.log("Subfolders and files fetched");
    res.status(200).json(new ApiResponse(200, { subfolders, files }, "Subfolders and files retrieved successfully"));
});



const renameFolder = asyncHandler(async (req, res) => {
    const { folderId, newName } = req.body;

    // Check if folderId and newName are provided
    if (!folderId || !newName) {
        throw new ApiError(400, "folderId and newName are required");
    }

    // Find the folder by ID
    const folder = await Folder.findById(folderId);
    if (!folder) {
        throw new ApiError(404, "Folder not found");
    }

    // Check if another folder with the same newName exists in the same parent directory
    const existingFolder = await Folder.findOne({ name: newName, parentId: folder.parentId });
    if (existingFolder) {
        throw new ApiError(409, "A folder with the same name already exists in this directory");
    }

    // Rename the folder
    folder.name = newName;
    await folder.save();

    console.log("some folder renamed")
    res.status(200).json(new ApiResponse(200, folder, "Folder renamed successfully"));
});

const deleteFolder = asyncHandler(async (req, res) => {
    const { folderId } = req.query;

    // Check if folderId is provided
    if (!folderId) {
        throw new ApiError(400, "folderId is required");
    }

    // Find the folder by ID
    const folder = await Folder.findById(folderId);
    if (!folder) {
        throw new ApiError(404, "Folder not found");
    }

    // Function to recursively delete subfolders and their files
    const deleteSubfoldersAndFiles = async (folderId) => {
        const subfolders = await Folder.find({ parentId: folderId });

        // Delete all subfolders recursively
        for (const subfolder of subfolders) {
            await deleteSubfoldersAndFiles(subfolder._id); 
            await Folder.deleteOne({ _id: subfolder._id }); 
        }

        // Find and delete all files in the current folder
        await File.deleteMany({ folderId: folderId }); // Delete files in the current folder
    };

    // Delete all subfolders and files in the folder being deleted
    await deleteSubfoldersAndFiles(folderId);

    // Finally, delete the folder itself
    await Folder.deleteOne({ _id: folderId });

    res.status(200).json(new ApiResponse(200, null, "Folder and its contents deleted successfully"));
});


const moveFolder = asyncHandler(async (req, res) => {
    const { folderId, targetParentId } = req.body;

    // Validate inputs
    if (!folderId || !targetParentId) {
        throw new ApiError(400, "folderId and targetParentId are required");
    }

    // Find the folder to move
    const folder = await Folder.findById(folderId);
    if (!folder) {
        throw new ApiError(404, "Folder not found");
    }

    // Check for circular reference
    const targetFolder = await Folder.findById(targetParentId);
    if (!targetFolder) {
        throw new ApiError(404, "Target parent folder not found");
    }

    let currentFolder = targetFolder;
    while (currentFolder) {
        if (currentFolder._id.toString() === folderId) {
            throw new ApiError(400, "Cannot move folder into one of its subfolders");
        }
        currentFolder = await Folder.findById(currentFolder.parentId); // Traverse upwards
    }

    // Update parentId
    folder.parentId = targetParentId;
    await folder.save();
    console.log("A folder was moved")
    res.status(200).json(new ApiResponse(200, folder, "Folder moved successfully"));
});


export { 
    createFolder,
    renameFolder,
    deleteFolder,
    getSubfoldersAndFiles,
    moveFolder
}