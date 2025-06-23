import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { data: friendRequests, isLoading } = useQuery({
    //useQuery	Fetch friend requests
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });
  const { mutate: acceptRequestMutation, isPending } = useMutation({
    //useMutation	Handle accepting a request
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] }); //invalidateQueries	Refresh data after a request is accepted
      queryClient.invalidateQueries({ queryKey: ["friend"] }); //queryKey	Used for identifying and invalidating cached data

      //  ["friendRequests"] query is invalidated (refetched).
      // ["friend"] query (list of actual friends) is also invalidated.
      //  Ensures UI stays up-to-date (new friend added, request removed).
    },
  });
  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Notifications
        </h1>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          //incomingRequests
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img
                                src={request.sender.profilePic}
                                alt={request.sender.fullName}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {request.sender.fullName}
                              </h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Native: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Learning: {request.sender.LearningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* Aceept request Notification */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your
                              friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {(incomingRequests.length === 0) &
              (acceptedRequests.length === 0) && <NoNotificationsFound />}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
/*How this Actually Works:-
  When the NotificationsPage is called, useQuery automatically calls getFriendRequests which is in the backend.
  This fetches all friend request data from the backend.
  While loading, isLoading is true.
  Once fetched, the data is stored in friendRequests which is this {
  incomingReqs: [...],  // People who sent me requests
  acceptedReqs: [...]   // People I already accepted
  }
  Suppose the example like this.......

  {
  "incomingReqs": [
    { "_id": "u123", "fullName": "Alice" },
    { "_id": "u456", "fullName": "Bob" }
  ],
  "acceptedReqs": [
    { "_id": "u789", "fullName": "Charlie" }
  ]
}

  In the frontend the actual things are
  1. Now in the frontend:
  const incomingRequests = friendRequests?.incomingReqs || [];


  and the user accepts the request
  2. User Accepts a Request
  You call:
  acceptRequestMutation("u123"); // Accept Alice’s request

  On success:
  React Query invalidates (i.e. clears and refetches) the "friendRequests" query — to get the updated list.
  It also invalidates the "friend" query 
  Now the UI refreshes:
  Alice is removed from incoming requests.
  Alice is added to your friends list.
    */
