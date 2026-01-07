use rocket::State;
use rocket::futures::lock::Mutex;
use rocket::response::content::RawJson;
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::tokio::time::{Instant, Duration};
use rocket::fs::FileServer;
use std::collections::HashMap;
// Tracing and logging
use opentelemetry_otlp::{Protocol, WithExportConfig};
use opentelemetry_appender_tracing::layer;
use opentelemetry_sdk::logs::SdkLoggerProvider;
use opentelemetry_sdk::Resource;
use tracing::{error, info, instrument};
use tracing_subscriber:: {prelude::*, EnvFilter};

use crate::pubq_client::PubqClient;
mod pubq_client;

#[macro_use] extern crate rocket;

struct VendorCache(Instant, String);

#[get("/vendors")]
#[instrument]
async fn get_vendors(client : &State<Mutex<PubqClient>>, cache: &State<Mutex<Option<VendorCache>>>) -> Result<RawJson<String>, String> {
    {
        let cache = &cache.lock().await;
        if let Some(vendor_cache) = cache.as_ref() {
            if vendor_cache.0.elapsed() < Duration::from_secs(300) {
                return Ok(RawJson(vendor_cache.1.clone()));
            }
        }
    }

    info!("Fetching vendors from PubQ");
    let mut client = client.lock().await;
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    // Retry loop for get_vendors (up to 3 attempts with simple backoff)
    let mut attempts = 0;
    let vendors = loop {
        attempts += 1;
        match client.get_vendors(Duration::from_secs(5)).await.map_err(|e| format!("Get vendors failed {:?}", e)) {
            Ok(v) => break v,
            Err(e) if attempts >= 3 => { 
                error!("Get vendors failed after {} attempts: {:?}", attempts, e);
                return Err(format!("Get vendors failed after {} attempts: {:?}", attempts, e));     
            },
            Err(_) => {
                warn!("Get vendors attempt {} failed, retrying...", attempts);
                client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Re-connection failed {:?}", er))?;
            }
        }
    };

    let vendors_json = serde_json::to_string(&vendors)
        .map_err(|er| { 
            error!("Failed to serialize vendors: {:?}", er);
            format!("Serialization failed {:?}", er) 
    })?;
    let cache = &mut cache.lock().await;
    **cache = Some(VendorCache(Instant::now(), vendors_json.clone()));
    Ok(RawJson(vendors_json))
}

struct VenderMenuCache(HashMap<String, (Instant, serde_json::Value)>);

#[get("/menu/<vendor_id>")]
#[instrument]
async fn get_menu(vendor_id: &str, client : &State<Mutex<PubqClient>>, vendor_cache : &State<Mutex<VenderMenuCache>>) -> Result<RawJson<String>, String> {
    let cache = &mut vendor_cache.lock().await.0;
    if let Some((timestamp, cached_menu)) = cache.get(vendor_id) {

        if timestamp.elapsed() < Duration::from_secs(300) {
            let menu_json = serde_json::to_string(cached_menu)
                .map_err(|er| {
                    error!("Failed to serialize cached menu: {:?}", er);
                    format!("Serialization failed {:?}", er) 
                })?;
            return Ok(RawJson(menu_json));
        }
    }

    info!("Fetching menu for vendor {} from PubQ", vendor_id);
    let mut client = client.lock().await;
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    let mut attempts = 0;
    let menu = loop {
        attempts += 1;
        match client.get_vender_menu(vendor_id, Duration::from_secs(5)).await
            .map_err(|er| format!("Get menu failed {:?}", er)) {
            Ok(menu) => break menu,
            Err(e) if attempts < 3 => {
                warn!("Get menu failed: {:?}, retrying...", e);
                client.connect(Duration::from_secs(5)).await
                    .map_err(|er| format!("Re-connection failed {:?}", er))?;
            },
            Err(e) => { 
                error!("Get menu failed after {} attempts: {:?}", attempts, e);
                return Err(format!("Get menu failed after {} attempts: {:?}", attempts, e))
            },
        }    
    };

    cache.insert(vendor_id.to_string(), (Instant::now(), menu.clone()));

    let menu_json = serde_json::to_string(&menu)
        .map_err(|er| {
            error!("Failed to serialize menu: {:?}", er);
            format!("Serialization failed {:?}", er) 
        })?;
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
#[instrument(skip(body))]
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
    
    info!("Fetching timeslots for key {} from external service", cache_key);
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

#[get("/health")]
#[instrument]
fn health() -> &'static str {
    "OK"
}

fn setup_cors() -> rocket_cors::Cors {
    let allowed_origins = rocket_cors::AllowedOrigins::all();
    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allow_credentials: true,
        ..Default::default()
    }.to_cors().expect("Error creating CORS fairing");
    cors
}

fn setup_telemetry(otel_endpoint: &str) {
    let otel_exporter = opentelemetry_otlp::LogExporter::builder()
        .with_http()
        .with_protocol(Protocol::HttpBinary)
        .with_endpoint(otel_endpoint)
        .build()
        .expect("Failed to create OTLP Log Exporter");

    let provider : SdkLoggerProvider = SdkLoggerProvider::builder()
        .with_resource(
            Resource::builder()
                .with_service_name("market-food-dashboard-backend")
                .build(),
        )
        .with_batch_exporter(otel_exporter)
        .build();

    // TODO: Remove logs fomr select components
    let filter = EnvFilter::new("info")
        .add_directive("rocket=warn".parse().unwrap());
    let otel_layer  = layer::OpenTelemetryTracingBridge::new(&provider)
        .with_filter(filter);

    // This causes output to the console
    let filter_fmt = EnvFilter::new("info")
        .add_directive("opentelemetry=info".parse().unwrap())
        .add_directive("rocket=warn".parse().unwrap());
    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_thread_names(true)
        .with_filter(filter_fmt);

    tracing_subscriber::registry()
        .with(otel_layer)
        .with(fmt_layer)
        .init();
}

#[launch]
fn rocket() -> _ {
    let figment = rocket::Config::figment();
    let otel_endpoint: String = figment.extract_inner("otel_endpoint").expect("Missing 'otel_endpoint' configuration in Rocket.toml");
    setup_telemetry(&otel_endpoint);
    
    let cors = setup_cors();
    rocket::build()
        .mount("/api", routes![get_vendors, get_menu, get_item_timeslots, health])
        .mount("/", FileServer::from("../front-end"))
        .manage(Mutex::new(PubqClient::new()))
        .manage(Mutex::new(VenderMenuCache(HashMap::new())))
        .manage(Mutex::new(TimeSlotCache(HashMap::new())))
        .manage(Mutex::new(Option::None::<VendorCache>))
        .attach(cors)        
}