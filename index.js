class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString(){
        return `${this.value}${this.suit.charAt(0)}`;
    }

}


class Deck {
    constructor() {
        this.cards = [];
        this.createDeck();
    }

    createDeck() {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (let suit of suits) {
            for (let value of values) {
                this.cards.push(new Card(suit, value));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
}


class Player {
    constructor(id) {
        this.id = id;
        this.hand = [];
        this.faceDownCards = [];
    }

    drawCard(deck) {
        const newCard = deck.deal();
        this.hand.push(newCard);
        return newCard;
    }

    playCard(cardIndex) {
        return this.hand.splice(cardIndex, 1)[0];
    }

    getHandString() {
        return this.hand.map((card, index) => {
            const suitAbbreviation = card.suit.charAt(0); // First letter of the suit
            return `${index}: ${card.value}${suitAbbreviation}`; // Format: ValueSuit
        }).join(', ');
    }
}


class Game {
    constructor(playerCount) {
        this.players = [];
        this.deck = new Deck();
        this.deck.shuffle();
        this.tableCards = [];
        this.currentPlayerIndex = 0;
        this.initPlayers(playerCount);
        this.dealInitialCards();
        this.lastPlayedCard = null;
        this.playedCardsDeck = [];
    }

    initPlayers(playerCount) {
        for (let i = 0; i < playerCount; i++) {
            this.players.push(new Player(i));
        }
    }

    dealInitialCards() {
        // Deal face-down and hand cards
        for (let player of this.players) {
            for (let i = 0; i < 3; i++) {
                player.faceDownCards.push(this.deck.deal());
                player.drawCard(this.deck);
            }
        }

        // Deal table cards
        for (let i = 0; i < 3; i++) {
            this.tableCards.push(this.deck.deal());
        }
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    playTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        let turnEnded = false;

        while (!turnEnded) {
            this.displayTurnInfo(currentPlayer);

            const response = prompt("Type 'draw' to draw a card, 'pickup' to pick up the pile, or enter the index of the card you want to play:");

            if (response === 'draw') {
                turnEnded = this.handleDraw(currentPlayer);
            } else if (response === 'pickup') {
                turnEnded = this.handlePickup(currentPlayer);
            } else if (response === null) {
                console.log("Player cancelled their action.");
                return true; // End the game
            } else if (!isNaN(response)) {
                turnEnded = this.handlePlayCard(currentPlayer, parseInt(response));
            } else {
                console.log("Invalid input.");
            }

            this.ensureMinimumHandSize(currentPlayer);
        }

        if (this.checkPlayerWin(currentPlayer)) {
            return true; // Game ends if a player has won
        }

        this.nextPlayer();
    }


    displayTurnInfo(currentPlayer) {
        console.log(`Player ${currentPlayer.id}'s turn.`);
        console.log(`Hand: ${currentPlayer.getHandString()}`);
        if (this.lastPlayedCard) {
            console.log(`Last card played: ${this.lastPlayedCard.value} of ${this.lastPlayedCard.suit}`);
        } else {
            console.log("No card has been played yet.");
        }
    }


    handleDraw(currentPlayer) {
        if (this.deck.cards.length > 0) {
            const drawnCard = currentPlayer.drawCard(this.deck);
            console.log(`Player ${currentPlayer.id} drew a card. New Card: ${drawnCard.toString()}`);
            console.log(`Hand after drawing: ${currentPlayer.getHandString()}`);
            if (this.isValidPlay(drawnCard)) {
                const playDrawn = prompt("Do you want to play the drawn card? (yes/no)");
                return playDrawn !== 'yes'; // End turn if they choose not to play the drawn card
            } else {
                console.log("Card cannot be played, next turn");
                return true; // End turn as the card cannot be played
            }
        } else {
            console.log("Deck is empty. No card drawn.");
            return false; // Turn does not end, player might choose another action
        }
    }


    handlePickup(currentPlayer) {
        console.log("Player picked up the pile.");
        currentPlayer.hand = currentPlayer.hand.concat(this.playedCardsDeck);
        this.playedCardsDeck = [];
        this.lastPlayedCard = null;
        return true; // End the turn after picking up the pile
    }


    handlePlayCard(currentPlayer, cardIndex) {
        if (cardIndex >= 0 && cardIndex < currentPlayer.hand.length) {
            const playedCard = currentPlayer.playCard(cardIndex);
            if (this.isValidPlay(playedCard)) {
                console.log(`Player ${currentPlayer.id} played ${playedCard.value} of ${playedCard.suit}`);
                this.lastPlayedCard = playedCard;
                this.playedCardsDeck.push(playedCard);

                if (playedCard.value === '10') {
                    console.log("Card 10 played! Clearing the pile and player gets another turn.");
                    this.playedCardsDeck = [];
                    this.lastPlayedCard = null;

                    if (currentPlayer.hand.length === 0) {
                        return this.checkPlayerWin(currentPlayer); // Check if the game is over
                    }

                    return false; // player gets another turn
                }
                return true;
            } else {
                console.log("Invalid play. Card returned to hand.");
                currentPlayer.hand.splice(cardIndex, 0, playedCard); // Return card to hand
                return false; // Player can attempt another action
            }
        } else {
            console.log("Invalid card index.");
            return false; // Player can attempt another action
        }
    }


    checkPlayerWin(currentPlayer) {
        if (currentPlayer.hand.length === 0) {
            console.log(`Player ${currentPlayer.id} has won and is now out of the game!`);
            this.players.splice(this.currentPlayerIndex, 1); // Remove the player from the game

            if (this.isGameOver()) {
                console.log(`Player ${this.players[0].id} has lost the game.`);
                return true; // Game ends if this was the final player
            } else {
                this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
            }
        }
        return false; // Game continues if no win
    }


    ensureMinimumHandSize(player) {
        while (player.hand.length < 3 && this.deck.cards.length > 0) {
            player.drawCard(this.deck);
        }
    }

    isGameOver() {
        return this.players.length === 1;
    }

    askPlayerToPlayAfterDraw(currentPlayer) {
        const response = prompt("Do you want to play a card? (yes/no)");
        return response.toLowerCase() === 'yes';
    }

    setStartingPlayer() {
        let lowestCardValue = Infinity;
        let startingPlayerIndex = 0;
        let lowestSuit = 'Z'; // Assuming suit order is alphabetical

        for (let i = 0; i < this.players.length; i++) {
            for (let card of this.players[i].hand) {
                let cardValue = this.getCardNumericValue(card);
                if (cardValue < lowestCardValue || (cardValue === lowestCardValue && card.suit < lowestSuit)) {
                    lowestCardValue = cardValue;
                    lowestSuit = card.suit;
                    startingPlayerIndex = i;
                }
            }
        }

        this.currentPlayerIndex = startingPlayerIndex;
    }


    getCardNumericValue(card) {
        const values = { '2': 15, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[card.value];
    }

    askPlayerForCard(player) {
        let cardIndex;
        do {
            cardIndex = prompt(`Player ${player.id}, enter the index of the card you want to play:`);
        } while (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= player.hand.length);
        return cardIndex;
    }

    isValidPlay(card) {
        if (!this.lastPlayedCard) {
            return true; // If no card has been played yet, any play is valid
        }

        if (card.value === '2' || this.lastPlayedCard.value === '2') {
            return true;
        }

        if (card.value === '10'){
            return true;
        }

        const lastValue = this.getCardNumericValue(this.lastPlayedCard);
        const currentValue = this.getCardNumericValue(card);

        if (this.lastPlayedCard.value === '7') {
            // If the last card was a '7', the next card must be lower
            return currentValue <= lastValue;
        } else {
            // Otherwise, the card must be equal or higher in value
            return currentValue >= lastValue;
        }
    }
}

// Initialization
const playerCount = prompt("How many players? (1-5)");
if (playerCount !== null) {
    const game = new Game(parseInt(playerCount));
    game.setStartingPlayer();

    // Game loop
    let gameExited = false;
    while (!game.isGameOver() && !gameExited) {
        gameExited = game.playTurn();
    }
    console.log("Game over!");

} else {
    console.log("Game setup cancelled.");
}
