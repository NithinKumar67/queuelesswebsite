import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [join(here, "entry.jsx")],
  bundle: true,
  outfile: join(here, "dist/bundle.js"),
  jsx: "automatic",
  loader: { ".js": "jsx" },
  alias: {
    "socket.io-client": join(here, "stubs/socket.io-client.js"),
    "react-router-dom": join(here, "stubs/react-router-dom.jsx"),
    "lucide-react": join(here, "stubs/lucide-react.jsx"),
  },
  // The app source lives outside this folder, so also look up packages here.
  nodePaths: [join(here, "node_modules"), ...(process.env.HARNESS_NODE_PATH ? [process.env.HARNESS_NODE_PATH] : [])],
  define: {
    "import.meta.env.VITE_API_URL": '"http://api.test/api"',
    "process.env.NODE_ENV": '"development"',
  },
  logLevel: "warning",
});
console.log("harness bundle built");
