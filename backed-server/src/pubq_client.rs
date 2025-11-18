use rocket::futures::{StreamExt, TryStreamExt};
use serde_json::Value;


const SOCKET_URL : &str = "wss://s-usc1a-nss-2040.firebaseio.com/.ws?v=5&ns=pq-dev";

#[derive(serde::Serialize, serde::Deserialize, Debug)]
enum MessageType {
    #[serde(rename = "c")]
    Control,
    #[serde(rename = "d")]
    Data,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
enum MessageData {
    Header(Value),
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct MessageWrapper {
    #[serde(rename = "t")]
    r#type: MessageType,
    #[serde(rename = "d")]
    data: Value,
}
pub struct PubqClient {
    socket_url: String,
    next_id: u64,
    stream: Option<tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>>,
}

impl PubqClient {
    pub fn new() -> Self {
        PubqClient {
            socket_url: SOCKET_URL.to_string(),
            next_id: 1,
            stream: None,
        }
    }

    pub async fn connect(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let (ws_stream, _) = tokio_tungstenite::connect_async(&self.socket_url).await?;
        self.stream = Some(ws_stream);
        Ok(())
    }

    pub async fn receive_message(&mut self) -> Result<String, Box<dyn std::error::Error>> {
        let mut messages = vec![];
        if let Some(stream) = &mut self.stream {
            while let Ok(Some(msg)) = stream.try_next().await {
                if msg.is_text() {
                    let text = msg.into_text()?;
                    let parsed : MessageWrapper = serde_json::from_str(&text)?;
                    let result = format!("Received message: {:?}\nRaw: {:#?}", parsed, text.to_string());
                    messages.push(result.clone());
                }
            }

            return Ok(messages.join("\n"));
        }
        Err("No message received".into())
    }
}