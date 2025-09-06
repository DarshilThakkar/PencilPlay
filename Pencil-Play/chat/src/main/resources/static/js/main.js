"use strict";

var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var usernameForm = document.querySelector("#usernameForm");
var messageForm = document.querySelector("#messageForm");
var messageInput = document.querySelector("#message");
var messageArea = document.querySelector("#messageArea");
var connectingElement = document.querySelector(".connecting");
var guessForm = document.querySelector("#guessForm");
var guessInput = document.querySelector("#guess");
guessForm.addEventListener("submit", sendGuess, true);

var stompClient = null;
var username = null;

var colors = [
  "#2196F3",
  "#32c787",
  "#00BCD4",
  "#ff5652",
  "#ffc107",
  "#ff85af",
  "#FF9800",
  "#39bbb0",
];

function connect(event) {
  username = document.querySelector("#name").value.trim();

  if (username) {
    usernamePage.classList.add("hidden");
    chatPage.classList.remove("hidden");

    var socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
  }
  event.preventDefault();
}

function onConnected() {
  stompClient.subscribe("/topic/public", onMessageReceived);
  stompClient.subscribe("/topic/game", onGuessReceived);
  stompClient.send(
    "/app/chat.addUser",
    {},
    JSON.stringify({ sender: username, type: "JOIN" })
  );

  var gameMessage = {
    sender: username,
    type: "START_GAME",
  };
  stompClient.send("/app/game.start", {}, JSON.stringify(gameMessage));

  connectingElement.classList.add("hidden");
}

function onError(error) {
  connectingElement.textContent =
    "Could not connect to WebSocket server. Please refresh this page to try again!";
  connectingElement.style.color = "red";
}

function sendMessage(event) {
  var messageContent = messageInput.value.trim();
  if (messageContent && stompClient) {
    var chatMessage = {
      sender: username,
      content: messageInput.value,
      type: "CHAT",
    };
    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
    messageInput.value = "";
  }
  event.preventDefault();
}

function sendGuess(event) {
  var guess = guessInput.value.trim();
  if (guess && stompClient) {
    var gameMessage = {
      sender: username,
      content: guess,
      type: "GUESS",
    };
    stompClient.send("/app/game.guess", {}, JSON.stringify(gameMessage));
    guessInput.value = "";
  }
  event.preventDefault();
}

function onMessageReceived(payload) {
  var message = JSON.parse(payload.body);

  var messageElement = document.createElement("li");

  if (message.type === "JOIN") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " joined!";
  } else if (message.type === "LEAVE") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " left!";
  } else {
    messageElement.classList.add("chat-message");

    var avatarElement = document.createElement("i");
    var avatarText = document.createTextNode(message.sender[0]);
    avatarElement.appendChild(avatarText);
    avatarElement.style["background-color"] = getAvatarColor(message.sender);

    messageElement.appendChild(avatarElement);

    var usernameElement = document.createElement("span");
    var usernameText = document.createTextNode(message.sender);
    usernameElement.appendChild(usernameText);
    messageElement.appendChild(usernameElement);
  }

  var textElement = document.createElement("p");
  var messageText = document.createTextNode(message.content);
  textElement.appendChild(messageText);

  messageElement.appendChild(textElement);

  messageArea.appendChild(messageElement);
  messageArea.scrollTop = messageArea.scrollHeight;
}

function onGuessReceived(payload) {
  var message = JSON.parse(payload.body);
  var messageElement = document.createElement("li");

  if (message.type === "START_GAME") {
    guessInput.disabled = false;

    // show in chat area that game has started
    document.getElementById("messageArea").innerHTML = "";
    document.getElementById("word").textContent = message.content + " You can start guessing now!";

    messageElement.classList.add("event-message");
    message.content = message.content;
  } else if (message.type === "GUESS") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " " + message.content;
  }

  var textElement = document.createElement("p");
  var messageText = document.createTextNode(message.content);
  textElement.appendChild(messageText);
  messageElement.appendChild(textElement);

  messageArea.appendChild(messageElement);
  messageArea.scrollTop = messageArea.scrollHeight;
}

function getAvatarColor(messageSender) {
  var hash = 0;
  for (var i = 0; i < messageSender.length; i++) {
    hash = 31 * hash + messageSender.charCodeAt(i);
  }
  var index = Math.abs(hash % colors.length);
  return colors[index];
}

function updateWordAndTimer() {
  fetch("/current-hint")
    .then((response) => response.text())
    .then((word) => (document.getElementById("word").textContent = word));

  fetch("/remaining-time")
    .then((response) => response.json())
    .then((time) => (document.getElementById("timer").textContent = time));
}

// Update every second
setInterval(updateWordAndTimer, 1000);

usernameForm.addEventListener("submit", connect, true);
messageForm.addEventListener("submit", sendMessage, true);







// Define the leaderboard area
var leaderboardArea = document.querySelector("#leaderboard");

function requestLeaderboard() {
  // Request leaderboard data from the server
  if (stompClient) {
    stompClient.send("/app/game.leaderboard", {}, JSON.stringify({ type: "LEADERBOARD" }));
  }
}

function onGuessReceived(payload) {
  var message = JSON.parse(payload.body);
  var messageElement = document.createElement("li");

  if (message.type === "START_GAME") {
    guessInput.disabled = false;

    // Show in chat area that game has started
    document.getElementById("messageArea").innerHTML = "";
    document.getElementById("word").textContent =
      message.content + " You can start guessing now!";

    messageElement.classList.add("event-message");
    message.content = message.content;
  } else if (message.type === "GUESS") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " " + message.content;
  } else if (message.type === "LEADERBOARD") {
    updateLeaderboard(message.content);
    return; // No need to append this to message area
  }

  var textElement = document.createElement("p");
  var messageText = document.createTextNode(message.content);
  textElement.appendChild(messageText);
  messageElement.appendChild(textElement);

  messageArea.appendChild(messageElement);
  messageArea.scrollTop = messageArea.scrollHeight;
}

function updateLeaderboard(content) {
  // Clear the existing leaderboard
  leaderboardArea.innerHTML = "";

  // Parse leaderboard content and render it
  var leaderboardData = content.split("\n").filter((entry) => entry.trim() !== "");

  leaderboardData.forEach((entry) => {
    var leaderboardElement = document.createElement("li");
    leaderboardElement.classList.add("leaderboard-entry");
    leaderboardElement.textContent = entry;
    leaderboardArea.appendChild(leaderboardElement);
  });
}

// Request leaderboard every time the page loads or user joins
function onConnected() {
  stompClient.subscribe("/topic/public", onMessageReceived);
  stompClient.subscribe("/topic/game", onGuessReceived);
  stompClient.send(
    "/app/chat.addUser",
    {},
    JSON.stringify({ sender: username, type: "JOIN" })
  );

  var gameMessage = {
    sender: username,
    type: "START_GAME",
  };
  stompClient.send("/app/game.start", {}, JSON.stringify(gameMessage));

  // Request leaderboard after connection
  requestLeaderboard();

  connectingElement.classList.add("hidden");
}

// Add a periodic leaderboard update (optional)
setInterval(requestLeaderboard, 1000); // Updates every 5 seconds
