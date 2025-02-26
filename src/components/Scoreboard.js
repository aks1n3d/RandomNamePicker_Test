import React from "react";


export default function Scoreboard({ loading, stats }) {
    // stats = { name: count, name2: count2, ...}
    if (loading) {
        return <p>Loading...</p>;
    }
    const scoreboardData = Object.keys(stats)
        .map((n) => ({ name: n, wins: stats[n] }))
        .sort((a, b) => b.wins - a.wins);

    if (!scoreboardData.length) {
        return <p>No winners yet 🙁</p>;
    }

    return (
        <>
            <h1>Scoreboard</h1>
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
        </>
    );
}