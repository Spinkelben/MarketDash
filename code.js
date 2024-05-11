import { ApiClient } from "./ApiClient.js";

const messageHandler = e => {
    const path = e.d.b.p;
    if (path === "clientUnits/compassdk_danskebank/all") {
        let theMarket = e.d.b.d[0];
        console.log(theMarket);
        for (const idx in theMarket.children) {
            const vendor = theMarket.children[idx];
            vendors[vendor.routeName] = {
                name: vendor.name,
                routeName: vendor.routeName,
                imageUrl: vendor.imageUrl,
                menuItems: [],
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
                vendor.menuItems.push({
                    name: menuItem.Name,
                    description: menuItem.Description,
                    descriptionLong: menuItem.DescriptionLong,
                    imageUrl: menuItem.ImageUrl,
                    id: menuItem.key,
                    timeslots: [],
                });
            }
        }
    }
};

const drawVendors = _ => {
    let section = document.getElementById("food-table");
    section.childNodes.forEach(element => {
        element.remove();
    });
    for (const vendorRoute in vendors) {
        if (Object.hasOwnProperty.call(vendors, vendorRoute)) {
            const vendor = vendors[vendorRoute];
            let img = document.createElement("img");
            img.setAttribute("src", vendor.imageUrl);
            img.setAttribute("class", "vendor-img");
            let p = document.createElement("p");
            p.appendChild(img);
            let text = document.createTextNode(" "+ vendor.name + " ");
            p.appendChild(text);
            p.setAttribute("id", "header-" + vendor.routeName);
            section.appendChild(p);
            for (const menuItem of vendor.menuItems) {
                let img = document.createElement("img");
                img.setAttribute("src", menuItem.imageUrl);
                img.setAttribute("class", "vendor-img");
                let p = document.createElement("p");
                p.appendChild(img);
                let text = document.createTextNode(" "+ menuItem.name + " ");
                p.appendChild(text);
                p.setAttribute("id", "header-" + vendor.routeName);
                section.appendChild(p);
            }
        }
    }
};

const addTimes = (vendors, timeslots) => {
    for (const timeslot of timeslots) {
        const vendor = vendors[timeslot.vendor];
        const menuItem = vendor.menuItems.find(e => e.id === timeslot.id);
        menuItem.timeslots.push(timeslot);
    }
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
    if (times.length === 0) {
        times = [
            {
              "label": "TOMORROW",
              "timestamp": 1715292000,
              "timeslots": [
                {
                  "label": "11:00",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715331600,
                  "dateISO": "2024-05-10T09:00:00.000Z"
                },
                {
                  "label": "11:20",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715332800,
                  "dateISO": "2024-05-10T09:20:00.000Z"
                },
                {
                  "label": "11:40",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715334000,
                  "dateISO": "2024-05-10T09:40:00.000Z"
                },
                {
                  "label": "12:00",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715335200,
                  "dateISO": "2024-05-10T10:00:00.000Z"
                },
                {
                  "label": "12:20",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715336400,
                  "dateISO": "2024-05-10T10:20:00.000Z"
                },
                {
                  "label": "12:40",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715337600,
                  "dateISO": "2024-05-10T10:40:00.000Z"
                },
                {
                  "label": "13:00",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715338800,
                  "dateISO": "2024-05-10T11:00:00.000Z"
                },
                {
                  "label": "13:20",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715340000,
                  "dateISO": "2024-05-10T11:20:00.000Z"
                },
                {
                  "label": "13:40",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715341200,
                  "dateISO": "2024-05-10T11:40:00.000Z"
                },
                {
                  "label": "14:00",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715342400,
                  "dateISO": "2024-05-10T12:00:00.000Z"
                },
                {
                  "label": "14:20",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715343600,
                  "dateISO": "2024-05-10T12:20:00.000Z"
                },
                {
                  "label": "14:40",
                  "enabled": true,
                  "disabledReason": [],
                  "date": 1715344800,
                  "dateISO": "2024-05-10T12:40:00.000Z"
                }
              ]
            }
          ];
    }
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

const vendors = {};
const client = new ApiClient();
await client.start();
let fistMessage = await client.readMessage(1000);
if (fistMessage !== null) {
    
}
else {
    console.error("Sum ting won");
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
        vendorTasks.push(async () => {
            await Promise.all(promises);
            timeslots.forEach(t => addTimes(vendors, t));
            });
    }
}

await Promise.all(vendorTasks);
console.log(vendors);
drawVendors();
