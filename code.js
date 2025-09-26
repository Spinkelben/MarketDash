import { ApiClient } from "./ApiClient.js";

const messageHandler = (vendors, e) => {
    const path = e?.d?.b?.p;
    if (path === undefined) {
        console.error("No path in message", e);
        return;
    }

    if (path.match(/^clientUnits\/.*\/all$/)) {
        for (const index in e.d.b.d) {
            let location = e.d.b.d[index];
            // console.log(location);
            if (location.children !== undefined) {
                for (const idx in location.children) {
                    const vendor = location.children[idx];
                    if (!validateVendor(vendor)) {
                        console.error('Invalid vendor data:', vendor);
                        continue;
                    }

                    vendors[vendor.routeName] = {
                        name: vendor.name,
                        routeName: vendor.routeName,
                        imageUrl: vendor.imageUrl,
                        menuItems: [],
                        visible: vendor.visible,
                    }
                }
            }
            else {
                const vendor = location;
                if (!validateVendor(vendor)) {
                    console.error('Invalid vendor data:', vendor);
                    continue;
                }

                vendors[vendor.routeName] = {
                    name: vendor.name,
                    routeName: vendor.routeName,
                    imageUrl: vendor.imageUrl,
                    menuItems: [],
                    visible: vendor.visible,
                }
            }
        }
    }
    else if (path.includes('activeMenu')) {
        const vendorRoute = path.match(/Clients\/(.+)\/activeMenu\/categories/)[1];
        let vendor = vendors[vendorRoute];
        vendor.menuItems = [];
        const items = e.d.b.d["0"].items;
        for (const key in items) {
            if (Object.hasOwnProperty.call(items, key)) {
                const menuItem = items[key];
                if (menuItem.enabled === false) 
                {
                    continue;
                }
                    
                if (!validateMenuItem(menuItem))
                {
                    console.error('Invalid menu item data:', menuItem);
                    continue;
                }

                vendor.menuItems.push({
                    name: menuItem.Name,
                    description: menuItem.Description,
                    descriptionLong: menuItem.DescriptionLong,
                    imageUrl: menuItem.ImageUrl,
                    id: menuItem.key,
                    timeslots: [],
                    price: Number(menuItem.Cost) / 100,
                });
            }
        }
    }
};

const createVendorElement = (vendor) => {
    const templateInstance = document.querySelector("#vendor-template").content.cloneNode(true);
    const vendorElement = templateInstance.querySelector(".vendor");
    vendorElement.setAttribute("id", `vendor-${vendor.routeName}`);
    const img = templateInstance.querySelector(".vendor-img");
    img.setAttribute("src", sanitizeImageUrl(vendor.imageUrl));
    const text = templateInstance.querySelector(".vendor-name");
    text.textContent = vendor.name;
    // Hide the vendor if it is not visible
    if (vendor.visible === false) {
        vendorElement.style.display = "none";
    }
    return templateInstance;
};

const createMenuItemElement = (vendor, menuItem) => {
    const templateInstance = document.querySelector("#menu-item-template").content.cloneNode(true);
    const imgs = templateInstance.querySelectorAll("img");
    imgs.forEach((i) => i.src = menuItem.imageUrl);
    const text = templateInstance.querySelectorAll(".item-name");
    text.forEach((i) => i.textContent = `${menuItem.name}`);
    const timespans = templateInstance.querySelector(".timespans");
    timespans.setAttribute("id", `timespans-${sanitizeId(vendor.routeName)}-${sanitizeId(menuItem.id)}`);
    const spinner = templateInstance.querySelector(".spinner");
    spinner.textContent = getRandomFoodIcon();
    const description = templateInstance.querySelector(".menu-item-description");
    description.textContent = menuItem.descriptionLong;
    const detailsDialog = templateInstance.querySelector("dialog");
    detailsDialog.addEventListener("click", (e) => {
        const dialogRect = e.target.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        const isInDialog = x >= dialogRect.left && x <= dialogRect.right && y >= dialogRect.top && y <= dialogRect.bottom;
        if (isInDialog === false) {
            e.target.close();
            e.stopPropagation();
        }
    });
    const shortDescription = templateInstance.querySelector("dt");
    shortDescription.addEventListener("click", () => {  detailsDialog.showModal(); });
    const closeButton = templateInstance.querySelector("dialog button");
    closeButton.addEventListener("click", (e) => { e.stopPropagation(); detailsDialog.close(); });
    return templateInstance;
};

