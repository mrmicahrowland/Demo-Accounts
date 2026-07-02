import { useState, useEffect, useCallback } from "react";
import { User, LoginInput, RegisterInput, AuthResponse } from "@workspace/api-client-react";
import { useLogin, useRegister, useGetCurrentUser, useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Try to read user from local storage initially
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("auth_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const { data: serverUser, isLoading: isLoadingUser } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      enabled: !!localStorage.getItem("auth_token"),
      retry: false,
    }
  });

  // Sync user state if it changes from server
  useEffect(() => {
    if (serverUser && (!user || serverUser.id !== user.id)) {
      setUser(serverUser);
      localStorage.setItem("auth_user", JSON.stringify(serverUser));
    }
  }, [serverUser, user]);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = useCallback(
    async (credentials: LoginInput) => {
      const response = await loginMutation.mutateAsync({ data: credentials });
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user);
      queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
      return response;
    },
    [loginMutation, queryClient]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      const response = await registerMutation.mutateAsync({ data });
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setUser(response.user);
      queryClient.setQueryData(getGetCurrentUserQueryKey(), response.user);
      return response;
    },
    [registerMutation, queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync({});
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
      queryClient.clear();
      setLocation("/login");
    }
  }, [logoutMutation, queryClient, setLocation]);

  return {
    user,
    isLoading: isLoadingUser,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
