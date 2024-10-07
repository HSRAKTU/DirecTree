import mongoose, { Schema } from 'mongoose';

const folderSchema = new Schema({
    name:{
        type: String,
        required: true,
    },
    parentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
}, {timestamps : true});

export const Folder = mongoose.model("Folder",folderSchema);