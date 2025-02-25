// src/App.js

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";
import { db } from "./firebase";
import { ref, push, onValue } from "firebase/database";

/** Header (скрываем, если currentTab === 'drum') */
function Header({ currentTab, onTabChange, darkMode, toggleDarkMode, handleShare }) {
    if (currentTab === "drum") return null;

    return (
        <header className="header">
            <div className="header-left">
                <h2>My Dolphin Picker 🐬</h2>
            </div>
            <div className="header-right">
                <button
                    className={`nav-btn ${currentTab === "main" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("main")}
                >
                    Randomizer
                </button>
                <button
                    className={`nav-btn ${currentTab === "history" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("history")}
                >
                    History
                </button>
                <button
                    className={`nav-btn ${currentTab === "scoreboard" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("scoreboard")}
                >
                    Scoreboard
                </button>
                <button className="nav-btn" onClick={handleShare}>
                    Share
                </button>

                <div className="theme-switch">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={toggleDarkMode}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </header>
    );
}

/** Footer (скрываем, если currentTab === 'drum') */
function Footer({ currentTab }) {
    if (currentTab === "drum") return null;

    return (
        <footer className="footer">
            <div className="footer-left">© Aks1n3d Corp.</div>
            <div className="footer-right">
                <a href="https://instagram.com/YourAccount" target="_blank" rel="noopener noreferrer">
                    📷
                </a>
                <a href="https://linkedin.com/in/YourAccount" target="_blank" rel="noopener noreferrer">
                    💼
                </a>
                <a href="https://twitter.com/YourAccount" target="_blank" rel="noopener noreferrer">
                    🐦
                </a>
            </div>
        </footer>
    );
}

/** Карточка барабана */
function DrumCard({ name }) {
    return (
        <div className="card">
            {name}
        </div>
    );
}

/** Экран барабана (fullscreen) */
function Drum({ people, lastWinner, onWinner, onBack }) {
    const [offset, setOffset] = useState(0);
    const [rollingNames, setRollingNames] = useState([]);
    const [chosenName, setChosenName] = useState("");
    const [needToSpinAgain, setNeedToSpinAgain] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);

    const drumContainerRef = React.useRef(null);
    const spinAnimationRef = React.useRef(null);

    React.useEffect(() => {
        prepareDrum();
        return () => {
            if (spinAnimationRef.current) {
                cancelAnimationFrame(spinAnimationRef.current);
                spinAnimationRef.current = null;
            }
        };
        // eslint-disable-next-line
    }, []);

    function prepareDrum() {
        setChosenName("");
        setNeedToSpinAgain(false);
        setIsSpinning(true);

        setTimeout(() => {
            const width = drumContainerRef.current
                ? drumContainerRef.current.offsetWidth
                : window.innerWidth;

            // Исключаем последнего победителя из массива
            let filtered = people;
            if (lastWinner) {
                filtered = filtered.filter((p) => p !== lastWinner);
            }

            // Длинный массив
            const repeatCount = 300;
            let bigArray = [];
            for (let i = 0; i < repeatCount; i++) {
                bigArray.push(...filtered);
            }
            setRollingNames(bigArray);

            setTimeout(() => spin(bigArray, width), 100);
        }, 100);
    }

    function spin(namesArray, containerWidth) {
        setOffset(0);

        let velocity = 1500 + Math.random() * 500;
        let friction = 0.98 + Math.random() * 0.01;
        let currentOffset = Math.random() * (namesArray.length * 160);
        let lastTimestamp = 0;

        function animate(timestamp) {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            const deltaSec = delta / 1000;

            currentOffset += velocity * deltaSec;
            currentOffset %= (namesArray.length * 160);
            velocity *= friction;

            setOffset(currentOffset);

            if (velocity > 5) {
                spinAnimationRef.current = requestAnimationFrame(animate);
            } else {
                finishSpin(currentOffset, containerWidth, namesArray);
            }
        }
        spinAnimationRef.current = requestAnimationFrame(animate);
    }

    function finishSpin(currentOffset, containerWidth, namesArray) {
        setIsSpinning(false);
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }

        const cardWidth = 150;
        const cardMargin = 10;
        const cardTotalWidth = cardWidth + cardMargin;

        const centerCoord = currentOffset + containerWidth / 2 - cardWidth / 2;
        const rawIndex = centerCoord / cardTotalWidth;
        const index = Math.round(rawIndex);
        const fraction = Math.abs(rawIndex - index);

        const marginFraction = cardMargin / cardTotalWidth;
        const halfMarginFraction = marginFraction / 2;

        if (
            fraction >= 0.5 - halfMarginFraction &&
            fraction <= 0.5 + halfMarginFraction
        ) {
            setChosenName("");
            setNeedToSpinAgain(true);
        } else {
            const winner = namesArray[index];
            setChosenName(winner);

            // Сохраняем победителя
            push(ref(db, "winners"), {
                name: winner,
                timestamp: Date.now()
            });
            onWinner(winner);
        }
    }

    function handleSpinAgain() {
        if (chosenName) {
            setChosenName("");
            setNeedToSpinAgain(false);
            prepareDrum();
        } else {
            if (!rollingNames.length) return;
            spin(rollingNames, drumContainerRef.current.offsetWidth);
        }
    }

    function handleBack() {
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }
        onBack();
    }

    return (
        <div className="drum-screen">
            <div className="drum-container" ref={drumContainerRef}>
                <div
                    className="drum-track"
                    style={{ transform: `translateX(-${offset}px)` }}
                >
                    {rollingNames.map((person, i) => (
                        <DrumCard key={i} name={person} />
                    ))}
                </div>
                <div className="arrow"></div>
            </div>

            {!isSpinning && chosenName && (
                <div className="result">
                    <h2>The Winner is {chosenName} 🎉</h2>
                </div>
            )}
            {!isSpinning && needToSpinAgain && (
                <div className="result">
                    <h2>Arrow landed between cards! 🫣</h2>
                </div>
            )}

            {!isSpinning && (
                <div className="drum-buttons">
                    {(needToSpinAgain || chosenName) && (
                        <button className="spin-again-btn" onClick={handleSpinAgain}>
                            Spin Again 🔄
                        </button>
                    )}
                    <button className="back-btn" onClick={handleBack}>
                        Back
                    </button>
                </div>
            )}
        </div>
    );
}

function App() {
    const [currentTab, setCurrentTab] = useState("main");

    // Храним имена строками
    const [people, setPeople] = useState([]);

    // Winners
    const [allWinners, setAllWinners] = useState([]);
    const [lastWinner, setLastWinner] = useState(null);

    // input
    const [nameInput, setNameInput] = useState("");

    // dark mode
    const [darkMode, setDarkMode] = useState(false);
    const toggleDarkMode = () => setDarkMode(!darkMode);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [searchParams, setSearchParams] = useSearchParams();

    // Загрузка winners => сортируем от нового к старому
    useEffect(() => {
        setLoading(true);
        const winnersRef = ref(db, "winners");
        onValue(winnersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                let arr = Object.values(data);
                // Новые записи (больший timestamp) идут наверх
                arr.sort((a, b) => b.timestamp - a.timestamp);
                setAllWinners(arr);
                setLastWinner(arr[0] || null);
            } else {
                setAllWinners([]);
                setLastWinner(null);
            }
            setLoading(false);
        });
    }, []);

    // dark mode
    useEffect(() => {
        if (darkMode) document.body.classList.add("dark-mode");
        else document.body.classList.remove("dark-mode");
    }, [darkMode]);

    // ?names=...
    useEffect(() => {
        const urlNames = searchParams.get("names");
        if (urlNames) {
            setPeople(urlNames.split(","));
        }
    }, [searchParams]);

    function updateURL(newPeople) {
        if (!newPeople.length) {
            setSearchParams({});
        } else {
            setSearchParams({ names: newPeople.join(",") });
        }
    }

    // Добавить
    function addPerson() {
        const trimmed = nameInput.trim();
        if (!trimmed) return;

        if (people.includes(trimmed)) {
            setErrorMessage("A participant with this name already exists.");
            return;
        }
        setErrorMessage("");

        const newPeople = [...people, trimmed];
        setPeople(newPeople);
        updateURL(newPeople);

        setNameInput("");
    }

    // Удалить
    function removePerson(index) {
        const toRemove = people[index];
        if (!window.confirm(`Remove "${toRemove}"?`)) return;
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
        updateURL(newPeople);
    }

    function onTabChange(tab) {
        setCurrentTab(tab);
    }

    function handleShare() {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => alert("Link copied to clipboard!"))
            .catch(console.error);
    }

    function handleChooseRandom() {
        if (!people.length) {
            setErrorMessage("Please add at least one participant.");
            return;
        }
        setErrorMessage("");
        setCurrentTab("drum");
    }

    function handleWinnerFromDrum() {
        // ...
    }

    // Scoreboard
    function getScoreStats() {
        const stats = {};
        allWinners.forEach((w) => {
            stats[w.name] = (stats[w.name] || 0) + 1;
        });
        return stats;
    }

    // DRUM
    if (currentTab === "drum") {
        return (
            <div className={`app ${darkMode ? "dark-mode" : ""}`}>
                <Drum
                    people={people}
                    lastWinner={lastWinner ? lastWinner.name : null}
                    onWinner={handleWinnerFromDrum}
                    onBack={() => setCurrentTab("main")}
                />
                <Footer currentTab="drum" />
            </div>
        );
    }

    // HISTORY
    if (currentTab === "history") {
        return (
            <div className={`app ${darkMode ? "dark-mode" : ""}`}>
                <Header
                    currentTab={currentTab}
                    onTabChange={onTabChange}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    handleShare={handleShare}
                />
                <div className="main-ui">
                    <h1>History of Winners</h1>
                    {loading ? (
                        <p>Loading...</p>
                    ) : allWinners.length === 0 ? (
                        <p>No winners yet 🙁</p>
                    ) : (
                        <ul>
                            {allWinners.map((w, i) => (
                                <li key={i}>
                                    {w.name} — {new Date(w.timestamp).toLocaleString()}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Footer currentTab={currentTab} />
            </div>
        );
    }

    // SCOREBOARD
    if (currentTab === "scoreboard") {
        const stats = getScoreStats();
        const scoreboardData = Object.keys(stats)
            .map((n) => ({ name: n, wins: stats[n] }))
            .sort((a, b) => b.wins - a.wins);

        return (
            <div className={`app ${darkMode ? "dark-mode" : ""}`}>
                <Header
                    currentTab={currentTab}
                    onTabChange={onTabChange}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    handleShare={handleShare}
                />
                <div className="main-ui">
                    <h1>Scoreboard</h1>
                    {loading ? (
                        <p>Loading...</p>
                    ) : scoreboardData.length === 0 ? (
                        <p>No winners yet 🙁</p>
                    ) : (
                        <div className="scoreboard-container">
                            <table>
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Wins</th>
                                </tr>
                                </thead>
                                <tbody>
                                {scoreboardData.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{item.wins}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <Footer currentTab={currentTab} />
            </div>
        );
    }

    // MAIN
    return (
        <div className={`app ${darkMode ? "dark-mode" : ""}`}>
            <Header
                currentTab={currentTab}
                onTabChange={onTabChange}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                handleShare={handleShare}
            />
            <div className="main-ui">
                <h1>Dolphin Random Person Picker 🐬</h1>

                <div className="input-area">
                    <input
                        type="text"
                        placeholder="Enter a name..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                    />
                    <button onClick={addPerson}>Add ✅</button>
                </div>

                <h2>List of Participants</h2>
                {people.length === 0 ? (
                    <p>Please add at least one participant.</p>
                ) : (
                    <ul>
                        {people.map((person, index) => (
                            <li key={index}>
                                {person}
                                <button
                                    onClick={() => removePerson(index)}
                                    className="delete-btn"
                                >
                                    ❌
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {people.length > 0 && (
                    <button className="random-btn" onClick={handleChooseRandom}>
                        Pick Random 🔀
                    </button>
                )}

                <div className="last-winner-box">
                    <h2>Last Winner</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : lastWinner ? (
                        <div>
                            <strong>{lastWinner.name}</strong>
                            <div style={{ fontSize: "12px", color: "#777" }}>
                                {new Date(lastWinner.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <p>No winners yet 🙁</p>
                    )}
                </div>

                {errorMessage && (
                    <div style={{ marginTop: 10, color: "red", fontWeight: "bold" }}>
                        {errorMessage}
                    </div>
                )}
            </div>

            <Footer currentTab={currentTab} />
        </div>
    );
}

export default App;