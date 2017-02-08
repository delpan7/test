'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, languages } from 'vscode';

import { DOCUMENT_FILTER } from './document_filter';

import { Formatter, PHPDocumentRangeFormattingEditProvider} from './formatter';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    let formattingProvider: Disposable =
        languages.registerDocumentRangeFormattingEditProvider(DOCUMENT_FILTER, new PHPDocumentRangeFormattingEditProvider());
    // let wordCounter = new WordCounter();
    // let controller = new WordCounterController(wordCounter);
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('delpan.phpFormat', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        window.showInformationMessage('Hello World!');
        let formatter: Formatter = new Formatter();
        formatter.formatDocument();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(formattingProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
