const { remote } = require('electron');
const { dialog } = remote;
const fs = require('fs');
const SocketClient = require('./socket');

let setting;
let display;
let connect; 
let form;
let isShow = false;
let img;
let container;
let fixWidth = 800;

const show = (element) => {
  element.style.display  = 'block';
};

const hide = (element) => {
  element.style.display  = 'none';
};

const client = new SocketClient();

const renderImage = (buffer, json) => {
  const base64 = buffer.toString('base64');
  const newImage = new Image();
  newImage.src = `data:image/jpg;base64,${base64}`;
  newImage.onload = function() {
    const ratio = fixWidth / newImage.width;
    img.style.width = newImage.width * ratio + 'px';
    if (json && json.face_rects) {
      renderRects(json.face_rects, ratio);
    } else {
      renderRects([], ratio);
    } 
  };
  img.src = `data:image/jpg;base64,${base64}`;
};

const renderRects = (rects, ratio) => {
  const rectElements = container.querySelectorAll('.rect');
  let eleLen = rectElements.length;
  let rectLen = rects.length;
  let iterCount = Math.max(eleLen, rectLen);
  let curr;
  let bottom;
  let left;
  let right;
  let top;

  for(let i=0; i<iterCount; i++) {
    if (eleLen > 0) {
      curr = rectElements[i];
      eleLen--;
    } else {
      const element = document.createElement('div');
      element.className = 'rect';
      container.appendChild(element);
      const score = document.createElement('div');
      score.className = 'score';
      element.appendChild(score);
      curr = element;
      curr.score = score;
    }

    if (rectLen > 0) {
      bottom = rects[i].bottom * ratio;
      left = rects[i].left * ratio;
      right = rects[i].right * ratio;
      top = rects[i].top * ratio;
      rectLen--;
    } else {
      bottom = 0;
      left = 0;
      right = 0;
      top = 0;
    }

    let width = right - left;
    let height = bottom - top;
    curr.style.top = top + 'px';
    curr.style.left = left + 'px';
    curr.style.width = width + 'px';
    curr.style.height = height + 'px';
    if (rects[i] && rects[i].score) {
      curr.score.style.display = 'block';
      curr.score.innerHTML = `score: ${rects[i].score}`;
    } else {
      curr.score.style.display = 'none';
    }
  }
};

const errorHandler = (err) => {
  dialog.showErrorBox('Error', err.message || '连接失败');
  isShow = !isShow;
  connect.innerHTML = '开始';
  show(setting);
  hide(display);
  client.disconnect();
};

document.addEventListener('DOMContentLoaded', () => {
  setting = document.querySelector('.setting');
  display = document.querySelector('.display');
  container = display.querySelector('.container');
  connect = document.querySelector('#connect'); 
  form = document.querySelector('#form');
  img = document.querySelector('#screen');

  connect.addEventListener('click', () => {
    isShow = !isShow;
    if(isShow) {
      client.connect(
        form.ip.value, 
        form.port.value, 
        renderImage.bind(this),
        errorHandler.bind(this)
      ).then(() => {
        connect.innerHTML = '断开';
        show(display);
        hide(setting);
      }).catch((msg) => {
        dialog.showErrorBox('Error', msg);
      });
    } else {
      connect.innerHTML = '开始';
      show(setting);
      hide(display);
      client.disconnect();
    }
  });
});