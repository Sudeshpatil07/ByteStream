import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"], //The queryKey is a unique identifier for the query you're making.
    queryFn: getAuthUser,
    retry: false, //auth check
  });
  return { isLoading: authUser.isLoading, authUser: authUser.data?.user };
};

export default useAuthUser;
