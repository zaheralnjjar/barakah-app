// utils/alertSound.ts

/**
 * Play a short alert sound using Web Audio API.
 * Used across the app for timers, appointments, tasks, etc.
 */
export const playAlertSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.type = 'sine';
        // 3‑beep pattern: 800‑1000‑1200 Hz
        oscillator.frequency.value = 800;
        gain.gain.value = 0.5;
        oscillator.start();
        setTimeout(() => (oscillator.frequency.value = 1000), 200);
        setTimeout(() => (oscillator.frequency.value = 800), 400);
        setTimeout(() => (oscillator.frequency.value = 1200), 600);
        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 1000);
    } catch (e) {
        console.warn('Audio API not supported');
    }
};
