import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null); //The Stream Chat client instance (chatClient)
  const [channel, setChannel] = useState(null); //The chat channel object (channel)
  const [loading, setLoading] = useState(true); //The loading state while setting up chat

  const { authUser } = useAuthUser();
  const { data: tokenData } = useQuery({
    // used to fetch the Stream Chat token needed to connect.
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, //do not run the queryFn until we had the authenticated state
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return; // don’t proceed unless both the Stream Chat token (tokenData.token) and the authenticated user (authUser) are available.
      try {
        console.log("Initilizing stream Chat Client....");
        const client = StreamChat.getInstance(STREAM_API_KEY); //Connects to your Stream Chat backend
        await client.connectUser(
          //Authenticates the logged-in user
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const ChannelId = [authUser._id, targetUserId].sort().join("-");
        //channelID you and Me
        //if  i start a chat => ChannelId: [myId, yourId]
        //if  you start a chat => ChannelId: [yourId, myId]
        //here there are different arrays but same channel but computer cannot understand this
        //so  line no. 44 is important to shoe us th difference
        //This avoids creating two separate channels for the same conversation.

        const currChannel = client.channel("messaging", ChannelId, {
          members: [authUser._id, targetUserId],
        }); //either create or connect to a 1-to-1 "messaging" channel between the two users.

        await currChannel.watch(); //tells the Stream client to start listening to events and loading message history on this channel.
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.log("Error Intializing chat:", error);
        toast.error("Could Not connect to chat. please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
      toast.success("Video call link is sent successfully!");
    }
  };
  if (loading || !chatClient || !channel) return <ChatLoader />;
  //If the setup is not ready (loading, chatClient, or channel is missing), it returns a loading spinner component.

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
