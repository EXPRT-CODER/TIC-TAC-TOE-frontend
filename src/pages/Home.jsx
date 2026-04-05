import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  // Auto-focus input safely
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Please enter your name!");
      return;
    }

    navigate("/lobby", {
      state: { username: trimmedName },
    });
  };

  // View Height Fix for Mobile
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 overflow-hidden flex justify-center items-center">
      <div className="home-theme-glow home-theme-glow-top" />
      <div className="home-theme-glow home-theme-glow-bottom" />
      <div className="home-theme-panel w-full max-w-md p-8 sm:p-10 relative z-10">
        <form onSubmit={handleSubmit}>
          <p className="text-center text-xs sm:text-sm tracking-[0.28em] uppercase text-(--home-muted)">
            BY  EXPRT CODER
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-center text-(--home-text) mt-3">
            Tic Tac Toe
          </h1>
          <p className="mt-3 text-center text-sm text-(--home-muted)">
            ENTER YOUR NAME TO MOVE ON!
          </p>
          <div className="flex flex-col items-center mt-7 gap-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Your Name"
              className="w-full p-3 rounded-xl border border-(--home-border) bg-(--home-input-bg) text-(--home-text) placeholder-(--home-muted) focus:outline-none focus:ring-2 focus:ring-(--home-accent)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="w-full p-3 rounded-xl bg-(--home-accent) text-white font-semibold hover:bg-(--home-accent-strong) transition-colors duration-200"
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Home;