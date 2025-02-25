import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";
import { db } from "./firebase"; // ваш файл инициализации Firebase
import { ref, push, onValue } from "firebase/database";

/** Shuffle array (Fisher–Yates) */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Random color generator */
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/** HEADER */
function Header({
                    currentTab,
                    onTabChange,
                    darkMode,
                    toggleDarkMode,
                    handleShare,
                }) {
    // Do not show header on the drum tab
    if (currentTab === "drum") return null;

    return (
        <header className="header">
            <div className="header-left">
                <h2>My Dolphin Picker 🐬</h2>
            </div>

            <div className="header-right">
                {/* 1) Randomizer */}
                <button
                    className={`nav-btn ${currentTab === "main" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("main")}
                >
                    Randomizer
                </button>

                {/* 2) History */}
                <button
                    className={`nav-btn ${currentTab === "history" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("history")}
                >
                    History
                </button>

                {/* 3) Scoreboard */}
                <button
                    className={`nav-btn ${
                        currentTab === "scoreboard" ? "active-tab" : ""
                    }`}
                    onClick={() => onTabChange("scoreboard")}
                >
                    Scoreboard
                </button>

                {/* 4) Share */}
                <button className="nav-btn" onClick={handleShare}>
                    Share
                </button>

                {/* Theme switch (Dark/Light) */}
                <div className="theme-switch">
                    <label className="switch">
                        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </header>
    );
}

/** DrumCard with random background color */
function DrumCard({ person }) {
    // Generate color once
    const colorRef = useRef(getRandomColor());

    return (
        <div className="card" style={{ backgroundColor: colorRef.current }}>
            {person.avatarUrl && (
                <img
                    src={person.avatarUrl}
                    alt={person.name}
                    style={{ width: "60px", height: "60px", borderRadius: "50%" }}
                />
            )}
            <div style={{ marginTop: "5px" }}>{person.name}</div>
        </div>
    );
}

/** DRUM */
function Drum({ people, onWinner, onRemoveWinner, onBack }) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [offset, setOffset] = useState(0);
    const [rollingNames, setRollingNames] = useState([]);
    const [chosenName, setChosenName] = useState("");
    const [needToSpinAgain, setNeedToSpinAgain] = useState(false);

    const spinAnimationRef = useRef(null);
    const drumContainerRef = useRef(null);
    const [drumContainerWidth, setDrumContainerWidth] = useState(0);

    // Sounds
    const spinSoundRef = useRef(null);
    const victorySoundRef = useRef(null);

    // Card layout
    const cardWidth = 150;
    const cardMargin = 10;
    const cardTotalWidth = cardWidth + cardMargin;
    // Gap fraction check
    const marginFraction = cardMargin / cardTotalWidth;
    const halfMarginFraction = marginFraction / 2;

    useEffect(() => {
        spinSoundRef.current = new Audio("/spin.mp3");
        victorySoundRef.current = new Audio("/victory.mp3");
    }, []);

    useEffect(() => {
        prepareDrum();
        return () => {
            stopAllSounds();
            clearAnimation();
        };
        // eslint-disable-next-line
    }, []);

    function prepareDrum() {
        setIsSpinning(false);
        setChosenName("");
        setNeedToSpinAgain(false);

        setTimeout(() => {
            const width = drumContainerRef.current
                ? drumContainerRef.current.offsetWidth
                : window.innerWidth;
            setDrumContainerWidth(width);

            // Shuffle
            const shuffled = shuffleArray(people);
            const repeatCount = 300; // not too big
            const repeated = [];
            for (let i = 0; i < repeatCount; i++) {
                repeated.push(...shuffled);
            }
            setRollingNames(repeated);

            // Start spin
            setTimeout(() => spin(repeated, width), 50);
        }, 100);
    }

    let lastTimestamp = 0;
    function spin(namesArray, containerWidth) {
        clearAnimation();
        setOffset(0);
        setIsSpinning(true);

        if (spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
            spinSoundRef.current.play().catch(console.error);
        }

        // Very high initial velocity
        let velocity = 800 + Math.random() * 300;
        let friction = 0.985 + Math.random() * 0.01;

        let currentOffset = Math.random() * (namesArray.length * cardTotalWidth);
        lastTimestamp = 0;

        function animate(timestamp) {
            if (!lastTimestamp) {
                lastTimestamp = timestamp;
            }
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            const deltaSec = delta / 1000;

            currentOffset += velocity * deltaSec;
            currentOffset %= namesArray.length * cardTotalWidth;

            velocity *= friction;

            setOffset(currentOffset);

            if (velocity > 5) {
                spinAnimationRef.current = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(spinAnimationRef.current);
                spinAnimationRef.current = null;
                finishSpin(currentOffset, containerWidth, namesArray);
            }
        }

        spinAnimationRef.current = requestAnimationFrame(animate);
    }

    function finishSpin(currentOffset, containerWidth, namesArray) {
        setIsSpinning(false);

        if (spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
        }

        const centerCoord = currentOffset + containerWidth / 2 - cardWidth / 2;
        const rawIndex = centerCoord / cardTotalWidth;
        const index = Math.round(rawIndex);
        const fraction = Math.abs(rawIndex - index);

        if (
            fraction >= 0.5 - halfMarginFraction &&
            fraction <= 0.5 + halfMarginFraction
        ) {
            setChosenName("");
            setNeedToSpinAgain(true);
        } else {
            const winner = namesArray[index];
            setChosenName(winner.name);
            setNeedToSpinAgain(false);

            if (victorySoundRef.current) {
                victorySoundRef.current.currentTime = 0;
                victorySoundRef.current.play().catch(console.error);
            }

            // Save to Firebase
            push(ref(db, "winners"), {
                name: winner.name,
                avatarUrl: winner.avatarUrl || "",
                timestamp: Date.now(),
            });

            onWinner(winner.name);
        }
    }

    function handleSpinAgain() {
        if (chosenName) {
            onRemoveWinner(chosenName);
            setChosenName("");
            setNeedToSpinAgain(false);
            prepareDrum();
        } else {
            // If we landed between cards
            if (!rollingNames.length) return;
            setNeedToSpinAgain(false);
            spin(rollingNames, drumContainerWidth);
        }
    }

    function handleBack() {
        stopAllSounds();
        clearAnimation();
        onBack();
    }

    function clearAnimation() {
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }
    }

    function stopAllSounds() {
        if (spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
        }
        if (victorySoundRef.current) {
            victorySoundRef.current.pause();
            victorySoundRef.current.currentTime = 0;
        }
    }

    return (
        <div className="drum-screen">
            <div className="drum-container" ref={drumContainerRef}>
                <div
                    className="drum-track"
                    style={{ transform: `translateX(-${offset}px)` }}
                >
                    {rollingNames.map((person, idx) => (
                        <DrumCard key={idx} person={person} />
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

/** FOOTER */
function Footer() {
    return (
        <footer className="footer">
            <div className="footer-left">©Aks1n3d Corp. 😎</div>
            <div className="footer-right">
                {/* Replace # with your real links */}
                <a href="https://www.instagram.com/busiachik_/" target="_blank" rel="noopener noreferrer">
          <span role="img" aria-label="Instagram">
            📷
          </span>
                </a>
                <a href="https://www.linkedin.com/in/busiak-denys/" target="_blank" rel="noopener noreferrer">
          <span role="img" aria-label="LinkedIn">
            💼
          </span>
                </a>
                <a href="https://www.twitch.tv/aks1n3d_" target="_blank" rel="noopener noreferrer">
          <span role="img" aria-label="Twitch">
            🎥
          </span>
                </a>
            </div>
        </footer>
    );
}

/** MAIN APP */
function App() {
    // Tabs: 'main', 'history', 'scoreboard', 'drum'
    const [currentTab, setCurrentTab] = useState("main");

    // People: [{ name, avatarUrl }, ...]
    const [people, setPeople] = useState([]);

    // Winners from Firebase
    const [allWinners, setAllWinners] = useState([]);
    const [lastWinner, setLastWinner] = useState(null);

    // For adding new participant
    const [nameInput, setNameInput] = useState("");
    const [avatarInput, setAvatarInput] = useState("");

    // Dark mode
    const [darkMode, setDarkMode] = useState(false);
    // Loading
    const [loading, setLoading] = useState(true);

    // Error messages
    const [errorMessage, setErrorMessage] = useState("");

    // For URL ?names=...
    const [searchParams, setSearchParams] = useSearchParams();

    // Firebase: read winners
    useEffect(() => {
        setLoading(true);
        const winnersRef = ref(db, "winners");
        onValue(winnersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.values(data).sort(
                    (a, b) => a.timestamp - b.timestamp
                );
                setAllWinners(arr);
                setLastWinner(arr[arr.length - 1]);
            } else {
                setAllWinners([]);
                setLastWinner(null);
            }
            setLoading(false);
        });
    }, []);

    // Dark mode effect
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    // URL ?names=...
    useEffect(() => {
        const urlNames = searchParams.get("names");
        if (urlNames) {
            const arr = urlNames.split(",").map((n) => ({ name: n, avatarUrl: "" }));
            setPeople(arr);
        }
    }, [searchParams]);

    function updateURL(newPeople) {
        const names = newPeople.map((p) => p.name);
        if (names.length === 0) {
            setSearchParams({});
        } else {
            setSearchParams({ names: names.join(",") });
        }
    }

    // Add participant
    function addPerson() {
        const trimmed = nameInput.trim();
        if (!trimmed) return;
        if (people.some((p) => p.name === trimmed)) {
            setErrorMessage("A participant with this name already exists.");
            return;
        }
        setErrorMessage("");

        const newPerson = {
            name: trimmed,
            avatarUrl: avatarInput.trim() || "",
        };
        const newPeople = [...people, newPerson];
        setPeople(newPeople);
        updateURL(newPeople);

        setNameInput("");
        setAvatarInput("");
    }

    // Remove participant (with confirm)
    function removePerson(index) {
        const toRemove = people[index];
        if (!window.confirm(`Do you want to remove "${toRemove.name}"?`)) {
            return;
        }
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
        updateURL(newPeople);
    }

    // Tabs
    function onTabChange(tab) {
        setCurrentTab(tab);
    }

    // "Pick Random" on main tab
    function handleChooseRandom() {
        if (people.length === 0) {
            setErrorMessage("Please add at least one participant.");
            return;
        }
        setErrorMessage("");

        // remove last winner from the array
        if (lastWinner) {
            const filtered = people.filter((p) => p.name !== lastWinner.name);
            if (filtered.length < people.length) {
                setPeople(filtered);
                updateURL(filtered);
            }
        }

        setCurrentTab("drum");
    }

    // When we have a new winner from the drum
    function handleWinnerFromDrum() {
        // Additional logic if needed
    }

    // Remove winner from the drum (Spin Again)
    function handleRemoveWinnerInDrum(name) {
        const newPeople = people.filter((p) => p.name !== name);
        setPeople(newPeople);
        updateURL(newPeople);
    }

    // Share
    function handleShare() {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => alert("Link copied to clipboard!"))
            .catch(console.error);
    }

    // Scoreboard
    function getScoreStats() {
        const stats = {};
        allWinners.forEach((w) => {
            stats[w.name] = (stats[w.name] || 0) + 1;
        });
        return stats;
    }

    // ============= DRUM TAB =============
    if (currentTab === "drum") {
        return (
            <>
                <Drum
                    people={people}
                    onWinner={handleWinnerFromDrum}
                    onRemoveWinner={handleRemoveWinnerInDrum}
                    onBack={() => setCurrentTab("main")}
                />
                <Footer />
            </>
        );
    }

    // ============= HISTORY TAB =============
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
                        <p>No winners yet 🤷‍♂️</p>
                    ) : (
                        <ul>
                            {allWinners.map((w, i) => (
                                <li key={i}>
                                    {w.avatarUrl && (
                                        <img
                                            src={w.avatarUrl}
                                            alt={w.name}
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                marginRight: "8px",
                                            }}
                                        />
                                    )}
                                    {w.name} — {new Date(w.timestamp).toLocaleString()}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Footer />
            </div>
        );
    }

    // ============= SCOREBOARD TAB =============
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
                        <p>No winners yet 🤷‍♂️</p>
                    ) : (
                        <table style={{ margin: "0 auto" }}>
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
                    )}
                </div>
                <Footer />
            </div>
        );
    }

    // ============= MAIN TAB =============
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
                    <input
                        type="text"
                        placeholder="Avatar URL (optional)"
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                    />
                    <button onClick={addPerson}>Add ✅</button>
                </div>

                <h2>List of Participants</h2>
                {people.length === 0 ? (
                    <p className="no-people-msg">Please add at least one participant.</p>
                ) : (
                    <ul>
                        {people.map((p, index) => (
                            <li key={index}>
                                {p.avatarUrl && (
                                    <img
                                        src={p.avatarUrl}
                                        alt={p.name}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            marginRight: "8px",
                                        }}
                                    />
                                )}
                                {p.name}{" "}
                                <button onClick={() => removePerson(index)} title="Delete">
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
                            {lastWinner.avatarUrl && (
                                <img
                                    src={lastWinner.avatarUrl}
                                    alt={lastWinner.name}
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        marginRight: "8px",
                                    }}
                                />
                            )}
                            <strong>{lastWinner.name}</strong>
                            <div style={{ fontSize: "12px", color: "#777" }}>
                                {new Date(lastWinner.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <p>No winners yet 🤷‍♂️</p>
                    )}
                </div>

                {errorMessage && (
                    <div style={{ marginTop: 10, color: "red", fontWeight: "bold" }}>
                        {errorMessage}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default App;