"use client";

import { useState, useEffect } from 'react';

type Props = {
    endTime: number;
}

const Timer: React.FC<Props> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));

    useEffect(() => {
        // Automatically sync to the exact clock every second
        const timer = setInterval(() => {
            setTimeLeft(Math.max(0, endTime - Date.now()));
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    // Parse the display data inline during the render frame
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');

    return (
        <div className="text-2xl font-mono">
            <span>{minutes}</span>:<span>{seconds}</span>
        </div>
    );
};

export default Timer;
