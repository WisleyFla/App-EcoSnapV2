import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter caminhos do módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listFiles(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const isLast = index === files.length - 1;
    
    console.log(prefix + (isLast ? '└── ' : '├── ') + file);
    
    if (stats.isDirectory()) {
      listFiles(filePath, prefix + (isLast ? '    ' : '│   '));
    }
  });
}

// Começa da pasta src (ajuste conforme necessário)
const projectRoot = path.join(__dirname, 'src');
console.log('Estrutura do Projeto:');
listFiles(projectRoot);