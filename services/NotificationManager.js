// NotificationManager.js
import * as Notifications from "expo-notifications";

// Function to schedule a single notification
const scheduleNotification = async (title, body, trigger) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
    },
    trigger: trigger,
  });
};

// Function to schedule reminders
const scheduleReminders = async (userId, startTime, duration) => {
  // Convert startTime to Date object
  const startDate = new Date(startTime);
  const arrivalTime = new Date(startDate.getTime() - 5 * 60 * 1000); // 5 minutes before arrival
  const expireTime = new Date(startDate.getTime() + duration * 60 * 1000); // After duration

  // Schedule reminder for 5 minutes before arrival
  await scheduleNotification(
    "Reminder: Upcoming Booking",
    "Your booking is in 5 minutes!",
    {
      seconds: Math.max(0, (arrivalTime.getTime() - Date.now()) / 1000),
    }
  );

  // Schedule notification for when the booking starts
  await scheduleNotification("Booking Started", "Your booking has started!", {
    seconds: Math.max(0, (startDate.getTime() - Date.now()) / 1000),
  });

  // Schedule notification for when the booking expires
  await scheduleNotification("Booking Expired", "Your booking has expired!", {
    seconds: Math.max(0, (expireTime.getTime() - Date.now()) / 1000),
  });
};

// Export the functions for use in other parts of the app
export { scheduleReminders };
