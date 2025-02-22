import { ApiClient } from "./ApiClient.js";

const messageHandler = e => {
    const path = e?.d?.b?.p;
    if (path === undefined) {
        console.error("No path in message", e);
        return;
    }

    if (path === "clientUnits/compassdk_danskebank/all") {
        for (const index in e.d.b.d) {
            let location = e.d.b.d[index];
            console.log(location);
            if (location.children !== undefined) {
                for (const idx in location.children) {
                    const vendor = location.children[idx];
                    if (!validateVendor(vendor)) {
                        console.error('Invalid vendor data:', vendor);
                        return;
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
                // Skip the cafes for now
                if (vendor.routeName === "compassdk_townhallcafe"
                    || vendor.routeName === "compassdk_centralcafe"
                ) {
                    continue;
                }
                if (!validateVendor(vendor)) {
                    console.error('Invalid vendor data:', vendor);
                    return;
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
        const vendorRoute = path.match(/Clients\/(\w+)\/activeMenu\/categories/)[1];
        let vendor = vendors[vendorRoute];
        vendor.menuItems = [];
        const items = e.d.b.d["0"].items;
        for (const key in items) {
            if (Object.hasOwnProperty.call(items, key)) {
                const menuItem = items[key];
                if (menuItem.enabled === false || !validateMenuItem(menuItem))
                {
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
    text.forEach((i) => i.textContent = `${menuItem.name} - ${menuItem.price} kr.`);
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

const drawVendorsAndMenuItems = () => {
    let section = document.getElementById("food-table");
    section.childNodes.forEach(element => {
        element.remove();
    });

    for (const vendorRoute in vendors) {
        if (Object.hasOwnProperty.call(vendors, vendorRoute)) {
            const vendor = vendors[vendorRoute];
            const vendorElement = createVendorElement(vendor);
            const menuItemList = vendorElement.querySelector(".menu-item-list");
            
            for (const menuItem of vendor.menuItems) {
                const menuItemElement = createMenuItemElement(vendor, menuItem);
                menuItemList.appendChild(menuItemElement);
            }
            section.appendChild(vendorElement);
        }
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

const displayTimes = (dayLabel) => {
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

const setupTimeslotSelector = (dayLabels) => {
    const optionPicker = document.querySelector("#day-selector");
    optionPicker.addEventListener('change', (e) => {
        displayTimes(e.target.value);
    });

    if (optionPicker.childNodes.length === 0) {
        for (const dayOption of dayLabels) {
            let el = document.createElement("option");
            el.textContent = dayOption;
            el.value = dayOption;
            optionPicker.appendChild(el);
        }
    }
    displayTimes(optionPicker.value);
    optionPicker.style.display = "";
};

const spinner = document.getElementById('load-icon');
spinner.innerText = getRandomFoodIcon();
const vendors = {};
const client = new ApiClient();
await client.start();
let fistMessage = await client.readMessage(1000);
if (fistMessage !== null) {
    
}
else {
    console.error("Client Api connection not initialized correctly");
}

let response = await client.submitMessage('q', { p: "/clientUnits/compassdk_danskebank/all", h: "" });
console.log(response);
let listVendorResponse = await client.readMessage(1000);
messageHandler(listVendorResponse);
for (const vendorRoute in vendors) {
    if (Object.hasOwnProperty.call(vendors, vendorRoute)) {
        const vendor = vendors[vendorRoute];
        await client.submitMessage('q', { p: `/Clients/${vendor.routeName}/activeMenu/categories`, h:"" });
        let menu = await client.readMessage(1000);
        messageHandler(menu);
    }
}

const vendorTasks = [];
for (const vendorId in vendors) {
    if (Object.hasOwnProperty.call(vendors, vendorId)) {
        const vendor = vendors[vendorId];
        let promises = vendor.menuItems.map(mi => getTimes(mi.id, mi.name, vendorId, 1));
        vendorTasks.push(Promise.all(promises));
    }
}

console.log(vendors);
drawVendorsAndMenuItems();
spinner.style.display = 'none';
let allTimes = (await Promise.all(vendorTasks)).flat().flat();
const days = new Set(allTimes.map(t => t.label));
setupTimeslotSelector(days);

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
    const required = ['name', 'routeName', 'imageUrl'];
    return required.every(prop => typeof vendor[prop] === 'string') &&
           typeof vendor.visible === 'boolean';
}

function validateMenuItem(item) {
    return typeof item.Name === 'string' &&
           typeof item.Description === 'string' &&
           typeof item.ImageUrl === 'string' &&
           typeof item.Cost === 'number' &&
           /^\d+$/.test(item.Cost);
}
