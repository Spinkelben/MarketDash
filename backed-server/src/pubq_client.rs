use rocket::{futures::{SinkExt, TryStreamExt}, tokio::select, serde::{Deserialize, Serialize}};
use serde_json::Value;
use std::time::Duration;

const SOCKET_URL : &str = "wss://s-usc1a-nss-2040.firebaseio.com/.ws?v=5&ns=pq-dev";

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "t", content = "d")]
enum MessageWrapper {
    #[serde(rename = "c")]
    Control(Control),
    #[serde(rename = "d")]
    Data(Data),
}

#[derive(Serialize, Deserialize, Debug)]
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

#[derive(Serialize, Deserialize, Debug)]
struct  Data {
    #[serde(rename = "r")]
    request_id : Option<u64>,
    #[serde(rename = "a")]
    action : Option<RequestAction>,
    #[serde(rename = "b")]
    body : RequestBody,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
enum RequestAction {
    #[serde(rename = "q")]
    Query,
    #[serde(rename = "d")]
    Data,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct RequestBody {
    #[serde(rename = "p", skip_serializing_if = "Option::is_none")]
    path : Option<String>,
    #[serde(rename = "h", skip_serializing_if = "Option::is_none")]
    hash : Option<String>,
    #[serde(rename = "s", skip_serializing_if = "Option::is_none")]
    status: Option<RequestStatus>,
    #[serde(rename = "d", skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
enum RequestStatus {
    #[serde(rename = "ok")]
    Ok,
    #[serde(rename = "fail")]
    Fail,
}

pub struct PubqClient {
    socket_url: String,
    next_id: u64,
    stream: Option<tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>>,
    is_connected: bool,
}

impl PubqClient {
    pub fn new() -> Self {
        PubqClient {
            socket_url: SOCKET_URL.to_string(),
            next_id: 1,
            stream: None,
            is_connected: false,
        }
    }

    pub async fn connect(&mut self, timeout : Duration) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_connected {    
            return Ok(());
        }

        let (ws_stream, _) = tokio_tungstenite::connect_async(&self.socket_url).await?;
        self.stream = Some(ws_stream);
        self.next_id = 1;
        let header = self.receive_message(timeout).await?;
        let header = serde_json::from_str::<MessageWrapper>(&header)?;
        match header {
            MessageWrapper::Control(_) => {
                self.is_connected = true;
                return Ok(());
            },
            _ => {
                return Err("Expected control header message".into());
            }
        }
    }

    async fn receive_message(&mut self, timeout : Duration) -> Result<String, Box<dyn std::error::Error>> {
        if let Some(stream) = &mut self.stream {
            select! {
                _ = tokio::spawn(async move { tokio::time::sleep(timeout).await }) => {
                    println!("Timeout reached while waiting for messages.");
                },
                msg = stream.try_next() =>  {
                    let msg = match msg {
                        Ok(Some(m)) => m,
                        Ok(None) => {
                            // Stream closed (EOF). Clean up state and return an error so callers know.
                            self.is_connected = false;
                            // Drop the stream by taking it out of the option to avoid holding a mutable borrow.
                            self.stream = None;
                            return Err("WebSocket closed (EOF)".into());
                        }
                        Err(e) => {
                            // On underlying error, mark disconnected and drop stream.
                            self.is_connected = false;
                            self.stream = None;
                            return Err(Box::new(e));
                        }
                    };
                    if msg.is_text() {
                        let text = msg.into_text()?;
                        return Ok(text.to_string());
                    }
                }
            }
        }
        Err("No message received".into())
    }

    pub async fn get_vendors(&mut self, timeout: Duration) -> Result<Value, Box<dyn std::error::Error>> {
        if let Some(stream) = &mut self.stream {
            let request = MessageWrapper::Data(Data {
                request_id: Some(self.next_id),
                action: Some(RequestAction::Query),
                body: RequestBody {
                    path: Some("/clientUnits/compassdk_danskebank/all".to_string()),
                    hash: Some("".to_string()),
                    ..Default::default()
                }
            });
            let request_text = serde_json::to_string(&request)?;
            match stream.send(tokio_tungstenite::tungstenite::Message::Text(request_text.into())).await {
                Err(_) => {
                    // Treat as disconnected (send failed). Clean up stream and return error.
                    self.is_connected = false;
                    self.stream = None;
                },
                Ok(()) => {}
            }
            self.next_id += 1;
            let response_text = self.receive_message(timeout).await?;
            let response = serde_json::from_str::<MessageWrapper>(&response_text)?;
            let mut vendors_opt: Option<Value> = None;
            let status_message = self.receive_message(timeout).await?;
            let status = serde_json::from_str::<MessageWrapper>(&status_message)?;
            match status {
                MessageWrapper::Data(data) => {
                    if data.body.status == Some(RequestStatus::Ok) {
                        match response {
                            MessageWrapper::Data(data) => {
                                if data.action == Some(RequestAction::Data) {
                                    vendors_opt = data.body.data;
                                }
                            },
                            _ => return Err("Expected data message".into()),
                        }
                    }
                },
                _ => return Err("Expected data message".into()),
            }

            return vendors_opt.ok_or("No vendors data found".into());
        }

        Err("Failed to get vendors".into())
    }

    pub async fn get_vender_menu(&mut self, vendor_route: &str, timeout: Duration) -> Result<Value, Box<dyn std::error::Error>> {
        if let Some(stream) = &mut self.stream {
            let path = format!("/Clients/{}/activeMenu/categories", vendor_route);
            let request = MessageWrapper::Data(Data {
                request_id: Some(self.next_id),
                action: Some(RequestAction::Query),
                body: RequestBody {
                    path: Some(path),
                    hash: Some("".to_string()),
                    ..Default::default()
                }
            });
            let request_text = serde_json::to_string(&request)?;
            match stream.send(tokio_tungstenite::tungstenite::Message::Text(request_text.into())).await {
                Err(_) => {
                    // Treat as disconnected (send failed). Clean up stream and return error.
                    self.is_connected = false;
                    self.stream = None;
                },
                Ok(()) => {}  
            };
            
            self.next_id += 1;
            let response_text = self.receive_message(timeout).await?;
            let response = serde_json::from_str::<MessageWrapper>(&response_text)?;
            let mut menu_opt: Option<Value> = None;
            let status_message = self.receive_message(timeout).await?;
            let status = serde_json::from_str::<MessageWrapper>(&status_message)?;
            match status {
                MessageWrapper::Data(data) => {
                    if data.body.status == Some(RequestStatus::Ok) {
                        match response {
                            MessageWrapper::Data(data) => {
                                if data.action == Some(RequestAction::Data) {
                                    menu_opt = data.body.data;
                                }
                            },
                            _ => return Err("Expected data message".into()),
                        }
                    }
                },
                _ => return Err("Expected data message".into()),
            }

            return menu_opt.ok_or("No menu data found".into());
        }

        Err("Connection failure".into())
    }

}

impl Drop for PubqClient {
    fn drop(&mut self) {
        println!("Dropping PubqClient and closing connection.");
        if let Some(mut s) = self.stream.take()
        {
            _ = s.close(None);
        }
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

    #[test]
    fn can_serialize_request_message() {
        let request = MessageWrapper::Data(Data {
            request_id: Some(1),
            action: Some(RequestAction::Query),
            body: RequestBody { 
                path: Some("/clientUnits/compassdk_danskebank/all".to_string()), 
                hash: Some("".to_string()), 
                ..Default::default()
            }
        });
        let serialized = serde_json::to_string(&request).unwrap();
        assert_eq!(serialized, r#"{"t":"d","d":{"r":1,"a":"q","b":{"p":"/clientUnits/compassdk_danskebank/all","h":""}}}"#);
    }

    #[test]
    fn can_parse_status_response() {
        let raw_message = r#"{"t":"d","d":{"r":1,"b":{"s":"ok","d":{}}}}"#;
        let parsed: MessageWrapper = serde_json::from_str(raw_message).unwrap();
        match parsed {
            MessageWrapper::Data(data) => {
                assert_eq!(data.request_id, Some(1));
                assert_eq!(data.action, None);
                assert_eq!(data.body.path, None);
                assert_eq!(data.body.hash, None);
                assert_eq!(data.body.status, Some(RequestStatus::Ok));
                assert_eq!(data.body.data, Some(serde_json::json!({})));
                
            },
            _ => panic!("Parsed message is not a Data message"),
        }
    }

    #[test]
    fn can_parse_data_response() {
        let raw_message = r#"{"t":"d","d":{"b":{"p":"clientUnits/compassdk_danskebank/all","d":{"0":{"address":"Order your lunch from our culinary haven","children":{"0":{"address":"","blurHash":"U8S~x6of~pj[WBfQt6j[~oay4oj[xuj[M|ay","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor10a%2FVendors%20Logo%20(2).png_1756731493.539?alt=media&token=dd7e6aec-94ed-4da4-a8a3-100c7ab17b8c","name":"Palæo","routeName":"compassdk_dbvendor10a","timeslots":true,"visible":false},"1":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor1%2FDB_app_vendor_logo_dhaba_gul.jpg?alt=media&token=cf408d62-a6fd-47e5-8a6b-49c5b15b50f9","name":"Dhaba","routeName":"compassdk_dbvendor1","timeslots":true,"visible":true},"2":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor2%2FDB_app_vendor_logo_gao_dumpling.jpg?alt=media&token=17406c56-b8bd-4103-96e8-eea3a01f76ce","name":"Gao Dumpling","routeName":"compassdk_dbvendor2","timeslots":true,"visible":true},"3":{"address":"","blurHash":"U9K1I0@;mPInJCELW[MIDhra%%H=[nQ8-?W?","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor3%2FNEW%20GROD.jpg_1733847188.417?alt=media&token=9963f9f7-7bfc-4e5a-9535-0a49729875ed","name":"Grød","routeName":"compassdk_dbvendor3","timeslots":true,"visible":true},"4":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor4%2FDB_app_vendor_logo_hallernes_smoerrebroed.jpg?alt=media&token=cc532f5b-7f34-4f59-9124-9b404b9cff4b","name":"Hallernes Smørrebrød","routeName":"compassdk_dbvendor4","timeslots":true,"visible":true},"5":{"address":"","blurHash":"U8S~x6of~pj[WBfQt6j[~oay4oj[xuj[M|ay","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor8%2Fplutus_flowy_circular_logo_.jpg_1730196885.143?alt=media&token=5ead058f-dd57-4f27-b549-bbb75947a32d","name":"Plutus by Strangas","routeName":"compassdk_dbvendor5b","timeslots":true,"visible":true},"6":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor5%2FPhago%20Screen.jpg?alt=media&token=21423b0c-62a4-4db4-9fe8-31f834efec89","name":"Phago","routeName":"compassdk_dbvendor6","timeslots":true,"visible":true},"7":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor7%2FDB_app_vendor_logo_district_tonikn.jpg?alt=media&token=7ff36e72-1a22-4b36-be81-f651484e9fcf","name":"District Tonkin","routeName":"compassdk_dbvendor7","timeslots":true,"visible":true},"8":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/la-neta.jpg?alt=media&token=5879d0cf-8185-455c-80b7-ef0c28aa7f4a","name":"LA NETA","routeName":"compassdk_dbvendor8a","timeslots":true,"visible":true},"9":{"address":"","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor5%2Folioli2.png?alt=media&token=0d3c14be-418e-437c-ad50-cf06560afd40","name":"OliOli","routeName":"compassdk_dbvendor9","timeslots":true,"visible":true},"10":{"address":"","blurHash":"U59Rd[tR00j[9Zj[xuof00WB_3ay~qfQIURj","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor12%2FForside%20app.jpg_1759926606?alt=media&token=663df26b-2868-4ede-979c-46896bda03fe","name":"Wedo","routeName":"compassdk_dbvendor12","timeslots":true,"visible":true}},"enabled":true,"imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbvendor1%2FaThe%20Market%20logo1.png?alt=media&token=c03201f5-fda3-4045-8ef7-b9121de67a64","location":{"latitude":55.671298000320185,"longitude":12.56786163075796},"name":"The Market","routeName":"compassdk_centralcafe"},"1":{"address":"Refreshing beverages, food, snacks, freshly made artisan pastries and barista coffee + 24h Self Service","blurHash":"U9F?6CRj00%MWBayofof00t7~pM{RjofofRj","enabled":true,"imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_centralcafe%2FBridge%20logo.png_1754921015.786?alt=media&token=57dd7e06-592d-46e0-b8fd-d56ad8649917","location":{"latitude":55.671298000320185,"longitude":12.56786163075796},"name":"Bridge Café","routeName":"compassdk_centralcafe","visible":true},"2":{"address":"Offers revitalizing juices, smoothies, food, snacks, artisan pastries and barista coffee","blurHash":"U9Gu]_of00WBRjayt7j[00ay~pfQRjfQt7j@","enabled":true,"imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_townhallcafe%2FTownhall%20logo.png_1754920987.069?alt=media&token=1a12bfa0-a032-47ff-97eb-f50e5bc0f017","location":{"latitude":55.671298000320185,"longitude":12.56786163075796},"name":"Townhall Café","routeName":"compassdk_townhallcafe","visible":true},"3":{"address":"Tasty, nutritious mixed salads and toppings.","imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbpopup%2F8.png_1754405426.718?alt=media&token=1d667eb2-a95f-4501-90ba-0f33a048ea91","location":{"latitude":"0","longitude":"0"},"name":"The Salad Lab","routeName":"compassdk_dbpopup","visible":true},"4":{"address":"Arrival Café","blurHash":"U5O43g~qj??b?bWBfQay~qRj00M{~qofIUWB","enabled":false,"imageUrl":"https://firebasestorage.googleapis.com/v0/b/pq-dev.appspot.com/o/compassdk_dbarrivalcafe%2FTEST.png_1763718946.835?alt=media&token=a53d6c56-61be-45e2-a628-d484f2dec659","location":{"latitude":"0","longitude":"0"},"name":"Arrival Café","routeName":"compassdk_dbarrivalcafe","visible":false}}},"a":"d"}}"#;
        let parsed: MessageWrapper = serde_json::from_str(raw_message).unwrap();
        match parsed {
            MessageWrapper::Data(data) => {
                assert_eq!(data.request_id, None);
                assert_eq!(data.action, Some(RequestAction::Data));
                assert_eq!(data.body.path, Some("clientUnits/compassdk_danskebank/all".to_string()));
                assert_eq!(data.body.hash, None);
                assert_eq!(data.body.status, None);
            },
            _ => panic!("Parsed message is not a Data message"),
        }
    }
}