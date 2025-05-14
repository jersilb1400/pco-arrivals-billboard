const axios = require('axios');

/**
 * Fetch all check-ins for a given event_time_id, filter for not checked out and created on a specific date.
 * @param {Object} params
 * @param {string} params.eventTimeId - The PCO event_time_id
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {Object} params.auth - { username, password } for PCO Basic Auth
 * @returns {Promise<Array>} Array of check-ins with id, status, created_at, and name
 */
async function fetchCheckinsByEventTime({ eventTimeId, date, auth }) {
  let allCheckIns = [];
  let allIncluded = [];
  let nextPage = `https://api.planningcenteronline.com/check-ins/v2/event_times/${eventTimeId}/check_ins?include=person&per_page=100`;

  while (nextPage) {
    const response = await axios.get(nextPage, {
      auth,
      headers: { 'Accept': 'application/json' }
    });
    allCheckIns = allCheckIns.concat(response.data.data || []);
    allIncluded = allIncluded.concat(response.data.included || []);
    nextPage = response.data.links?.next;
  }

  // Filter: not checked out, created_at matches date
  const filtered = allCheckIns.filter(checkIn => {
    const isActive = !checkIn.attributes.checked_out_at;
    const createdAt = checkIn.attributes.created_at;
    const isOnDate = createdAt.startsWith(date); // date = 'YYYY-MM-DD'
    return isActive && isOnDate;
  });

  // Map to desired output
  return filtered.map(checkIn => {
    const person = allIncluded.find(
      item => item.type === 'Person' && item.id === checkIn.relationships.person?.data?.id
    );
    return {
      id: checkIn.id,
      status: checkIn.attributes.status,
      created_at: checkIn.attributes.created_at,
      name: person ? `${person.attributes.first_name} ${person.attributes.last_name}` : undefined
    };
  });
}

module.exports = fetchCheckinsByEventTime; 