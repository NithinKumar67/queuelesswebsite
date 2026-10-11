import { createContext, useContext } from "react";

// Lets Login / logout buttons update the user held by <App />.
// Without this, App kept the value read at page load, so after an in-app
// login every page still received `user = null` (admin pages redirected back
// to /login) and after logout the previous user's name stayed on screen.
export const AuthContext = createContext({ user: null, setUser: () => {} });

export const useAuth = () => useContext(AuthContext);
