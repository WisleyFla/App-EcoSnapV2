import React, { useState } from 'react';
import Icon from '../../ui/Icons'; // Importa o componente de ícone

const DiaryForm = ({ onAddEntry }) => {
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [media, setMedia] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState('');

    const handleContentChange = (e) => {
        setContent(e.target.innerHTML);
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const fileNames = Array.from(e.target.files).map(file => file.name).join(', ');
            setSelectedFiles(`${e.target.files.length} arquivo(s) selecionado(s): ${fileNames}`);
            
            const mediaPromises = Array.from(e.target.files).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve({
                            url: event.target.result,
                            type: file.type,
                            name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(mediaPromises).then(mediaItems => {
                setMedia(mediaItems);
            });

        } else {
            setSelectedFiles('');
            setMedia([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() && media.length === 0) {
            alert('Por favor, escreva algo ou adicione mídias à sua anotação!');
            return;
        }
        onAddEntry({ content, date, media });
        setContent('');
        setMedia([]);
        setSelectedFiles('');
        document.getElementById('editorDeTexto').innerHTML = '';
        setDate(new Date().toISOString().slice(0, 10));
    };
    
    const formatDoc = (cmd, value = null) => {
        document.execCommand(cmd, false, value);
        document.getElementById('editorDeTexto').focus();
    }

    const addChecklist = () => {
        const checklistId = `task-${Date.now()}`;
        const checklistHtml = `<div class="item-tarefa" contenteditable="false"><input type="checkbox" id="${checklistId}"><label for="${checklistId}" contenteditable="true">Nova tarefa...</label></div>`;
        formatDoc('insertHTML', checklistHtml);
    }


    return (
        <div className="formulario-diario">
             <div className="barra-de-ferramentas">
                <button className="botao-barra-de-ferramentas" onClick={() => formatDoc('bold')}><b>B</b></button>
                <button className="botao-barra-de-ferramentas" onClick={() => formatDoc('italic')}><i>I</i></button>
                <button className="botao-barra-de-ferramentas" onClick={() => formatDoc('insertHTML', '&nbsp;<code contenteditable=\'false\'>CÓDIGO</code>&nbsp;')}><b>&lt;/&gt;</b></button>
                <button className="botao-barra-de-ferramentas" onClick={addChecklist}>
                    <Icon name="check" size={16} /> Tarefa
                </button>
            </div>

            <div 
                id="editorDeTexto"
                className="editor-de-texto" 
                contentEditable="true"
                onInput={handleContentChange}
            ></div>

            <span id="lista-arquivos-selecionados">{selectedFiles}</span>

            <div className="rodape-formulario">
                <div className="grupo-campos-esquerda">
                    <input 
                        type="date" 
                        className="campo-data" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <label htmlFor="uploadDeMidia" className="botao-midia-label">
                        <Icon name="upload" size={16} style={{ marginRight: '8px' }}/>
                        Adicionar Mídia
                    </label>
                    <input 
                        type="file" 
                        id="uploadDeMidia" 
                        accept="image/*,video/*" 
                        multiple 
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <div className="grupo-acoes-direita">
                    <button className="botao-enviar" onClick={handleSubmit}>
                       <Icon name="send" size={16} style={{ marginRight: '8px' }}/>
                       Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiaryForm;ssw