const drawVendorsAndMenuItems = (vendors) => {
    let section = document.getElementById("food-table");
    // Remove everything from the section except the spinner
    while (section.children.length > 1) {
        section.removeChild(section.lastChild);
    }

    for (const vendorRoute of Object.keys(vendors)) {
        const vendor = vendors[vendorRoute];
        const vendorElement = createVendorElement(vendor);
        const menuItemList = vendorElement.querySelector(".menu-item-list");
        
        const fragment = document.createDocumentFragment();
        for (const menuItem of vendor.menuItems) {
            const menuItemElement = createMenuItemElement(vendor, menuItem);
            fragment.appendChild(menuItemElement);
        }

        menuItemList.appendChild(fragment);
        section.appendChild(vendorElement);
    }
};

const getRandomFoodIcon = () => {
    const foodEmoji = ['🌭', '🍔', '🍕', '🍖', '🍗', '🍚', '🍜', '🍞', '🍟', '🍠', '🍣', '🍤', '🍩', '🍪', '🍰', '🥐', '🥓', '🥖', '🦐', '🦑',
'🍿', '🥚', '🍳', '🧇', '🥞', '🧈', '🥨', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥩', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍛', '🦪', '🍥',
'🥮', '🍢', '🧆', '🥘', '🍲', '🍝', '🥣', '🥧', '🍦', '🍧', '🍨', '🎂', '🧁', '🍫', '🍮', '🍯', '🍷', '🍾', '🍼', '🍶', '🧉', '🍵', '☕',
'🧃', '🥛', '🍸', '🍹', '🍺', '🥂', '🥃', '🥤', '🥝', '🥥', '🍇', '🍎', '🥭', '🍍', '🍌', '🍋', '🍊', '🍉', '🍈', '🍏', '🍐', '🍑', '🍒',
'🍓', '🍅', '🍆', '🌽', '🧄', '🥔', '🥦', '🥬', '🥒','🥑', '💩', '🍄', '🌶', '🧅', '🥕', '🌰', '🥜'];
    return foodEmoji[Math.floor(Math.random() * foodEmoji.length)];
}

/**
 * Gets the available times for the menu item
 * @param {string} id Id of the product
 * @param {string} name Name of the product
 * @param {string} vendor vendor name
 * @param {Number} quantity Number of items to purchase
 * @returns {Promise<any[]>} The list of times
 */
const getTimes = async (id, name, vendor, quantity) => {
    let result = await fetch(
        "https://payments2-jaonrqeeaq-ew.a.run.app/v1/orders/timeslots", 
        { 
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                "routeName": vendor,
                "products": [
                    {
                        "bongCategoryId": 0,
                        "quantity": quantity,
                        "productId": id,
                        "productName": name,
                    }
                ]
            })});
    
    if (result.status !== 200) {
        console.error("Failed to fetch timeslots", name, vendor, result);
        return [];
    }
    
    let times = await result.json();

    let flattened = [];
    if (times.length > 0)
    {
        for (const day of times) {
            const label = day.label;
            for (const timeslot of day.timeslots) {
                timeslot.label = label;
                timeslot.vendor = vendor;
                timeslot.id = id;
                flattened.push(timeslot);
            }
        }
    }

    return flattened;
};

