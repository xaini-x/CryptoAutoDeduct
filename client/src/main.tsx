import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WalletProvider } from "./contexts/WalletContext";
import { DeductionProvider } from "./contexts/DeductionContext";

createRoot(document.getElementById("root")!).render(
  <WalletProvider>
    <DeductionProvider>
      <App />
    </DeductionProvider>
  </WalletProvider>
);
