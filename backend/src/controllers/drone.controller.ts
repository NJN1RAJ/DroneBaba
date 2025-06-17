import { Request, Response } from "express";
import {
  DroneInfoModel,
  droneOwnerModel,
  pilotModel,
  userModel,
} from "../models/models";

export const addDrone = async (req: Request, res: Response) => {
  const {
    name,
    type,
    capacity,
    pricePerAcre,
    durability,
    purchasedDate,
    isNGO,
    ngoName,
  } = req.body; //puchasedDate to be passed in format of 'YYYY-MM-DD'
  // @ts-ignore
  const userId = req.user;
  const user = await userModel.findById(userId).select("role");
  const userRole = user?.role;

  if (
    !name ||
    !type ||
    !capacity ||
    !pricePerAcre ||
    !durability ||
    !purchasedDate ||
    !isNGO
  ) {
    res.status(404).json({
      message: "Please fill all the required fields",
    });
    return;
  }

  if (userRole === "Farmer" || userRole === "Pilot") {
    res.status(401).json({
      message: "Only drone owners are allowed to add drones",
    });
    return;
  }

  try {
    const drone = await DroneInfoModel.create({
      userId,
      name,
      type,
      capacity,
      durability,
      purchasedDate,
      pricePerAcre,
      isNGO,
      ngoName,
      schedule: [],
    });
    const droneId = drone._id;
    const droneOwnerData = await droneOwnerModel.findOne({ userId });
    droneOwnerData?.drones.push(droneId);
    await droneOwnerData?.save();
    res.status(201).json({
      droneId: droneId,
      message: "Drone information added successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error " + error,
    });
    return;
  }
};

export const getDroneDetails = async (req: Request, res: Response) => {
  const droneId = req.params.droneId;
  //@ts-ignore
  const userId = req.user;

  try {
    const userRole = await userModel.findById(userId).select("role");
    if (userRole?.role === "Farmer" || userRole?.role === "Pilot") {
      res.status(403).json({
        message:
          "Only drone owners and admins are allowed to fetch the details",
      });
      return;
    }
    const droneDets = await DroneInfoModel.findById(droneId);
    res.status(201).json({
      droneDetail: droneDets,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error " + error,
    });
    return;
  }
};

export const getAllDroneOfDroneOwner = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;
  try {
    const drones = await droneOwnerModel.findOne({ userId }).populate("drones");
    if (!drones) {
      res.status(404).json({
        message: "No drone owner found",
      });
      return;
    }

    if (drones.drones.length === 0) {
      res.status(404).json({
        message: "No drones added, please add drones",
      });
    }

    res.status(200).json({
      drones: drones.drones,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  //change hone wala hai
  const { date, timeSlot } = req.body;
  const droneId = req.params.droneId;
  //@ts-ignore
  const userId = req.user;

  const user = await userModel.findById(userId).select("role");
  const userRole = user?.role;

  if (userRole === "Farmer") {
    res.status(401).json({
      message: "Only drone owners or pilots are allowed to delete schedule.",
    });
    return;
  }

  try {
    const droneInfo = await DroneInfoModel.findById(droneId).select("schedule");

    const schedule = droneInfo?.schedule;

    const newSchedule = schedule?.filter((s) => {
      return !(s.date === date && s.timeSlot === timeSlot);
    });

    const pilot = await pilotModel.findOne({ userId });

    const pilotSchedule = pilot?.schedule;

    const newPilotSchedule = pilotSchedule?.filter((s) => {
      return !(s.date === date && s.timeSlot === timeSlot);
    });

    if (pilot?.schedule && newPilotSchedule) {
      pilot.schedule = newPilotSchedule;
    }

    if (schedule) {
      if (schedule.length === newSchedule?.length) {
        res.status(401).json({
          message: "Invalid date and time slot",
        });
        return;
      }
    }

    if (newSchedule && droneInfo) {
      droneInfo.schedule = newSchedule;
    }

    await droneInfo?.save();
    await pilot?.save();
    res.status(201).json({
      message: "Schedule successfully deleted",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error" + error,
    });
    return;
  }
};

export const getAllDrones = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;

  try {
    const drones = await DroneInfoModel.find().select(
      "name type capacity durability pricePerAcre"
    );

    res.status(200).json({
      drones,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getScheduleOfDrone = async (req: Request, res: Response) => {
  const droneId = req.params.droneId;
  try {
    const drone = await DroneInfoModel.findById(droneId);
    const schedule = drone?.schedule;
    if (schedule?.length === 0) {
      res.status(404).json({
        message: "No schedule for the drone exists",
      });
      return;
    }
    res.status(200).json({
      schedule,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const getScheduleOfPilot = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;
  const pilot = await pilotModel.findOne({ userId }).select("schedule");
  if (!pilot) {
    res.status(404).json({
      message: "User not found in Pilot Model",
    });
    return;
  }

  try {
    res.status(200).json({
      schedule: pilot.schedule,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const updateDroneDetails = async (req: Request, res: Response) => {
  const droneId = req.params.droneId;
  const { pricePerAcre } = req.body;
  //@ts-ignore
  const userId = req.user;

  if (!pricePerAcre) {
    res.status(404).json({
      message: "Please fill all the required fields",
    });
    return;
  }

  try {
    const drone = await DroneInfoModel.findById(droneId);
    if (!drone) {
      res.status(404).json({
        message: "Drone not found",
      });
      return;
    }

    drone.pricePerAcre = pricePerAcre;

    await drone.save();

    res.status(200).json({
      message: "Drone details updated successfully",
      drone,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error " + error,
    });
  }
};
