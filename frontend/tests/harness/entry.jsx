import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./fakeBackend";

import CitizenHome from "../../src/pages/citizen/CitizenHome";
import Services from "../../src/pages/citizen/Services";
import QueuePreview from "../../src/pages/citizen/QueuePreview";
import ActiveToken from "../../src/pages/citizen/ActiveToken";
import PeakHours from "../../src/pages/citizen/PeakHours";
import OperatorQueue from "../../src/pages/operator/OperatorQueue";
import App from "../../src/App";

const PAGES = { CitizenHome, Services, QueuePreview, ActiveToken, PeakHours, OperatorQueue, App };
const user = { name: "Asha Rao", email: "a@x.in", role: "citizen" };

let root = null;
window.__render = (page, params = {}, { strict = false, path } = {}) => {
  window.__params = params;
  if (path) window.__path = path;
  const Page = PAGES[page];
  root ??= createRoot(document.getElementById("root"));
  const el = <Page user={user} />;
  root.render(strict ? <StrictMode>{el}</StrictMode> : el);
};
window.__unmount = () => {
  root?.unmount();
  root = null;
};
