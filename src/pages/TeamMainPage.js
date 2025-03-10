// src/pages/TeamMainPage.js

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import "../App.css";
import { ref, push, onValue } from "firebase/database";

// Компоненты
import Drum from "../components/Drum";
import History from "../components/History";
import Scoreboard from "../components/Scoreboard";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TeamMainPage() {
    const { teamName } = useParams(); // /team/:teamName
    const [searchParams, setSearchParams] = useSearchParams();

    // Табы
    const [currentTab, setCurrentTab] = useState("main");

    // Список участников (строки)
    const [people, setPeople] = useState([]);

    // Все победители и последний
    const [allWinners, setAllWinners] = useState([]);
    const [lastWinner, setLastWinner] = useState(null);

    // Поле ввода имени
    const [nameInput, setNameInput] = useState("");

    // Тёмная тема
    const [darkMode, setDarkMode] = useState(false);

    // Лоадинг и ошибки
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // 1) Загружаем winners => teams/<teamName>/winners
    useEffect(() => {
        if (!teamName) return; // Без имени команды ничего не грузим
        setLoading(true);

        const winnersRef = ref(db, `teams/${teamName}/winners`);
        onValue(winnersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                let arr = Object.values(data);
                arr.sort((a, b) => b.timestamp - a.timestamp); // последние идут первыми
                setAllWinners(arr);
                setLastWinner(arr[0] || null);
            } else {
                setAllWinners([]);
                setLastWinner(null);
            }
            setLoading(false);
        });
    }, [teamName]);

    // 2) Темная тема
    useEffect(() => {
        if (darkMode) document.body.classList.add("dark-mode");
        else document.body.classList.remove("dark-mode");
    }, [darkMode]);

    // 3) Если в URL есть ?names=...
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

    function removePerson(index) {
        const toRemove = people[index];
        if (!window.confirm(`Remove "${toRemove}"?`)) return;
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
        updateURL(newPeople);
    }

    function toggleDarkMode() {
        setDarkMode(!darkMode);
    }

    function handleShare() {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => alert("Link copied to clipboard! 📋"))
            .catch(console.error);
    }

    // Переход на барабан
    function handleChooseRandom() {
        if (!people.length) {
            setErrorMessage("Please add at least one participant. 🙏🏼");
            return;
        }
        setErrorMessage("");
        setCurrentTab("drum");
    }

    // Когда барабан выбрал победителя => teams/<teamName>/winners
    function handleWinnerFromDrum(winnerName) {
        if (!teamName) return;
        push(ref(db, `teams/${teamName}/winners`), {
            name: winnerName,
            timestamp: Date.now(),
        });
    }

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
                    onTabChange={setCurrentTab}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    handleShare={handleShare}
                />
                <div className="main-ui">
                    <History loading={loading} allWinners={allWinners} />
                </div>
                <Footer currentTab={currentTab} />
            </div>
        );
    }

    // SCOREBOARD
    if (currentTab === "scoreboard") {
        const stats = getScoreStats();
        return (
            <div className={`app ${darkMode ? "dark-mode" : ""}`}>
                <Header
                    currentTab={currentTab}
                    onTabChange={setCurrentTab}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    handleShare={handleShare}
                />
                <div className="main-ui">
                    <Scoreboard loading={loading} stats={stats} />
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
                onTabChange={setCurrentTab}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                handleShare={handleShare}
            />
            <div className="main-ui">
                <h1>
                    Team: <span style={{ color: "#ff9800" }}>{teamName}</span> Random Picker 🐬
                </h1>

                <div className="input-area">
                    <input
                        type="text"
                        placeholder="Enter a name 🫵🏼"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addPerson();
                            }
                        }}
                    />
                    <button onClick={addPerson}>Add ✅</button>
                </div>

                <h2>⬇️ List of Participants ⬇️</h2>
                {people.length === 0 ? (
                    <p>Please add at least one participant.</p>
                ) : (
                    <ul>
                        {people.map((p, i) => (
                            <li key={i}>
                                {p}{" "}
                                <button className="delete-btn" onClick={() => removePerson(i)}>
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