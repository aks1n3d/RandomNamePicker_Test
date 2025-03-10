// src/pages/TeamSelectorPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TeamSelectorPage() {
    const [teamInput, setTeamInput] = useState("");
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(false);

    function handleSelectTeam() {
        const trimmed = teamInput.trim();
        if (!trimmed) {
            alert("Please enter a valid team name!");
            return;
        }
        navigate(`/team/${trimmed}`);
    }

    function toggleDarkMode() {
        setDarkMode(!darkMode);
    }

    return (
        <div className={`app ${darkMode ? "dark-mode" : ""}`}>
            <Header
                currentTab=""
                onTabChange={() => {}}
                handleShare={() => {}}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                disableTabs={true}
            />

            {/* .main-ui c градиентным фоном */}
            <div className="main-ui team-selector-gradient">
                {/* Внутри - контент с анимацией */}
                <div className="team-selector-content fade-in">
                    <img
                        src="/team_hero.png"
                        alt="Team Hero"
                        className="team-hero-illustration"
                    />
                    <h1 className="team-title">Select Your Team 🏷</h1>
                    <p className="team-subtitle">
                        Enter the name of your team below and let's get started!
                    </p>
                    <div className="team-input-area">
                        <input
                            className="team-input"
                            type="text"
                            placeholder="e.g. Aks1n3d Corp, Leather Club ..."
                            value={teamInput}
                            onChange={(e) => setTeamInput(e.target.value)}
                                onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                handleSelectTeam();
                            }
                            }}
                        />
                        <button className="team-input-btn" onClick={handleSelectTeam}>
                            Go ➡️
                        </button>
                    </div>
                    <p className="team-hint">
                        You can use any team name. Each team has its own winners list. Make sure you entered correct name of your team name. 🤓
                    </p>
                </div>
            </div>

            <Footer currentTab="main" />
        </div>
    );
}