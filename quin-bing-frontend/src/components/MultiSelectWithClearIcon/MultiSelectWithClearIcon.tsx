import React, { useEffect, useState } from 'react';
import { MultiSelect } from 'react-multi-select-component';

import "./MultiSelectWithClearIcon.scss";

const MultiSelectWithClearIcon = ({ options, updateSelectedOptions }) => {
    const [selected, setSelected] = useState([]);

    const handleChange = (selectedOptions) => {
        setSelected(selectedOptions);
    };

    const customValueRenderer = (selectedOptions, options) => {
        return (
            <div
                style={{ display: 'flex', flexWrap: 'wrap', maxHeight: '100px', overflow: 'auto', cursor: "pointer" }}
            >
                {selectedOptions.length > 0 ? selectedOptions.map((selectedOption, index) => (
                    <div
                        key={index}
                        style={{
                            background: '#0366d6',
                            color: '#fff',
                            padding: '2px 5px',
                            borderRadius: '5px',
                            marginRight: '5px',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {selectedOption.label}
                        <span
                            style={{
                                marginLeft: '5px',
                                cursor: 'pointer',
                                fontWeight: 200,
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRemove(selectedOption.value)
                            }}
                        >
                            &#10006;
                        </span>
                    </div>
                )) : <span>Select...</span>}
            </div>
        );
    };

    const handleRemove = (value) => {
        const updatedSelected = selected.filter((option) => option.value !== value);
        setSelected(updatedSelected);
    };

    useEffect(() => {
        updateSelectedOptions(selected)
    }, [selected])

    return (
        <MultiSelect
            className='ml-0'
            options={options}
            value={selected}
            onChange={handleChange}
            labelledBy="Select"
            valueRenderer={customValueRenderer}
        />
    );
};

export default MultiSelectWithClearIcon;