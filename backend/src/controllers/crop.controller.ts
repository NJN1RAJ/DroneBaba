import { Request, Response } from "express";
import { cropModel, farmerModel } from "../models/models";

export const createCrop = async (req: Request, res: Response) => {
  const { name, area, type, season, prevCropName, farmLocation, farmName } =
    req.body;
  //@ts-ignore
  const userId = req.user;

  if (
    !name ||
    !area ||
    !type ||
    !season ||
    !prevCropName ||
    !farmLocation ||
    !farmName
  ) {
    res.status(403).send({
      message: "Please fill all the required fields",
    });
    return;
  }

  const farmer = await farmerModel.findOne({ userId });

  if (!farmer) {
    res.status(403).json({
      message: "User is not registered as farmer",
    });
    return;
  }

  try {
    const crops = farmer?.crops;
    const crop = await cropModel.create({
      userId,
      name,
      area,
      type,
      season,
      prevCropName,
      farmLocation,
      farmName,
    });

    crops?.push(crop._id);
    await farmer?.save();

    res.status(201).json({
      message: "Crop added successfully",
      cropId: crop._id,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error" + error,
    });
    return;
  }
};

export const getCrop = async (req: Request, res: Response) => {
  const cropId = req.params.cropId;
  if (!cropId) {
    res.status(404).json({
      message: "Crop ID not recieved",
    });
    return;
  }

  try {
    const crop = await cropModel.findById(cropId);
    if (!crop) {
      res.status(404).json({
        message:
          "Crop registered with the cropID not found, please check the crop ID",
      });
      return;
    }
    res.status(201).json({
      crop,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const getAllCrops = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;

  try {
    const farmer = await farmerModel.findOne({ userId }).populate("crops");

    if (!farmer) {
      res.status(404).json({
        message: "Farmer not found",
      });
      return;
    }

    if (farmer.crops.length === 0) {
      res.status(401).json({
        message: "No crops added please add crops",
      });
      return;
    }

    res.status(200).json({
      crops: farmer.crops,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error " + error,
    });
    return;
  }
};
