/**
 * Online-Dice Cloud Sync Service (Serverless, Zero-Config)
 * Sử dụng MQTT qua WebSockets (WSS) kết nối cụm Cloud toàn cầu (HiveMQ / EMQX).
 * Không cần bất kỳ máy chủ nào, hoạt động tức thì qua mọi mạng (4G/5G/WiFi khác nhau).
 */
(function(window){
  const BROKERS = [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt'
  ];

  class SyncService {
    constructor(){
      this.client = null;
      this.role = 'host'; // 'host' (máy live) hoặc 'remote' (điện thoại)
      this.currentBrokerIdx = 0;
      this.onMessageCallback = null;
      this.onStatusCallback = null;
      this.connected = false;
      this.roomId = this.loadRoomId();
    }

    loadRoomId(){
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if(urlRoom && urlRoom.trim()) return urlRoom.trim().toLowerCase();
      return localStorage.getItem('od_room_id') || 'dice8888';
    }

    setRoomId(newId){
      if(!newId) return;
      const clean = newId.trim().toLowerCase();
      this.roomId = clean;
      localStorage.setItem('od_room_id', clean);
      if(this.client && this.connected){
        this.client.end(true, ()=>{
          this.connect();
        });
      }
    }

    getTopic(){
      return `antigravity/onlinedice/v2/${this.roomId}`;
    }

    init({ role = 'host', onMessage, onStatus }){
      this.role = role;
      this.onMessageCallback = onMessage;
      this.onStatusCallback = onStatus;
      this.connect();
    }

    notifyStatus(status, text){
      if(this.onStatusCallback) this.onStatusCallback(status, text);
    }

    connect(){
      if(typeof mqtt === 'undefined'){
        console.warn('MQTT library not loaded yet');
        this.notifyStatus('error', 'Chưa tải được thư viện Cloud');
        return;
      }

      const brokerUrl = BROKERS[this.currentBrokerIdx];
      const clientId = `od_${this.role}_${Math.random().toString(16).substr(2, 8)}`;
      this.notifyStatus('connecting', 'Đang kết nối Cloud...');

      try {
        this.client = mqtt.connect(brokerUrl, {
          clientId,
          clean: true,
          connectTimeout: 7000,
          reconnectPeriod: 3000,
          keepalive: 30
        });

        this.client.on('connect', ()=>{
          this.connected = true;
          const topic = this.getTopic();
          this.client.subscribe(topic, { qos: 1 }, (err)=>{
            if(!err){
              this.notifyStatus('connected', `Đã kết nối Cloud (Phòng: ${this.roomId})`);
              // Nếu là remote vừa kết nối, xin Host trạng thái hiện tại
              if(this.role === 'remote'){
                this.send('request_state', {});
              }
            } else {
              this.notifyStatus('error', 'Lỗi đăng ký phòng');
            }
          });
        });

        this.client.on('message', (topic, payload)=>{
          try {
            const data = JSON.parse(payload.toString());
            // Bỏ qua tin nhắn do chính mình phát
            if(data._senderRole === this.role && data._senderId === clientId) return;

            if(this.onMessageCallback){
              this.onMessageCallback(data.action, data.payload || {}, data);
            }
          } catch(e){
            console.error('Lỗi parse message:', e);
          }
        });

        this.client.on('error', (err)=>{
          console.warn('MQTT error, thử broker dự phòng...', err);
          this.connected = false;
          this.notifyStatus('error', 'Đang chuyển kênh dự phòng...');
          this.switchBroker();
        });

        this.client.on('close', ()=>{
          this.connected = false;
          this.notifyStatus('disconnected', 'Mất kết nối Cloud');
        });

      } catch(err){
        console.error('Không thể kết nối MQTT:', err);
        this.switchBroker();
      }
    }

    switchBroker(){
      if(this.client){
        try{ this.client.end(true); }catch(e){}
      }
      this.currentBrokerIdx = (this.currentBrokerIdx + 1) % BROKERS.length;
      setTimeout(()=> this.connect(), 2000);
    }

    send(action, payload = {}){
      if(!this.client || !this.connected){
        // Lưu tạm hoặc thử gửi lại
        return false;
      }
      const message = JSON.stringify({
        action,
        payload,
        _senderRole: this.role,
        _time: Date.now()
      });
      this.client.publish(this.getTopic(), message, { qos: 1 });
      return true;
    }
  }

  window.syncService = new SyncService();
})(window);
