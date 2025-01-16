import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const SyntaxCodeHighlighter = ({ language, code }) => {
    const customStyles = {
        padding: '15px',
    };
    return (
        <SyntaxHighlighter language={language} style={docco} customStyle={customStyles}>
            {code}
        </SyntaxHighlighter>
    );
};

export default SyntaxCodeHighlighter;