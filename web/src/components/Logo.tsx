import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const variants = [
  '/logo/fixed.png'
  // '/logo/matcha0.png',
  // '/logo/matcha1.png',
  // '/logo/matcha2.png',
  // '/logo/matcha3.png',
  // '/logo/matcha4.png',
  // '/logo/matcha5.png',
  // '/logo/matcha6.png',
  // '/logo/matcha7.png',
  // '/logo/matcha8.png',
];

export function Logo({ size = 40, rotate = true }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!rotate) return;

    const interval = setInterval(() => {
      setIndex(i => (i + 1) % variants.length);
    }, 50000);

    return () => clearInterval(interval);
  }, [rotate]);

  return (
    <Link to={"https://github.com/42-Course/matcha"}
      className='absolute top right top-2 left-2'
    >
      <img
        src={variants[index]}
        alt="Matcha Logo"
        className={clsx(
          "transition-opacity duration-700 ease-in-out",
        )}
        style={{
          width: "auto",
          height: size,
          objectFit: "contain",
        }}
      />
    </Link>
  );
}
