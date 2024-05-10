import { ApiClient } from "./ApiClient.js";


async function  getMenu(e) {
    var client = new ApiClient();
    await client.start();
    let response = await client.submitMessage('s', { 
        c: { 
            "sdk.js.9-21-0": 1, 
            "framework.cordova": 1 }});
    console.log(response);
    response = await client.submitMessage('q', { p: "/PubQConfig", h: "" });
    console.log(response);
    response = await client.submitMessage('q', { p: "/Categories", h: "" });
    console.log(response);
    response = await client.submitMessage('q', { p: "/clientUnits/compassdk_danskebank/all", h: "" });
    console.log(response);
} 

let client = new ApiClient();
client.addHandler(e => {
    if (e.d.b.p === "clientUnits/compassdk_danskebank/all") {
        let theMarket = e.d.b.d[0];
        console.log(theMarket);
        let table = document.getElementById("food-table");
        for (const idx in theMarket.children) {
            if (Object.hasOwnProperty.call(theMarket.children, idx)) {
                const element = theMarket.children[idx];
                let row = document.createElement("tr");
                table.appendChild(row);
                let cell = document.createElement("td");
                row.appendChild(cell);
                cell.innerText = element.name;
            }
        }
    }
})
await client.start();
let response = await client.submitMessage('q', { p: "/clientUnits/compassdk_danskebank/all", h: "" });

console.log(response);