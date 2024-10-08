import express from 'express';
import cors from 'cors'
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//routes import
import folderRouter from './routes/folder.routes.js';
import fileRouter from './routes/file.routes.js'
//routes declaration
app.use("/api/v1/folders",folderRouter);
app.use("/api/v1/files",fileRouter);


export { app };