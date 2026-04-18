export const wordsLibrary = [
    { word: "Space Station", hint: "A high-tech location orbiting the Earth." },
    { word: "Submarine", hint: "A vessel that travels deep underwater." },
    { word: "Casino", hint: "A place where people go to gamble." },
    { word: "Hospital", hint: "A place you go when you are sick or injured." },
    { word: "Circus", hint: "An entertainment event with clowns and acrobats." },
    { word: "Pirate Ship", hint: "A wooden vessel with sails used by outlaws." },
    { word: "Movie Studio", hint: "A place where films are made." },
    { word: "Police Station", hint: "A place where law enforcement works." },
    { word: "Bank", hint: "A secure building where money is kept." },
    { word: "School", hint: "An institution designed for the teaching of students." },
    { word: "Restaurant", hint: "A place where you pay to sit and eat meals." },
    { word: "Library", hint: "A building containing collections of books or media." }
];

export function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * wordsLibrary.length);
    return wordsLibrary[randomIndex];
}
