use rocket::futures::StreamExt;
use serde_json::Value;


const SOCKET_URL : &str = "wss://s-usc1a-nss-2040.firebaseio.com/.ws?v=5&ns=pq-dev";

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
        if let Some(stream) = &mut self.stream {
            if let Some(msg) = stream.next().await {
                let msg = msg?;
                if msg.is_text() {
                    let text = msg.into_text()?;
                    let parsed = serde_json::from_str::<serde_json::Value>(&text)?;
                    return Ok(text.to_string());
                }
            }
        }
        Err("No message received".into())
    }
}