import React from 'react';
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { IoMenu, IoClose } from 'react-icons/io5';
import './navbar.css';

const Navbar = () => {
    return (
      <header className="header">
        <nav className="nav container">
          <NavLink to="/" className="nav__logo">
            Internal Package Registry
          </NavLink>
   
          <div
            className={"nav__menu"}
            id="nav-menu"
          >
            <ul className="nav__list">
              <li className="nav__item">
                <NavLink to="/" className="nav__link">
                  Home
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink to="/search" className="nav__link">
                  Search
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink
                  to="/upload"
                  className="nav__link"
                >
                  Upload
                </NavLink>
              </li>
              <li className="nav__item">
                <NavLink
                  to="/download"
                  className="nav__link"
                >
                  Download
                </NavLink>
              </li>
              {/* <li className="nav__item">
                <NavLink
                  to="/location"
                  className="nav__link"
                >
                  Location
                </NavLink>
              </li> */}
              <li className="nav__item">
                <NavLink to="/get-started" className="nav__link nav__cta">
                  Get Started
                </NavLink>
              </li>
            </ul>
            <div className="nav__close" id="nav-close">
              <IoClose />
            </div>
          </div>
   
          <div className="nav__toggle" id="nav-toggle">
            <IoMenu />
          </div>
        </nav>
      </header>
    );
   };

export default Navbar;