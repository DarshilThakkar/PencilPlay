package com.darshil.chat.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;


import com.darshil.chat.game.Start;

@Controller
public class ChatController {

    @Autowired
    private Start start;
    // HashMap<String, Integer> players = new HashMap<>(); // Tracks players and their win counts
    // HashMap<String, Integer> turn = new HashMap<>();


    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(
            @Payload ChatMessage chatMessage
    ){
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(
            @Payload ChatMessage chatMessage,
            SimpMessageHeaderAccessor headerAccessor
    ){
        String username = chatMessage.getSender();
        headerAccessor.getSessionAttributes().put("username", username);

        // Add the user to the players map if not already present
        start.putPlayer(username);

        return chatMessage;
    }

    @MessageMapping("/game.start")
    @SendTo("/topic/game")
    public ChatMessage startGame(@Payload ChatMessage gameMessage) {
        start.initialize();

        ChatMessage startMessage = new ChatMessage();
        startMessage.setType(MessageType.START_GAME);
        startMessage.setContent("Game has started!");

        return startMessage;
    }

    @MessageMapping("/game.guess")
    @SendTo("/topic/game")
    public ChatMessage processGuess(@Payload ChatMessage gameMessage) {
        String wordToGuess = start.getWordToGuess();
        // Guess guess = new Guess(wordToGuess);
        
        // boolean isCorrect = guess.checkGuess(gameMessage.getContent());
        boolean isCorrect = wordToGuess.equalsIgnoreCase(gameMessage.getContent().trim());
        String username = gameMessage.getSender();

        ChatMessage responseMessage = new ChatMessage();
        responseMessage.setSender(username);
        responseMessage.setType(MessageType.GUESS);

        if (isCorrect && start.getTurn(username) > 0) {
            // Increment the player's win count
            start.incrementWins(username);
            start.decrementTurn(username);

            responseMessage.setContent(" guessed the word correctly! Total " +
                                        start.getWins(username) + " win(s).");

            // Optionally, restart the game or perform other logic
            // start.initialize();
        } else {
            responseMessage.setContent(" guessed: " + gameMessage.getContent());
        }

        return responseMessage;
    }

    // Optional: Add a method to fetch the player leaderboard
    @MessageMapping("/game.leaderboard")
    @SendTo("/topic/game")
    public ChatMessage getLeaderboard() {
        StringBuilder leaderboard = new StringBuilder("");
        start.getPlayers().forEach((username, wins) -> 
            leaderboard.append(username).append(": ").append(wins).append(" win(s)\n")
        );

        ChatMessage leaderboardMessage = new ChatMessage();
        leaderboardMessage.setType(MessageType.LEADERBOARD);
        leaderboardMessage.setContent(leaderboard.toString());

        return leaderboardMessage;
    }
}

