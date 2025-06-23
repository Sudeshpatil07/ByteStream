import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api";

const useSignUp = () => {
  const queryClient = useQueryClient();
  //Mutation
  const {
    mutate, 
    isPending,
    error,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });
  //invalidateQueries in React Query (TanStack Query) is used to manually tell React Query to refetch specific data.
  // The basic info:
  //When you mutate data (e.g., create, update, or delete something), the cached data might become outdated.
  //So, to make sure your UI is showing the latest info, you use invalidateQueries to refetch that data.
  //why we should have to useMutation insted of the axios
  //because     1.Automatically tracks isPending, isSuccess, isError
  //            2.Easily handles side effects (onSuccess, onError)
  //            3.Works with cache updates (invalidateQueries, etc.)
return{isPending,error,signupMutation:mutate}

};

export default useSignUp;
