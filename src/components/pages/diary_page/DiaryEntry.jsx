import React from 'react';
import Icon from '../../ui/Icons'; // Importa o componente de ícone

const DiaryEntry = ({ entry, onDelete }) => {
    const { id, date, content, media } = entry;

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="entrada-diario">
            <div className="cabecalho-entrada">
                <div className="data-entrada">{formattedDate}</div>
                <div className="acoes-entrada">
                    {/* Adicionada a classe "delete" para o estilo de hover */}
                    <button className="botao-acao-entrada delete" title="Excluir" onClick={() => onDelete(id)}>
                        <Icon name="delete" size={18} />
                    </button>
                </div>
            </div>
            <div className="conteudo-entrada" dangerouslySetInnerHTML={{ __html: content }}></div>
            {media && media.length > 0 && (
                <div className="midia-entrada">
                    {media.map((item, index) => (
                        item.type.startsWith('image/') ?
                        <img key={index} src={item.url} alt={item.name} /> :
                        <video key={index} controls src={item.url} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DiaryEntry;sss
