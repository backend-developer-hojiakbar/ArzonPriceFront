import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import App from './App';
import './index.css';  // Import custom styles

function Login() {
    const [token, setToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const getCSRFToken = () => {
        return window.csrfToken; // Read CSRF token from global variable
    };

    const handleTokenSubmit = async () => {
        const csrfToken = getCSRFToken();
        try {
            const response = await axios.post('https://backendap.cdpos.uz/api/verify-token/', { token }, {
                headers: {
                    'X-CSRFToken': csrfToken,
                },
            });
            if (response.data.message === 'Token is valid') {
                setIsAuthenticated(true);
                setErrorMessage('');
            } else {
                setIsAuthenticated(false);
                setErrorMessage('Invalid token');
            }
        } catch (error) {
            setIsAuthenticated(false);
            setErrorMessage(error.response?.data?.message || 'An error occurred');
        }
    };

    if (isAuthenticated) {
        return <App />;
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your token"
                    className="login-input"
                />
                <button onClick={handleTokenSubmit} className="login-button">Submit Token</button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
        </div>
    );
}

ReactDOM.render(<Login />, document.getElementById('root'));
