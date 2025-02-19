/***************************
 * LOGIN / THEME HANDLERS *
 ***************************/

// Toggle between Login, Signup, and Forgot Password forms
document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.add('hidden');
    this.classList.add('active');
    document.getElementById('signupBtn').classList.remove('active');
});

document.getElementById('signupBtn').addEventListener('click', function() {
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.add('hidden');
    this.classList.add('active');
    document.getElementById('loginBtn').classList.remove('active');
});

document.getElementById('forgotPassword').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('forgotForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginBtn').classList.remove('active');
    document.getElementById('signupBtn').classList.remove('active');
});

// Toggle between Dark and Light mode
document.getElementById('themeButton').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        this.textContent = 'Switch to Light Mode';
    } else {
        this.textContent = 'Switch to Dark Mode';
    }
});

// Simple login validation (example only)
function validateLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Example credentials check
    const validUsername = "user";
    const validPassword = "password123";

    if (username === validUsername && password === validPassword) {
        window.location.href = "dashboard.html";
        return false; // Prevent form submission
    } else {
        alert("Invalid username or password");
        return false; // Prevent form submission
    }
}

/**********************************
 * MAP & FACILITY SEARCH HANDLERS *
 **********************************/

// Assume that you already have your Leaflet map initialized in dashboard.html
// with a global variable called 'map'.

/**
 * searchInsideStation: Uses Overpass API to search for a facility within
 * a predefined bounding box that represents the railway station area.
 *
 * @param {string} query - Facility to search for (e.g., "Restroom", "Waiting Hall", "Food Court")
 */
function searchInsideStation(query) {
    // Define a bounding box for the railway station (adjust these coordinates!)
    // Format: south, west, north, east
    const bbox = "28.6125,77.207,28.615,77.21"; 

    // Determine the amenity tag to search based on the query
    // (You may need to adjust these mappings depending on how facilities are tagged)
    let amenityTag = "";
    const qLower = query.toLowerCase();

    if(qLower.includes("restroom") || qLower.includes("toilet")){
        // Many OSM entries for public toilets use "toilets" or "toilet"
        amenityTag = "toilet";
    } else if(qLower.includes("waiting")){
        // For waiting halls there might not be a direct tag.
        // If you have custom tagging inside the station, use that.
        // Otherwise, you might consider a generic "hall" search.
        amenityTag = "hall";
    } else if(qLower.includes("food") || qLower.includes("court")){
        // For food areas, OSM may have fast_food or cafe
        // Here we check for fast_food first.
        amenityTag = "fast_food";
    } else {
        alert("Facility not recognized. Please try Restroom, Waiting Hall, or Food Court.");
        return;
    }

    // Build Overpass API query to fetch nodes with the chosen amenity tag within the bounding box.
    const overpassQuery = `
        [out:json];
        node
          ["amenity"="${amenityTag}"]
          (${bbox});
        out body;
    `;
    const overpassUrl = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(overpassQuery);

    // Fetch the facility data
    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            if (data.elements && data.elements.length > 0) {
                // For this example, we take the first result.
                const facility = data.elements[0];
                const facilityCoords = [facility.lat, facility.lon];

                // Remove any previous facility marker (we assume markers added for facility have a custom id)
                map.eachLayer(layer => {
                    if(layer instanceof L.Marker && layer.options && layer.options.customId === 'facilityMarker') {
                        map.removeLayer(layer);
                    }
                });

                // Add a new marker for the facility
                L.marker(facilityCoords, { customId: 'facilityMarker' })
                    .addTo(map)
                    .bindPopup(`<b>${query}</b>`)
                    .openPopup();

                // Center the map on the facility
                map.setView(facilityCoords, 18);
            } else {
                alert("No facility found inside the station for: " + query);
            }
        })
        .catch(error => {
            console.error("Error fetching facility data:", error);
            alert("An error occurred while searching for the facility.");
        });
}

// Update the search button event listener to call searchInsideStation
document.getElementById('searchBtn').addEventListener('click', function() {
    const searchQuery = document.getElementById('stationSearch').value.trim();
    if (searchQuery) {
        searchInsideStation(searchQuery);
    } else {
        alert("Please enter a facility name to search (e.g., Restroom, Waiting Hall, Food Court).");
    }
});
