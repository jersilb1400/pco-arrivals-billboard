require('dotenv').config();
const axios = require('axios');

const auth = {
  username: process.env.PCO_ACCESS_TOKEN,
  password: process.env.PCO_ACCESS_SECRET
};

async function validateEventTimes() {
  try {
    // Fetch all events
    const eventsRes = await axios.get('https://api.planningcenteronline.com/check-ins/v2/events', { auth });
    const events = eventsRes.data.data;

    for (const event of events) {
      const eventId = event.id;
      try {
        const eventTimesRes = await axios.get(
          `https://api.planningcenteronline.com/check-ins/v2/events/${eventId}/event_times`,
          { auth }
        );
        const eventTimes = eventTimesRes.data.data;
        if (eventTimes.length > 0) {
          console.log(`Event "${event.attributes.name}" (ID: ${eventId}) has ${eventTimes.length} event time(s).`);
        } else {
          console.log(`Event "${event.attributes.name}" (ID: ${eventId}) has NO event times.`);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.log(`Event "${event.attributes.name}" (ID: ${eventId}) - 404 Not Found for event_times.`);
        } else {
          console.log(`Event "${event.attributes.name}" (ID: ${eventId}) - Error:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch events:', err.message);
  }
}

validateEventTimes();