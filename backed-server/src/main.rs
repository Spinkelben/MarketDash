use std::time::Duration;

use rocket::{Shutdown, build, response::content::RawJson};
use tokio::select;
mod pubq_client;

#[macro_use] extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[get("/test")]
async fn test(mut shutdown: Shutdown) -> Result<String, String> {
    let mut client = pubq_client::PubqClient::new();
    select! {
        _ = tokio::time::sleep(Duration::from_secs(10)) => {
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

    //let first_message = client.receive_message(shutdown, ).await.map_err(|er| format!("Receive failed {:?}", er))?;
    //Ok(format!("First message: {}", first_message))
}

#[get("/vendors")]
async fn get_vendors() -> Result<RawJson<String>, String> {
    let mut client = pubq_client::PubqClient::new();
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    let vendors = client.get_vendors(Duration::from_secs(5)).await
        .map_err(|er| format!("Get vendors failed {:?}", er))?;
    let vendors_json = serde_json::to_string(&vendors)
        .map_err(|er| format!("Serialization failed {:?}", er))?;
    Ok(RawJson(vendors_json))
}

#[get("/menu/<vendor_id>")]
async fn get_menu(vendor_id: &str) -> Result<RawJson<String>, String> {
    let mut client = pubq_client::PubqClient::new();
    client.connect(Duration::from_secs(5)).await.map_err(|er| format!("Connection failed {:?}", er))?;

    let menu = client.get_vender_menu(vendor_id, Duration::from_secs(5)).await
        .map_err(|er| format!("Get menu failed {:?}", er))?;
    let menu_json = serde_json::to_string(&menu)
        .map_err(|er| format!("Serialization failed {:?}", er))?;
    Ok(RawJson(menu_json))
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
        .mount("/", routes![index, test, get_vendors, get_menu])
        .attach(cors)        
}