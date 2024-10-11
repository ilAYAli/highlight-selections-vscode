import * as vscode from 'vscode';
import debounce from 'lodash.debounce';
import escapeStringRegexp from 'escape-string-regexp';

let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "highlight-selections-vscode" is now active!');

    let activeEditor = vscode.window.activeTextEditor;

    const updateDecorations = (editor: vscode.TextEditor | undefined) => {
        if (!editor) {
            return;
        }

        decorationTypes.forEach((decorationType, key) => {
            editor.setDecorations(decorationType, []);
        });

        const selectedText = editor.document.getText(editor.selection);
        if (selectedText.length === 0) {
            return;
        }

        const regex = new RegExp(escapeStringRegexp(selectedText), 'g');
        const text = editor.document.getText();
        let match;
        const decorations: vscode.DecorationOptions[] = [];

        while ((match = regex.exec(text))) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const decoration = {
                range: new vscode.Range(startPos, endPos),
            };
            decorations.push(decoration);
        }

        let decorationType = decorationTypes.get(selectedText);
        if (!decorationType) {
            decorationType = vscode.window.createTextEditorDecorationType({
                borderWidth: vscode.workspace.getConfiguration('highlightSelections').get('borderWidth', '2px'),
                borderStyle: vscode.workspace.getConfiguration('highlightSelections').get('borderStyle', 'solid'),
                overviewRulerColor: 'blue',
                overviewRulerLane: vscode.OverviewRulerLane.Right,
                light: {
                    borderColor: vscode.workspace.getConfiguration('highlightSelections').get('borderColor', 'darkblue'),
                },
                dark: {
                    borderColor: vscode.workspace.getConfiguration('highlightSelections').get('borderColor', 'lightblue'),
                },
            });
            decorationTypes.set(selectedText, decorationType);
        }
        editor.setDecorations(decorationType, decorations);
    };

    let debouncedUpdateDecorations = debounce((event: vscode.TextEditorSelectionChangeEvent) => {
        updateDecorations(event.textEditor);
    }, 10);

    let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    vscode.window.onDidChangeTextEditorSelection(debouncedUpdateDecorations);
    vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
        if (activeEditor && event.document === activeEditor.document) {
            debouncedUpdateDecorations({
                textEditor: activeEditor,
                selections: activeEditor.selections,
                kind: vscode.TextEditorSelectionChangeKind.Keyboard,
            });
        }
    });

    if (activeEditor) {
        updateDecorations(activeEditor);
    }

    context.subscriptions.push(disposable);
}

export function deactivate() {}