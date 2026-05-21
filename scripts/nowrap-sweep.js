import fs from 'fs';
import path from 'path';

function removeWhitespaceNowrap(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/whitespace-nowrap/g, 'break-words text-wrap md:whitespace-nowrap');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Removed whitespace-nowrap in:', filePath);
  }
}

['./src/components/tabs/CouncilTab.tsx', './src/components/tabs/QawlFasl/QuestionDetailView.tsx', './src/components/tabs/LabTab.tsx'].forEach(removeWhitespaceNowrap);
