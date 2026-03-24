"use client";

import { useState, useEffect } from 'react';

const calculateTimeLeft = (endTime: number) => {
    const difference = endTime - Date.now();
    let timeLeft = {
        minutes: 0,
        seconds: 0,
    };

    if (difference > 0) {
        timeLeft = {
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }

    return timeLeft;
};

type Props = {
    endTime: number;
}

const Timer: React.FC<Props> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(endTime));
        }, 1000);

        // Clear the interval on component unmount
        return () => clearTimeout(timer);
    }); // No dependency array, so it runs on every render, which is what we want for a live timer

    const seconds = String(timeLeft.seconds).padStart(2, '0');

    return (
        <div className="text-2xl font-mono">
            <span>{timeLeft.minutes}</span>:<span>{seconds}</span>
        </div>
    );
};

export default Timer;
