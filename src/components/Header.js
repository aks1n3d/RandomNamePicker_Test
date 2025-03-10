// src/components/Header.js

import React from "react";

export default function Header({
                                   currentTab,
                                   onTabChange,
                                   darkMode,
                                   toggleDarkMode,
                                   handleShare
                               }) {
    if (currentTab === "drum") return null;

    return (
        <header className="header">
            <div className="header-left">
                <h2>🎩 Magic Name Picker 🪄</h2>
            </div>
            <div className="header-right">
                <button
                    className={`nav-btn ${currentTab === "main" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("main")}
                >
                    🎰 Randomizer
                </button>
                <button
                    className={`nav-btn ${currentTab === "history" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("history")}
                >
                    📜 History
                </button>
                <button
                    className={`nav-btn ${currentTab === "scoreboard" ? "active-tab" : ""}`}
                    onClick={() => onTabChange("scoreboard")}
                >
                    🏆 Scoreboard
                </button>
                <button className="nav-btn" onClick={handleShare}>
                    📢 Share
                </button>

                <label className="theme-toggle">
                    <input
                        type="checkbox"
                        className="theme-toggle__input"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                    />
                    <div className="theme-toggle__track">
                        {/* Иконка ЛУНЫ слева */}
                        <svg
                            className="theme-toggle__icon theme-toggle__icon--moon"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M20 15.5A8 8 0 0 1 11.5 7a5.5 5.5 0 1 0 8.5 8.5Z"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        </svg>

                        {/* Иконка СОЛНЦА справа */}
                        <svg
                            className="theme-toggle__icon theme-toggle__icon--sun"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="2" />
                            <g stroke="#fff" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </g>
                        </svg>

                        {/* Круг */}
                        <div className="theme-toggle__circle"></div>
                    </div>
                </label>
            </div>
        </header>
    );
}