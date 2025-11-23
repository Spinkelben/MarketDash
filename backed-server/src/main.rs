use std::time::Duration;

use rocket::{Shutdown, build};
mod pubq_client;

#[macro_use] extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[get("/test")]
async fn test(mut shutdown: Shutdown) -> Result<String, String> {
    let mut client = pubq_client::PubqClient::new();
    client.connect().await.map_err(|er| format!("Connection failed {:?}", er))?;
    let first_message = client.receive_message(shutdown, Duration::from_secs(5)).await.map_err(|er| format!("Receive failed {:?}", er))?;
    Ok(format!("First message: {}", first_message))
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index, test])
}