import { useState, useEffect, useCallback } from "react";
import { User, LoginInput, RegisterInput } from "@workspace/api-client-react";
import { useLogin, useRegister, useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { setAccessToken, clearAccessToken, refreshAccessToken } from "@/lib/api";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const { data: serverUser, isLoading: isLoadingUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), enabled: ready, retry: false },
  });
  useEffect(() => {
    let active = true;
    void refreshAccessToken().then(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (serverUser && !signedOut) setUser(serverUser);
  }, [serverUser, signedOut]);
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const login = useCallback(async (credentials: LoginInput) => {
    const response = await loginMutation.mutateAsync({ data: credentials });
    setSignedOut(false);
    setAccessToken(response.token);
    setUser(response.user);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
    setReady(true);
    return response;
  }, [loginMutation, queryClient]);
  const register = useCallback(async (data: RegisterInput) => {
    const response = await registerMutation.mutateAsync({ data });
    setAccessToken(response.token);
    setUser(response.user);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
    setReady(true);
    return response;
  }, [registerMutation, queryClient]);
  const logout = useCallback(async () => {
    try {
      await fetch((import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\\/$/, "")) + "/api/auth/logout", {
        method: "POST", credentials: "include",
      });
    } finally {
      setSignedOut(true);
      clearAccessToken();
      setUser(null);
      queryClient.clear();
      setLocation("/login");
    }
  }, [queryClient, setLocation]);
  return {
    user: signedOut ? null : (serverUser ?? user),
    isLoading: !ready || (isLoadingUser && !user),
    isAuthenticated: !signedOut && !!(serverUser ?? user),
    login, register, logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: false,
  };
}
