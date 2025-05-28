// JavaScript source code
class Card {
    constructor(_word, _definition, _reading, _grammar, _sentence, _sentenceDefinition, _dueDate, _fsrsState) {
        this.word = _word;
        this.definition = _definition;
        this.reading = Card.extractReading(_reading);
        this.grammar = _grammar;
        this.sentence = _sentence;
        this.sentenceDefinition = _sentenceDefinition;
        this.dueDate = _dueDate;
        this.fsrsState = _fsrsState || null;
    }

    static extractReading(raw) {
        if (!raw) return "";

        // Match all kana characters (from anywhere in the string)
        const matches = raw.match(/[ぁ-んァ-ヶー]/g);

        // Join them into a string, or return empty if none
        return matches ? matches.join("") : "";
    }

}
