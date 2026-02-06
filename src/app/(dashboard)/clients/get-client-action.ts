'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Client } from "@/types";

export async function getClient(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data as Client;
}
