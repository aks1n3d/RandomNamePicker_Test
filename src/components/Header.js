import React from "react";

export default function Header({ currentTab, onTabChange, darkMode, toggleDarkMode, handleShare }) {
    if (currentTab === "drum") return null;

    return (
        <header className="header">
            <div className="header-left">
                <h2>🎩 Dolphin Magic Picker 🪄</h2>
            </div>
            <div className="header-right">
                <button className={`nav-btn ${currentTab === "main" ? "active-tab" : ""}`} onClick={() => onTabChange("main")}>
                    🎰 Randomizer
                </button>
                <button className={`nav-btn ${currentTab === "history" ? "active-tab" : ""}`} onClick={() => onTabChange("history")}>
                    📜 History
                </button>
                <button className={`nav-btn ${currentTab === "scoreboard" ? "active-tab" : ""}`} onClick={() => onTabChange("scoreboard")}>
                    🏆 Scoreboard
                </button>
                <button className="nav-btn" onClick={handleShare}>
                    📢 Share
                </button>
                <label className="switch">
                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                    <span className="slider round"></span>
                </label>
            </div>
        </header>
    );
}