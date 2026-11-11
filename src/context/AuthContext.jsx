
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser(session) {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(session.user);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .single();

    if (error || !data) {
      setProfile(null);
    } else {
      setProfile(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        await loadUser(data.session);
      }
    }

    initialize();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              loadUser(session);
            }
          }, 0);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const { data: adminProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", data.user.id)
        .single();

    if (
      profileError ||
      !adminProfile ||
      !["admin", "staff"].includes(adminProfile.role)
    ) {
      await supabase.auth.signOut();

      return {
        success: false,
        message: "You are not authorised to access the admin dashboard."
      };
    }

    setUser(data.user);
    setProfile(adminProfile);

    return { success: true };
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, message: error.message };
    }

    setUser(null);
    setProfile(null);

    return { success: true };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
