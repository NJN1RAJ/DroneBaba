import { Request, Response } from "express";
import {
  cropModel,
  DroneInfoModel,
  jobModel,
  OtherDetailModel,
} from "../models/models";

export const createJob = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;
  const { date, timeSlot, price } = req.body;
  const droneId = req.params.droneId;
  const cropId = req.params.cropId;

  if (!date || !timeSlot) {
    res.status(400).json({
      message: "Please fill in all the details",
    });
    return;
  }

  try {
    const user = await OtherDetailModel.findOne({ userId })?.populate(
      "userId",
      "-password"
    );

    const drone = await DroneInfoModel.findById(droneId).select(
      "name type capacity durability pricePerAcre"
    );

    const crop = await cropModel.findById(cropId).select("farmLocation area");

    if (!crop) {
      res.status(404).json({
        message: "Crop not found",
      });
    }

    const scheduleOfDrone = await DroneInfoModel.findById(droneId).select(
      "schedule"
    );

    if (!drone) {
      res.status(404).json({
        message: "No drone found with the same ID",
      });
    }

    if (
      scheduleOfDrone?.schedule?.some(
        (s) => s.date === date && s.timeSlot === timeSlot
      )
    ) {
      res.status(400).json({
        message: "Drone booked at this time already",
      });
      return;
    }

    //@ts-ignore
    if (user.userId?.role === "Drone Owner" || user.userId?.role === "Pilot") {
      res.status(400).json({
        message: "Only farmers and admins are allowed to create jobs",
      });
      return;
    }

    if (!user) {
      res.status(404).json({
        message:
          "Other details for farmer not found please fill in the details first",
      });
      return;
    }

    const job = await jobModel.create({
      date,
      farmLocation: crop?.farmLocation,
      payDetails: price,
      time: timeSlot,
      //@ts-ignore
      createdBy: user.userId._id,
      droneId: drone?._id,
      farmArea: crop?.area,
      farmerMobile: user.whatsapp_number,
    });

    const populatedJob = await job.populate([
      { path: "createdBy", select: "name email role" },
      { path: "droneId", select: "name type capacity durability pricePerAcre" },
    ]);

    res.status(200).json({
      message: "Job created successfully",
      job: populatedJob,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error " + error,
    });
    return;
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await jobModel
      .find({ acceptedBy: { $exists: false } })
      .populate("droneId")
      .populate({ path: "createdBy", select: "-password" });

    res.status(200).json({
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getUpdates = async (req: Request, res: Response) => {
  try {
    let lastJobCheck = new Date();
    let checkCount = 0;
    const maxChecks = 15; // Maximum number of checks (5 checks * 2 seconds = 10 seconds)
    let isResponseSent = false; // Flag to track if response has been sent

    // Set a timeout to end the request after 30 seconds if no new jobs are found
    const timeOut = setTimeout(() => {
      if (!isResponseSent) {
        isResponseSent = true;
        res.status(204).send();
      }
    }, 30000);

    // Function to check for new jobs
    const checkForUpdates = async () => {
      // Stop further checks if response has already been sent or max checks reached
      if (isResponseSent || checkCount >= maxChecks) {
        return;
      }

      try {
        const newJobs = await jobModel.find({
          timestamp: { $gt: lastJobCheck },
          acceptedBy: { $exists: false },
        });

        checkCount++;

        if (newJobs.length > 0 && !isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeOut);
          res.status(200).json({ newJobs });
          return; // Stop further checks
        }

        // Schedule the next check only if response hasn't been sent and max checks not reached
        if (checkCount < maxChecks && !isResponseSent) {
          setTimeout(checkForUpdates, 2000);
        }
      } catch (error) {
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeOut);
          res.status(500).json({
            message: "Error checking for updates",
          });
        }
      }
    };

    // Start checking for updates immediately
    await checkForUpdates();

    // Clean up when the client closes the connection
    req.on("close", () => {
      clearTimeout(timeOut);
      isResponseSent = true; // Prevent further checks
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
};
