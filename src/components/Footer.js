import React from "react";

export default function Footer({ currentTab }) {
    if (currentTab === "drum") return null;

    return (
        <footer className="footer">
            <div className="footer-left">©Aks1n3d Corp. 😎</div>
            <div className="footer-right">
                <a href="https://www.instagram.com/busiachik_" target="_blank" rel="noopener noreferrer">
                    📷
                </a>
                <a href="https://www.linkedin.com/in/busiak-denys/" target="_blank" rel="noopener noreferrer">
                    💼
                </a>
                <a href="https://www.twitch.tv/aks1n3d_" target="_blank" rel="noopener noreferrer">
                    📹
                </a>
            </div>
        </footer>
    );
}