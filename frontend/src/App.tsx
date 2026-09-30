import {
  BrowserRouter,
} from "react-router-dom";

import App from "./app/App";
import Providers from "./app/providers";

export default function RootApp() {
  return (
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  );
}
