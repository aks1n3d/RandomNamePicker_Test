import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

// Функция случайного цвета (не меняем)
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Карточка участника
function DrumCard({ name }) {
    const colorRef = useRef(getRandomColor());
    return (
        <div
            className="card"
            style={{ backgroundColor: colorRef.current, color: "#000" }}
        >
            {name}
        </div>
    );
}

export default function Drum({ people, lastWinner, onWinner, onBack }) {
    const [offset, setOffset] = useState(0);
    const [rollingNames, setRollingNames] = useState([]);
    const [chosenName, setChosenName] = useState("");
    const [needToSpinAgain, setNeedToSpinAgain] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);

    const drumContainerRef = useRef(null);
    const spinAnimationRef = useRef(null);

    // ⬇️ Ссылки на звуки
    const spinSoundRef = useRef(null);
    const victorySoundRef = useRef(null);

    // Инициируем аудио
    useEffect(() => {
        spinSoundRef.current = new Audio("/spin.mp3");
        victorySoundRef.current = new Audio("/victory.mp3");
    }, []);

    // При монтировании
    useEffect(() => {
        prepareDrum();
        return () => {
            if (spinAnimationRef.current) {
                cancelAnimationFrame(spinAnimationRef.current);
            }
            // Останавливаем звуки
            if (spinSoundRef.current) {
                spinSoundRef.current.pause();
                spinSoundRef.current.currentTime = 0;
            }
            if (victorySoundRef.current) {
                victorySoundRef.current.pause();
                victorySoundRef.current.currentTime = 0;
            }
        };
        // eslint-disable-next-line
    }, []);

    function prepareDrum() {
        setChosenName("");
        setNeedToSpinAgain(false);
        setIsSpinning(true);

        setTimeout(() => {
            const width = drumContainerRef.current
                ? drumContainerRef.current.offsetWidth
                : window.innerWidth;

            // Убираем последний выигрыш
            let filtered = [...people];
            if (lastWinner) {
                filtered = filtered.filter((p) => p !== lastWinner);
            }

            const repeatCount = 300;
            let bigArray = [];
            for (let i = 0; i < repeatCount; i++) {
                bigArray.push(...filtered);
            }
            setRollingNames(bigArray);

            setTimeout(() => spin(bigArray, width), 100);
        }, 100);
    }

    function spin(namesArray, containerWidth) {
        setOffset(0);
        let velocity = 1500 + Math.random() * 500;
        let friction = 0.989 + Math.random() * 0.01;
        const cardTotal = 160;
        let currentOffset = Math.random() * (namesArray.length * cardTotal);
        let lastTimestamp = 0;

        // ⬇️ Проигрываем звук спин
        if (spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
            spinSoundRef.current.play().catch((err) => console.log(err));
        }

        function animate(timestamp) {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            const deltaSec = delta / 1000;

            currentOffset += velocity * deltaSec;
            currentOffset %= namesArray.length * cardTotal;
            velocity *= friction;

            setOffset(currentOffset);

            if (velocity > 5) {
                spinAnimationRef.current = requestAnimationFrame(animate);
            } else {
                finishSpin(currentOffset, containerWidth, namesArray);
            }
        }
        spinAnimationRef.current = requestAnimationFrame(animate);
    }

    function finishSpin(currentOffset, containerWidth, namesArray) {
        setIsSpinning(false);

        // Останавливаем спин-звук
        if (spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
        }

        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }

        const cardTotal = 160;
        const centerCoord = currentOffset + containerWidth / 2 - 75;
        const index = Math.round(centerCoord / cardTotal);
        const winner = namesArray[index];

        if (!winner) {
            setChosenName("");
            setNeedToSpinAgain(true);
            return;
        }

        setChosenName(winner);
        setNeedToSpinAgain(false);

        // Запускаем конфетти
        confetti({
            particleCount: 250,
            spread: 100,
            origin: { y: 0.6 },
            zIndex: 9999,
        });

        // ⬇️ Звук победы
        if (victorySoundRef.current) {
            victorySoundRef.current.currentTime = 0;
            victorySoundRef.current.play().catch((err) => console.log(err));
        }

        onWinner(winner);
    }

    function handleSpinAgain() {
        setNeedToSpinAgain(false);
        if (chosenName) {
            setChosenName("");
            prepareDrum();
        } else {
            if (!rollingNames.length) return;
            spin(rollingNames, drumContainerRef.current.offsetWidth);
        }
    }

    function handleBack() {
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }
        // Останавливаем звуки
        if (spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
        }
        if (victorySoundRef.current) {
            victorySoundRef.current.pause();
            victorySoundRef.current.currentTime = 0;
        }
        onBack();
    }

    return (
        <div className="drum-screen">
            <div className="drum-container" ref={drumContainerRef}>
                <div
                    className="drum-track"
                    style={{ transform: `translateX(-${offset}px)` }}
                >
                    {rollingNames.map((person, i) => (
                        <DrumCard key={i} name={person} />
                    ))}
                </div>
                <div className="arrow"></div>
            </div>

            {!isSpinning && chosenName && (
                <div className="result">
                    <h2>🎊 The Winner is {chosenName} 🎉</h2>
                </div>
            )}
            {!isSpinning && needToSpinAgain && (
                <div className="result">
                    <h2>⚠️ Oops! Try spinning again! 🔄</h2>
                </div>
            )}

            {!isSpinning && (
                <div className="drum-buttons">
                    {(needToSpinAgain || chosenName) && (
                        <button className="spin-again-btn" onClick={handleSpinAgain}>
                            🔄 Spin Again
                        </button>
                    )}
                    <button className="back-btn" onClick={handleBack}>
                        🔙 Back to Main
                    </button>
                </div>
            )}
        </div>
    );
}