const displayTimes = (allTimes, dayLabel) => {
    const selectedTime = allTimes.filter(t => t.label == dayLabel);
    
    // Clear all previous times
    for (const element of document.querySelectorAll("dd.timespans")) {
        element.replaceChildren();
    }
    
    // Add new times
    const dateTimeFormatter = Intl.DateTimeFormat(
        'da-dk', 
        { 
            hour: "numeric",
            minute: "numeric",
        });
    for (const timeslot of selectedTime.sort((a, b) => a.date - b.date )) {
        const timeslotContainer = document.querySelector(`#timespans-${timeslot.vendor}-${timeslot.id}`);
        if (timeslotContainer !== undefined) {
            const timeslotElement = document.createElement("span");
            const time = Date.parse(timeslot.dateISO);
            timeslotElement.textContent = dateTimeFormatter.format(time);
            timeslotElement.setAttribute("class", `${timeslot.enabled ? "enabled" : "disabled"} timeslot`);
            timeslotContainer.appendChild(timeslotElement);
        }
    }

    // Add information to the nodes without children
    for (const element of document.querySelectorAll("dd.timespans")) {
        if (element.childNodes.length === 0) {
            const noTimesElement = document.createElement("span");
            noTimesElement.textContent = "No times available..."
            element.appendChild(noTimesElement);
        }
    }
};

const setupTimeslotSelector = (allTimes, dayLabels) => {
    const optionPicker = document.querySelector("#day-selector");
    optionPicker.addEventListener('change', (e) => {
        displayTimes(allTimes, e.target.value);
    });

    if (optionPicker.childNodes.length === 0) {
        for (const dayOption of dayLabels) {
            let el = document.createElement("option");
            el.textContent = dayOption;
            el.value = dayOption;
            optionPicker.appendChild(el);
        }
    }
    displayTimes(allTimes, optionPicker.value);
    optionPicker.style.display = "";
};


// Helper function to fetch all timeslots
async function fetchAllTimeslots(vendors) {
    const vendorTasks = [];
    for (const vendorId of Object.keys(vendors)) {
        const vendor = vendors[vendorId];
        if (vendor.visible === false) {
            continue;
        }
        
        const promises = vendor.menuItems.map(mi => getTimes(mi.id, mi.name, vendorId, 1));
        vendorTasks.push(Promise.all(promises));
        
    }
    return (await Promise.all(vendorTasks)).flat().flat();
}

function sanitizeImageUrl(url) {
    try {
        const parsed = new URL(url);
        // Only allow specific domains and protocols
        if (!parsed.protocol.match(/^https?:$/)) {
            return '';
        }

        return url;
    } catch {
        return '';
    }
}

function sanitizeId(id) {
    return id.toString().replace(/[^a-zA-Z0-9-_]/g, '');
}

function validateVendor(vendor) {
    const required = ['name', 'routeName'];
    return required.every(prop => typeof vendor[prop] === 'string');
}

