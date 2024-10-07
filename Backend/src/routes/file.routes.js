import {Router} from "express";
import { createFile, deleteFile, moveFile, renameFile } from "../controllers/file.controller.js";

const router = Router();

router.route("/create").post(createFile);
router.route("/rename").patch(renameFile);
router.route("/delete").delete(deleteFile);
router.route("/move").patch(moveFile);

export default router;