package com.darshil.chat.game;

public class GameState {
    private static String wordToGuess;

    public static void initialize() {
        // Initialize the game and select a new word
        Start gameStart = new Start();
        gameStart.initialize();
        wordToGuess = gameStart.getWordToGuess();
    }

    public static String getWordToGuess() {
        return wordToGuess;
    }
}
