// Initialize the Octokit client with your GitHub access token
const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: "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" });

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('reservation-form');
  const thisWeekTable = document.getElementById('this-week-reservations');
  const nextWeekTable = document.getElementById('next-week-reservations');
  const exportButton = document.getElementById('export-button');
  const copyButton = document.getElementById('copy-button');
  const removedRecordsButton = document.getElementById('removed-records-button');

  // Load existing reservations from GitHub repository when the page is loaded
  loadReservationsFromGitHub(thisWeekTable, nextWeekTable);

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const coPilot = document.getElementById('co-pilot').value;
    const selectedDate = new Date(document.getElementById('date').value + 'T00:00:00');
    const sensor = document.getElementById('sensor').value;
    const drone = document.getElementById('drone').value;
    const sensor2 = document.getElementById('sensor2').value;
    const drone2 = document.getElementById('drone2').value;
    const batteries = document.getElementById('batteries').value;
    const location = document.getElementById('location').value;
    const comments = document.getElementById('comments').value;

    try {
      // Add the reservation to the GitHub repository
      await addReservationToGitHub(name, coPilot, selectedDate, sensor, drone, sensor2, drone2, batteries, location);

      // Create new row for the reservation table
      const newRow = reservationRow(selectedDate, sensor, drone, sensor2, drone2, batteries, name, coPilot, location);

      // Determine if the selected date is within "This week" or "Next week"
      const today = new Date();
      const nearestSunday = new Date(today);
      nearestSunday.setDate(today.getDate() + (7 - today.getDay()));
      const isThisWeek = selectedDate <= nearestSunday;

      // Append the new row to the appropriate table
      if (isThisWeek) {
        thisWeekTable.appendChild(newRow);
      } else {
        nextWeekTable.appendChild(newRow);
      }

      // Sort the tables based on the date column
      sortTable(thisWeekTable, 0);
      sortTable(nextWeekTable, 0);

      // Clear form fields
      form.reset();
    } catch (error) {
      console.error("Error adding reservation to GitHub repository:", error);
    }
  });

  // Add event delegation for delete buttons in "This week" table
  thisWeekTable.addEventListener('click', async function(event) {
    if (event.target.classList.contains('delete-button')) {
      const row = event.target.closest('tr');
      const date = new Date(row.cells[0].textContent);
      await removeReservationFromGitHub(row, date);
    }
  });

  // Add event delegation for delete buttons in "Next week" table
  nextWeekTable.addEventListener('click', async function(event) {
    if (event.target.classList.contains('delete-button')) {
      const row = event.target.closest('tr');
      const date = new Date(row.cells[0].textContent);
      await removeReservationFromGitHub(row, date);
    }
  });

  // Event listener for export button
  exportButton.addEventListener('click', async function() {
    await exportReservationsFromGitHub();
  });

  // Event listener for copy button
  copyButton.addEventListener('click', async function() {
    await copyReservationsDataFromGitHub();
  });

  // Event listener for removed records button
  removedRecordsButton.addEventListener('click', async function() {
    await exportRemovedRecordsFromGitHub();
  });
});

async function loadReservationsFromGitHub(thisWeekTable, nextWeekTable) {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "YOUR_GITHUB_USERNAME",
      repo: "YOUR_REPOSITORY_NAME",
      path: "reservations.json"
    });

    const reservationsData = JSON.parse(atob(response.data.content));
    const today = new Date();
    const nearestSunday = new Date(today);
    nearestSunday.setDate(today.getDate() + (7 - today.getDay()));

    reservationsData.forEach(reservation => {
      const { name, coPilot, date, sensor, sensor2, drone, drone2, batteries, location } = reservation;
      const reservationDate = new Date(date);
      const isThisWeek = reservationDate <= nearestSunday;
      const newRow = reservationRow(reservationDate, sensor, drone, batteries, name, location, coPilot, sensor2, drone2);

      if (isThisWeek) {
        thisWeekTable.appendChild(newRow);
      } else {
        nextWeekTable.appendChild(newRow);
      }
    });
  } catch (error) {
    console.error("Error fetching reservations from GitHub repository:", error);
  }
}

async function addReservationToGitHub(name, coPilot, date, sensor, drone, sensor2, drone2, batteries, location) {
  const reservationData = { name, coPilot, date: date.toISOString(), sensor, drone, sensor2, drone2, batteries, location };

  try {
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: "YOUR_GITHUB_USERNAME",
      repo: "YOUR_REPOSITORY_NAME",
      path: "reservations.json",
      message: "Add new reservation",
      content: btoa(JSON.stringify([reservationData], null, 2))
    });
  } catch (error) {
    console.error("Error adding reservation to GitHub repository:", error);
  }
}

async function removeReservationFromGitHub(row, date) {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "YOUR_GITHUB_USERNAME",
      repo: "YOUR_REPOSITORY_NAME",
      path: "reservations.json"
    });

    const reservationsData = JSON.parse(atob(response.data.content));
    const dateString = date.toLocaleDateString();
    const index = reservationsData.findIndex(reservation => new Date(reservation.date).toLocaleDateString() === dateString);

    if (index !== -1) {
      const confirmed = window.confirm('Are you sure you want to delete this record?');
      if (confirmed) {
        reservationsData.splice(index, 1);
        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner: "YOUR_GITHUB_USERNAME",
          repo: "YOUR_REPOSITORY_NAME",
          path: "reservations.json",
          message: "Remove reservation",
          content: btoa(JSON.stringify(reservationsData, null, 2))
        });
        row.remove();
      }
    }
  } catch (error) {
    console.error("Error removing reservation from GitHub repository:", error);
  }
}

async function exportReservationsFromGitHub() {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "YOUR_GITHUB_USERNAME",
      repo: "YOUR_REPOSITORY_NAME",
      path: "reservations.json"
    });

    const reservationsData = JSON.parse(atob(response.data.content));
    const jsonData = JSON.stringify(reservationsData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting reservations from GitHub repository:", error);
  }
}

async function copyReservationsDataFromGitHub() {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "AliBgisrs",
      repo: "AliBgisrs.github.io",
      path: "reservations.json"
    });

    const reservationsData = JSON.parse(atob(response.data.content));
    const jsonData = JSON.stringify(reservationsData, null, 2);
    await navigator.clipboard.writeText(jsonData);
    alert('Reservations data copied to clipboard!');
  } catch (error) {
    console.error("Error copying reservations data from GitHub repository:", error);
  }
}

async function exportRemovedRecordsFromGitHub() {
  // This functionality is not implemented in the updated code, as the removed records are not being stored in the GitHub repository.
  // You would need to implement a similar approach to the other functions to handle the removed records.
}

// The remaining functions (sortTable, getDayOfWeek, formatDate, reservationRow) remain unchanged from the previous code.