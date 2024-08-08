import React, { useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
    const [files, setFiles] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [basketItems, setBasketItems] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const MIN_PRICE_THRESHOLD = 10;

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                setExchangeRate(response.data);
            } catch (error) {
                console.error('Error fetching exchange rate:', error);
            }
        };
        fetchExchangeRate();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleFileChange = (event) => {
        const newFiles = Array.from(event.target.files);
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const uploadFiles = async () => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });

        try {
            const response = await axios.post('https://backendap.cdpos.uz/router/upload/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload successful:', response.data);
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    };

    const handleSearch = async () => {
        if (searchInput.length > 0) {
            try {
                const response = await axios.get(`https://backendap.cdpos.uz/api/drugs/?q=${searchInput}`);
                const filteredResults = response.data.filter(item => item.price >= MIN_PRICE_THRESHOLD);
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelect = (item) => {
        setBasketItems(prevItems => [...prevItems, item]);
        setSelectedItems(prevItems => prevItems.filter(i => i !== item));
    };

    const handleAddToInvoice = (item) => {
        setInvoiceItems(prevItems => [...prevItems, item]);
        setBasketItems(prevItems => prevItems.filter(i => i !== item));
    };

    const handleRemoveFromInvoice = (item) => {
        setBasketItems(prevItems => [...prevItems, item]);
        setInvoiceItems(prevItems => prevItems.filter(i => i !== item));
    };

    const handleReady = () => {
        const companyMap = new Map();

        invoiceItems.forEach(item => {
            if (!companyMap.has(item.company)) {
                companyMap.set(item.company, []);
            }
            companyMap.get(item.company).push(item);
        });

        companyMap.forEach((items, company) => {
            const worksheet = XLSX.utils.json_to_sheet(items);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            XLSX.writeFile(workbook, `${company}.xlsx`);
        });

        setInvoiceItems([]);
    };

    return (
        <div className="App">
            <header className="header">
                <div className="header-left">
                    <h3>Arzon PRICE</h3>
                    <h6>Powered by CDPOS</h6>
                </div>
                <div className="header-right">
                    
                </div>
            </header>

            <div className="main-section">
                <div className="upload-section">
                    <h2>Import Excel Files</h2>
                    <label htmlFor="fileInput" className="icon-container">
                        <FontAwesomeIcon icon={faUpload} size="2x" />
                        <div className="icon-text">Excel faylni yuklang</div>
                    </label>
                    <input
                        type="file"
                        id="fileInput"
                        accept=".xls,.xlsx"
                        style={{ display: 'none' }}
                        multiple
                        onChange={handleFileChange}
                    />
                    <button className="upload-button" onClick={uploadFiles}>Yuklash</button>
                    <div className="file-list">
                        {files.map((file, index) => (
                            <div key={index} className="file-item">
                                <FontAwesomeIcon icon={faFileExcel} size="2x" className="file-icon" />
                                <div className="file-name">{file.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="columns-section">
                    <div className="column">
                        <div className="search-section">
                            <input
                                type="text"
                                placeholder="Qidiruv..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="search-input"/>
                            <button className="search-button" onClick={handleSearch}>Qidiruv</button>
                            <div className="results-container">
                                <div className="search-results">
                                    {searchResults.length > 0 && (
                                        searchResults.map((result, index) => (
                                            <div key={index} className="result-item" onClick={() => handleSelect(result)}>
                                                {result.name} - {result.company} - {result.price}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  
                    <div className="column">
                        <h2>Savatcha</h2>
                        <div className="selected-table">
                            {basketItems.map((item, index) => (
                                <div key={index} className="selected-item" onClick={() => handleAddToInvoice(item)}>
                                    {item.name} - {item.company} - {item.price}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="column">
                        <h2>Fakturani yuklash</h2>
                        <div className="selected-table">
                            {invoiceItems.map((item, index) => (
                                <div key={index} className="selected-item" onClick={() => handleRemoveFromInvoice(item)}>
                                    {item.name} - {item.company} - {item.price}
                                </div>
                            ))}
                        </div>
                        <button className="ready-button" onClick={handleReady}>Tayyor</button>
                    </div>
                </div>
            </div>
            <footer className="footer">
                CraDev kompaniyasi tomonidan ishlab chiqarilgan | Barcha xizmatlar litsenziyalangan | 2024
            </footer>
        </div>
    );
}

export default App;
