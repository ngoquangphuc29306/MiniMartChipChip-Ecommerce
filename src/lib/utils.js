import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Hàm tạo hiệu ứng pháo giấy đơn giản sử dụng DOM và CSS Animation
export function triggerConfetti() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#fbbf24'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = '50%';
    confetti.style.top = '50%';
    confetti.style.zIndex = '9999';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    document.body.appendChild(confetti);

    // Tính toán hướng bay ngẫu nhiên
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 2;
    const tx = Math.cos(angle) * (window.innerWidth / 2) * Math.random();
    const ty = Math.sin(angle) * (window.innerHeight / 2) * Math.random();

    const animation = confetti.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 1000,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      fill: 'forwards'
    });

    animation.onfinish = () => confetti.remove();
  }
}