export function playSound(path: string) {
    try {

        const audio = new Audio(path);

        audio.volume = 0.7;

        audio.play().catch(() => {
            // navegador bloqueó autoplay
        });

    } catch (error) {
        console.error(error);
    }
}