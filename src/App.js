import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./App.css";

// ----- Firebase imports -----
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

// ----- Firebase configuration -----
// Замените данные ниже на свои настройки из Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCPEIQAwJMu_u2q_dlE8rtue52MMeDjN0g",
    authDomain: "aks1n3d-rand-test.firebaseapp.com",
    databaseURL: "https://aks1n3d-rand-test-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "aks1n3d-rand-test",
    storageBucket: "aks1n3d-rand-test.firebasestorage.app",
    messagingSenderId: "645602650565",
    appId: "1:645602650565:web:a9a850c7ac1ef3b06ec3ac",
    measurementId: "G-CK8ZJMSZMP"
};

initializeApp(firebaseConfig);
const db = getDatabase();

// =====================
// Компонент WinnersHistory
// =====================
function WinnersHistory() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const winnersRef = ref(db, "winners");
        onValue(winnersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const winnersArray = Object.values(data).sort(
                    (a, b) => a.timestamp - b.timestamp
                );
                setHistory(winnersArray);
            } else {
                setHistory([]);
            }
        });
    }, []);

    return (
        <div className="winners-history">
            <h1>Winners History</h1>
            {history.length === 0 ? (
                <p>No winners yet.</p>
            ) : (
                <ul>
                    {history.map((winner, i) => (
                        <li key={i}>
                            <strong>{winner.name}</strong>{" "}
                            <span style={{ fontSize: "12px", color: "#777" }}>
                ({new Date(winner.timestamp).toLocaleString()})
              </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// =====================
// Компонент DrumWheel
// =====================
function DrumWheel({ people, settings, onBack, onWinner, recentWinners }) {
    const drumContainerRef = useRef(null);
    const [drumContainerWidth, setDrumContainerWidth] = useState(0);
    const [rollingNames, setRollingNames] = useState([]);
    const [offset, setOffset] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [chosenName, setChosenName] = useState("");
    const [needToSpinAgain, setNeedToSpinAgain] = useState(false);
    const spinAnimationRef = useRef(null);

    const spinSoundRef = useRef(null);
    const victorySoundRef = useRef(null);

    useEffect(() => {
        spinSoundRef.current = new Audio("/spin.mp3");
        victorySoundRef.current = new Audio("/victory.mp3");
    }, []);

    // Параметры карточек
    const cardWidth = 150;
    const cardMargin = 10;
    const cardTotalWidth = cardWidth + cardMargin;
    const marginFraction = cardMargin / cardTotalWidth; // 10/160 = 0.0625
    const halfMarginFraction = marginFraction / 2;        // 0.03125

    useEffect(() => {
        if (drumContainerRef.current) {
            setDrumContainerWidth(drumContainerRef.current.offsetWidth);
        }
    }, []);

    useEffect(() => {
        const repeatCount = 2000;
        let repeated = [];
        for (let i = 0; i < repeatCount; i++) {
            repeated.push(...people);
        }
        setRollingNames(repeated);
    }, [people]);

    // Функция анимации рулетки с requestAnimationFrame и deltaTime,
    // с добавлением проверки, чтобы анимация не зацикливалась более 10 секунд.
    function startSpinning() {
        if (spinAnimationRef.current) cancelAnimationFrame(spinAnimationRef.current);

        setIsSpinning(true);
        setChosenName("");
        setOffset(0);

        if (settings.soundEnabled && spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
            spinSoundRef.current.play().catch((err) => console.error(err));
        }

        let currentOffset = Math.random() * (rollingNames.length * cardTotalWidth);
        let velocity = settings.initialVelocity; // например, 100 px/sec
        const friction = settings.friction; // например, 0.98
        const trackLength = rollingNames.length * cardTotalWidth;
        let lastTime = null;
        let startTimestamp = null;

        function animate(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            if (timestamp - startTimestamp > 10000) {
                // Если анимация длится более 10 секунд – принудительно завершаем
                cancelAnimationFrame(spinAnimationRef.current);
                spinAnimationRef.current = null;
                setIsSpinning(false);
                onBack && onBack();
                return;
            }
            if (!lastTime) lastTime = timestamp;
            const deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            currentOffset += velocity * deltaTime;
            currentOffset %= trackLength;
            velocity *= Math.pow(friction, deltaTime * 60);

            setOffset(currentOffset);

            if (velocity >= 0.2) {
                spinAnimationRef.current = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(spinAnimationRef.current);
                spinAnimationRef.current = null;
                setIsSpinning(false);

                if (settings.soundEnabled && spinSoundRef.current) {
                    spinSoundRef.current.pause();
                    spinSoundRef.current.currentTime = 0;
                }

                const centerCoord = currentOffset + drumContainerWidth / 2 - cardWidth / 2;
                const rawIndex = centerCoord / cardTotalWidth;
                const index = Math.round(rawIndex);
                const fraction = Math.abs(rawIndex - index);

                if (fraction >= 0.5 - halfMarginFraction && fraction <= 0.5 + halfMarginFraction) {
                    setChosenName("");
                    setNeedToSpinAgain(true);
                } else {
                    const chosen = rollingNames[index];
                    // Если выбранное имя не определено или входит в список последних победителей, повторяем вращение
                    if (!chosen || recentWinners.includes(chosen)) {
                        setNeedToSpinAgain(true);
                        setTimeout(() => startSpinning(), 1000);
                        return;
                    }
                    setChosenName(chosen);
                    setNeedToSpinAgain(false);
                    push(ref(db, "winners"), { name: chosen, timestamp: Date.now() });
                    if (settings.soundEnabled && victorySoundRef.current) {
                        victorySoundRef.current.currentTime = 0;
                        victorySoundRef.current.play().catch((err) => console.error(err));
                    }
                    onWinner && onWinner(chosen);
                }
            }
        }
        spinAnimationRef.current = requestAnimationFrame(animate);
    }

    useEffect(() => {
        startSpinning();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSpinAgain = () => {
        startSpinning();
    };

    const handleBack = () => {
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }
        if (settings.soundEnabled && spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
        }
        if (settings.soundEnabled && victorySoundRef.current) {
            victorySoundRef.current.pause();
            victorySoundRef.current.currentTime = 0;
        }
        setOffset(0);
        setChosenName("");
        setNeedToSpinAgain(false);
        setIsSpinning(false);
        onBack && onBack();
    };

    return (
        <div className="drum-screen">
            <div className="drum-container" ref={drumContainerRef}>
                <div
                    className="drum-track"
                    style={{ transform: `translateX(-${offset}px)` }}
                >
                    {rollingNames.map((person, index) => (
                        <div key={index} className="card">
                            {person}
                        </div>
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
                    {needToSpinAgain && (
                        <button onClick={handleSpinAgain} className="spin-again-btn">
                            Spin Again 🔄
                        </button>
                    )}
                    <button onClick={handleBack} className="back-btn">
                        Back ⬅️
                    </button>
                </div>
            )}
        </div>
    );
}

// =====================
// Компонент ManagePeople
// =====================
function ManagePeople({
                          people,
                          addPerson,
                          removePerson,
                          handleChooseRandom,
                          handleShare,
                          errorMessage,
                          lastWinner,
                          name,
                          setName
                      }) {
    return (
        <div className="main-ui">
            <button className="share-btn" onClick={handleShare}>
                Share 🤌🏼
            </button>
            <h1>Dolphin Random Person Picker 🐬</h1>
            <div className="input-area">
                <input
                    type="text"
                    placeholder="Enter a name 🫵🏼"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button onClick={addPerson}>Add ✅</button>
            </div>
            <h2>⬇️List of People⬇️</h2>
            {people.length === 0 ? (
                <p className="no-people-msg">
                    Please add at least one person to start playing 🙏🏼
                </p>
            ) : (
                <ul>
                    {people.map((person, index) => (
                        <li key={index}>
                            {person}{" "}
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
                <h2>Last Winner 🏆</h2>
                {lastWinner ? (
                    <div>
                        <strong>{lastWinner.name}</strong>
                        <div style={{ fontSize: "12px", color: "#777" }}>
                            {new Date(lastWinner.timestamp).toLocaleString()}
                        </div>
                    </div>
                ) : (
                    <p>No winners yet. 🤷🏼</p>
                )}
            </div>
            {errorMessage && (
                <div style={{ marginTop: "10px", color: "red", fontWeight: "bold" }}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

// =====================
// Основной компонент AppWrapper
// =====================
function AppWrapper() {
    const [activeTab, setActiveTab] = useState("manage"); // manage, history, drum
    const [name, setName] = useState("");
    const [people, setPeople] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [lastWinner, setLastWinner] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    // Состояние для последних 2 победителей
    const [recentWinners, setRecentWinners] = useState([]);

    useEffect(() => {
        const urlNames = searchParams.get("names");
        if (urlNames) {
            setPeople(urlNames.split(","));
        }
    }, [searchParams]);

    const updateURL = (newPeople) => {
        setSearchParams(newPeople.length > 0 ? { names: newPeople.join(",") } : {});
    };

    const addPerson = () => {
        if (name.trim() !== "" && !people.includes(name)) {
            const newPeople = [...people, name];
            setPeople(newPeople);
            updateURL(newPeople);
            setName("");
            setErrorMessage("");
        }
    };

    const removePerson = (index) => {
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
        updateURL(newPeople);
    };

    const handleChooseRandom = () => {
        if (people.length === 0) {
            setErrorMessage("Please add names to start playing.");
            return;
        }
        setErrorMessage("");
        setActiveTab("drum");
    };

    const handleShare = () => {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => alert("📋Link copied to clipboard!"))
            .catch((err) => console.error("Failed to copy link", err));
    };

    const handleDrumBack = () => {
        setActiveTab("manage");
    };

    const handleWinnerSelected = (winner) => {
        setLastWinner(winner);
        // Обновляем список последних победителей: сохраняем последних 2
        setRecentWinners((prev) => [winner, ...prev].slice(0, 2));
        setActiveTab("manage");
    };

    return (
        <div className="app">
            <div className="tabs">
                <button
                    className={activeTab === "manage" ? "active" : ""}
                    onClick={() => setActiveTab("manage")}
                >
                    Manage
                </button>
                <button
                    className={activeTab === "history" ? "active" : ""}
                    onClick={() => setActiveTab("history")}
                >
                    History
                </button>
            </div>

            {activeTab === "manage" && (
                <ManagePeople
                    people={people}
                    addPerson={addPerson}
                    removePerson={removePerson}
                    handleChooseRandom={handleChooseRandom}
                    handleShare={handleShare}
                    errorMessage={errorMessage}
                    lastWinner={lastWinner}
                    name={name}
                    setName={setName}
                />
            )}

            {activeTab === "history" && <WinnersHistory />}

            {activeTab === "drum" && (
                <DrumWheel
                    people={people}
                    settings={{
                        initialVelocity: 100,
                        friction: 0.98,
                        soundEnabled: true
                    }}
                    onBack={handleDrumBack}
                    onWinner={handleWinnerSelected}
                    recentWinners={recentWinners}
                />
            )}
        </div>
    );
}

export default AppWrapper;