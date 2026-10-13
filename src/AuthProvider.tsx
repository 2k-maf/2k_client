import React, {createContext, useState, useEffect, useContext, ReactElement, useMemo} from "react";
import {jwtDecode, JwtPayload } from "jwt-decode";
import axios from "./axios";

type User = {
  _id?: string;
  authType: 'Клуб' | 'Учасник';
  name: string;
  nickname: string;
  email: string;
  avatarUrl?: string;
  /** Email прив'язаного Google-акаунта. Відсутній, якщо Google не прив'язано. */
  googleEmail?: string;
} & JwtPayload

// Create Auth Context
const AuthContext = createContext({
  user: null as User | null,
  token: null as string | null,
  setToken: (token: string) => {},
  logout: () => {},
  /** Клуб або гравець зі значком ведучого: може проводити рейтингові ігри. */
  canRecordRatingGame: false,
  /** Гравець має значок ведучого хоча б в одному клубі. */
  isHost: false,
  // getUser: () => null as User | null,
});

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactElement }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem("jwt_token") || null);
  const [user, setUser_] = useState(null as User | null);
  const [isHost, setIsHost] = useState(false);

  // Function to set the authentication token
  const setToken = (newToken: string) => setToken_(newToken);
  const setUser = (newUser: User | null) => setUser_(newUser);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem('jwt_token',token);

      try {
        const user = jwtDecode(token) as User;
        setUser(user);
        if ((user?.exp || 0) * 1000 < Date.now()) logout();
      } catch (e) {
        // logout();
      }

    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem('jwt_token')
    }
    
  }, [token]);

  // Значок ведучого не лежить у JWT: клуб видає й забирає його будь-коли,
  // а токен живе тиждень. Тому питаємо сервер після кожного входу.
  useEffect(() => {
    if (user?.authType !== 'Учасник') {
      setIsHost(false);
      return;
    }
    let cancelled = false;
    axios.get('/user/clubs')
      .then(({ data }) => {
        if (!cancelled) setIsHost((data.items || []).some((club: any) => club.isHost));
      })
      .catch(() => {
        if (!cancelled) setIsHost(false);
      });
    return () => { cancelled = true; };
  }, [user?._id, user?.authType]);

  // Check JWT validity
  // useEffect(() => {
  //   const token = localStorage.getItem("jwt_token");
  //   if (token) {
  //     validateAndGetUser(token);
  //   }
  // }, []);

  // const validateAndGetUser = (token: string) => {
  //   try {
  //     const decoded = jwtDecode<User>(token);
  //     if ((decoded?.exp || 0) * 1000 > Date.now()) {
  //       setUser(() => decoded);
  //       return decoded;
  //     } else {
  //       localStorage.removeItem("jwt_token"); // Expired Token
  //       setUser(() => null);
  //     }
  //   } catch (error) {
  //     console.error("Invalid token", error);
  //     setUser(() => null);
  //   }
  //   return null;
  // }

  // Login function
  // const login = (token: string) => {
  //   localStorage.setItem("jwt_token", token);
  // };

  // Logout function
  const logout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
  };

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      user,
      setToken,
      logout,
      isHost,
      canRecordRatingGame: user?.authType === 'Клуб' || isHost,
    }),
    [token, user, isHost]
  );

  // const getUser = () => {
  //   const jwt = localStorage.getItem("jwt_token") || null;
  //   if (!jwt) return null;
  //   return validateAndGetUser(jwt);
  //   // return user;
  // };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to Access Auth
export const useAuth = () => useContext(AuthContext);
