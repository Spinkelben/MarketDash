import { ApiClient } from "./ApiClient.js";

let client = new ApiClient();
let vendors = {};
client.addHandler(e => {
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

            client.submitMessage('q', { p: `/Clients/${vendor.routeName}/activeMenu/categories`, h:"" });
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
                });
            }
        }
    }

    drawVendors();
})

let drawVendors = _ => {
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

await client.start();
await client.submitMessage('q', { p: "/clientUnits/compassdk_danskebank/all", h: "" });

drawVendors();
