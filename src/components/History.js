import React from "react";


export default function History({ loading, allWinners }) {
    if (loading) {
        return <p>Loading...</p>;
    }
    if (!allWinners.length) {
        return <p>No winners yet 🙁</p>;
    }
    return (
        <>
            <h1>History of Winners</h1>
            <ul>
                {allWinners.map((w, i) => (
                    <li key={i}>
                        {w.name} — {new Date(w.timestamp).toLocaleString()}
                    </li>
                ))}
            </ul>
        </>
    );
}