document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reservation-form');
    const thisWeekTable = document.getElementById('this-week-reservations');
    const nextWeekTable = document.getElementById('next-week-reservations');
    const exportButton = document.getElementById('export-button');
    const copyButton = document.getElementById('copy-button');
    const removedRecordsButton = document.getElementById('removed-records-button'); // New button

    // Load existing reservations from localStorage when the page is loaded
    loadReservations(thisWeekTable, nextWeekTable);

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form submission
        
        // Get form values
const name = document.getElementById('name').value;
const coPilot = document.getElementById('co-pilot').value; // Retrieve Co-pilot value
const selectedDate = new Date(document.getElementById('date').value + 'T00:00:00'); // Set time to midnight
const sensor = document.getElementById('sensor').value;
const drone = document.getElementById('drone').value;
const sensor2 = document.getElementById('sensor2').value; // Retrieve Sensor 2 value
const drone2 = document.getElementById('drone2').value; // Retrieve Drone 2 value
const batteries = document.getElementById('batteries').value;
const location = document.getElementById('location').value;
const comments = document.getElementById('comments').value;


        // Add the reservation to localStorage
addReservationToStorage(name, coPilot, selectedDate, sensor, drone, sensor2, drone2, batteries, location);

        // Create new row for the reservation table
        const newRow = reservationRow(selectedDate, sensor, drone, sensor2, drone2, batteries, name, coPilot, location);

        // Determine if the selected date is within "This week" or "Next week"
        const today = new Date();
        const nearestSunday = new Date(today);
        nearestSunday.setDate(today.getDate() + (7 - today.getDay())); // Nearest Sunday
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
    });

    // Add event delegation for delete buttons in "This week" table
    thisWeekTable.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-button')) {
            const row = event.target.closest('tr');
            const date = new Date(row.cells[0].textContent);
            removeReservation(row, date);
        }
    });

    // Add event delegation for delete buttons in "Next week" table
    nextWeekTable.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-button')) {
            const row = event.target.closest('tr');
            const date = new Date(row.cells[0].textContent);
            removeReservation(row, date);
        }
    });

    // Event listener for export button
    exportButton.addEventListener('click', function() {
        exportReservations();
    });

    // Event listener for copy button
    copyButton.addEventListener('click', function() {
        copyReservationsData();
    });

    // Event listener for removed records button
    removedRecordsButton.addEventListener('click', function() {
        exportRemovedRecords();
    });
});

function loadReservations(thisWeekTable, nextWeekTable) {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const today = new Date();
    const nearestSunday = new Date(today);
    nearestSunday.setDate(today.getDate() + (7 - today.getDay())); // Nearest Sunday

    reservations.forEach(reservation => {
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
}


// Remaining functions remain unchanged


// Function to sort the table based on a specific column index
function sortTable(table, column) {
    const rows = Array.from(table.rows).slice(1); // Exclude header row
    rows.sort((a, b) => {
        const dateA = new Date(a.cells[column].textContent);
        const dateB = new Date(b.cells[column].textContent);
        return dateA - dateB;
    });
    rows.forEach(row => table.appendChild(row));
}

// Function to get the day of week as a string
function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
}

// Function to format the date as "MM/DD/YYYY"
function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Function to add a reservation to localStorage
function addReservationToStorage(name, coPilot, date, sensor, drone, sensor2, drone2, batteries, location) {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    reservations.push({ name, coPilot, date: date.toISOString(), sensor, drone, sensor2, drone2, batteries, location });
    localStorage.setItem('reservations', JSON.stringify(reservations));
}



// Function to create a reservation table row
function reservationRow(date, sensor, drone, sensor2, drone2, batteries, name, coPilot, location) {
    const newRow = document.createElement('tr');
    const dateCell = newRow.insertCell(0);
    const dayOfWeekCell = newRow.insertCell(1);
    const sensorCell = newRow.insertCell(2);
    const droneCell = newRow.insertCell(3);
    const sensor2Cell = newRow.insertCell(4);
    const drone2Cell = newRow.insertCell(5);
    const batteriesCell = newRow.insertCell(6);
    const nameCell = newRow.insertCell(7);
    const coPilotCell = newRow.insertCell(8);
    const locationCell = newRow.insertCell(9);
    const deleteCell = newRow.insertCell(10); // Add cell for delete button

    // Populate cells with form values
    dateCell.textContent = formatDate(date);
    dayOfWeekCell.textContent = getDayOfWeek(date);
    sensorCell.textContent = sensor;
    droneCell.textContent = drone;
    sensor2Cell.textContent = sensor2;
    drone2Cell.textContent = drone2;
    batteriesCell.textContent = batteries;
    nameCell.textContent = name;
    coPilotCell.textContent = coPilot;
    locationCell.textContent = location;

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteCell.appendChild(deleteButton);

    return newRow;
}


// Function to remove a reservation from the table and localStorage
function removeReservation(row, date) {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const removedRecords = JSON.parse(localStorage.getItem('removedRecords')) || [];
    const dateString = date.toLocaleDateString(); // Convert date to string in the same format as stored in localStorage
    const index = reservations.findIndex(reservation => new Date(reservation.date).toLocaleDateString() === dateString);
    if (index !== -1) {
        // Ask for confirmation before removing the record
        const confirmed = window.confirm('Are you sure you want to delete this record? Please refresh the webpage before removing!');
        if (confirmed) {
            // Store the removed record in localStorage
            removedRecords.push(reservations[index]);
            localStorage.setItem('removedRecords', JSON.stringify(removedRecords));

            // Remove the reservation from the array
            reservations.splice(index, 1); // Remove the reservation from the array
            localStorage.setItem('reservations', JSON.stringify(reservations)); // Update localStorage

            // Remove the row from the table
            row.remove(); 
        }
    }
}


// Function to export reservations data
function exportReservations() {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const jsonData = JSON.stringify(reservations, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to export removed records
function exportRemovedRecords() {
    const removedRecords = JSON.parse(localStorage.getItem('removedRecords')) || [];
    const jsonData = JSON.stringify(removedRecords, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'removed_records.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to copy reservations data to clipboard
function copyReservationsData() {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const jsonData = JSON.stringify(reservations, null, 2);
    navigator.clipboard.writeText(jsonData).then(function() {
        alert('Reservations data copied to clipboard!');
    }, function(err) {
        console.error('Failed to copy reservations data: ', err);
    });
}
