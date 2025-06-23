import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
//getRecommendedUsers
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id; // Get the ID of the current user from the request object
    const currentUser = req.user;
    const recommendedusers = await User.find({
      // Find users who are not the current user and not friends with the current user
      $and: [
        // The $and operator is used to combine multiple conditions
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, //exclude current user friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedusers);
  } catch (error) {
    console.error("Error in getrecommendedusers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
//getMyFriends
export async function getMyFriends(req, res) {
  // This function retrieves the friends of the current user
  try {
    //
    const user = await User.findById(req.user.id) // Find the user by their ID, which is obtained from the request object
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage LearningLanguage"
      );
    res.status(200).json(user.friends); // Respond with the user's friends
  } catch (error) {
    console.error("Error in getfriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
//sendFriendRequest
export async function sendFriendRequest(req, res) {
  try {
    const myid = req.user.id; // Get the ID of the current user from the request object
    // Extract the recipient ID from the request parameters
    const { id: recipientId } = req.params;

    if (myid === recipientId) {
      // Check if the recipient ID is the same as the current user's ID
      return res
        .status(400)
        .json({ message: "You cannot add yourself as a friend." });
    }
    // Check if the recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      // If the recipient is not found, it returns a 404 status code with an error message
      return res.status(404).json({ message: "Recipient not found." });
    }
    if (recipient.friends.includes(myid)) {
      // Check if the recipient is already a friend
      return res.status(400).json({ message: "You are already friends." });
    }
    // Check if a friend request already exists between the two users
    // This checks if there is an existing friend request where either the sender or recipient matches the two users.
    // If such a request exists, it means a friend request has already been sent or received
    const exisitingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myid, recipient: recipientId }, // Check if the current user has sent a request to the recipient
        { sender: recipientId, recipient: myid }, // Check if the recipient has sent a request to the current user
      ],
    });
    // If an existing request is found, it means a friend request has already been sent to this user
    if (exisitingRequest) {
      return res
        .status(400)
        .json({ message: "Friend request already sent to this user" });
    }
    // Create a new friend request
    // If no existing request is found, it creates a new friend request document in the database
    const friendRequest = await FriendRequest.create({
      sender: myid, // The ID of the user sending the friend request
      recipient: recipientId, // The ID of the user receiving the friend request
    });
    res.status(201).json(friendRequest); // Respond with the created friend request
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
// acceptFriendRequest
export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "friend request is not found" });
    }
    //verify current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return req
        .status(403)
        .json({ message: "You are not authorized to accecpt this request" });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();
    //add each user to the other friends array
    //addToSet: Is array which adds the element if the elments  are  not already exist
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });
    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

//getFriendRequests
export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage LearningLanguage"
    );
    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");
    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingfriendRequst controller", error.message);
    res.status(200).json({ message: "Internal server error" });
  }
}

//getOutgoingFriendReqs
export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage LearningLanguage"
    );
    res.status(200).json(outgoingReqs);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
