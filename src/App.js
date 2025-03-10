// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import TeamSelectorPage from "./pages/TeamSelectorPage";
import TeamMainPage from "./pages/TeamMainPage";

export default function App() {
    return (
        <Routes>
            {/* / => выбор команды */}
            <Route path="/" element={<TeamSelectorPage />} />

            {/* /team/<TEAM_NAME> => табы (main, drum, history, scoreboard) */}
            <Route path="/team/:teamName" element={<TeamMainPage />} />

            {/* 404 */}
            <Route
                path="*"
                element={
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                        <h1>404 - Page Not Found 🙁</h1>
                    </div>
                }
            />
        </Routes>
    );
}