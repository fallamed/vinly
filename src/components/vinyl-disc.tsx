"use client";

import { useEffect, useRef } from "react";

// 1800ms a giro = 33⅓ rpm, come un vero LP.
const PERIOD_MS = 1800;

type Props = {
	progressMs: number;
	fetchedAt: number;
	playing: boolean;
	coverUrl: string | null;
	size?: number;
};

export function VinylDisc({ progressMs, fetchedAt, playing, coverUrl, size = 224 }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let raf = 0;
		const tick = () => {
			// L'angolo è derivato dalla posizione nella traccia, non da un'animazione
			// libera: due utenti sulla stessa traccia vedono lo stesso angolo.
			const pos = playing ? progressMs + (Date.now() - fetchedAt) : progressMs;
			const angle = ((pos % PERIOD_MS) / PERIOD_MS) * 360;
			if (ref.current) ref.current.style.transform = `rotate(${angle}deg)`;
			if (playing) raf = requestAnimationFrame(tick);
		};
		tick();
		return () => cancelAnimationFrame(raf);
	}, [progressMs, fetchedAt, playing]);

	return (
		<div
			ref={ref}
			className="relative rounded-full bg-[#0d1020] will-change-transform"
			style={{ width: size, height: size }}
		>
			{[
				size * 0.06,
				size * 0.11,
				size * 0.16,
				size * 0.21,
			].map((inset) => (
				<div
					key={inset}
					className="absolute rounded-full border border-[#2A3354]"
					style={{ inset }}
				/>
			))}
			<div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-1 h-3 rounded bg-[#4DD8E6]" />
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full overflow-hidden">
				{coverUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={coverUrl} alt="" className="w-full h-full object-cover" draggable={false} />
				) : (
					<div className="w-full h-full bg-[#E64DA8]" />
				)}
			</div>
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-black border border-[#2A3354]" />
		</div>
	);
}
