import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Farmer", "Pilot", "Drone Owner", "Admin"],
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const userModel = mongoose.model("User", userSchema);

const locationAndOtherDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  address: String,
  taluka: String,
  whatsapp_number: Number,
  contact_number: Number,
  aadhar_number: Number,
  pan_number: String,
  pinCode: Number,
  state: String,
});

export const OtherDetailModel = mongoose.model(
  "OtherDetail",
  locationAndOtherDetailSchema
);

const cropSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  name: String,
  area: String,
  type: String,
  season: String,
  prevCropName: String,
  farmLocation: String,
  farmName: String,
});

export const cropModel = mongoose.model("Crop", cropSchema);

const farmerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  crops: [{ type: mongoose.Types.ObjectId, ref: "Crop" }],
});

export const farmerModel = mongoose.model("Farmer", farmerSchema);

const licenseDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  licenseNumber: String,
  validUpto: String,
  flyingExp: String,
  licenseType: String,
  flyingDroneType: String,
  FIR: {
    type: String,
    enum: ["yes", "no"],
  },
});

export const licenseDetailModel = mongoose.model(
  "LicenseDetail",
  licenseDetailSchema
);

const droneInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  name: String,
  type: String,
  capacity: String,
  durability: String,
  purchasedDate: Date,
  pricePerAcre: Number,
  isNGO: {
    type: String,
    enum: ["yes", "no"],
  },
  ngoName: String,
  schedule: [{ type: Object }],
});

export const DroneInfoModel = mongoose.model("DroneInfo", droneInfoSchema);

const droneOwnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  drones: [{ type: mongoose.Types.ObjectId, ref: "DroneInfo" }],
});

export const droneOwnerModel = mongoose.model("DroneOwner", droneOwnerSchema);

const pilotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  schedule: [
    {
      type: Object,
    },
  ],
});

export const pilotModel = mongoose.model("Pilot", pilotSchema);

const jobSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  farmLocation: {
    type: String,
    rqeuired: true,
  },
  payDetails: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  droneId: {
    type: mongoose.Types.ObjectId,
    ref: "DroneInfo",
  },
  acceptedBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  farmArea: {
    type: String,
    required: true,
  },
  farmerMobile: {
    type: String,
    required: true,
  },
});

export const jobModel = mongoose.model("Job", jobSchema);
