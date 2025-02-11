import React from 'react';

import './LoadingOverlay.scss';

const LoadingOverlay = ({ message = "" }) => {
    return (
        <div className="overlay">
            <div className="overlay-content">
                <span className='loader'></span>
                <div className='loader-message'>{message}</div>
            </div>
        </div>
    )
}

export default LoadingOverlay