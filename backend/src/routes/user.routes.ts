import express from "express";
import {
  getAllUsers,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "../controllers/user.controller";
import { verifyUser } from "../utils/verifyUser";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", verifyUser, getUser); //headers required
router.put("/updateUser", verifyUser, updateUser);
router.post("/logout", verifyUser, logoutUser); //headers required
router.get("/getAllUsers", verifyUser, getAllUsers);

export default router;
