import { registerRootComponent } from "expo";
import React from "react";
import App from "./App";
import { UserProvider } from "./UserContext"; // Import UserProvider

// Wrap App with UserProvider
const Main = () => (
  <UserProvider>
    <App />
  </UserProvider>
);

// Register the main component
registerRootComponent(Main);
