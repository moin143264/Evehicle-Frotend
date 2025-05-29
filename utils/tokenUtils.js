import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Function to validate the token with the backend
export const validateToken = async (token) => {
  try {
    const response = await axios.post(
      "https://evehicle-vercel.vercel.app/validate-token",
      { token }
    );
    return response.data.isValid;
  } catch (error) {
    if (error.response?.data?.expired) {
      // Token is expired but might be renewable
      return "expired";
    }
    console.error("Error validating token:", error);
    return false;
  }
};

// Function to renew the token
export const renewToken = async (token) => {
  try {
    const response = await axios.post(
      "https://evehicle-vercel.vercel.app/renew-token",
      {}, // Empty body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.token;
  } catch (error) {
    console.error("Error renewing token:", error);
    return null;
  }
};

// Function to check the token and set the initial route
export const checkToken = async (setIsLoggedIn, setLoading) => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      const validationResult = await validateToken(token);

      if (validationResult === true) {
        setIsLoggedIn(true);
      } else if (validationResult === "expired") {
        // Token is expired, try to renew it
        const newToken = await renewToken(token);
        if (newToken) {
          await AsyncStorage.setItem("token", newToken);
          setIsLoggedIn(true);
        } else {
          await AsyncStorage.removeItem("token");
          setIsLoggedIn(false);
        }
      } else {
        // Token is invalid
        await AsyncStorage.removeItem("token");
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  } catch (error) {
    console.error("Error checking token:", error);
    await AsyncStorage.removeItem("token");
    setIsLoggedIn(false);
  } finally {
    setLoading(false);
  }
};
