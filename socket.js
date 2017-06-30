const net = require('net');
const fs = require('fs');

class SocketClient {
  constructor() {
    this.connected = false;
    this.client = null;
  }

  connect(host, port, handler, errorHandler) {
    if (!host || host.trim() === '') {
      return Promise.reject('请输入IP');
    }
    if (!port || port.trim() === '') {
      return Promise.reject('请输入端口');
    }
    if (handler && typeof handler !== 'function') {
      console.log('handler should be a function');
      return;
    }

    if (this.client == null) {
      this.client = new net.Socket();
    }

    let buf = new Buffer(0);
    let json;
    let bitmap;
    let jsonLen = 0;
    let imageLen = 0;
    let promise;

    promise = new Promise((resolve, reject) => {
      this.client.connect(port, host, () => {
        this.connected = true;
        console.log('CONNECTED TO: ' + host + ':' + port);
        resolve();
      });

      this.client.on('data', (data) => {
        try {
          buf = Buffer.concat([buf, data]);
      
          if (jsonLen === 0) {
            try {
              jsonLen = buf.readInt32LE();
              console.log('length:', jsonLen);
            } catch(err) { 
              jsonLen = 0;
              err.code = 1;
              errorHandler && errorHandler(err);
            }
          }
      
          if (jsonLen > 0 && buf.length >= 4 + jsonLen) {
            json = buf.slice(4, 4 + jsonLen);
            //json buffer
            json = json.toString('ascii');
            //parse json
            try {
              json = JSON.parse(json);
              imageLen = json.image_size;
            } catch(err) {
              imageLen = 0;
              err.code = 2;
              errorHandler && errorHandler(err);
            }
            console.log('parse json:', json);
            buf = buf.slice(4 + jsonLen);
            jsonLen = -1;
          }
          
          if (jsonLen < 0 && imageLen > 0 && buf.length >= imageLen) {
            bitmap = buf.slice(0, imageLen);
            handler && handler(bitmap, json);
            buf = buf.slice(imageLen);

            jsonLen = 0;
            imageLen = 0;
            bitmap = null;
            json = null;
          }
        } catch(err) {
          console.log(err);
          err.code = 3;
          errorHandler && errorHandler(err);
        }


      });

      this.client.on('error', (err) => {
        err.code = 4;
        errorHandler && errorHandler(err);
      });

      this.client.on('close', () => {
        console.log('Connection closed');
      });

    });

    
    return promise;
  }

  disconnect() {
    if (this.client) {
      this.client.pause();
      this.client.destroy();
      this.client = null;
    }
  }
}

module.exports = SocketClient;