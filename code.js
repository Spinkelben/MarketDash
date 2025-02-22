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
 * Gets the availabel times for the menu item
 * @param {string} id Id of the product
 * @param {string} name Name of the prodcut
 * @param {string} vendor vendor name
 * @param {Number} quantity Number of itmes to purchase
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
    for (const vendorId in vendors) {
        if (Object.hasOwnProperty.call(vendors, vendorId)) {
            const vendor = vendors[vendorId];
            const promises = vendor.menuItems.map(mi => getTimes(mi.id, mi.name, vendorId, 1));
            vendorTasks.push(Promise.all(promises));
        }
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

    const vendors = {};
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

        // Add hidden button to enable god mode
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


export { main };