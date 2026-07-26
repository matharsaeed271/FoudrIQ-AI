import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      if (!user?.id) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", user?.id], data);
    },
  });

  return {
    profile: query.data ?? null,
    loading: authLoading || query.isLoading,
    error: query.error,
    update: mutation.mutateAsync,
    updating: mutation.isPending,
    refetch: query.refetch,
  };
}

// Resolves a signed URL for a stored avatar path (private bucket).
export function useAvatarUrl(pathOrUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//i.test(pathOrUrl)) {
      setUrl(pathOrUrl);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(pathOrUrl, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathOrUrl]);
  return url;
}
