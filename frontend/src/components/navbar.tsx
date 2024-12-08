import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import "./navbar.css";

interface NavbarProps {
  loggedIn?: boolean; // Make loggedIn optional
}

const Navbar: React.FC<NavbarProps> = ({ loggedIn = true }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const location = useLocation();

  const toggleMenu = (): void => {
    setMenuVisible((prev) => !prev);
  };

  const handleScroll = (): void => {
    const currentScrollPos = window.scrollY;
    setHidden(currentScrollPos > prevScrollPos && currentScrollPos > 50);
    setPrevScrollPos(currentScrollPos);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollPos]);

  const isCenteredPage = location.pathname === "/" || location.pathname === "/login";

  return (
    <header className={`header ${hidden ? "hidden" : ""}`}>
      <nav className="nav container">
        {isCenteredPage ? (
          <NavLink to="/" className="nav__logo-centered">
            Internal Package Registry
          </NavLink>
        ) : (
          <>
            <NavLink to="/get-started" className="nav__logo">
              Internal Package Registry
            </NavLink>
            {loggedIn && (
              <>
                <div className={`nav__menu ${menuVisible ? "show-menu" : ""}`}>
                  <ul className="nav__list">
                    <li className="nav__item">
                      <NavLink
                        to="/get-started"
                        className="nav__link"
                        onClick={() => setMenuVisible(false)}
                      >
                        Get Started
                      </NavLink>
                    </li>
                    <li className="nav__item">
                      <NavLink
                        to="/search"
                        className="nav__link"
                        onClick={() => setMenuVisible(false)}
                      >
                        Search
                      </NavLink>
                    </li>
                    <li className="nav__item">
                      <NavLink
                        to="/upload"
                        className="nav__link"
                        onClick={() => setMenuVisible(false)}
                      >
                        Upload
                      </NavLink>
                    </li>
                    <li className="nav__item">
                      <NavLink
                        to="/download"
                        className="nav__link"
                        onClick={() => setMenuVisible(false)}
                      >
                        Download
                      </NavLink>
                    </li>
                    <li className="nav__item">
                      <NavLink
                        to="/admin"
                        className="nav__link"
                        onClick={() => setMenuVisible(false)}
                      >
                        Admin
                      </NavLink>
                    </li>
                    <li className="nav__item">
                      <NavLink
                        to="/"
                        className="nav__cta"
                        onClick={() => setMenuVisible(false)}
                      >
                        Log Out
                      </NavLink>
                    </li>
                  </ul>
                </div>
                <div className="nav__toggle" onClick={toggleMenu}>
                  <IoMenu />
                </div>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