function validateMenuItem(item) {
    return typeof item.Name === 'string' &&
           typeof item.Description === 'string' &&
           typeof item.Cost === 'number' &&
           /^\d+$/.test(item.Cost);
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function shuffleVendorList(vendors, dayOfYear) {
    const keys = Object.keys(vendors);
    let offset = dayOfYear % keys.length;
    let shuffled = keys.slice(offset).concat(keys.slice(0, offset));
    let shuffledVendors = {};
    for (const key of shuffled) {
        shuffledVendors[key] = vendors[key];
    }

    return shuffledVendors;
}

async function loadAllSites() {
    const sites = [];
    const client = new ApiClient();
    await client.start();
    await client.readMessage(5000);
    await client.submitMessage('q', { p: '/clientUnits', h: "" });
    const message = await client.readMessage(5000);
    if (message === null) {
        console.error("No message received");
        return;
    }

    if (message.d.b.d === undefined) {
        console.error("No sites found");
        return;
    }

    // Create site selector 
    const siteSelector = document.createElement("select");
    siteSelector.setAttribute("id", "site-selector");
    for (const site of Object.keys(message.d.b.d)) {
        const option = document.createElement("option");
        option.value = site;
        option.textContent = site;
        siteSelector.appendChild(option);
    }
    document.body.appendChild(siteSelector);

    // Create button to load site
    const loadButton = document.createElement("button");
    loadButton.textContent = "Load site";
    loadButton.addEventListener("click", async () => {
        const selectedSite = document.getElementById("site-selector").value;
        main({ clientUnitsPath: `/clientUnits/${selectedSite}/all` });
    });

    document.body.appendChild(loadButton);

}


/**
 * @typedef {Object} MainConfig
 * @property {number} [messageTimeout=5000] - Timeout for reading messages in milliseconds
 * @property {string[]} [excludedVendors=['compassdk_townhallcafe', 'compassdk_centralcafe']] - Vendors to exclude
 * @property {string} [clientUnitsPath='/clientUnits/compassdk_danskebank/all'] - Path for client units query
 */

/**
 * @param {MainConfig} config - Configuration options for the main function
 */
async function main(config = {}) {
    const {
        messageTimeout = 5000,
        excludedVendors = ['compassdk_townhallcafe', 'compassdk_centralcafe'],
        clientUnitsPath = '/clientUnits/compassdk_danskebank/all'
    } = config;

    let vendors = {};
    const spinner = document.getElementById('load-icon');
    spinner.innerText = getRandomFoodIcon();
    spinner.style.display = 'block';
    
    try {
        const client = new ApiClient();
        await client.start();
        
        const firstMessage = await client.readMessage(messageTimeout);
        if (firstMessage === null) {
            throw new Error("Client Api connection not initialized correctly");
        }

        await client.submitMessage('q', { p: clientUnitsPath, h: "" });
        const listVendorResponse = await client.readMessage(messageTimeout);
        messageHandler(vendors, listVendorResponse);

        for (const excludedVendor of excludedVendors) {
            delete vendors[excludedVendor];
        }


        // Shuffle the vendor list based on the day of the year
        const dayOfYear = getDayOfYear(new Date());
        vendors = shuffleVendorList(vendors, dayOfYear);

        // Fetch menus for all non-excluded vendors
        for (const vendorRoute in vendors) {
            if (Object.hasOwnProperty.call(vendors, vendorRoute)) {
                const vendor = vendors[vendorRoute];
                try {
                    await client.submitMessage('q', { p: `/Clients/${vendor.routeName}/activeMenu/categories`, h:"" });
                    const menu = await client.readMessage(messageTimeout/10);
                    messageHandler(vendors, menu);
                } catch (error) {
                    console.error("Error fetching menu for vendor", vendorRoute, error);
                }
            }
        }

        spinner.style.display = 'none';
        drawVendorsAndMenuItems(vendors);
        
        const allTimes = await fetchAllTimeslots(vendors);
        const days = new Set(allTimes.map(t => t.label));
        setupTimeslotSelector(allTimes, days);
        
        // Setup random dish selector
        setupRandomDishSelector(vendors, allTimes);

        // Add hidden button to enable querying other locations than danske bank
        if (document.getElementById("god-mode-button") === null) {
            const godModeButton = document.createElement("button");
            godModeButton.textContent = "Enable God Mode";
            godModeButton.setAttribute("id", "god-mode-button");
            godModeButton.style.display = "None";
            godModeButton.addEventListener("click", () => {
                return loadAllSites();
            });

            document.body.appendChild(godModeButton);
        }


        return { success: true, vendors, allTimes };
    } catch (error) {
        console.error("Error in main:", error);
        return { success: false, error };
    } finally {
        spinner.style.display = 'none';
    }
}

// Random Dish Selector functionality
const setupRandomDishSelector = (vendors, allTimes) => {
    const randomDishBtn = document.getElementById('random-dish-btn');
    const dialog = document.getElementById('random-dish-dialog');
    const spinButton = document.getElementById('spin-button');
    const closeButton = document.getElementById('close-random-dialog');
    const spinningContainer = document.getElementById('spinning-container');
    const resultContainer = document.getElementById('result-container');
    
    // Get all available dishes from all vendors
    const getAllDishes = () => {
        const allDishes = [];
        for (const vendorRoute in vendors) {
            const vendor = vendors[vendorRoute];
            if (vendor.visible && vendor.menuItems.length > 0) {
                vendor.menuItems.forEach(item => {
                    allDishes.push({
                        vendor: vendor,
                        dish: item
                    });
                });
            }
        }
        return allDishes;
    };
    
    // Update spinning display with a dish
    const updateSpinningDisplay = (dishData) => {
        const spinningVendorImg = document.querySelector('.spinning-vendor-img');
        const spinningDishName = document.querySelector('.spinning-dish-name');
        const spinningDishImg = document.querySelector('.spinning-dish-img');
        
        // Show images when we start spinning
        spinningVendorImg.style.display = 'block';
        spinningDishImg.style.display = 'block';
        
        spinningVendorImg.src = dishData.vendor.imageUrl || '';
        spinningVendorImg.alt = dishData.vendor.name;
        spinningDishName.textContent = dishData.dish.name;
        spinningDishImg.src = dishData.dish.imageUrl || '';
        spinningDishImg.alt = dishData.dish.name;
        
        // Handle cases where images might not load
        spinningVendorImg.onerror = () => { spinningVendorImg.style.display = 'none'; };
        spinningDishImg.onerror = () => { spinningDishImg.style.display = 'none'; };
    };
    
    // Show final result
    const showResult = (selectedDish) => {
        const resultVendorImg = document.querySelector('.result-vendor-img');
        const resultVendorName = document.querySelector('.result-vendor-name');
        const resultDishName = document.querySelector('.result-dish-name');
        const resultDishImg = document.querySelector('.result-dish-img');
        const resultTimeslotsList = document.querySelector('.result-timeslots-list');
        
        resultVendorImg.src = selectedDish.vendor.imageUrl || '';
        resultVendorImg.alt = selectedDish.vendor.name;
        resultVendorName.textContent = selectedDish.vendor.name;
        resultDishName.textContent = selectedDish.dish.name;
        resultDishImg.src = selectedDish.dish.imageUrl || '';
        resultDishImg.alt = selectedDish.dish.name;
        
        // Setup details dialog for the result dish
        const resultDetailsDialog = document.querySelector('.result-dish-details');
        const resultDetailsName = document.querySelector('.result-details-name');
        const resultDetailsImg = document.querySelector('.result-details-img');
        const resultDetailsDescription = document.querySelector('.result-details-description');
        const resultDetailsCloseBtn = resultDetailsDialog.querySelector('button');
        
        // Populate details dialog
        resultDetailsName.textContent = selectedDish.dish.name;
        resultDetailsImg.src = selectedDish.dish.imageUrl || '';
        resultDetailsImg.alt = selectedDish.dish.name;
        resultDetailsDescription.textContent = selectedDish.dish.descriptionLong || selectedDish.dish.description || 'No description available';
        
        // Add click event to result dish image
        resultDishImg.addEventListener('click', () => {
            resultDetailsDialog.showModal();
        });
        
        // Setup close functionality for details dialog
        resultDetailsCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resultDetailsDialog.close();
        });
        
        // Click outside to close details dialog
        resultDetailsDialog.addEventListener('click', (e) => {
            const dialogRect = e.target.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            const isInDialog = x >= dialogRect.left && x <= dialogRect.right && 
                              y >= dialogRect.top && y <= dialogRect.bottom;
            if (!isInDialog) {
                resultDetailsDialog.close();
                e.stopPropagation();
            }
        });
        
        // Get today's timeslots for this specific dish
        // Debug logging to understand the data structure
        console.log('Selected dish vendor routeName:', selectedDish.vendor.routeName);
        console.log('Selected dish ID:', selectedDish.dish.id);
        console.log('All times sample:', allTimes.slice(0, 5));
        console.log('Available days:', [...new Set(allTimes.map(t => t.label))]);
        
        // Get current day in the same format as the system uses
        const dayLabels = [...new Set(allTimes.map(t => t.label))];
        const today = dayLabels.length > 0 ? dayLabels[0] : null; // Use first available day for testing
        
        console.log('Using day:', today);
        
        // Get timeslots for this specific dish - try different matching approaches
        let todaysTimeslots = allTimes.filter(t => 
            t.label === today && 
            t.vendor === selectedDish.vendor.routeName && 
            t.id === selectedDish.dish.id
        );
        
        console.log('Timeslots found (exact match):', todaysTimeslots.length);
        
        // If no exact match, try with sanitized IDs
        if (todaysTimeslots.length === 0) {
            todaysTimeslots = allTimes.filter(t => 
                t.label === today && 
                t.vendor === sanitizeId(selectedDish.vendor.routeName) && 
                t.id === sanitizeId(selectedDish.dish.id)
            );
            console.log('Timeslots found (sanitized match):', todaysTimeslots.length);
        }
        
        // Clear previous timeslots
        resultTimeslotsList.innerHTML = '';
        
        if (todaysTimeslots.length > 0) {
            const dateTimeFormatter = Intl.DateTimeFormat(
                'da-dk', 
                { 
                    hour: "numeric",
                    minute: "numeric",
                });
            
            todaysTimeslots.sort((a, b) => a.date - b.date).forEach(timeslot => {
                const timeslotElement = document.createElement("span");
                const time = Date.parse(timeslot.dateISO);
                timeslotElement.textContent = dateTimeFormatter.format(time);
                timeslotElement.className = `${timeslot.enabled ? "enabled" : "disabled"} timeslot result-timeslot`;
                resultTimeslotsList.appendChild(timeslotElement);
            });
        } else {
            const noTimesElement = document.createElement("span");
            noTimesElement.textContent = "Sorry, no pickup times available today. Try another day!";
            noTimesElement.className = "no-times";
            resultTimeslotsList.appendChild(noTimesElement);
        }
        
        spinningContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        spinButton.style.display = 'none';
    };
    
    // Reset dialog to initial state
    const resetDialog = () => {
        spinningContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        spinButton.style.display = 'inline-block';
        
        // Set initial default values
        const spinningVendorImg = document.querySelector('.spinning-vendor-img');
        const spinningDishName = document.querySelector('.spinning-dish-name');
        const spinningDishImg = document.querySelector('.spinning-dish-img');
        
        spinningVendorImg.style.display = 'none'; // Hide until we have actual images
        spinningDishImg.style.display = 'none'; // Hide until we have actual images
        spinningDishName.textContent = 'Ready to discover your next meal? Hit "Surprise Me!" 😋';
    };
    
    // Spin animation
    const spinThroughDishes = async (allDishes) => {
        const spinDuration = 3000; // 3 seconds
        const spinInterval = 100; // Update every 100ms
        const totalSteps = spinDuration / spinInterval;
        let currentStep = 0;
        
        return new Promise((resolve) => {
            const spinInterval_id = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * allDishes.length);
                updateSpinningDisplay(allDishes[randomIndex]);
                
                currentStep++;
                if (currentStep >= totalSteps) {
                    clearInterval(spinInterval_id);
                    // Select final random dish
                    const finalIndex = Math.floor(Math.random() * allDishes.length);
                    resolve(allDishes[finalIndex]);
                }
            }, spinInterval);
        });
    };
    
    // Event listeners
    randomDishBtn.addEventListener('click', () => {
        resetDialog();
        dialog.showModal();
    });
    
        spinButton.addEventListener('click', async () => {
        const allDishes = getAllDishes();
        if (allDishes.length === 0) {
            alert('Oops! No dishes are available right now. Please try again later.');
            return;
        }
        
        spinButton.disabled = true;
        spinButton.textContent = 'Finding something delicious...';
        
        // Update the text to show we're selecting
        document.querySelector('.spinning-dish-name').textContent = 'Looking for the perfect dish...';        try {
            const selectedDish = await spinThroughDishes(allDishes);
            showResult(selectedDish);
        } finally {
            spinButton.disabled = false;
            spinButton.textContent = '🎲 Surprise Me!';
        }
    });
    
    closeButton.addEventListener('click', () => {
        dialog.close();
    });
    
    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        const dialogRect = e.target.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        const isInDialog = x >= dialogRect.left && x <= dialogRect.right && 
                          y >= dialogRect.top && y <= dialogRect.bottom;
        if (!isInDialog) {
            dialog.close();
        }
    });
};


export { main };