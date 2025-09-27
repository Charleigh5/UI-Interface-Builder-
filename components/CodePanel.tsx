import React, { useState, useMemo } from 'react';
import { WireframeComponent } from '../library/types';
import { generateReactCode, generateHTMLCode } from '../library/services/codeGenerator';
import { Icon } from './Icon';

interface CodePanelProps {
    components: WireframeComponent[];
}

type CodeType = 'react' | 'html';

export const CodePanel: React.FC<CodePanelProps> = ({ components }) => {
    const [codeType, setCodeType] = useState<CodeType>('react');
    const [copied, setCopied] = useState(false);

    const generatedCode = useMemo(() => {
        if (components.length === 0) {
            return `// Draw on the canvas to generate code.`;
        }
        switch (codeType) {
            case 'react':
                return generateReactCode(components);
            case 'html':
                return generateHTMLCode(components);
            default:
                return '';
        }
    }, [components, codeType]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Generated Code</h3>
                <select
                    value={codeType}
                    onChange={(e) => setCodeType(e.target.value as CodeType)}
                    className="text-sm border-slate-300 rounded-md shadow-sm py-1 px-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                    <option value="react">React</option>
                    <option value="html">HTML</option>
                </select>
            </div>
            <div className="relative">
                <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96 dark:bg-slate-900/50">
                    <code>{generatedCode}</code>
                </pre>
                <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                    {copied ? <Icon name="check" className="w-4 h-4 text-green-400" /> : <Icon name="copy" className="w-4 h-4 text-slate-300" />}
                </button>
            </div>
        </div>
    );
};