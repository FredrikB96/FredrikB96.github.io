// JavaScript source code
class Card {
    constructor(_word, _definition, _reading, _grammar, _sentence, _sentenceDefinition, _dueDate) {
        this.word = _word;
        this.definition = _definition;
        this.reading = Card.extractReading(_reading);
        this.grammar = _grammar;
        this.sentence = _sentence;
        this.sentenceDefinition = _sentenceDefinition;
        this.dueDate = _dueDate;
    }

    static extractReading(raw) {
        return raw?.replace(/([^\[]*)\[([^\]]+)\]/g, (_, __, reading) => reading) || "";
    }
}
