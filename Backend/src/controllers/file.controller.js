import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { File } from "../models/file.model.js";
import { Folder } from "../models/folder.model.js";

// Helper function to check for name conflicts
const checkFileNameConflict = async (name, fileType, folderId) => {
    const existingFile = await File.findOne({ name, folderId });

    // If a file with the same name exists, check if fileType is the same
    if (existingFile && existingFile.fileType === fileType) {
        throw new ApiError(409, "A file with the same name and type already exists in this folder");
    }
};

const createFile = asyncHandler(async (req, res) => {
    const { name, folderId, fileType } = req.body;

    if (!name || !fileType) {
        throw new ApiError(400, "File name and fileType are required");
    }
    
    // Check if folderId exists, allowing for null (root folder)
    if (folderId !== null) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            throw new ApiError(404, "Folder not found");
        }
    }   

    await checkFileNameConflict(name, fileType, folderId);

    const file = await File.create({
        name,
        folderId,
        fileType,
    });

    if (!file) {
        throw new ApiError(500, "File creation failed");
    }
    console.log("New File created");
    return res.status(201).json(
        new ApiResponse(200, file, "File created successfully.")
    );
});

const renameFile = asyncHandler(async (req, res) => {
    const { fileId, newName, newFileType } = req.body;

    // Validate inputs
    if (!fileId || !newName) {
        throw new ApiError(400, "fileId and newName are required");
    }

    // Find the file by ID
    const file = await File.findById(fileId);
    if (!file) {
        throw new ApiError(404, "File not found");
    }

    // Check for name conflict with the new name and fileType
    await checkFileNameConflict(newName, newFileType || file.fileType, file.folderId);

    // Update file name and type
    file.name = newName;
    if (newFileType) {
        file.fileType = newFileType; // Update file type if provided
    }
    
    await file.save();
    console.log("A file was renamed");
    return res.status(200).json(new ApiResponse(200, file, "File renamed successfully"));
});

const deleteFile = asyncHandler(async (req, res) => {
    const { fileId } = req.query;

    if (!fileId) {
        throw new ApiError(400, "fileId is required");
    }

    const file = await File.findById(fileId);
    if (!file) {
        throw new ApiError(404, "File not found");
    }

    await File.deleteOne({ _id: fileId });
    console.log("A file was deleted.")
    res.status(200).json(new ApiResponse(200, null, "File deleted successfully"));
});

const moveFile = asyncHandler(async (req, res) => {
    const { fileId, targetFolderId } = req.body;
    console.log("targetFolderRecieved:", targetFolderId);
    if (!fileId) {
        throw new ApiError(400, "fileId is required");
    }

    // Find the file to move
    const file = await File.findById(fileId);
    if (!file) {
        throw new ApiError(404, "File not found");
    }

    // Check if the target folder exists or is null (for root directory)
    const targetFolder = targetFolderId ? await Folder.findById(targetFolderId) : null;

    // If targetFolderId is provided, validate its existence
    if (targetFolderId && !targetFolder) {
        throw new ApiError(404, "Target folder not found");
    }

    // Update the file's folderId
    console.log("Desired targetFolderId:", targetFolderId)
    file.folderId = targetFolderId; // This can be null if moving to root
    await file.save();

    console.log("A file was moved")
    res.status(200).json(new ApiResponse(200, file, "File moved successfully"));
});

export {
    createFile,
    renameFile,
    deleteFile,
    moveFile
}