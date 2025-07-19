// Mock data - in a real app, this would come from an API or localStorage
let entries = [
    {
        id: 1,
        date: '2025-07-18',
        content: 'Agora o botão de mídia e a data estão lado a lado, perfeitamente alinhados!',
        media: []
    }
];

let nextId = 2;

export const getDiaryEntries = () => {
    // In a real app, you might fetch this from localStorage or an API
    const storedEntries = localStorage.getItem('diaryEntries');
    if (storedEntries) {
        entries = JSON.parse(storedEntries);
        const maxId = entries.reduce((max, entry) => Math.max(max, entry.id), 0);
        nextId = maxId + 1;
    }
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addDiaryEntry = (entry) => {
    const newEntry = { ...entry, id: nextId++ };
    entries = [newEntry, ...entries];
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
    return newEntry;
};

export const deleteDiaryEntry = (id) => {
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
};
