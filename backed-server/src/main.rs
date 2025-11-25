use rocket::State;
use rocket::futures::lock::Mutex;
use rocket::{Shutdown, response::content::RawJson, tokio::select};
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::tokio::time::{Instant, Duration};
use rocket::fs::FileServer;
use std::collections::HashMap;

use crate::pubq_client::PubqClient;
mod pubq_client;

#[macro_use] extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[get("/test")]
async fn test(mut shutdown: Shutdown, client : &State<Mutex<PubqClient>>) -> Result<String, String> {
    let mut client = client.lock().await;
    select! {
        _ =  tokio::spawn(async move { tokio::time::sleep(Duration::from_secs(10)).await }) => {
            return Err("Timeout reached before connection".into());
        },
        _ = &mut shutdown => {
            return Err("Shutdown signal received before connection".into());
        },
        res = client.connect(Duration::from_secs(5)) => {
            println!("Connection attempt finished.");
            println!("{:#?}", res);
            if let Err(er) = res {
                return Err(format!("Connection failed {:?}", er));
            }

            return Ok("Connected successfully".into());
        },
    }
}

#[get("/vendors")]
async fn get_vendors(client : &State<Mutex<PubqClient>>) -> Result<RawJson<String>, String> {
    let mut client = client.lock().await;
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    // Retry loop for get_vendors (up to 3 attempts with simple backoff)
    let mut attempts = 0;
    let vendors = loop {
        attempts += 1;
        match client.get_vendors(Duration::from_secs(5)).await.map_err(|e| format!("Get vendors failed {:?}", e)) {
            Ok(v) => break v,
            Err(e) if attempts >= 3 => return Err(format!("Get vendors failed after {} attempts: {:?}", attempts, e)),
            Err(_) => {
                println!("Get vendors attempt {} failed, retrying...", attempts);
                client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Re-connection failed {:?}", er))?;
            }
        }
    };

    let vendors_json = serde_json::to_string(&vendors)
        .map_err(|er| format!("Serialization failed {:?}", er))?;
    Ok(RawJson(vendors_json))
}

struct VenderMenuCache(HashMap<String, (Instant, serde_json::Value)>);

#[get("/menu/<vendor_id>")]
async fn get_menu(vendor_id: &str, client : &State<Mutex<PubqClient>>, vendor_cache : &State<Mutex<VenderMenuCache>>) -> Result<RawJson<String>, String> {
    let cache = &mut vendor_cache.lock().await.0;
    if let Some((timestamp, cached_menu)) = cache.get(vendor_id) {

        if timestamp.elapsed() < Duration::from_secs(300) {
            let menu_json = serde_json::to_string(cached_menu)
                .map_err(|er| format!("Serialization failed {:?}", er))?;
            return Ok(RawJson(menu_json));
        }
    }

    let mut client = client.lock().await;
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    let mut attempts = 0;
    let menu = loop {
        attempts += 1;
        match client.get_vender_menu(vendor_id, Duration::from_secs(5)).await
            .map_err(|er| format!("Get menu failed {:?}", er)) {
            Ok(menu) => break menu,
            Err(e) if attempts < 3 => {
                println!("Get menu failed: {:?}, retrying...", e);
                client.connect(Duration::from_secs(5)).await
                    .map_err(|er| format!("Re-connection failed {:?}", er))?;
            },
            Err(e) => return Err(format!("Get menu failed after {} attempts: {:?}", attempts, e)),
        }    
    };

    cache.insert(vendor_id.to_string(), (Instant::now(), menu.clone()));

    let menu_json = serde_json::to_string(&menu)
        .map_err(|er| format!("Serialization failed {:?}", er))?;
    Ok(RawJson(menu_json))
}

#[derive(Deserialize, Serialize)]
struct TimeslotRequest {
    #[serde(rename = "routeName")]
    route_name: String,
    products: Vec<TimeslotProduct>,
}

#[derive(Deserialize, Serialize)]
struct TimeslotProduct {
    #[serde(rename = "bongCategoryId")]
    bong_category_id: i32,
    #[serde(rename = "productId")]
    product_id: String,
    #[serde(rename = "productName")]
    product_name: String,
    quantity: u32,
}

struct TimeSlotCache(HashMap<String, (Instant, String)>);

#[post("/timeslots", data = "<body>")]
async fn get_item_timeslots(body : Json<TimeslotRequest>, timeslot_cache : &State<Mutex<TimeSlotCache>>) -> Result<RawJson<String>, String> {
    let cache_key = format!(
        "{}-{}",
        body.route_name,
        &body.products.iter()
            .map(|p| p.product_id.clone())
            .collect::<Vec<String>>().join("|"));

    {
        let cache = &mut timeslot_cache.lock().await.0;
            
        if let Some((timestamp, cached_timeslots)) = cache.get(&cache_key) {
            if timestamp.elapsed() < Duration::from_secs(300) {
                return Ok(RawJson(cached_timeslots.clone()));
            }
        }
    }
    
    let request = body.into_inner();
    let json = serde_json::to_string(&request)
        .map_err(|er| format!("Serialization failed {:?}", er))?;
    let response = reqwest::Client::new()
        .post("https://payments2-jaonrqeeaq-ew.a.run.app/v1/orders/timeslots")
        .header("Content-Type", "application/json")
        .body(json)
        .send()
        .await
        .map_err(|er| format!("HTTP request failed {:?}", er))?;    
    let timeslots_json = response.text().await
        .map_err(|er| format!("Deserializing response failed {:?}", er))?;
    let cache = &mut timeslot_cache.lock().await.0;

    cache.insert(cache_key, (Instant::now(), timeslots_json.clone()));
    Ok(RawJson(timeslots_json))
}

#[launch]
fn rocket() -> _ {
    let allowed_origins = rocket_cors::AllowedOrigins::all();
    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allow_credentials: true,
        ..Default::default()
    }.to_cors().expect("Error creating CORS fairing");

    rocket::build()
        .mount("/api", routes![index, test, get_vendors, get_menu, get_item_timeslots])
        .mount("/", FileServer::from("../front-end"))
        .manage(Mutex::new(PubqClient::new()))
        .manage(Mutex::new(VenderMenuCache(HashMap::new())))
        .manage(Mutex::new(TimeSlotCache(HashMap::new())))
        .attach(cors)        
}