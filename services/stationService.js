import axios from "axios";

const API_BASE_URL = "https://evehicle-4dmw.onrender.com/api/stations";

export const stationService = {
  addStation: async (stationData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/add`, stationData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "Invalid station data");
      }
      throw new Error(error.response?.data?.message || "Error adding station");
    }
  },

  getAllStations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/all`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching stations"
      );
    }
  },

  getNearbyStations: async (latitude, longitude) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/nearby`, {
        params: { latitude, longitude },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching nearby stations"
      );
    }
  },

  deleteStation: async (stationId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${stationId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error deleting station"
      );
    }
  },
};
export const getAllStations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/all`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching stations");
  }
};
export const deleteStation = async (stationId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${stationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error deleting station");
  }
};
