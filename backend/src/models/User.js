import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const userScheme = new mongoose.Schema(
  {
    fullName: {
      type: String,
      requird: true,
    },
    email: {
      type: String,
      requird: true,
      unique: true,
    },
    password: {
      type: String,
      requird: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    nativeLanguage: {
      type: String,
      default: "",
    },
    LearningLanguage: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: "false",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userScheme.pre("save", async function (next) {
  // This is a Mongoose middleware function that runs before a user document is saved to the database — that’s what pre("save") means.
  if (!this.isModified("password")) return next(); //Skip if the password isn't chaange
  try {
    const salt = await bcrypt.genSalt(10); //bcrypt.genSalt(10) generates a random cryptographic salt.
    this.password = await bcrypt.hash(this.password, salt); //This hashes the user's plaintext password using the generated salt.
    // Then it replaces the original password in the document with the hashed version.
    next(); //This tells Mongoose that your middleware logic is done and the save can continue
  } catch (error) {
    next(error); //pass the error to Mongoose
  }
});
userScheme.methods.matchPassword = async function (enterdpasword) {
  const isPasswordCorrect = await bcrypt.compare(enterdpasword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userScheme);

export default User;
