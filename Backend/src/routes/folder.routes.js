import {Router} from "express";
import { createFolder,deleteFolder,getSubfoldersAndFiles,moveFolder,renameFolder } from "../controllers/folder.controller.js";

const router = Router();

router.route("/create").post(createFolder);
router.route("/rename").patch(renameFolder);
router.route("/sub").get(getSubfoldersAndFiles);
router.route("/delete").delete(deleteFolder);
router.route("/move").patch(moveFolder);
export default router;
