package com.darshil.chat.game;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WordController {

    private final Start start;

    @Autowired
    public WordController(Start start) {
        this.start = start;
    }

    @GetMapping("/current-word")
    public String getCurrentWord() {
        return start.getWordToGuess();
    }

    @GetMapping("/current-hint")
    public String getCurrentHint() {
        return start.getWordHint();
    }

    @GetMapping("/remaining-time")
    public int getRemainingTime() {
        return start.getRemainingTime();
    }
}
