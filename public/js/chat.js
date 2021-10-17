const socket = io();

const messageForm = document.getElementById('message-form');
const messageFormInput = document.querySelector('input');
const messageFormBtn = document.querySelector('button');
const sendLocationBtn = document.getElementById('send-location-btn');
const messages = document.getElementById('messages');
const sidebar = document.getElementById('sidebar');

const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  const newMessageEle = messages.lastElementChild;

  const newMessageStyles = getComputedStyle(newMessageEle);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom, 10);
  const newMessageHeight = newMessageEle.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;
  const containerHeight = messages.scrollHeight;
  const scrollOffset = messages.scrollTop + visibleHeight;
  
  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

socket.on('message', (message) => {
  // console.log('[client side message]: ', message);
  const { username, text, createdAt } = message;
  const rendered = Mustache.render(messageTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format('YYYY-MM-DD HH:mm:ss'),
  });
  messages.insertAdjacentHTML('beforeend', rendered);
  autoScroll();
});

socket.on('locationMessage', (message) => {
  const { username, url, createdAt } = message;
  const rendered = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format('YYYY-MM-DD HH:mm:ss'),
  });
  messages.insertAdjacentHTML('beforeend', rendered);
});

socket.on('roomData', ({ room, users }) => {
  const rendered = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = rendered;
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const message = messageFormInput.value;

  if (message) {
    messageFormBtn.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', message, (error) => {
      messageFormBtn.removeAttribute('disabled');
      messageFormInput.value = '';
      messageFormInput.focus();

      if (error) {
        return console.error(error);
      }

      console.log('The message was delivered!');
    });
  }
});

sendLocationBtn.addEventListener('click', () => {
  sendLocationBtn.setAttribute('disabled', 'disabled');

  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    socket.emit('sendLocation', { latitude, longitude }, (message) => {
      sendLocationBtn.removeAttribute('disabled');
      console.log('Location shared!');
    });
  }

  function error() {
    sendLocationBtn.removeAttribute('disabled');
    console.log('Unable to retrieve your location');
  }

  navigator.geolocation.getCurrentPosition(success, error);
});
