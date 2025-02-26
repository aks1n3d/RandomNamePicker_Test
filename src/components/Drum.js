import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

// 🎨 Функция случайного цвета для карточек
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 📌 Компонент карточки участника
function DrumCard({ name }) {
    const colorRef = useRef(getRandomColor());
    return (
        <div
            className="card"
            style={{ backgroundColor: colorRef.current, color: "#000000" }}
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

    // 🎰 Подготовка барабана
    useEffect(() => {
        prepareDrum();
        return () => {
            if (spinAnimationRef.current) {
                cancelAnimationFrame(spinAnimationRef.current);
            }
        };
// eslint-disable-next-line
    },[]);

    function prepareDrum() {
        setChosenName("");
        setNeedToSpinAgain(false);
        setIsSpinning(true);

        setTimeout(() => {
            const width = drumContainerRef.current
                ? drumContainerRef.current.offsetWidth
                : window.innerWidth;

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

    // 🔄 Анимация барабана
    function spin(namesArray, containerWidth) {
        setOffset(0);
        let velocity = 2000 + Math.random() * 500;
        let friction = 0.985;
        const cardTotal = 160; // 🎰 Размер карточки с отступами
        let currentOffset = Math.random() * (namesArray.length * cardTotal);
        let lastTimestamp = 0;

        function animate(timestamp) {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaSec = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            currentOffset += velocity * deltaSec;
            currentOffset %= (namesArray.length * cardTotal);
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

    // 🎯 Определение победителя
    function finishSpin(currentOffset, containerWidth, namesArray) {
        setIsSpinning(false);
        if (spinAnimationRef.current) {
            cancelAnimationFrame(spinAnimationRef.current);
            spinAnimationRef.current = null;
        }

        const cardTotal = 160;
        const centerCoord = currentOffset + containerWidth / 2 - 75;
        const index = Math.round(centerCoord / cardTotal);
        const winner = namesArray[index];

        if (!winner) {
            setNeedToSpinAgain(true);
            return;
        }

        setChosenName(winner);
        setNeedToSpinAgain(false);

        // 🎉 Запускаем конфетти
        confetti({
            particleCount: 250,
            spread: 100,
            origin: { y: 0.6 },
            zIndex: 9999,
        });

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
        onBack();
    }

    return (
        <div className="drum-screen">
            <div className="drum-container" ref={drumContainerRef}>
                <div className="drum-track" style={{ transform: `translateX(-${offset}px)` }}>
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