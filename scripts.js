document.addEventListener("DOMContentLoaded", () => {
    // Fallback image in case the actual image URL is missing or broken
    const fallbackImage = 'https://via.placeholder.com/300x170?text=No+Image'; 

    // Function to fetch JSON data from a given URL
    async function fetchData(url) {
        try {
            showLoadingSpinner(); // Display the loading spinner while fetching data
            const response = await fetch(url); // Make the HTTP request to get the data
            if (!response.ok) { // If the response isn't OK (e.g., 404 or 500 error)
                throw new Error(`HTTP error! status: ${response.status}`); // Throw an error with the status code
            }
            const data = await response.json(); // Parse the response as JSON
            return data; // Return the parsed JSON data
        } catch (error) {
            console.error('Error fetching data:', error); // Log any errors that occur during the fetch
            showError('Failed to load data. Please try again later.'); // Show an error message in the UI
        } finally {
            hideLoadingSpinner(); // Always hide the spinner once the fetch is complete (success or failure)
        }
    }

    // Function to fetch additional data for SetRefs using a refId
    async function fetchSetData(refId) {
        // Construct the URL for the specific set data
        const url = `https://cd-static.bamgrid.com/dp-117731241344/sets/${refId}.json`;
        return await fetchData(url); // Reuse the fetchData function to get this data
    }

    // Function to create and append tiles with images to the DOM
    async function createTiles(containerId, items) {
        const container = document.getElementById(containerId); // Get the container element by its ID
        container.innerHTML = ""; // Clear any existing content in the container

        // Filter out specific titles, like "The Mandalorian" (for testing or preference reasons)
        const filteredItems = items.filter(item => getTitle(item) !== "The Mandalorian");

        // If there are no valid items, log a warning and exit the function
        if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
            console.warn(`No valid items to display for containerId: ${containerId}`);
            return; // Stop further execution if no items are available
        }

        // Loop through each item in the filtered list
        for (const item of filteredItems) {
            let imageUrl = getImageUrl(item); // Get the image URL for the item
            let title = getTitle(item); // Get the title for the item

            // If the image URL is invalid, skip this item
            if (!imageUrl || imageUrl === fallbackImage) {
                console.warn(`Skipping tile for title: ${title} because of missing or invalid image.`);
                continue; // Move to the next item in the loop
            }

            console.log(`Final image URL for title "${title}": ${imageUrl}`); // Log the final image URL for debugging
            const tile = createTile(imageUrl, title); // Create a tile element with the image and title
            container.appendChild(tile); // Add the tile to the container
        }
    }

    // Function to get the image URL from an item, trying multiple possible paths
    function getImageUrl(item) {
        let imageUrl = item?.image?.tile?.["1.78"]?.default?.default?.url ||
                       item?.image?.tile?.["1.78"]?.program?.default?.url ||
                       item?.image?.tile?.["1.78"]?.series?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.default?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.program?.default?.url ||
                       item?.image?.hero_tile?.["1.78"]?.series?.default?.url;

        // Return the image URL, or null if none are found
        return imageUrl || null;
    }

    // Function to get the title of an item
    function getTitle(item) {
        // Attempt to get the series title, or return 'No Title' if it's missing
        return item?.text?.title?.full?.series?.default?.content || 'No Title';
    }

    // Function to create an individual tile element
    function createTile(imageUrl, title) {
        const tile = document.createElement('div'); // Create a new div for the tile
        tile.classList.add('tile'); // Add the 'tile' class for styling

        const img = document.createElement('img'); // Create an img element
        img.src = imageUrl; // Set the image source to the provided URL
        img.alt = title; // Use the title as the alt text for accessibility

        // If the image fails to load, use the fallback image and update the alt text
        img.onerror = () => {
            console.error(`Failed to load image: ${imageUrl} for title: ${title}`);
            img.src = fallbackImage; // Set the source to the fallback image
            img.alt = 'Image not available'; // Update the alt text
        };

        tile.appendChild(img); // Add the image to the tile
        return tile; // Return the completed tile element
    }

    // Function to create and render sections in a specific order
    async function createSections(data) {
        const homeContainer = document.getElementById("home-container"); // Get the main container
        homeContainer.innerHTML = ''; // Clear any existing content in the container

        // Define the desired order of sections
        const sectionOrder = [
            "New to Disney+",
            "Collections",
            "Inspired by True Stories",
            "Documentaries",
            "Because You Watched Gordon Ramsay"
        ];

        // Rearrange the containers based on the defined order
        const orderedContainers = sectionOrder.map(sectionName => {
            return data.containers.find(container => {
                // Replace "New to Disney+" with "Because You Watched Gordon Ramsay"
                if (container.set.text.title.full.set.default.content === "New to Disney+") {
                    container.set.text.title.full.set.default.content = "Because You Watched Gordon Ramsay";
                }
                return container.set.text.title.full.set.default.content === sectionName;
            });
        });

        // Loop through the ordered containers and render each section
        for (const container of orderedContainers) {
            if (!container) continue; // Skip any undefined containers

            const sectionTitle = container.set.text.title.full.set.default.content; // Get the section title

            const sectionElement = document.createElement("div"); // Create a new div for the section
            sectionElement.className = "section"; // Add the 'section' class for styling

            const titleElement = document.createElement("h2"); // Create an h2 element for the section title
            titleElement.textContent = sectionTitle; // Set the title text
            sectionElement.appendChild(titleElement); // Add the title to the section

            const rowElement = document.createElement("div"); // Create a div for the row of tiles
            rowElement.className = "row"; // Add the 'row' class for styling
            rowElement.id = `section-${data.containers.indexOf(container)}`; // Set a unique ID for the row

            sectionElement.appendChild(rowElement); // Add the row to the section
            homeContainer.appendChild(sectionElement); // Add the section to the main container

            // Check if there are items in this container
            if (Array.isArray(container.set.items) && container.set.items.length > 0) {
                await createTiles(rowElement.id, container.set.items); // Create and add the tiles
            } else {
                console.warn(`No items found for section: ${sectionTitle}`); // Log a warning if there are no items
            }
        }
    }

    // Function to show the loading spinner
    function showLoadingSpinner() {
        document.getElementById('loading-spinner').classList.remove('hidden'); // Remove the 'hidden' class to show the spinner
    }

    // Function to hide the loading spinner
    function hideLoadingSpinner() {
        document.getElementById('loading-spinner').classList.add('hidden'); // Add the 'hidden' class to hide the spinner
    }

    // Function to show an error message in the UI
    function showError(message) {
        const homeContainer = document.getElementById("home-container"); // Get the main container
        homeContainer.innerHTML = `<div class="error-message">${message}</div>`; // Replace its content with the error message
    }

    // Fetch and render the home page data
    fetchData('https://cd-static.bamgrid.com/dp-117731241344/home.json').then(data => {
        if (data && data.data && data.data.StandardCollection) {
            createSections(data.data.StandardCollection); // Create and render the sections if data is available
        } else {
            showError('The expected data structure was not found.'); // Show an error if the data structure is unexpected
        }
    });
});
