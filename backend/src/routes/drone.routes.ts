import express from "express";
import { verifyUser } from "../utils/verifyUser";
import {
  addDrone,
  deleteSchedule,
  getAllDroneOfDroneOwner,
  getAllDrones,
  getDroneDetails,
  getScheduleOfDrone,
  getScheduleOfPilot,
  updateDroneDetails,
} from "../controllers/drone.controller";

const router = express.Router();

router.post("/addDrone", verifyUser, addDrone);
router.get("/getDroneDetails/:droneId", verifyUser, getDroneDetails);
router.delete("/deleteSchedule/:droneId", verifyUser, deleteSchedule);
router.get("/getAllDroneOfDroneOwner", verifyUser, getAllDroneOfDroneOwner);
router.get("/getAllDrones", verifyUser, getAllDrones);
router.get("/getScheduleOfDrone", verifyUser, getScheduleOfDrone);
router.get("/getScheduleOfPilot", verifyUser, getScheduleOfPilot);
router.put("/updateDroneDetails/:droneId", verifyUser, updateDroneDetails);

export default router;
