import React, { useState, useEffect } from 'react';
import DiaryForm from './DiaryForm';
import DiaryEntry from './DiaryEntry';
import { getDiaryEntries, addDiaryEntry, deleteDiaryEntry } from '../../../services/diaryService';
import './diary.css';

const DiaryPage = () => {
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        setEntries(getDiaryEntries());
    }, []);

    const handleAddEntry = (entry) => {
        const newEntry = addDiaryEntry(entry);
        setEntries([newEntry, ...entries]);
    };

    const handleDeleteEntry = (id) => {
        deleteDiaryEntry(id);
        setEntries(entries.filter(entry => entry.id !== id));
    };

    return (
        <main className="conteudo-principal">
            <h1 className="titulo-diario">Meu Diário</h1>
            <DiaryForm onAddEntry={handleAddEntry} />
            {entries.map(entry => (
                <DiaryEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
            ))}
        </main>
    );
};

export default DiaryPage;
