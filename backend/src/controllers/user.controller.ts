import { Request, Response } from "express";
import {
  droneOwnerModel,
  farmerModel,
  pilotModel,
  userModel,
} from "../models/models";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, city, role } = req.body;

  if (!name || !email || !password || !city || !role) {
    res.status(401).json({
      message: "Please fill the required fields",
    });
    return;
  }

  if (password.length < 8 || password.length >= 20) {
    res.status(401).json({
      message: "Password should be between 8 and 20 characters",
    });
    return;
  }

  const user = await userModel.findOne({ email });

  if (user) {
    res.status(401).json({
      message: "Email already registered",
    });
    return;
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      city,
      role,
    });

    if (role === "Drone Owner") {
      await droneOwnerModel.create({
        userId: newUser._id,
      });
    }

    if (role === "Farmer") {
      await farmerModel.create({
        userId: newUser._id,
      });
    }

    if (role === "Pilot") {
      await pilotModel.create({
        userId: newUser._id,
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        city: newUser.city,
        role: newUser.role,
      },
    });
    return;
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    res.status(401).json({
      message: "Email not registered yet. Please register yourself.",
    });
    return;
  }

  try {
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({
        message: "Incorrect credentials",
      });
      return;
    }

    const token = jwt.sign({ userId: user._id }, `${process.env.SECRET_KEY}`);

    res.cookie("access_token", token);
    // localStorage.setItem("access_token",token)

    res.status(201).json({
      message: "User logged in successfully",
      token,
      role: user.role,
    });
    return;
  } catch (error) {
    console.log("Error is " + error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const getUser = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;

  const user = await userModel.findById({ _id: userId }).select("-password");

  if (!user) {
    res.status(401).json({
      message: "User id not matched",
    });
    return;
  }

  try {
    res.status(201).json({
      user,
    });
    return;
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("access_token");
  // localStorage.removeItem("access_token");
  res.status(201).json({
    message: "You are logged out",
  });
  return;
};

export const updateUser = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.user;
  const { name, email, city } = req.body;

  if (!name || !email || !city) {
    res.status(400).json({
      message: "Please fill all the required fields",
    });
    return;
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({
        message: "Please register yourself first",
      });
      return;
    }

    const existingEmail = await userModel.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingEmail) {
      res.status(409).json({
        message: "Email already in use by some another user",
      });
      return;
    }

    user.name = name;
    if (user.email !== email) {
      user.email = email;
    }
    user.city = city;
    await user.save();

    res.status(201).json({
      message: "User updated successfully",
      user,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error" + error,
    });
    return;
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find().select("-password");
    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};
