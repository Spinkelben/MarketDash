use rocket::{Shutdown, futures::{TryStreamExt}};
use serde_json::Value;
use std::time::Duration;
use tokio::select;


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
#[serde(tag = "t", content = "d")]
enum Control {
    #[serde(rename = "h")]
    Header { 
        #[serde(rename = "h")]
        header: String, 
        #[serde(rename = "s")]
        session_id: String, 
        #[serde(rename = "ts")]
        timestamp: u64, 
        #[serde(rename = "v")]
        version: String },
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(tag = "t", content = "d")]
enum MessageWrapper {
    #[serde(rename = "c")]
    Control(Control),
    Data(Value),
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

    pub async fn receive_message(&mut self, mut shutdown : Shutdown, timeout : Duration) -> Result<String, Box<dyn std::error::Error>> {
        let mut messages = vec![];
        if let Some(stream) = &mut self.stream {
            loop {
                select! {
                    _ = tokio::time::sleep(timeout) => {
                        println!("Timeout reached while waiting for messages.");
                        break;
                    },
                    _ = &mut shutdown => {
                        println!("Shutdown signal received, stopping message reception.");
                        return Err("Shutdown".into());
                    },
                    msg = stream.try_next() =>  {
                        let msg = match msg? {
                            Some(m) => m,
                            None => break,
                        };
                        if msg.is_text() {
                            let text = msg.into_text()?;
                            println!("Raw message text: {}", text);
                            let parsed : MessageWrapper = serde_json::from_str(&text)?;
                            let result = format!("Received message: {:?}", parsed);
                            println!("{}", result);
                            messages.push(result);
                        }
                    }
                }
            }
            
            return Ok(messages.join("\n"));
        }
        Err("No message received".into())
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn can_parse_control_message() {
        let raw_message = r#"{"t":"c","d":{"t":"h","d":{"ts":1763912344687,"v":"5","h":"s-gke-usc1-nssi1-17.firebaseio.com","s":"OAg9F6yx2JzGq4zZMZqrILfcu6s3AQOX"}}}"#;
        let parsed: MessageWrapper = serde_json::from_str(raw_message).unwrap();
        match parsed {
            MessageWrapper::Control(Control::Header { header, session_id, timestamp, version }) => {
                assert_eq!(header, "s-gke-usc1-nssi1-17.firebaseio.com");
                assert_eq!(session_id, "OAg9F6yx2JzGq4zZMZqrILfcu6s3AQOX");
                assert_eq!(timestamp, 1763912344687);
                assert_eq!(version, "5");
            },
            _ => panic!("Parsed message is not a Control Header"),
        }
    }
}