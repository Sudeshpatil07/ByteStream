import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

//signup
export async function signup(req, res) {
  const { email, password, fullName } = req.body;
  //when user want to sign up then they are going to send you there full name emailid  and password we would like to fetch all of them under the request.body
  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const exisitingUser = await User.findOne({ email });
    if (exisitingUser) {
      return res
        .status(400)
        .json({ message: "Email already exist, please try different one!" });
    }
    const idx = Math.floor(Math.random() * 100) + 1; //generate a number between one and hundred
    const randomAvatar = `https://api.dicebear.com/9.x/adventurer/svg?seed=${idx}`;
    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user is created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream User:", error);
    }

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("jwt", token, {
      // jwt:The name of the cookie. You’re storing the token in a cookie called jwt.
      //  token: The value of the cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //This sets the lifetime of the cookie to 7 days.
      httpOnly: true, //Blocks access from client-side JS-side JS
      sameSite: "strict", //Prevents the cookie from being sent in cross-site requests
      secure: process.env.NODE_ENV === "production",
    });
    res.status(201).json({ success: true, User: newUser });
  } catch (error) {
    console.log("Error in sign up controller", error);
    res.status(500).json({ message: " Internal Server Error" });
  }
}

//Login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All field are required!" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: " Internal Server Error" });
  }
}
//logoot
export async function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successfully" });
}
//onboarding
export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, LearningLanguage, location } =
      req.body;
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !LearningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !LearningLanguage && "LearningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );
    //Stream
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(
        `Stream user is updated after unboarding  for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.log(
        "Error in updating Stream user while onboarding ",
        streamError.message
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
