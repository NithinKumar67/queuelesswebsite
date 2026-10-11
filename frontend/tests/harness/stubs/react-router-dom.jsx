// Minimal stand-in for react-router-dom: exact-path routing + navigation tracking.
import { useEffect, useSyncExternalStore } from "react";

window.__nav = [];
window.__path = window.__path || "/";
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const usePath = () => useSyncExternalStore(subscribe, () => window.__path);
const go = (to) => {
  window.__nav.push(to);
  window.__path = String(to).split("?")[0];
  listeners.forEach((l) => l());
};

export const useNavigate = () => go;
export const useParams = () => window.__params || {};
export const useLocation = () => ({ pathname: usePath() });
export const BrowserRouter = ({ children }) => children;
export const Route = () => null;
export const Routes = ({ children }) => {
  const path = usePath();
  const match = [].concat(children).find((c) => c?.props?.path === path);
  return match ? match.props.element : null;
};
export const Link = ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>;
export const NavLink = ({ to, children, className, end, ...rest }) => (
  <a href={to} className={typeof className === "function" ? className({ isActive: false }) : className} {...rest}>{children}</a>
);
export const Navigate = ({ to }) => { useEffect(() => { go(to); }, [to]); return null; };
export const useSearchParams = () => [new URLSearchParams(), () => {}];
