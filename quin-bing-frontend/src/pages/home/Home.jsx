import React from 'react';
import quinLogo from '../../assets/Quin_Logo.png';
import quinLogoText from "../../assets/Quin_Logo.svg";
import './Home.scss';

const Home = () => {
    return (
        <div className='home'>
            <span>
                <img src={quinLogo} className="d-inline-block align-left quin_logo" width="80px" />
                <img src={quinLogoText} className="d-inline-block align-left" width="50%" />
            </span>
            <h6 className='mt-3'>Affine Quick Insight is an data analysis and visualization tool. Whether you're a data enthusiast, business analyst, or researcher, this tool will empower you to extract the most relevant insights from your datasets and present them in captivating visualizations.</h6>
            <p><strong>1.Effortless Data Analysis: </strong>Affine Quick Insight streamlines the process of data analysis, making it easy for you to identify trends, patterns, and relationships in your data.</p>
            <p><strong>2.Time-Saving: </strong>No need to spend hours coding and debugging. Affine Quick Insight takes care of the technicalities, so you can focus on gaining insights and making data-driven decisions.</p>
            <p><strong>3.User-Friendly Interface: </strong>You don't need to be a coding wizard to use Affine Quick Insight. Its user-friendly interface makes it accessible to all skill levels.</p>
        </div>
    );
};

export default Home;