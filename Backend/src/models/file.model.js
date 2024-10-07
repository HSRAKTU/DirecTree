import mongoose, { Schema } from 'mongoose';

const fileSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    folderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    fileType:{
        type: String,
        required: true
    }
},{timestamps:true});

export const File = mongoose.model("File",fileSchema);